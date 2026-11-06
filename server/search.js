// Keyword search across all menus. This is the non-AI fallback for
// "order in plain words" and runs in both the browser and Cloud Functions.
// Understands a few English, Malay and Chinese words for price, spiciness,
// vegetarian and halal. Dietary words are preferences, never guarantees.
//
// items: [{ stallId, stallName, cuisine, id, name, description, priceRM, tags[], available }]
// returns { results: [...items with score], filters, keywords }

const STOPWORDS = new Set([
  'i', 'want', 'something', 'some', 'a', 'an', 'the', 'and', 'or', 'with', 'for', 'me', 'please',
  'food', 'anything', 'any', 'get', 'give', 'like', 'would', 'to', 'eat', 'have', 'can', 'is', 'that',
  'nak', 'saya', 'aku', 'yang', 'dan', 'atau', 'makan', 'mahu', 'sesuatu', 'apa', 'boleh', 'tolong', 'dengan',
  'rm', 'under', 'below', 'less', 'than', 'cheap', 'bawah', 'kurang', 'dari', 'max', 'budget', 'within',
  'not', 'no', 'non', 'tak', 'tidak', 'bukan', 'without', 'spicy', 'pedas', 'halal', 'vegetarian', 'veggie',
  'vegan', 'mild', 'sayur', 'sayuran',
]);

// Malay and Chinese words mapped to English words that appear in menu text.
const SYNONYMS = {
  ayam: 'chicken', ikan: 'fish', daging: 'beef', lembu: 'beef', nasi: 'rice', mee: 'noodle', mi: 'noodle',
  air: 'drink', minuman: 'drink', teh: 'tea', telur: 'egg', goreng: 'fried', sup: 'soup',
  鸡: 'chicken', 鱼: 'fish', 牛: 'beef', 饭: 'rice', 面: 'noodle', 茶: 'tea', 蛋: 'egg', 汤: 'soup',
  noodles: 'noodle', drinks: 'drink', beverage: 'drink',
};

// Extra words per item so category searches work ("noodle", "rice", "drink").
function categoryWords(item) {
  const n = `${item.name} ${item.description}`.toLowerCase();
  const out = [];
  if (/ramen|mee|noodle|spaghetti|wantan/.test(n)) out.push('noodle');
  if (/rice|don\b|bento|nasi|gyudon/.test(n)) out.push('rice');
  if (/tea|teh|tarik|drink/.test(n)) out.push('drink');
  return out.join(' ');
}

export function parseQuery(text) {
  const q = ` ${String(text || '').toLowerCase()} `;
  const filters = {};

  const price =
    /(?:under|below|less than|bawah|kurang dari|max|budget|within|<)\s*(?:rm)?\s*(\d+(?:\.\d+)?)/.exec(q) ||
    /(?:rm)?\s*(\d+(?:\.\d+)?)\s*(?:块|元|令吉)?\s*(?:以下|以内)/.exec(q) ||
    /\brm\s*(\d+(?:\.\d+)?)/.exec(q);
  if (price) filters.maxPrice = Number(price[1]);

  if (/(?:\bnot|\bno|\bnon|\btak|\btidak|\bbukan|\bwithout|\bless)[\s-]*(?:too\s+)?(?:spicy|pedas)|不辣|不要辣|\bmild\b/.test(q)) {
    filters.spicy = false;
  } else if (/spicy|pedas|辣/.test(q)) {
    filters.spicy = true;
  }
  if (/vegetarian|veggie|vegan|\bsayur|素/.test(q)) filters.vegetarian = true;
  if (/halal|清真/.test(q)) filters.halal = true;

  const keywords = [];
  const cjk = q.match(/[一-鿿]/g) || [];
  for (const ch of cjk) if (SYNONYMS[ch]) keywords.push(SYNONYMS[ch]);
  for (const raw of q.replace(/[^a-z\s]/g, ' ').split(/\s+/)) {
    if (raw.length < 2 || STOPWORDS.has(raw)) continue;
    keywords.push(SYNONYMS[raw] || raw);
  }
  return { filters, keywords: [...new Set(keywords)] };
}

export function keywordSearch(items, text) {
  const { filters, keywords } = parseQuery(text);

  const passes = (it) => {
    if (it.available === false) return false;
    const tags = it.tags || [];
    if (filters.maxPrice != null && it.priceRM > filters.maxPrice) return false;
    if (filters.spicy === false && tags.includes('spicy')) return false;
    if (filters.spicy === true && !tags.includes('spicy')) return false;
    if (filters.vegetarian && !tags.includes('vegetarian')) return false;
    if (filters.halal && !tags.includes('halal')) return false;
    return true;
  };

  const scored = items.filter(passes).map((it) => {
    const hay = `${it.name} ${it.description} ${it.cuisine} ${it.stallName} ${categoryWords(it)}`.toLowerCase();
    const score = keywords.filter((k) => hay.includes(k)).length;
    return { ...it, score };
  });

  let results = keywords.length ? scored.filter((it) => it.score > 0) : scored;
  // Nothing matched the words but the filters did: show the filtered items.
  const loose = keywords.length > 0 && results.length === 0;
  if (loose) results = scored;

  results.sort((a, b) =>
    b.score - a.score ||
    Number((b.tags || []).includes('bestseller')) - Number((a.tags || []).includes('bestseller')) ||
    a.priceRM - b.priceRM);

  return { results, filters, keywords, loose };
}
