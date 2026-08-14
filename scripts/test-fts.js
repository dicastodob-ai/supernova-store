const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'supernova.db');
const db = new Database(dbPath);

console.log('Testing FTS5 query with rowid...');
try {
  const q1 = db.prepare("SELECT rowid FROM products_fts WHERE products_fts MATCH 'Denim' LIMIT 5").all();
  console.log('Denim matches:', q1);

  const q2 = db.prepare("SELECT rowid, title FROM products WHERE rowid IN (SELECT rowid FROM products_fts WHERE products_fts MATCH '\"Denim\"*') LIMIT 5").all();
  console.log('Products matching Denim:', q2);

  // Test multi-word with hyphens like "Raw Denim Scarf B-101"
  const rawInput = "Raw Denim Scarf B-101";
  // Tokenize words, strip non-alphanumeric, and join with AND or prefix matching
  const tokens = rawInput
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 0)
    .map(t => `"${t}"*`)
    .join(' ');
  console.log('Formatted FTS5 tokens for "' + rawInput + '":', tokens);

  const q3 = db.prepare("SELECT rowid, title FROM products WHERE rowid IN (SELECT rowid FROM products_fts WHERE products_fts MATCH ?) LIMIT 5").all(tokens);
  console.log('Products matching query:', q3);
} catch (e) {
  console.error('FTS5 test error:', e.message);
}

db.close();
