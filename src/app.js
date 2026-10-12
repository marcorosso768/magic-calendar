// app.js

const App = (() => {
  const _now = new Date();
  let year   = _now.getFullYear();
  let month  = _now.getMonth();
  let view   = 'monthly';
  let calKey = null;           // calendar shown in the monthly view; null = no calendar for this month
  let _currentCalData = null;  // keep reference for PDF export
  let _calIndex = [];          // [{ key, name, year, month }] of all saved calendars
  let _nav = 0;                // increases at every navigation: older async steps stop when outdated

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

    // Month nav: switches to the calendar of that month (or shows an empty month), so edits
    // always go to the calendar whose month is on screen.
    document.getElementById('prev-month').addEventListener('click', () => {
      let y = year, m = month - 1; if (m < 0) { m = 11; y--; }
      goToMonth(y, m);
    });
    document.getElementById('next-month').addEventListener('click', () => {
      let y = year, m = month + 1; if (m > 11) { m = 0; y++; }
      goToMonth(y, m);
    });

    // Today: back to the current month
    document.getElementById('btn-today')?.addEventListener('click', () => {
      const n = new Date();
      goToMonth(n.getFullYear(), n.getMonth());
    });

    // At midnight "today", the past days and the countdown move on: redraw once the date changes.
    let _lastDay = CalUtils.todayStamp();
    setInterval(() => {
      const t = CalUtils.todayStamp();
      if (t !== _lastDay) { _lastDay = t; renderCurrent(); }
    }, 60000);

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
      const sel     = document.getElementById('new-month');
      const yearInp = document.getElementById('new-year');
      const m       = parseInt(sel.value, 10);
      const y       = parseInt(yearInp.value, 10);
      if (!Number.isInteger(y) || y < 1900 || y > 2200 || !(m >= 0 && m <= 11)) {
        yearInp.classList.add('invalid');
        yearInp.focus();
        return;
      }
      yearInp.classList.remove('invalid');
      const name = document.getElementById('new-name').value.trim();
      await createCalendar(y, m, name);
      document.getElementById('modal-new').classList.add('hidden');
    });

    // ── Export preview modal ─────────────────────────────────────────
    let _expLandscape = false;
    let _expCentered  = true; // default: centra

    async function buildExportHTML() {
      if (view === 'weekly') {
        return WeekView.buildPrintHTML(_expLandscape, _expCentered);
      }
      const saved = await Storage.load(calKey);
      return CalView.buildPrintHTML(saved?.year ?? year, saved?.month ?? month, calKey, saved, _expLandscape, _expCentered);
    }

    // The monthly export needs a calendar; the weekly one does not.
    const canExport = () => view === 'weekly' || !!calKey;

    async function refreshExportPreview() {
      if (!canExport()) return;
      // Preview runs inside the app: the bundled fonts are at "fonts/" relative to index.html.
      const html = (await buildExportHTML()).split('__FONT_BASE__').join('fonts/');

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
      if (!canExport()) return;
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
      if (!canExport()) return;
      const months   = I18n.ta('months');
      const isWeekly = view === 'weekly';
      const filename = isWeekly
        ? WeekView.getExportFilename()
        : `Calendario_${months[month]||month+1}_${year}`;
      const html = await buildExportHTML();
      const res  = await window.api.pdfExport(html, filename, _expLandscape);
      if (res?.ok) document.getElementById('modal-export').classList.add('hidden');
      // If the user cancelled the dialog, keep the export modal open silently.
    });

    // Auto-update UI — show a small non-blocking banner while the update
    // is downloading; native dialogs in main.js handle confirmation.
    if (window.api) {
      const banner = document.getElementById('update-banner');
      const barEl  = document.getElementById('update-banner-bar');
      const txtEl  = document.getElementById('update-banner-text');
      const showBanner = (text) => {
        if (!banner) return;
        banner.classList.remove('hidden');
        if (txtEl) txtEl.textContent = text;
      };
      const hideBanner = () => { if (banner) banner.classList.add('hidden'); };

      window.api.onUpdateDownloading?.(() => {
        if (barEl) barEl.style.width = '0%';
        showBanner(I18n.t('updateDownloading') || 'Downloading update…');
      });
      window.api.onUpdateProgress?.((p) => {
        if (barEl) barEl.style.width = `${Math.max(0, Math.min(100, p.percent || 0))}%`;
        showBanner(`${I18n.t('updateDownloading') || 'Downloading update…'} ${Math.round(p.percent || 0)}%`);
      });
      window.api.onUpdateDownloaded?.((info) => {
        if (barEl) barEl.style.width = '100%';
        showBanner(
          (I18n.t('updateReady') || 'Update ready') + (info?.version ? ` (v${info.version})` : '')
        );
        // Auto-hide after 5 s — a native dialog is shown by main.js too.
        setTimeout(hideBanner, 5000);
      });
      window.api.onUpdateFailed?.(hideBanner);
    }

    // Close modals
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () =>
        document.getElementById(btn.dataset.close).classList.add('hidden')
      );
    });
    document.querySelectorAll('.modal').forEach(m => {
      // The first-launch theme choice can only be closed with "Continue" (otherwise it reappears every launch).
      if (m.id === 'modal-theme-welcome') return;
      m.addEventListener('click', e => { if (e.target===m) m.classList.add('hidden'); });
    });

    // Init sub-modules
    CalView.initListeners();
    WeekView.initListeners();
    initSettingsListeners();

    // Load saved calendars
    await refreshSavedList();

    // Auto-select: the calendar of the current month; otherwise create it if there are no calendars
    // at all, or show the first one.
    const current = _calIndex.find(c => c.year === year && c.month === month);
    if (current) {
      await selectCal(current.key);
    } else if (_calIndex.length === 0) {
      await createCalendar(year, month, '');
    } else {
      await selectCal(_calIndex[0].key);
    }
    updateMonthLabel();

    if (!SettingsManager.get().themeSelectionCompleted) {
      await openThemeWelcome();
    }
  }

  async function renderCurrent(nav = _nav) {
    if (view === 'weekly') {
      await WeekView.render();
      return;
    }
    if (!calKey) {
      _currentCalData = null;
      renderEmptyMonth();
      return;
    }
    const saved = await Storage.load(calKey);
    if (nav !== _nav) return;          // outdated: a newer navigation will draw
    _currentCalData = saved;
    // Always draw the month stored in the calendar, so the grid and the saved days never diverge.
    CalView.render(saved?.year ?? year, saved?.month ?? month, calKey, saved);
    updateCountdown();
  }

  // Countdown under the subtitle, only on the calendar of the current month: today's type and how
  // many days until the next day of each other type. Following months are read from the calendar of
  // that month when there is exactly one (with several, it is not clear which one counts).
  async function updateCountdown() {
    const el = document.getElementById('cal-countdown');
    if (!el) return;
    const now = new Date();
    const shown = _currentCalData;
    if (!shown || shown.year !== now.getFullYear() || shown.month !== now.getMonth()) { el.textContent = ''; return; }
    const types = SettingsManager.get().types || [];
    const months = [{ year: shown.year, month: shown.month, days: shown.days || {} }];
    for (let i = 1; i <= 4; i++) {
      const dt = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const cands = _calIndex.filter(c => c.year === dt.getFullYear() && c.month === dt.getMonth());
      if (cands.length !== 1) continue;
      const d = await Storage.load(cands[0].key);
      if (d) months.push({ year: dt.getFullYear(), month: dt.getMonth(), days: d.days || {} });
    }
    if (!el.isConnected) return;   // the month was redrawn meanwhile
    const parts = [];
    for (const o of CalUtils.nextOccurrences(months, types.map(t => t.key), now)) {
      const label = types.find(t => t.key === o.key)?.label || '';
      if (o.inDays === 0) parts.unshift(I18n.tf('countdownToday', label));
      else parts.push(o.inDays === 1 ? I18n.tf('countdownTomorrow', label) : I18n.tf('countdownIn', label, o.inDays));
    }
    el.textContent = parts.join('   ·   ');
  }

  // Month without a calendar: message and a button to create it.
  function renderEmptyMonth() {
    const months = I18n.ta('months');
    const label  = `${months[month] || ''} ${year}`;
    const cont   = document.getElementById('view-monthly');
    cont.innerHTML = '';
    const box = document.createElement('div');
    box.className = 'empty-month';
    const msg = document.createElement('p');
    msg.textContent = I18n.tf('noCalendarForMonth', label);
    const btn = document.createElement('button');
    btn.className = 'btn-accent';
    btn.textContent = I18n.tf('createForMonth', label);
    btn.addEventListener('click', () => createCalendar(year, month, ''));
    box.append(msg, btn);
    cont.appendChild(box);
  }

  // Calendar keys: a readable name plus year and month, made unique. Two calendars can never get
  // the same key, so creating one never overwrites another.
  function makeKey(name, y, m) {
    const base = (name || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
      .slice(0, 60) || 'cal';
    const stem = `${base}_${y}_${m + 1}`;
    // macOS and Windows disks ignore case: "Ottobre_…" and "ottobre_…" would be the same file.
    const taken = new Set(_calIndex.map(c => c.key.toLowerCase()));
    let key = stem, n = 2;
    while (taken.has(key.toLowerCase())) key = `${stem}_${n++}`;
    return key;
  }

  let _creating = false;   // ignores double clicks while a calendar is being created
  async function createCalendar(y, m, name) {
    if (_creating) return;
    _creating = true;
    try {
      const months = I18n.ta('months');
      const finalName = name || `${months[m] || ''} ${y}`.trim();
      await refreshSavedList();                     // up-to-date list before choosing the key
      const data = { year: y, month: m, days: {}, name: finalName };
      let key = makeKey(finalName, y, m);
      // The main process refuses to overwrite an existing file: try the next free key.
      for (let n = 2; !(await Storage.create(key, data)).ok; n++) key = `${makeKey(finalName, y, m)}_x${n}`;
      await refreshSavedList();
      await selectCal(key);
    } finally {
      _creating = false;
    }
  }

  async function goToMonth(y, m) {
    _nav++;
    year = y; month = m;
    const match = _calIndex.find(c => c.key === calKey && c.year === y && c.month === m)
               || _calIndex.find(c => c.year === y && c.month === m);
    if (match) {
      await selectCal(match.key);
    } else {
      calKey = null;
      markActive();
      updateMonthLabel();
      renderCurrent();
    }
  }

  function renderMonthly(y, m, key, data) {
    _currentCalData = data;
    CalView.render(y, m, key, data);
    updateCountdown();
  }

  function refresh() { renderCurrent(); }

  async function refreshSavedList() {
    const keys = await Storage.list();
    const list = document.getElementById('saved-list');
    list.innerHTML = '';
    _calIndex = [];
    for (const k of keys) {
      const d    = await Storage.load(k);
      const name = d?.name || k.replace(/_/g,' ');
      _calIndex.push({ key: k, name, year: d?.year, month: d?.month });
      const item = document.createElement('div');
      item.className = 'saved-item' + (k===calKey?' active':'');
      item.dataset.key = k;

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
          if (wasActive) renderCurrent();   // the month stays on screen, now without a calendar
        }
      });
      item.appendChild(del);
      item.addEventListener('click', () => selectCal(k, d));
      list.appendChild(item);
    }
  }

  async function selectCal(key, data) {
    const nav = ++_nav;
    calKey = key;
    if (!data) data = await Storage.load(key);
    if (nav !== _nav) return;          // a newer click already moved elsewhere
    if (data?.year  !== undefined) year  = data.year;
    if (data?.month !== undefined) month = data.month;
    updateMonthLabel();
    markActive();
    await renderCurrent(nav);
  }

  // Highlights the selected calendar by key (two calendars may share a name).
  function markActive() {
    document.querySelectorAll('.saved-item').forEach(el => {
      el.classList.toggle('active', el.dataset.key === calKey);
    });
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
