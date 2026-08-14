const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'supernova.db');
const db = new Database(dbPath);

const CJ_CID = '7999396'; // Official CJ Publisher Company ID

console.log('=============================================================');
console.log('  SUPERNOVA STORE — CJ TRACKING LINK CONVERTER');
console.log('=============================================================');

// 1. Find all products that do not yet have CJ tracking domain
const directProducts = db.prepare(`
  SELECT id, affiliate_url 
  FROM products 
  WHERE affiliate_url NOT LIKE '%anrdoezrs.net%' 
    AND affiliate_url NOT LIKE '%tkqlhce.com%' 
    AND affiliate_url NOT LIKE '%dpbolvw.net%' 
    AND affiliate_url NOT LIKE '%jdoqocy.com%'
`).all();

console.log(`[CJ_TRACKING] Found ${directProducts.length.toLocaleString()} products with direct non-tracking URLs.`);

// 2. Wrap them into official CJ Deep Link Tracking Links
const updateStmt = db.prepare(`
  UPDATE products 
  SET affiliate_url = @newUrl 
  WHERE id = @id
`);

const updateBatch = db.transaction((items) => {
  for (const item of items) {
    const rawUrl = item.affiliate_url;
    // Format: https://www.anrdoezrs.net/links/{CID}/type/dlg/sid/supernova/{TARGET_URL}
    const trackingLink = `https://www.anrdoezrs.net/links/${CJ_CID}/type/dlg/sid/supernova/${rawUrl}`;
    updateStmt.run({ id: item.id, newUrl: trackingLink });
  }
});

updateBatch(directProducts);
console.log(`[CJ_TRACKING] Successfully updated ${directProducts.length.toLocaleString()} products to official CJ Tracking Links!`);

// 3. Verify total tracking links in DB
const totalTracking = db.prepare(`
  SELECT COUNT(id) as c 
  FROM products 
  WHERE affiliate_url LIKE '%anrdoezrs.net%' 
     OR affiliate_url LIKE '%tkqlhce.com%' 
     OR affiliate_url LIKE '%dpbolvw.net%' 
     OR affiliate_url LIKE '%jdoqocy.com%'
`).get().c;

const totalDirect = db.prepare(`
  SELECT COUNT(id) as c 
  FROM products 
  WHERE affiliate_url NOT LIKE '%anrdoezrs.net%' 
    AND affiliate_url NOT LIKE '%tkqlhce.com%' 
    AND affiliate_url NOT LIKE '%dpbolvw.net%' 
    AND affiliate_url NOT LIKE '%jdoqocy.com%'
`).get().c;

console.log(`[CJ_TRACKING] Verification:`);
console.log(`  - Total products with valid CJ Tracking Links: ${totalTracking.toLocaleString()} (100%)`);
console.log(`  - Direct URLs remaining:                       ${totalDirect}`);

// 4. Sample 5 products
const sample = db.prepare('SELECT id, title, merchant, affiliate_url FROM products LIMIT 5').all();
console.log('\n[CJ_TRACKING] Sample CJ Tracking Links:');
console.log(JSON.stringify(sample, null, 2));

// 5. Rebuild FTS5 and VACUUM
console.log('\n[CJ_TRACKING] Rebuilding FTS5 and vacuuming database...');
db.exec("INSERT INTO products_fts(products_fts) VALUES('rebuild');");
db.pragma('wal_checkpoint(TRUNCATE)');
db.exec('VACUUM;');
db.pragma('wal_checkpoint(TRUNCATE)');
db.close();

console.log('[CJ_TRACKING] Migration complete!');
