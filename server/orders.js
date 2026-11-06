// placeOrder: the only way an order is created.
// One Firestore transaction: checks the stall, menu, slot capacity and APCard
// balance, then books the slot, takes payment and writes the order. Two
// students racing for the last spot: the second gets "slot-full".

import { FieldValue } from 'firebase-admin/firestore';
import { appNow } from './clock.js';
import { ApiError } from './http.js';

const DINING = ['eatIn', 'takeaway'];
const PAY = ['apcard', 'fpx'];
const MAX_LINES = 10;
const MAX_QTY = 20;

const r2 = (n) => Math.round(n * 100) / 100;

export function validateOrderInput(body) {
  const { studentId, stallId, items, pickupSlot, dining, payMethod } = body || {};
  const bad = (msg) => { throw new ApiError(400, 'invalid', msg); };
  if (typeof studentId !== 'string' || !studentId) bad('Missing student.');
  if (typeof stallId !== 'string' || !stallId) bad('Missing stall.');
  if (!Array.isArray(items) || items.length === 0) bad('Your cart is empty.');
  if (items.length > MAX_LINES) bad('Too many different items in one order.');
  const seen = new Set();
  for (const it of items) {
    if (!it || typeof it.itemId !== 'string') bad('Bad item in cart.');
    if (!Number.isInteger(it.qty) || it.qty < 1 || it.qty > MAX_QTY) bad(`Quantity must be 1 to ${MAX_QTY}.`);
    if (seen.has(it.itemId)) bad('Duplicate item in cart.');
    seen.add(it.itemId);
  }
  if (typeof pickupSlot !== 'string' || !/^\d{2}:\d{2}$/.test(pickupSlot)) bad('Pick a pickup time.');
  if (!DINING.includes(dining)) bad('Choose eat-in or takeaway.');
  if (!PAY.includes(payMethod)) bad('Choose APCard or FPX.');
  return { studentId, stallId, items, pickupSlot, dining, payMethod };
}

export async function placeOrder(db, body, { clock = new Date() } = {}) {
  const input = validateOrderInput(body);
  const { studentId, stallId, pickupSlot, dining, payMethod } = input;

  return db.runTransaction(async (tx) => {
    const configSnap = await tx.get(db.doc('config/app'));
    const config = configSnap.data() || {};
    const now = appNow(config, clock);

    if (!(config.slotTimes || []).includes(pickupSlot)) {
      throw new ApiError(400, 'bad-slot', 'That pickup time is not offered.');
    }
    if (pickupSlot < now.time) {
      throw new ApiError(409, 'slot-past', 'That pickup time has passed. Pick a later one.');
    }

    const stallRef = db.doc(`stalls/${stallId}`);
    const studentRef = db.doc(`students/${studentId}`);
    const slotRef = db.doc(`slots/${stallId}_${now.date}_${pickupSlot}`);
    const counterRef = db.doc('config/counters');
    const itemRefs = input.items.map((it) => db.doc(`stalls/${stallId}/menuItems/${it.itemId}`));

    const [stallSnap, studentSnap, slotSnap, counterSnap, ...itemSnaps] = await tx.getAll(
      stallRef, studentRef, slotRef, counterRef, ...itemRefs,
    );

    if (!stallSnap.exists) throw new ApiError(404, 'no-stall', 'Stall not found.');
    const stall = stallSnap.data();
    if (stall.isOpen === false) throw new ApiError(409, 'stall-closed', `${stall.name} is closed right now.`);
    if (!studentSnap.exists) throw new ApiError(404, 'no-student', 'Student not found.');
    const student = studentSnap.data();

    const lines = input.items.map((it, i) => {
      const snap = itemSnaps[i];
      if (!snap.exists) throw new ApiError(409, 'item-gone', 'An item in your cart is no longer on the menu.', { itemId: it.itemId });
      const m = snap.data();
      if (m.available === false) throw new ApiError(409, 'sold-out', `${m.name} just sold out. Remove it to continue.`, { itemId: it.itemId });
      return { itemId: it.itemId, name: m.name, priceRM: m.priceRM, qty: it.qty };
    });
    const totalRM = r2(lines.reduce((s, l) => s + l.priceRM * l.qty, 0));

    const capacity = stall.slotCapacity ?? 5;
    const booked = slotSnap.exists ? slotSnap.data().booked || 0 : 0;
    if (booked >= capacity) {
      throw new ApiError(409, 'slot-full', `${pickupSlot} just filled up. Pick another time.`);
    }

    if (payMethod === 'apcard' && (student.apcardBalance ?? 0) < totalRM) {
      throw new ApiError(402, 'low-balance', 'Not enough APCard balance. Pay with FPX instead.');
    }

    const orderNo = (counterSnap.exists ? counterSnap.data().orderNo || 0 : 0) + 1;
    const orderRef = db.collection('orders').doc();

    if (slotSnap.exists) {
      tx.update(slotRef, { booked: booked + 1 });
    } else {
      tx.set(slotRef, { stallId, date: now.date, time: pickupSlot, booked: 1, capacity });
    }
    tx.set(counterRef, { orderNo }, { merge: true });
    if (payMethod === 'apcard') {
      tx.update(studentRef, { apcardBalance: r2(student.apcardBalance - totalRM) });
    }
    tx.set(orderRef, {
      orderNo,
      studentId,
      studentName: student.name,
      stallId,
      stallName: stall.name,
      items: lines,
      totalRM,
      date: now.date,
      pickupSlot,
      dining,
      payMethod,
      payStatus: 'paid',
      payRef: payMethod === 'fpx' ? `FPX-SIM-${orderRef.id.slice(0, 8).toUpperCase()}` : `APCARD-${orderRef.id.slice(0, 8).toUpperCase()}`,
      status: 'new',
      pickupToken: null,
      tokenExpiresAt: null,
      collectedAt: null,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { orderId: orderRef.id, orderNo, totalRM };
  });
}
