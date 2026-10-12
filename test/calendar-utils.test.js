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
