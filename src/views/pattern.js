// views/pattern.js — "Weekly pattern": a type for each day of the week (optionally two alternating
// weeks), applied to the month on screen or to a period. One undoable step (DayOps).

const PatternView = (() => {
  let _year, _month;

  const pad = (n) => String(n).padStart(2, '0');
  const toInput = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
  const fromInput = (v) => { const [y, m, d] = String(v).split('-').map(Number); return (y && m && d) ? { year: y, month: m - 1, day: d } : null; };

  function typeOptions(selected) {
    const types = SettingsManager.get().types || [];
    const opts = [{ v: '', l: I18n.t('patternKeep') }, { v: 'neutral', l: I18n.t('typeNone') }, ...types.map(t => ({ v: t.key, l: t.label || t.key }))];
    return opts.map(o => `<option value="${escapeHtml(o.v)}" ${o.v === selected ? 'selected' : ''}>${escapeHtml(o.l)}</option>`).join('');
  }

  function weekRow(id, label) {
    const cells = Array.from({ length: 7 }, (_, i) => `<select class="pat-sel" data-week="${id}" data-wd="${i}">${typeOptions('')}</select>`).join('');
    return `<div class="pat-row" id="pat-row-${id}"><div class="pat-row-label">${escapeHtml(label)}</div>${cells}</div>`;
  }

  function open(year, month) {
    _year = year; _month = month;
    const WD = I18n.ta('weekdays');
    const last = new Date(year, month + 1, 0).getDate();
    const firstMonday = (() => { for (let d = 1; d <= 7; d++) if (new Date(year, month, d).getDay() === 1) return d; return 1; })();
    document.getElementById('pattern-body').innerHTML = `
      <p class="hint">${escapeHtml(I18n.t('patternHint'))}</p>
      <div class="pat-grid">
        <div class="pat-row pat-head"><div class="pat-row-label"></div>${WD.map(d => `<div>${escapeHtml(d)}</div>`).join('')}</div>
        ${weekRow('A', I18n.t('patternWeekA'))}
        ${weekRow('B', I18n.t('patternWeekB'))}
      </div>
      <label class="pat-check"><input type="checkbox" id="pat-alt"> ${escapeHtml(I18n.t('patternAlternate'))}</label>
      <div id="pat-alt-opts" class="pat-line">
        <span>${escapeHtml(I18n.t('patternAnchor'))}</span>
        <input type="date" id="pat-anchor" value="${toInput(year, month, firstMonday)}">
      </div>
      <div class="field-label">${escapeHtml(I18n.t('patternPeriod'))}</div>
      <label class="pat-check"><input type="radio" name="pat-period" value="month" checked> ${escapeHtml(I18n.tf('patternThisMonth', `${I18n.ta('months')[month]} ${year}`))}</label>
      <label class="pat-check"><input type="radio" name="pat-period" value="range"> ${escapeHtml(I18n.t('patternRange'))}
        <input type="date" id="pat-from" value="${toInput(year, month, 1)}"> → <input type="date" id="pat-to" value="${toInput(year, month, last)}">
      </label>
      <p id="pat-preview" class="pat-preview"></p>
    `;
    document.getElementById('modal-pattern').classList.remove('hidden');
    refresh();
  }

  // Reads the form: { weekA, weekB, anchor, from, to } or { error }.
  function readForm() {
    const week = (id) => [...document.querySelectorAll(`.pat-sel[data-week="${id}"]`)].sort((a, b) => a.dataset.wd - b.dataset.wd).map(s => s.value || null);
    const alt = document.getElementById('pat-alt').checked;
    const period = document.querySelector('input[name="pat-period"]:checked')?.value;
    let from, to;
    if (period === 'range') {
      from = fromInput(document.getElementById('pat-from').value);
      to = fromInput(document.getElementById('pat-to').value);
      if (!from || !to) return { error: I18n.t('patternBadDates') };
      if (CalUtils.stamp(to.year, to.month, to.day) < CalUtils.stamp(from.year, from.month, from.day)) return { error: I18n.t('patternBadDates') };
      if (CalUtils.daysBetween(new Date(from.year, from.month, from.day), new Date(to.year, to.month, to.day)) > 400) return { error: I18n.t('patternTooLong') };
    } else {
      from = { year: _year, month: _month, day: 1 };
      to = { year: _year, month: _month, day: new Date(_year, _month + 1, 0).getDate() };
    }
    const weekA = week('A'), weekB = alt ? week('B') : null;
    if (!weekA.some(Boolean) && !(weekB && weekB.some(Boolean))) return { error: I18n.t('patternEmpty') };
    return { weekA, weekB, from, to, anchor: alt ? fromInput(document.getElementById('pat-anchor').value) : null };
  }

  // Groups the target days by month: [{ year, month, items: [{ day, type }] }]
  function byMonth(days) {
    const map = new Map();
    for (const d of days) {
      const k = `${d.year}-${d.month}`;
      if (!map.has(k)) map.set(k, { year: d.year, month: d.month, items: [] });
      map.get(k).items.push(d);
    }
    return [...map.values()];
  }

  let _seq = 0;
  async function refresh() {
    const alt = document.getElementById('pat-alt').checked;
    document.getElementById('pat-row-B').classList.toggle('hidden', !alt);
    document.getElementById('pat-alt-opts').classList.toggle('hidden', !alt);
    document.getElementById('pat-row-A').querySelector('.pat-row-label').textContent = alt ? I18n.t('patternWeekA') : I18n.t('patternEveryWeek');
    const prev = document.getElementById('pat-preview');
    const btn = document.getElementById('btn-pattern-apply');
    const f = readForm();
    if (f.error) { prev.textContent = f.error; btn.disabled = true; return; }
    const seq = ++_seq;
    const months = byMonth(CalUtils.patternDays(f));
    let changes = 0, skipped = [];
    for (const m of months) {
      const key = await App.calendarFor(m.year, m.month, { create: false });
      if (key === null) { skipped.push(`${I18n.ta('months')[m.month]} ${m.year}`); continue; }
      const days = key ? ((await Storage.load(key))?.days || {}) : {};
      for (const it of m.items) {
        const cur = days[it.day]?.type || 'neutral';
        if (cur !== it.type) changes++;
      }
    }
    if (seq !== _seq) return;
    prev.textContent = I18n.tf('patternPreview', changes, months.length - skipped.length)
      + (skipped.length ? ` ${I18n.tf('patternSkipped', skipped.join(', '))}` : '');
    btn.disabled = changes === 0;
  }

  async function apply() {
    const f = readForm();
    if (f.error) return;
    document.getElementById('modal-pattern').classList.add('hidden');
    const types = SettingsManager.get().types || [];
    const all = [];
    for (const m of byMonth(CalUtils.patternDays(f))) {
      const key = await App.calendarFor(m.year, m.month, { create: true });
      if (!key) continue;                                    // several calendars that month: skipped
      const days = (await Storage.load(key))?.days || {};
      for (const it of m.items) {
        const before = days[it.day] || null;
        const icon = before && before.icon;
        const label = it.type === 'neutral'
          ? (icon ? (SettingsManager.allIcons().find(x => x.emoji === icon)?.label || '') : '')
          : (types.find(t => t.key === it.type)?.label || '');
        all.push({ calKey: key, day: it.day, before, after: CalUtils.setDayType(before, it.type, label) });
      }
    }
    await DayOps.apply(all);
  }

  function initListeners() {
    document.getElementById('btn-pattern-apply').addEventListener('click', apply);
    const body = document.getElementById('pattern-body');
    body.addEventListener('change', refresh);
    body.addEventListener('input', refresh);
  }

  return { open, initListeners };
})();
