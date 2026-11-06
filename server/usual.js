// "Order my usual": a plain rule, not AI.
// The student's most-ordered item across collected orders. Ties go to the
// item ordered most recently. Returns { stallId, itemId, name, count } or null.

export function findUsual(orders) {
  const stats = new Map();
  for (const o of orders) {
    if (o.status !== 'collected') continue;
    const when = o.date || '';
    for (const line of o.items || []) {
      const key = `${o.stallId}/${line.itemId}`;
      const s = stats.get(key) || { stallId: o.stallId, itemId: line.itemId, name: line.name, count: 0, last: '' };
      s.count += line.qty || 1;
      if (when > s.last) s.last = when;
      stats.set(key, s);
    }
  }
  let best = null;
  for (const s of stats.values()) {
    if (!best || s.count > best.count || (s.count === best.count && s.last > best.last)) best = s;
  }
  if (!best) return null;
  const { last, ...rest } = best;
  return rest;
}
