const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'supernova.db');
const db = new Database(dbPath);

console.log('=============================================================');
console.log('  SUPERNOVA STORE — DEAD MERCHANTS CLEANUP SCRIPT');
console.log('=============================================================');
console.log(`[CLEANUP] Target Database: ${dbPath}`);

// 1. Inspect dead merchant products
const countStmt = db.prepare(`
  SELECT COUNT(id) as count 
  FROM products 
  WHERE LOWER(merchant) LIKE '%atelier%zero%' 
     OR LOWER(affiliate_url) LIKE '%atelierzero%'
     OR LOWER(title) LIKE '%atelier%zero%'
`);
const initialDead = countStmt.get().count;
console.log(`[CLEANUP] Found ${initialDead.toLocaleString()} products associated with dead merchant 'AtelierZero'.`);

if (initialDead > 0) {
  // 2. Delete the dead merchant products
  console.log(`[CLEANUP] Deleting ${initialDead.toLocaleString()} products from database...`);
  const deleteStmt = db.prepare(`
    DELETE FROM products 
    WHERE LOWER(merchant) LIKE '%atelier%zero%' 
       OR LOWER(affiliate_url) LIKE '%atelierzero%'
       OR LOWER(title) LIKE '%atelier%zero%'
  `);
  const deleteResult = deleteStmt.run();
  console.log(`[CLEANUP] Successfully removed ${deleteResult.changes.toLocaleString()} dead products.`);
} else {
  console.log('[CLEANUP] No AtelierZero products found to delete.');
}

// 3. Rebuild FTS5 search index
console.log('[CLEANUP] Rebuilding Full-Text Search (FTS5) index...');
db.exec("INSERT INTO products_fts(products_fts) VALUES('rebuild');");
console.log('[CLEANUP] FTS5 index rebuilt successfully.');

// 4. Consolidate and VACUUM SQLite database
console.log('[CLEANUP] Running WAL checkpoint and VACUUM...');
db.pragma('wal_checkpoint(TRUNCATE)');
db.exec('VACUUM;');
db.pragma('wal_checkpoint(TRUNCATE)');

const finalTotal = db.prepare('SELECT COUNT(id) as count FROM products WHERE is_active = 1').get().count;
console.log(`[CLEANUP] Total active products remaining in DB: ${finalTotal.toLocaleString()}`);

db.close();
console.log('=============================================================');
console.log('  CLEANUP COMPLETE!');
console.log('=============================================================\n');
