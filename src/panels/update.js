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

function render(s) {
  $('title').textContent = s.title || '';
  $('message').textContent = s.message || '';
  $('notes').textContent = s.notes || '';
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
