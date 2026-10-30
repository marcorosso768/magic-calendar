// release-notes.js — turns the release notes that come from GitHub (HTML or Markdown) into a small
// list of blocks the update window draws with plain DOM nodes (no HTML is ever injected).
//   [{ type: 'h', level: 2|3, parts }, { type: 'p', parts }, { type: 'li', parts, sub? }]
//   parts: [{ text, bold }]
// Used by the main process; also loaded by the Node tests.

const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };

function htmlToMarkdown(html) {
  return String(html)
    .replace(/\r/g, '')
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*h([1-6])[^>]*>/gi, (_, n) => `\n${'#'.repeat(+n)} `)
    .replace(/<\s*\/h[1-6]\s*>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '\n- ')
    .replace(/<\s*(strong|b)(\s[^>]*)?>/gi, '**').replace(/<\s*\/(strong|b)\s*>/gi, '**')
    .replace(/<\s*(br|\/p|\/li|\/ul|\/ol|p|ul|ol)(\s[^>]*)?\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m])
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));
}

function inline(text) {
  const clean = text.replace(/`([^`]*)`/g, '$1').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').trim();
  const parts = [];
  clean.split('**').forEach((t, i) => { if (t) parts.push({ text: t, bold: i % 2 === 1 }); });
  return parts;
}

// Sections that make no sense inside the app (file names to download).
const SKIP_SECTION = /platform|piattaform|download/i;

function parseReleaseNotes(raw) {
  if (!raw) return [];
  const notes = Array.isArray(raw) ? raw.map(n => (n && n.note) || '').join('\n') : String(raw);
  const md = /<\/?[a-z][^>]*>/i.test(notes) ? htmlToMarkdown(notes) : notes;
  const blocks = [];
  let skipping = false, skipLevel = 0;
  for (let line of md.split('\n')) {
    line = line.replace(/\s+$/, '');
    if (!line.trim()) continue;
    const h = /^\s*(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length;
      if (skipping && level <= skipLevel) skipping = false;
      if (SKIP_SECTION.test(h[2])) { skipping = true; skipLevel = level; continue; }
      if (!skipping) blocks.push({ type: 'h', level: level <= 2 ? 2 : 3, parts: inline(h[2]) });
      continue;
    }
    if (skipping) continue;
    const li = /^(\s*)[-*•]\s+(.*)$/.exec(line);
    if (li) { blocks.push({ type: 'li', parts: inline(li[2]), ...(li[1].length >= 2 ? { sub: true } : {}) }); continue; }
    blocks.push({ type: 'p', parts: inline(line) });
  }
  return blocks.filter(b => b.parts.length);
}

module.exports = { parseReleaseNotes };
