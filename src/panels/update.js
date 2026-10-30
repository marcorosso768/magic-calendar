// Update window: draws the state sent by the main process (title, message, notes, progress, details, buttons).
const $ = (id) => document.getElementById(id);
let _lastHeight = 0;

// The window takes the height of its content: asked again whenever the layout changes (new state,
// fonts loaded, text wrapping), but only when the height really changes.
function reportHeight() {
  const h = Math.ceil(document.querySelector('.panel').getBoundingClientRect().height
    + parseFloat(getComputedStyle(document.body).paddingTop) + parseFloat(getComputedStyle(document.body).paddingBottom));
  if (h !== _lastHeight) { _lastHeight = h; window.panel.resize(h); }
}
new ResizeObserver(() => reportHeight()).observe(document.querySelector('.panel'));

// Release notes: blocks from release-notes.js, drawn with DOM nodes (text only, never HTML).
let _notesSig = '';
function renderNotes(s) {
  const box = $('notes');
  const sig = JSON.stringify(s.notesBlocks || s.notes || '');
  if (sig === _notesSig) return;            // progress updates do not reset the scroll position
  _notesSig = sig;
  box.textContent = '';
  if (!s.notesBlocks) { box.textContent = s.notes || ''; box.style.whiteSpace = 'pre-wrap'; return; }
  box.style.whiteSpace = '';
  const fill = (el, parts) => {
    for (const p of parts) {
      const n = p.bold ? document.createElement('strong') : document.createTextNode(p.text);
      if (p.bold) n.textContent = p.text;
      el.appendChild(n);
    }
    return el;
  };
  let ul = null, sub = null;
  for (const b of s.notesBlocks) {
    if (b.type !== 'li') { ul = sub = null; }
    if (b.type === 'h') box.appendChild(fill(document.createElement(b.level === 2 ? 'h2' : 'h3'), b.parts));
    else if (b.type === 'p') box.appendChild(fill(document.createElement('p'), b.parts));
    else if (b.sub && ul && ul.lastElementChild) {
      if (!sub) { sub = document.createElement('ul'); ul.lastElementChild.appendChild(sub); }
      sub.appendChild(fill(document.createElement('li'), b.parts));
    } else {
      if (!ul) { ul = document.createElement('ul'); box.appendChild(ul); }
      sub = null;
      ul.appendChild(fill(document.createElement('li'), b.parts));
    }
  }
  box.scrollTop = 0;
}

function render(s) {
  $('title').textContent = s.title || '';
  $('message').textContent = s.message || '';
  $('notes-label').textContent = s.notesLabel || '';
  renderNotes(s);
  document.body.classList.toggle('has-notes', !!(s.notesBlocks && s.notesBlocks.length));
  const ck = $('check');
  ck.classList.toggle('hidden', !s.checkbox);
  if (s.checkbox) { $('check-label').textContent = s.checkbox.label; $('check-box').checked = !!s.checkbox.checked; }
  $('detail').textContent = s.detail || '';
  const bar = $('bar');
  bar.classList.toggle('hidden', s.progress == null);
  bar.classList.toggle('indeterminate', s.progress === 'indeterminate');
  bar.firstElementChild.style.width = typeof s.progress === 'number' ? `${s.progress}%` : '';

  // Rebuild the buttons only when they change, so progress updates do not steal focus.
  const box = $('buttons'), left = $('left-buttons');
  const sig = JSON.stringify(s.buttons || []);
  if (box.dataset.sig !== sig) {
    box.dataset.sig = sig;
    box.innerHTML = ''; left.innerHTML = '';
    // macOS order: buttons marked `left` at the far left; secondary then default button on the right.
    for (const b of [...(s.buttons || [])].reverse()) {
      const el = document.createElement('button');
      el.textContent = b.label;
      if (b.primary) el.className = 'primary';
      el.addEventListener('click', () => window.panel.action(b.id));
      (b.left ? left : box).appendChild(el);
    }
    const primary = box.querySelector('.primary');
    if (primary) primary.focus();
  }
  reportHeight();
}

$('check-box').addEventListener('change', (e) => window.panel.action(e.target.checked ? 'auto:on' : 'auto:off'));

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') window.panel.action('escape');
});

window.panel.onTheme((dark) => document.documentElement.classList.toggle('dark', !!dark));
window.panel.onState(render);
window.panel.init().then((info) => {
  document.documentElement.classList.toggle('dark', !!info.dark);
  document.documentElement.lang = info.lang;
  if (info.accent) document.documentElement.style.setProperty('--accent', info.accent);
  $('icon').src = info.icon;
  render(info.state);
});
