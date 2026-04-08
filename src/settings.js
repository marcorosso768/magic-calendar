// settings.js

const THEMES = [
  { id:'unicorni',    emoji:'🦄', colors:{ primary:'#a855f7',secondary:'#ec4899',accent:'#f97316',bg:'#fdf4ff',border:'#e9d5ff' }, gradient:'linear-gradient(135deg,#c084fc,#a855f7,#6d28d9)', decos:{ corners:['🦄','🦄','🦄','🦄'], top:['🌟','✦','🦄','✧','✨','✦','🦄','✧','🌟'], bottom:['⭐','✧','🦄','✦','🌟','✧','🦄','✦','⭐'], sides:['🌟','✦','🦄','✧','⭐','✦','🦄','✧','🌟','✦','🦄','✧','⭐','✦','🦄'] } },
  { id:'dinosauri',   emoji:'🦕', colors:{ primary:'#16a34a',secondary:'#65a30d',accent:'#ca8a04',bg:'#f0fdf4',border:'#bbf7d0' }, gradient:'linear-gradient(135deg,#16a34a,#65a30d,#ca8a04)', decos:{ corners:['🦕','🦖','🦕','🦖'], top:['🌿','🦴','🦕','🌿','⚡','🌿','🦖','🦴','🌿'], bottom:['🦴','🌿','🦖','⚡','🦕','🌿','🦴','🌿','🦖'], sides:['🌿','🦴','🦕','⚡','🌿','🦖','🦴','🌿','🦕','⚡','🌿','🦴','🦖','🌿','🦕'] } },
  { id:'macchinine',  emoji:'🚗', colors:{ primary:'#2563eb',secondary:'#dc2626',accent:'#f59e0b',bg:'#eff6ff',border:'#bfdbfe' }, gradient:'linear-gradient(135deg,#2563eb,#dc2626,#f59e0b)', decos:{ corners:['🏎️','🚗','🏎️','🚗'], top:['🚗','⭐','🏎️','🚦','🚗','⭐','🏁','🚦','🚗'], bottom:['🏁','🚦','🚗','⭐','🏎️','🚦','🚗','⭐','🏁'], sides:['🚗','🚦','🏎️','⭐','🏁','🚦','🚗','⭐','🏎️','🚦','🏁','⭐','🚗','🚦','🏎️'] } },
  { id:'spazio',      emoji:'🚀', colors:{ primary:'#6366f1',secondary:'#8b5cf6',accent:'#f59e0b',bg:'#fafafe',border:'#c7d2fe' }, gradient:'linear-gradient(135deg,#6366f1,#8b5cf6,#f59e0b)', decos:{ corners:['🚀','🌙','🚀','🌙'], top:['⭐','🌙','🚀','💫','🪐','✨','🚀','🌙','⭐'], bottom:['🪐','💫','🌙','⭐','🚀','💫','🌙','⭐','🪐'], sides:['⭐','🌙','🚀','💫','🪐','✨','🌙','⭐','🚀','💫','🪐','✨','⭐','🌙','🚀'] } },
  { id:'principesse', emoji:'👸', colors:{ primary:'#db2777',secondary:'#9333ea',accent:'#f59e0b',bg:'#fff0f6',border:'#fbcfe8' }, gradient:'linear-gradient(135deg,#db2777,#9333ea,#f59e0b)', decos:{ corners:['👸','👑','👸','👑'], top:['👑','💎','👸','✨','🌸','💎','👸','✨','👑'], bottom:['🌸','✨','👑','💎','👸','✨','👑','💎','🌸'], sides:['👑','💎','👸','✨','🌸','💎','👑','✨','👸','💎','🌸','✨','👑','💎','👸'] } },
  { id:'mare',        emoji:'🐠', colors:{ primary:'#0891b2',secondary:'#0284c7',accent:'#f59e0b',bg:'#ecfeff',border:'#a5f3fc' }, gradient:'linear-gradient(135deg,#0891b2,#0284c7,#f59e0b)', decos:{ corners:['🐠','🐚','🐠','🐚'], top:['🐠','🌊','🐟','🐚','🦀','🌊','🐠','🐟','🐚'], bottom:['🐚','🦀','🌊','🐠','🐟','🌊','🐚','🦀','🐠'], sides:['🌊','🐠','🐟','🐚','🦀','🌊','🐠','🐚','🐟','🦀','🌊','🐠','🐟','🐚','🦀'] } },
  { id:'foresta',     emoji:'🦊', colors:{ primary:'#92400e',secondary:'#15803d',accent:'#ca8a04',bg:'#fef9f0',border:'#fde68a' }, gradient:'linear-gradient(135deg,#92400e,#15803d,#ca8a04)', decos:{ corners:['🦊','🌳','🦊','🌳'], top:['🌳','🦔','🦊','🍄','🌿','🦔','🦊','🌳','🍄'], bottom:['🍄','🌿','🌳','🦔','🦊','🌿','🍄','🌳','🦔'], sides:['🌳','🦔','🦊','🍄','🌿','🌳','🦔','🍄','🦊','🌿','🌳','🦔','🌿','🍄','🦊'] } },
  { id:'supereroi',   emoji:'🦸', colors:{ primary:'#1d4ed8',secondary:'#dc2626',accent:'#f59e0b',bg:'#eff6ff',border:'#bfdbfe' }, gradient:'linear-gradient(135deg,#1d4ed8,#dc2626,#f59e0b)', decos:{ corners:['🦸','⚡','🦸','⚡'], top:['⚡','🦸','💥','⭐','🦸','💥','⚡','🦸','⭐'], bottom:['💥','⭐','🦸','⚡','💥','🦸','⭐','⚡','💥'], sides:['⚡','🦸','💥','⭐','⚡','🦸','💥','⭐','⚡','🦸','💥','⭐','⚡','🦸','💥'] } },
  { id:'fiori',       emoji:'🌸', colors:{ primary:'#be185d',secondary:'#16a34a',accent:'#ca8a04',bg:'#fff0f6',border:'#fbcfe8' }, gradient:'linear-gradient(135deg,#be185d,#16a34a,#ca8a04)', decos:{ corners:['🌸','🌻','🌸','🌻'], top:['🌸','🌺','🌻','🌼','🦋','🌺','🌸','🌼','🌻'], bottom:['🌻','🦋','🌸','🌺','🌼','🦋','🌻','🌸','🌺'], sides:['🌸','🌺','🌻','🌼','🦋','🌸','🌺','🌼','🌻','🦋','🌸','🌺','🌼','🌻','🦋'] } },
  { id:'animali',     emoji:'🐮', colors:{ primary:'#b45309',secondary:'#15803d',accent:'#0891b2',bg:'#fffbeb',border:'#fde68a' }, gradient:'linear-gradient(135deg,#b45309,#15803d,#0891b2)', decos:{ corners:['🐮','🐷','🐮','🐷'], top:['🐮','🐔','🐷','🐑','🐄','🐔','🐮','🐑','🐷'], bottom:['🐑','🐷','🐮','🐔','🐄','🐷','🐑','🐮','🐔'], sides:['🐮','🐔','🐷','🐑','🐄','🐮','🐔','🐑','🐷','🐄','🐮','🐔','🐷','🐑','🐄'] } },
  { id:'sport',       emoji:'⚽', colors:{ primary:'#15803d',secondary:'#1d4ed8',accent:'#dc2626',bg:'#f0fdf4',border:'#bbf7d0' }, gradient:'linear-gradient(135deg,#15803d,#1d4ed8,#dc2626)', decos:{ corners:['⚽','🏆','⚽','🏆'], top:['⚽','🏀','🎾','🏆','⚽','🥇','🏀','🎾','🏆'], bottom:['🏆','🎾','🏀','⚽','🥇','🏆','🎾','⚽','🏀'], sides:['⚽','🏀','🎾','🏆','🥇','⚽','🏀','🏆','🎾','🥇','⚽','🏀','🎾','🏆','⚽'] } },
  { id:'musica',      emoji:'🎵', colors:{ primary:'#7c3aed',secondary:'#db2777',accent:'#f59e0b',bg:'#faf5ff',border:'#ddd6fe' }, gradient:'linear-gradient(135deg,#7c3aed,#db2777,#f59e0b)', decos:{ corners:['🎵','🎸','🎵','🎸'], top:['🎵','🎸','🎹','🎺','🎵','🎻','🥁','🎸','🎵'], bottom:['🎹','🥁','🎵','🎸','🎺','🎵','🎹','🎸','🥁'], sides:['🎵','🎸','🎹','🎺','🎻','🥁','🎵','🎸','🎹','🎺','🎵','🎻','🎸','🥁','🎵'] } },
  { id:'giungla',    emoji:'🦁', colors:{ primary:'#c47a0a',secondary:'#15803d',accent:'#dc2626',bg:'#fef9eb',border:'#fde68a' }, gradient:'linear-gradient(135deg,#c47a0a,#15803d,#dc2626)', decos:{ corners:['🦁','🐘','🦒','🦓'], top:['🦁','🌴','🐘','🌿','🦒','🌴','🐆','🌿','🦓'], bottom:['🐍','🌿','🦜','🌴','🦏','🌿','🐒','🌴','🐦'], sides:['🌿','🦁','🌴','🐘','🌿','🦒','🌴','🐆','🌿','🦓','🌴','🐒','🌿','🦜','🌴'] } },
];

