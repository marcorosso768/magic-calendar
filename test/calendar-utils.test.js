// Run with: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const U = require('../src/calendar-utils.js');

test('Easter Sunday', () => {
  const known = { 2000: [3, 23], 2024: [2, 31], 2025: [3, 20], 2026: [3, 5], 2027: [2, 28], 2038: [3, 25] };
  for (const [y, [m, d]] of Object.entries(known)) assert.deepEqual(U.easterSunday(+y), { month: m, day: d });
});

test('Italian holidays', () => {
  assert.equal(U.italianHolidays(2026).size, 12);
  assert.equal(U.holidayFor(2026, 3, 6).it, 'Pasquetta');
  assert.equal(U.holidayFor(2027, 2, 29).it, 'Pasquetta');
  assert.equal(U.holidayFor(2026, 11, 25).en, 'Christmas Day');
  assert.equal(U.holidayFor(2026, 11, 25, 'off'), null);
  assert.equal(U.holidayFor(2026, 9, 12), null);
});

test('relative to today', () => {
  const now = new Date(2026, 9, 12, 23, 59);
  assert.equal(U.relToToday(2026, 9, 11, now), -1);
  assert.equal(U.relToToday(2026, 9, 12, now), 0);
  assert.equal(U.relToToday(2026, 10, 1, now), 1);
});

test('count types', () => {
  const days = { 1: { type: 'together' }, 2: { type: 'away' }, 3: { type: 'together' }, 4: { type: 'neutral' }, 40: { type: 'away' } };
  assert.deepEqual(U.countTypes(days, 31), { together: 2, away: 1 });
});

test('next occurrences across months and DST', () => {
  const now = new Date(2026, 9, 12, 15, 0);
  const months = [
    { year: 2026, month: 10, days: { 2: { type: 'type3' } } },
    { year: 2026, month: 9, days: { 12: { type: 'away' }, 13: { type: 'away' }, 30: { type: 'together' } } },
  ];
  const r = U.nextOccurrences(months, ['together', 'away', 'type3', 'type4'], now);
  assert.deepEqual(r.map(x => [x.key, x.inDays]), [['away', 0], ['together', 18], ['type3', 21]]);
});

test('copy by weekday keeps weekly and alternate-week patterns', () => {
  // April 2026: Mondays 6, 13, 20, 27. Alternate weeks on Mondays; every Saturday "together".
  const src = { 6: { type: 'away' }, 13: { type: 'together' }, 20: { type: 'away' }, 27: { type: 'together' },
                4: { type: 'together', image: 'mcimg://local/x.png', note: 'n' }, 11: { type: 'together' }, 18: { type: 'together' }, 25: { type: 'together' },
                1: { type: 'neutral', icon: '⚽' } };
  const out = U.copyByWeekday(2026, 3, src, 2026, 10); // November 2026
  // Mondays of November 2026: 2, 9, 16, 23, 30 → away, together, away, together, away (cycles)
  assert.deepEqual([2, 9, 16, 23, 30].map(d => out[d] && out[d].type), ['away', 'together', 'away', 'together', 'away']);
  // Saturdays: 7, 14, 21, 28 → together; image and note are not copied
  assert.equal(out[7].type, 'together'); assert.equal(out[7].image, ''); assert.equal(out[7].note, '');
  // 1 April 2026 is a Wednesday with only an icon: first Wednesday of November is the 4th
  assert.equal(out[4].icon, '⚽');
  // Tuesdays had nothing
  assert.equal(out[3], undefined);
});
