'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// Qoder Proxy — Web Console App
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Theme ─────────────────────────────────────────────────────────────────────

let currentTheme = 'dark';

function initTheme() {
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  currentTheme = prefersDark ? 'dark' : 'light';
  applyTheme();
}

function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme();
}

function applyTheme() {
  document.body.classList.remove('dark', 'light');
  document.body.classList.add(currentTheme);
  var icon = document.getElementById('theme-icon');
  if (icon) {
    icon.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
  }
}

// ─── Sidebar ───────────────────────────────────────────────────────────────────

function initSidebar() {
  var toggleBtn = document.getElementById('sidebar-toggle');
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebar-overlay');

  if (!toggleBtn || !sidebar) return;

  function openSidebar() {
    sidebar.classList.add('open');
    if (overlay) overlay.classList.add('open');
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
  }

  toggleBtn.addEventListener('click', function () {
    if (sidebar.classList.contains('open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });

  if (overlay) {
    overlay.addEventListener('click', closeSidebar);
  }
}

// ─── Tab Switching ─────────────────────────────────────────────────────────────

function initTabs() {
  var navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(function (item) {
    item.addEventListener('click', function () {
      switchTab(item.dataset.tab);
    });
  });
}

function switchTab(tab) {
  // Update nav
  document.querySelectorAll('.nav-item').forEach(function (b) {
    b.classList.toggle('active', b.dataset.tab === tab);
  });

  // Update content
  document.querySelectorAll('.tab-content').forEach(function (c) {
    c.classList.toggle('active', c.id === tab);
  });

  // Close mobile sidebar
  var sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.remove('open');
  var overlay = document.getElementById('sidebar-overlay');
  if (overlay) overlay.classList.remove('open');

    // Load data
    if (tab === 'dashboard') loadDashboard();
    if (tab === 'models') loadModels();
    if (tab === 'accounts') loadAccounts();
    if (tab === 'usage') loadUsage();
}

// ─── API helpers ───────────────────────────────────────────────────────────────

// The console is a browser client like any other, so when PROXY_API_KEY is set
// it must present the key too. Kept in localStorage so it survives reloads.
var API_KEY_STORAGE = 'qoder-proxy-api-key';

function getApiKey() {
  try {
    return window.localStorage.getItem(API_KEY_STORAGE) || '';
  } catch (_) {
    return '';
  }
}

function setApiKey(value) {
  try {
    if (value) {
      window.localStorage.setItem(API_KEY_STORAGE, value);
    } else {
      window.localStorage.removeItem(API_KEY_STORAGE);
    }
  } catch (_) {
    // Private browsing modes can refuse storage; the key just won't persist.
  }
}

function api(path, options) {
  var opts = options || {};
  var headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
  var key = getApiKey();
  if (key) {
    headers['Authorization'] = 'Bearer ' + key;
  }

  return fetch(path, Object.assign({}, opts, { headers: headers })).then(function (res) {
    if (!res.ok) {
      return res
        .json()
        .catch(function () {
          return {};
        })
        .then(function (body) {
          var message = (body.error && body.error.message) || 'Request failed: ' + res.status;
          if (res.status === 401) {
            message = 'Unauthorized. Set the proxy API key in the Config tab.';
          }
          throw new Error(message);
        });
    }
    return res.json();
  });
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

  function loadDashboard() {
    var container = document.getElementById('dashboard-content');
    if (!container || container.dataset.loaded === '1') return;
    container.innerHTML = '<div class="loading">Loading...</div>';
  
    var pAccounts = api('/api/accounts').catch(function() { return []; });

    Promise.all([api('/'), api('/health'), api('/v1/models'), pAccounts])
      .then(function (data) {
        var info = data[0];
        var models = data[2];
        var accounts = data[3] || [];
        var modelCount = models.data ? models.data.length : 0;
        
        var activeAccounts = accounts.filter(function(a) { return a.status === 'active' }).length;
        var rateLimitedAccounts = accounts.filter(function(a) { return a.status === 'rate_limited' }).length;
        var cnAccounts = accounts.filter(function(a) { return a.backend === 'cn' }).length;
        var globalAccounts = accounts.filter(function(a) { return a.backend === 'global' }).length;
        var totalAccounts = accounts.length;
  
        container.innerHTML =
          '<div class="stat-grid">' +
            '<div class="glass stat-item">' +
              '<div class="stat-label">Status</div>' +
              '<div class="stat-value success"><span class="status-dot green"></span>Running</div>' +
            '</div>' +
            '<div class="glass stat-item">' +
              '<div class="stat-label">Account Channels</div>' +
              '<div class="stat-value">CN ' + cnAccounts + ' / Global ' + globalAccounts + '</div>' +
            '</div>' +
            '<div class="glass stat-item">' +
              '<div class="stat-label">Models</div>' +
              '<div class="stat-value">' + modelCount + '</div>' +
            '</div>' +
            '<div class="glass stat-item">' +
              '<div class="stat-label">Active / Total Accounts</div>' +
              '<div class="stat-value">' + activeAccounts + ' / ' + totalAccounts + 
              (rateLimitedAccounts > 0 ? ' <span style="font-size:0.8em;color:#f59e0b">(' + rateLimitedAccounts + ' rate limited)</span>' : '') +
              '</div>' +
            '</div>' +
            '<div class="glass stat-item">' +
              '<div class="stat-label">Base URL</div>' +
              '<div class="stat-value muted">127.0.0.1:3000</div>' +
            '</div>' +
          '</div>';
  
        container.dataset.loaded = '1';
      })
      .catch(function (err) {
        container.innerHTML = '<div class="alert error">' + err.message + '</div>';
      });
  }

// ─── Models ────────────────────────────────────────────────────────────────────

function loadModels() {
  var container = document.getElementById('models-content');
  if (!container || container.dataset.loaded === '1') return;
  container.innerHTML = '<div class="loading">Loading...</div>';

  api('/v1/models')
    .then(function (data) {
      if (!data.data || data.data.length === 0) {
        container.innerHTML = '<div class="alert info">No models found.</div>';
        return;
      }

      var rows = data.data.map(function (m) {
        var reasoning = m.capabilities && m.capabilities.reasoning ? '<span style="color:var(--success)">&#9679;</span>' : '';
        var badge = m.effort_alias ? ' <span style="font-size:0.7rem;color:var(--text-secondary)">(effort alias)</span>' : '';
        return (
          '<tr>' +
            '<td><code>' + escapeHtml(m.id) + '</code></td>' +
            '<td>' + escapeHtml(m.name || '') + badge + '</td>' +
            '<td>' + reasoning + '</td>' +
          '</tr>'
        );
      }).join('');

      container.innerHTML =
        '<div class="glass card" style="padding:0;overflow:hidden;">' +
          '<table>' +
            '<thead><tr><th style="padding:0.75rem 1rem">ID</th><th style="padding:0.75rem 1rem">Name</th><th style="padding:0.75rem 1rem">Reasoning</th></tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
          '</table>' +
        '</div>';
      container.dataset.loaded = '1';
    })
    .catch(function (err) {
      container.innerHTML =
        '<div class="alert error">Failed to load models: ' + escapeHtml(err.message) + '</div>';
    });
}

// ─── Chat Test ─────────────────────────────────────────────────────────────────

var chatMessages = [];
var isChatSending = false;

function addChatMessage(role, text, html) {
  var messagesEl = document.getElementById('chat-messages');
  if (!messagesEl) return;
  if (chatMessages.length === 0) {
    messagesEl.innerHTML = '';
  }
  var msgDiv = document.createElement('div');
  msgDiv.className = 'chat-msg ' + role;
  var avatar = role === 'user' ? '&#128100;' : '&#129302;';
  var content = html || escapeHtml(text);
  msgDiv.innerHTML =
    '<div class="chat-msg-avatar">' + avatar + '</div>' +
    '<div class="chat-msg-body">' + content + '</div>';
  messagesEl.appendChild(msgDiv);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  chatMessages.push({ role: role, text: text });
}

function setChatLoading(loading) {
  var messagesEl = document.getElementById('chat-messages');
  if (!messagesEl) return;
  if (loading) {
    var div = document.createElement('div');
    div.className = 'chat-msg assistant';
    div.id = 'chat-loading';
    div.innerHTML =
      '<div class="chat-msg-avatar">&#129302;</div>' +
      '<div class="chat-msg-body"><span style="opacity:0.6">Thinking...</span></div>';
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  } else {
    var loadingEl = document.getElementById('chat-loading');
    if (loadingEl) loadingEl.remove();
  }
}

function initChat() {
  var sendBtn = document.getElementById('chat-send');
  var textarea = document.getElementById('chat-message');
  var modelSelect = document.getElementById('chat-model');

  if (!sendBtn || !textarea) return;

  // Populate model dropdown
  api('/v1/models')
    .then(function (data) {
      if (!data.data || !modelSelect) return;
      data.data.forEach(function (m) {
        var opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.id + ' (' + (m.name || '') + ')';
        modelSelect.appendChild(opt);
      });
    })
    .catch(function () {});

  // Send on button click
  sendBtn.addEventListener('click', function () {
    doChat();
  });

  // Send on Enter (Shift+Enter for newline)
  textarea.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      doChat();
    }
  });
}

function doChat() {
  var textarea = document.getElementById('chat-message');
  var modelSelect = document.getElementById('chat-model');
  var sendBtn = document.getElementById('chat-send');

  if (!textarea || !modelSelect) return;
  var message = textarea.value.trim();
  if (!message) return;
  if (isChatSending) return;

  isChatSending = true;
  sendBtn.disabled = true;
  sendBtn.innerHTML = '<span class="send-icon">&#9670;</span>';

  // Show user message
  addChatMessage('user', message);

  // Clear textarea
  textarea.value = '';

  // Show loading
  setChatLoading(true);

  api('/v1/chat/completions', {
    method: 'POST',
    body: JSON.stringify({
      model: modelSelect.value,
      messages: [{ role: 'user', content: message }],
    }),
  })
    .then(function (data) {
      setChatLoading(false);
      var content = (data.choices && data.choices[0] && data.choices[0].message)
        ? data.choices[0].message.content
        : 'No response content';
      addChatMessage('assistant', content);
    })
    .catch(function (err) {
      setChatLoading(false);
      addChatMessage('assistant', 'Error: ' + err.message);
    })
    .finally(function () {
      sendBtn.disabled = false;
      sendBtn.innerHTML = '<span class="send-icon">&#8594;</span>';
      isChatSending = false;
    });
}

// ─── Config ────────────────────────────────────────────────────────────────────

function initApiKey() {
  var input = document.getElementById('api-key-input');
  var saveBtn = document.getElementById('api-key-save');
  var status = document.getElementById('api-key-status');
  if (!input || !saveBtn) return;

  input.value = getApiKey();

  function showStatus(text, kind) {
    if (!status) return;
    status.textContent = text;
    status.className = 'api-key-status ' + (kind || '');
  }

  if (getApiKey()) {
    showStatus('A key is saved in this browser.', 'ok');
  }

  saveBtn.addEventListener('click', function () {
    var value = input.value.trim();
    setApiKey(value);
    showStatus(
      value ? 'Key saved. Reloading console data…' : 'Key cleared.',
      value ? 'ok' : ''
    );
    // Re-fetch every tab with the new credential.
    ['dashboard-content', 'models-content', 'usage-content'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.dataset.loaded = '0';
    });
    loadDashboard();
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveBtn.click();
    }
  });
}

