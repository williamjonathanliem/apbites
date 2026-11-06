import { useParams } from 'react-router-dom';
import { doc } from 'firebase/firestore';
import { db } from '../shared/firebase.js';
import { useLiveDoc } from '../shared/hooks.js';
import { formatRM } from '../shared/format.js';
import { Icon } from '../shared/icons.jsx';
import { BitesShell } from './BitesShell.jsx';

// S6: live order status. The pickup QR (shown only when Ready) arrives in build step 5.

const STEPS = [
  { id: 'new', label: 'Sent' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'ready', label: 'Ready' },
  { id: 'collected', label: 'Collected' },
];

const MESSAGES = {
  new: 'Paid and sent to the stall. They start cooking before your slot.',
  preparing: 'The stall is preparing your food.',
  ready: 'Ready at the counter. Show your pickup QR to collect.',
  collected: 'Collected. Enjoy your meal.',
  uncollected: 'Pickup time has passed and the order was not collected.',
};

export default function OrderStatus() {
  const { orderId } = useParams();
  const { data: order, loading } = useLiveDoc(doc(db, `orders/${orderId}`), orderId);

  if (loading) {
    return <BitesShell title="Your order" back="/student/bites"><div className="skeleton" style={{ height: 320 }} /></BitesShell>;
  }
  if (!order) {
    return <BitesShell title="Your order" back="/student/bites"><p className="empty">Order not found.</p></BitesShell>;
  }

  const idx = STEPS.findIndex((s) => s.id === order.status);

  return (
    <BitesShell title="Your order" back="/student/bites" showCart={false}>
      <section className="card order-head">
        <p className="muted small">Order</p>
        <p className="order-no">#{order.orderNo}</p>
        <p>Pickup <b>{order.pickupSlot}</b> · {order.stallName}</p>
        <p className="muted small">{order.dining === 'takeaway' ? 'Takeaway' : 'Eat in'} · {formatRM(order.totalRM)} via {order.payMethod === 'fpx' ? 'FPX' : 'APCard'}</p>
      </section>

      <section className="card" aria-labelledby="st-title">
        <h2 className="card-title" id="st-title">Status</h2>
        <ol className="steps" aria-label="Order progress">
          {STEPS.map((s, i) => (
            <li key={s.id} className={i < idx ? 'done' : i === idx ? 'current' : ''} aria-current={i === idx ? 'step' : undefined}>
              <span className="step-dot">{i < idx ? <Icon name="check" size={14} strokeWidth={3} /> : null}</span>
              {s.label}
            </li>
          ))}
        </ol>
        <p className="status-msg" aria-live="polite">{MESSAGES[order.status]}</p>
        {order.status !== 'ready' && order.status !== 'collected' && (
          <p className="muted small">Your pickup QR appears here when the order is Ready.</p>
        )}
      </section>

      <section className="card">
        <h2 className="card-title">Items</h2>
        <ul className="line-list" style={{ marginBottom: 0 }}>
          {order.items.map((l) => (
            <li className="line" key={l.itemId}>
              <div className="line-body"><p>{l.qty} × {l.name}</p></div>
              <span>{formatRM(l.priceRM * l.qty)}</span>
            </li>
          ))}
        </ul>
      </section>
    </BitesShell>
  );
}
