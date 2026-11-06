import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where } from 'firebase/firestore';
import { db } from '../shared/firebase.js';
import { STUDENT_ID, useAppData } from '../shared/appData.jsx';
import { useLiveQuery } from '../shared/hooks.js';
import { formatRM, waitLabel } from '../shared/format.js';
import { Icon } from '../shared/icons.jsx';
import { findUsual } from '../../../server/usual.js';
import { BitesShell } from './BitesShell.jsx';
import { useAddToCart } from './useAddToCart.jsx';

// S2: stalls with current pre-order wait, Order my usual, plain-words search.

export function SearchBox({ initial = '' }) {
  const navigate = useNavigate();
  const [text, setText] = useState(initial);
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim()) navigate(`/student/bites/search?q=${encodeURIComponent(text.trim())}`);
      }}
    >
      <label className="search-box">
        <Icon name="search" size={20} className="muted" />
        <span className="sr-only">Say what you want to eat</span>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="halal, not spicy, under RM8"
          enterKeyHint="search"
        />
        <button className="btn" type="submit" style={{ minHeight: 40, padding: '0 14px' }}>Find</button>
      </label>
      <p className="search-hint">Type what you feel like, in any language.</p>
    </form>
  );
}

function UsualCard({ history }) {
  const navigate = useNavigate();
  const { stallById, menuByStall } = useAppData();
  const usual = useMemo(() => findUsual(history), [history]);
  const [addItem, dialog] = useAddToCart();

  if (!usual) return null;
  const item = (menuByStall[usual.stallId] || []).find((m) => m.id === usual.itemId);
  const stall = stallById[usual.stallId];
  if (!item || !stall) return null;
  const unavailable = item.available === false || stall.isOpen === false;

  return (
    <section className="card usual" aria-label="Order my usual">
      <div className="stall-mark" aria-hidden="true"><Icon name="repeat" /></div>
      <div className="usual-body">
        <p className="muted small">Your usual</p>
        <p className="usual-name">{item.name}</p>
        <p className="muted small">{stall.name} · {formatRM(item.priceRM)}</p>
      </div>
      <button
        className="btn"
        type="button"
        disabled={unavailable}
        onClick={() => addItem(usual.stallId, usual.itemId, () => navigate('/student/bites/checkout'))}
      >
        Order my usual
      </button>
      {dialog}
    </section>
  );
}

const STATUS_LABEL = { new: 'Sent to stall', preparing: 'Preparing', ready: 'Ready to collect' };

function ActiveOrders({ history, today }) {
  const active = history
    .filter((o) => o.date === today && STATUS_LABEL[o.status])
    .sort((a, b) => a.pickupSlot.localeCompare(b.pickupSlot));
  if (!active.length) return null;
  return active.map((o) => (
    <Link key={o.id} className="card active-order" to={`/student/bites/order/${o.id}`}>
      <div className="stall-mark" aria-hidden="true"><Icon name="bag" /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="muted small">Order #{o.orderNo} · Pickup {o.pickupSlot}</p>
        <p style={{ fontWeight: 500 }}>{STATUS_LABEL[o.status]} · {o.stallName}</p>
      </div>
      <Icon name="chevron" />
    </Link>
  ));
}

export default function Stalls() {
  const { stalls, waitByStall, loading, error, now } = useAppData();
  const history = useLiveQuery(query(collection(db, 'orders'), where('studentId', '==', STUDENT_ID)), 'history');

  return (
    <BitesShell title="APBites">
      <ActiveOrders history={history.data} today={now.date} />
      <SearchBox />
      {error && <p className="notice error" role="alert">Can't load stalls right now.</p>}
      <UsualCard history={history.data} />
      <h2 className="section-title">Stalls at Centrepoint</h2>
      {loading ? (
        <div className="skeleton" style={{ height: 300 }} />
      ) : (
        <ul className="stall-list">
          {stalls.map((s) => {
            const w = waitByStall[s.id] || { open: 0, minutes: 0 };
            const closed = s.isOpen === false;
            return (
              <li key={s.id}>
                <Link className="stall-card" to={`/student/bites/stall/${s.id}`} aria-disabled={closed || undefined}>
                  <div className="stall-mark" aria-hidden="true">{s.name[0]}</div>
                  <div className="stall-info">
                    <p className="stall-name">{s.name}</p>
                    <p className="stall-meta">{s.cuisine} · {s.location}</p>
                  </div>
                  {closed ? (
                    <div className="wait"><b>Closed</b></div>
                  ) : (
                    <div className={`wait${w.minutes ? '' : ' none'}`}>
                      <b>{waitLabel(w.minutes)}</b>
                      <span>{w.open} pre-order{w.open === 1 ? '' : 's'}</span>
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </BitesShell>
  );
}
