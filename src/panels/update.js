// Update window: draws the state sent by the main process (title, message, notes, progress, buttons).
const $ = (id) => document.getElementById(id);

function render(s) {
  $('title').textContent = s.title || '';
  $('message').textContent = s.message || '';
  $('notes').textContent = s.notes || '';
  const bar = $('bar');
  bar.classList.toggle('hidden', s.progress == null);
  bar.classList.toggle('indeterminate', s.progress === 'indeterminate');
  bar.firstElementChild.style.width = typeof s.progress === 'number' ? `${s.progress}%` : '';
  $('percent').classList.toggle('hidden', typeof s.progress !== 'number');
  $('percent').textContent = typeof s.progress === 'number' ? `${s.progress}%` : '';
  const box = $('buttons');
  box.innerHTML = '';
  for (const b of s.buttons || []) {
    const el = document.createElement('button');
    el.textContent = b.label;
    if (b.primary) el.className = 'primary';
    el.addEventListener('click', () => window.panel.action(b.id));
    box.appendChild(el);
  }
  const primary = box.querySelector('.primary');
  if (primary) primary.focus();
  requestAnimationFrame(() => window.panel.resize(document.body.scrollHeight));
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') window.panel.action('escape');
});

window.panel.onTheme((dark) => document.documentElement.classList.toggle('dark', !!dark));
window.panel.onState(render);
window.panel.init().then((info) => {
  document.documentElement.classList.toggle('dark', !!info.dark);
  document.documentElement.lang = info.lang;
  $('icon').src = info.icon;
  render(info.state);
});
