import { adminDb } from '../server/firebaseAdmin.js';
import { ApiError, handler } from '../server/http.js';
import { appNow } from '../server/clock.js';
import { fetchApuTimetable, generateSampleTimetable } from '../server/timetable.js';

// POST /api/sync-timetable { studentId? } -> { source, classes }
// Refreshes students/{id}.timetable from config/app.timetableSource.
// 'apu' pulls APU's public feed (lecturer data dropped); falls back to the
// sample generator if the feed fails or the intake has no classes.
export default handler(async (body) => {
  const db = adminDb();
  const studentId = body.studentId || 'TP000000';
  const config = (await db.doc('config/app').get()).data() || {};
  const ref = db.doc(`students/${studentId}`);
  const snap = await ref.get();
  if (!snap.exists) throw new ApiError(404, 'no-student', 'Student not found.');

  const intake = snap.data().intake || config.intake;
  const { date } = appNow(config);
  let timetable = [];
  let source = 'sample';

  if (config.timetableSource === 'apu') {
    try {
      timetable = await fetchApuTimetable(intake);
      source = 'apu';
    } catch (e) {
      console.warn('APU timetable feed failed, using sample', e.message);
    }
  }
  if (timetable.length === 0) {
    timetable = generateSampleTimetable(date, { today: date });
    source = 'sample';
  }

  await ref.update({ timetable, timetableSource: source });
  return { source, classes: timetable.length };
});
