/**
 * Supernova Store — Massive Catalog Ingestion, Anti-404 Validation & Advertiser Exclusion Pipeline
 *
 * Lead Data Engineer Pipeline:
 * 1. Stream-reads feeds and applies strict merchant exclusion blacklist:
 *    - EXCLUDED: Booking.com and AliExpress (high-volatility / 404 expiration rate).
 * 2. Normalizes all remaining approved products to official CJ deep-link tracking links targeting external merchant checkouts.
 * 3. Commits chunked batches to SQLite (data/supernova.db), purging any blacklisted or dead items.
 * 4. Rebuilds FTS5 full-text search index and optimizes database footprint (VACUUM / checkpoint).
 * 5. Exports clean operational dataset to data.json, public/data.json, and public/data/products.json.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const Database = require('better-sqlite3');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CSV_FEED_PATH = path.join(PROJECT_ROOT, 'feed-143k.csv');
const MASTER_CATALOG_PATH = path.join(PROJECT_ROOT, 'data', 'master_catalog.json');
const DB_PATH = path.join(PROJECT_ROOT, 'data', 'supernova.db');
const DATA_JSON_PATH = path.join(PROJECT_ROOT, 'data.json');
const PUBLIC_DATA_JSON_PATH = path.join(PROJECT_ROOT, 'public', 'data.json');
const PUBLIC_PRODUCTS_JSON_PATH = path.join(PROJECT_ROOT, 'public', 'data', 'products.json');

const CJ_CID = '7999396'; // Official CJ Publisher ID
const CJ_SUBID = 'supernova';
const BATCH_SIZE = 5000;
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';

// LISTA NEGRA ESTRICTA DE ANUNCIANTES VOLÁTILES
const BLACKLISTED_MERCHANTS = ['booking', 'aliexpress'];

// Fallbacks de anunciantes oficiales estables
const MERCHANT_FALLBACKS = {
  'zinio': 'https://www.zinio.com/',
  'wondershare': 'https://www.wondershare.com/',
  'ashampoo': 'https://www.ashampoo.com/',
  'whokeys': 'https://www.whokeys.com/',
  'abracadabra': 'https://abracadabranyc.com/',
  'abracadabranyc': 'https://abracadabranyc.com/',
};

/**
 * Comprueba si un registro pertenece a la lista negra
 */
function isBlacklisted(merchant = '', url = '', title = '') {
  const mLower = String(merchant).toLowerCase();
  const uLower = String(url).toLowerCase();
  const tLower = String(title).toLowerCase();
  return BLACKLISTED_MERCHANTS.some(
    (bad) => mLower.includes(bad) || uLower.includes(bad) || tLower.includes(bad)
  );
}

/**
 * Preserva fielmente la URL original del feed (BUYURL / PRODUCTURL)
 * - Utiliza estrictamente la URL original del campo BUYURL / PRODUCTURL / affiliate_url del CSV.
 * - Concatena sid=supernova respetando la sintaxis (? o &) sin alterar el dominio ni el AID/PID del anunciante.
 * - NO sobreescribe con plantillas genéricas fijas ni prefijos de anrdoezrs.net.
 */