function initConfig() {
  document.querySelectorAll('.btn.copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = document.getElementById(btn.dataset.target);
      if (!target) return;
      var text = target.textContent;
      navigator.clipboard.writeText(text).then(function () {
        var original = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(function () { btn.textContent = original; }, 1500);
      }).catch(function () {
        btn.textContent = 'Failed';
        setTimeout(function () { btn.textContent = 'Copy'; }, 1500);
      });
    });
  });
}

  // ─── Accounts Management ────────────────────────────────────────────────────────

  function loadAccounts() {
    var container = document.getElementById('accounts-list');
    if (!container) return;
    container.innerHTML = '<div class="loading">Loading accounts...</div>';

    api('/api/accounts')
      .then(function (accounts) {
        if (!accounts || accounts.length === 0) {
          container.innerHTML = '<div class="alert info">No accounts found. Add one above.</div>';
          return;
        }

        var rows = accounts.map(function(acc) {
          var statusClass = 'status-' + acc.status;
          var statusText = acc.status;
          if (acc.status === 'rate_limited' && acc.rateLimitUntil) {
            var msLeft = Math.max(0, acc.rateLimitUntil - Date.now());
            if (msLeft > 0) {
              statusText += ' (' + Math.ceil(msLeft/1000) + 's)';
            }
          }
          var toggleAction = acc.status === 'disabled' 
            ? '<button class="btn primary" onclick="toggleAccount(\'' + acc.id + '\', \'active\')">Enable</button>'
            : '<button class="btn secondary" onclick="toggleAccount(\'' + acc.id + '\', \'disabled\')">Disable</button>';
          var tierAction = acc.backend === 'global'
            ? '<button class="btn secondary" onclick="toggleNonPro(\'' + acc.id + '\', ' + (!acc.isNonPro) + ')">' +
                (acc.isNonPro ? 'Mark Pro' : 'Mark Non-Pro') +
              '</button>'
            : '';
          var allowsSharedModels = acc.allowSharedModels !== false;
          var sharedModelsAction = acc.backend === 'global'
            ? '<button class="btn secondary" onclick="toggleSharedModels(\'' + acc.id + '\', ' + (!allowsSharedModels) + ')">' +
                (allowsSharedModels ? 'Disable Shared' : 'Enable Shared') +
              '</button>'
            : '';
            
            var tokenDisplay = acc.backend === 'global' ? '(OAuth Profile)' : escapeHtml(acc.token);
            var accountType = acc.backend === 'global'
              ? (acc.isNonPro ? 'Global Non-Pro' : 'Global Pro') +
                (allowsSharedModels ? ' / Shared On' : ' / Shared Off')
              : 'CN Access Token';

            return '<tr>' +
              '<td>' + escapeHtml(acc.name || acc.id) + '</td>' +
              '<td>' + accountType + '</td>' +
              '<td>' + tokenDisplay + '</td>' +
              '<td><span class="status-badge ' + statusClass + '">' + statusText + '</span></td>' +
              '<td class="acc-actions">' +
                 toggleAction +
                 tierAction +
                 sharedModelsAction +
                 '<button class="btn danger" onclick="deleteAccount(\'' + acc.id + '\')">Delete</button>' +
              '</td>' +
          '</tr>';
        }).join('');

        container.innerHTML = 
          '<div class="table-responsive" style="overflow-x:auto;">' +
            '<table class="account-table">' +
              '<thead><tr><th>Name</th><th>Account Type</th><th>Credential</th><th>Status</th><th>Actions</th></tr></thead>' +
              '<tbody>' + rows + '</tbody>' +
            '</table>' +
          '</div>';
      })
      .catch(function(err) {
        container.innerHTML = '<div class="alert error">' + err.message + '</div>';
      });
  }

  window.toggleAccount = function(id, status) {
    api('/api/accounts/' + id, {
      method: 'PUT',
      body: JSON.stringify({ status: status })
    })
    .then(loadAccounts)
    .then(function() {
       var dEl = document.getElementById('dashboard-content');
       if(dEl) dEl.dataset.loaded = '0';
    })
    .catch(function(err) {
      alert('Failed to update account: ' + err.message);
    });
  };

  window.toggleNonPro = function(id, isNonPro) {
    api('/api/accounts/' + id, {
      method: 'PUT',
      body: JSON.stringify({ isNonPro: isNonPro })
    }).then(loadAccounts).catch(function(err) {
      alert('Failed to update account tier: ' + err.message);
    });
  };

  window.toggleSharedModels = function(id, allowSharedModels) {
    api('/api/accounts/' + id, {
      method: 'PUT',
      body: JSON.stringify({ allowSharedModels: allowSharedModels })
    }).then(loadAccounts).catch(function(err) {
      alert('Failed to update shared model access: ' + err.message);
    });
  };

  window.deleteAccount = function(id) {
    if (!confirm('Are you sure you want to delete this account?')) return;
    api('/api/accounts/' + id, { method: 'DELETE' })
    .then(loadAccounts)
    .then(function() {
       var dEl = document.getElementById('dashboard-content');
       if(dEl) dEl.dataset.loaded = '0';
    })
    .catch(function(err) {
      alert('Failed to delete account: ' + err.message);
    });
  };

  function setupAccountsForm() {
    var btn = document.getElementById('acc-add-btn');
    var refreshBtn = document.getElementById('acc-refresh');
    var backendSelect = document.getElementById('acc-backend');
    var tokenGroup = document.getElementById('acc-token-group');
    var oauthGroup = document.getElementById('acc-oauth-group');
    var oauthStatus = document.getElementById('acc-oauth-status');
    var nonProGroup = document.getElementById('acc-non-pro-group');
    var nonProInput = document.getElementById('acc-non-pro');
    var sharedModelsGroup = document.getElementById('acc-shared-models-group');
    var sharedModelsInput = document.getElementById('acc-shared-models');

    var currentOauthPoll = null;
    var currentOauthSessionId = null;

    if (backendSelect) {
       backendSelect.addEventListener('change', function() {
          if (this.value === 'global') {
             tokenGroup.style.display = 'none';
             oauthGroup.style.display = 'block';
             nonProGroup.style.display = 'flex';
             sharedModelsGroup.style.display = 'flex';
             btn.textContent = 'Start OAuth Login';
             btn.classList.remove('primary');
             btn.classList.add('warning'); // just a visual cue
             oauthStatus.style.display = 'none';
          } else {
             tokenGroup.style.display = 'flex';
             oauthGroup.style.display = 'none';
             nonProGroup.style.display = 'none';
             nonProInput.checked = false;
             sharedModelsGroup.style.display = 'none';
             sharedModelsInput.checked = true;
             btn.textContent = 'Add Account';
             btn.classList.remove('warning');
             btn.classList.add('primary');
             oauthStatus.style.display = 'none';
          }
       });
    }

    function cleanupOauth() {
       if (currentOauthPoll) clearInterval(currentOauthPoll);
       currentOauthPoll = null;
       currentOauthSessionId = null;
       btn.disabled = false;
       btn.textContent = 'Start OAuth Login';
       oauthStatus.style.display = 'none';
    }

    if (btn) {
      btn.addEventListener('click', function() {
        var nameInput = document.getElementById('acc-name');
        var backendInput = document.getElementById('acc-backend');
        var tokenInput = document.getElementById('acc-token');
        var name = nameInput.value.trim();
        var backend = backendInput.value;
        
        if (backend === 'global') {
           // --- Global OAuth Flow ---
           if (currentOauthSessionId) {
              // Cancel existing
              api('/api/accounts/oauth/cancel', {
                 method: 'POST', body: JSON.stringify({ sessionId: currentOauthSessionId })
              }).catch(function(){});
              cleanupOauth();
              return;
           }

           btn.disabled = true;
           btn.textContent = 'Starting...';
           oauthStatus.style.display = 'block';
           oauthStatus.className = 'alert info';
           oauthStatus.innerHTML = 'Starting login session...';

           api('/api/accounts/oauth/start', { method: 'POST' })
             .then(function(res) {
                currentOauthSessionId = res.sessionId;
                btn.disabled = false;
                btn.textContent = 'Cancel Login';
                btn.classList.add('danger');

                currentOauthPoll = setInterval(function() {
                   api('/api/accounts/oauth/status/' + currentOauthSessionId)
                     .then(function(statusRes) {
                        if (statusRes.status === 'waiting_for_user' && statusRes.loginUrl) {
                           oauthStatus.innerHTML = '<strong>Action Required:</strong> Please open <a href="' + statusRes.loginUrl + '" target="_blank" style="color:var(--accent);text-decoration:underline;">this link</a> in your browser to sign in.';
                        } else if (statusRes.status === 'success') {
                           clearInterval(currentOauthPoll);
                           oauthStatus.innerHTML = 'Login successful! Finalizing...';
                           
                           api('/api/accounts/oauth/finish', {
                              method: 'POST',
                              body: JSON.stringify({
                                sessionId: currentOauthSessionId,
                                name: name,
                                isNonPro: nonProInput.checked,
                                allowSharedModels: sharedModelsInput.checked
                              })
                           })
                           .then(function() {
                              cleanupOauth();
                              nameInput.value = '';
                              loadAccounts();
                              var dEl = document.getElementById('dashboard-content');
                              if(dEl) dEl.dataset.loaded = '0';
                           })
                           .catch(function(err) {
                              oauthStatus.className = 'alert error';
                              oauthStatus.innerHTML = 'Failed to save account: ' + err.message;
                              cleanupOauth();
                           });
                        } else if (statusRes.status === 'error') {
                           clearInterval(currentOauthPoll);
                           oauthStatus.className = 'alert error';
                           oauthStatus.innerHTML = 'Login failed: ' + (statusRes.error || 'Unknown error');
                           setTimeout(cleanupOauth, 3000);
                        }
                     })
                     .catch(function(err) {
                        // Polling error
                        clearInterval(currentOauthPoll);
                        oauthStatus.className = 'alert error';
                        oauthStatus.innerHTML = 'Connection error: ' + err.message;
                        setTimeout(cleanupOauth, 3000);
                     });
                }, 2000);
             })
             .catch(function(err) {
                oauthStatus.className = 'alert error';
                oauthStatus.innerHTML = 'Failed to start: ' + err.message;
                cleanupOauth();
             });

        } else {
           // --- CN PAT Flow (Existing) ---
           var token = tokenInput.value.trim();
           if (!token) {
             alert('Token is required.');
             return;
           }
   
           btn.disabled = true;
           btn.textContent = 'Adding...';
   
           api('/api/accounts', {
             method: 'POST',
             body: JSON.stringify({ name: name, backend: backend, token: token })
           })
           .then(function() {
             nameInput.value = '';
             tokenInput.value = '';
             loadAccounts();
             var dEl = document.getElementById('dashboard-content');
             if(dEl) dEl.dataset.loaded = '0';
           })
           .catch(function(err) {
             alert('Failed to add account: ' + err.message);
           })
           .finally(function() {
             btn.disabled = false;
             btn.textContent = 'Add Account';
           });
        }
      });
    }
    if (refreshBtn) {
      refreshBtn.addEventListener('click', loadAccounts);
    }
  }

  // ─── Usage / Credits ─────────────────────────────────────────────────────────

