const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'supernova.db');
const db = new Database(dbPath);

console.log('Inspecting affiliate_url patterns in products...');
const rows = db.prepare(`
  SELECT 
    CASE 
      WHEN affiliate_url LIKE '%tkqlhce%' THEN 'CJ tkqlhce'
      WHEN affiliate_url LIKE '%anrdoezrs%' THEN 'CJ anrdoezrs'
      WHEN affiliate_url LIKE '%dpbolvw%' THEN 'CJ dpbolvw'
      WHEN affiliate_url LIKE '%jdoqocy%' THEN 'CJ jdoqocy'
      WHEN affiliate_url LIKE '%cj.com%' THEN 'CJ direct'
      WHEN affiliate_url LIKE '%supernovastore.humancentric.online/affiliate%' THEN 'Internal /affiliate/'
      WHEN affiliate_url LIKE '%supernovastore.humancentric.online/cj%' THEN 'Internal /cj/'
      ELSE 'Other: ' || substr(affiliate_url, 1, 30)
    END as pattern,
    COUNT(id) as count
  FROM products
  GROUP BY pattern
`).all();

console.log('PATTERNS IN DB:', rows);

// Check sample of each pattern
const samplePatterns = db.prepare(`
  SELECT id, title, merchant, affiliate_url FROM products WHERE affiliate_url LIKE '%supernovastore.humancentric.online/affiliate%' LIMIT 3
`).all();
console.log('SAMPLE INTERNAL AFFILIATE URLS:', samplePatterns);

db.close();
