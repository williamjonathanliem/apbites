import { useParams } from 'react-router-dom';
import { useAppData } from '../shared/appData.jsx';
import { waitLabel } from '../shared/format.js';
import { BitesShell } from './BitesShell.jsx';
import { MenuItemRow } from './MenuItemRow.jsx';
import { useAddToCart } from './useAddToCart.jsx';

// S3: a stall's menu. Cart is limited to one stall.

export default function StallMenu() {
  const { stallId } = useParams();
  const { stallById, menuByStall, waitByStall, loading } = useAppData();
  const [addItem, dialog] = useAddToCart();
  const stall = stallById[stallId];
  const items = menuByStall[stallId] || [];
  const wait = waitByStall[stallId] || { open: 0, minutes: 0 };

  if (!loading && !stall) {
    return (
      <BitesShell title="APBites" back="/student/bites">
        <p className="empty">This stall isn't on APBites.</p>
      </BitesShell>
    );
  }

  return (
    <BitesShell title="APBites" back="/student/bites">
      {stall && (
        <section className="stall-head">
          <h2>{stall.name}</h2>
          <p>
            {stall.cuisine} · {stall.location} ·{' '}
            {stall.isOpen === false ? 'Closed' : `${waitLabel(wait.minutes)} pre-order wait`}
          </p>
        </section>
      )}
      {loading ? (
        <div className="skeleton" style={{ height: 360 }} />
      ) : (
        <ul className="menu-list">
          {items.map((it) => (
            <MenuItemRow key={it.id} item={it} onAdd={() => addItem(stallId, it.id)} />
          ))}
        </ul>
      )}
      <p className="muted small">Dietary tags are a guide from the stall, not a guarantee. Ask at the counter about allergies.</p>
      {dialog}
    </BitesShell>
  );
}