const BUILTIN_EMOJIS = [
  '🏠','❤️','⭐','🎒','⚽','🏊','🎨','🎵','📚','🌳',
  '✈️','🎉','🏖️','⛷️','🎭','🍕','🎠','💊','😴','🌙',
  '👨‍👩‍👧','🎮','🚴','🏃','🍦','🎬','📱','🐶',
];

function getBuiltinIcons() {
  const labels = I18n.to('iconLabels');
  return BUILTIN_EMOJIS.map(e => ({ emoji:e, label: labels[e] || e }));
}

// Defaults costruiti con i18n già inizializzato
function makeDefaults() {
  return {
    themeId:     'unicorni',
    subtitle:    I18n.t('defaultSubtitle'),
    footer:      I18n.t('defaultFooter'),
    language:    'auto',
    darkMode:    'auto',
    timeslots:   I18n.ta('timeslotDefaults').map(s => ({...s})),
    customIcons: [],
    timeFormat:  '24h',
    themeSelectionCompleted: false,
    types: [
      { key:'together', emoji:'💜', label:I18n.t('legendTogether'), sub:I18n.t('legendTogetherSub'), mode:'avatar_family' },
      { key:'away',     emoji:'❤️', label:I18n.t('legendAway'),    sub:I18n.t('legendAwaySub'),    mode:'avatar_heart'  },
    ],
  };
}