function loadUsage() {
  var container = document.getElementById('usage-content');
  if (!container || container.dataset.loaded === '1') return;
  container.innerHTML = '<div class="loading">Loading...</div>';

  api('/usage/local')
    .then(function (data) {
      var modelRows = '';
      if (data.requestsByModel && Object.keys(data.requestsByModel).length > 0) {
        var rows = Object.keys(data.requestsByModel).map(function (model) {
          return (
            '<tr>' +
              '<td><code>' + escapeHtml(model) + '</code></td>' +
              '<td>' + data.requestsByModel[model] + '</td>' +
            '</tr>'
          );
        }).join('');
        modelRows =
          '<div class="glass card" style="padding:0;overflow:hidden;">' +
            '<table>' +
              '<thead><tr><th style="padding:0.75rem 1rem">Model</th><th style="padding:0.75rem 1rem">Requests</th></tr></thead>' +
              '<tbody>' + rows + '</tbody>' +
            '</table>' +
          '</div>';
      }

      var lastReq = data.lastRequestAt
        ? new Date(data.lastRequestAt).toLocaleString()
        : 'Never';

      container.innerHTML =
        '<div class="alert warning">These are <strong>local estimates only</strong>. They do not represent official Qoder billing or remaining quota.</div>' +

        '<div class="stat-grid">' +
          '<div class="glass stat-item">' +
            '<div class="stat-label">Total Requests</div>' +
            '<div class="stat-value">' + data.totalRequests + '</div>' +
          '</div>' +
          '<div class="glass stat-item">' +
            '<div class="stat-label">Today</div>' +
            '<div class="stat-value">' + data.requestsToday + '</div>' +
          '</div>' +
          '<div class="glass stat-item">' +
            '<div class="stat-label">Errors</div>' +
            '<div class="stat-value ' + (data.errorCount > 0 ? 'error' : '') + '">' + data.errorCount + '</div>' +
          '</div>' +
          '<div class="glass stat-item">' +
            '<div class="stat-label">Est. Input Tokens</div>' +
            '<div class="stat-value">' + data.estimatedInputTokens.toLocaleString() + '</div>' +
          '</div>' +
          '<div class="glass stat-item">' +
            '<div class="stat-label">Est. Output Tokens</div>' +
            '<div class="stat-value">' + data.estimatedOutputTokens.toLocaleString() + '</div>' +
          '</div>' +
          '<div class="glass stat-item">' +
            '<div class="stat-label">Est. Total Tokens</div>' +
            '<div class="stat-value">' + data.estimatedTotalTokens.toLocaleString() + '</div>' +
          '</div>' +
        '</div>' +

        '<div class="glass card">' +
          '<h3 style="font-size:0.8125rem;color:var(--text-secondary);margin-bottom:0.75rem">Session Info</h3>' +
          '<table>' +
            '<tbody>' +
              '<tr><td>Started</td><td>' + new Date(data.startedAt).toLocaleString() + '</td></tr>' +
              '<tr><td>Last Request</td><td>' + lastReq + '</td></tr>' +
            '</tbody>' +
          '</table>' +
        '</div>' +

        modelRows +

        '<button class="btn danger" id="reset-usage-btn">Reset Local Stats</button>';
      container.dataset.loaded = '1';

      document.getElementById('reset-usage-btn').addEventListener('click', resetUsage);
    })
    .catch(function (err) {
      container.innerHTML =
        '<div class="alert error">Failed to load usage: ' + escapeHtml(err.message) + '</div>';
    });
}

function resetUsage() {
  if (!confirm('Reset all local usage statistics? This cannot be undone.')) return;

  api('/usage/reset-local', { method: 'POST' })
    .then(function () {
      document.getElementById('usage-content').dataset.loaded = '0';
      loadUsage();
    })
    .catch(function (err) {
      alert('Failed to reset: ' + err.message);
    });
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

function escapeHtml(text) {
  if (!text) return '';
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

// ─── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function () {
  initTheme();
  initSidebar();
  initTabs();
  initChat();
  initConfig();
  initApiKey();
  setupAccountsForm();

  // Theme toggle
  var themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  }

  // Load initial tab
  loadDashboard();
});
