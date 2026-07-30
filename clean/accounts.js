const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(process.cwd(), 'data');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadAccounts() {
  ensureDataDir();
  if (!fs.existsSync(ACCOUNTS_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(ACCOUNTS_FILE, 'utf8');
    if (!data.trim()) return [];
    return JSON.parse(data) || [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    console.error('Error loading accounts:', error);
    return [];
  }
}

function saveAccounts(accounts) {
  ensureDataDir();
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), 'utf8');
}

/**
 * Account structure:
 * {
 *   id: string,
 *   name: string,
 *   token: string,
 *   backend: 'cn' | 'global',
 *   status: 'active' | 'exhausted' | 'rate_limited' | 'disabled',
 *   rateLimitUntil: number | null,
 *   errorCount: number,
 *   addedAt: number
 * }
 */

const accountsManager = {
  getAll() {
    return loadAccounts();
  },

  get(id) {
    const accounts = loadAccounts();
    return accounts.find(a => a.id === id);
  },

  add(accountData) {
    const accounts = loadAccounts();
    const newAccount = {
      id: crypto.randomUUID(),
      name: accountData.name || 'Unnamed Account',
      token: accountData.token,
      backend: accountData.backend || 'cn',
      status: 'active',
      rateLimitUntil: null,
      errorCount: 0,
      addedAt: Date.now(),
      ...accountData,
    };
    accounts.push(newAccount);
    saveAccounts(accounts);
    return newAccount;
  },

  update(id, updates) {
    const accounts = loadAccounts();
    const index = accounts.findIndex(a => a.id === id);
    if (index === -1) return null;
    
    accounts[index] = { ...accounts[index], ...updates };
    saveAccounts(accounts);
    return accounts[index];
  },

  remove(id) {
    let accounts = loadAccounts();
    const initialLength = accounts.length;
    accounts = accounts.filter(a => a.id !== id);
    if (accounts.length < initialLength) {
      saveAccounts(accounts);
      return true;
    }
    return false;
  },

  // State state for round-robin
  _currentIndex: 0,

  getNextAvailable(backend) {
    const accounts = loadAccounts();
    if (!accounts || accounts.length === 0) return null;

    const now = Date.now();
    
    // Auto-recover rate-limited accounts if time has passed
    let needsSave = false;
    for (let acc of accounts) {
      if (acc.status === 'rate_limited' && acc.rateLimitUntil && now > acc.rateLimitUntil) {
        acc.status = 'active';
        acc.rateLimitUntil = null;
        needsSave = true;
      }
    }
    if (needsSave) saveAccounts(accounts);

    // Filter available accounts for the requested backend
    const available = accounts.filter(a => 
      a.backend === backend && 
      a.status === 'active'
    );

    if (available.length === 0) return null;

    // Round-robin selection
    this._currentIndex = (this._currentIndex + 1) % available.length;
    return available[this._currentIndex];
  },

  // Helper to mark account status during errors
  reportError(id, type) {
    const accounts = loadAccounts();
    const index = accounts.findIndex(a => a.id === id);
    if (index === -1) return null;

    const acc = accounts[index];
    acc.errorCount = (acc.errorCount || 0) + 1;

    if (type === 'rate_limit') {
      acc.status = 'rate_limited';
      acc.rateLimitUntil = Date.now() + 60000; // Freeze for 1 minute
    } else if (type === 'quota_exhausted') {
      acc.status = 'exhausted';
    } else if (type === 'auth_error') {
      acc.status = 'disabled'; // Invalid token
    }

    saveAccounts(accounts);
    return acc;
  }
};

module.exports = accountsManager;