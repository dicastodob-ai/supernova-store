const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'supernova.db');
const db = new Database(dbPath);

console.log('[DOMAINS] Cleaning old triggers...');
db.exec(`
  DROP TRIGGER IF EXISTS products_ai;
  DROP TRIGGER IF EXISTS products_ad;
  DROP TRIGGER IF EXISTS products_au;
`);

console.log('[DOMAINS] Checking existing products with example.com...');
const beforeCount = db.prepare("SELECT COUNT(*) as count FROM products WHERE affiliate_url LIKE '%example.com%'").get().count;
console.log(`[DOMAINS] Found ${beforeCount} products with example.com in affiliate_url.`);

if (beforeCount > 0) {
  console.log('[DOMAINS] Replacing example.com with https://supernovastore.humancentric.online in database...');
  const result = db.prepare(`
    UPDATE products 
    SET affiliate_url = REPLACE(affiliate_url, 'https://example.com', 'https://supernovastore.humancentric.online')
    WHERE affiliate_url LIKE '%example.com%'
  `).run();
  console.log(`[DOMAINS] Updated ${result.changes} product records.`);
}

const afterCount = db.prepare("SELECT COUNT(*) as count FROM products WHERE affiliate_url LIKE '%example.com%'").get().count;
console.log(`[DOMAINS] Verification: ${afterCount} products remaining with example.com.`);

console.log('[DOMAINS] Rebuilding FTS5 external content index and setting up clean sync triggers...');
db.exec(`
  DROP TABLE IF EXISTS products_fts;
  CREATE VIRTUAL TABLE products_fts USING fts5(
    title,
    merchant,
    category,
    tags,
    content='products',
    content_rowid='rowid'
  );
  INSERT INTO products_fts(products_fts) VALUES('rebuild');

  CREATE TRIGGER products_ai AFTER INSERT ON products BEGIN
    INSERT INTO products_fts(rowid, title, merchant, category, tags) 
    VALUES (new.rowid, new.title, new.merchant, new.category, new.tags);
  END;

  CREATE TRIGGER products_ad AFTER DELETE ON products BEGIN
    INSERT INTO products_fts(products_fts, rowid, title, merchant, category, tags) 
    VALUES('delete', old.rowid, old.title, old.merchant, old.category, old.tags);
  END;

  CREATE TRIGGER products_au AFTER UPDATE ON products BEGIN
    INSERT INTO products_fts(products_fts, rowid, title, merchant, category, tags) 
    VALUES('delete', old.rowid, old.title, old.merchant, old.category, old.tags);
    INSERT INTO products_fts(rowid, title, merchant, category, tags) 
    VALUES (new.rowid, new.title, new.merchant, new.category, new.tags);
  END;
`);

console.log('[DOMAINS] Consolidating SQLite database...');
db.pragma('wal_checkpoint(TRUNCATE)');
db.exec('VACUUM;');
db.pragma('wal_checkpoint(TRUNCATE)');
db.close();

console.log('[DOMAINS] Database update completed and verified successfully!');
