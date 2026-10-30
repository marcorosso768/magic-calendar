// views/school.js — the "School year" window: first and last day of school, Saturday school, and the
// vacation periods (school holidays or family holidays). Opens by itself from 1 September for the new
// school year, and from Settings → School and holidays.

const SchoolView = (() => {
  let _year = null;      // school year being edited (named by the year it starts in)
  let _auto = false;     // opened by itself: "Later" and "Don't use" are offered
  let _rows = [];        // periods shown in the window: { id, name, from, to }
  let _presets = new Map();   // suggested periods (id → original values): an import replaces them if untouched

  const newId = () => `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const PRESET_NAMES = { christmas: 'periodChristmas', carnival: 'periodCarnival', easter: 'periodEaster' };

  // Periods that touch this school year (1 September → 31 August), the others stay untouched.
  function inYear(p, Y) {
    const a = SchoolUtils.isoStamp(p.from), b = SchoolUtils.isoStamp(p.to);
    return b >= CalUtils.stamp(Y, 8, 1) && a <= CalUtils.stamp(Y + 1, 7, 31);
  }

  function open(Y, { auto = false } = {}) {
    _year = Y; _auto = auto;
    const sc = SettingsManager.get().school;
    const saved = (sc.years || {})[Y];
    const sug = SchoolUtils.suggestYear(Y);
    const yearData = saved || sug;
    _rows = (sc.periods || []).filter(p => inYear(p, Y)).map(p => ({ ...p }));
    _presets = new Map();
    if (!saved && !_rows.length) {
      _rows = sug.periods.map(p => ({ id: newId(), name: I18n.t(PRESET_NAMES[p.key]), from: p.from, to: p.to }));
      _rows.forEach(r => _presets.set(r.id, `${r.name}|${r.from}|${r.to}`));
    }
    document.getElementById('school-title').textContent = I18n.tf('schoolPromptTitle', Y);
    document.getElementById('school-body').innerHTML = `
      <p class="hint">${escapeHtml(I18n.t('schoolPromptHint'))}</p>
      <div class="school-dates">
        <label><span>${escapeHtml(I18n.t('schoolStart'))}</span><input type="date" id="school-start" value="${yearData.start}"></label>
        <label><span>${escapeHtml(I18n.t('schoolEnd'))}</span><input type="date" id="school-end" value="${yearData.end}"></label>
      </div>
      <label class="pat-check"><input type="checkbox" id="school-sat" ${yearData.saturday ? 'checked' : ''}> ${escapeHtml(I18n.t('schoolSaturday'))}</label>
      <div class="field-label">${escapeHtml(I18n.t('schoolPeriods'))}</div>
      <p class="hint">${escapeHtml(I18n.t('schoolPeriodsHint'))}</p>
      <div id="school-periods" class="school-periods"></div>
      <div class="school-actions">
        <button id="school-add" class="btn-sm">${escapeHtml(I18n.t('periodAdd'))}</button>
        <button id="school-import" class="btn-sm">${escapeHtml(I18n.t('icsImportBtn'))}</button>
      </div>
      <p id="school-error" class="school-error"></p>
    `;
    renderRows();
    document.getElementById('school-add').addEventListener('click', () => {
      readRows();
      const last = _rows[_rows.length - 1];
      _rows.push({ id: newId(), name: '', from: last ? last.to : yearData.start, to: last ? last.to : yearData.start });
      renderRows();
      document.querySelector('#school-periods .school-row:last-child input[type="text"]')?.focus();
    });
    document.getElementById('school-import').addEventListener('click', importIcs);
    document.getElementById('school-later').classList.toggle('hidden', !auto);
    document.getElementById('school-never').classList.toggle('hidden', !auto);
    document.getElementById('school-cancel').classList.toggle('hidden', auto);
    document.getElementById('modal-school').classList.remove('hidden');
  }

  function renderRows() {
    const box = document.getElementById('school-periods');
    box.innerHTML = _rows.map(r => `
      <div class="school-row" data-id="${escapeHtml(r.id)}">
        <input type="text" value="${escapeHtml(r.name || '')}" placeholder="${escapeHtml(I18n.t('periodNamePh'))}">
        <input type="date" class="from" value="${escapeHtml(r.from)}">
        <span>→</span>
        <input type="date" class="to" value="${escapeHtml(r.to)}">
        <button class="btn-sm school-del" title="${escapeHtml(I18n.t('periodRemove'))}">✕</button>
      </div>`).join('');
    box.querySelectorAll('.school-del').forEach(b => b.addEventListener('click', () => {
      readRows();
      const id = b.closest('.school-row').dataset.id;
      _rows = _rows.filter(r => r.id !== id);
      renderRows();
    }));
  }

  function readRows() {
    _rows = [...document.querySelectorAll('#school-periods .school-row')].map(el => ({
      id: el.dataset.id,
      name: el.querySelector('input[type="text"]').value.trim(),
      from: el.querySelector('.from').value,
      to: el.querySelector('.to').value,
    }));
  }

  // ── Import from .ics ─────────────────────────────────────────────
  let _import = null;   // { start, end, periods } of the file being imported
  const fmtDate = (iso) => { const p = SchoolUtils.parse(iso); return p ? new Date(p.y, p.m, p.d).toLocaleDateString(I18n.currentLang() === 'en' ? 'en-GB' : 'it-IT', { day: 'numeric', month: 'short', year: 'numeric' }) : iso; };

  async function importIcs() {
    const res = await window.api.icsOpen();
    if (!res || !res.ok) {
      if (res && res.error) document.getElementById('school-error').textContent = I18n.t('icsImportError');
      return;
    }
    const events = Ics.parse(res.text);
    if (!events.length) { document.getElementById('school-error').textContent = I18n.t('icsImportError'); return; }
    _import = Ics.schoolFromEvents(events, _year);
    const n = _import.periods.length + (_import.start ? 1 : 0) + (_import.end ? 1 : 0);
    const body = document.getElementById('ics-import-body');
    if (!n) {
      body.innerHTML = `<p class="hint">${escapeHtml(I18n.t('icsImportNone'))}</p>`;
    } else {
      const dates = _import.start && _import.end
        ? `<label class="set-check"><input type="checkbox" id="ics-imp-dates" checked> ${escapeHtml(I18n.tf('icsImportDates', fmtDate(_import.start), fmtDate(_import.end)))}</label>` : '';
      body.innerHTML = `
        <p class="hint"><strong>${escapeHtml(res.name || '')}</strong>: ${escapeHtml(I18n.tf('icsImportFound', n, _year))}</p>
        ${dates}
        <p class="hint">${escapeHtml(I18n.t('icsImportHint'))}</p>
        <div class="ics-imp-tools"><button class="btn-sm" id="ics-imp-all">${escapeHtml(I18n.t('icsImportAll'))}</button><button class="btn-sm" id="ics-imp-none">${escapeHtml(I18n.t('icsImportNoneSel'))}</button></div>
        <div class="ics-imp-list">${_import.periods.map((p, i) => `
          <label class="ics-imp-row"><input type="checkbox" data-i="${i}" ${p.suggested ? 'checked' : ''}>
            <span class="ics-imp-name">${escapeHtml(p.name || '—')}</span>
            <span class="ics-imp-when">${escapeHtml(p.from === p.to ? fmtDate(p.from) : `${fmtDate(p.from)} → ${fmtDate(p.to)}`)}</span></label>`).join('')}
        </div>`;
      const all = (v) => body.querySelectorAll('.ics-imp-list input').forEach(c => { c.checked = v; });
      document.getElementById('ics-imp-all').addEventListener('click', () => all(true));
      document.getElementById('ics-imp-none').addEventListener('click', () => all(false));
    }
    document.getElementById('ics-import-add').disabled = !n;
    document.getElementById('modal-ics-import').classList.remove('hidden');
  }

  function addImported() {
    if (!_import) return;
    readRows();
    const dates = document.getElementById('ics-imp-dates');
    if (dates && dates.checked) {
      document.getElementById('school-start').value = _import.start;
      document.getElementById('school-end').value = _import.end;
    }
    // The suggested Christmas/Carnival/Easter rows, if still as proposed, give way to the school's dates.
    _rows = _rows.filter(r => !(_presets.has(r.id) && _presets.get(r.id) === `${r.name}|${r.from}|${r.to}`));
    _presets.clear();
    const have = new Set(_rows.map(r => `${r.from}|${r.to}`));
    document.querySelectorAll('#ics-import-body .ics-imp-list input:checked').forEach(c => {
      const p = _import.periods[+c.dataset.i];
      if (!p || have.has(`${p.from}|${p.to}`)) return;
      have.add(`${p.from}|${p.to}`);
      _rows.push({ id: newId(), name: p.name, from: p.from, to: p.to });
    });
    _rows.sort((a, b) => a.from.localeCompare(b.from));
    renderRows();
    _import = null;
    document.getElementById('modal-ics-import').classList.add('hidden');
  }

  async function persist(patch) {
    const s = SettingsManager.get();
    const school = { ...s.school, ...patch };
    SettingsManager.set({ school });
    await SettingsManager.save();
    // Settings open: keep the change also if Settings is then closed without saving.
    if (typeof _settingsSnapshot !== 'undefined' && _settingsSnapshot) _settingsSnapshot.school = JSON.parse(JSON.stringify(school));
    if (typeof renderSchoolBlock === 'function' && document.getElementById('school-block')) renderSchoolBlock(SettingsManager.get());
    App.refresh();
  }

  async function save() {
    readRows();
    const start = document.getElementById('school-start').value;
    const end = document.getElementById('school-end').value;
    const rows = _rows.filter(r => r.from || r.to);
    const bad = !SchoolUtils.validPeriod({ from: start, to: end }) || rows.some(r => !SchoolUtils.validPeriod(r));
    if (bad) { document.getElementById('school-error').textContent = I18n.t('periodInvalid'); return; }
    const sc = SettingsManager.get().school;
    const others = (sc.periods || []).filter(p => !inYear(p, _year));
    const periods = [...others, ...rows].sort((a, b) => SchoolUtils.isoStamp(a.from) - SchoolUtils.isoStamp(b.from));
    const years = { ...(sc.years || {}), [_year]: { start, end, saturday: document.getElementById('school-sat').checked } };
    await persist({ years, periods, enabled: true });
    close();
  }

  // "Don't use": no colours and no more automatic windows (can be switched on again in Settings).
  async function never() {
    await persist({ enabled: false, dismissed: { ...(SettingsManager.get().school.dismissed || {}), [_year]: true } });
    close();
  }

  function close() { document.getElementById('modal-school').classList.add('hidden'); }

  // At launch: from 1 September, once per school year, until answered.
  function maybePrompt(now = new Date()) {
    const Y = SchoolUtils.needsYearPrompt(SettingsManager.get().school, now);
    if (Y != null) open(Y, { auto: true });
    return Y != null;
  }

  function initListeners() {
    document.getElementById('school-save').addEventListener('click', save);
    document.getElementById('school-never').addEventListener('click', never);
    document.getElementById('school-later').addEventListener('click', close);   // asks again at the next launch
    document.getElementById('school-cancel').addEventListener('click', close);
    document.getElementById('ics-import-add').addEventListener('click', addImported);
  }

  return { open, maybePrompt, initListeners };
})();
