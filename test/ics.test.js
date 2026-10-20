const test = require('node:test');
const assert = require('node:assert/strict');
const Ics = require('../src/ics.js');

const settings = {
  types: [{ key: 'together', label: 'Siamo qui!', emoji: '💜', mode: 'emoji' }, { key: 'away', label: 'Sono lontano', mode: 'avatar_heart' }],
  holidays: 'it', bridges: true, patron: { city: 'Bologna', month: 9, day: 4, name: 'San Petronio' },
  school: { enabled: true, years: { 2026: { start: '2026-09-15', end: '2027-06-04' } },
            periods: [{ id: 'p1', name: 'Natale', from: '2026-12-23', to: '2027-01-06' }] },
};

test('consecutive days of the same type become one event; notes split', () => {
  const months = [{ y: 2026, m: 9, days: { 1: { type: 'together' }, 2: { type: 'together' }, 3: { type: 'together', note: 'cena; da nonna' }, 4: { type: 'away' }, 5: { type: 'away' }, 9: { type: 'neutral', note: 'dentista' } } }];
  const ev = Ics.collect(months, settings, { school: false });
  assert.deepEqual(ev.map(e => [e.start.d, e.days, e.title]), [
    [1, 2, '💜 Siamo qui!'], [3, 1, '💜 Siamo qui!'], [4, 2, 'Sono lontano'], [9, 1, '📝 dentista'],
  ]);
  assert.equal(ev[1].description, 'cena; da nonna');
});

test('school, periods, holidays, patron and bridges within the range', () => {
  const months = [{ y: 2026, m: 11, days: {} }];
  const ev = Ics.collect(months, settings, { days: false, holidays: true });
  const t = ev.map(e => `${e.start.d}:${e.title}:${e.days}`);
  assert.ok(t.includes('7:🌉 Ponte:1'));             // Mon 7 Dec 2026, Immacolata on Tuesday
  assert.ok(t.includes('8:🎉 Immacolata:1'));
  assert.ok(t.includes('23:🏖️ Natale:15'));          // 23 Dec → 6 Jan
  assert.ok(!t.some(x => x.includes('scuola')));      // start/end are not in December
  const oct = Ics.collect([{ y: 2026, m: 9, days: {} }], settings, { days: false, holidays: true });
  assert.ok(oct.some(e => e.title === '⛪ San Petronio' && e.start.d === 4));
});

test('valid iCalendar text: escaping, all-day dates, folding, stable UIDs', () => {
  const ics = Ics.build({ calName: 'Il nostro, calendario', now: new Date(Date.UTC(2026, 9, 19, 8, 0, 0)), events: [
    { uid: 'day-20261003', start: { y: 2026, m: 9, d: 3 }, days: 1, title: 'Siamo qui!', description: 'cena; da nonna\nore 20' },
    { uid: 'period-p1', start: { y: 2026, m: 11, d: 23 }, days: 15, title: 'x'.repeat(200) },
  ] });
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n'));
  assert.ok(ics.includes(String.raw`X-WR-CALNAME:Il nostro\, calendario`));
  assert.ok(ics.includes('DTSTAMP:20261019T080000Z'));
  assert.ok(ics.includes('DTSTART;VALUE=DATE:20261003\r\nDTEND;VALUE=DATE:20261004'));
  assert.ok(ics.includes('DTSTART;VALUE=DATE:20261223\r\nDTEND;VALUE=DATE:20270107'));
  assert.ok(ics.includes('DESCRIPTION:cena\\; da nonna\\nore 20'));
  assert.ok(ics.includes('UID:day-20261003@magic-calendar'));
  for (const line of ics.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75, line);
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 2);
});
