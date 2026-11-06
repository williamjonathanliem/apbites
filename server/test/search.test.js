import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keywordSearch, parseQuery } from '../search.js';
import { findUsual } from '../usual.js';
import { MENU, STALLS } from '../../seed/data.js';

const ITEMS = STALLS.flatMap((s) =>
  MENU[s.id].map((m) => ({ ...m, stallId: s.id, stallName: s.name, cuisine: s.cuisine, available: true })));
const names = (r) => r.results.map((x) => x.name);

test('English: halal, not spicy, under RM8', () => {
  const r = keywordSearch(ITEMS, 'something halal, not spicy, under RM8');
  assert.deepEqual(r.filters, { maxPrice: 8, spicy: false, halal: true });
  assert.ok(names(r).includes('Gyoza (6 pcs)'));
  assert.ok(!names(r).includes('Mee Goreng Mamak'), 'spicy item excluded');
  assert.ok(r.results.every((x) => x.priceRM <= 8));
});

test('Malay: nak ayam tak pedas bawah RM10', () => {
  const r = keywordSearch(ITEMS, 'nak ayam tak pedas bawah RM10');
  assert.equal(r.filters.spicy, false);
  assert.equal(r.filters.maxPrice, 10);
  assert.ok(names(r).includes('Roasted Chicken Rice'));
  assert.ok(!names(r).includes('Nasi Lemak Ayam'), 'sambal is spicy');
});

test('Chinese: 不辣 鸡 10以下', () => {
  const r = keywordSearch(ITEMS, '不辣的鸡 10以下');
  assert.equal(r.filters.spicy, false);
  assert.equal(r.filters.maxPrice, 10);
  assert.ok(names(r).includes('Roasted Chicken Rice'));
});

test('category word: noodles', () => {
  const r = keywordSearch(ITEMS, 'noodles');
  assert.ok(names(r).includes('Chicken Shoyu Ramen'));
  assert.ok(names(r).includes('Wantan Mee'));
});

test('words match nothing: falls back to filtered list', () => {
  const r = keywordSearch(ITEMS, 'pizza under rm5');
  assert.equal(r.loose, true);
  assert.ok(r.results.every((x) => x.priceRM <= 5));
});

test('parseQuery: spicy positive', () => {
  assert.equal(parseQuery('something spicy').filters.spicy, true);
});

test('findUsual picks most-ordered, ties to most recent', () => {
  const orders = [
    { status: 'collected', stallId: 'hana', date: '2026-11-01', items: [{ itemId: 'katsu', name: 'Chicken Katsu Don', qty: 1 }] },
    { status: 'collected', stallId: 'hana', date: '2026-11-03', items: [{ itemId: 'katsu', name: 'Chicken Katsu Don', qty: 1 }] },
    { status: 'collected', stallId: 'dapur', date: '2026-11-05', items: [{ itemId: 'lemak', name: 'Nasi Lemak Ayam', qty: 1 }] },
    { status: 'new', stallId: 'dapur', date: '2026-11-06', items: [{ itemId: 'lemak', name: 'Nasi Lemak Ayam', qty: 5 }] },
  ];
  assert.deepEqual(findUsual(orders), { stallId: 'hana', itemId: 'katsu', name: 'Chicken Katsu Don', count: 2 });
  assert.equal(findUsual([]), null);
});
