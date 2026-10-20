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
    icsBtn:'📆 Esporta per Calendario…', icsTitle:'📆 Esporta per Calendario',
    icsHint:'Crea un file .ics da aprire in Calendario di Apple, Google Calendar o Outlook, per vedere i giorni anche sul telefono. Il calendario sul telefono non si aggiorna da solo: dopo una modifica esporta di nuovo e riapri il file, gli eventi già importati vengono aggiornati e non duplicati.',
    icsWhat:'Cosa esportare', icsDays:'Giorni con un tipo e note', icsSchool:'Inizio e fine della scuola, vacanze', icsHolidays:'Festività, patrono e ponti',
    icsOpen:'Apri subito in Calendario', icsSave:'Esporta', icsCount:(n)=> n === 1 ? '1 evento' : `${n} eventi`, icsNone:'Nessun evento nel periodo scelto.',
    icsSchoolStart:'🎒 Primo giorno di scuola', icsSchoolEnd:'🎒 Ultimo giorno di scuola',
    exportRange:'Mesi', exportThisMonth:'Solo questo mese', exportNext3:'Questo mese e i due successivi',
    exportSchoolYear:(y)=>`Anno scolastico ${y}/${y+1} (da settembre a giugno)`, exportYear:(y)=>`Anno ${y} (da gennaio a dicembre)`,
    exportCustom:'Scegli i mesi…', exportPages:(n)=> n === 1 ? '1 pagina' : `${n} pagine`,
    exportPreview:'Anteprima esportazione', savePdf:'Salva PDF', cancel:'Annulla',
    darkModeSection:'🌙 Tema scuro',
    darkModeAuto:'Automatico (segue il sistema)',
    darkModeLight:'☀️ Chiaro',
    darkModeDark:'🌙 Scuro',
    pastDaysSection:'🗓️ Giorni passati', pastDim:'Attenuati', pastCheck:'Attenuati, con la spunta ✓', pastOff:'Come gli altri giorni',
    holidaysSection:'🎉 Festività', holidaysIt:'Festività nazionali italiane', holidaysOff:'Nessuna',
    backupSection:'💾 Backup',
    backupHint:'Salva in un file tutti i calendari, la settimana, le impostazioni e le immagini. Importando un backup, i dati attuali vengono sostituiti (prima ne viene salvata una copia).',
    backupExport:'⬇ Esporta backup…', backupImport:'⬆ Importa backup…',
    todayBtn:'📍 Oggi',
    tourNext:'Avanti', tourBack:'Indietro', tourSkip:'Salta', tourDone:'Fine', tourStep:(n,m)=>`Novità · ${n} di ${m}`,
    selectedDays:(n)=> n === 1 ? '1 giorno selezionato' : `${n} giorni selezionati`,
    schoolPromptTitle:(y)=>`🎒 Anno scolastico ${y}/${y+1}`,
    schoolPromptHint:'Quando inizia e quando finisce la scuola? Nel calendario i giorni di scuola e quelli di vacanza avranno uno sfondo diverso. Le date proposte sono solo indicative: correggile con quelle della tua regione o della tua scuola.',
    schoolStart:'Primo giorno di scuola', schoolEnd:'Ultimo giorno di scuola', schoolSaturday:'Scuola anche il sabato',
    schoolPeriods:'Vacanze e periodi liberi', schoolPeriodsHint:'Vacanze scolastiche, ponti decisi dalla scuola, ferie in famiglia: ogni periodo diventa “vacanza” nel calendario.',
    periodChristmas:'Vacanze di Natale', periodCarnival:'Carnevale', periodEaster:'Vacanze di Pasqua',
    periodAdd:'＋ Aggiungi periodo', periodNamePh:'Es. Settimana in montagna', periodRemove:'Rimuovi',
    periodInvalid:'Controlla le date: ogni periodo e l’anno scolastico devono finire dopo l’inizio.',
    schoolSave:'Salva', schoolLater:'Più tardi', schoolNever:'Non usare',
    schoolSection:'🎒 Scuola e vacanze', schoolEnabled:'Colora i giorni di scuola e di vacanza',
    schoolEdit:'Anno scolastico e vacanze…', schoolNoYear:'Anno scolastico non ancora inserito.',
    schoolYearSummary:(y,a,b)=>`Anno ${y}/${y+1}: dal ${a} al ${b}`,
    schoolColorSchool:'Colore dei giorni di scuola', schoolColorVacation:'Colore dei giorni di vacanza', schoolColorsReset:'Colori predefiniti',
    legendSchool:'Scuola', legendVacation:'Vacanza',
    bridgesLabel:'Segna i ponti (giorno tra una festa e il fine settimana)', bridgeName:'Ponte',
    patronLabel:'Santo patrono', patronNone:'Nessuno', patronOther:'Altra città…', patronCityPh:'Città', patronNamePh:'Santo (facoltativo)',
    patternBtn:'🔁 Schema ripetuto…', patternTitle:'🔁 Schema ripetuto', patternApply:'Applica',
    patternHint:'Scegli il tipo per ogni giorno della settimana. «—» lascia il giorno com’è. Immagini e note restano. Puoi annullare con ⌘Z.',
    patternKeep:'—', patternWeekA:'Settimana A', patternWeekB:'Settimana B', patternEveryWeek:'Ogni settimana',
    patternAlternate:'Settimane alterne (A, B, A, B…)', patternAnchor:'La settimana A è quella del giorno', patternPeriod:'Periodo',
    patternThisMonth:(m)=>`Mese visualizzato (${m})`, patternRange:'Dal', patternBadDates:'Controlla le date del periodo.',
    patternTooLong:'Il periodo può durare al massimo 400 giorni.', patternEmpty:'Scegli il tipo per almeno un giorno della settimana.',
    patternPreview:(n,m)=> `Cambieranno ${n} ${n===1?'giorno':'giorni'} in ${m} ${m===1?'mese':'mesi'}.`,
    patternSkipped:(l)=>`Saltati (più calendari nello stesso mese): ${l}.`,
    copyCalendar:'Copia in un altro mese', copyCalendarTitle:(n)=>`⧉ Copia «${n}»`,
    copyCalendarHint:'I giorni vengono ricopiati per giorno della settimana: il primo lunedì del nuovo mese prende il tipo del primo lunedì di questo, e così via. Immagini e note non vengono copiate.',
    daysThisMonth:(n)=> n === 1 ? '1 giorno questo mese' : `${n} giorni questo mese`,
    countdownToday:(l)=>`Oggi: ${l}`, countdownTomorrow:(l)=>`${l} domani`, countdownIn:(l,n)=>`${l} tra ${n} giorni`,
    dayTypesSection:'🎭 Tipi di giorno',
    dayTypeLabelPh:'Etichetta',
    dayTypeSubPh:'Sottotitolo',
    addType:'＋ Aggiungi tipo',
    choosePhoto:'📂 Scegli foto',
    timeFormatSection:'🕐 Formato orario',
    timeFormat24h:'24h (00:00–23:59)',
    timeFormat12h:'12h (AM/PM)',
    welcomeThemeTitle:'Scegli il tuo stile',
    welcomeThemeSubtitle:'Scegli il tema predefinito. Puoi cambiarlo quando vuoi nelle Impostazioni.',
    continueLabel:'Continua',
    versionLabel:'Versione',
    updateDownloading:'Scaricamento aggiornamento…',
    updateReady:'Aggiornamento pronto',
    noCalendarForMonth:(m)=>`Non c’è ancora un calendario per ${m}.`,
    createForMonth:(m)=>`＋ Crea il calendario di ${m}`,
    confirmDeleteImage:(n)=> n
      ? `Questa immagine è usata in ${n} ${n===1?'punto':'punti'} (giorni o tipi di giorno): verrà tolta anche da lì. Eliminarla?`
      : 'Eliminare questa immagine?',
    newIconLabelPh:'Chitarra',
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
    icsBtn:'📆 Export for Calendar…', icsTitle:'📆 Export for Calendar',
    icsHint:'Creates an .ics file to open in Apple Calendar, Google Calendar or Outlook, so you can see the days on your phone too. The calendar on the phone does not update by itself: after a change, export again and open the file; events already imported are updated, not duplicated.',
    icsWhat:'What to export', icsDays:'Days with a type, and notes', icsSchool:'Start and end of school, holidays', icsHolidays:'Public holidays, patron saint and bridge days',
    icsOpen:'Open in Calendar right away', icsSave:'Export', icsCount:(n)=> n === 1 ? '1 event' : `${n} events`, icsNone:'No events in the chosen period.',
    icsSchoolStart:'🎒 First day of school', icsSchoolEnd:'🎒 Last day of school',
    exportRange:'Months', exportThisMonth:'This month only', exportNext3:'This month and the next two',
    exportSchoolYear:(y)=>`School year ${y}/${y+1} (September to June)`, exportYear:(y)=>`Year ${y} (January to December)`,
    exportCustom:'Choose months…', exportPages:(n)=> n === 1 ? '1 page' : `${n} pages`,
    exportPreview:'Export preview', savePdf:'Save PDF', cancel:'Cancel',
    darkModeSection:'🌙 Dark mode',
    darkModeAuto:'Automatic (follows system)',
    darkModeLight:'☀️ Light',
    darkModeDark:'🌙 Dark',
    pastDaysSection:'🗓️ Past days', pastDim:'Dimmed', pastCheck:'Dimmed, with a tick ✓', pastOff:'Like the other days',
    holidaysSection:'🎉 Public holidays', holidaysIt:'Italian public holidays', holidaysOff:'None',
    backupSection:'💾 Backup',
    backupHint:'Saves all calendars, the week plans, the settings and the images to one file. Importing a backup replaces the current data (a copy of it is saved first).',
    backupExport:'⬇ Export backup…', backupImport:'⬆ Import backup…',
    todayBtn:'📍 Today',
    tourNext:'Next', tourBack:'Back', tourSkip:'Skip', tourDone:'Done', tourStep:(n,m)=>`What’s new · ${n} of ${m}`,
    selectedDays:(n)=> n === 1 ? '1 day selected' : `${n} days selected`,
    schoolPromptTitle:(y)=>`🎒 School year ${y}/${y+1}`,
    schoolPromptHint:'When does school start and end? School days and vacation days will get a different background in the calendar. The suggested dates are only a starting point: correct them with your school’s.',
    schoolStart:'First day of school', schoolEnd:'Last day of school', schoolSaturday:'School on Saturdays too',
    schoolPeriods:'Holidays and days off', schoolPeriodsHint:'School holidays, days off decided by the school, family holidays: each period counts as “vacation” in the calendar.',
    periodChristmas:'Christmas holidays', periodCarnival:'Carnival', periodEaster:'Easter holidays',
    periodAdd:'＋ Add period', periodNamePh:'E.g. A week in the mountains', periodRemove:'Remove',
    periodInvalid:'Check the dates: each period and the school year must end after they start.',
    schoolSave:'Save', schoolLater:'Later', schoolNever:'Don’t use',
    schoolSection:'🎒 School and holidays', schoolEnabled:'Colour school days and vacation days',
    schoolEdit:'School year and holidays…', schoolNoYear:'School year not entered yet.',
    schoolYearSummary:(y,a,b)=>`Year ${y}/${y+1}: from ${a} to ${b}`,
    schoolColorSchool:'School days colour', schoolColorVacation:'Vacation days colour', schoolColorsReset:'Default colours',
    legendSchool:'School', legendVacation:'Vacation',
    bridgesLabel:'Mark bridge days (between a holiday and the weekend)', bridgeName:'Bridge day',
    patronLabel:'Patron saint’s day', patronNone:'None', patronOther:'Other city…', patronCityPh:'City', patronNamePh:'Saint (optional)',
    patternBtn:'🔁 Weekly pattern…', patternTitle:'🔁 Weekly pattern', patternApply:'Apply',
    patternHint:'Choose the type for each day of the week. “—” leaves the day as it is. Images and notes stay. You can undo with ⌘Z.',
    patternKeep:'—', patternWeekA:'Week A', patternWeekB:'Week B', patternEveryWeek:'Every week',
    patternAlternate:'Alternate weeks (A, B, A, B…)', patternAnchor:'Week A is the week of', patternPeriod:'Period',
    patternThisMonth:(m)=>`Month on screen (${m})`, patternRange:'From', patternBadDates:'Check the dates of the period.',
    patternTooLong:'The period can be at most 400 days long.', patternEmpty:'Choose the type for at least one day of the week.',
    patternPreview:(n,m)=> `${n} ${n===1?'day':'days'} in ${m} ${m===1?'month':'months'} will change.`,
    patternSkipped:(l)=>`Skipped (several calendars in the same month): ${l}.`,
    copyCalendar:'Copy to another month', copyCalendarTitle:(n)=>`⧉ Copy “${n}”`,
    copyCalendarHint:'Days are copied by day of the week: the first Monday of the new month takes the type of the first Monday of this one, and so on. Images and notes are not copied.',
    daysThisMonth:(n)=> n === 1 ? '1 day this month' : `${n} days this month`,
    countdownToday:(l)=>`Today: ${l}`, countdownTomorrow:(l)=>`${l} tomorrow`, countdownIn:(l,n)=>`${l} in ${n} days`,
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
    updateDownloading:'Downloading update…',
    updateReady:'Update ready',
    noCalendarForMonth:(m)=>`There is no calendar for ${m} yet.`,
    createForMonth:(m)=>`＋ Create the ${m} calendar`,
    confirmDeleteImage:(n)=> n
      ? `This image is used in ${n} ${n===1?'place':'places'} (days or day types): it will be removed there too. Delete it?`
      : 'Delete this image?',
    newIconLabelPh:'Guitar',
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
