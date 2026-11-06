import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../shared/appData.jsx';
import { cartLines, useCart } from '../shared/cart.jsx';
import { formatRM } from '../shared/format.js';
import { Icon } from '../shared/icons.jsx';

// Shared frame for APBites screens: back bar with APCard balance, cart bar.

export function BitesShell({ title, back = '/student', showCart = true, children }) {
  const navigate = useNavigate();
  const { student, menuByStall } = useAppData();
  const { cart } = useCart();
  const { count, totalRM } = cartLines(cart, menuByStall);
  const [open, setOpen] = useState(false);

  return (
    <div className="bites">
      <header className="bites-top">
        <button className="icon-btn" type="button" aria-label="Back" onClick={() => navigate(back)}>
          <Icon name="back" />
        </button>
        <h1>{title}</h1>
        <span className="balance" title="APCard balance">
          APCard <b>{student ? formatRM(student.apcardBalance) : '...'}</b>
        </span>
      </header>
      <main className="bites-main">{children}</main>
      {showCart && count > 0 && (
        <div className="cart-bar">
          <button className="btn" type="button" onClick={() => setOpen(true)}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="cart-count">{count}</span> View cart
            </span>
            <span>{formatRM(totalRM)}</span>
          </button>
        </div>
      )}
      {open && <CartSheet onClose={() => setOpen(false)} />}
    </div>
  );
}

export function CartSheet({ onClose }) {
  const navigate = useNavigate();
  const { menuByStall, stallById } = useAppData();
  const { cart, setQty, clear } = useCart();
  const { lines, totalRM, count } = cartLines(cart, menuByStall);
  const stall = stallById[cart.stallId];
  const blocked = lines.some((l) => !l.available);

  return (
    <div className="overlay" onClick={onClose}>
      <section className="sheet" role="dialog" aria-modal="true" aria-labelledby="cart-title" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2 id="cart-title">Your cart{stall ? ` · ${stall.name}` : ''}</h2>
          <button className="icon-btn" type="button" aria-label="Close cart" onClick={onClose}><Icon name="close" /></button>
        </div>
        {count === 0 ? (
          <p className="empty">Your cart is empty.</p>
        ) : (
          <>
            <ul className="line-list">
              {lines.map((l) => (
                <li className="line" key={l.itemId}>
                  <div className="line-body">
                    <p>{l.name}</p>
                    <p className={l.available ? 'muted small' : 'small'} style={l.available ? undefined : { color: 'var(--danger)' }}>
                      {l.available ? `${formatRM(l.priceRM)} each` : 'Sold out, remove to continue'}
                    </p>
                  </div>
                  <Stepper value={l.qty} name={l.name} onChange={(n) => setQty(l.itemId, n)} />
                </li>
              ))}
            </ul>
            <div className="total-row"><span>Total</span><b>{formatRM(totalRM)}</b></div>
            <div className="dialog-actions">
              <button className="btn block" type="button" disabled={blocked} onClick={() => navigate('/student/bites/checkout')}>
                Checkout
              </button>
              <button className="btn ghost block" type="button" onClick={() => { clear(); onClose(); }}>Clear cart</button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export function Stepper({ value, name, onChange }) {
  return (
    <div className="stepper">
      <button type="button" aria-label={`Remove one ${name}`} onClick={() => onChange(value - 1)}><Icon name="minus" size={18} /></button>
      <output aria-live="polite" aria-label={`${name} quantity`}>{value}</output>
      <button type="button" aria-label={`Add one ${name}`} onClick={() => onChange(value + 1)}><Icon name="plus" size={18} /></button>
    </div>
  );
}

// Asked when adding from a different stall (one stall per cart).
export function SwitchStallDialog({ fromName, toName, onConfirm, onCancel }) {
  return (
    <div className="overlay dialog-wrap" onClick={onCancel}>
      <section className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="sw-title" aria-describedby="sw-desc" onClick={(e) => e.stopPropagation()}>
        <h2 id="sw-title">Start a new cart?</h2>
        <p id="sw-desc">Your cart has items from {fromName}. One order is from one stall, so adding this clears your cart and starts one at {toName}.</p>
        <div className="dialog-actions">
          <button className="btn block" type="button" onClick={onConfirm} autoFocus>Start new cart</button>
          <button className="btn ghost block" type="button" onClick={onCancel}>Keep my cart</button>
        </div>
      </section>
    </div>
  );
}
