import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where } from 'firebase/firestore';
import { db } from '../shared/firebase.js';
import { STUDENT_ID, useAppData } from '../shared/appData.jsx';
import { cartLines, useCart } from '../shared/cart.jsx';
import { useLiveQuery } from '../shared/hooks.js';
import { callApi } from '../shared/api.js';
import { formatRM } from '../shared/format.js';
import { Icon } from '../shared/icons.jsx';
import { suggestSlot } from '../../../server/suggest.js';
import { BitesShell } from './BitesShell.jsx';

// S5: cart summary, 10-min pickup slots (Full state, timetable suggestion),
// eat-in or takeaway, APCard (blocked if low) or FPX (simulated), place order.

function FpxDialog({ amount, onPay, onCancel }) {
  return (
    <div className="overlay dialog-wrap" onClick={onCancel}>
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="fpx-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="fpx-title">FPX payment</h2>
        <p>Simulated online banking for the prototype. No real money moves.</p>
        <div className="total-row"><span>Amount</span><b>{formatRM(amount)}</b></div>
        <div className="dialog-actions">
          <button className="btn block" type="button" onClick={onPay} autoFocus>Approve payment</button>
          <button className="btn ghost block" type="button" onClick={onCancel}>Cancel</button>
        </div>
      </section>
    </div>
  );
}

