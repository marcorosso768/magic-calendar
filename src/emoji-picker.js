// emoji-picker.js — comprehensive emoji picker component
// Depends on: i18n.js (loaded first), settings.js (SettingsManager)

const EMOJI_CATS = [
  {
    id: 'fav',
    label: '⭐',
    titleIt: 'Preferiti',
    titleEn: 'Favorites',
    emojis: null, // populated from SettingsManager.allIcons()
  },
  {
    id: 'smileys',
    label: '😊',
    titleIt: 'Emozioni',
    titleEn: 'Feelings',
    emojis: ['😊','😀','😄','😁','😆','🥰','😍','🤩','😇','😎','🤓','🥳','😴','😢','😭','😤','😠','🤔','🤗','😬','😏','😒','🥺','😮','😱','😋','😌','🤣','😂','🙂','😑','🤭','🤫','🤐'],
  },
  {
    id: 'people',
    label: '👶',
    titleIt: 'Persone',
    titleEn: 'People',
    emojis: ['👶','🧒','👦','👧','🧑','👱','🧔','👴','👵','👨‍👩‍👧','👨‍👩‍👦','👪','💑','👭','👫','👬','🤰','👩‍🍼','🧑‍🎓','👩‍🏫','👨‍💻','🧑‍⚕️','🧑‍🍳','🧑‍🎨','🦸','🧙','🤴','👸'],
  },
  {
    id: 'sports',
    label: '⚽',
    titleIt: 'Sport',
    titleEn: 'Sports',
    emojis: ['⚽','🏀','🏈','⚾','🎾','🏐','🏉','🏓','🏸','🥊','🥋','⛸️','🎿','🏊','🚴','🏃','🧗','🤸','⛷️','🏋️','🤺','🏇','🤼','🤽','🤾','🧘','🚶','🏄','⛹️','🏌️','🤿','🏹','🎯'],
  },
  {
    id: 'nature',
    label: '🌿',
    titleIt: 'Natura',
    titleEn: 'Nature',
    emojis: ['🌸','🌺','🌻','🌹','🌷','🌱','🌿','🍀','🌳','🌲','🌴','🌵','🍁','🍂','🍃','🦋','🐛','🐝','🐞','🌈','☁️','⛅','❄️','🌊','🔥','🌙','⭐','🌟','💫','☀️','🌤️','🌦️','🌧️','⛈️','🌼'],
  },
  {
    id: 'animals',
    label: '🐶',
    titleIt: 'Animali',
    titleEn: 'Animals',
    emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🦆','🐦','🦉','🐧','🦚','🦜','🐠','🐡','🦈','🐙','🦀','🦞','🐢','🦎','🐊','🐉','🦓','🦒','🐘','🦏','🦛'],
  },
  {
    id: 'food',
    label: '🍕',
    titleIt: 'Cibo',
    titleEn: 'Food',
    emojis: ['🍕','🍔','🍟','🌮','🌯','🥙','🍞','🥐','🥗','🍜','🍝','🍛','🍣','🍱','🍦','🎂','🍰','🍩','🍪','🍫','🍬','🍭','🍇','🍓','🍎','🍊','🍋','🍌','🥝','🥑','☕','🧃','🥤','🍷','🧁','🫐','🥞','🧇','🥓','🍳','🥚','🧀'],
  },
  {
    id: 'travel',
    label: '✈️',
    titleIt: 'Viaggi',
    titleEn: 'Travel',
    emojis: ['✈️','🚂','🚢','🚗','🚕','🚌','🚑','🚒','🚓','🏎️','🛸','🚀','🛺','🚲','🛴','🛵','🗺️','🏔️','🏖️','🏕️','🌅','⛺','🏛️','🗼','🗽','🏰','🎡','🎢','🌃','🌆','🌉','🏙️','🚁','🛶'],
  },
  {
    id: 'objects',
    label: '📚',
    titleIt: 'Oggetti',
    titleEn: 'Objects',
    emojis: ['📚','📖','✏️','🖊️','📝','💻','📱','📷','🎵','🎶','🎸','🎹','🎺','🎻','🥁','🎤','🎧','📺','📻','🎮','🕹️','🎲','🧩','🎯','🎨','💡','🔦','💊','🩺','🩹','🧸','🎁','🎀','🔑','🪴','🛋️','🪆','🔬','🔭','📐','🧲'],
  },
  {
    id: 'events',
    label: '🎉',
    titleIt: 'Feste',
    titleEn: 'Events',
    emojis: ['🎉','🎊','🎈','🎂','🎁','🎀','🎗️','🏆','🥇','🥈','🥉','🎭','🎬','🎆','🎇','🧨','✨','🎃','🎄','🎋','🎍','🎎','🎏','🎐','💐','🌺','🕯️','🔮','🪄','🪅','💌','📸','🥂'],
  },
  {
    id: 'symbols',
    label: '❤️',
    titleIt: 'Simboli',
    titleEn: 'Symbols',
    emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💕','💞','💓','💗','💖','💝','💘','❣️','✅','❌','⭕','💯','🔝','⬆️','⬇️','➡️','⬅️','🔄','🔔','📣','⚡','💥','💦','💨','🌀','💤','🎵','🎶','♾️','✔️','⚠️'],
  },
];

/**
 * Build a comprehensive emoji picker inside `container`.
 *
 * Items use `.icon-opt` / `.icon-opt.active` classes so existing
 * save-handlers (which query `#picker .icon-opt.active`) keep working.
 *
 * @param {HTMLElement} container  — #hour-icon-picker or #day-icon-picker
 * @param {string}      initEmoji  — currently selected emoji ('' = free/none)
 * @param {function}    onSelect   — optional callback(emoji: string)
 */
