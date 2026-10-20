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
    const firstLaunch = !SettingsManager.get().themeSelectionCompleted;

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
    document.getElementById('btn-new').addEventListener('click', () => openNewModal(null));

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
      let days = {};
      if (_copyFrom) {
        const src = await Storage.load(_copyFrom);
        if (src) days = CalUtils.copyByWeekday(src.year, src.month, src.days || {}, y, m);
      }
      await createCalendar(y, m, name, days);
      document.getElementById('modal-new').classList.add('hidden');
    });

    // ── Export preview modal ─────────────────────────────────────────
    let _expLandscape = false;
    let _expCentered  = true; // default: centra

    // Months to export: this month, a few months, a school year or a calendar year (one page each).
    let _expRange = 'month';
    const ym = (y, m) => `${y}-${String(m + 1).padStart(2, '0')}`;
    const parseYm = (v) => { const r = /^(\d{4})-(\d{2})$/.exec(v || ''); return r ? { y: +r[1], m: +r[2] - 1 } : null; };

    // range: 'month' | 'next3' | 'school' | 'year' | 'custom' (then the two <input type="month">).
    function monthsFor(range, fromId, toId) {
      let from = { y: year, m: month }, count = 1;
      if (range === 'next3') count = 3;
      else if (range === 'school') { from = { y: SchoolUtils.schoolYearOf(year, month), m: 8 }; count = 10; }
      else if (range === 'year') { from = { y: year, m: 0 }; count = 12; }
      else if (range === 'custom') {
        const a = parseYm(document.getElementById(fromId).value), b = parseYm(document.getElementById(toId).value);
        if (a && b) {
          const n = (b.y - a.y) * 12 + (b.m - a.m) + 1;
          if (n >= 1) { from = a; count = Math.min(n, 24); }
        }
      }
      return Array.from({ length: count }, (_, i) => { const t = new Date(from.y, from.m + i, 1); return { y: t.getFullYear(), m: t.getMonth() }; });
    }
    const exportMonths = () => monthsFor(_expRange, 'export-from', 'export-to');

    // Saved calendar of a month: the one on screen, else the only one (or the first) of that month.
    async function calendarDataFor(y, m) {
      if (calKey && year === y && month === m) return { key: calKey, data: await Storage.load(calKey) };
      const c = _calIndex.find(x => x.year === y && x.month === m);
      return c ? { key: c.key, data: await Storage.load(c.key) } : { key: null, data: null };
    }

    // One HTML document with one page per month (each month's page comes from CalView.buildPrintHTML).
    async function buildExportHTML() {
      if (view === 'weekly') {
        return WeekView.buildPrintHTML(_expLandscape, _expCentered);
      }
      const months = exportMonths();
      const docs = [];
      for (const { y, m } of months) {
        const { key, data } = await calendarDataFor(y, m);
        docs.push(CalView.buildPrintHTML(y, m, key, data, _expLandscape, _expCentered));
      }
      if (docs.length === 1) return docs[0];
      const head = docs[0].slice(0, docs[0].indexOf('</head>'));
      const bodies = docs.map(d => d.slice(d.indexOf('<body>') + 6, d.lastIndexOf('</body>')));
      return `${head}<style>body{height:auto !important}.page{break-after:page;page-break-after:always}.page:last-child{break-after:auto;page-break-after:auto}</style></head><body>${bodies.join('')}</body></html>`;
    }

    function rangeOptionsHtml(selected) {
      const sy = SchoolUtils.schoolYearOf(year, month);
      const opts = [
        ['month', I18n.t('exportThisMonth')], ['next3', I18n.t('exportNext3')],
        ['school', I18n.tf('exportSchoolYear', sy)], ['year', I18n.tf('exportYear', year)], ['custom', I18n.t('exportCustom')],
      ];
      return opts.map(([v, l]) => `<option value="${v}" ${v === selected ? 'selected' : ''}>${escapeHtml(l)}</option>`).join('');
    }

    function renderRangeOptions() {
      document.getElementById('export-range').innerHTML = rangeOptionsHtml(_expRange);
      document.getElementById('export-range-row').classList.toggle('hidden', view === 'weekly');
      document.getElementById('export-custom').classList.toggle('hidden', _expRange !== 'custom');
    }

    const canExport = () => true;

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
      const pages = view === 'weekly' ? 1 : exportMonths().length;
      document.getElementById('export-pages').textContent = pages > 1 ? I18n.tf('exportPages', pages) : '';

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
      _expRange     = 'month';
      document.getElementById('export-from').value = ym(year, month);
      document.getElementById('export-to').value = ym(year, month);
      renderRangeOptions();
      document.getElementById('modal-export').classList.remove('hidden');
      await refreshExportPreview();
    });

    document.getElementById('export-range').addEventListener('change', async (e) => {
      _expRange = e.target.value;
      document.getElementById('export-custom').classList.toggle('hidden', _expRange !== 'custom');
      await refreshExportPreview();
    });
    ['export-from', 'export-to'].forEach(id => document.getElementById(id).addEventListener('change', refreshExportPreview));

    // ── Calendar export (.ics) ───────────────────────────────────────
    let _icsRange = 'school';
    async function buildIcs() {
      const months = monthsFor(_icsRange, 'ics-from', 'ics-to');
      const withDays = [];
      for (const { y, m } of months) {
        // Every saved calendar of that month (normally one).
        const cals = _calIndex.filter(c => c.year === y && c.month === m);
        const days = {};
        for (const c of cals) Object.assign(days, ((await Storage.load(c.key)) || {}).days || {});
        withDays.push({ y, m, days });
      }
      const s = SettingsManager.get();
      const events = Ics.collect(withDays, s, {
        days: document.getElementById('ics-days').checked,
        school: document.getElementById('ics-school').checked,
        holidays: document.getElementById('ics-holidays').checked,
        lang: I18n.currentLang(),
        labels: { schoolStart: I18n.t('icsSchoolStart'), schoolEnd: I18n.t('icsSchoolEnd'), bridge: I18n.t('bridgeName'), vacation: I18n.t('legendVacation') },
      });
      const calName = s.subtitle || I18n.t('defaultSubtitle');
      return { events, text: Ics.build({ calName, events }), months };
    }
    async function refreshIcsCount() {
      const { events } = await buildIcs();
      document.getElementById('ics-count').textContent = events.length ? I18n.tf('icsCount', events.length) : I18n.t('icsNone');
      document.getElementById('btn-ics-save').disabled = !events.length;
    }
    document.getElementById('btn-ics').addEventListener('click', async () => {
      _icsRange = 'school';
      document.getElementById('ics-range').innerHTML = rangeOptionsHtml(_icsRange);
      document.getElementById('ics-from').value = ym(year, month);
      document.getElementById('ics-to').value = ym(year, month);
      document.getElementById('ics-custom').classList.add('hidden');
      document.getElementById('modal-ics').classList.remove('hidden');
      await refreshIcsCount();
    });
    document.getElementById('ics-range').addEventListener('change', async (e) => {
      _icsRange = e.target.value;
      document.getElementById('ics-custom').classList.toggle('hidden', _icsRange !== 'custom');
      await refreshIcsCount();
    });
    ['ics-from', 'ics-to', 'ics-days', 'ics-school', 'ics-holidays'].forEach(id =>
      document.getElementById(id).addEventListener('change', refreshIcsCount));
    document.getElementById('btn-ics-save').addEventListener('click', async () => {
      const { text, months } = await buildIcs();
      const MN = I18n.ta('months');
      const name = ({ y, m }) => `${MN[m] || m + 1}_${y}`;
      const first = months[0], last = months[months.length - 1];
      const filename = months.length === 1 ? `Magic_Calendar_${name(first)}` : `Magic_Calendar_${name(first)}-${name(last)}`;
      const res = await window.api.icsExport(text, filename, document.getElementById('ics-open').checked);
      if (res?.ok) document.getElementById('modal-ics').classList.add('hidden');
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
      const list = exportMonths();
      const name = ({ y, m }) => `${months[m] || m + 1}_${y}`;
      const filename = isWeekly
        ? WeekView.getExportFilename()
        : list.length === 1 ? `Calendario_${name(list[0])}` : `Calendario_${name(list[0])}-${name(list[list.length - 1])}`;
      const html = await buildExportHTML();
      const res  = await window.api.pdfExport(html, filename, _expLandscape);
      if (res?.ok) document.getElementById('modal-export').classList.add('hidden');
      // If the user cancelled the dialog, keep the export modal open silently.
    });

    // Undo / Redo of day changes (Edit menu, ⌘Z / ⇧⌘Z). In a text field the field keeps its own undo.
    const inTextField = () => {
      const el = document.activeElement;
      return el && (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && !['checkbox','radio','button','date','number'].includes(el.type)) || el.isContentEditable);
    };
    window.api.onMenuUndo?.(() => { if (inTextField()) document.execCommand('undo'); else { CalView.clearSelection(); DayOps.undo(); } });
    window.api.onMenuRedo?.(() => { if (inTextField()) document.execCommand('redo'); else DayOps.redo(); });

    // Weekly pattern
    document.getElementById('btn-pattern')?.addEventListener('click', () => PatternView.open(year, month));

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
    PatternView.initListeners();
    SchoolView.initListeners();
    initSettingsListeners();

    // Load saved calendars
    await refreshSavedList();

    // Always open on the current month: its calendar if there is one, otherwise an empty month ready
    // to fill (the calendar file is created with the first saved day).
    const current = _calIndex.find(c => c.year === year && c.month === month);
    if (current) {
      await selectCal(current.key);
    } else {
      calKey = null;
      markActive();
      await renderCurrent();
    }
    updateMonthLabel();

    if (!SettingsManager.get().themeSelectionCompleted) {
      await openThemeWelcome();
    }

    // "What's new" tour: once per version, after an update. A new install gets none (it starts
    // with the theme choice). Help → What's New opens it again.
    const seen = SettingsManager.get().lastWhatsNew;
    const steps = firstLaunch ? [] : whatsNewSince(seen, appInfo.version);
    if (seen !== appInfo.version) {
      SettingsManager.set({ lastWhatsNew: appInfo.version });
      await SettingsManager.save();
    }
    // Then the school-year window (from 1 September, once per school year), after the tour if any.
    if (steps.length) setTimeout(() => Tour.start(steps, () => SchoolView.maybePrompt()), 700);
    else setTimeout(() => SchoolView.maybePrompt(), 500);
    window.api.onMenuWhatsNew?.(() => {
      const list = whatsNewLatest(appInfo.version);
      Tour.start(list.length ? list : (WHATS_NEW[WHATS_NEW.length - 1]?.steps || []));
    });
  }

  async function renderCurrent(nav = _nav) {
    if (view === 'weekly') {
      await WeekView.render();
      return;
    }
    if (!calKey) {
      // Month without a calendar: the empty grid, ready to fill (see ensureCalendar).
      _currentCalData = { year, month, days: {} };
      CalView.render(year, month, null, _currentCalData);
      updateCountdown();
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

  // Calendar for changes made to a month that may not be on screen (weekly patterns):
  // the one on screen for that month, else the only one of that month, else a new one.
  // With several calendars in that month (none on screen) it is not clear which one: null.
  async function calendarFor(y, m, { create = true } = {}) {
    if (calKey && year === y && month === m) return calKey;
    const cands = _calIndex.filter(c => c.year === y && c.month === m);
    if (cands.length === 1) return cands[0].key;
    if (cands.length > 1) return null;
    if (!create) return undefined;            // no calendar yet
    if (year === y && month === m) return ensureCalendar(y, m);
    return createCalendar(y, m, '', {}, { select: false });
  }

  // Calendar of a month that has none yet: created when its first day is saved.
  async function ensureCalendar(y, m) {
    if (calKey && year === y && month === m) return calKey;
    await createCalendar(y, m, '');
    return calKey;
  }

  // "New calendar" form; with copyFrom, the days of that calendar are copied into the chosen month
  // by day of the week (CalUtils.copyByWeekday).
  let _copyFrom = null;
  function openNewModal(copyFrom) {
    _copyFrom = copyFrom;
    const src = copyFrom ? _calIndex.find(c => c.key === copyFrom) : null;
    const now = new Date();
    // Copying usually means "this month from that one": suggest the current month, or the next one
    // if the current month already has a calendar.
    let target = new Date(now.getFullYear(), now.getMonth(), 1);
    if (_calIndex.some(c => c.year === target.getFullYear() && c.month === target.getMonth())) target = new Date(target.getFullYear(), target.getMonth() + 1, 1);
    const selM = src ? target.getMonth() : month, selY = src ? target.getFullYear() : year;
    const sel = document.getElementById('new-month');
    const mNames = I18n.ta('months');
    sel.innerHTML = mNames.map((n,i) => `<option value="${i}" ${i===selM?'selected':''}>${n}</option>`).join('');
    document.getElementById('new-year').value = selY;
    document.getElementById('new-name').value = '';
    const title = document.querySelector('#modal-new .modal-head h2');
    if (title) title.textContent = src ? I18n.tf('copyCalendarTitle', src.name) : I18n.t('newCalendarTitle');
    const hint = document.getElementById('new-copy-hint');
    if (hint) { hint.textContent = src ? I18n.t('copyCalendarHint') : ''; hint.classList.toggle('hidden', !src); }
    document.getElementById('modal-new').classList.remove('hidden');
  }

  let _creating = false;   // ignores double clicks while a calendar is being created
  async function createCalendar(y, m, name, days = {}, { select = true } = {}) {
    if (_creating) return null;
    _creating = true;
    try {
      const months = I18n.ta('months');
      const finalName = name || `${months[m] || ''} ${y}`.trim();
      await refreshSavedList();                     // up-to-date list before choosing the key
      const data = { year: y, month: m, days, name: finalName };
      let key = makeKey(finalName, y, m);
      // The main process refuses to overwrite an existing file: try the next free key.
      for (let n = 2; !(await Storage.create(key, data)).ok; n++) key = `${makeKey(finalName, y, m)}_x${n}`;
      await refreshSavedList();
      if (select) await selectCal(key);
      else markActive();
      return key;
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
    const entries = [];
    for (const k of keys) {
      const d = await Storage.load(k);
      entries.push({ k, d, name: d?.name || k.replace(/_/g,' ') });
    }
    // Newest month first; same month: by name.
    const rank = (e) => (e.d?.year ?? 0) * 12 + (e.d?.month ?? 0);
    entries.sort((a, b) => rank(b) - rank(a) || a.name.localeCompare(b.name));
    list.innerHTML = '';
    _calIndex = [];
    for (const { k, d, name } of entries) {
      _calIndex.push({ key: k, name, year: d?.year, month: d?.month });
      const item = document.createElement('div');
      item.className = 'saved-item' + (k===calKey?' active':'');
      item.dataset.key = k;

      const sp = document.createElement('span');
      sp.textContent = name;
      item.appendChild(sp);

      const copy = document.createElement('button');
      copy.className = 'saved-item-copy';
      copy.textContent = '⧉';
      copy.title = I18n.t('copyCalendar');
      copy.addEventListener('click', e => { e.stopPropagation(); openNewModal(k); });
      item.appendChild(copy);

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

  return { init, refresh, renderMonthly, ensureCalendar, calendarFor };
})();

// updateStaticStrings è definita in settings.js (versione completa con App.refresh())

document.addEventListener('DOMContentLoaded', () => App.init());
