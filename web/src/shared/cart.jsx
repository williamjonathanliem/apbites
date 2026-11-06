import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { round2 } from './format.js';

// One stall per cart. Kept in localStorage so a reload doesn't lose it.
// Shape: { stallId: string | null, qty: { [itemId]: number } }

const KEY = 'apbites.cart.v1';
const EMPTY = { stallId: null, qty: {} };

function load() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    return v && typeof v === 'object' && v.qty ? v : EMPTY;
  } catch {
    return EMPTY;
  }
}

const Cart = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(load);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch { /* storage blocked */ }
  }, [cart]);

  // Returns false if the item is from another stall (caller asks to replace).
  const add = useCallback((stallId, itemId, n = 1) => {
    const count = Object.values(cart.qty).reduce((a, b) => a + b, 0);
    if (count > 0 && cart.stallId !== stallId) return false;
    setCart((c) => ({ stallId, qty: { ...c.qty, [itemId]: (c.qty[itemId] || 0) + n } }));
    return true;
  }, [cart]);

  const replaceWith = useCallback((stallId, itemId, n = 1) => {
    setCart({ stallId, qty: { [itemId]: n } });
  }, []);

  const setQty = useCallback((itemId, n) => {
    setCart((c) => {
      const qty = { ...c.qty };
      if (n <= 0) delete qty[itemId];
      else qty[itemId] = n;
      return Object.keys(qty).length ? { ...c, qty } : EMPTY;
    });
  }, []);

  const clear = useCallback(() => setCart(EMPTY), []);

  const value = useMemo(() => ({ cart, add, replaceWith, setQty, clear }), [cart, add, replaceWith, setQty, clear]);
  return <Cart.Provider value={value}>{children}</Cart.Provider>;
}

export function useCart() {
  const v = useContext(Cart);
  if (!v) throw new Error('useCart outside CartProvider');
  return v;
}

// Cart lines joined with the live menu. Unavailable or missing items are flagged.
export function cartLines(cart, menuByStall) {
  const menu = menuByStall[cart.stallId] || [];
  const lines = Object.entries(cart.qty).map(([itemId, qty]) => {
    const item = menu.find((m) => m.id === itemId);
    return {
      itemId,
      qty,
      name: item?.name || 'Item no longer on the menu',
      priceRM: item?.priceRM || 0,
      available: Boolean(item && item.available !== false),
    };
  });
  const totalRM = round2(lines.reduce((s, l) => s + l.priceRM * l.qty, 0));
  const count = lines.reduce((s, l) => s + l.qty, 0);
  return { lines, totalRM, count };
}
