const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../src/school-utils.js');

test('suggested school year 2026-27', () => {
  const s = S.suggestYear(2026);
  assert.equal(s.start, '2026-09-15');           // Tuesday
  assert.equal(s.end, '2027-06-04');             // 6 June 2027 is a Sunday → Friday 4
  const p = Object.fromEntries(s.periods.map(x => [x.key, [x.from, x.to]]));
  assert.deepEqual(p.christmas, ['2026-12-23', '2027-01-06']);
  assert.deepEqual(p.carnival,  ['2027-02-08', '2027-02-09']);   // Easter 2027 = 28 March
  assert.deepEqual(p.easter,    ['2027-03-25', '2027-03-30']);
});

test('bridge days', () => {
  const cfg = { holidays: 'it', bridges: true };
  assert.equal(S.isBridge(2026, 5, 1, cfg), true);     // Mon 1 June, 2 June is Tuesday
  assert.equal(S.isBridge(2026, 11, 7, cfg), true);    // Mon 7 Dec, 8 Dec is Tuesday
  assert.equal(S.isBridge(2026, 11, 7, { ...cfg, patron: { month: 11, day: 7 } }), false);  // Milan: holiday itself
  assert.equal(S.isBridge(2026, 5, 1, { ...cfg, bridges: false }), false);
  assert.equal(S.isBridge(2026, 9, 14, cfg), false);
});

test('school and vacation days', () => {
  const cfg = { holidays: 'it', school: {
    years: { 2026: { start: '2026-09-15', end: '2027-06-04', saturday: false } },
    periods: [{ name: 'Natale', from: '2026-12-23', to: '2027-01-06' }],
  } };
  assert.equal(S.seasonFor(2026, 9, 14, cfg), 'school');      // Wednesday
  assert.equal(S.seasonFor(2026, 9, 17, cfg), null);          // Saturday
  assert.equal(S.seasonFor(2026, 9, 17, { ...cfg, school: { ...cfg.school, years: { 2026: { ...cfg.school.years[2026], saturday: true } } } }), 'school');
  assert.equal(S.seasonFor(2026, 11, 8, cfg), 'vacation');    // Immacolata
  assert.equal(S.seasonFor(2026, 11, 28, cfg), 'vacation');   // Christmas break
  assert.equal(S.seasonFor(2026, 8, 10, cfg), 'vacation');    // before the first day
  assert.equal(S.seasonFor(2027, 5, 20, cfg), 'vacation');    // summer
  assert.equal(S.seasonFor(2027, 8, 30, cfg), 'vacation');
  assert.equal(S.seasonFor(2027, 9, 1, cfg), null);           // 2027-28 not entered
  assert.equal(S.seasonFor(2026, 9, 14, { ...cfg, school: { ...cfg.school, enabled: false } }), null);
  // patron day is a holiday: no school
  assert.equal(S.seasonFor(2026, 9, 30, { ...cfg, patron: { month: 9, day: 30 } }), 'vacation');
});

test('when to ask for the school year', () => {
  assert.equal(S.needsYearPrompt({}, new Date(2026, 9, 14)), 2026);
  assert.equal(S.needsYearPrompt({}, new Date(2026, 8, 1)), 2026);
  assert.equal(S.needsYearPrompt({}, new Date(2027, 2, 1)), 2026);
  assert.equal(S.needsYearPrompt({}, new Date(2027, 6, 10)), null);   // July
  assert.equal(S.needsYearPrompt({}, new Date(2027, 3, 10)), null);   // April: the year is nearly over
  assert.equal(S.needsYearPrompt({}, new Date(2027, 5, 10)), null);
  assert.equal(S.needsYearPrompt({ years: { 2026: {} } }, new Date(2026, 9, 14)), null);
  assert.equal(S.needsYearPrompt({ dismissed: { 2026: true } }, new Date(2026, 9, 14)), null);
  assert.equal(S.needsYearPrompt({ enabled: false }, new Date(2026, 9, 14)), null);
});