// ── Dark mode ─────────────────────────────────────────────────────
const _darkMq = window.matchMedia('(prefers-color-scheme: dark)');

function applyDarkModeClass(mode) {
  const html = document.documentElement;
  if (mode === 'dark') {
    html.classList.add('dark');
  } else if (mode === 'light') {
    html.classList.remove('dark');
  } else { // auto
    html.classList.toggle('dark', _darkMq.matches);
  }
  // Sincronizza icona dock con il tema effettivo (non solo il sistema macOS)
  const isDark = html.classList.contains('dark');
  window.api?.setDockDark?.(isDark);
}

// Listener sistema per modalità auto
_darkMq.addEventListener('change', () => {
  const cur = SettingsManager?.get()?.darkMode || 'auto';
  if (cur === 'auto') applyDarkModeClass('auto');
});

const SettingsManager = (() => {
  let s = null;

  // Se subtitle/footer corrispondono a un default noto (in qualsiasi lingua),
  // li aggiorna automaticamente nella lingua corrente.
  function translateDefaultTexts(langCode) {
    if (!s) return;
    const tgt = TRANSLATIONS[langCode] || TRANSLATIONS.it;
    const allSubtitles = Object.values(TRANSLATIONS).map(t => t.defaultSubtitle).filter(Boolean);
    const allFooters   = Object.values(TRANSLATIONS).map(t => t.defaultFooter).filter(Boolean);
    if (allSubtitles.includes(s.subtitle)) {
      s.subtitle = tgt.defaultSubtitle;
      const el = document.getElementById('set-subtitle');
      if (el) el.value = s.subtitle;
    }
    if (allFooters.includes(s.footer)) {
      s.footer = tgt.defaultFooter;
      const el = document.getElementById('set-footer');
      if (el) el.value = s.footer;
    }
  }

  async function load() {
    // 1. Leggi impostazioni dal disco
    const saved = await Storage.loadSettings();

    // 2. Aggiorna la lingua PRIMA di costruire i defaults
    //    così subtitle/footer/timeslots usano la lingua giusta
    I18n.init(saved?.language);

    // 3. Merge: defaults (con lingua corretta) + saved
    const defaults = makeDefaults();
    s = { ...defaults, ...(saved || {}) };

    // 4. Se non ci sono timeslot salvati, usa quelli localizzati
    if (!saved?.timeslots || !saved.timeslots.length) {
      s.timeslots = defaults.timeslots;
    }

    // 4b. Migrazione: type1/type2 (schema precedente) → types[]
    if (!s.types && (s.type1 || s.type2)) {
      const t1 = s.type1 || {};
      const t2 = s.type2 || {};
      s.types = [
        { key:'together', emoji:t1.emoji||'💜', label:t1.label||I18n.t('legendTogether'), sub:t1.sub||I18n.t('legendTogetherSub'), mode:t1.mode||'avatar_family' },
        { key:'away',     emoji:t2.emoji||'❤️', label:t2.label||I18n.t('legendAway'),    sub:t2.sub||I18n.t('legendAwaySub'),    mode:t2.mode||'avatar_heart'  },
      ];
      delete s.type1; delete s.type2;
    }
    if (!s.types || !s.types.length) s.types = defaults.types;

    // 5. Auto-traduce subtitle/footer/types se ancora ai valori default
    translateDefaultTexts(I18n.currentLang());
    _translateDefaultTypes(I18n.currentLang());

    applyTheme();
    applyDarkModeClass(s.darkMode || 'auto');
  }

  async function save() {
    await Storage.saveSettings(s);
    applyTheme();
    applyDarkModeClass(s.darkMode || 'auto');
  }

  function get() {
    if (!s) s = makeDefaults(); // safety fallback
    return s;
  }

  function set(patch) { Object.assign(s, patch); }

  function getTheme() {
    return THEMES.find(t => t.id === s?.themeId) || THEMES[0];
  }

  function applyTheme() {
    const t = getTheme();
    const r = document.documentElement.style;
    r.setProperty('--primary',        t.colors.primary);
    r.setProperty('--secondary',      t.colors.secondary);
    r.setProperty('--accent',         t.colors.accent);
    r.setProperty('--bg',             t.colors.bg);
    r.setProperty('--border',         t.colors.border);
    r.setProperty('--title-gradient', t.gradient);
    const logo = document.getElementById('logo');
    if (logo) logo.childNodes[0].textContent = t.emoji + ' ';
  }

  function allIcons() {
    if (!s) return getBuiltinIcons();
    return [...getBuiltinIcons(), ...(s.customIcons || [])];
  }

  return { load, save, get, set, getTheme, applyTheme, allIcons, translateDefaultTexts, applyDarkMode: applyDarkModeClass };
})();

