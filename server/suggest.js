// Pickup slot suggestion: a plain rule, not AI.
// Earliest open slot (not past, not full) that still leaves `eatMinutes`
// before the student's next class today. With no class left today, the
// earliest open slot.

import { toMinutes } from './clock.js';

export const EAT_MINUTES = 30;

// slots: [{ time: "13:30", booked, capacity }]
// Returns { time, reason, nextClass } or null.
export function suggestSlot({ slots, timetable = [], date, nowTime, eatMinutes = EAT_MINUTES }) {
  const nextClass = timetable
    .filter((c) => c.date === date && c.start > nowTime)
    .sort((a, b) => a.start.localeCompare(b.start))[0] || null;

  const open = slots
    .filter((s) => s.time >= nowTime && s.booked < s.capacity)
    .sort((a, b) => a.time.localeCompare(b.time));
  if (!open.length) return null;

  if (!nextClass) {
    return { time: open[0].time, reason: 'Earliest open pickup slot.', nextClass: null };
  }

  const classStart = toMinutes(nextClass.start);
  const fits = open.find((s) => toMinutes(s.time) + eatMinutes <= classStart);
  if (!fits) {
    return { time: open[0].time, reason: `Next class ${nextClass.start}. Tight, but this is the earliest open slot.`, nextClass };
  }
  const spare = classStart - toMinutes(fits.time);
  return { time: fits.time, reason: `Next class ${nextClass.start}. Pick up ${fits.time} and you have ${spare} min to eat.`, nextClass };
}
