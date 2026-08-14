const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'supernova.db');
const db = new Database(dbPath);

const directUrls = db.prepare(`
  SELECT COUNT(id) as c 
  FROM products 
  WHERE affiliate_url NOT LIKE '%anrdoezrs.net%' 
    AND affiliate_url NOT LIKE '%tkqlhce.com%' 
    AND affiliate_url NOT LIKE '%dpbolvw.net%' 
    AND affiliate_url NOT LIKE '%jdoqocy.com%'
`).get().c;
console.log('PRODUCTS WITH DIRECT NON-TRACKING URLS:', directUrls);

const trackingUrls = db.prepare(`
  SELECT COUNT(id) as c 
  FROM products 
  WHERE affiliate_url LIKE '%anrdoezrs.net%' 
     OR affiliate_url LIKE '%tkqlhce.com%' 
     OR affiliate_url LIKE '%dpbolvw.net%' 
     OR affiliate_url LIKE '%jdoqocy.com%'
`).get().c;
console.log('PRODUCTS WITH CJ TRACKING URLS:', trackingUrls);

const sampleDirect = db.prepare(`
  SELECT id, title, merchant, affiliate_url 
  FROM products 
  WHERE affiliate_url NOT LIKE '%anrdoezrs.net%' 
    AND affiliate_url NOT LIKE '%tkqlhce.com%' 
    AND affiliate_url NOT LIKE '%dpbolvw.net%' 
    AND affiliate_url NOT LIKE '%jdoqocy.com%' 
  LIMIT 5
`).all();
console.log('SAMPLE DIRECT URLS:', sampleDirect);

db.close();
