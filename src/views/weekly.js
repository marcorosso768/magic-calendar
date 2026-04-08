// views/weekly.js

// ── Time format helper ─────────────────────────────────────────────
function _fmt(timeStr, fmt) {
  if (fmt !== '12h') return timeStr;
  const [hh, mm] = timeStr.split(':').map(Number);
  const period = hh < 12 ? 'AM' : 'PM';
  const h12 = hh % 12 || 12;
  return `${h12}:${String(mm).padStart(2, '0')} ${period}`;
}

const WeekView = (() => {
  let _offset   = 0;
  let _calKey   = null;
  let _weekData = {};
  let _editing  = null;
  let _routineMode = false; // true = routine (no dates), false = calendar settimana

  const WCOLORS = [
    {bg:'#faf5ff',border:'#a855f7',text:'#7c3aed'},
    {bg:'#fdf2f8',border:'#ec4899',text:'#be185d'},
    {bg:'#fff7ed',border:'#f97316',text:'#c2410c'},
    {bg:'#fefce8',border:'#eab308',text:'#92400e'},
    {bg:'#f0fdf4',border:'#22c55e',text:'#15803d'},
    {bg:'#eff6ff',border:'#3b82f6',text:'#1d4ed8'},
    {bg:'#fff1f2',border:'#ef4444',text:'#b91c1c'},
  ];

  function weekDates() {
    const now = new Date();
    const dow = now.getDay();
    const mon = new Date(now);
    mon.setDate(now.getDate() - (dow===0?6:dow-1) + _offset*7);
    return Array.from({length:7},(_,i) => {
      const d = new Date(mon);
      d.setDate(mon.getDate()+i);
      return d;
    });
  }

  function wkey(dates) {
    const d    = dates[0];
    const jan1 = new Date(d.getFullYear(),0,1);
    const wn   = Math.ceil((((d-jan1)/86400000)+jan1.getDay()+1)/7);
    return `${d.getFullYear()}-W${String(wn).padStart(2,'0')}`;
  }

  async function render(calKey) {
    _calKey = calKey;
    const saved  = await Storage.load(calKey);
    _weekData    = saved?.weeklyData || {};

    const s     = SettingsManager.get();
    const tf    = s.timeFormat || '24h';
    const theme = SettingsManager.getTheme();
    const WDAYS = I18n.ta('weekdays');
    const WDAYS_FULL = I18n.ta('weekdaysFull');

    // Routine mode key: always 'ROUTINE'
    const dates = _routineMode ? null : weekDates();
    const wk    = _routineMode ? 'ROUTINE' : wkey(dates);
    const data  = _weekData[wk] || { slots:{} };

    const cont = document.getElementById('view-weekly');

    // Title
    let titleStr = '';
    if (_routineMode) {
      titleStr = `📋 ${I18n.currentLang()==='it' ? 'Routine settimanale' : 'Weekly routine'}`;
    } else {
      const fmt = d => `${d.getDate()}/${d.getMonth()+1}`;
      titleStr = `🗓️ ${fmt(dates[0])} – ${fmt(dates[6])} ${dates[6].getFullYear()}`;
    }

    // Deco corners + strips
    const d = theme.decos;
    const decoHtml = `
      <span class="deco-corner tl">${d.corners[0]}</span>
      <span class="deco-corner tr">${d.corners[1]}</span>
      <span class="deco-corner bl">${d.corners[2]}</span>
      <span class="deco-corner br">${d.corners[3]}</span>
      <div class="deco-strip top">${d.top.map(i=>`<span>${i}</span>`).join('')}</div>
      <div class="deco-strip bottom">${d.bottom.map(i=>`<span>${i}</span>`).join('')}</div>
      <div class="deco-strip left">${d.sides.map(i=>`<span>${i}</span>`).join('')}</div>
      <div class="deco-strip right">${[...d.sides].reverse().map(i=>`<span>${i}</span>`).join('')}</div>
    `;

    cont.innerHTML = `
      <div class="week-page">
        ${decoHtml}
        <div class="week-nav">
          ${_routineMode ? '<div style="width:32px"></div>' : '<button class="arrow" id="wk-prev">‹</button>'}
          <h2>${titleStr}</h2>
          ${_routineMode ? '<div style="width:32px"></div>' : '<button class="arrow" id="wk-next">›</button>'}
          <div style="margin-left:auto;display:flex;gap:6px">
            <button class="btn-sm ${!_routineMode?'active-mode':''}" id="btn-mode-cal" style="${!_routineMode?'background:var(--bg);border-color:var(--primary);color:var(--primary)':''}">
              📅 ${I18n.currentLang()==='it'?'Settimana':'Week'}
            </button>
            <button class="btn-sm ${_routineMode?'active-mode':''}" id="btn-mode-routine" style="${_routineMode?'background:var(--bg);border-color:var(--primary);color:var(--primary)':''}">
              📋 ${I18n.currentLang()==='it'?'Routine':'Routine'}
            </button>
          </div>
        </div>
        <div class="week-grid" id="week-grid"></div>
      </div>
    `;

    if (!_routineMode) {
      document.getElementById('wk-prev').onclick = () => { _offset--; render(calKey); };
      document.getElementById('wk-next').onclick = () => { _offset++; render(calKey); };
    }
    document.getElementById('btn-mode-cal').onclick     = () => { _routineMode=false; render(calKey); };
    document.getElementById('btn-mode-routine').onclick = () => { _routineMode=true;  render(calKey); };

    const grid = document.getElementById('week-grid');

    // Corner cell
    grid.appendChild(document.createElement('div'));

    // Day headers
    for (let i = 0; i < 7; i++) {
      const c   = WCOLORS[i];
      const hdr = document.createElement('div');
      hdr.className = 'wk-col-hdr';
      hdr.style.cssText = `background:${c.bg};border:1.5px solid ${c.border};color:${c.text}`;
      if (_routineMode) {
        // Solo nome del giorno, senza data
        hdr.innerHTML = `<div style="font-size:11px;font-weight:800">${WDAYS[i]||''}</div>`;
      } else {
        const d = dates[i];
        hdr.innerHTML = `<div>${WDAYS[i]||''}</div><div style="font-size:10px;opacity:.7">${d.getDate()}/${d.getMonth()+1}</div>`;
      }
      grid.appendChild(hdr);
    }

    // Time slot rows
    s.timeslots.forEach(slot => {
      // Time label — mostra fascia completa: emoji + start–end
      const timeCell = document.createElement('div');
      timeCell.className = 'wk-time';
      timeCell.innerHTML = `
        <span class="t-emoji">${slot.emoji}</span>
        <span class="t-range">${_fmt(slot.start,tf)}–${_fmt(slot.end,tf)}</span>
        <span class="t-label">${slot.label}</span>
      `;
      grid.appendChild(timeCell);

      for (let di = 0; di < 7; di++) {
        const dayStr  = _routineMode
          ? `ROUTINE-${di}`
          : (() => { const d=dates[di]; return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; })();
        const slotKey = `${dayStr}|${slot.start}`;
        const cd      = data.slots[slotKey] || {};
        const filled  = !!(cd.icon || cd.label);

        const cell = document.createElement('div');
        cell.className = 'wk-cell' + (filled ? ' filled' : '');
        cell.innerHTML = filled
          ? `<span>${cd.icon||slot.emoji}</span><span class="wc-lbl">${cd.label||slot.label}</span>`
          : `<span class="wc-empty">${slot.emoji}</span>`;

        const dateObj = _routineMode ? null : dates[di];
        cell.addEventListener('click', () => openHourEditor(dateObj, di, slot, slotKey, cd, wk));
        grid.appendChild(cell);
      }
    });
  }

  function openHourEditor(date, dayIndex, slot, slotKey, cd, wk) {
    _editing = { slotKey, wk };
    const WDAYS = I18n.ta('weekdays');

    const dayLabel = _routineMode
      ? (WDAYS[dayIndex]||'')
      : `${WDAYS[dayIndex]||''} ${date.getDate()}/${date.getMonth()+1}`;

    const _tf2 = SettingsManager.get().timeFormat || '24h';
    document.getElementById('modal-hour-title').textContent =
      `${dayLabel} · ${_fmt(slot.start,_tf2)}–${_fmt(slot.end,_tf2)} ${slot.label}`;

    const picker = document.getElementById('hour-icon-picker');
    buildEmojiPicker(picker, cd.icon || '');

    document.getElementById('hour-label-inp').value = cd.label||'';
    document.getElementById('hour-notes').value     = cd.note ||'';
    document.getElementById('modal-hour').classList.remove('hidden');
  }

  function initListeners() {
    document.getElementById('btn-hour-save').addEventListener('click', async () => {
      if (!_editing) return;
      const { slotKey, wk } = _editing;

      const activeIcon = document.querySelector('#hour-icon-picker .icon-opt.active');
      const emoji  = activeIcon?.dataset.emoji || '';
      const label  = document.getElementById('hour-label-inp').value.trim();
      const note   = document.getElementById('hour-notes').value.trim();

      if (!_weekData[wk]) _weekData[wk] = { slots:{} };

      if (!emoji && !label) {
        delete _weekData[wk].slots[slotKey];
      } else {
        _weekData[wk].slots[slotKey] = { icon:emoji, label, note };
      }

      const existing = (await Storage.load(_calKey)) || {};
      existing.weeklyData = _weekData;
      await Storage.save(_calKey, existing);

      document.getElementById('modal-hour').classList.add('hidden');
      render(_calKey);
    });
  }

  // ── Build print-ready HTML for the weekly view ───────────────────
  function buildPrintHTML(landscape = false, centered = false) {
    const PAGE_W_MM = landscape ? '297mm' : '210mm';
    const PAGE_H_MM = landscape ? '210mm' : '297mm';

    const s     = SettingsManager.get();
    const _tf   = s.timeFormat || '24h';
    const theme = SettingsManager.getTheme();
    const dk    = theme.decos;
    const WDAYS = I18n.ta('weekdays');

    const dates = _routineMode ? null : weekDates();
    const wk    = _routineMode ? 'ROUTINE' : wkey(dates);
    const data  = _weekData[wk] || { slots:{} };

    let titleStr = '';
    if (_routineMode) {
      titleStr = I18n.currentLang() === 'it' ? 'Routine settimanale' : 'Weekly routine';
    } else {
      const fmt = d => `${d.getDate()}/${d.getMonth()+1}`;
      titleStr = `${fmt(dates[0])} – ${fmt(dates[6])} ${dates[6].getFullYear()}`;
    }

    // Colori colonne (stesso schema della vista settimanale)
    const WCOLS = [
      {bg:'#faf5ff',border:'#a855f7',text:'#7c3aed'},
      {bg:'#fdf2f8',border:'#ec4899',text:'#be185d'},
      {bg:'#fff7ed',border:'#f97316',text:'#c2410c'},
      {bg:'#fefce8',border:'#eab308',text:'#92400e'},
      {bg:'#f0fdf4',border:'#22c55e',text:'#15803d'},
      {bg:'#eff6ff',border:'#3b82f6',text:'#1d4ed8'},
      {bg:'#fff1f2',border:'#ef4444',text:'#b91c1c'},
    ];

    // Intestazioni giorni
    let hdrHtml = '<div></div>'; // cella angolo vuota
    for (let i = 0; i < 7; i++) {
      const c = WCOLS[i];
      const dayLabel = _routineMode
        ? WDAYS[i] || ''
        : `${WDAYS[i]||''} <span style="font-size:7px;opacity:.65">${dates[i].getDate()}/${dates[i].getMonth()+1}</span>`;
      hdrHtml += `<div style="-webkit-print-color-adjust:exact;print-color-adjust:exact;background:${c.bg};border:1.5px solid ${c.border};color:${c.text};text-align:center;padding:5px 3px;border-radius:7px;font-size:9px;font-weight:800">${dayLabel}</div>`;
    }

    // Righe fasce orarie
    let rowsHtml = '';
    s.timeslots.forEach(slot => {
      rowsHtml += `<div style="font-size:7px;font-weight:700;color:#9ca3af;display:flex;flex-direction:column;align-items:flex-end;justify-content:center;padding-right:5px;border-right:2px solid #e9d5ff;gap:1px">
        <span style="font-size:12px;line-height:1">${slot.emoji}</span>
        <span style="font-size:7px;font-weight:800;color:${theme.colors.primary};white-space:nowrap">${_fmt(slot.start,_tf)}–${_fmt(slot.end,_tf)}</span>
        <span style="font-size:7px;white-space:nowrap;max-width:58px;overflow:hidden;text-overflow:ellipsis">${slot.label}</span>
      </div>`;
      for (let di = 0; di < 7; di++) {
        const dayStr  = _routineMode
          ? `ROUTINE-${di}`
          : (() => { const d = dates[di]; return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; })();
        const slotKey = `${dayStr}|${slot.start}`;
        const cd      = data.slots[slotKey] || {};
        const filled  = !!(cd.icon || cd.label);
        const c       = WCOLS[di];
        if (filled) {
          rowsHtml += `<div style="-webkit-print-color-adjust:exact;print-color-adjust:exact;background:${c.bg};border:1.5px solid ${c.border};border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:3px 2px">
            <span style="font-size:15px;line-height:1">${cd.icon||slot.emoji}</span>
            <span style="font-size:7px;font-weight:800;color:${c.text};text-align:center;line-height:1.2;word-break:break-word">${cd.label||slot.label}</span>
          </div>`;
        } else {
          rowsHtml += `<div style="border:1.5px dashed ${c.border};border-radius:8px;display:flex;align-items:center;justify-content:center;opacity:.25;-webkit-print-color-adjust:exact;print-color-adjust:exact">
            <span style="font-size:13px">${slot.emoji}</span>
          </div>`;
        }
      }
    });

    // Deco frame — same as monthly calendar
    const decoHtml = `
      <span class="deco-corner" style="top:6px;left:6px">${dk.corners[0]}</span>
      <span class="deco-corner" style="top:6px;right:6px">${dk.corners[1]}</span>
      <span class="deco-corner" style="bottom:6px;left:6px">${dk.corners[2]}</span>
      <span class="deco-corner" style="bottom:6px;right:6px">${dk.corners[3]}</span>
      <div class="deco-strip top">${dk.top.map(i=>`<span>${i}</span>`).join('')}</div>
      <div class="deco-strip bottom">${dk.bottom.map(i=>`<span>${i}</span>`).join('')}</div>
      <div class="deco-strip left">${dk.sides.map(i=>`<span>${i}</span>`).join('')}</div>
      <div class="deco-strip right">${[...dk.sides].reverse().map(i=>`<span>${i}</span>`).join('')}</div>`;

    const innerHtml = `
      <div class="rainbow-bar"></div>
      <div class="title">${theme.emoji} ${titleStr} ${theme.emoji}</div>
      <div class="subtitle">${s.subtitle || I18n.t('defaultSubtitle')}</div>
      <div class="wk-grid">${hdrHtml}${rowsHtml}</div>`;

    // In centered mode: deco wraps content (.cal-wrap), .page just centers
    // In fit mode: deco on .page, grid stretches
    const pageContent = centered
      ? `<div class="cal-wrap">${decoHtml}${innerHtml}</div>`
      : `${decoHtml}${innerHtml}`;

    const gridFlex = centered ? '' : 'flex:1;';

    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap');
@page{size:${PAGE_W_MM} ${PAGE_H_MM};margin:0}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Nunito',sans-serif;background:white;width:${PAGE_W_MM};height:${PAGE_H_MM}}
.page{width:${PAGE_W_MM};height:${PAGE_H_MM};background:white;display:flex;flex-direction:column;${centered?'padding:12px;justify-content:center;':'padding:28px 24px 28px;position:relative;overflow:hidden;'}}
.cal-wrap{position:relative;overflow:hidden;padding:22px 20px 24px;display:flex;flex-direction:column;}
.rainbow-bar{height:5px;border-radius:3px;width:180px;margin:0 auto 6px;background:linear-gradient(90deg,#f87171,#fb923c,#fbbf24,#4ade80,#60a5fa,#a78bfa,#f472b6);-webkit-print-color-adjust:exact;print-color-adjust:exact}
.title{font-size:20px;font-weight:900;color:${theme.colors.primary};text-align:center;margin-bottom:2px;letter-spacing:1px}
.subtitle{font-size:9px;color:${theme.colors.primary};text-align:center;margin-bottom:10px;letter-spacing:.5px;font-weight:700}
.wk-grid{display:grid;grid-template-columns:68px repeat(7,1fr);gap:3px;${gridFlex}}
.deco-corner{position:absolute;font-size:22px;opacity:.6}
.deco-strip{position:absolute;display:flex;align-items:center;font-size:14px;opacity:.5}
.deco-strip.top{top:4px;left:36px;right:36px;flex-direction:row;justify-content:space-around}
.deco-strip.bottom{bottom:4px;left:36px;right:36px;flex-direction:row;justify-content:space-around}
.deco-strip.left{left:4px;top:36px;bottom:36px;flex-direction:column;justify-content:space-around}
.deco-strip.right{right:4px;top:36px;bottom:36px;flex-direction:column;justify-content:space-around}
</style></head><body>
<div class="page">${pageContent}</div>
</body></html>`;
  }

  function getExportFilename() {
    if (_routineMode) return I18n.currentLang() === 'it' ? 'Routine_settimanale' : 'Weekly_routine';
    const dates = weekDates();
    const d0 = dates[0];
    return `Settimana_${d0.getDate()}-${d0.getMonth()+1}-${d0.getFullYear()}`;
  }

  return { render, initListeners, buildPrintHTML, getExportFilename };
})();
