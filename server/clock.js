// All times are Asia/Kuala_Lumpur. Times of day are "HH:MM" strings.

const TZ = 'Asia/Kuala_Lumpur';

export function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function fromMinutes(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, '0');
  const m = String(mins % 60).padStart(2, '0');
  return `${h}:${m}`;
}

// Date and time-of-day in KL for a JS Date.
export function klParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short',
  }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t).value;
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
    weekday: get('weekday').toUpperCase(), // MON, TUE, ...
  };
}

// "Now" for the app. If config.demoTime is set (e.g. "13:15"), the date is
// real but the time of day is pinned, so the demo works at any hour.
export function appNow(config = {}, date = new Date()) {
  const p = klParts(date);
  const time = config.demoTime || p.time;
  return { date: p.date, time, minutes: toMinutes(time), weekday: p.weekday };
}

// Absolute Date for a KL date + time (KL is UTC+8, no DST).
export function klDate(dateStr, hhmm) {
  return new Date(`${dateStr}T${hhmm}:00+08:00`);
}
