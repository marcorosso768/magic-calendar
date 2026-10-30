// ics.js — export to iCalendar (.ics) for Apple Calendar, Google Calendar, Outlook.
// No DOM access: also loaded by the Node tests in test/.
//
// All events are all-day. Every event has a stable UID (based on the date and on what it is), so
// importing a newer export into the same calendar updates the events instead of duplicating them.

const Ics = (() => {
  const CU = (typeof CalUtils !== 'undefined') ? CalUtils : require('./calendar-utils');
  const SU = (typeof SchoolUtils !== 'undefined') ? SchoolUtils : require('./school-utils');

  const pad = (n) => String(n).padStart(2, '0');
  const dateVal = (y, m, d) => { const t = new Date(y, m, d); return `${t.getFullYear()}${pad(t.getMonth() + 1)}${pad(t.getDate())}`; };
  const slug = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'x';

  // RFC 5545 text: backslash, semicolon, comma and newlines escaped.
  function esc(s) {
    return String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  }

  // Lines longer than 75 octets are folded (CRLF + space), without splitting a UTF-8 character.
  function fold(line) {
    const bytes = (s) => new TextEncoder().encode(s).length;
    if (bytes(line) <= 75) return line;
    const out = []; let cur = '', limit = 75;
    for (const ch of line) {
      if (bytes(cur + ch) > limit) { out.push(cur); cur = ''; limit = 74; }
      cur += ch;
    }
    out.push(cur);
    return out.join('\r\n ');
  }

  // events: [{ uid, start: {y,m,d}, days (≥1), title, description? }]
  function build({ calName, events, now = new Date() }) {
    const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Magic Calendar//IT', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      `X-WR-CALNAME:${esc(calName || 'Magic Calendar')}`,
    ];
    for (const e of events) {
      const s = e.start;
      lines.push('BEGIN:VEVENT',
        `UID:${e.uid}@magic-calendar`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${dateVal(s.y, s.m, s.d)}`,
        `DTEND;VALUE=DATE:${dateVal(s.y, s.m, s.d + (e.days || 1))}`,
        `SUMMARY:${esc(e.title)}`);
      if (e.description) lines.push(`DESCRIPTION:${esc(e.description)}`);
      lines.push('TRANSP:TRANSPARENT', 'END:VEVENT');   // all-day markers: they don't make you "busy"
    }
    lines.push('END:VCALENDAR');
    return lines.map(fold).join('\r\n') + '\r\n';
  }

  // Events from the saved calendars and the settings.
  //   months: [{ y, m, days }]  (days = saved days of that month, or {})
  //   s: settings (types, school, patron, holidays, bridges)
  //   opts: { days, school, holidays }  which groups to include
  function collect(months, s, opts = {}) {
    const types = s.types || [];
    const label = (key) => { const t = types.find(x => x.key === key); return t ? `${t.emoji && t.mode === 'emoji' ? t.emoji + ' ' : ''}${t.label || key}` : ''; };
    const events = [];
    const first = months[0], last = months[months.length - 1];
    const fromSt = first ? CU.stamp(first.y, first.m, 1) : 0;
    const toSt = last ? CU.stamp(last.y, last.m, new Date(last.y, last.m + 1, 0).getDate()) : 0;

    // 1. Day types: consecutive days of the same type become one event; a day with a note is its own
    //    event, with the note as description. Days without a type but with a note are exported too.
    if (opts.days !== false) {
      for (const { y, m, days } of months) {
        const n = new Date(y, m + 1, 0).getDate();
        let run = null;
        const flush = () => { if (run) { events.push(run); run = null; } };
        for (let d = 1; d <= n; d++) {
          const dd = (days || {})[d];
          const type = dd && dd.type && dd.type !== 'neutral' ? dd.type : null;
          const note = dd && dd.note ? String(dd.note).trim() : '';
          const title = type ? label(type) : (note ? '📝' : '');
          if (!title) { flush(); continue; }
          if (note) {
            flush();
            events.push({ uid: `day-${dateVal(y, m, d)}`, start: { y, m, d }, days: 1, title: type ? title : `📝 ${note.split('\n')[0].slice(0, 60)}`, description: note });
            continue;
          }
          if (run && run.type === type && run.end === d - 1) { run.days++; run.end = d; continue; }
          flush();
          run = { uid: `day-${dateVal(y, m, d)}`, start: { y, m, d }, days: 1, title, type, end: d };
        }
        flush();
      }
    }

    // 2. School: first and last day of each school year, and the vacation periods, within the range.
    if (opts.school !== false && s.school && s.school.enabled !== false) {
      const inside = (iso) => { const t = SU.isoStamp(iso); return t >= fromSt && t <= toSt; };
      for (const [Y, yr] of Object.entries(s.school.years || {})) {
        const a = SU.parse(yr.start), b = SU.parse(yr.end);
        if (a && inside(yr.start)) events.push({ uid: `school-start-${Y}`, start: { y: a.y, m: a.m, d: a.d }, days: 1, title: opts.labels?.schoolStart || '🎒 Primo giorno di scuola' });
        if (b && inside(yr.end)) events.push({ uid: `school-end-${Y}`, start: { y: b.y, m: b.m, d: b.d }, days: 1, title: opts.labels?.schoolEnd || '🎒 Ultimo giorno di scuola' });
      }
      for (const p of s.school.periods || []) {
        if (!SU.validPeriod(p)) continue;
        const a = SU.isoStamp(p.from), b = SU.isoStamp(p.to);
        if (b < fromSt || a > toSt) continue;
        const f = SU.parse(p.from), t = SU.parse(p.to);
        const days = Math.round((new Date(t.y, t.m, t.d) - new Date(f.y, f.m, f.d)) / 86400000) + 1;
        events.push({ uid: `period-${p.id || slug(p.name) + '-' + p.from}`, start: { y: f.y, m: f.m, d: f.d }, days, title: `🏖️ ${p.name || opts.labels?.vacation || 'Vacanza'}` });
      }
    }

    // 3. Public holidays, patron saint's day and bridge days.
    if (opts.holidays) {
      const en = opts.lang === 'en';
      const cfg = { holidays: s.holidays || 'it', patron: s.patron, bridges: s.bridges };
      for (const { y, m } of months) {
        const n = new Date(y, m + 1, 0).getDate();
        for (let d = 1; d <= n; d++) {
          const hol = CU.holidayFor(y, m, d, cfg.holidays);
          const pat = SU.patronFor(y, m, d, cfg.patron);
          let title = '';
          if (hol) title = `🎉 ${en ? hol.en : hol.it}`;
          else if (pat) title = `⛪ ${pat.name || pat.city}`;
          else if (SU.isBridge(y, m, d, cfg)) title = `🌉 ${opts.labels?.bridge || 'Ponte'}`;
          if (title) events.push({ uid: `hol-${dateVal(y, m, d)}`, start: { y, m, d }, days: 1, title });
        }
      }
    }

    return events.map(({ type, end, ...e }) => e)
      .sort((a, b) => CU.stamp(a.start.y, a.start.m, a.start.d) - CU.stamp(b.start.y, b.start.m, b.start.d));
  }

  // ── Import ───────────────────────────────────────────────────────
  // Reads the events of an .ics file: [{ uid, summary, from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' }]
  // (to is inclusive). All-day and timed events, any time zone: only the date is used.
  // Recurring events (RRULE) are taken at their first date only.
  function unesc(s) {
    return String(s || '').replace(/\\n/gi, ' ').replace(/\\([,;\\])/g, '$1').replace(/\s+/g, ' ').trim();
  }
  function parseDate(v) {
    const r = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?/.exec(String(v || '').trim());
    if (!r) return null;
    let d = new Date(+r[1], +r[2] - 1, +r[3]);
    if (r[4] != null && r[7]) {                     // UTC time: the local date may differ
      const u = new Date(Date.UTC(+r[1], +r[2] - 1, +r[3], +r[4], +r[5], +(r[6] || 0)));
      d = new Date(u.getFullYear(), u.getMonth(), u.getDate());
    }
    return { date: d, timed: r[4] != null, midnight: r[4] != null && +r[4] === 0 && +r[5] === 0 };
  }
  const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  function parse(text) {
    const lines = String(text || '').replace(/\r\n?/g, '\n').replace(/\n[ \t]/g, '').split('\n');
    const out = [];
    let ev = null, depth = 0;
    for (const line of lines) {
      if (/^BEGIN:VEVENT$/i.test(line)) { ev = {}; depth = 0; continue; }
      if (!ev) continue;
      if (/^BEGIN:/i.test(line)) { depth++; continue; }   // VALARM inside the event
      if (/^END:VEVENT$/i.test(line)) {
        const a = parseDate(ev.DTSTART);
        if (a) {
          let to = a.date;
          const b = parseDate(ev.DTEND);
          if (b) {
            to = b.date;
            // DTEND is exclusive for all-day events, and for timed events ending at midnight.
            if (!b.timed || (b.midnight && to > a.date)) to = new Date(to.getFullYear(), to.getMonth(), to.getDate() - 1);
            if (to < a.date) to = a.date;
          } else if (ev.DURATION) {
            const m = /P(?:(\d+)W)?(?:(\d+)D)?/i.exec(ev.DURATION);
            const days = m ? (+(m[1] || 0)) * 7 + (+(m[2] || 0)) : 0;
            if (days > 1) to = new Date(a.date.getFullYear(), a.date.getMonth(), a.date.getDate() + days - 1);
          }
          out.push({ uid: ev.UID || '', summary: unesc(ev.SUMMARY) || '', from: isoOf(a.date), to: isoOf(to) });
        }
        ev = null; continue;
      }
      if (depth > 0) { if (/^END:/i.test(line)) depth--; continue; }
      const i = line.indexOf(':');
      if (i < 0) continue;
      const name = line.slice(0, i).split(';')[0].toUpperCase();
      if (['DTSTART', 'DTEND', 'SUMMARY', 'UID', 'DURATION'].includes(name) && ev[name] == null) ev[name] = line.slice(i + 1);
    }
    return out.sort((x, y) => x.from.localeCompare(y.from) || x.to.localeCompare(y.to));
  }

  // Sorts the events of a school calendar for the school year Y (1 September Y → 31 August Y+1):
  //   start / end: first and last day of lessons, if an event says so;
  //   periods: holidays and days without lessons, with `suggested` = likely a day off.
  const RX_START = /(inizio|apertura|avvio|primo giorno).{0,25}(lezion|attivit|scuol|anno scolastico)|first day of (school|classes|term)|school (starts|begins)/i;
  const RX_END = /(fine|termine|chiusura|ultimo giorno|conclusione).{0,25}(lezion|attivit|scuol|anno scolastico)|last day of (school|classes|term)|school ends/i;
  const RX_OFF = /vacanz|festiv|festa|sospension|chius|ponte|natal|pasqu|carneval|patron|ognissant|immacolat|epifani|liberazion|repubblica|lavoratori|holiday|break|vacation|no school|closed/i;

  function schoolFromEvents(events, Y) {
    const lo = `${Y}-09-01`, hi = `${Y + 1}-08-31`;
    const inYear = events.filter(e => e.to >= lo && e.from <= hi);
    let start = null, end = null;
    const periods = [];
    const seen = new Set();
    for (const e of inYear) {
      if (!start && RX_START.test(e.summary)) { start = e.from; continue; }
      if (RX_END.test(e.summary)) { end = e.to; continue; }
      const key = `${e.from}|${e.to}|${e.summary.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const multi = e.to > e.from;
      periods.push({ name: e.summary, from: e.from < lo ? lo : e.from, to: e.to > hi ? hi : e.to, suggested: RX_OFF.test(e.summary) || (multi && !RX_START.test(e.summary)) });
    }
    return { start, end, periods };
  }

  return { build, collect, esc, fold, parse, schoolFromEvents };
})();

if (typeof module !== 'undefined') module.exports = Ics;
