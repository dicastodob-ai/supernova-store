const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.join(PROJECT_ROOT, 'data', 'supernova.db');
const MASTER_PATH = path.join(PROJECT_ROOT, 'data', 'master_catalog.json');
const WP_PATH = path.join(PROJECT_ROOT, 'productos_wordpress.csv');
const DATA_JSON_PATH = path.join(PROJECT_ROOT, 'data.json');
const PUBLIC_DATA_JSON_PATH = path.join(PROJECT_ROOT, 'public', 'data.json');
const PUBLIC_PRODUCTS_JSON_PATH = path.join(PROJECT_ROOT, 'public', 'data', 'products.json');

const BLACKLIST = ['booking', 'aliexpress'];

function isBlacklisted(str) {
  if (!str) return false;
  const s = String(str).toLowerCase();
  return BLACKLIST.some((b) => s.includes(b));
}

function parseCsvLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

function runQuickSync() {
  console.log('🚀 [EMERGENCY DEMO SYNC] Inicializando catálogo ultra-rápido...');

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');

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

    DELETE FROM products;
  `);

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO products (
      id, title, description, price, sale_price, currency, merchant,
      category, affiliate_url, image_url, network, tags, is_active
    ) VALUES (
      @id, @title, @description, @price, @salePrice, 'USD', @merchant,
      @category, @affiliateUrl, @imageUrl, 'cj', @tags, 1
    )
  `);

  const products = [];
  const seenIds = new Set();

  // 1. Cargar master_catalog.json
  if (fs.existsSync(MASTER_PATH)) {
    const masterItems = JSON.parse(fs.readFileSync(MASTER_PATH, 'utf8'));
    for (const item of masterItems) {
      if (isBlacklisted(item.merchant) || isBlacklisted(item.title) || isBlacklisted(item.affiliateUrl)) continue;
      const id = item.id || `master-${products.length + 1}`;
      if (seenIds.has(id)) continue;
      seenIds.add(id);

      products.push({
        id,
        title: item.title,
        description: item.description || '',
        price: parseFloat(item.price) || 29.99,
        salePrice: item.salePrice ? parseFloat(item.salePrice) : null,
        merchant: item.merchant || 'Supernova Partner',
        category: item.category || 'tech',
        affiliateUrl: item.affiliateUrl || item.product_url,
        imageUrl: item.imageUrl,
        tags: item.tags || 'cj,featured',
      });
    }
  }

  // 2. Cargar productos_wordpress.csv (1.000 productos verificados)
  if (fs.existsSync(WP_PATH)) {
    const lines = fs.readFileSync(WP_PATH, 'utf8').split('\n');
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = parseCsvLine(line);
      if (cols.length < 18) continue;

      const sku = cols[1] || `wp-${i}`;
      const name = cols[2];
      const desc = cols[7] || cols[6] || '';
      const regPrice = parseFloat(cols[11]) || 19.99;
      const salePrice = cols[12] ? parseFloat(cols[12]) : null;
      const category = (cols[13] || 'tech').toLowerCase();
      const tags = cols[14] || 'cj,affiliate';
      const imageUrl = cols[15] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
      const buyUrl = cols[16];
      const merchant = cols[19] || 'Verified Partner';

      if (isBlacklisted(merchant) || isBlacklisted(name) || isBlacklisted(buyUrl)) continue;
      if (seenIds.has(sku)) continue;
      seenIds.add(sku);

      products.push({
        id: sku,
        title: name,
        description: desc,
        price: regPrice,
        salePrice,
        merchant,
        category,
        affiliateUrl: buyUrl,
        imageUrl,
        tags,
      });
    }
  }

  console.log(`📦 Insertando ${products.length} productos verificados en SQLite...`);
  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insertStmt.run(item);
    }
  });
  insertMany(products);

  console.log(`🔍 Reconstruyendo índice FTS5...`);
  db.exec("INSERT INTO products_fts(products_fts) VALUES('rebuild');");
  db.close();

  // Exportar datasets
  console.log(`📁 Exportando datasets sincronizados...`);
  const exportJson = JSON.stringify(products.slice(0, 500), null, 2);
  fs.writeFileSync(DATA_JSON_PATH, exportJson, 'utf8');
  if (fs.existsSync(path.dirname(PUBLIC_DATA_JSON_PATH))) {
    fs.writeFileSync(PUBLIC_DATA_JSON_PATH, exportJson, 'utf8');
  }
  if (fs.existsSync(path.dirname(PUBLIC_PRODUCTS_JSON_PATH))) {
    fs.writeFileSync(PUBLIC_PRODUCTS_JSON_PATH, exportJson, 'utf8');
  }

  console.log(`✅ ¡Catálogo listo y optimizado con ${products.length} productos activos!`);
}

runQuickSync();
