export const formatRM = (n) => `RM${Number(n || 0).toFixed(2)}`;

export const round2 = (n) => Math.round(n * 100) / 100;

export const TAG_LABELS = {
  halal: 'Halal',
  spicy: 'Spicy',
  vegetarian: 'Vegetarian',
  bestseller: 'Bestseller',
};

export function waitLabel(minutes) {
  if (!minutes) return 'No wait';
  return `~${minutes} min`;
}
