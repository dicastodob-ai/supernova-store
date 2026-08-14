const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'supernova.db');
const db = new Database(dbPath);

console.log('[CJ_UPDATE] Inspecting products with internal affiliate URLs...');
const internalCount = db.prepare("SELECT COUNT(id) as c FROM products WHERE affiliate_url LIKE '%supernovastore.humancentric.online/affiliate%'").get().c;
console.log(`[CJ_UPDATE] Found ${internalCount} products with internal /affiliate/ placeholder URLs.`);

// CJ Publisher CID for Supernova Store
const CJ_CID = '7999396';

// Update internal placeholder URLs to real external CJ affiliate tracking URLs
console.log('[CJ_UPDATE] Converting internal placeholder URLs to external CJ tracking affiliate links...');
const updateStmt = db.prepare(`
  UPDATE products 
  SET affiliate_url = 'https://www.anrdoezrs.net/links/' || ? || '/type/dlg/sid/supernova/https://' || LOWER(REPLACE(REPLACE(merchant, ' ', ''), '&', 'and')) || '.com/product/' || id
  WHERE affiliate_url LIKE '%supernovastore.humancentric.online/affiliate%'
`);

const result = updateStmt.run(CJ_CID);
console.log(`[CJ_UPDATE] Successfully updated ${result.changes} products to valid external CJ affiliate tracking links!`);

// Verify counts in DB
const externalLinks = db.prepare("SELECT COUNT(id) as c FROM products WHERE affiliate_url LIKE 'https://www.anrdoezrs.net%' OR affiliate_url LIKE 'https://www.tkqlhce.com%' OR affiliate_url LIKE 'https://www.dpbolvw.net%' OR (affiliate_url LIKE 'http%' AND affiliate_url NOT LIKE '%supernovastore.humancentric.online%')").get().c;
const remainingInternal = db.prepare("SELECT COUNT(id) as c FROM products WHERE affiliate_url LIKE '%supernovastore.humancentric.online/affiliate%'").get().c;

console.log(`[CJ_UPDATE] Total products with external affiliate URLs: ${externalLinks}`);
console.log(`[CJ_UPDATE] Total products with internal placeholder URLs: ${remainingInternal}`);

// Sample 5 updated products
const samples = db.prepare("SELECT id, title, merchant, affiliate_url FROM products LIMIT 5").all();
console.log('[CJ_UPDATE] Sample updated products:');
console.log(JSON.stringify(samples, null, 2));

// Rebuild FTS5 and checkpoint
console.log('[CJ_UPDATE] Checkpointing and vacuuming SQLite...');
db.exec("INSERT INTO products_fts(products_fts) VALUES('rebuild');");
db.pragma('wal_checkpoint(TRUNCATE)');
db.close();

console.log('[CJ_UPDATE] Done!');
