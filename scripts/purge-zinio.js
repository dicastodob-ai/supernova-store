const fs = require('fs');
const Database = require('better-sqlite3');

try {
  const db = new Database('data/supernova.db');
  const res = db.prepare("DELETE FROM products WHERE lower(merchant) LIKE '%zinio%' OR lower(title) LIKE '%zinio%' OR lower(product_url) LIKE '%zinio%'").run();
  console.log(`[SQLITE] Purged Zinio: ${res.changes} records deleted.`);
  try { db.prepare("INSERT INTO products_fts(products_fts) VALUES('rebuild')").run(); } catch(e){}
  db.prepare('VACUUM').run();
  db.close();
} catch (e) {
  console.log('[SQLITE] Database update skipped or completed:', e.message);
}

if (fs.existsSync('data.json')) {
  const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
  const filtered = data.filter(p => {
    const text = `${p.merchant || ''} ${p.title || ''} ${p.affiliateUrl || ''}`.toLowerCase();
    return !text.includes('zinio') && !text.includes('booking') && !text.includes('aliexpress') && !text.includes('abracadabra');
  });
  fs.writeFileSync('data.json', JSON.stringify(filtered, null, 2));
  console.log(`[DATA.JSON] Cleaned: ${filtered.length} products remaining.`);
}
