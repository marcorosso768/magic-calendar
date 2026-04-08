// views/calendar.js

// Stili per ciascun tipo di giorno (indice 0 = together, 1 = away, 2 = type3, 3 = type4)
const TYPE_STYLES = [
  { cellBg:'linear-gradient(160deg,#fdf4ff,#fae8ff)', cellBorder:'#d946ef', numColor:'#7c3aed', lblColor:'#9333ea', swatchBg:'#fdf4ff', swatchBorder:'#d946ef' },
  { cellBg:'linear-gradient(160deg,#fff0f3,#ffe4e6)', cellBorder:'#f43f5e', numColor:'#be123c', lblColor:'#be123c', swatchBg:'#fff0f3', swatchBorder:'#f43f5e' },
  { cellBg:'linear-gradient(160deg,#eff6ff,#dbeafe)', cellBorder:'#3b82f6', numColor:'#1d4ed8', lblColor:'#1d4ed8', swatchBg:'#eff6ff', swatchBorder:'#3b82f6' },
  { cellBg:'linear-gradient(160deg,#f0fdf4,#dcfce7)', cellBorder:'#22c55e', numColor:'#15803d', lblColor:'#15803d', swatchBg:'#f0fdf4', swatchBorder:'#22c55e' },
];

const CalView = (() => {
  let _editing = null;
  let _imgUrl  = '';
  let _curYear, _curMonth, _curCalKey, _curCalData;

  // ── Render ───────────────────────────────────────────────────────
  function render(year, month, calKey, calData) {
    _curYear = year; _curMonth = month; _curCalKey = calKey; _curCalData = calData;
    const s     = SettingsManager.get();
    const theme = SettingsManager.getTheme();
    const days  = calData?.days || {};

    const MONTHS = I18n.ta('months');
    const WDAYS  = I18n.ta('weekdays');

    const firstDow  = new Date(year, month, 1).getDay();
    const offset    = firstDow === 0 ? 6 : firstDow - 1;
    const daysCount = new Date(year, month + 1, 0).getDate();

    const cont = document.getElementById('view-monthly');
    cont.innerHTML = '';

    const page = document.createElement('div');
    page.className = 'cal-page';
    page.id = 'print-area';

    // Decorations
    const d = theme.decos;
    page.innerHTML = `
      <span class="deco-corner tl">${d.corners[0]}</span>
      <span class="deco-corner tr">${d.corners[1]}</span>
      <span class="deco-corner bl">${d.corners[2]}</span>
      <span class="deco-corner br">${d.corners[3]}</span>
      <div class="deco-strip top">${d.top.map(i=>`<span>${i}</span>`).join('')}</div>
      <div class="deco-strip bottom">${d.bottom.map(i=>`<span>${i}</span>`).join('')}</div>
      <div class="deco-strip left">${d.sides.map(i=>`<span>${i}</span>`).join('')}</div>
      <div class="deco-strip right">${[...d.sides].reverse().map(i=>`<span>${i}</span>`).join('')}</div>
    `;

    // Header
    const hdr = document.createElement('div');
    hdr.className = 'cal-header';
    hdr.innerHTML = `
      <div class="rainbow-bar"></div>
      <div class="cal-title">${theme.emoji} ${MONTHS[month]||''} ${year} ${theme.emoji}</div>
      <div class="cal-subtitle">${s.subtitle || I18n.t('defaultSubtitle')}</div>
    `;
    page.appendChild(hdr);

    // Legend — dinamica per tutti i tipi configurati
    const types = s.types || [];
    const leg = document.createElement('div');
    leg.className = 'cal-legend';
    leg.innerHTML = types.map((t, i) => {
      const st  = TYPE_STYLES[i] || TYPE_STYLES[0];
      let icon;
      if (t.mode === 'avatar_family') icon = makeFamilySVG(28, 28);
      else if (t.mode === 'avatar_heart') icon = makeHeartSVG(28, 28);
      else if (t.mode === 'photo') icon = t.photoUrl
        ? `<img src="${t.photoUrl}" style="width:28px;height:28px;object-fit:cover;border-radius:7px">`
        : `<span style="font-size:22px">📷</span>`;
      else icon = `<span style="font-size:22px;line-height:1">${t.emoji||'💜'}</span>`;
      return `
        <div class="legend-item">
          <div class="legend-swatch" style="background:${st.swatchBg};border:2px solid ${st.swatchBorder};display:flex;align-items:center;justify-content:center">${icon}</div>
          <div>${t.label||''}<br><small style="color:${st.lblColor}">${t.sub||''}</small></div>
        </div>`;
    }).join('');
    leg.querySelectorAll('.legend-item').forEach((el, i) => {
      el.classList.add('legend-item-editable');
      el.title = I18n.currentLang() === 'it' ? 'Modifica tipo' : 'Edit type';
      el.addEventListener('click', e => { e.stopPropagation(); _openQuickTypeEditor(i, el); });
    });
    if (types.length < 4) {
      const addBtn = document.createElement('button');
      addBtn.className = 'btn-sm legend-add-btn';
      addBtn.title = I18n.currentLang() === 'it' ? 'Aggiungi tipo' : 'Add type';
      addBtn.textContent = '+';
      addBtn.addEventListener('click', async e => {
        e.stopPropagation();
        const TYPE_KEYS = ['together','away','type3','type4'];
        const newIdx = types.length;
        const isIt = I18n.currentLang() === 'it';
        const allTypes = [...types, { key: TYPE_KEYS[newIdx] || `type${newIdx+1}`, emoji:'🌟', label: isIt ? `Tipo ${newIdx+1}` : `Type ${newIdx+1}`, sub:'', mode:'emoji' }];
        SettingsManager.set({ types: allTypes });
        await SettingsManager.save();
        const saved = await Storage.load(_curCalKey);
        App.renderMonthly(_curYear, _curMonth, _curCalKey, saved);
      });
      leg.appendChild(addBtn);
    }
    page.appendChild(leg);

    // Weekday headers
    const wdRow = document.createElement('div');
    wdRow.className = 'wdays';
    WDAYS.forEach((d, i) => {
      const el = document.createElement('div');
      el.className = `wd wd-${i}`;
      el.textContent = d;
      wdRow.appendChild(el);
    });
    page.appendChild(wdRow);

    // Days grid
    const grid = document.createElement('div');
    grid.className = 'days-grid';
    for (let i = 0; i < offset; i++) {
      const c = document.createElement('div');
      c.className = 'day-cell empty';
      grid.appendChild(c);
    }
    for (let day = 1; day <= daysCount; day++) {
      const dd   = days[day] || { type:'neutral' };
      const cell = buildCell(day, dd);
      cell.addEventListener('click', () => openEditor(day, dd, calKey, year, month));
      grid.appendChild(cell);
    }
    page.appendChild(grid);

    // Footer
    const foot = document.createElement('div');
    foot.className = 'cal-footer';
    foot.textContent = s.footer || I18n.t('defaultFooter');
    page.appendChild(foot);

    cont.appendChild(page);
  }

  // ── Build day cell ────────────────────────────────────────────────
  function buildCell(day, dd) {
    const cell = document.createElement('div');
    cell.className = `day-cell ${dd.type||'neutral'}`;

    const num = document.createElement('div');
    num.className = 'day-num';
    num.textContent = day;
    cell.appendChild(num);

    const wrap = document.createElement('div');
    const _s = SettingsManager.get();
    const _types = _s.types || [];
    const _typeDef = _types.find(t => t.key === dd.type);
    if (dd.image) {
      wrap.className = 'day-icon-wrap';
      const img = document.createElement('img');
      img.src = dd.image;
      wrap.appendChild(img);
    } else if (_typeDef) {
      if (_typeDef.mode === 'avatar_family') {
        wrap.className = 'day-icon-wrap';
        wrap.innerHTML = makeFamilySVG(40, 40);
      } else if (_typeDef.mode === 'avatar_heart') {
        wrap.className = 'day-icon-wrap';
        wrap.innerHTML = makeHeartSVG(40, 40);
      } else if (_typeDef.mode === 'photo') {
        wrap.className = 'day-icon-wrap';
        if (_typeDef.photoUrl) {
          wrap.innerHTML = `<img src="${_typeDef.photoUrl}" style="width:40px;height:40px;object-fit:cover;border-radius:7px">`;
        } else {
          wrap.className = 'day-icon-wrap emoji';
          wrap.textContent = '📷';
        }
      } else {
        wrap.className = 'day-icon-wrap emoji';
        wrap.textContent = _typeDef.emoji || '💜';
      }
    } else if (dd.icon) {
      wrap.className = 'day-icon-wrap emoji';
      wrap.textContent = dd.icon;
    } else {
      wrap.className = 'day-icon-wrap empty';
    }
    cell.appendChild(wrap);

    if (dd.type !== 'neutral' || dd.label) {
      const lbl = document.createElement('div');
      lbl.className = 'day-lbl';
      // Usa la label configurata per il tipo, o la label generica
      lbl.textContent = _typeDef ? _typeDef.label : (dd.label || '');
      cell.appendChild(lbl);
    }

    if (dd.note?.trim()) {
      const dot = document.createElement('div');
      dot.className = 'note-dot';
      cell.appendChild(dot);
    }

    return cell;
  }

  // Sostituisce emoji che Chromium non renderizza correttamente in stampa PDF
  function pdfSafe(str) {
    return (str || '')
      .replace(/❤️/g, '<span style="color:#f43f5e">♥</span>')
      .replace(/💜/g,  '<span style="color:#a855f7">♥</span>');
  }

  // ── Build print-ready HTML for PDF export ─────────────────────────
  // centered=true → calendario a dimensioni naturali centrato sulla pagina (deco su .cal-wrap)
  // centered=false → griglia si espande a riempire tutta la pagina (deco su .page)
  function buildPrintHTML(year, month, calKey, calData, landscape = false, centered = false) {
    const s     = SettingsManager.get();
    const theme = SettingsManager.getTheme();
    const days  = calData?.days || {};
    const MONTHS = I18n.ta('months');
    const WDAYS  = I18n.ta('weekdays');

    const types = s.types || [
      { key:'together', emoji:'💜', label:I18n.t('legendTogether'), sub:I18n.t('legendTogetherSub'), mode:'emoji' },
      { key:'away',     emoji:'❤️', label:I18n.t('legendAway'),    sub:I18n.t('legendAwaySub'),    mode:'emoji' },
    ];

    const firstDow  = new Date(year, month, 1).getDay();
    const offset    = firstDow === 0 ? 6 : firstDow - 1;
    const daysCount = new Date(year, month + 1, 0).getDate();

    // Build cells HTML
    let cellsHtml = '';
    for (let i = 0; i < offset; i++) {
      cellsHtml += `<div class="day-cell empty"></div>`;
    }
    for (let day = 1; day <= daysCount; day++) {
      const dd = days[day] || { type:'neutral' };
      let iconHtml = '';
      if (dd.image) {
        iconHtml = `<div class="day-icon-wrap"><img src="${dd.image}" style="width:40px;height:40px;object-fit:cover;border-radius:7px"></div>`;
      } else {
        const typeDef = types.find(t => t.key === dd.type);
        if (typeDef) {
          if (typeDef.mode === 'avatar_family') {
            iconHtml = `<div class="day-icon-wrap">${makeFamilySVG(40,40)}</div>`;
          } else if (typeDef.mode === 'avatar_heart') {
            iconHtml = `<div class="day-icon-wrap">${makeHeartSVG(40,40)}</div>`;
          } else if (typeDef.mode === 'photo') {
            iconHtml = typeDef.photoUrl
              ? `<div class="day-icon-wrap"><img src="${typeDef.photoUrl}" style="width:40px;height:40px;object-fit:cover;border-radius:7px"></div>`
              : `<div class="day-icon-wrap" style="font-size:28px;display:flex;align-items:center;justify-content:center;width:40px;height:40px">📷</div>`;
          } else {
            iconHtml = `<div class="day-icon-wrap" style="font-size:28px;display:flex;align-items:center;justify-content:center;width:40px;height:40px">${pdfSafe(typeDef.emoji||'💜')}</div>`;
          }
        }
      }
      if (!iconHtml) {
        if (dd.icon) {
          iconHtml = `<div class="day-icon-wrap emoji" style="font-size:24px;display:flex;align-items:center;justify-content:center;width:40px;height:40px">${dd.icon}</div>`;
        } else {
          iconHtml = `<div style="height:40px"></div>`;
        }
      }
      const _typeDef2 = types.find(t => t.key === dd.type);
      const _typeIdx2 = types.findIndex(t => t.key === dd.type);
      const _typeSt2  = TYPE_STYLES[_typeIdx2] || TYPE_STYLES[0];
      const lbl = _typeDef2 ? _typeDef2.label : (dd.label || '');
      const lblColor = _typeSt2?.lblColor || '#9333ea';
      const lblHtml = lbl ? `<div class="day-lbl" style="font-size:7px;font-weight:800;text-align:center;color:${lblColor}">${pdfSafe(lbl)}</div>` : '';
      cellsHtml += `<div class="day-cell ${dd.type||'neutral'}"><div class="day-num" style="font-size:11px;font-weight:900;margin-bottom:2px">${day}</div>${iconHtml}${lblHtml}</div>`;
    }

    const wdayHtml = WDAYS.map((wd,i) =>
      `<div class="wd wd-${i}" style="text-align:center;font-size:9px;font-weight:800;padding:4px 0;border-radius:6px">${wd}</div>`
    ).join('');

    const dk = theme.decos;
    const PAGE_W_MM = landscape ? '297mm' : '210mm';
    const PAGE_H_MM = landscape ? '210mm' : '297mm';

    // Deco HTML (corners + strips) — placed on .page (fit) or .cal-wrap (centered)
    const decoHtml = `
      <span class="deco-corner" style="top:6px;left:6px">${dk.corners[0]}</span>
      <span class="deco-corner" style="top:6px;right:6px">${dk.corners[1]}</span>
      <span class="deco-corner" style="bottom:6px;left:6px">${dk.corners[2]}</span>
      <span class="deco-corner" style="bottom:6px;right:6px">${dk.corners[3]}</span>
      <div class="deco-strip top">${dk.top.map(i=>`<span>${i}</span>`).join('')}</div>
      <div class="deco-strip bottom">${dk.bottom.map(i=>`<span>${i}</span>`).join('')}</div>
      <div class="deco-strip left">${dk.sides.map(i=>`<span>${i}</span>`).join('')}</div>
      <div class="deco-strip right">${[...dk.sides].reverse().map(i=>`<span>${i}</span>`).join('')}</div>`;

    const legendItemsHtml = types.map((t, i) => {
      const st   = TYPE_STYLES[i] || TYPE_STYLES[0];
      let icon;
      if (t.mode === 'avatar_family') icon = makeFamilySVG(26, 26);
      else if (t.mode === 'avatar_heart') icon = makeHeartSVG(26, 26);
      else if (t.mode === 'photo') icon = t.photoUrl
        ? `<img src="${t.photoUrl}" style="width:26px;height:26px;object-fit:cover;border-radius:7px">`
        : `<span style="font-size:18px">📷</span>`;
      else icon = `<span style="font-size:20px;line-height:1">${pdfSafe(t.emoji||'💜')}</span>`;
      return `<div class="legend-item">
        <div class="legend-swatch" style="background:${st.swatchBg} !important;border:2px solid ${st.swatchBorder} !important">${icon}</div>
        <div>${pdfSafe(t.label||'')}<br><small style="color:${st.lblColor}">${t.sub||''}</small></div>
      </div>`;
    }).join('');

    // CSS dinamico per tutti i tipi configurati
    const typesCss = types.map((t, i) => {
      const st = TYPE_STYLES[i] || TYPE_STYLES[0];
      return `.day-cell.${t.key}{background:${st.cellBg} !important;border:2px solid ${st.cellBorder} !important}
.${t.key} .day-num{color:${st.numColor}}.${t.key} .day-lbl{color:${st.lblColor}}`;
    }).join('\n');

    const innerHtml = `
      <div style="text-align:center;margin-bottom:10px;position:relative;z-index:1">
        <div class="rainbow-bar"></div>
        <div class="cal-title">${theme.emoji} ${MONTHS[month]||''} ${year} ${theme.emoji}</div>
        <div class="cal-subtitle">${s.subtitle||I18n.t('defaultSubtitle')}</div>
      </div>
      <div class="cal-legend">${legendItemsHtml}</div>
      <div class="wdays">${wdayHtml}</div>
      <div class="days-grid">${cellsHtml}</div>
      <div class="cal-footer">${pdfSafe(s.footer||I18n.t('defaultFooter'))}</div>`;

    // In centered mode: deco wraps the content block (.cal-wrap), .page just centers
    // In fit mode: deco is on .page itself (full bleed), grid stretches to fill
    const pageContent = centered
      ? `<div class="cal-wrap">${decoHtml}${innerHtml}</div>`
      : `${decoHtml}${innerHtml}`;

    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap');
@page{size:${PAGE_W_MM} ${PAGE_H_MM};margin:0}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Nunito',sans-serif;background:white;width:${PAGE_W_MM};height:${PAGE_H_MM}}
.page{width:${PAGE_W_MM};height:${PAGE_H_MM};background:white;display:flex;flex-direction:column;${centered?'padding:12px;justify-content:center;':'padding:32px 28px 36px;position:relative;overflow:hidden;'}}
.cal-wrap{position:relative;overflow:hidden;padding:28px 24px 32px;display:flex;flex-direction:column;${centered?'':'flex:1;'}}
.rainbow-bar{height:6px;border-radius:3px;width:200px;margin:0 auto 4px;background:linear-gradient(90deg,#f87171,#fb923c,#fbbf24,#4ade80,#60a5fa,#a78bfa,#f472b6);-webkit-print-color-adjust:exact;print-color-adjust:exact}
.cal-title{font-size:30px;font-weight:900;letter-spacing:2px;text-transform:uppercase;line-height:1;text-align:center;color:${theme.colors.primary};-webkit-print-color-adjust:exact;print-color-adjust:exact}
.cal-subtitle{font-size:11px;font-weight:700;color:${theme.colors.primary};margin-top:2px;letter-spacing:1px;text-align:center}
.cal-legend{display:flex;justify-content:center;gap:24px;margin:8px 0;align-items:center}
.legend-item{display:flex;align-items:center;gap:6px;font-size:10px;font-weight:700;color:#374151}
.legend-swatch{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;-webkit-print-color-adjust:exact;print-color-adjust:exact}
${typesCss}
.wdays{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:3px}
.wd{text-align:center;font-size:9px;font-weight:800;padding:4px 0;border-radius:6px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.days-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;${centered?'align-content:start':'flex:1;align-content:stretch'}}
.day-cell{border-radius:9px;padding:5px 3px 5px;display:flex;flex-direction:column;align-items:center;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.day-cell.empty{background:#f8f8f8 !important;border:1.5px dashed #ddd !important}
.day-cell.neutral{background:#f9fafb !important;border:1.5px solid #e5e7eb !important}
.day-cell.together{background:linear-gradient(160deg,#fdf4ff,#fae8ff) !important;border:2px solid #d946ef !important}
.day-cell.away{background:linear-gradient(160deg,#fff0f3,#ffe4e6) !important;border:2px solid #f43f5e !important}
.day-num{font-size:12px;font-weight:900;line-height:1;margin-bottom:3px}
.together .day-num{color:#7c3aed}.away .day-num{color:#be123c}.neutral .day-num{color:#9ca3af}.empty .day-num{color:#d1d5db}
.day-icon-wrap{width:44px;height:44px;display:flex;align-items:center;justify-content:center}
.day-icon-wrap img{width:100%;height:100%;object-fit:cover;border-radius:7px}
.day-lbl{font-size:8px;font-weight:800;text-align:center;line-height:1.2;padding:0 2px}
.together .day-lbl{color:#9333ea}.away .day-lbl{color:#be123c}
.cal-footer{text-align:center;font-size:9px;color:#a855f7;font-weight:700;letter-spacing:3px;margin-top:12px;padding-bottom:4px}
.deco-corner{position:absolute;font-size:22px;opacity:.6}
.deco-strip{position:absolute;display:flex;align-items:center;font-size:14px;opacity:.5}
.deco-strip.top{top:4px;left:36px;right:36px;flex-direction:row;justify-content:space-around}
.deco-strip.bottom{bottom:4px;left:36px;right:36px;flex-direction:row;justify-content:space-around}
.deco-strip.left{left:4px;top:36px;bottom:36px;flex-direction:column;justify-content:space-around}
.deco-strip.right{right:4px;top:36px;bottom:36px;flex-direction:column;justify-content:space-around}
.wd-0{color:#a855f7;background:#faf5ff !important}.wd-1{color:#ec4899;background:#fdf2f8 !important}
.wd-2{color:#f97316;background:#fff7ed !important}.wd-3{color:#eab308;background:#fefce8 !important}
.wd-4{color:#22c55e;background:#f0fdf4 !important}.wd-5{color:#3b82f6;background:#eff6ff !important}
.wd-6{color:#ef4444;background:#fff1f2 !important}
</style></head><body>
<div class="page">${pageContent}</div>
</body></html>`;
  }

  // ── Day editor ────────────────────────────────────────────────────
  async function openEditor(day, dd, calKey, year, month) {
    _editing = { day, calKey, year, month };
    _imgUrl  = dd.image || '';

    const MONTHS = I18n.ta('months');
    document.getElementById('modal-day-title').textContent =
      `${day} ${MONTHS[month]||''} ${year}`;

    // Type picker — dinamico
    const _s2 = SettingsManager.get();
    const _types2 = _s2.types || [];
    const typePicker = document.getElementById('day-type-picker');
    typePicker.innerHTML = '';
    [
      { type:'neutral', icon:'—', label: I18n.t('typeNone'), svgMode: null },
      ..._types2.map(t => ({
        type:     t.key,
        icon:     (t.mode === 'avatar_family' || t.mode === 'avatar_heart' || t.mode === 'photo') ? null : (t.emoji || '💜'),
        label:    t.label || t.key,
        svgMode:  t.mode === 'avatar_family' ? 'family' : t.mode === 'avatar_heart' ? 'heart' : t.mode === 'photo' ? 'photo' : null,
        photoUrl: t.photoUrl || null,
      })),
    ].forEach(opt => {
      const el = document.createElement('div');
      el.className = 'type-opt' + (dd.type === opt.type ? ' active' : '');
      el.dataset.type = opt.type;
      const iconDiv = document.createElement('div');
      iconDiv.className = 'type-icon';
      if (opt.svgMode === 'family') iconDiv.innerHTML = makeFamilySVG(28, 28);
      else if (opt.svgMode === 'heart') iconDiv.innerHTML = makeHeartSVG(28, 28);
      else if (opt.svgMode === 'photo') iconDiv.innerHTML = opt.photoUrl
        ? `<img src="${opt.photoUrl}" style="width:28px;height:28px;object-fit:cover;border-radius:7px">`
        : '📷';
      else iconDiv.textContent = opt.icon;
      el.appendChild(iconDiv);
      const lblEl = document.createElement('span');
      lblEl.textContent = opt.label;
      el.appendChild(lblEl);
      el.addEventListener('click', () => {
        typePicker.querySelectorAll('.type-opt').forEach(x => x.classList.remove('active'));
        el.classList.add('active');
        // Bug fix: cliccare "Nessuno" deseleziona anche l'icona attiva
        if (opt.type === 'neutral') {
          document.querySelectorAll('#day-icon-picker .icon-opt').forEach(x => x.classList.remove('active'));
        }
      });
      typePicker.appendChild(el);
    });

    // Icon picker — comprehensive emoji selector
    const iconPicker = document.getElementById('day-icon-picker');
    buildEmojiPicker(iconPicker, dd.icon || '');
    // Selecting any emoji resets the type picker to "Nessuno"
    iconPicker.addEventListener('click', e => {
      const opt = e.target.closest('.icon-opt');
      if (opt && opt.dataset.emoji) {
        typePicker.querySelectorAll('.type-opt').forEach(x =>
          x.classList.toggle('active', x.dataset.type === 'neutral')
        );
      }
    });

    _imgUrl = dd.image || '';
    const dayImgPickerEl = document.getElementById('day-img-picker');
    if (dayImgPickerEl) {
      await buildImagePicker(dayImgPickerEl, _imgUrl, url => { _imgUrl = url; });
    }
    document.getElementById('day-notes').value = dd.note || '';
    document.getElementById('modal-day').classList.remove('hidden');
  }

  // ── Quick type editor (from legend click) ────────────────────────
  let _qeType = null;

  function _openQuickTypeEditor(idx, anchorEl) {
    document.getElementById('qte-popup')?.remove();
    document.getElementById('qte-emoji-popup')?.remove();

    const types = SettingsManager.get().types || [];
    _qeType = { ...(types[idx] || {}) };

    const popup = document.createElement('div');
    popup.id = 'qte-popup';
    const rect = anchorEl.getBoundingClientRect();
    const top  = Math.min(rect.bottom + 6, window.innerHeight - 340);
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - 314));
    popup.style.cssText = `position:fixed;top:${top}px;left:${left}px;z-index:9000;background:var(--surface);border:1.5px solid var(--border);border-radius:12px;padding:14px;box-shadow:0 4px 24px rgba(0,0,0,.18);width:300px`;

    function rebuild() {
      popup.innerHTML = '';
      const isIt = I18n.currentLang() === 'it';
      const modeEmoji = !['avatar_family','avatar_heart','photo'].includes(_qeType.mode);

      const title = document.createElement('div');
      title.style.cssText = 'font-weight:700;font-size:13px;margin-bottom:10px;color:var(--text)';
      title.textContent = isIt ? `Modifica tipo ${idx+1}` : `Edit type ${idx+1}`;
      popup.appendChild(title);

      // Mode buttons
      const modeRow = document.createElement('div');
      modeRow.style.cssText = 'display:flex;gap:4px;margin-bottom:10px';
      [
        { mode:'emoji',         icon:'✏️', title:'Emoji' },
        { mode:'avatar_family', icon:'👨‍👩‍👧', title: isIt ? 'Avatar famiglia' : 'Family avatar' },
        { mode:'avatar_heart',  icon:'❤',  title: isIt ? 'Avatar cuore' : 'Heart avatar' },
        { mode:'photo',         icon:'📷', title: isIt ? 'Foto' : 'Photo' },
      ].forEach(({ mode, icon, title: t }) => {
        const isActive = mode === 'emoji' ? modeEmoji : _qeType.mode === mode;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-sm type-mode-btn' + (isActive ? ' active-mode' : '');
        btn.title = t; btn.textContent = icon;
        btn.addEventListener('click', () => { _qeType.mode = mode; rebuild(); });
        modeRow.appendChild(btn);
      });
      popup.appendChild(modeRow);

      // Icon area
      const iconRow = document.createElement('div');
      iconRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:10px';
      if (_qeType.mode === 'photo') {
        const openPicker = () => openImagePickerOverlay(_qeType.photoUrl || '', url => { _qeType.photoUrl = url; rebuild(); });
        if (_qeType.photoUrl) {
          const img = document.createElement('img');
          img.src = _qeType.photoUrl;
          img.style.cssText = 'width:36px;height:36px;object-fit:cover;border-radius:7px;cursor:pointer';
          img.addEventListener('click', openPicker);
          iconRow.appendChild(img);
        } else {
          const ph = document.createElement('div');
          ph.style.cssText = 'width:36px;height:36px;border:1.5px dashed var(--border);border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:20px;cursor:pointer';
          ph.textContent = '📷';
          ph.addEventListener('click', openPicker);
          iconRow.appendChild(ph);
        }
        const pb = document.createElement('button');
        pb.type = 'button'; pb.className = 'btn-sm'; pb.style.fontSize = '11px';
        pb.textContent = I18n.t('choosePhoto');
        pb.addEventListener('click', () => openImagePickerOverlay(_qeType.photoUrl || '', url => { _qeType.photoUrl = url; rebuild(); }));
        iconRow.appendChild(pb);
      } else if (modeEmoji) {
        const eb = document.createElement('button');
        eb.type = 'button'; eb.className = 'btn-sm type-emoji-btn';
        eb.style.cssText = 'width:44px;height:36px;font-size:20px;padding:2px';
        eb.textContent = _qeType.emoji || '💜';
        eb.title = isIt ? 'Scegli emoji' : 'Choose emoji';
        eb.addEventListener('click', e => {
          e.stopPropagation();
          document.getElementById('qte-emoji-popup')?.remove();
          const ep = document.createElement('div');
          ep.id = 'qte-emoji-popup';
          const r = eb.getBoundingClientRect();
          const et = Math.min(r.bottom + 4, window.innerHeight - 280);
          const el2 = Math.max(4, Math.min(r.left, window.innerWidth - 350));
          ep.style.cssText = `position:fixed;top:${et}px;left:${el2}px;z-index:10000;background:var(--surface);border:1.5px solid var(--border);border-radius:12px;padding:8px;box-shadow:0 4px 24px rgba(168,85,247,.3);width:340px;max-height:260px;overflow:hidden`;
          buildEmojiPicker(ep, _qeType.emoji || '', emoji => {
            if (emoji) { _qeType.emoji = emoji; ep.remove(); rebuild(); }
          });
          document.body.appendChild(ep);
          setTimeout(() => {
            function closeEP(ev) { if (!ep.contains(ev.target)) { ep.remove(); document.removeEventListener('click', closeEP); } }
            document.addEventListener('click', closeEP);
          }, 10);
        });
        iconRow.appendChild(eb);
      }
      popup.appendChild(iconRow);

      // Label
      const ll = document.createElement('label');
      ll.style.cssText = 'font-size:11px;color:var(--text-m);display:block;margin-bottom:2px';
      ll.textContent = isIt ? 'Etichetta' : 'Label';
      popup.appendChild(ll);
      const li = document.createElement('input');
      li.type = 'text'; li.className = 'set-inp'; li.value = _qeType.label || '';
      li.style.cssText = 'width:100%;margin-bottom:8px;box-sizing:border-box';
      li.addEventListener('input', () => { _qeType.label = li.value; });
      popup.appendChild(li);

      // Sub
      const sl = document.createElement('label');
      sl.style.cssText = 'font-size:11px;color:var(--text-m);display:block;margin-bottom:2px';
      sl.textContent = isIt ? 'Sottotitolo' : 'Subtitle';
      popup.appendChild(sl);
      const si = document.createElement('input');
      si.type = 'text'; si.className = 'set-inp'; si.value = _qeType.sub || '';
      si.style.cssText = 'width:100%;margin-bottom:14px;box-sizing:border-box';
      si.addEventListener('input', () => { _qeType.sub = si.value; });
      popup.appendChild(si);

      // Buttons
      const br = document.createElement('div');
      br.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:8px';
      // Delete (only types 3 & 4)
      if (idx >= 2) {
        const del = document.createElement('button');
        del.type = 'button'; del.className = 'btn-sm';
        del.style.cssText = 'background:#ef4444;color:#fff;font-weight:700';
        del.textContent = isIt ? '🗑 Elimina' : '🗑 Delete';
        del.addEventListener('click', async () => {
          const allTypes = [...(SettingsManager.get().types || [])];
          allTypes.splice(idx, 1);
          SettingsManager.set({ types: allTypes });
          await SettingsManager.save();
          popup.remove();
          document.getElementById('qte-emoji-popup')?.remove();
          const saved = await Storage.load(_curCalKey);
          App.renderMonthly(_curYear, _curMonth, _curCalKey, saved);
        });
        br.appendChild(del);
      } else {
        br.appendChild(document.createElement('span')); // spacer
      }
      const rightBtns = document.createElement('div');
      rightBtns.style.cssText = 'display:flex;gap:8px';
      const cancel = document.createElement('button');
      cancel.type = 'button'; cancel.className = 'btn-sm';
      cancel.textContent = isIt ? 'Annulla' : 'Cancel';
      cancel.addEventListener('click', () => { popup.remove(); document.getElementById('qte-emoji-popup')?.remove(); });
      const save = document.createElement('button');
      save.type = 'button'; save.className = 'btn-sm';
      save.style.cssText = 'background:var(--accent);color:#fff;font-weight:700';
      save.textContent = isIt ? 'Salva' : 'Save';
      save.addEventListener('click', async () => {
        const allTypes = [...(SettingsManager.get().types || [])];
        allTypes[idx] = { ..._qeType };
        SettingsManager.set({ types: allTypes });
        await SettingsManager.save();
        popup.remove();
        document.getElementById('qte-emoji-popup')?.remove();
        const saved = await Storage.load(_curCalKey);
        App.renderMonthly(_curYear, _curMonth, _curCalKey, saved);
      });
      rightBtns.appendChild(cancel); rightBtns.appendChild(save);
      br.appendChild(rightBtns);
      popup.appendChild(br);
    }

    rebuild();
    document.body.appendChild(popup);

    setTimeout(() => {
      function closeQTE(e) {
        const ep = document.getElementById('qte-emoji-popup');
        const ip = document.querySelector('.imgp-overlay');
        // e.target.closest funziona anche su elementi già rimossi dal DOM
        if (popup.contains(e.target)) return;
        if (ep?.contains(e.target)) return;
        if (ip?.contains(e.target)) return;
        if (e.target.closest?.('#qte-emoji-popup')) return; // emoji appena selezionata
        if (e.target.closest?.('.imgp-overlay')) return;
        popup.remove();
        ep?.remove();
        document.removeEventListener('click', closeQTE);
      }
      document.addEventListener('click', closeQTE);
    }, 10);
  }

  function initListeners() {
    document.getElementById('btn-day-save').addEventListener('click', async () => {
      if (!_editing) return;
      const { day, calKey, year, month } = _editing;

      const activeType = document.querySelector('#day-type-picker .type-opt.active');
      const activeIcon = document.querySelector('#day-icon-picker .icon-opt.active');
      const type  = activeType?.dataset.type || 'neutral';
      const icon  = (type === 'neutral' && activeIcon) ? (activeIcon.dataset.emoji||'') : '';
      const image = _imgUrl || '';
      const note  = document.getElementById('day-notes').value.trim();
      const _sTypes = SettingsManager.get()?.types || [];
      const _typeDef3 = _sTypes.find(t => t.key === type);
      const label = _typeDef3 ? _typeDef3.label
                  : icon      ? (SettingsManager.allIcons().find(x=>x.emoji===icon)?.label||'')
                  : '';

      let saved = await Storage.load(calKey) || { year, month, days:{} };
      saved.days = saved.days || {};
      saved.days[day] = { type, icon, image, note, label };
      await Storage.save(calKey, saved);

      document.getElementById('modal-day').classList.add('hidden');
      App.renderMonthly(year, month, calKey, saved);
    });
  }

  return { render, initListeners, buildPrintHTML };
})();

// ── SVG avatars ──────────────────────────────────────────────────
function makeFamilySVG(w, h) {
  return `<svg width="${w}" height="${h}" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 16 Q4 24 6 33 Q8 36 11 35 Q9 26 9 16Z" fill="#f7c948" stroke="#c9a020" stroke-width="0.6"/><path d="M16 16 Q18 24 16 33 Q14 36 11 35 Q13 26 13 16Z" fill="#f7c948" stroke="#c9a020" stroke-width="0.6"/><ellipse cx="6.5" cy="13" rx="3.2" ry="3.5" fill="#f7c948" stroke="#c9a020" stroke-width="0.8"/><ellipse cx="10" cy="10.5" rx="3" ry="3.3" fill="#f7c948" stroke="#c9a020" stroke-width="0.8"/><ellipse cx="14" cy="11" rx="2.8" ry="3" fill="#f7c948" stroke="#c9a020" stroke-width="0.8"/><ellipse cx="16.5" cy="13.5" rx="2.2" ry="2.5" fill="#f7c948" stroke="#c9a020" stroke-width="0.8"/><circle cx="11" cy="16.5" r="6" fill="#fde8d0" stroke="#1a1a1a" stroke-width="1.2"/><circle cx="8.5" cy="16" r="0.85" fill="#1a1a1a"/><circle cx="13.5" cy="16" r="0.85" fill="#1a1a1a"/><path d="M9 18.8 Q11 20.4 13 18.8" stroke="#1a1a1a" stroke-width="1" fill="none" stroke-linecap="round"/><path d="M5 26 Q11 23 17 26 L18 37 H4 Z" fill="#ef4444" stroke="#1a1a1a" stroke-width="1.1"/><path d="M21 33 Q19.5 39 21 46 Q23 49 25.5 48 Q24 41 24 33Z" fill="#f7c948" stroke="#c9a020" stroke-width="0.6"/><path d="M30 33 Q31.5 39 30 46 Q28 49 25.5 48 Q27 41 27 33Z" fill="#f7c948" stroke="#c9a020" stroke-width="0.6"/><ellipse cx="21" cy="30" rx="2.3" ry="2.6" fill="#f7c948" stroke="#c9a020" stroke-width="0.7"/><ellipse cx="24" cy="28.2" rx="2.2" ry="2.4" fill="#f7c948" stroke="#c9a020" stroke-width="0.7"/><ellipse cx="27.5" cy="28.8" rx="2" ry="2.2" fill="#f7c948" stroke="#c9a020" stroke-width="0.7"/><ellipse cx="29.5" cy="30.8" rx="1.7" ry="1.9" fill="#f7c948" stroke="#c9a020" stroke-width="0.7"/><circle cx="25.5" cy="34" r="5" fill="#fde8d0" stroke="#1a1a1a" stroke-width="1.1"/><circle cx="23.5" cy="33.5" r="0.72" fill="#1a1a1a"/><circle cx="27.5" cy="33.5" r="0.72" fill="#1a1a1a"/><path d="M24 36 Q25.5 37.5 27 36" stroke="#1a1a1a" stroke-width="0.85" fill="none" stroke-linecap="round"/><path d="M20.5 41 Q25.5 38.5 30.5 41 L31 51 H20 Z" fill="#f9a8d4" stroke="#1a1a1a" stroke-width="0.9"/><circle cx="43" cy="17.5" r="6" fill="#fde8d0" stroke="#1a1a1a" stroke-width="1.2"/><path d="M37.2 15.5 Q43 12 48.8 15.5 Q48 12 43 10.5 Q38 12 37.2 15.5Z" fill="#4a3520" stroke="#3a2810" stroke-width="0.7"/><path d="M40.5 12.5 Q41.5 8.5 43 7 Q44.5 8.5 45.5 12.5" fill="#4a3520" stroke="#3a2810" stroke-width="0.8"/><ellipse cx="43" cy="5.8" rx="3.2" ry="2.8" fill="#5a3e22" stroke="#3a2810" stroke-width="1"/><ellipse cx="43" cy="5.8" rx="1.6" ry="1.1" fill="none" stroke="#3a2810" stroke-width="0.7"/><path d="M37.5 20 Q43 26 48.5 20 Q48.5 23 43 24.5 Q37.5 23 37.5 20Z" fill="#6b4f2e" stroke="#4a3520" stroke-width="0.8"/><circle cx="40.5" cy="17" r="0.9" fill="#1a1a1a"/><circle cx="45.5" cy="17" r="0.9" fill="#1a1a1a"/><path d="M41.2 20 Q43 21.3 44.8 20" stroke="#1a1a1a" stroke-width="0.8" fill="none" stroke-linecap="round"/><path d="M37 27 Q43 24.5 49 27 L50 37 H36 Z" fill="#6366f1" stroke="#1a1a1a" stroke-width="1.1"/><path d="M27 22.5 C27 20 23.5 18 23.5 21 C23.5 23.5 27 26.5 27 26.5 C27 26.5 30.5 23.5 30.5 21 C30.5 18 27 20 27 22.5Z" fill="#ef4444"/></svg>`;
}

function makeHeartSVG(w, h) {
  return `<svg width="${w}" height="${h}" viewBox="0 0 54 54" fill="none"><path d="M3 52 Q22 42 27 30" stroke="#f43f5e" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M27 30 Q32 42 51 52" stroke="#f43f5e" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M27 30 C27 30 9 20 9 10.5 C9 5.5 13 3 18.5 4.5 C22 5.5 27 9.5 27 9.5 C27 9.5 32 5.5 35.5 4.5 C41 3 45 5.5 45 10.5 C45 20 27 30 27 30Z" fill="#f43f5e" stroke="#be123c" stroke-width="1.2"/><ellipse cx="18" cy="9" rx="3.5" ry="2" fill="white" opacity="0.22" transform="rotate(-30 18 9)"/></svg>`;
}
