const test = require('node:test');
const assert = require('node:assert/strict');
const { parseReleaseNotes } = require('../src/release-notes.js');
const fs = require('fs');

test('markdown notes (as written in release-notes.md)', () => {
  const b = parseReleaseNotes(fs.readFileSync(__dirname + '/../build-resources/release-notes.md', 'utf8'));
  assert.equal(b[0].type, 'h');
  assert.ok(b.some(x => x.type === 'li' && x.parts.some(p => p.bold)));
  assert.ok(!b.some(x => x.parts.some(p => /\.dmg|\.exe/.test(p.text))), 'platform section is left out');
  assert.ok(!b.some(x => x.parts.some(p => p.text.includes('**') || p.text.includes('`'))));
});

test('HTML notes from GitHub', () => {
  const html = '<h2>🦄 Magic Calendar v1.6.1</h2><p>Small fixes.</p><h3>✨ What&#39;s new</h3><ul><li><strong>Export</strong>: faster &amp; safer</li><li>Other<ul><li>nested</li></ul></li></ul><h3>🖥️ Platforms</h3><ul><li>x.dmg</li></ul><h3>📦 Notes</h3><p>Installs itself.</p><script>alert(1)</script>';
  const b = parseReleaseNotes(html);
  assert.deepEqual(b.map(x => x.type), ['h', 'p', 'h', 'li', 'li', 'li', 'h', 'p']);
  assert.deepEqual(b[3].parts, [{ text: 'Export', bold: true }, { text: ': faster & safer', bold: false }]);
  assert.equal(b[2].parts[0].text, "✨ What's new");
  assert.ok(!JSON.stringify(b).includes('x.dmg'));
  assert.ok(!JSON.stringify(b).includes('<'));
  assert.ok(!JSON.stringify(b).includes('alert'));
});

test('empty notes', () => {
  assert.deepEqual(parseReleaseNotes(''), []);
  assert.deepEqual(parseReleaseNotes(null), []);
});