function renderThemeCards(grid, activeId, onSelect) {
  if (!grid) return;
  grid.innerHTML = '';
  const names = I18n.to('themeNames');
  THEMES.forEach(t => {
    const card = document.createElement('div');
    card.className = 'theme-card theme-card--preview' + (t.id === activeId ? ' active' : '');
    const label = (typeof names === 'object' && !Array.isArray(names)) ? (names[t.id] || t.id) : t.id;
    const topDeco = (t.decos?.top || []).slice(0, 3).join(' ');
    const sideDeco = (t.decos?.corners || [t.emoji]).slice(0, 2).join(' ');
    card.innerHTML = `
      <div class="theme-preview" style="--theme-gradient:${t.gradient};--theme-bg:${t.colors.bg};--theme-border:${t.colors.border};--theme-primary:${t.colors.primary};--theme-secondary:${t.colors.secondary};--theme-accent:${t.colors.accent};">
        <div class="theme-preview__top">${topDeco}</div>
        <div class="theme-preview__title"></div>
        <div class="theme-preview__grid">
          <span></span><span></span><span></span><span></span>
        </div>
        <div class="theme-preview__footer">${sideDeco}</div>
      </div>
      <span class="theme-card__label">${t.emoji} ${label}</span>`;
    card.addEventListener('click', () => {
      grid.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      onSelect(t.id);
    });
    grid.appendChild(card);
  });
}

async function openThemeWelcome() {
  const cur = SettingsManager.get();
  let selectedThemeId = cur.themeId || 'unicorni';
  const title = document.getElementById('welcome-theme-title');
  const subtitle = document.getElementById('welcome-theme-subtitle');
  const btn = document.getElementById('btn-theme-welcome-continue');
  if (title) title.textContent = I18n.t('welcomeThemeTitle');
  if (subtitle) subtitle.textContent = I18n.t('welcomeThemeSubtitle');
  if (btn) btn.textContent = I18n.t('continueLabel');

  renderThemeCards(document.getElementById('welcome-theme-grid'), selectedThemeId, (themeId) => {
    selectedThemeId = themeId;
    SettingsManager.set({ themeId });
    SettingsManager.applyTheme();
  });

  document.getElementById('modal-theme-welcome').classList.remove('hidden');

  btn.onclick = async () => {
    const latest = SettingsManager.get();
    latest.themeId = selectedThemeId;
    latest.themeSelectionCompleted = true;
    SettingsManager.set(latest);
    await SettingsManager.save();
    document.getElementById('modal-theme-welcome').classList.add('hidden');
  };
}

// ── Settings modal ───────────────────────────────────────────────
function openSettings() {
  const s = SettingsManager.get();

  // Traduce i titoli delle sezioni del modale nella lingua corrente
  const modalStrings = {
    'set-h2':            I18n.t('settingsTitle'),
    'set-title-theme':   I18n.t('themeBackground'),
    'set-title-texts':   I18n.t('calendarTexts'),
    'set-label-subtitle':I18n.t('subtitleLabel'),
    'set-label-footer':  I18n.t('footerText'),
    'set-title-slots':   I18n.t('timeSlotsSection'),
    'set-hint-slots':    I18n.t('timeSlotsHint'),
    'set-title-icons':   I18n.t('customIconsSection'),
    'btn-settings-save': I18n.t('saveSettings'),
    'set-btn-close':     I18n.t('closeBtn'),
    'btn-add-slot':      I18n.t('addSlot'),
  };
  Object.entries(modalStrings).forEach(([id, txt]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  });

  renderThemeCards(document.getElementById('theme-grid'), s.themeId, (themeId) => {
    SettingsManager.set({ themeId });
    SettingsManager.applyTheme();
  });

  document.getElementById('set-subtitle').value = s.subtitle || '';
  document.getElementById('set-footer').value   = s.footer   || '';

  renderLangSelector(s.language);
  renderDarkModeSelector(s.darkMode || 'auto');
  renderDayTypesSection(s);
  renderTimeFormatSelector(s.timeFormat || '24h');
  renderTimeslots(s.timeslots || []);
  renderCustomIcons(s.customIcons || []);

  window.api.appInfo().then(info => {
    const el = document.getElementById('settings-version');
    if (el) el.textContent = `${I18n.t('versionLabel')} ${info.version}`;
  });

  document.getElementById('modal-settings').classList.remove('hidden');
}