export default function Checkout() {
  const navigate = useNavigate();
  const { menuByStall, stallById, student, config, now } = useAppData();
  const { cart, clear } = useCart();
  const { lines, totalRM, count } = cartLines(cart, menuByStall);
  const stall = stallById[cart.stallId];

  const slotDocs = useLiveQuery(
    cart.stallId ? query(collection(db, 'slots'), where('stallId', '==', cart.stallId), where('date', '==', now.date)) : null,
    `slots-${cart.stallId}-${now.date}`,
  );

  const slots = useMemo(() => {
    const byTime = Object.fromEntries(slotDocs.data.map((s) => [s.time, s]));
    return (config.slotTimes || []).map((time) => {
      const d = byTime[time];
      const capacity = d?.capacity ?? stall?.slotCapacity ?? 5;
      const booked = d?.booked ?? 0;
      return { time, booked, capacity, full: booked >= capacity, past: time < now.time };
    });
  }, [slotDocs.data, config.slotTimes, stall, now.time]);

  const suggestion = useMemo(
    () => suggestSlot({ slots, timetable: student?.timetable || [], date: now.date, nowTime: now.time }),
    [slots, student, now],
  );

  const [slot, setSlot] = useState(null);
  const [dining, setDining] = useState('eatIn');
  const [pay, setPay] = useState('apcard');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [fpxOpen, setFpxOpen] = useState(false);

  const balance = student?.apcardBalance ?? 0;
  const lowBalance = balance < totalRM;
  const payMethod = pay === 'apcard' && lowBalance ? null : pay;
  const chosen = slots.find((s) => s.time === slot);
  const slotOk = chosen && !chosen.full && !chosen.past;
  const blocked = lines.some((l) => !l.available);
  const canPlace = count > 0 && slotOk && payMethod && !blocked && !busy && stall?.isOpen !== false;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const r = await callApi('place-order', {
        studentId: STUDENT_ID,
        stallId: cart.stallId,
        items: lines.map((l) => ({ itemId: l.itemId, qty: l.qty })),
        pickupSlot: slot,
        dining,
        payMethod,
      });
      clear();
      navigate(`/student/bites/order/${r.orderId}`, { replace: true });
    } catch (e) {
      if (e.code === 'slot-full' || e.code === 'slot-past') setSlot(null);
      setError(e.message);
      setBusy(false);
    }
  }

  const place = () => (payMethod === 'fpx' ? setFpxOpen(true) : submit());

  if (count === 0) {
    return (
      <BitesShell title="Checkout" back="/student/bites" showCart={false}>
        <div className="card empty">
          <p>Your cart is empty.</p>
          <Link className="btn ghost" to="/student/bites">Browse stalls</Link>
        </div>
      </BitesShell>
    );
  }

  return (
    <BitesShell title="Checkout" back={`/student/bites/stall/${cart.stallId}`} showCart={false}>
      <section className="card" aria-labelledby="sum-title">
        <h2 className="card-title" id="sum-title">{stall?.name}</h2>
        <ul className="line-list">
          {lines.map((l) => (
            <li className="line" key={l.itemId}>
              <div className="line-body">
                <p>{l.qty} × {l.name}</p>
                {!l.available && <p className="small" style={{ color: 'var(--danger)' }}>Sold out. Go back and remove it.</p>}
              </div>
              <span>{formatRM(l.priceRM * l.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="total-row" style={{ marginBottom: 0 }}><span>Total</span><b>{formatRM(totalRM)}</b></div>
      </section>

      <section className="card" aria-labelledby="slot-title">
        <h2 className="card-title" id="slot-title">Pickup time</h2>
        {suggestion && (
          <div className="notice" style={{ marginBottom: 12, alignItems: 'center' }}>
            <Icon name="clock" size={20} />
            <span style={{ flex: 1 }}>{suggestion.reason}</span>
            {slot !== suggestion.time && (
              <button className="btn" type="button" style={{ minHeight: 40 }} onClick={() => setSlot(suggestion.time)}>
                Use {suggestion.time}
              </button>
            )}
          </div>
        )}
        <div className="slot-grid" role="radiogroup" aria-label="Pickup time">
          {slots.map((s) => {
            const disabled = s.full || s.past;
            const left = s.capacity - s.booked;
            return (
              <button
                key={s.time}
                type="button"
                role="radio"
                aria-checked={slot === s.time}
                disabled={disabled}
                className="slot"
                onClick={() => setSlot(s.time)}
              >
                <b>{s.time}</b>
                <span>{s.past ? 'Passed' : s.full ? 'Full' : `${left} left`}</span>
                {suggestion?.time === s.time && !disabled && <em>Suggested</em>}
              </button>
            );
          })}
        </div>
        <p className="muted small" style={{ margin: '10px 2px 0' }}>Each 10-minute slot takes up to {stall?.slotCapacity ?? 5} pre-orders, so walk-ins still get served.</p>
      </section>

      <section className="card" aria-labelledby="dine-title">
        <h2 className="card-title" id="dine-title">Eat in or takeaway</h2>
        <div className="choice-row" role="radiogroup" aria-label="Eat in or takeaway">
          {[['eatIn', 'Eat in', 'Plate at Centrepoint'], ['takeaway', 'Takeaway', 'Packed to go']].map(([v, label, sub]) => (
            <button key={v} type="button" role="radio" aria-checked={dining === v} className="choice" onClick={() => setDining(v)}>
              <b>{label}</b><span>{sub}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card" aria-labelledby="pay-title">
        <h2 className="card-title" id="pay-title">Pay with</h2>
        <div className="choice-row" role="radiogroup" aria-label="Payment method">
          <button type="button" role="radio" aria-checked={pay === 'apcard'} className="choice" onClick={() => setPay('apcard')}>
            <b>APCard</b><span>Balance {formatRM(balance)}</span>
          </button>
          <button type="button" role="radio" aria-checked={pay === 'fpx'} className="choice" onClick={() => setPay('fpx')}>
            <b>FPX</b><span>Online banking</span>
          </button>
        </div>
        {pay === 'apcard' && lowBalance && (
          <p className="notice warn" style={{ marginTop: 12 }}>Not enough APCard balance. Choose FPX or top up.</p>
        )}
      </section>

      {error && <p className="notice error" role="alert">{error}</p>}

      <button className="btn block" type="button" style={{ minHeight: 54 }} disabled={!canPlace} onClick={place}>
        {busy ? 'Placing order...' : `Pay ${formatRM(totalRM)} and place order`}
      </button>
      {!slotOk && !busy && <p className="muted small" style={{ margin: '-6px 4px 0', textAlign: 'center' }}>Pick a pickup time to continue.</p>}

      {fpxOpen && (
        <FpxDialog
          amount={totalRM}
          onCancel={() => setFpxOpen(false)}
          onPay={() => { setFpxOpen(false); submit(); }}
        />
      )}
    </BitesShell>
  );
}