function buildEmojiPicker(container, initEmoji, onSelect) {
  const lang = I18n.currentLang();
  let activeCat = 'fav';
  let searchQuery = '';
  let selected = typeof initEmoji === 'string' ? initEmoji : '';

  // Populate 'fav' with user's allIcons()
  const cats = EMOJI_CATS.map(c => {
    if (c.id !== 'fav') return c;
    return { ...c, emojis: SettingsManager.allIcons().map(i => i.emoji) };
  });

  container.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.className = 'ep-wrap';

  // ── Category tabs ────────────────────────────────────────────────
  const catsRow = document.createElement('div');
  catsRow.className = 'ep-cats';
  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ep-cat-btn' + (cat.id === 'fav' ? ' active' : '');
    btn.title = lang === 'it' ? cat.titleIt : cat.titleEn;
    btn.textContent = cat.label;
    btn.addEventListener('click', () => {
      activeCat = cat.id;
      searchQuery = '';
      searchInp.value = '';
      catsRow.querySelectorAll('.ep-cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderGrid();
    });
    catsRow.appendChild(btn);
  });
  wrap.appendChild(catsRow);

  // ── Search / paste input ─────────────────────────────────────────
  const searchWrap = document.createElement('div');
  searchWrap.className = 'ep-search-wrap';
  const searchInp = document.createElement('input');
  searchInp.type = 'text';
  searchInp.className = 'ep-search';
  searchInp.placeholder = lang === 'it' ? '🔍 Cerca o incolla un\'emoji…' : '🔍 Search or paste an emoji…';
  searchInp.addEventListener('input', e => {
    searchQuery = e.target.value.trim();
    catsRow.querySelectorAll('.ep-cat-btn').forEach(b => b.classList.remove('active'));
    renderGrid();
  });
  searchWrap.appendChild(searchInp);
  wrap.appendChild(searchWrap);

  // ── Grid ─────────────────────────────────────────────────────────
  const grid = document.createElement('div');
  grid.className = 'ep-grid';
  wrap.appendChild(grid);

  container.appendChild(wrap);

  // ── Initial render ───────────────────────────────────────────────
  renderGrid();

  function renderGrid() {
    grid.innerHTML = '';

    const isFav = (activeCat === 'fav' && !searchQuery);
    grid.className = 'ep-grid' + (isFav ? '' : ' ep-grid-compact');

    // "Free / —" always first
    const freeEl = document.createElement('div');
    freeEl.className = 'icon-opt ep-free' + (selected === '' ? ' active' : '');
    freeEl.dataset.emoji = '';
    freeEl.innerHTML = `<span style="font-size:15px;font-weight:900;color:#9ca3af">—</span>`
                     + `<div class="icon-opt-lbl">${I18n.t('free')}</div>`;
    freeEl.addEventListener('click', () => {
      selected = '';
      grid.querySelectorAll('.icon-opt').forEach(x => x.classList.remove('active'));
      freeEl.classList.add('active');
      if (onSelect) onSelect('');
    });
    grid.appendChild(freeEl);

    const emojis = getEmojis();
    const iconLabels = I18n.to('iconLabels');

    emojis.forEach(emoji => {
      const el = document.createElement('div');
      const lbl = iconLabels[emoji] || '';
      el.className = 'icon-opt' + (isFav ? '' : ' ep-item') + (selected === emoji ? ' active' : '');
      el.dataset.emoji = emoji;
      // In fav tab: show label; in other tabs: emoji only (compact)
      if (isFav && lbl) {
        el.innerHTML = `<span>${emoji}</span><div class="icon-opt-lbl">${lbl}</div>`;
      } else {
        el.textContent = emoji;
      }
      el.addEventListener('click', () => {
        selected = emoji;
        grid.querySelectorAll('.icon-opt').forEach(x => x.classList.remove('active'));
        el.classList.add('active');
        if (onSelect) onSelect(emoji);
      });
      grid.appendChild(el);
    });
  }

  function getEmojis() {
    const q = searchQuery;

    if (q) {
      // Check if it looks like an emoji (short, contains emoji code point)
      const trimmed = q.replace(/\s/g, '');
      const seemsEmoji = trimmed.length <= 8 && /\p{Emoji_Presentation}|\p{Extended_Pictographic}/u.test(trimmed);
      if (seemsEmoji) {
        // Direct emoji input: offer it as first option, then all favorites
        const favEmojis = cats.find(c => c.id === 'fav')?.emojis || [];
        return [trimmed, ...favEmojis.filter(e => e !== trimmed)];
      }
      // Text search: filter favorites by label
      const qLow = q.toLowerCase();
      const iconLabels = I18n.to('iconLabels');
      const favEmojis = cats.find(c => c.id === 'fav')?.emojis || [];
      const matched = favEmojis.filter(e => (iconLabels[e] || '').toLowerCase().includes(qLow));
      // Append all other category emoji (so user can still browse everything)
      const seen = new Set(matched);
      const rest = [];
      cats.forEach(c => {
        if (c.id === 'fav') return;
        (c.emojis || []).forEach(e => { if (!seen.has(e)) { seen.add(e); rest.push(e); } });
      });
      return [...matched, ...rest];
    }

    const cat = cats.find(c => c.id === activeCat);
    return cat?.emojis || [];
  }
}
