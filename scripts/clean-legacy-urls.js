const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'supernova.db');
const db = new Database(dbPath);

console.log('[CLEANUP] Inspecting database networks and URLs...');
const netCounts = db.prepare('SELECT network, COUNT(id) as c FROM products GROUP BY network').all();
console.log('[CLEANUP] Current networks in DB:', netCounts);

// 1. Update all products with network = 'impact' to 'cj'
console.log('[CLEANUP] Converting all network = impact records to cj...');
const netUpdate = db.prepare("UPDATE products SET network = 'cj' WHERE network = 'impact' OR network = 'Impact'").run();
console.log(`[CLEANUP] Converted ${netUpdate.changes} products to network = cj.`);

// 2. Remove any google search URLs if present
const googleUpdate = db.prepare("UPDATE products SET affiliate_url = REPLACE(affiliate_url, 'https://www.google.com', 'https://supernovastore.humancentric.online') WHERE affiliate_url LIKE '%google.com%'").run();
console.log(`[CLEANUP] Fixed ${googleUpdate.changes} google.com URLs.`);

// 3. For any simulated products in feed, update their internal placeholder to clean CJ network pattern
const affUpdate = db.prepare("UPDATE products SET affiliate_url = REPLACE(affiliate_url, '/affiliate/impact/', '/affiliate/cj/') WHERE affiliate_url LIKE '%/affiliate/impact/%'").run();
console.log(`[CLEANUP] Replaced ${affUpdate.changes} affiliate URLs from /affiliate/impact/ to /affiliate/cj/.`);

// 4. Verification
const finalNets = db.prepare('SELECT network, COUNT(id) as c FROM products GROUP BY network').all();
console.log('[CLEANUP] Final networks in DB:', finalNets);

// Rebuild FTS5 and VACUUM
console.log('[CLEANUP] Rebuilding FTS5 and consolidating SQLite...');
db.exec("INSERT INTO products_fts(products_fts) VALUES('rebuild');");
db.pragma('wal_checkpoint(TRUNCATE)');
db.exec('VACUUM;');
db.pragma('wal_checkpoint(TRUNCATE)');
db.close();

console.log('[CLEANUP] Legacy URLs cleaned and database consolidated successfully!');
