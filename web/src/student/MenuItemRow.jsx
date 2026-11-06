import { useAppData } from '../shared/appData.jsx';
import { useCart } from '../shared/cart.jsx';
import { formatRM, TAG_LABELS } from '../shared/format.js';
import { Icon } from '../shared/icons.jsx';
import { Stepper } from './BitesShell.jsx';

const TAG_ORDER = ['bestseller', 'halal', 'vegetarian', 'spicy'];

export function MenuItemRow({ item, onAdd, showStall = false }) {
  const { stallById } = useAppData();
  const { cart, setQty } = useCart();
  const inCart = cart.stallId === item.stallId ? cart.qty[item.id] || 0 : 0;
  const soldOut = item.available === false;
  const stallClosed = stallById[item.stallId]?.isOpen === false;
  const tags = TAG_ORDER.filter((t) => (item.tags || []).includes(t));

  return (
    <li className="card menu-item">
      <div className="menu-body">
        {showStall && <p className="result-stall">{item.stallName}</p>}
        <p className="menu-name">{item.name}</p>
        <p className="menu-desc">{item.description}</p>
        {tags.length > 0 && (
          <div className="menu-tags">
            {tags.map((t) => <span key={t} className={`chip ${t}`}>{TAG_LABELS[t]}</span>)}
          </div>
        )}
      </div>
      <div className="menu-side">
        <span className="price">{formatRM(item.priceRM)}</span>
        {soldOut ? (
          <span className="muted small">Sold out</span>
        ) : stallClosed ? (
          <span className="muted small">Closed</span>
        ) : inCart > 0 ? (
          <Stepper value={inCart} name={item.name} onChange={(n) => setQty(item.id, n)} />
        ) : (
          <button className="btn add-btn" type="button" onClick={() => onAdd(item)} aria-label={`Add ${item.name}`}>
            <Icon name="plus" size={18} /> Add
          </button>
        )}
      </div>
    </li>
  );
}
