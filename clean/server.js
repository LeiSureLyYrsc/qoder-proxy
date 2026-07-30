const { createApp } = require('./app');
const { log } = require('./logger');
const { isProxyAuthEnabled } = require('./auth');
const { getCliBackend } = require('./qodercn-cli');
const accountsManager = require('./accounts');

const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT || 3000);

const app = createApp();

app.listen(PORT, HOST, () => {
  const backend = getCliBackend();
  const accounts = accountsManager.getAll();
  const activeCount = accounts.filter(a => a.status === 'active').length;
  
  log(`Qoder Proxy listening on http://${HOST}:${PORT}`);
  log('Accounts pool', {
    total: accounts.length,
    active: activeCount
  });
  log('security', {
    proxy_api_key: isProxyAuthEnabled() ? 'enabled' : 'not set',
    cross_origin: 'loopback origins only',
    server_tool_execution: /^(1|true|yes)$/i.test(process.env.SERVER_TOOL_EXECUTION || '')
      ? 'ENABLED'
      : 'off',
  });
  if (!isProxyAuthEnabled()) {
    log(
      'note: PROXY_API_KEY is not set, so any process on this machine can use the proxy. ' +
        'Set it in .env to require a key.'
    );
  }
});
