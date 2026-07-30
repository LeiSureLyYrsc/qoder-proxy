const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

const HOMES_DIR = path.join(process.cwd(), 'data', 'homes');
const sessions = new Map();

function ensureHomesDir() {
  if (!fs.existsSync(HOMES_DIR)) {
    fs.mkdirSync(HOMES_DIR, { recursive: true });
  }
}

// Extract URL matching https://qoder.com/device/selectAccounts...
function extractLoginUrl(text) {
  const match = text.match(/https:\/\/qoder\.com\/device\/selectAccounts\S+/);
  return match ? match[0] : null;
}

function startLoginSession() {
  ensureHomesDir();
  const sessionId = crypto.randomUUID();
  const homeDir = path.join(HOMES_DIR, `global-${sessionId}`);
  fs.mkdirSync(homeDir, { recursive: true });

  const session = {
    id: sessionId,
    homeDir: homeDir,
    status: 'initializing', // initializing, waiting_for_user, success, error
    loginUrl: null,
    error: null,
    createdAt: Date.now()
  };

  sessions.set(sessionId, session);

  // Setup environment with isolated HOME
  const env = { ...process.env, HOME: homeDir, USERPROFILE: homeDir };
  const cliPath = path.join(process.cwd(), 'node_modules', '@qoder-ai', 'qodercli', 'bundle', 'qodercli.js');
  
  // Since we know the qodercli structure, run it directly with node to avoid wrapper issues
  const child = spawn(process.execPath, [cliPath, 'login'], { env, windowsHide: true });
  
  session.childProcess = child;

  let outputBuffer = '';

  child.stdout.on('data', (data) => {
    const text = data.toString();
    outputBuffer += text;
    
    if (session.status === 'initializing') {
      const url = extractLoginUrl(outputBuffer);
      if (url) {
        session.loginUrl = url;
        session.status = 'waiting_for_user';
      }
    }
  });

  child.stderr.on('data', (data) => {
    // Some prompts might be written to stderr
    const text = data.toString();
    outputBuffer += text;
    
    if (session.status === 'initializing') {
      const url = extractLoginUrl(outputBuffer);
      if (url) {
        session.loginUrl = url;
        session.status = 'waiting_for_user';
      }
    }
  });

  child.on('close', (code) => {
    if (code === 0) {
      session.status = 'success';
    } else {
      session.status = 'error';
      session.error = `qodercli exited with code ${code}`;
    }
    delete session.childProcess;
  });

  child.on('error', (err) => {
    session.status = 'error';
    session.error = `Failed to start qodercli: ${err.message}`;
    delete session.childProcess;
  });

  // Cleanup old sessions periodically (just in case they hang)
  cleanupOldSessions();

  return sessionId;
}

function getSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  return {
    id: session.id,
    status: session.status,
    loginUrl: session.loginUrl,
    error: session.error,
    homeDir: session.homeDir // Included for finish step
  };
}

function cleanupOldSessions() {
  const now = Date.now();
  const maxAge = 15 * 60 * 1000; // 15 mins
  for (const [id, session] of sessions.entries()) {
    if (now - session.createdAt > maxAge) {
      if (session.childProcess) {
        try { session.childProcess.kill(); } catch (e) {}
      }
      sessions.delete(id);
    }
  }
}

function finishSession(sessionId) {
  const session = sessions.get(sessionId);
  if (session && session.status === 'success') {
    sessions.delete(sessionId);
    return session.homeDir;
  }
  return null;
}

function cancelSession(sessionId) {
  const session = sessions.get(sessionId);
  if (session) {
    if (session.childProcess) {
      try { session.childProcess.kill(); } catch (e) {}
    }
    // Delete the directory if incomplete
    if (session.status !== 'success' && fs.existsSync(session.homeDir)) {
      try { fs.rmSync(session.homeDir, { recursive: true, force: true }); } catch (e) {}
    }
    sessions.delete(sessionId);
  }
}

module.exports = {
  startLoginSession,
  getSession,
  finishSession,
  cancelSession
};