// placeOrder against the Firestore emulator. Skipped if the emulator is not running.
// Uses its own stall/student ids so it doesn't disturb the demo seed.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';
process.env.FIREBASE_PROJECT_ID ||= 'demo-apbites';

const { adminDb } = await import('../firebaseAdmin.js');
const { placeOrder } = await import('../orders.js');
const { appNow } = await import('../clock.js');

let up = true;
try {
  await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/`, { signal: AbortSignal.timeout(1500) });
} catch {
  up = false;
}
const opts = { skip: up ? false : 'Firestore emulator not running' };

const db = up ? adminDb() : null;
const STALL = 'teststall';
let date;

async function reset() {
  const config = (await db.doc('config/app').get()).data();
  assert.ok(config, 'run npm run seed first');
  date = appNow(config).date;
  await db.recursiveDelete(db.collection('stalls').doc(STALL));
  for (const t of config.slotTimes) await db.doc(`slots/${STALL}_${date}_${t}`).delete();
  const old = await db.collection('orders').where('stallId', '==', STALL).get();
  await Promise.all(old.docs.map((d) => d.ref.delete()));
  await db.doc(`stalls/${STALL}`).set({ name: 'Test Stall', cuisine: 'Test', slotCapacity: 5, prepMinPerOrder: 3, isOpen: true });
  await db.doc(`stalls/${STALL}/menuItems/rice`).set({ name: 'Rice', priceRM: 4.5, tags: [], available: true });
  await db.doc(`stalls/${STALL}/menuItems/gone`).set({ name: 'Gone', priceRM: 3, tags: [], available: false });
  await db.doc('students/TPTEST01').set({ name: 'TEST ONE', intake: 'X', apcardBalance: 100 });
  await db.doc('students/TPTEST02').set({ name: 'TEST TWO', intake: 'X', apcardBalance: 5 });
}

const order = (over = {}) => ({
  studentId: 'TPTEST01', stallId: STALL, items: [{ itemId: 'rice', qty: 1 }],
  pickupSlot: '14:00', dining: 'takeaway', payMethod: 'fpx', ...over,
});

before(async () => { if (up) await reset(); });

// Leave the demo data as it was.
after(async () => {
  if (!up) return;
  await db.recursiveDelete(db.collection('stalls').doc(STALL));
  const config = (await db.doc('config/app').get()).data();
  for (const t of config.slotTimes) await db.doc(`slots/${STALL}_${date}_${t}`).delete();
  const old = await db.collection('orders').where('stallId', '==', STALL).get();
  await Promise.all(old.docs.map((d) => d.ref.delete()));
  await db.doc('students/TPTEST01').delete();
  await db.doc('students/TPTEST02').delete();
});

test('APCard order deducts balance and books the slot', opts, async () => {
  const r = await placeOrder(db, order({ payMethod: 'apcard', items: [{ itemId: 'rice', qty: 2 }] }));
  assert.equal(r.totalRM, 9);
  const o = (await db.doc(`orders/${r.orderId}`).get()).data();
  assert.equal(o.status, 'new');
  assert.equal(o.payStatus, 'paid');
  assert.equal(o.items[0].name, 'Rice');
  assert.equal((await db.doc('students/TPTEST01').get()).data().apcardBalance, 91);
  assert.equal((await db.doc(`slots/${STALL}_${date}_14:00`).get()).data().booked, 1);
});

test('low APCard balance is blocked, FPX works', opts, async () => {
  await assert.rejects(placeOrder(db, order({ studentId: 'TPTEST02', payMethod: 'apcard', items: [{ itemId: 'rice', qty: 2 }] })), { code: 'low-balance' });
  const r = await placeOrder(db, order({ studentId: 'TPTEST02', payMethod: 'fpx', items: [{ itemId: 'rice', qty: 2 }] }));
  assert.ok(r.orderId);
  assert.equal((await db.doc('students/TPTEST02').get()).data().apcardBalance, 5);
});

test('sold-out item and bad input are rejected', opts, async () => {
  await assert.rejects(placeOrder(db, order({ items: [{ itemId: 'gone', qty: 1 }] })), { code: 'sold-out' });
  await assert.rejects(placeOrder(db, order({ items: [] })), { code: 'invalid' });
  await assert.rejects(placeOrder(db, order({ pickupSlot: '09:00' })), { code: 'bad-slot' });
});

test('8 students race for one slot: exactly 5 get it', opts, async () => {
  const results = await Promise.allSettled(
    Array.from({ length: 8 }, () => placeOrder(db, order({ pickupSlot: '13:50' }))),
  );
  const ok = results.filter((r) => r.status === 'fulfilled').length;
  const full = results.filter((r) => r.status === 'rejected' && r.reason.code === 'slot-full').length;
  assert.equal(ok, 5);
  assert.equal(full, 3);
  assert.equal((await db.doc(`slots/${STALL}_${date}_13:50`).get()).data().booked, 5);
  const nos = results.filter((r) => r.status === 'fulfilled').map((r) => r.value.orderNo);
  assert.equal(new Set(nos).size, 5, 'order numbers unique');
});

test('closed stall takes no orders', opts, async () => {
  await db.doc(`stalls/${STALL}`).update({ isOpen: false });
  await assert.rejects(placeOrder(db, order()), { code: 'stall-closed' });
  await db.doc(`stalls/${STALL}`).update({ isOpen: true });
});
