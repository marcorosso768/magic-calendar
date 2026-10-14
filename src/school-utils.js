// school-utils.js — school year, vacation periods, bridge days and patron saint's day.
// No DOM access: also loaded by the Node tests in test/. Uses CalUtils for the national holidays.
//
// Dates are stored as "YYYY-MM-DD" strings; months in function arguments are 0-based as elsewhere.
//
// Settings used (all optional):
//   school:  { enabled, colors: { school, vacation }, years: { "2026": { start, end, saturday } },
//              dismissed: { "2026": true }, periods: [{ id, name, from, to }] }
//   bridges: true | false          patron: { city, month, day, name } | null

const SchoolUtils = (() => {
  const CU = (typeof CalUtils !== 'undefined') ? CalUtils : require('./calendar-utils');

  const DEFAULT_COLORS = { school: '#dbeafe', vacation: '#fef3c7' };

  // Patron saint's days of the regional capitals and of other large cities (month 0-based).
  // A city not listed is entered by hand in Settings.
  const PATRONS = [
    { city: 'Ancona',          month: 4,  day: 4,  name: 'San Ciriaco' },
    { city: 'Aosta',           month: 8,  day: 7,  name: 'San Grato' },
    { city: 'Bari',            month: 11, day: 6,  name: 'San Nicola' },
    { city: 'Bergamo',         month: 7,  day: 26, name: 'Sant’Alessandro' },
    { city: 'Bologna',         month: 9,  day: 4,  name: 'San Petronio' },
    { city: 'Brescia',         month: 1,  day: 15, name: 'Santi Faustino e Giovita' },
    { city: 'Cagliari',        month: 9,  day: 30, name: 'San Saturnino' },
    { city: 'Campobasso',      month: 3,  day: 23, name: 'San Giorgio' },
    { city: 'Catania',         month: 1,  day: 5,  name: 'Sant’Agata' },
    { city: 'Catanzaro',       month: 6,  day: 16, name: 'San Vitaliano' },
    { city: 'Ferrara',         month: 3,  day: 23, name: 'San Giorgio' },
    { city: 'Firenze',         month: 5,  day: 24, name: 'San Giovanni Battista' },
    { city: 'Genova',          month: 5,  day: 24, name: 'San Giovanni Battista' },
    { city: 'L’Aquila',        month: 5,  day: 10, name: 'San Massimo' },
    { city: 'Lecce',           month: 7,  day: 26, name: 'Sant’Oronzo' },
    { city: 'Livorno',         month: 4,  day: 22, name: 'Santa Giulia' },
    { city: 'Messina',         month: 5,  day: 3,  name: 'Madonna della Lettera' },
    { city: 'Milano',          month: 11, day: 7,  name: 'Sant’Ambrogio' },
    { city: 'Modena',          month: 0,  day: 31, name: 'San Geminiano' },
    { city: 'Napoli',          month: 8,  day: 19, name: 'San Gennaro' },
    { city: 'Padova',          month: 5,  day: 13, name: 'Sant’Antonio' },
    { city: 'Palermo',         month: 6,  day: 15, name: 'Santa Rosalia' },
    { city: 'Parma',           month: 0,  day: 13, name: 'Sant’Ilario' },
    { city: 'Perugia',         month: 0,  day: 29, name: 'San Costanzo' },
    { city: 'Pescara',         month: 9,  day: 10, name: 'San Cetteo' },
    { city: 'Pisa',            month: 5,  day: 17, name: 'San Ranieri' },
    { city: 'Potenza',         month: 4,  day: 30, name: 'San Gerardo' },
    { city: 'Ravenna',         month: 6,  day: 23, name: 'Sant’Apollinare' },
    { city: 'Reggio Calabria', month: 3,  day: 23, name: 'San Giorgio' },
    { city: 'Reggio Emilia',   month: 10, day: 24, name: 'San Prospero' },
    { city: 'Rimini',          month: 9,  day: 14, name: 'San Gaudenzo' },
    { city: 'Roma',            month: 5,  day: 29, name: 'Santi Pietro e Paolo' },
    { city: 'Salerno',         month: 8,  day: 21, name: 'San Matteo' },
    { city: 'Taranto',         month: 4,  day: 10, name: 'San Cataldo' },
    { city: 'Torino',          month: 5,  day: 24, name: 'San Giovanni Battista' },
    { city: 'Trento',          month: 5,  day: 26, name: 'San Vigilio' },
    { city: 'Treviso',         month: 3,  day: 27, name: 'San Liberale' },
    { city: 'Trieste',         month: 10, day: 3,  name: 'San Giusto' },
    { city: 'Udine',           month: 6,  day: 12, name: 'Santi Ermacora e Fortunato' },
    { city: 'Venezia',         month: 3,  day: 25, name: 'San Marco' },
    { city: 'Verona',          month: 4,  day: 21, name: 'San Zeno' },
    { city: 'Vicenza',         month: 8,  day: 8,  name: 'Madonna di Monte Berico' },
  ];

  // ── Dates ────────────────────────────────────────────────────────
  const pad = (n) => String(n).padStart(2, '0');
  function iso(y, m, d) { const t = new Date(y, m, d); return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`; }
  function parse(s) {
    const r = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
    return r ? { y: +r[1], m: +r[2] - 1, d: +r[3] } : null;
  }
  // Comparable number (same as CalUtils.stamp) from an ISO string; NaN when invalid.
  function isoStamp(s) { const p = parse(s); return p ? CU.stamp(p.y, p.m, p.d) : NaN; }
  function addDays(y, m, d, n) { const t = new Date(y, m, d + n); return { y: t.getFullYear(), m: t.getMonth(), d: t.getDate() }; }
  const dow = (y, m, d) => new Date(y, m, d).getDay();   // 0 Sunday … 6 Saturday

  // School year that a date belongs to, named by the year it starts in (Sept 2026 → 2026).
  function schoolYearOf(y, m) { return m >= 8 ? y : y - 1; }

  // ── Holidays: national + patron ─────────────────────────────────
  function patronFor(y, m, d, patron) {
    return patron && patron.month === m && patron.day === d ? patron : null;
  }
  function isHoliday(y, m, d, cfg) {
    return !!(CU.holidayFor(y, m, d, cfg.holidays || 'it') || patronFor(y, m, d, cfg.patron));
  }

  // Bridge day ("ponte"): a working day between a holiday and the weekend.
  // Holiday on Tuesday → the Monday before; holiday on Thursday → the Friday after.
  function isBridge(y, m, d, cfg) {
    if (cfg.bridges === false) return false;
    const w = dow(y, m, d);
    if (isHoliday(y, m, d, cfg)) return false;
    if (w === 1) { const n = addDays(y, m, d, 1); return isHoliday(n.y, n.m, n.d, cfg); }
    if (w === 5) { const p = addDays(y, m, d, -1); return isHoliday(p.y, p.m, p.d, cfg); }
    return false;
  }

  // ── School / vacation ───────────────────────────────────────────
  // 'school', 'vacation' or null (no colour) for a day.
  //  - a vacation period (school break or family holiday) → vacation, also outside the school year;
  //  - inside a school year: holidays → vacation; Monday–Friday (and Saturday if chosen) → school;
  //    the other weekend days → no colour;
  //  - from 1 September to the first day of school, and from the day after the last one to the end
  //    of September or the next configured start → vacation (the summer).
  function seasonFor(y, m, d, cfg) {
    const sc = cfg.school;
    if (!sc || sc.enabled === false) return null;
    const st = CU.stamp(y, m, d);

    for (const p of sc.periods || []) {
      const a = isoStamp(p.from), b = isoStamp(p.to);
      if (st >= a && st <= b) return 'vacation';
    }

    const years = sc.years || {};
    const sy = schoolYearOf(y, m);
    const cur = years[sy];
    if (cur) {
      const a = isoStamp(cur.start), b = isoStamp(cur.end);
      if (st >= a && st <= b) {
        if (isHoliday(y, m, d, cfg)) return 'vacation';
        const w = dow(y, m, d);
        if (w >= 1 && w <= 5) return 'school';
        if (w === 6 && cur.saturday) return 'school';
        return null;
      }
      if (st < a && st >= CU.stamp(sy, 8, 1)) return 'vacation';          // September before school
    }
    // Summer after the previous school year (June → the next start, or the end of September).
    const prevYear = (m >= 5 && m <= 8) ? y - 1 : null;
    const prev = prevYear != null ? years[prevYear] : null;
    if (prev) {
      const endPrev = isoStamp(prev.end);
      const next = years[y];
      const until = next ? isoStamp(next.start) : CU.stamp(y, 8, 30) + 1;
      if (st > endPrev && st < until) return 'vacation';
    }
    return null;
  }

  // ── Suggestions for the school-year window ─────────────────────
  function nextWeekday(y, m, d) {
    let t = { y, m, d };
    while ([0, 6].includes(dow(t.y, t.m, t.d))) t = addDays(t.y, t.m, t.d, 1);
    return t;
  }
  function prevWeekday(y, m, d) {
    let t = { y, m, d };
    while ([0, 6].includes(dow(t.y, t.m, t.d))) t = addDays(t.y, t.m, t.d, -1);
    return t;
  }
  // Typical dates for school year Y: they are only a starting point, edited by the user.
  function suggestYear(Y) {
    const s = nextWeekday(Y, 8, 15), e = prevWeekday(Y + 1, 5, 6);
    const easter = CU.easterSunday(Y + 1);
    const carnMon = addDays(Y + 1, easter.month, easter.day, -48);
    const carnTue = addDays(Y + 1, easter.month, easter.day, -47);
    const eThu = addDays(Y + 1, easter.month, easter.day, -3);
    const eTue = addDays(Y + 1, easter.month, easter.day, 2);
    return {
      start: iso(s.y, s.m, s.d), end: iso(e.y, e.m, e.d), saturday: false,
      periods: [
        { key: 'christmas', from: iso(Y, 11, 23), to: iso(Y + 1, 0, 6) },
        { key: 'carnival',  from: iso(carnMon.y, carnMon.m, carnMon.d), to: iso(carnTue.y, carnTue.m, carnTue.d) },
        { key: 'easter',    from: iso(eThu.y, eThu.m, eThu.d), to: iso(eTue.y, eTue.m, eTue.d) },
      ],
    };
  }

  // The window asking for the school year opens from 1 September, once per school year, until it
  // is answered or dismissed. From April to August it is not shown (the year is nearly over; it can
  // still be entered from Settings).
  function needsYearPrompt(school, now = new Date()) {
    if (!school || school.enabled === false) return null;
    const m = now.getMonth();
    if (m >= 3 && m <= 7) return null;
    const Y = schoolYearOf(now.getFullYear(), m);
    if ((school.years || {})[Y] || (school.dismissed || {})[Y]) return null;
    return Y;
  }

  function validPeriod(p) {
    const a = isoStamp(p && p.from), b = isoStamp(p && p.to);
    return Number.isFinite(a) && Number.isFinite(b) && a <= b;
  }

  return { DEFAULT_COLORS, PATRONS, iso, parse, isoStamp, schoolYearOf, patronFor, isHoliday, isBridge,
           seasonFor, suggestYear, needsYearPrompt, validPeriod };
})();

if (typeof module !== 'undefined') module.exports = SchoolUtils;
