import { useState } from 'react';
import { useAppData } from '../shared/appData.jsx';
import { useCart } from '../shared/cart.jsx';
import { SwitchStallDialog } from './BitesShell.jsx';

// Adds an item, asking first if it comes from another stall.
// Returns [addItem, dialogElement]. addItem(stallId, itemId, onAdded?).
export function useAddToCart() {
  const { stallById } = useAppData();
  const { cart, add, replaceWith } = useCart();
  const [pending, setPending] = useState(null);

  const addItem = (stallId, itemId, onAdded) => {
    if (add(stallId, itemId)) onAdded?.();
    else setPending({ stallId, itemId, onAdded });
  };

  const dialog = pending && (
    <SwitchStallDialog
      fromName={stallById[cart.stallId]?.name || 'another stall'}
      toName={stallById[pending.stallId]?.name || 'this stall'}
      onCancel={() => setPending(null)}
      onConfirm={() => {
        replaceWith(pending.stallId, pending.itemId);
        pending.onAdded?.();
        setPending(null);
      }}
    />
  );

  return [addItem, dialog];
}
