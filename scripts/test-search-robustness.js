const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'supernova.db');
const db = new Database(dbPath);

function sanitizeFtsQuery(raw) {
  if (!raw || !raw.trim()) return null;
  const tokens = raw
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 0);

  if (tokens.length === 0) return null;
  return tokens.map(t => `"${t}"*`).join(' ');
}

function searchProducts(search) {
  const ftsQuery = sanitizeFtsQuery(search);
  console.log(`\nSearch for: "${search}" -> FTS Query: [${ftsQuery}]`);
  
  if (!ftsQuery) {
    return { count: 0, sample: [] };
  }

  try {
    const countRow = db.prepare('SELECT COUNT(id) as count FROM products WHERE rowid IN (SELECT rowid FROM products_fts WHERE products_fts MATCH ?) AND is_active = 1').get(ftsQuery);
    const rows = db.prepare('SELECT id, title, merchant, price FROM products WHERE rowid IN (SELECT rowid FROM products_fts WHERE products_fts MATCH ?) AND is_active = 1 LIMIT 3').all(ftsQuery);
    return { count: countRow.count, sample: rows };
  } catch (err) {
    console.error('FTS ERROR:', err.message);
    return { error: err.message };
  }
}

const testCases = [
  "Raw Denim Scarf B-101",
  "Sony WH-1000XM5",
  "B-101",
  "Denim",
  "Ashampoo",
  "Booking.com",
  "142999",
  "Special & Chars / Quotes 'test' - 100",
  "Leather Wallet"
];

for (const q of testCases) {
  const res = searchProducts(q);
  console.log(`Results: ${res.count} items found.`);
  if (res.sample && res.sample.length > 0) {
    res.sample.forEach(s => console.log(`   • [${s.id}] ${s.title} ($${s.price})`));
  }
}

db.close();