function renderDarkModeSelector(cur) {
  let block = document.getElementById('darkmode-block');
  if (!block) {
    block = document.createElement('div');
    block.id = 'darkmode-block';
    block.className = 'settings-block';
    const langBlock = document.getElementById('lang-block');
    if (langBlock) langBlock.insertAdjacentElement('afterend', block);
    else {
      const body = document.querySelector('#modal-settings .modal-body');
      body.insertBefore(block, body.firstChild);
    }
  }
  block.innerHTML = `
    <div class="settings-title">${I18n.t('darkModeSection')}</div>
    <select id="darkmode-select">
      <option value="auto"  ${!cur||cur==='auto' ?'selected':''}>${I18n.t('darkModeAuto')}</option>
      <option value="light" ${cur==='light'?'selected':''}>${I18n.t('darkModeLight')}</option>
      <option value="dark"  ${cur==='dark' ?'selected':''}>${I18n.t('darkModeDark')}</option>
    </select>
  `;
  document.getElementById('darkmode-select').addEventListener('change', e => {
    SettingsManager.set({ darkMode: e.target.value });
    applyDarkModeClass(e.target.value);
  });
}

function renderDayTypesSection(s) {
  let block = document.getElementById('daytypes-block');
  if (!block) {
    block = document.createElement('div');
    block.id = 'daytypes-block';
    block.className = 'settings-block';
    // Insert after the "Testi del calendario" block (before timeslots)
    const slotsTitle = document.getElementById('set-title-slots');
    if (slotsTitle) {
      slotsTitle.closest('.settings-block').insertAdjacentElement('beforebegin', block);
    } else {
      const body = document.querySelector('#modal-settings .modal-body');
      body.appendChild(block);
    }
  }
  _editTypes = (s.types || []).map(t => ({...t}));
  _renderTypesUI(block);
}

// Cache locale per tipi in modifica (non salvati finché non si clicca Salva)
let _editTypes = [];

function _openEmojiPickerForType(anchorEl, idx) {
  document.getElementById('type-emoji-popup')?.remove();

  const popup = document.createElement('div');
  popup.id = 'type-emoji-popup';
  popup.className = 'type-emoji-popup';

  const rect = anchorEl.getBoundingClientRect();
  const top = Math.min(rect.bottom + 4, window.innerHeight - 280);
  const left = Math.max(4, Math.min(rect.left, window.innerWidth - 350));
  popup.style.cssText = `position:fixed;top:${top}px;left:${left}px;z-index:9999;background:var(--surface);border:1.5px solid var(--border);border-radius:12px;padding:8px;box-shadow:0 4px 24px rgba(168,85,247,.3);width:340px;max-height:260px;overflow:hidden`;

  buildEmojiPicker(popup, _editTypes[idx].emoji || '', (emoji) => {
    if (emoji) {
      _editTypes[idx].emoji = emoji;
      popup.remove();
      _renderTypesUI();
    }
  });

  document.body.appendChild(popup);

  setTimeout(() => {
    function closeHandler(e) {
      if (!popup.contains(e.target)) {
        popup.remove();
        document.removeEventListener('click', closeHandler);
      }
    }
    document.addEventListener('click', closeHandler);
  }, 10);
}

function _openPhotoPickerForType(idx) {
  openImagePickerOverlay(_editTypes[idx].photoUrl || '', (url) => {
    _editTypes[idx].photoUrl = url;
    _renderTypesUI();
  });
}

