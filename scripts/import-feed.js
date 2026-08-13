/**
 * Supernova Store — High-Performance Feed Importer (143k Catalog)
 *
 * Imports affiliate products from CSV (Impact / CJ Affiliate / Standard) into SQLite.
 * Uses streaming, chunked transactions (5,000 rows/batch) and FTS5 indexing.
 *
 * Usage:
 *   node scripts/import-feed.js [path/to/feed-143k.csv]
 *   node scripts/import-feed.js --generate [count] (generates synthetic feed for benchmarking)
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const Database = require('better-sqlite3');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const DB_PATH = path.join(DATA_DIR, 'supernova.db');
const DEFAULT_CSV_PATH = path.join(PROJECT_ROOT, 'feed-143k.csv');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// --------------------------------------------------------------------------
// SQLite Initialization & Schema
// --------------------------------------------------------------------------
function initDb() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = OFF'); // Maximum write speed during bulk import
  db.pragma('cache_size = -128000'); // 128MB cache

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      sale_price REAL,
      currency TEXT DEFAULT 'USD',
      merchant TEXT,
      category TEXT NOT NULL,
      affiliate_url TEXT NOT NULL,
      image_url TEXT NOT NULL,
      network TEXT NOT NULL,
      tags TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_network ON products(network);
    CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
    CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
    CREATE INDEX IF NOT EXISTS idx_products_merchant ON products(merchant);

    CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(
      id UNINDEXED,
      title,
      description,
      merchant,
      tags,
      content='products',
      content_rowid='rowid'
    );
  `);

  return db;
}

// --------------------------------------------------------------------------
// CSV Row Parser (Handles Quotes, Commas & Escapes cleanly)
// --------------------------------------------------------------------------
function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

// --------------------------------------------------------------------------
// Column Mapping Normalizer (CJ & Impact Feeds)
// --------------------------------------------------------------------------
function buildColumnIndexMap(headers) {
  const normalized = headers.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const find = (...patterns) => {
    for (const pat of patterns) {
      const idx = normalized.findIndex((h) => h.includes(pat));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  return {
    id: find('sku', 'productid', 'itemid', 'id', 'mpn'),
    title: find('title', 'productname', 'itemname', 'name'),
    description: find('description', 'desc', 'summary', 'details'),
    price: find('price', 'retailprice', 'currentprice', 'amount'),
    salePrice: find('saleprice', 'discountprice', 'salepriceusd'),
    category: find('category', 'productcategory', 'department', 'cat'),
    affiliateUrl: find('deeplink', 'buyurl', 'affiliateurl', 'clickurl', 'targeturl', 'link', 'url'),
    imageUrl: find('imageurl', 'imagelarge', 'image', 'photo', 'thumbnail'),
    network: find('network', 'affiliatenetwork', 'source'),
    merchant: find('merchant', 'advertisername', 'advertiser', 'brand', 'store', 'programname'),
    tags: find('tags', 'keywords'),
  };
}

// --------------------------------------------------------------------------
// Synthetic 143k Feed Generator (Benchmark & Testing)
// --------------------------------------------------------------------------
function generateSynthetic143kFeed(targetPath, count = 143000) {
  return new Promise((resolve, reject) => {
    console.log(`[GENERATOR] Creating synthetic catalog with ${count.toLocaleString()} products...`);
    const startTime = Date.now();

    const categories = ['electronics', 'fashion', 'home', 'beauty', 'sports', 'books', 'accessories'];
    const networks = ['impact', 'cj'];
    const merchants = [
      'TechHaven', 'Urban Minimalist', 'Nordic Home', 'Aether Audio', 'Lumina Beauty',
      'Apex Athletics', 'Monochrome Editions', 'Form & Function', 'Atelier Zero', 'Vanguard Goods'
    ];

    const productTemplates = [
      { cat: 'electronics', prefixes: ['Wireless', 'Noise-Canceling', 'Minimalist', 'Mechanical', 'Precision', 'Compact'], nouns: ['Headphones', 'Keyboard', 'Mouse', 'Monitor', 'Earbuds', 'Speaker', 'Dock', 'Webcam'] },
      { cat: 'fashion', prefixes: ['Cotton', 'Wool', 'Minimal', 'Raw Denim', 'Tailored', 'Oversized', 'Monochrome'], nouns: ['Tee', 'Sweater', 'Trousers', 'Jacket', 'Hoodie', 'Coat', 'Shirt', 'Scarf'] },
      { cat: 'home', prefixes: ['Ceramic', 'Matte Black', 'Oak', 'Brushed Steel', 'Minimal', 'Modular'], nouns: ['Vase', 'Desk Lamp', 'Pour-Over Stand', 'Clock', 'Tray', 'Planter', 'Chair', 'Diffuser'] },
      { cat: 'beauty', prefixes: ['Botanical', 'Hydrating', 'Restorative', 'Mineral', 'Organic', 'Active'], nouns: ['Cleanser', 'Serum', 'Balm', 'Toner', 'Exfoliant', 'Oil', 'Cream', 'Elixir'] },
      { cat: 'sports', prefixes: ['Ergonomic', 'Lightweight', 'Carbon', 'Matte', 'Endurance', 'Flex'], nouns: ['Yoga Mat', 'Water Bottle', 'Resistance Bands', 'Dumbbells', 'Running Belt', 'Grip Ring'] },
      { cat: 'books', prefixes: ['The Art of', 'Essays on', 'Principles of', 'Monochrome', 'Architecture of', 'Guide to'], nouns: ['Simplicity', 'Design Systems', 'Modern Living', 'Silence', 'Typography', 'Space'] },
      { cat: 'accessories', prefixes: ['Leather', 'Titanium', 'Matte', 'RFID', 'Slim', 'Solid'], nouns: ['Wallet', 'Watch', 'Cardholder', 'Keychain', 'Glasses', 'Pen', 'Sleeve'] },
    ];

    const writeStream = fs.createWriteStream(targetPath, { encoding: 'utf8' });
    writeStream.write('id,title,description,price,sale_price,category,affiliate_url,image_url,network,merchant,tags\n');

    for (let i = 1; i <= count; i++) {
      const template = productTemplates[i % productTemplates.length];
      const prefix = template.prefixes[(i * 3) % template.prefixes.length];
      const noun = template.nouns[(i * 7) % template.nouns.length];
      const title = `${prefix} ${noun} ${String.fromCharCode(65 + (i % 26))}-${(i % 900) + 100}`;
      const desc = `Engineered for pure minimalism. High-grade craftsmanship and functional simplicity. Series ${i}.`;
      const price = ((i % 450) + 15).toFixed(2);
      const hasSale = i % 3 === 0;
      const salePrice = hasSale ? (parseFloat(price) * 0.85).toFixed(2) : '';
      const category = template.cat;
      const network = networks[i % networks.length];
      const merchant = merchants[i % merchants.length];
      const affUrl = `https://example.com/affiliate/${network}/${merchant.toLowerCase().replace(/[^a-z0-9]/g, '')}/prod-${i}`;
      const imgUrl = `https://picsum.photos/seed/p${(i % 1000) + 1}/600/800`;
      const tags = `${category},${noun.toLowerCase()},monochrome,minimal`;

      writeStream.write(
        `"prod-${String(i).padStart(6, '0')}","${title}","${desc}",${price},${salePrice},"${category}","${affUrl}","${imgUrl}","${network}","${merchant}","${tags}"\n`
      );
    }

    writeStream.end();
    writeStream.on('finish', () => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`[GENERATOR] Wrote ${count.toLocaleString()} products to ${targetPath} in ${elapsed}s.`);
      resolve();
    });
    writeStream.on('error', reject);
  });
}

// --------------------------------------------------------------------------
// Main Import Logic
// --------------------------------------------------------------------------
async function importFeed(csvPath) {
  if (!fs.existsSync(csvPath)) {
    console.log(`[FEED_IMPORT] File "${csvPath}" not found.`);
    console.log(`[FEED_IMPORT] Generating synthetic 143k dataset at: ${csvPath}...`);
    await generateSynthetic143kFeed(csvPath, 143000);
  }

  console.log(`\n=============================================================`);
  console.log(`  SUPERNOVA STORE — BULK AFFILIATE IMPORT (143K CATALOG)`);
  console.log(`=============================================================`);
  console.log(`[FEED_IMPORT] Source: ${csvPath}`);
  console.log(`[FEED_IMPORT] Target DB: ${DB_PATH}`);

  const db = initDb();
  const startTime = Date.now();

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO products (
      id, title, description, price, sale_price, currency, merchant,
      category, affiliate_url, image_url, network, tags, is_active
    ) VALUES (
      @id, @title, @description, @price, @salePrice, 'USD', @merchant,
      @category, @affiliateUrl, @imageUrl, @network, @tags, 1
    )
  `);

  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      insertStmt.run(row);
    }
  });

  const fileStream = fs.createReadStream(csvPath, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let lineCount = 0;
  let importedCount = 0;
  let colMap = null;
  let batch = [];
  const BATCH_SIZE = 5000;

  for await (const line of rl) {
    if (!line.trim()) continue;

    lineCount++;
    if (lineCount === 1) {
      const headers = parseCsvLine(line);
      colMap = buildColumnIndexMap(headers);
      console.log(`[FEED_IMPORT] Detected columns:`, headers.join(', '));
      continue;
    }

    const cols = parseCsvLine(line);
    if (cols.length < 3) continue;

    const id = (colMap.id !== -1 && cols[colMap.id]) ? cols[colMap.id] : `prod-${String(lineCount - 1).padStart(6, '0')}`;
    const title = (colMap.title !== -1 && cols[colMap.title]) ? cols[colMap.title] : `Curated Item ${id}`;
    const description = (colMap.description !== -1 && cols[colMap.description]) ? cols[colMap.description] : '';
    
    let price = 0;
    if (colMap.price !== -1 && cols[colMap.price]) {
      price = parseFloat(cols[colMap.price].replace(/[^0-9.]/g, '')) || 0;
    }

    let salePrice = null;
    if (colMap.salePrice !== -1 && cols[colMap.salePrice]) {
      const sp = parseFloat(cols[colMap.salePrice].replace(/[^0-9.]/g, ''));
      if (!isNaN(sp) && sp > 0 && sp < price) {
        salePrice = sp;
      }
    }

    const category = (colMap.category !== -1 && cols[colMap.category])
      ? cols[colMap.category].toLowerCase().trim()
      : 'accessories';

    const affiliateUrl = (colMap.affiliateUrl !== -1 && cols[colMap.affiliateUrl])
      ? cols[colMap.affiliateUrl]
      : `https://example.com/affiliate/direct/${id}`;

    const imageUrl = (colMap.imageUrl !== -1 && cols[colMap.imageUrl])
      ? cols[colMap.imageUrl]
      : `https://picsum.photos/seed/${id}/600/800`;

    let network = 'impact';
    if (colMap.network !== -1 && cols[colMap.network]) {
      network = cols[colMap.network].toLowerCase().trim();
    } else if (affiliateUrl.includes('cj.com') || affiliateUrl.includes('/cj/')) {
      network = 'cj';
    }

    const merchant = (colMap.merchant !== -1 && cols[colMap.merchant])
      ? cols[colMap.merchant]
      : 'Supernova';

    const tags = (colMap.tags !== -1 && cols[colMap.tags]) ? cols[colMap.tags] : category;

    batch.push({
      id,
      title,
      description,
      price,
      salePrice,
      merchant,
      category,
      affiliateUrl,
      imageUrl,
      network,
      tags,
    });

    if (batch.length >= BATCH_SIZE) {
      insertMany(batch);
      importedCount += batch.length;
      batch = [];
      const mem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
      process.stdout.write(`\r[FEED_IMPORT] Progress: ${importedCount.toLocaleString()} products inserted... (RAM: ${mem} MB)`);
    }
  }

  // Insert remaining rows
  if (batch.length > 0) {
    insertMany(batch);
    importedCount += batch.length;
  }

  console.log(`\n[FEED_IMPORT] Building Full-Text Search (FTS5) index...`);
  db.exec(`
    INSERT INTO products_fts(products_fts) VALUES('rebuild');
  `);

  // Restore normal SQLite write mode
  db.pragma('synchronous = NORMAL');

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  const totalInDb = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  const totalCategories = db.prepare('SELECT COUNT(DISTINCT category) as count FROM products').get().count;

  console.log(`\n=============================================================`);
  console.log(`  IMPORT COMPLETE!`);
  console.log(`  - Total rows in DB:       ${totalInDb.toLocaleString()}`);
  console.log(`  - Unique categories:      ${totalCategories}`);
  console.log(`  - Time taken:             ${totalTime} seconds (${Math.round(totalInDb / totalTime).toLocaleString()} rows/sec)`);
  console.log(`  - Database path:          ${DB_PATH}`);
  console.log(`=============================================================\n`);

  db.close();
}

// --------------------------------------------------------------------------
// Entrypoint
// --------------------------------------------------------------------------
const args = process.argv.slice(2);
if (args[0] === '--generate') {
  const count = parseInt(args[1], 10) || 143000;
  generateSynthetic143kFeed(DEFAULT_CSV_PATH, count);
} else {
  const targetCsv = args[0] || DEFAULT_CSV_PATH;
  importFeed(targetCsv).catch((err) => {
    console.error('[FEED_IMPORT] Error during import:', err);
    process.exit(1);
  });
}
