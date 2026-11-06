// Loads sample data into Firestore. Wipes the APBites collections first.
//
//   node seed/seed.js              -> Firestore emulator (default, localhost:8080)
//   node seed/seed.js --prod <id>  -> a real project (asks nothing, be sure)

import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { APP_CONFIG, SAMPLE_STUDENT, STALLS, MENU, TODAY_ORDERS, PAST_ORDERS } from './data.js';
import { appNow, klDate, klParts } from '../server/clock.js';
import { generateSampleTimetable } from '../server/timetable.js';

const args = process.argv.slice(2);
const prodIdx = args.indexOf('--prod');
let projectId = 'demo-apbites';
if (prodIdx >= 0) {
  projectId = args[prodIdx + 1];
  if (!projectId) throw new Error('Usage: node seed/seed.js --prod <projectId>');
  delete process.env.FIRESTORE_EMULATOR_HOST;
} else {
  process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';
}

initializeApp({ projectId });
const db = getFirestore();

const COLLECTIONS = ['config', 'students', 'stalls', 'slots', 'orders'];
const r2 = (n) => Math.round(n * 100) / 100;

function itemLines(stallId, items) {
  return items.map(([itemId, qty]) => {
    const m = MENU[stallId].find((x) => x.id === itemId);
    return { itemId, name: m.name, priceRM: m.priceRM, qty };
  });
}
const total = (lines) => r2(lines.reduce((s, l) => s + l.priceRM * l.qty, 0));

function daysBefore(dateStr, n) {
  const d = new Date(`${dateStr}T12:00:00+08:00`);
  d.setUTCDate(d.getUTCDate() - n);
  return klParts(d).date;
}

async function wipe() {
  for (const name of COLLECTIONS) {
    await db.recursiveDelete(db.collection(name));
  }
}

async function main() {
  const target = prodIdx >= 0 ? `project ${projectId}` : `emulator ${process.env.FIRESTORE_EMULATOR_HOST}`;
  console.log(`Seeding ${target}`);
  await wipe();

  const now = appNow(APP_CONFIG);
  const today = now.date;
  const batch = db.batch();

  batch.set(db.doc('config/app'), APP_CONFIG);
  batch.set(db.doc('config/counters'), { orderNo: Math.max(...TODAY_ORDERS.map((o) => o.orderNo)) });

  const timetable = generateSampleTimetable(today, { today });
  const { id: tp, ...student } = SAMPLE_STUDENT;
  batch.set(db.doc(`students/${tp}`), { ...student, timetable, timetableSource: 'sample' });

  for (const { id, ...stall } of STALLS) {
    batch.set(db.doc(`stalls/${id}`), stall);
    MENU[id].forEach(({ id: itemId, ...item }, i) => {
      batch.set(db.doc(`stalls/${id}/menuItems/${itemId}`), { ...item, rank: i + 1, available: true });
    });
  }

  // Slots for today, booked counts from the seeded orders.
  const booked = {};
  for (const o of TODAY_ORDERS) {
    const key = `${o.stallId}_${today}_${o.pickupSlot}`;
    booked[key] = (booked[key] || 0) + 1;
  }
  for (const { id, slotCapacity } of STALLS) {
    for (const time of APP_CONFIG.slotTimes) {
      const key = `${id}_${today}_${time}`;
      batch.set(db.doc(`slots/${key}`), { stallId: id, date: today, time, booked: booked[key] || 0, capacity: slotCapacity });
    }
  }

  // Today's orders from other students.
  TODAY_ORDERS.forEach((o, i) => {
    const lines = itemLines(o.stallId, o.items);
    const created = klDate(today, now.time);
    created.setMinutes(created.getMinutes() - 40 + i * 3);
    batch.set(db.collection('orders').doc(), {
      orderNo: o.orderNo,
      studentId: o.studentId,
      studentName: o.studentName,
      stallId: o.stallId,
      items: lines,
      totalRM: total(lines),
      date: today,
      pickupSlot: o.pickupSlot,
      dining: o.dining,
      payMethod: o.payMethod,
      payStatus: 'paid',
      status: o.status,
      pickupToken: null,
      tokenExpiresAt: null,
      collectedAt: null,
      createdAt: Timestamp.fromDate(created),
    });
  });

  // Sample student's history (collected, on earlier days).
  PAST_ORDERS.forEach((o, i) => {
    const date = daysBefore(today, o.daysAgo);
    const lines = itemLines(o.stallId, o.items);
    batch.set(db.collection('orders').doc(), {
      orderNo: 10 + i,
      studentId: SAMPLE_STUDENT.id,
      studentName: SAMPLE_STUDENT.name,
      stallId: o.stallId,
      items: lines,
      totalRM: total(lines),
      date,
      pickupSlot: o.pickupSlot,
      dining: 'eatIn',
      payMethod: 'apcard',
      payStatus: 'paid',
      status: 'collected',
      pickupToken: null,
      tokenExpiresAt: null,
      collectedAt: Timestamp.fromDate(klDate(date, o.pickupSlot)),
      createdAt: Timestamp.fromDate(klDate(date, '12:00')),
    });
  });

  await batch.commit();
  console.log(`Done. Date ${today}, demo time ${now.time}. ${STALLS.length} stalls, ${TODAY_ORDERS.length} orders today, ${PAST_ORDERS.length} past orders, ${timetable.length} classes.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