function _renderTypesUI(block) {
  if (!block) block = document.getElementById('daytypes-block');
  if (!block) return;

  // Mantieni solo il titolo, ricostruisci tutto il resto
  block.innerHTML = `<div class="settings-title">${I18n.t('dayTypesSection')}</div>`;

  _editTypes.forEach((t, i) => {
    const modeEmoji  = !['avatar_family','avatar_heart','photo'].includes(t.mode);
    const modeFamily = t.mode === 'avatar_family';
    const modeHeart  = t.mode === 'avatar_heart';
    const modePhoto  = t.mode === 'photo';
    const canRemove  = i >= 2;

    const row = document.createElement('div');
    row.className = 'type-row';

    // ── Mode buttons ──────────────────────────────────────────────
    const modeDiv = document.createElement('div');
    modeDiv.style.cssText = 'display:flex;gap:3px;flex-shrink:0';
    [
      { mode:'emoji',         icon:'✏️',      title:'Emoji' },
      { mode:'avatar_family', icon:'👨‍👩‍👧', title:'Avatar famiglia' },
      { mode:'avatar_heart',  icon:'❤',       title:'Avatar cuore' },
      { mode:'photo',         icon:'📷',       title:'Foto personalizzata' },
    ].forEach(({ mode, icon, title }) => {
      const isActive = (mode === 'emoji' ? modeEmoji : t.mode === mode);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-sm type-mode-btn' + (isActive ? ' active-mode' : '');
      btn.dataset.mode = mode;
      btn.dataset.idx  = i;
      btn.title = title;
      btn.textContent = icon;
      btn.addEventListener('click', () => {
        _editTypes[+btn.dataset.idx].mode = btn.dataset.mode;
        _renderTypesUI();
      });
      modeDiv.appendChild(btn);
    });
    row.appendChild(modeDiv);

    // ── Icon area: emoji input OR photo preview ───────────────────
    if (modePhoto) {
      const photoArea = document.createElement('div');
      photoArea.className = 'type-photo-area';
      if (t.photoUrl) {
        const img = document.createElement('img');
        img.src = t.photoUrl;
        img.className = 'type-photo-thumb';
        img.style.cursor = 'pointer';
        img.title = I18n.currentLang() === 'it' ? 'Cambia foto' : 'Change photo';
        img.addEventListener('click', () => _openPhotoPickerForType(i));
        photoArea.appendChild(img);
      } else {
        const ph = document.createElement('div');
        ph.className = 'type-photo-placeholder';
        ph.style.cursor = 'pointer';
        ph.textContent = '📷';
        ph.addEventListener('click', () => _openPhotoPickerForType(i));
        photoArea.appendChild(ph);
      }
      const pickBtn = document.createElement('button');
      pickBtn.type = 'button';
      pickBtn.className = 'btn-sm';
      pickBtn.style.fontSize = '10px';
      pickBtn.textContent = I18n.t('choosePhoto');
      pickBtn.addEventListener('click', () => _openPhotoPickerForType(i));
      photoArea.appendChild(pickBtn);
      row.appendChild(photoArea);
    } else {
      // Emoji button: shows current emoji, opens popup picker on click (only when emoji mode)
      const emojiBtn = document.createElement('button');
      emojiBtn.type = 'button';
      emojiBtn.className = 'btn-sm type-emoji-btn';
      emojiBtn.title = I18n.currentLang() === 'it' ? 'Scegli emoji' : 'Choose emoji';
      emojiBtn.textContent = t.emoji || '💜';
      emojiBtn.disabled = !modeEmoji;
      emojiBtn.style.cssText = `width:44px;height:36px;font-size:20px;padding:2px;${modeEmoji ? '' : 'opacity:.35'}`;
      if (modeEmoji) {
        emojiBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          _openEmojiPickerForType(emojiBtn, i);
        });
      }
      row.appendChild(emojiBtn);
    }

    // ── Label & Sub ───────────────────────────────────────────────
    const labelInp = document.createElement('input');
    labelInp.id = `set-t${i}-label`;
    labelInp.type = 'text';
    labelInp.value = t.label || '';
    labelInp.placeholder = I18n.t('dayTypeLabelPh');
    labelInp.style.flex = '1';
    row.appendChild(labelInp);

    const subInp = document.createElement('input');
    subInp.id = `set-t${i}-sub`;
    subInp.type = 'text';
    subInp.value = t.sub || '';
    subInp.placeholder = I18n.t('dayTypeSubPh');
    subInp.style.flex = '1';
    row.appendChild(subInp);

    // ── Remove / spacer ───────────────────────────────────────────
    if (canRemove) {
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn-sm danger type-remove-btn';
      removeBtn.dataset.idx = i;
      removeBtn.style.flexShrink = '0';
      removeBtn.textContent = '✕';
      removeBtn.addEventListener('click', () => {
        _editTypes.splice(i, 1);
        _renderTypesUI();
      });
      row.appendChild(removeBtn);
    } else {
      const spacer = document.createElement('div');
      spacer.style.cssText = 'width:28px;flex-shrink:0';
      row.appendChild(spacer);
    }

    block.appendChild(row);
  });

  // Bottone "Aggiungi tipo" (max 4)
  if (_editTypes.length < 4) {
    const addBtn = document.createElement('button');
    addBtn.className = 'btn-sm';
    addBtn.style.marginTop = '4px';
    addBtn.textContent = I18n.t('addType');
    addBtn.addEventListener('click', () => {
      const TYPE_KEYS = ['together','away','type3','type4'];
      const newIdx = _editTypes.length;
      _editTypes.push({ key: TYPE_KEYS[newIdx] || `type${newIdx+1}`, emoji:'🌟', label:`Tipo ${newIdx+1}`, sub:'', mode:'emoji' });
      _renderTypesUI();
    });
    block.appendChild(addBtn);
  }
}

