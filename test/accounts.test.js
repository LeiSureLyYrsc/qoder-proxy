const test = require('node:test');
const assert = require('node:assert/strict');
const { isAvailableForModel } = require('../clean/accounts');

test('model routing accepts only accounts for supported CLIs', () => {
  const cn = { backend: 'cn', status: 'active' };
  const global = { backend: 'global', status: 'active' };

  assert.equal(isAvailableForModel(global, 'ultimate', ['global']), true);
  assert.equal(isAvailableForModel(cn, 'ultimate', ['global']), false);
  assert.equal(isAvailableForModel(cn, 'qoder-cn', ['cn']), true);
});

test('Non-Pro Global accounts are restricted to Ultimate', () => {
  const nonPro = { backend: 'global', status: 'active', isNonPro: true };

  assert.equal(isAvailableForModel(nonPro, 'ultimate', ['global']), true);
  assert.equal(isAvailableForModel(nonPro, 'performance', ['global']), false);
  assert.equal(isAvailableForModel(nonPro, 'auto', ['cn', 'global']), false);
});

test('Non-Pro marking does not restrict CN accounts', () => {
  const cn = { backend: 'cn', status: 'active', isNonPro: true };
  assert.equal(isAvailableForModel(cn, 'qoder-cn', ['cn']), true);
});

test('Global Pro accounts can opt out of CN/Global shared models', () => {
  const global = {
    backend: 'global',
    status: 'active',
    isNonPro: false,
    allowSharedModels: false,
  };

  assert.equal(isAvailableForModel(global, 'performance', ['global']), true);
  assert.equal(isAvailableForModel(global, 'qwen3.7-max', ['cn', 'global']), false);
});

test('existing Global accounts default to shared models enabled', () => {
  const global = { backend: 'global', status: 'active', isNonPro: false };
  assert.equal(isAvailableForModel(global, 'qwen3.7-max', ['cn', 'global']), true);
});

test('Non-Pro restriction takes precedence over shared-model setting', () => {
  const nonPro = {
    backend: 'global',
    status: 'active',
    isNonPro: true,
    allowSharedModels: true,
  };

  assert.equal(isAvailableForModel(nonPro, 'ultimate', ['global']), true);
  assert.equal(isAvailableForModel(nonPro, 'qwen3.7-max', ['cn', 'global']), false);
});
