// i18n.js — carica PRIMA di tutto, init sincrono

const TRANSLATIONS = {
  it: {
    appName:'Calendario Magico', monthly:'Mensile', weekly:'Settimanale',
    currentMonth:'Mese corrente', yourCalendars:'I tuoi calendari',
    newCalendar:'＋ Nuovo calendario', settings:'⚙️ Impostazioni', exportPdf:'⬇ Esporta PDF',
    months:['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'],
    weekdays:['Lun','Mar','Mer','Gio','Ven','Sab','Dom'],
    weekdaysFull:['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'],
    typeNone:'Nessuno', typeTogether:'Insieme', typeAway:'Lontano',
    labelTogether:'Siamo qui! 💜', labelAway:'Il mio ❤️ è qui',
    legendTogether:'Siamo qui! 💜', legendTogetherSub:'Giorni insieme',
    legendAway:'Il mio ❤️ è qui', legendAwaySub:'Sono lontano',
    defaultSubtitle:'Il nostro calendario magico', defaultFooter:'Ti voglio bene ogni giorno 💜',
    typeOfDay:'Tipo di giorno', activityIcon:'Attività / Icona',
    customImage:'Immagine personalizzata', chooseImage:'📂 Scegli immagine', removeImage:'✕ Rimuovi',
    notes:'Note', notesPlaceholder:'Aggiungi una nota…', save:'Salva', cancel:'Annulla',
    timeSlot:'Fascia oraria', activity:'Attività', customLabel:'Etichetta personalizzata',
    customLabelPh:'Es. Scuola, Sport…', notesPh:'Note opzionali…', free:'Libero',
    newCalendarTitle:'＋ Nuovo calendario', calendarName:'Nome', calendarNamePh:'Es. Aprile — Luna',
    monthAndYear:'Mese e anno', createCalendar:'Crea calendario',
    settingsTitle:'⚙️ Impostazioni', themeBackground:'🎨 Tema sfondo',
    calendarTexts:'📋 Testi del calendario', subtitleLabel:'Sottotitolo', footerText:'Messaggio in fondo',
    timeSlotsSection:'🕐 Fasce orarie', timeSlotsHint:'Definisci le fasce orarie (es. 08:00–13:00 Scuola).',
    addSlot:'＋ Aggiungi fascia', customIconsSection:'🏷️ Icone personalizzate',
    customIconsHint:'Aggiungi le tue icone al selettore.',
    languageSection:'🌍 Lingua', languageAuto:'Automatica (segue il sistema)',
    saveSettings:'Salva impostazioni', closeBtn:'Chiudi', newSlotLabel:'Nuova fascia',
    confirmDelete:(n)=>`Eliminare "${n}"?`,
    timeslotDefaults:[
      {emoji:'🌅',start:'07:00',end:'08:00',label:'Mattina'},
      {emoji:'🎒',start:'08:00',end:'13:00',label:'Scuola'},
      {emoji:'🍽️',start:'13:00',end:'14:00',label:'Pranzo'},
      {emoji:'☀️',start:'14:00',end:'17:00',label:'Pomeriggio'},
      {emoji:'⚽',start:'17:00',end:'19:00',label:'Sport'},
      {emoji:'🍴',start:'19:00',end:'20:00',label:'Cena'},
      {emoji:'🌙',start:'20:00',end:'22:00',label:'Serata'},
    ],
    iconLabels:{
      '🏠':'Casa','❤️':'Amore','⭐':'Speciale','🎒':'Scuola','⚽':'Sport',
      '🏊':'Nuoto','🎨':'Arte','🎵':'Musica','📚':'Lettura','🌳':'Natura',
      '✈️':'Viaggio','🎉':'Festa','🏖️':'Mare','⛷️':'Neve','🎭':'Teatro',
      '🍕':'Cibo','🎠':'Gita','💊':'Salute','😴':'Riposo','🌙':'Notte',
      '👨‍👩‍👧':'Famiglia','🎮':'Giochi','🚴':'Bici','🏃':'Corsa',
      '🍦':'Gelato','🎬':'Cinema','📱':'Tecnologia','🐶':'Animale',
    },
    themeNames:{
      unicorni:'Unicorni',dinosauri:'Dinosauri',macchinine:'Macchinine',spazio:'Spazio',
      principesse:'Principesse',mare:'Mare e pesci',foresta:'Foresta',supereroi:'Supereroi',
      fiori:'Fiori e natura',animali:'Fattoria',sport:'Sport',musica:'Musica',
      giungla:'Giungla',
    },
    portrait:'↕ Verticale', landscape:'↔ Orizzontale',
    fitPage:'⊡ Adatta', centerPage:'⊞ Centra',
    exportPreview:'Anteprima esportazione', savePdf:'Salva PDF', cancel:'Annulla',
    darkModeSection:'🌙 Tema scuro',
    darkModeAuto:'Automatico (segue il sistema)',
    darkModeLight:'☀️ Chiaro',
    darkModeDark:'🌙 Scuro',
    dayTypesSection:'🎭 Tipi di giorno',
    dayTypeLabelPh:'Etichetta',
    dayTypeSubPh:'Sottotitolo',
    addType:'＋ Aggiungi tipo',
    choosePhoto:'📂 Scegli foto',
    timeFormatSection:'🕐 Formato orario',
    timeFormat24h:'24h (00:00–23:59)',
    timeFormat12h:'12h (AM/PM)',
    welcomeThemeTitle:'Choose your style',
    welcomeThemeSubtitle:'Choose your default theme. You can change it anytime in Settings.',
    continueLabel:'Continue',
    versionLabel:'Version',
  },
  en: {
    appName:'Magic Calendar', monthly:'Monthly', weekly:'Weekly',
    currentMonth:'Current month', yourCalendars:'Your calendars',
    newCalendar:'＋ New calendar', settings:'⚙️ Settings', exportPdf:'⬇ Export PDF',
    months:['January','February','March','April','May','June','July','August','September','October','November','December'],
    weekdays:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    weekdaysFull:['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
    typeNone:'None', typeTogether:'Together', typeAway:'Away',
    labelTogether:'We\'re here! 💜', labelAway:'My ❤️ is here',
    legendTogether:'We\'re here! 💜', legendTogetherSub:'Days together',
    legendAway:'My ❤️ is here', legendAwaySub:'I\'m away',
    defaultSubtitle:'Our magic calendar', defaultFooter:'I love you every day 💜',
    typeOfDay:'Type of day', activityIcon:'Activity / Icon',
    customImage:'Custom image', chooseImage:'📂 Choose image', removeImage:'✕ Remove',
    notes:'Notes', notesPlaceholder:'Add a note…', save:'Save', cancel:'Cancel',
    timeSlot:'Time slot', activity:'Activity', customLabel:'Custom label',
    customLabelPh:'E.g. School, Sport…', notesPh:'Optional notes…', free:'Free',
    newCalendarTitle:'＋ New calendar', calendarName:'Name', calendarNamePh:'E.g. April — Luna',
    monthAndYear:'Month and year', createCalendar:'Create calendar',
    settingsTitle:'⚙️ Settings', themeBackground:'🎨 Background theme',
    calendarTexts:'📋 Calendar texts', subtitleLabel:'Subtitle', footerText:'Footer message',
    timeSlotsSection:'🕐 Time slots', timeSlotsHint:'Define time slots (e.g. 08:00–13:00 School).',
    addSlot:'＋ Add slot', customIconsSection:'🏷️ Custom icons',
    customIconsHint:'Add your own icons to the picker.',
    languageSection:'🌍 Language', languageAuto:'Automatic (follows system)',
    saveSettings:'Save settings', closeBtn:'Close', newSlotLabel:'New slot',
    confirmDelete:(n)=>`Delete "${n}"?`,
    timeslotDefaults:[
      {emoji:'🌅',start:'07:00',end:'08:00',label:'Morning'},
      {emoji:'🎒',start:'08:00',end:'13:00',label:'School'},
      {emoji:'🍽️',start:'13:00',end:'14:00',label:'Lunch'},
      {emoji:'☀️',start:'14:00',end:'17:00',label:'Afternoon'},
      {emoji:'⚽',start:'17:00',end:'19:00',label:'Sport'},
      {emoji:'🍴',start:'19:00',end:'20:00',label:'Dinner'},
      {emoji:'🌙',start:'20:00',end:'22:00',label:'Evening'},
    ],
    iconLabels:{
      '🏠':'Home','❤️':'Love','⭐':'Special','🎒':'School','⚽':'Sport',
      '🏊':'Swimming','🎨':'Art','🎵':'Music','📚':'Reading','🌳':'Nature',
      '✈️':'Travel','🎉':'Party','🏖️':'Beach','⛷️':'Snow','🎭':'Theatre',
      '🍕':'Food','🎠':'Trip','💊':'Health','😴':'Rest','🌙':'Night',
      '👨‍👩‍👧':'Family','🎮':'Games','🚴':'Cycling','🏃':'Running',
      '🍦':'Ice cream','🎬':'Cinema','📱':'Technology','🐶':'Pet',
    },
    themeNames:{
      unicorni:'Unicorns',dinosauri:'Dinosaurs',macchinine:'Cars',spazio:'Space',
      principesse:'Princesses',mare:'Sea & fish',foresta:'Forest',supereroi:'Superheroes',
      fiori:'Flowers & nature',animali:'Farm',sport:'Sport',musica:'Music',
      giungla:'Jungle',
    },
    portrait:'↕ Portrait', landscape:'↔ Landscape',
    fitPage:'⊡ Fit', centerPage:'⊞ Center',
    exportPreview:'Export preview', savePdf:'Save PDF', cancel:'Cancel',
    darkModeSection:'🌙 Dark mode',
    darkModeAuto:'Automatic (follows system)',
    darkModeLight:'☀️ Light',
    darkModeDark:'🌙 Dark',
    dayTypesSection:'🎭 Day types',
    dayTypeLabelPh:'Label',
    dayTypeSubPh:'Subtitle',
    addType:'＋ Add type',
    choosePhoto:'📂 Choose photo',
    timeFormatSection:'🕐 Time format',
    timeFormat24h:'24h (00:00–23:59)',
    timeFormat12h:'12h (AM/PM)',
    welcomeThemeTitle:'Choose your style',
    welcomeThemeSubtitle:'Choose your default theme. You can change it anytime in Settings.',
    continueLabel:'Continue',
    versionLabel:'Version',
  },
};

// ── Inizializzazione SINCRONA — avviene immediatamente al caricamento dello script
const I18n = (() => {
  // Legge subito navigator.language — disponibile sempre in modo sincrono
  function _detect(override) {
    if (override && override !== 'auto' && TRANSLATIONS[override]) return override;
    const code = (navigator.language || navigator.userLanguage || 'it').split('-')[0].toLowerCase();
    return TRANSLATIONS[code] ? code : 'it';
  }

  let _lang = _detect(null); // init immediato

  // Chiamato dopo aver caricato le impostazioni salvate
  function init(savedLang) {
    _lang = _detect(savedLang);
    document.documentElement.lang = _lang;
  }

  function setLang(lang) {
    _lang = _detect(lang);
    document.documentElement.lang = _lang;
  }

  // Stringa semplice
  function t(key) {
    const v = TRANSLATIONS[_lang]?.[key];
    if (v !== undefined && typeof v !== 'function' && !Array.isArray(v)) return String(v);
    const fb = TRANSLATIONS.it[key];
    if (fb !== undefined && typeof fb !== 'function' && !Array.isArray(fb)) return String(fb);
    console.warn(`[i18n] missing key: ${key}`);
    return key;
  }

  // Array (months, weekdays…)
  function ta(key) {
    const v = TRANSLATIONS[_lang]?.[key] ?? TRANSLATIONS.it[key];
    if (Array.isArray(v)) return [...v];
    console.warn(`[i18n] missing array key: ${key}`);
    return [];
  }

  // Funzione con argomenti (confirmDelete…)
  function tf(key, ...args) {
    const fn = TRANSLATIONS[_lang]?.[key] ?? TRANSLATIONS.it[key];
    if (typeof fn === 'function') return fn(...args);
    return String(fn ?? key);
  }

  // Oggetto (iconLabels, themeNames…)
  function to(key) {
    const v = TRANSLATIONS[_lang]?.[key] ?? TRANSLATIONS.it[key];
    if (v && typeof v === 'object' && !Array.isArray(v)) return v;
    console.warn(`[i18n] missing object key: ${key}`);
    return {};
  }

  function currentLang() { return _lang; }

  return { init, setLang, t, ta, to, tf, currentLang };
})();