function renderTimeFormatSelector(cur) {
  let block = document.getElementById('timeformat-block');
  if (!block) {
    block = document.createElement('div');
    block.id = 'timeformat-block';
    block.className = 'settings-block';
    // Insert right before the timeslots section
    const slotsTitle = document.getElementById('set-title-slots');
    if (slotsTitle) {
      slotsTitle.closest('.settings-block').insertAdjacentElement('beforebegin', block);
    } else {
      const body = document.querySelector('#modal-settings .modal-body');
      body.appendChild(block);
    }
  }
  block.innerHTML = `
    <div class="settings-title">${I18n.t('timeFormatSection')}</div>
    <select id="timeformat-select">
      <option value="24h" ${!cur||cur==='24h'?'selected':''}>${I18n.t('timeFormat24h')}</option>
      <option value="12h" ${cur==='12h'?'selected':''}>${I18n.t('timeFormat12h')}</option>
    </select>
  `;
  document.getElementById('timeformat-select').addEventListener('change', e => {
    SettingsManager.set({ timeFormat: e.target.value });
  });
}

function renderLangSelector(cur) {
  let block = document.getElementById('lang-block');
  if (!block) {
    block = document.createElement('div');
    block.id = 'lang-block';
    block.className = 'settings-block';
    const body = document.querySelector('#modal-settings .modal-body');
    body.insertBefore(block, body.firstChild);
  }
  block.innerHTML = `
    <div class="settings-title">${I18n.t('languageSection')}</div>
    <select id="lang-select">
      <option value="auto" ${!cur||cur==='auto'?'selected':''}>${I18n.t('languageAuto')}</option>
      <option value="it" ${cur==='it'?'selected':''}>🇮🇹 Italiano</option>
      <option value="en" ${cur==='en'?'selected':''}>🇬🇧 English</option>
    </select>
  `;
  document.getElementById('lang-select').addEventListener('change', e => {
    I18n.setLang(e.target.value);
    SettingsManager.set({ language: e.target.value });
    SettingsManager.translateDefaultTexts(I18n.currentLang());
    _translateDefaultTimeslots(I18n.currentLang());
    _translateDefaultTypes(I18n.currentLang());
    renderTimeslots(SettingsManager.get().timeslots || []);
    updateStaticStrings();
  });
}

// Traduce label/sub dei tipi di giorno se corrispondono ancora a un default noto
function _translateDefaultTypes(langCode) {
  const cur = SettingsManager.get();
  if (!cur.types) return;
  const tgt = TRANSLATIONS[langCode] || TRANSLATIONS.it;
  // Raccoglie tutte le label/sub default note in tutte le lingue
  const knownLabels = new Set(Object.values(TRANSLATIONS).flatMap(t => [
    t.legendTogether, t.legendTogetherSub, t.legendAway, t.legendAwaySub
  ].filter(Boolean)));
  // Mappa dalla chiave al valore target
  const keyMap = {
    together: { label: tgt.legendTogether, sub: tgt.legendTogetherSub },
    away:     { label: tgt.legendAway,     sub: tgt.legendAwaySub     },
  };
  cur.types = cur.types.map(t => {
    const defaults = keyMap[t.key];
    if (!defaults) return t; // tipi personalizzati (type3, type4), non toccare
    const newLabel = knownLabels.has(t.label) ? defaults.label : t.label;
    const newSub   = knownLabels.has(t.sub)   ? defaults.sub   : t.sub;
    return { ...t, label: newLabel, sub: newSub };
  });
  SettingsManager.set(cur);
}

// Traduce le etichette delle fasce orarie se corrispondono ancora a un default noto
function _translateDefaultTimeslots(langCode) {
  const cur = SettingsManager.get();
  if (!cur.timeslots) return;
  const allDefaults = Object.values(TRANSLATIONS).flatMap(t => t.timeslotDefaults || []);
  const knownLabels = new Set(allDefaults.map(s => s.label));
  const tgt = TRANSLATIONS[langCode] || TRANSLATIONS.it;
  const tgtDefaults = tgt.timeslotDefaults || [];
  cur.timeslots = cur.timeslots.map(slot => {
    if (!knownLabels.has(slot.label)) return slot; // personalizzata, non toccare
    const match = tgtDefaults.find(d => d.start === slot.start && d.end === slot.end);
    return match ? { ...slot, label: match.label, emoji: match.emoji } : slot;
  });
  SettingsManager.set(cur);
}

function renderTimeslots(slots) {
  const list = document.getElementById('timeslot-list');
  list.innerHTML = '';
  slots.forEach((slot, i) => {
    const row = document.createElement('div');
    row.className = 'ts-row';
    row.innerHTML = `
      <input class="emoji-inp" type="text" value="${slot.emoji||''}" maxlength="2" placeholder="⏰">
      <input type="text" value="${slot.start||''}" placeholder="08:00" pattern="[0-9]{2}:[0-9]{2}" style="width:58px;text-align:center">
      <span style="font-size:10px;color:#aaa">→</span>
      <input type="text" value="${slot.end||''}"   placeholder="13:00" pattern="[0-9]{2}:[0-9]{2}" style="width:58px;text-align:center">
      <input type="text" value="${slot.label||''}" placeholder="${I18n.t('newSlotLabel')}">
      <button class="btn-sm danger" data-i="${i}">✕</button>
    `;
    row.querySelector('[data-i]').addEventListener('click', () => {
      const cur = SettingsManager.get();
      cur.timeslots.splice(i, 1);
      renderTimeslots(cur.timeslots);
    });
    row.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('change', () => {
        const ins = row.querySelectorAll('input');
        const cur = SettingsManager.get();
        cur.timeslots[i] = { emoji:ins[0].value, start:ins[1].value, end:ins[2].value, label:ins[3].value };
      });
    });
    list.appendChild(row);
  });
}

