const fs = require('fs');
const os = require('os');
const path = require('path');

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qoder-proxy-test-data-'));

process.env.QODER_DATA_DIR = dataDir;
fs.writeFileSync(
  path.join(dataDir, 'accounts.json'),
  JSON.stringify([
    {
      id: 'test-cn-account',
      name: 'Test CN Account',
      token: 'test-token',
      backend: 'cn',
      isNonPro: false,
      allowSharedModels: true,
      status: 'active',
      rateLimitUntil: null,
      errorCount: 0,
      addedAt: Date.now(),
    },
  ])
);
