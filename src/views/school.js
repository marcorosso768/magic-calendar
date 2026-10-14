// views/school.js — the "School year" window: first and last day of school, Saturday school, and the
// vacation periods (school holidays or family holidays). Opens by itself from 1 September for the new
// school year, and from Settings → School and holidays.

const SchoolView = (() => {
  let _year = null;      // school year being edited (named by the year it starts in)
  let _auto = false;     // opened by itself: "Later" and "Don't use" are offered
  let _rows = [];        // periods shown in the window: { id, name, from, to }

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
    if (!saved && !_rows.length) {
      _rows = sug.periods.map(p => ({ id: newId(), name: I18n.t(PRESET_NAMES[p.key]), from: p.from, to: p.to }));
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
      <button id="school-add" class="btn-sm">${escapeHtml(I18n.t('periodAdd'))}</button>
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
  }

  return { open, maybePrompt, initListeners };
})();
