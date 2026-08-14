const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'supernova.db');
const db = new Database(dbPath);

const total = db.prepare('SELECT COUNT(id) as c FROM products').get().c;
console.log('TOTAL PRODUCTS:', total);

const sample = db.prepare('SELECT id, title, merchant, network, affiliate_url FROM products LIMIT 10').all();
console.log('SAMPLE FIRST 10 PRODUCTS:', sample);

const cjProducts = db.prepare("SELECT id, title, merchant, network, affiliate_url FROM products WHERE id LIKE 'cj-%' LIMIT 5").all();
console.log('SAMPLE CJ PRODUCTS (id LIKE cj-%):', cjProducts);

const externalLinks = db.prepare("SELECT COUNT(id) as c FROM products WHERE affiliate_url LIKE 'http%' AND affiliate_url NOT LIKE '%supernovastore.humancentric.online%'").get().c;
console.log('PRODUCTS WITH REAL EXTERNAL AFFILIATE URLS:', externalLinks);

const internalLinks = db.prepare("SELECT COUNT(id) as c FROM products WHERE affiliate_url LIKE '%supernovastore.humancentric.online/affiliate%'").get().c;
console.log('PRODUCTS WITH INTERNAL /affiliate/ URLS:', internalLinks);

const sampleExternal = db.prepare("SELECT id, title, merchant, affiliate_url FROM products WHERE affiliate_url LIKE 'http%' AND affiliate_url NOT LIKE '%supernovastore.humancentric.online%' LIMIT 5").all();
console.log('SAMPLE EXTERNAL LINKS:', sampleExternal);

db.close();
