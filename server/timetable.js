// Timetable for the sample student.
//
// Two sources:
//  - "sample": generated, deterministic. Always gives the demo a class today
//    at 14:30 (the brief's sample student).
//  - "apu": APU's public weekly timetable feed (the one APSpace uses), filtered
//    to one intake. Lecturer names, IDs and emails are dropped; we keep only
//    module, room and times.
//
// Output shape (both sources), one entry per class:
//   { date: "2026-11-06", day: "FRI", start: "14:30", end: "16:30",
//     module: "Software Architecture", moduleCode: "CT056-3-2", room: "B-07-05" }

import { klParts } from './clock.js';

export const APU_FEED_URL = 'https://s3-ap-southeast-1.amazonaws.com/open-ws/weektimetable';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

// Invented module list for a year-2 software engineering intake.
const SAMPLE_MODULES = [
  { module: 'Software Architecture', moduleCode: 'SE-SA-2' },
  { module: 'Mobile App Engineering', moduleCode: 'SE-MAE-2' },
  { module: 'Database Systems', moduleCode: 'SE-DBS-2' },
  { module: 'Cloud Infrastructure', moduleCode: 'SE-CI-2' },
  { module: 'Human Computer Interaction', moduleCode: 'SE-HCI-2' },
];
const SAMPLE_ROOMS = ['B-07-05', 'D-05-02', 'Tech Lab 4-03', 'E-08-01', 'B-06-09'];

// Per weekday: list of [start, end, moduleIndex]. Every weekday has a lunch
// break that ends with a class at 14:30, so the slot suggestion always has
// something to plan around.
const SAMPLE_WEEK = {
  MON: [['08:30', '10:30', 0], ['10:45', '12:45', 1], ['14:30', '16:30', 2]],
  TUE: [['10:45', '12:45', 3], ['14:30', '16:30', 4]],
  WED: [['08:30', '10:30', 2], ['10:45', '12:45', 0], ['14:30', '16:30', 1]],
  THU: [['10:45', '12:45', 4], ['14:30', '16:30', 3]],
  FRI: [['10:45', '12:45', 1], ['14:30', '16:30', 0]],
};

function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T12:00:00+08:00`);
  d.setUTCDate(d.getUTCDate() + n);
  return klParts(d).date;
}

// Monday of the KL week containing dateStr.
function mondayOf(dateStr) {
  const d = new Date(`${dateStr}T12:00:00+08:00`);
  const dow = (d.getUTCDay() + 6) % 7; // Mon=0
  return addDays(dateStr, -dow);
}

// Generates `weeks` weeks of sample classes starting from the week of `fromDate`.
// If `today` falls on a weekend, it still gets a 14:30 class so the demo works.
export function generateSampleTimetable(fromDate, { weeks = 2, today = fromDate } = {}) {
  const out = [];
  const monday = mondayOf(fromDate);
  for (let w = 0; w < weeks; w++) {
    DAYS.forEach((day, i) => {
      const date = addDays(monday, w * 7 + i);
      SAMPLE_WEEK[day].forEach(([start, end, m], k) => {
        out.push({
          date, day, start, end,
          ...SAMPLE_MODULES[m],
          room: SAMPLE_ROOMS[(m + k) % SAMPLE_ROOMS.length],
        });
      });
    });
  }
  const todayDay = klParts(new Date(`${today}T12:00:00+08:00`)).weekday;
  if (!DAYS.includes(todayDay)) {
    out.push({ date: today, day: todayDay, start: '14:30', end: '16:30', ...SAMPLE_MODULES[0], room: SAMPLE_ROOMS[0] });
  }
  return out.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
}

// "03:45 PM" -> "15:45"
function to24h(t) {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(t.trim());
  if (!m) return t;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
}

// Maps raw APU feed rows for one intake to our shape. Drops personal data.
export function mapApuRows(rows, intake) {
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    if (r.INTAKE !== intake) continue;
    const entry = {
      date: r.DATESTAMP_ISO,
      day: r.DAY,
      start: to24h(r.TIME_FROM),
      end: to24h(r.TIME_TO),
      module: r.MODULE_NAME,
      moduleCode: r.MODID,
      room: r.ROOM,
    };
    const key = `${entry.date}|${entry.start}|${entry.moduleCode}`;
    if (seen.has(key)) continue; // same class listed per group
    seen.add(key);
    out.push(entry);
  }
  return out.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
}

export async function fetchApuTimetable(intake, { fetchImpl = fetch, timeoutMs = 15000 } = {}) {
  const res = await fetchImpl(APU_FEED_URL, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`APU timetable feed returned ${res.status}`);
  const rows = await res.json();
  return mapApuRows(rows, intake);
}

// Next class at or after `time` on `date`, or null.
export function nextClassToday(timetable, date, time) {
  return timetable.find((c) => c.date === date && c.start >= time) || null;
}
