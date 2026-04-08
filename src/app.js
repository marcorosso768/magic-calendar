// app.js

const App = (() => {
  const _now = new Date();
  let year   = _now.getFullYear();
  let month  = _now.getMonth();
  let view   = 'monthly';
  let calKey = null;
  let _currentCalData = null; // keep reference for PDF export

  async function init() {
    await SettingsManager.load();

    const appInfo = await window.api.appInfo();
    document.documentElement.dataset.platform = appInfo.platform;
    document.body.classList.toggle('is-macos', appInfo.platform === 'darwin');
    const settingsBtn = document.getElementById('btn-settings');
    if (settingsBtn && appInfo.platform === 'darwin') settingsBtn.style.display = 'none';

    updateStaticStrings();

    // View switcher
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        view = btn.dataset.view;
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(`view-${view}`).classList.add('active');
        renderCurrent();
      });
    });

    // Month nav
    document.getElementById('prev-month').addEventListener('click', () => {
      month--; if (month<0){month=11;year--;}
      updateMonthLabel(); renderCurrent();
    });
    document.getElementById('next-month').addEventListener('click', () => {
      month++; if (month>11){month=0;year++;}
      updateMonthLabel(); renderCurrent();
    });

    // New calendar
    document.getElementById('btn-new').addEventListener('click', () => {
      // Populate month select with current language
      const sel = document.getElementById('new-month');
      const mNames = I18n.ta('months');
      sel.innerHTML = mNames.map((n,i) =>
        `<option value="${i}" ${i===month?'selected':''}>${n}</option>`
      ).join('');
      document.getElementById('new-year').value  = year;
      document.getElementById('new-name').value  = '';
      document.getElementById('modal-new').classList.remove('hidden');
    });

    document.getElementById('btn-new-confirm').addEventListener('click', async () => {
      const sel   = document.getElementById('new-month');
      const mName = sel.options[sel.selectedIndex]?.text || '';
      const m     = parseInt(sel.value);
      const y     = parseInt(document.getElementById('new-year').value);
      const name  = document.getElementById('new-name').value.trim() || `${mName} ${y}`;
      const key   = `${name.replace(/[^a-zA-Z0-9_\-]/g,'_').replace(/__+/g,'_')}_${y}_${m+1}`;
      await Storage.save(key, { year:y, month:m, days:{}, name });
      calKey=key; year=y; month=m;
      document.getElementById('modal-new').classList.add('hidden');
      updateMonthLabel();
      await refreshSavedList();
      renderCurrent();
    });

    // ── Export preview modal ─────────────────────────────────────────
    let _expLandscape = false;
    let _expCentered  = true; // default: centra

    async function buildExportHTML() {
      if (view === 'weekly') {
        return WeekView.buildPrintHTML(_expLandscape, _expCentered);
      }
      const saved = await Storage.load(calKey);
      return CalView.buildPrintHTML(year, month, calKey, saved, _expLandscape, _expCentered);
    }

    async function refreshExportPreview() {
      if (!calKey) return;
      const html = await buildExportHTML();

      // Dimensioni reali pagina PDF (px a 96 dpi)
      const PW = _expLandscape ? 1123 : 794;
      const PH = _expLandscape ? 794  : 1123;

      // Larghezza del riquadro di anteprima
      const PREVIEW_W = _expLandscape ? 540 : 380;
      const scale     = PREVIEW_W / PW;
      const PREVIEW_H = Math.round(PH * scale);

      const wrap  = document.getElementById('export-preview-wrap');
      const frame = document.getElementById('export-iframe');
      wrap.style.width  = `${PREVIEW_W}px`;
      wrap.style.height = `${PREVIEW_H}px`;
      frame.style.width  = `${PW}px`;
      frame.style.height = `${PH}px`;
      frame.style.transform = `scale(${scale})`;
      frame.srcdoc = html;

      // Active-mode toggle — orientazione
      document.getElementById('export-btn-portrait').classList.toggle('active-mode',  !_expLandscape);
      document.getElementById('export-btn-landscape').classList.toggle('active-mode', _expLandscape);
      // Active-mode toggle — layout
      document.getElementById('export-btn-fit').classList.toggle('active-mode',    !_expCentered);
      document.getElementById('export-btn-center').classList.toggle('active-mode', _expCentered);
    }

    // Apre il modale di anteprima
    document.getElementById('btn-export').addEventListener('click', async () => {
      if (!calKey) return;
      _expLandscape = false;
      _expCentered  = true;
      document.getElementById('modal-export').classList.remove('hidden');
      await refreshExportPreview();
    });

    // Orientazione
    document.getElementById('export-btn-portrait').addEventListener('click', async () => {
      _expLandscape = false;
      await refreshExportPreview();
    });
    document.getElementById('export-btn-landscape').addEventListener('click', async () => {
      _expLandscape = true;
      await refreshExportPreview();
    });

    // Layout
    document.getElementById('export-btn-fit').addEventListener('click', async () => {
      _expCentered = false;
      await refreshExportPreview();
    });
    document.getElementById('export-btn-center').addEventListener('click', async () => {
      _expCentered = true;
      await refreshExportPreview();
    });

    // Salva PDF
    document.getElementById('btn-export-save').addEventListener('click', async () => {
      if (!calKey) return;
      const months   = I18n.ta('months');
      const isWeekly = view === 'weekly';
      const filename = isWeekly
        ? WeekView.getExportFilename()
        : `Calendario_${months[month]||month+1}_${year}`;
      const html = await buildExportHTML();
      const res  = await window.api.pdfExport(html, filename, _expLandscape);
      if (res?.ok) document.getElementById('modal-export').classList.add('hidden');
      else console.log('PDF export cancelled');
    });

    // Close modals
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () =>
        document.getElementById(btn.dataset.close).classList.add('hidden')
      );
    });
    document.querySelectorAll('.modal').forEach(m => {
      m.addEventListener('click', e => { if (e.target===m) m.classList.add('hidden'); });
    });

    // Init sub-modules
    CalView.initListeners();
    WeekView.initListeners();
    initSettingsListeners();

    // Load saved calendars
    await refreshSavedList();

    // Auto-select: preferisce il calendario del mese corrente
    const list = await Storage.list();
    if (list.length > 0) {
      const curKey = list.find(k => k.includes(`_${year}_${month+1}`)) || list[0];
      await selectCal(curKey);
    } else {
      // Crea calendario del mese corrente
      const months = I18n.ta('months');
      const name   = `${months[month]||'Calendario'} ${year}`;
      const key    = `${name.replace(/[^a-zA-Z0-9_\-]/g,'_')}_${year}_${month+1}`;
      await Storage.save(key, { year, month, days:{}, name });
      calKey = key;
      await refreshSavedList();
      renderCurrent();
    }
    updateMonthLabel();

    if (!SettingsManager.get().themeSelectionCompleted) {
      await openThemeWelcome();
    }
  }

  async function renderCurrent() {
    if (!calKey) return;
    if (view === 'monthly') {
      const saved = await Storage.load(calKey);
      _currentCalData = saved;
      CalView.render(year, month, calKey, saved);
    } else {
      await WeekView.render(calKey);
    }
  }

  function renderMonthly(y, m, key, data) {
    _currentCalData = data;
    CalView.render(y, m, key, data);
  }

  function refresh() { renderCurrent(); }

  async function refreshSavedList() {
    const keys = await Storage.list();
    const list = document.getElementById('saved-list');
    list.innerHTML = '';
    for (const k of keys) {
      const d    = await Storage.load(k);
      const name = d?.name || k.replace(/_/g,' ');
      const item = document.createElement('div');
      item.className = 'saved-item' + (k===calKey?' active':'');

      const sp = document.createElement('span');
      sp.textContent = name;
      item.appendChild(sp);

      const del = document.createElement('button');
      del.className = 'saved-item-del';
      del.textContent = '✕';
      del.addEventListener('click', async e => {
        e.stopPropagation();
        if (confirm(I18n.tf('confirmDelete', name))) {
          const wasActive = (calKey === k);
          await Storage.delete(k);
          if (wasActive) calKey = null;
          await refreshSavedList();
          if (wasActive) {
            // Seleziona il primo calendario rimasto, se esiste
            const remaining = await Storage.list();
            if (remaining.length > 0) {
              await selectCal(remaining[0]);
            } else {
              // Nessun calendario rimasto: svuota la vista
              document.getElementById('view-monthly').innerHTML = '';
            }
          }
        }
      });
      item.appendChild(del);
      item.addEventListener('click', () => selectCal(k, d));
      list.appendChild(item);
    }
  }

  async function selectCal(key, data) {
    calKey = key;
    if (!data) data = await Storage.load(key);
    if (data?.year  !== undefined) year  = data.year;
    if (data?.month !== undefined) month = data.month;
    updateMonthLabel();
    document.querySelectorAll('.saved-item').forEach(el => {
      el.classList.toggle('active',
        el.querySelector('span')?.textContent === (data?.name||key.replace(/_/g,' '))
      );
    });
    renderCurrent();
  }

  function updateMonthLabel() {
    const months = I18n.ta('months');
    const ml = document.getElementById('month-label');
    if (ml) ml.textContent = `${months[month]||''} ${year}`;
  }

  return { init, refresh, renderMonthly };
})();

// updateStaticStrings è definita in settings.js (versione completa con App.refresh())

document.addEventListener('DOMContentLoaded', () => App.init());
