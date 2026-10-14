const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { download } = require('../src/mac-updater');

// Fake fetch: a body of `chunks` chunks of 1000 bytes.
function fakeFetch(chunks) {
  return async () => {
    let i = 0;
    return {
      ok: true, status: 200,
      headers: { get: (h) => (h === 'content-length' ? String(chunks * 1000) : null) },
      body: { getReader: () => ({
        read: async () => (i++ < chunks ? { done: false, value: new Uint8Array(1000) } : { done: true }),
        cancel: async () => {},
      }) },
    };
  };
}

test('download reports bytes and total', async () => {
  const dest = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'mc-')), 'f');
  const seen = [];
  await download(fakeFetch(3), 'x', dest, null, (p) => seen.push(p));
  assert.deepStrictEqual(seen.map(p => p.transferred), [1000, 2000, 3000]);
  assert.strictEqual(seen[2].total, 3000);
  assert.strictEqual(fs.statSync(dest).size, 3000);
});

test('download stops when cancelled', async () => {
  const dest = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'mc-')), 'f');
  const ctrl = new AbortController();
  await assert.rejects(
    download(fakeFetch(10), 'x', dest, null, (p) => { if (p.transferred >= 2000) ctrl.abort(); }, ctrl.signal),
    (e) => e.code === 'cancelled');
});
