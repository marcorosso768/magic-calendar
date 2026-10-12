// About window: icon, name and version on the left, project and credits on the right.
const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

function link(url, label) {
  return `<a data-href="${esc(url)}">${esc(label || url.replace(/^https?:\/\//, ''))}</a>`;
}

window.panel.onTheme((dark) => document.documentElement.classList.toggle('dark', !!dark));
window.panel.init().then((info) => {
  const a = info.about;
  document.documentElement.classList.toggle('dark', !!info.dark);
  document.documentElement.lang = info.lang;
  $('icon').src = info.icon;
  $('name').textContent = a.name;
  $('version').textContent = a.version;
  $('copyright').textContent = a.copyright;
  $('content').innerHTML = `
    <div class="banner">
      <h1>${esc(a.projectTitle)}</h1>
      <div class="links">${link(a.homepage, a.homepageLabel)}${link(a.releases, a.releasesLabel)}</div>
    </div>
    <div class="section">
      <h2>${esc(a.authorRole)}</h2>
      <div class="body"><p>${esc(a.author)}</p></div>
    </div>
    ${a.sections.map(s => `
      <div class="section alone">
        <h2>${esc(s.title)}</h2>
        <div class="body">${s.items.map(it => `<b>${esc(it.label)}</b><p>${esc(it.text)}${it.url ? ' ' + link(it.url, it.urlLabel) : ''}</p>`).join('')}</div>
      </div>`).join('')}
  `;
  document.querySelectorAll('a[data-href]').forEach(el => el.addEventListener('click', () => window.panel.openLink(el.dataset.href)));
});

document.addEventListener('keydown', (e) => { if (e.key === 'Escape' || ((e.metaKey || e.ctrlKey) && e.key === 'w')) window.close(); });