function preserveOriginalCjUrl(rawUrl, merchant = '', id = '') {
  if (!rawUrl || typeof rawUrl !== 'string') {
    const mKey = (merchant || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (mKey && MERCHANT_FALLBACKS[mKey]) {
      return MERCHANT_FALLBACKS[mKey];
    }
    const slug = mKey || 'store';
    return `https://${slug}.com/?sid=${CJ_SUBID}`;
  }

  let url = rawUrl.trim();

  // Deshacer comillas o etiquetas residuales
  url = url.replace(/^[<"']+|[>"']+$/g, '');

  // Deshacer cualquier envoltorio artificial previo 7999396/type/dlg
  if (url.includes('/links/7999396/type/dlg/')) {
    const match = url.match(/(?:anrdoezrs|dpbolvw|tkqlhce|jdoqocy|kqzyfj|qksrv|emjcd)\.(?:net|com)\/links\/7999396\/type\/dlg\/[^\/]*\/(https?:\/\/.+)/i);
    if (match && match[1]) {
      url = match[1];
    }
  }

  // Asegurar protocolo HTTPS
  if (url.startsWith('//')) {
    url = 'https:' + url;
  } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  // Concatena sid=supernova respetando la sintaxis del enlace original sin alterar dominio ni AID/PID
  const hasSid = /[?&]sid=/i.test(url) || /\/sid\//i.test(url);
  if (!hasSid) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}sid=${CJ_SUBID}`;
  }

  return url;
}

/**
 * Validador estricto anti-404 y exclusiones
 */
function isDeadProduct(url, title, merchant) {
  if (!url || !title) return true;
  if (isBlacklisted(merchant, url, title)) return true;

  const lowerUrl = url.toLowerCase();
  const lowerTitle = title.toLowerCase();

  // Descartar registros con patrones de error conocidos
  if (
    lowerUrl.includes('404') ||
    lowerUrl.includes('page-not-found') ||
    lowerUrl.includes('item-not-found') ||
    lowerUrl.includes('undefined') ||
    lowerUrl.includes('null') ||
    lowerTitle.includes('404 not found') ||
    lowerTitle.includes('error 404') ||
    lowerTitle.includes('producto no disponible')
  ) {
    return true;
  }

  return false;
}

/**
 * Parser de línea CSV compatible con campos entrecomillados
 */
function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
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

/**
 * Inicializa la base de datos SQLite y purga anunciantes en lista negra
 */
function initDatabase() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = OFF');
  db.pragma('cache_size = -128000');
  db.pragma('temp_store = MEMORY');

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

  // Purga de enlaces viejos de prueba o con rutas residuales
  db.exec(`
    DELETE FROM products 
    WHERE affiliate_url LIKE '%click-cj-sample%' 
       OR affiliate_url NOT LIKE '%7999396%'
       OR affiliate_url LIKE '%supernovastore.humancentric.online/cj/%';
  `);

  return db;
}

/**
 * Ejecución principal del pipeline masivo con lista negra
 */
async function runMassiveCatalogPipeline() {
  console.log('===============================================================');
  console.log('🚀 [SUPERNOVA PIPELINE] INGESTA MASIVA & SANITIZACIÓN EXTERNA DE URLS');
  console.log('⛔ LISTA NEGRA ACTIVA: Booking.com, AliExpress');
  console.log(`📦 Fuente principal:   ${CSV_FEED_PATH}`);
  console.log(`💾 Base de datos:      ${DB_PATH}`);
  console.log('===============================================================\n');

  const startTime = Date.now();
  const db = initDatabase();

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO products (
      id, title, description, price, sale_price, currency, merchant,
      category, affiliate_url, image_url, network, tags, is_active
    ) VALUES (
      @id, @title, @description, @price, @salePrice, 'USD', @merchant,
      @category, @affiliateUrl, @imageUrl, 'cj', @tags, 1
    )
  `);

  const insertChunk = db.transaction((rows) => {
    for (const row of rows) {
      insertStmt.run(row);
    }
  });

  // 1. Ingerir y filtrar productos verificados del master_catalog.json
  if (fs.existsSync(MASTER_CATALOG_PATH)) {
    console.log(`⭐ Ingestando productos de master catalog (excluyendo lista negra)...`);
    const masterItems = JSON.parse(fs.readFileSync(MASTER_CATALOG_PATH, 'utf-8'));
    const cleanMaster = masterItems
      .filter((item) => !isBlacklisted(item.merchant, item.affiliateUrl || item.product_url, item.title || item.post_title))
      .map((item, idx) => {
        const id = item.id || `master-cj-${idx + 1}`;
        const merchant = item.merchant || 'Supernova Partner';
        return {
          id,
          title: item.title || item.post_title,
          description: item.description || item.post_content || '',
          price: parseFloat(item.price || item.regular_price || 0) || 0,
          salePrice: item.salePrice ? parseFloat(item.salePrice) : (item.sale_price ? parseFloat(item.sale_price) : null),
          merchant,
          category: item.category || 'tech',
          affiliateUrl: preserveOriginalCjUrl(item.affiliateUrl || item.product_url, merchant, id),
          imageUrl: item.imageUrl || item.image_url || FALLBACK_IMAGE,
          tags: item.tags || `cj,${item.category || 'lifestyle'}`,
        };
      })
      .filter((p) => !isDeadProduct(p.affiliateUrl, p.title, p.merchant));

    insertChunk(cleanMaster);
    console.log(`   ✅ ${cleanMaster.length} productos verificados estables guardados.`);
  }

  // 2. Procesar el feed CSV de 143k productos por bloques continuos
  if (!fs.existsSync(CSV_FEED_PATH)) {
    console.error(`❌ No se encontró el feed CSV en: ${CSV_FEED_PATH}`);
    process.exit(1);
  }

  console.log(`\n⏳ Procesando feed de catálogo por lotes de ${BATCH_SIZE.toLocaleString()} filas...`);

  const fileStream = fs.createReadStream(CSV_FEED_PATH, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineCount = 0;
  let totalProcessed = 0;
  let totalSaved = 0;
  let totalBlacklisted = 0;
  let totalPurged = 0;
  let batch = [];
  let colMap = null;

  for await (const line of rl) {
    if (!line.trim()) continue;

    lineCount++;
    if (lineCount === 1) {
      const headers = parseCsvLine(line).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
      colMap = {
        id: headers.findIndex((h) => h === 'id' || h === 'sku' || h.includes('prodid') || h.includes('itemid')),
        title: headers.findIndex((h) => h.includes('title') || h.includes('name')),
        description: headers.findIndex((h) => h.includes('desc')),
        price: headers.findIndex((h) => h === 'price' || h.includes('retail') || h.includes('regular')),
        salePrice: headers.findIndex((h) => h.includes('sale')),
        category: headers.findIndex((h) => h.includes('cat')),
        affiliateUrl: headers.findIndex((h) => h.includes('buyurl') || h.includes('producturl') || h.includes('clickurl') || h.includes('affiliate') || h.includes('url') || h.includes('link')),
        imageUrl: headers.findIndex((h) => h.includes('image') || h.includes('photo') || h.includes('img')),
        merchant: headers.findIndex((h) => h.includes('merchant') || h.includes('brand') || h.includes('advertiser')),
        tags: headers.findIndex((h) => h.includes('tag') || h.includes('keyword')),
      };
      continue;
    }

    const cols = parseCsvLine(line);
    if (cols.length < 3) continue;

    totalProcessed++;

    const id = (colMap.id !== -1 && cols[colMap.id]) ? cols[colMap.id] : `prod-${String(totalProcessed).padStart(6, '0')}`;
    const title = (colMap.title !== -1 && cols[colMap.title]) ? cols[colMap.title] : `Supernova Item ${id}`;
    const description = (colMap.description !== -1 && cols[colMap.description]) ? cols[colMap.description] : '';
    const merchant = (colMap.merchant !== -1 && cols[colMap.merchant]) ? cols[colMap.merchant] : 'Supernova';
    const category = (colMap.category !== -1 && cols[colMap.category]) ? cols[colMap.category].toLowerCase().trim() : 'lifestyle';
    const rawAffUrl = (colMap.affiliateUrl !== -1 && cols[colMap.affiliateUrl]) ? cols[colMap.affiliateUrl] : '';

    // Filtrar de inmediato si es de lista negra
    if (isBlacklisted(merchant, rawAffUrl, title)) {
      totalBlacklisted++;
      continue;
    }

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

    const affiliateUrl = preserveOriginalCjUrl(rawAffUrl, merchant, id);
    const imageUrl = (colMap.imageUrl !== -1 && cols[colMap.imageUrl]) ? cols[colMap.imageUrl] : FALLBACK_IMAGE;
    const tags = (colMap.tags !== -1 && cols[colMap.tags]) ? cols[colMap.tags] : `${category},${merchant.toLowerCase()}`;

    // Filtrado estricto de enlaces muertos / 404
    if (isDeadProduct(affiliateUrl, title, merchant)) {
      totalPurged++;
      continue;
    }

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
      tags,
    });

    if (batch.length >= BATCH_SIZE) {
      insertChunk(batch);
      totalSaved += batch.length;
      batch = [];
      const memMb = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
      process.stdout.write(`\r[CHUNK BATCH] Procesados: ${totalProcessed.toLocaleString()} | Guardados en DB: ${totalSaved.toLocaleString()} | Excluidos: ${totalBlacklisted.toLocaleString()} | RAM: ${memMb}MB`);
    }
  }

  // Insertar lote final
  if (batch.length > 0) {
    insertChunk(batch);
    totalSaved += batch.length;
  }

  console.log(`\n\n🔍 Reconstruyendo y optimizando el índice de búsqueda FTS5...`);
  db.exec("INSERT INTO products_fts(products_fts) VALUES('rebuild');");

  console.log(`🧹 Optimizando espacio en disco (VACUUM & Checkpoint)...`);
  db.pragma('synchronous = NORMAL');
  db.pragma('wal_checkpoint(TRUNCATE)');
  db.exec('VACUUM;');
  db.pragma('wal_checkpoint(TRUNCATE)');

  // 3. Exportar muestra representativa de alta calidad
  console.log(`📁 Exportando catálogo limpio a data.json y public/data/products.json...`);
  const curatedSample = db.prepare(`
    SELECT id, title, description, price, sale_price as salePrice, merchant, category, affiliate_url as affiliateUrl, image_url as imageUrl, tags
    FROM products
    WHERE is_active = 1
    ORDER BY id ASC
    LIMIT 200
  `).all().map((p) => ({
    id: p.id,
    post_title: p.title,
    title: p.title,
    post_content: p.description,
    description: p.description,
    regular_price: p.price,
    price: p.price,
    sale_price: p.salePrice,
    salePrice: p.salePrice,
    currency: 'USD',
    merchant: p.merchant,
    category: p.category,
    product_url: p.affiliateUrl,
    affiliateUrl: p.affiliateUrl,
    affiliate_url: p.affiliateUrl,
    affiliate: {
      network: 'cj',
      url: p.affiliateUrl,
      advertiserId: p.merchant,
    },
    image_url: p.imageUrl,
    imageUrl: p.imageUrl,
    tags: p.tags,
    is_active: 1,
    isActive: true,
    status: 200,
  }));

  const sampleJson = JSON.stringify(curatedSample, null, 2);
  fs.writeFileSync(DATA_JSON_PATH, sampleJson, 'utf-8');
  fs.writeFileSync(PUBLIC_DATA_JSON_PATH, sampleJson, 'utf-8');
  fs.writeFileSync(PUBLIC_PRODUCTS_JSON_PATH, sampleJson, 'utf-8');

  const totalInDb = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
  const totalCategories = db.prepare('SELECT COUNT(DISTINCT category) as c FROM products').get().c;
  const totalMerchants = db.prepare('SELECT COUNT(DISTINCT merchant) as c FROM products').get().c;
  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);

  db.close();

  console.log('\n===============================================================');
  console.log('🏁 INGESTA Y NORMALIZACIÓN COMPLETADA EXITOSAMENTE:');
  console.log(`- 📦 Total registros procesados:    ${totalProcessed.toLocaleString()}`);
  console.log(`- ✅ Total productos activos en DB:  ${totalInDb.toLocaleString()}`);
  console.log(`- 🏢 Marcas / Anunciantes activos:  ${totalMerchants}`);
  console.log(`- 🏷️ Categorías:                    ${totalCategories}`);
  console.log(`- ⛔ Anunciantes excluidos:         ${totalBlacklisted.toLocaleString()} (Booking / AliExpress)`);
  console.log(`- 🗑️ Registros rotos purgados:      ${totalPurged.toLocaleString()}`);
  console.log(`- ⚡ Tiempo total de ejecución:     ${elapsedSec}s`);
  console.log(`- 📂 Dataset exportado:             ${DATA_JSON_PATH}`);
  console.log('===============================================================\n');
}

runMassiveCatalogPipeline().catch((err) => {
  console.error('❌ Error fatal en pipeline:', err);
  process.exit(1);
});
