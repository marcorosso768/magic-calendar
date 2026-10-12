const test = require('node:test');
const assert = require('node:assert/strict');
const W = require('../src/whats-new.js');

test('tour steps per version', () => {
  assert.ok(W.WHATS_NEW.every(e => e.steps.every(s => s.title.it && s.title.en && s.text.it && s.text.en)));
  assert.equal(W.whatsNewSince('1.3.2', '1.4.0').length, W.WHATS_NEW.find(e => e.version === '1.4.0').steps.length);
  assert.equal(W.whatsNewSince('1.4.0', '1.4.0').length, 0);      // already seen
  assert.equal(W.whatsNewSince('1.3.2', '1.3.9').length, 0);      // not yet released
  assert.ok(W.versionNewer('1.10.0', '1.9.2'));
  assert.ok(!W.versionNewer('1.4.0', '1.4.0'));
});
