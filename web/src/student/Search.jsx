import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAppData } from '../shared/appData.jsx';
import { formatRM, TAG_LABELS } from '../shared/format.js';
import { keywordSearch } from '../../../server/search.js';
import { BitesShell } from './BitesShell.jsx';
import { MenuItemRow } from './MenuItemRow.jsx';
import { SearchBox } from './Stalls.jsx';
import { useAddToCart } from './useAddToCart.jsx';

// S4: plain-words results across all stalls.
// Today: keyword search (the fallback). Gemini (parseOrderText) plugs in here later.

function FilterSummary({ filters }) {
  const parts = [];
  if (filters.halal) parts.push(TAG_LABELS.halal);
  if (filters.vegetarian) parts.push(TAG_LABELS.vegetarian);
  if (filters.spicy === false) parts.push('Not spicy');
  if (filters.spicy === true) parts.push('Spicy');
  if (filters.maxPrice != null) parts.push(`Up to ${formatRM(filters.maxPrice)}`);
  if (!parts.length) return null;
  return (
    <div className="menu-tags" aria-label="Understood as">
      {parts.map((p) => <span key={p} className="chip">{p}</span>)}
    </div>
  );
}

export default function Search() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const { allItems, stallById, loading } = useAppData();
  const [addItem, dialog] = useAddToCart();

  const res = useMemo(
    () => keywordSearch(allItems.filter((it) => stallById[it.stallId]?.isOpen !== false), q),
    [allItems, stallById, q],
  );

  return (
    <BitesShell title="APBites" back="/student/bites">
      <SearchBox key={q} initial={q} />
      <FilterSummary filters={res.filters} />
      {loading ? (
        <div className="skeleton" style={{ height: 300 }} />
      ) : res.results.length === 0 ? (
        <div className="card empty">
          <p>Nothing matches “{q}”.</p>
          <Link className="btn ghost" to="/student/bites">Browse all stalls</Link>
        </div>
      ) : (
        <>
          <p className="muted small" style={{ margin: '0 4px' }}>
            {res.loose
              ? `No exact match for “${q}”. Closest items:`
              : `${res.results.length} item${res.results.length === 1 ? '' : 's'} for “${q}”. Tap Add to put one in your cart.`}
          </p>
          <ul className="menu-list">
            {res.results.map((it) => (
              <MenuItemRow key={it.path} item={it} showStall onAdd={() => addItem(it.stallId, it.id)} />
            ))}
          </ul>
        </>
      )}
      <p className="muted small">Suggestions only. Dietary tags are a guide, not a guarantee.</p>
      {dialog}
    </BitesShell>
  );
}
