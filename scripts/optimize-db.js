const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'supernova.db');
const db = new Database(dbPath);

console.log('[OPTIMIZE] Dropping old FTS tables...');
db.exec('DROP TABLE IF EXISTS products_fts;');

console.log('[OPTIMIZE] Creating lightweight FTS5 external content table...');
db.exec(`
  CREATE VIRTUAL TABLE products_fts USING fts5(
    title,
    merchant,
    category,
    tags,
    content='products',
    content_rowid='rowid'
  );
  INSERT INTO products_fts(products_fts) VALUES('rebuild');
`);

console.log('[OPTIMIZE] Running VACUUM...');
db.exec('VACUUM;');
db.pragma('wal_checkpoint(TRUNCATE)');
db.close();

console.log('[OPTIMIZE] Database optimized successfully!');
