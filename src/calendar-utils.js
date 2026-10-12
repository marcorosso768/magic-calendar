// calendar-utils.js — date helpers without DOM access (also loaded by the Node tests in test/).
//
// Months are 0-based everywhere (as in Date and in the saved calendars), days are 1-based.

const CalUtils = (() => {
  // Easter Sunday (Gregorian calendar, anonymous algorithm). Returns { month (0-based), day }.
  function easterSunday(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100;
    const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return { month: month - 1, day };
  }

  // National public holidays in Italy. Key "month-day" (month 0-based) → { it, en }.
  function italianHolidays(y) {
    const map = new Map();
    const add = (m, d, it, en) => map.set(`${m}-${d}`, { it, en });
    add(0, 1,   'Capodanno', 'New Year’s Day');
    add(0, 6,   'Epifania', 'Epiphany');
    add(3, 25,  'Liberazione', 'Liberation Day');
    add(4, 1,   'Festa del Lavoro', 'Labour Day');
    add(5, 2,   'Festa della Repubblica', 'Republic Day');
    add(7, 15,  'Ferragosto', 'Assumption Day');
    add(10, 1,  'Ognissanti', 'All Saints’ Day');
    add(11, 8,  'Immacolata', 'Immaculate Conception');
    add(11, 25, 'Natale', 'Christmas Day');
    add(11, 26, 'Santo Stefano', 'St Stephen’s Day');
    const e = easterSunday(y);
    add(e.month, e.day, 'Pasqua', 'Easter Sunday');
    const mon = new Date(y, e.month, e.day + 1);
    add(mon.getMonth(), mon.getDate(), 'Pasquetta', 'Easter Monday');
    return map;
  }

  const _holCache = new Map();
  function holidayFor(y, m, d, set = 'it') {
    if (set !== 'it') return null;
    if (!_holCache.has(y)) _holCache.set(y, italianHolidays(y));
    return _holCache.get(y).get(`${m}-${d}`) || null;
  }

  // Comparable number for a date: 20261012.
  function stamp(y, m, d) { return y * 10000 + (m + 1) * 100 + d; }
  function todayStamp(now = new Date()) { return stamp(now.getFullYear(), now.getMonth(), now.getDate()); }

  // -1 before today, 0 today, 1 after today.
  function relToToday(y, m, d, now = new Date()) {
    const s = stamp(y, m, d), t = todayStamp(now);
    return s < t ? -1 : s > t ? 1 : 0;
  }

  // Number of days of each type in a month's saved days: { together: 12, away: 18 }.
  function countTypes(days, daysInMonth) {
    const out = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const t = days && days[d] && days[d].type;
      if (t && t !== 'neutral') out[t] = (out[t] || 0) + 1;
    }
    return out;
  }

  // Whole days between two local dates (DST-safe).
  function daysBetween(a, b) {
    const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((ub - ua) / 86400000);
  }

  // Next day of each type from today on.
  //   months: [{ year, month, days }] — at most one calendar per month, any order.
  //   Returns [{ key, inDays, year, month, day }] sorted by inDays; inDays 0 = today.
  function nextOccurrences(months, typeKeys, now = new Date(), horizonDays = 120) {
    const byMonth = new Map(months.map(c => [`${c.year}-${c.month}`, c.days || {}]));
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const found = new Map();
    for (let i = 0; i <= horizonDays && found.size < typeKeys.length; i++) {
      const dt = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      const days = byMonth.get(`${dt.getFullYear()}-${dt.getMonth()}`);
      const t = days && days[dt.getDate()] && days[dt.getDate()].type;
      if (t && typeKeys.includes(t) && !found.has(t)) {
        found.set(t, { key: t, inDays: daysBetween(today, dt), year: dt.getFullYear(), month: dt.getMonth(), day: dt.getDate() });
      }
    }
    return [...found.values()].sort((a, b) => a.inDays - b.inDays);
  }

  return { easterSunday, italianHolidays, holidayFor, stamp, todayStamp, relToToday, countTypes, daysBetween, nextOccurrences };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = CalUtils;