function renderCustomIcons(icons) {
  const cont = document.getElementById('custom-icons');
  cont.innerHTML = '';
  (icons || []).forEach((ic, i) => {
    const tag = document.createElement('div');
    tag.className = 'ci-tag';
    tag.innerHTML = `<span>${ic.emoji}</span><span>${ic.label}</span><button data-i="${i}">✕</button>`;
    tag.querySelector('button').addEventListener('click', () => {
      const cur = SettingsManager.get();
      cur.customIcons.splice(i, 1);
      renderCustomIcons(cur.customIcons);
    });
    cont.appendChild(tag);
  });
}

function updateStaticStrings() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    if (btn.dataset.view === 'monthly') btn.innerHTML = `📅 ${I18n.t('monthly')}`;
    if (btn.dataset.view === 'weekly')  btn.innerHTML = `🗓️ ${I18n.t('weekly')}`;
  });
  const sl = document.querySelectorAll('.sidebar-label');
  if (sl[0]) sl[0].textContent = I18n.t('currentMonth');
  if (sl[1]) sl[1].textContent = I18n.t('yourCalendars');
  const el = {
    'btn-new':      I18n.t('newCalendar'),
    'btn-settings': I18n.t('settings'),
    'btn-export':   I18n.t('exportPdf'),
  };
  Object.entries(el).forEach(([id, txt]) => {
    const e = document.getElementById(id);
    if (e) e.textContent = txt;
  });
  const logo = document.getElementById('logo');
  if (logo) logo.querySelector('span').textContent = I18n.t('appName');
  document.title = I18n.t('appName');
  // Export preview modal strings
  const exportStrings = {
    'export-preview-title': I18n.t('exportPreview'),
    'export-btn-portrait':  I18n.t('portrait'),
    'export-btn-landscape': I18n.t('landscape'),
    'export-btn-center':    I18n.t('centerPage'),
    'export-btn-fit':       I18n.t('fitPage'),
    'btn-export-save':      I18n.t('savePdf'),
  };
  Object.entries(exportStrings).forEach(([id, txt]) => {
    const e = document.getElementById(id);
    if (e) e.textContent = txt;
  });
  App.refresh();
}

function initSettingsListeners() {
  const settingsBtn = document.getElementById('btn-settings');
  if (settingsBtn) settingsBtn.addEventListener('click', openSettings);
  if (window.api?.onOpenSettings) window.api.onOpenSettings(() => openSettings());

  document.getElementById('btn-add-slot').addEventListener('click', () => {
    const cur = SettingsManager.get();
    cur.timeslots.push({ emoji:'⏰', start:'09:00', end:'10:00', label: I18n.t('newSlotLabel') });
    renderTimeslots(cur.timeslots);
  });

  document.getElementById('btn-add-icon').addEventListener('click', () => {
    const emoji = document.getElementById('new-icon-emoji').value.trim();
    const label = document.getElementById('new-icon-label').value.trim();
    if (!emoji || !label) return;
    const cur = SettingsManager.get();
    cur.customIcons.push({ emoji, label });
    renderCustomIcons(cur.customIcons);
    document.getElementById('new-icon-emoji').value = '';
    document.getElementById('new-icon-label').value = '';
  });

  document.getElementById('btn-settings-save').addEventListener('click', async () => {
    const cur = SettingsManager.get();
    cur.subtitle  = document.getElementById('set-subtitle').value;
    cur.footer    = document.getElementById('set-footer').value;
    cur.language  = document.getElementById('lang-select')?.value  || 'auto';
    cur.darkMode  = document.getElementById('darkmode-select')?.value || 'auto';
    // Leggi tipi dall'array in-memory (con valori aggiornati dagli input)
    cur.types = _editTypes.map((t, i) => {
      const base = {
        key:   t.key,
        mode:  t.mode || 'emoji',
        label: document.getElementById(`set-t${i}-label`)?.value?.trim() || t.label || '',
        sub:   document.getElementById(`set-t${i}-sub`)?.value?.trim()   || t.sub   || '',
      };
      if (t.mode === 'photo') {
        return { ...base, photoUrl: t.photoUrl || '', emoji: t.emoji || '' };
      }
      // emoji stored directly in _editTypes[i].emoji (updated by popup picker)
      return { ...base, emoji: t.emoji || '💜' };
    });
    cur.timeFormat = document.getElementById('timeformat-select')?.value || '24h';
    SettingsManager.set(cur);
    I18n.setLang(cur.language);
    await SettingsManager.save();
    document.getElementById('modal-settings').classList.add('hidden');
    updateStaticStrings();
  });
}
