const test = require('node:test');
const assert = require('node:assert/strict');
const Ics = require('../src/ics.js');

const sample = [
  'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Scuola//IT',
  'BEGIN:VEVENT', 'UID:1', 'DTSTART;VALUE=DATE:20260915', 'DTEND;VALUE=DATE:20260916', 'SUMMARY:Inizio delle lezioni', 'END:VEVENT',
  'BEGIN:VEVENT', 'UID:2', 'DTSTART;VALUE=DATE:20261223', 'DTEND;VALUE=DATE:20270107', 'SUMMARY:Vacanze di Natale', 'END:VEVENT',
  'BEGIN:VEVENT', 'UID:3', 'DTSTART;TZID=Europe/Rome:20261102T000000', 'DTEND;TZID=Europe/Rome:20261103T000000', 'SUMMARY:Sospensione attività didattica', 'END:VEVENT',
  'BEGIN:VEVENT', 'UID:4', 'DTSTART:20261015T150000', 'DTEND:20261015T170000', 'SUMMARY:Consiglio di classe\\, 3A', 'BEGIN:VALARM', 'TRIGGER:-PT15M', 'SUMMARY:x', 'END:VALARM', 'END:VEVENT',
  'BEGIN:VEVENT', 'UID:5', 'DTSTART;VALUE=DATE:20270211', 'DTEND;VALUE=DATE:20270214', 'SUMMARY:Carnevale', 'END:VEVENT',
  'BEGIN:VEVENT', 'UID:6', 'DTSTART;VALUE=DATE:20270605', 'SUMMARY:Termine delle lezioni', 'END:VEVENT',
  'BEGIN:VEVENT', 'UID:7', 'DTSTART;VALUE=DATE:20250910', 'DTEND;VALUE=DATE:20250911', 'SUMMARY:Anno precedente', 'END:VEVENT',
  'BEGIN:VEVENT', 'UID:8', 'DTSTART;VALUE=DATE:20270101', 'DTEND;VALUE=DATE:20270102', 'SUMMARY:Lungo titolo che viene spezzato su più righe perché supera i settantacinque ', ' caratteri', 'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n');

test('parse: all-day, timed, exclusive end, escapes, folded lines, alarms', () => {
  const ev = Ics.parse(sample);
  const by = Object.fromEntries(ev.map(e => [e.uid, e]));
  assert.deepEqual([by[2].from, by[2].to], ['2026-12-23', '2027-01-06']);
  assert.deepEqual([by[3].from, by[3].to], ['2026-11-02', '2026-11-02']);
  assert.deepEqual([by[4].from, by[4].to, by[4].summary], ['2026-10-15', '2026-10-15', 'Consiglio di classe, 3A']);
  assert.deepEqual([by[6].from, by[6].to], ['2027-06-05', '2027-06-05']);
  assert.equal(by[8].summary, 'Lungo titolo che viene spezzato su più righe perché supera i settantacinque caratteri');
  assert.equal(ev.length, 8);
});

test('school year from the events', () => {
  const r = Ics.schoolFromEvents(Ics.parse(sample), 2026);
  assert.equal(r.start, '2026-09-15');
  assert.equal(r.end, '2027-06-05');
  const names = r.periods.map(p => `${p.name}:${p.suggested}`);
  assert.ok(names.includes('Vacanze di Natale:true'));
  assert.ok(names.includes('Sospensione attività didattica:true'));
  assert.ok(names.includes('Carnevale:true'));
  assert.ok(names.includes('Consiglio di classe, 3A:false'));
  assert.ok(!names.some(n => n.startsWith('Anno precedente')));
});

test('round trip: an exported file can be read back', () => {
  const text = Ics.build({ calName: 'x', events: [{ uid: 'a', start: { y: 2026, m: 11, d: 23 }, days: 15, title: 'Natale, vacanze' }] });
  assert.deepEqual(Ics.parse(text).map(e => [e.from, e.to, e.summary]), [['2026-12-23', '2027-01-06', 'Natale, vacanze']]);
});
