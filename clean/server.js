const { createApp } = require('./app');
const { log } = require('./logger');
const { isProxyAuthEnabled } = require('./auth');
const accountsManager = require('./accounts');

const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT || 3000);

const app = createApp();

app.listen(PORT, HOST, () => {
  const accounts = accountsManager.getAll();
  const activeCount = accounts.filter(a => a.status === 'active').length;
  const cnCount = accounts.filter(a => a.backend === 'cn').length;
  const globalCount = accounts.filter(a => a.backend === 'global').length;
  
  log(`Qoder Proxy listening on http://${HOST}:${PORT}`);
  log('Accounts pool', {
    total: accounts.length,
    active: activeCount,
    cn: cnCount,
    global: globalCount,
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
