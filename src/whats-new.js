// whats-new.js — the steps of the "What's new" tour, per version.
//
// For a new release, add an entry with its version. Each step: target (CSS selector of the element
// to highlight; null = bubble in the middle of the window), title and text in it/en. {mod} is
// replaced with ⌘ on macOS and Ctrl on Windows.

const WHATS_NEW = [
  {
    version: '1.4.0',
    steps: [
      {
        target: '#view-monthly .days-grid',
        title: { it: 'Seleziona più giorni', en: 'Select several days' },
        text: {
          it: 'Trascina il mouse da un giorno all’altro, oppure clicca un giorno e poi Maiusc+clic su un altro. Un clic semplice apre ancora il giorno.',
          en: 'Drag from one day to another, or click a day and then Shift+click another. A single click still opens the day.',
        },
      },
      {
        target: null,
        title: { it: 'Un tipo per tutti', en: 'One type for all' },
        text: {
          it: 'Con dei giorni selezionati compare una barra in basso: scegli il tipo e viene applicato a tutti. Immagini e note restano. Esc annulla la selezione.',
          en: 'With some days selected, a bar appears at the bottom: pick a type and it is applied to all of them. Images and notes stay. Esc clears the selection.',
        },
      },
      {
        target: '#btn-pattern',
        title: { it: 'Schema ripetuto', en: 'Weekly pattern' },
        text: {
          it: 'Un tipo per ogni giorno della settimana, anche a settimane alterne, su questo mese o su un periodo. Prima di applicarlo vedi quanti giorni cambiano.',
          en: 'A type for each day of the week, also with alternate weeks, on this month or over a period. Before applying it you see how many days change.',
        },
      },
      {
        target: null,
        title: { it: 'Annulla e Ripristina', en: 'Undo and Redo' },
        text: {
          it: '{mod}Z annulla qualsiasi modifica ai giorni (anche uno schema intero), {mod}⇧Z la ripristina. Le trovi anche nel menu Modifica.',
          en: '{mod}Z undoes any change to the days (even a whole pattern), {mod}⇧Z redoes it. Both are also in the Edit menu.',
        },
      },
      {
        target: null,
        title: { it: 'Nuove finestre', en: 'New windows' },
        text: {
          it: 'Gli aggiornamenti hanno una finestra tutta loro, con le novità e il download. E c’è una nuova finestra Informazioni su Magic Calendar.',
          en: 'Updates have a window of their own, with what’s new and the download. And there is a new About Magic Calendar window.',
        },
      },
    ],
  },
  {
    version: '1.5.0',
    steps: [
      {
        target: '#view-monthly .days-grid',
        title: { it: 'Giorni di scuola e di vacanza', en: 'School days and vacation days' },
        text: {
          it: 'Inserisci il primo e l’ultimo giorno di scuola e le vacanze (Natale, Carnevale, Pasqua o ferie in famiglia): i giorni di scuola e quelli di vacanza hanno uno sfondo diverso, anche nel PDF. Dal 1° settembre l’app chiede le date del nuovo anno scolastico.',
          en: 'Enter the first and last day of school and the holidays (Christmas, Carnival, Easter or family holidays): school days and vacation days get a different background, also in the PDF. From 1 September the app asks for the dates of the new school year.',
        },
      },
      {
        target: null,
        title: { it: 'Ponti e santo patrono', en: 'Bridge days and patron saint' },
        text: {
          it: 'I ponti (il giorno tra una festa e il fine settimana) sono segnati in arancione. In Impostazioni → Scuola e vacanze scegli la tua città per il santo patrono, cambi i colori o modifichi l’anno scolastico.',
          en: 'Bridge days (between a holiday and the weekend) are marked in orange. In Settings → School and holidays you choose your city for the patron saint’s day, change the colours or edit the school year.',
        },
      },
      {
        target: '#btn-export',
        title: { it: 'PDF di più mesi', en: 'PDF of several months' },
        text: {
          it: 'Nell’esportazione scegli anche più mesi, l’anno scolastico da settembre a giugno o l’anno intero: un mese per pagina, in un solo PDF.',
          en: 'When exporting you can also choose several months, the school year from September to June or the whole year: one month per page, in a single PDF.',
        },
      },
    ],
  },
  {
    version: '1.6.0',
    steps: [
      {
        target: '#btn-ics',
        title: { it: 'I giorni anche sul telefono', en: 'Your days on your phone too' },
        text: {
          it: 'Esporta i giorni, le vacanze scolastiche e, se vuoi, le festività in un file da aprire in Calendario di Apple, Google Calendar o Outlook. Dopo una modifica esporta di nuovo: gli eventi già importati vengono aggiornati, non duplicati.',
          en: 'Export your days, the school holidays and, if you like, public holidays to a file for Apple Calendar, Google Calendar or Outlook. After a change, export again: events already imported are updated, not duplicated.',
        },
      },
    ],
  },
];

// "1.10.0" > "1.9.2"
function versionNewer(a, b) {
  const pa = String(a).split('.').map(n => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0);
  }
  return false;
}

// Steps of the versions after `lastSeen` and up to `current` (oldest first).
function whatsNewSince(lastSeen, current) {
  return WHATS_NEW
    .filter(e => (!lastSeen || versionNewer(e.version, lastSeen)) && !versionNewer(e.version, current))
    .sort((a, b) => (versionNewer(a.version, b.version) ? 1 : -1))
    .flatMap(e => e.steps);
}

// Steps of the newest version that has some, up to `current` (Help → What's New).
function whatsNewLatest(current) {
  const list = WHATS_NEW.filter(e => !versionNewer(e.version, current));
  list.sort((a, b) => (versionNewer(a.version, b.version) ? -1 : 1));
  return list.length ? list[0].steps : [];
}

if (typeof module !== 'undefined' && module.exports) module.exports = { WHATS_NEW, versionNewer, whatsNewSince, whatsNewLatest };
