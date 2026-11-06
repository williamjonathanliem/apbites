import { test } from 'node:test';
import assert from 'node:assert/strict';
import { suggestSlot } from '../suggest.js';

const timetable = [
  { date: '2026-11-06', start: '10:45', end: '12:45', module: 'A' },
  { date: '2026-11-06', start: '14:30', end: '16:30', module: 'B' },
];
const slots = (booked) => ['13:30', '13:40', '13:50', '14:00'].map((time, i) => ({ time, booked: booked[i], capacity: 5 }));

test('demo: 13:30 full, suggests 13:40 before a 14:30 class', () => {
  const s = suggestSlot({ slots: slots([5, 1, 1, 0]), timetable, date: '2026-11-06', nowTime: '13:15' });
  assert.equal(s.time, '13:40');
  assert.match(s.reason, /Next class 14:30/);
  assert.match(s.reason, /50 min to eat/);
});

test('earliest open slot when it fits', () => {
  assert.equal(suggestSlot({ slots: slots([0, 0, 0, 0]), timetable, date: '2026-11-06', nowTime: '13:15' }).time, '13:30');
});

test('skips slots that leave under 30 min to eat', () => {
  const s = suggestSlot({ slots: slots([5, 5, 5, 0]), timetable: [{ date: '2026-11-06', start: '14:20' }], date: '2026-11-06', nowTime: '13:15' });
  assert.equal(s.time, '14:00');
  assert.match(s.reason, /Tight/);
});

test('ignores past slots; null when all full', () => {
  assert.equal(suggestSlot({ slots: slots([0, 0, 0, 0]), timetable, date: '2026-11-06', nowTime: '13:45' }).time, '13:50');
  assert.equal(suggestSlot({ slots: slots([5, 5, 5, 5]), timetable, date: '2026-11-06', nowTime: '13:15' }), null);
});

test('no class left today: earliest open', () => {
  const s = suggestSlot({ slots: slots([0, 0, 0, 0]), timetable: [], date: '2026-11-06', nowTime: '13:15' });
  assert.equal(s.time, '13:30');
  assert.equal(s.nextClass, null);
});
