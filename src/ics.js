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

  return { build, collect, esc, fold };
})();

if (typeof module !== 'undefined') module.exports = Ics;
