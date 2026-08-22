/**
 * Supernova Store — Impact Radius SFTP Ingestion Pipeline ("Anti-Gravedad")
 *
 * Connects securely to Impact SFTP (sftp.impact.com), downloads active merchant catalog feeds,
 * parses CSV rows, maps categories, and ingests them into SQLite (data/supernova.db).
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const Client = require('ssh2-sftp-client');
const Database = require('better-sqlite3');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const DB_PATH = path.join(DATA_DIR, 'supernova.db');
const LOCAL_FEED_BACKUP = path.join(DATA_DIR, 'impact_catalog_latest.csv');

// Categorías Maestras
function normalizeCategory(rawCategory = '', title = '') {
  const combined = `${rawCategory} ${title}`.toLowerCase();
  if (
    combined.includes('software') ||
    combined.includes('antivirus') ||
    combined.includes('licencia') ||
    combined.includes('windows') ||
    combined.includes('office') ||
    combined.includes('vpn') ||
    combined.includes('utility') ||
    combined.includes('pc optimizer')
  ) {
    return { name: 'Software', slug: 'software' };
  }
  if (
    combined.includes('camera') ||
    combined.includes('dash cam') ||
    combined.includes('gadget') ||
    combined.includes('sensor') ||
    combined.includes('drone') ||
    combined.includes('smart') ||
    combined.includes('audio') ||
    combined.includes('tech')
  ) {
    return { name: 'Tech & Gadgets', slug: 'tech' };
  }
  return { name: 'Electrónica', slug: 'electronics' };
}

// Limpiador CSV con soporte para comillas anidadas
function parseCsvLine(line) {
  const values = [];
  let inQuotes = false;
  let cur = '';
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      values.push(cur.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
      cur = '';
    } else {
      cur += c;
    }
  }
  values.push(cur.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
  return values;
}

async function syncImpactCatalog(options = {}) {
  const sftp = new Client();
  
  const config = {
    host: process.env.IMPACT_SFTP_HOST || 'sftp.impact.com',
    port: parseInt(process.env.IMPACT_SFTP_PORT || '22', 10),
    username: process.env.IMPACT_SFTP_USER,
    password: process.env.IMPACT_SFTP_PASS,
    readyTimeout: 30000,
    retries: 2
  };

  const remotePath = options.remotePath || process.env.IMPACT_SFTP_REMOTE_PATH || '/informes/descarga.csv';
  const tempDownloadPath = path.join(os.tmpdir(), `impact_catalog_${Date.now()}.csv`);

  console.log('===============================================================');
  console.log('🚀 PROYECTO SUPERNOVA STORE: INGESTA IMPACT SFTP (ANTI-GRAVEDAD)');
  console.log('🌐 Host SFTP:', config.host);
  console.log('📂 Ruta Remota:', remotePath);
  console.log('===============================================================\n');

  let downloadedFile = null;

  try {
    if (!config.username || !config.password) {
      console.warn('⚠️ Credenciales SFTP no detectadas en variables de entorno (IMPACT_SFTP_USER / IMPACT_SFTP_PASS).');
      if (fs.existsSync(LOCAL_FEED_BACKUP)) {
        console.log(`📁 Utilizando copia local disponible: ${LOCAL_FEED_BACKUP}`);
        downloadedFile = LOCAL_FEED_BACKUP;
      } else {
        throw new Error('No se puede conectar al SFTP sin credenciales ni existe copia local en data/impact_catalog_latest.csv');
      }
    } else {
      console.log(`🔌 Conectando a ${config.host} como ${config.username}...`);
      await sftp.connect(config);
      console.log('✅ Túnel SFTP establecido con éxito.');

      // Si se solicita listar directorio
      if (options.listDir) {
        console.log(`📂 Explorando directorio remoto: ${options.listDir}...`);
        const list = await sftp.list(options.listDir);
        console.log('Archivos remotos encontrados:', list.map(f => `${f.name} (${f.size} bytes)`));
        return;
      }

      console.log(`⬇️ Descargando catálogo remoto desde ${remotePath}...`);
      await sftp.fastGet(remotePath, tempDownloadPath);
      console.log(`✅ Catálogo descargado exitosamente en: ${tempDownloadPath}`);
      
      // Guardar copia de seguridad en data/
      fs.copyFileSync(tempDownloadPath, LOCAL_FEED_BACKUP);
      downloadedFile = tempDownloadPath;
    }

    // 2. Ingesta a SQLite
    console.log(`\n🔹 Iniciando procesamiento de datos e inyección en SQLite (${DB_PATH})...`);
    
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');

    // Asegurar estructura de tablas
    db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        sale_price REAL,
        currency TEXT DEFAULT 'EUR',
        merchant TEXT,
        category TEXT NOT NULL,
        affiliate_url TEXT NOT NULL,
        image_url TEXT NOT NULL,
        network TEXT NOT NULL,
        tags TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

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

    const fileStream = fs.createReadStream(downloadedFile, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let lineIndex = 0;
    let headers = [];
    const productsToInsert = [];
    let nameIdx = -1, skuIdx = -1, priceIdx = -1, salePriceIdx = -1, imgIdx = -1, urlIdx = -1, merchantIdx = -1, descIdx = -1, catIdx = -1;

    for await (const line of rl) {
      lineIndex++;
      if (lineIndex === 1) {
        headers = parseCsvLine(line).map(h => h.toLowerCase().trim());
        console.log('📋 Cabeceras detectadas:', headers);

        // Mapeo flexible de columnas Impact / estándar
        nameIdx = headers.findIndex(h => h.includes('name') || h.includes('title') || h.includes('product_name') || h === 'product');
        skuIdx = headers.findIndex(h => h.includes('sku') || h.includes('id') || h.includes('product_id') || h.includes('mpn'));
        priceIdx = headers.findIndex(h => h.includes('price') || h.includes('retail_price') || h.includes('original_price'));
        salePriceIdx = headers.findIndex(h => h.includes('sale_price') || h.includes('discount_price') || h.includes('current_price'));
        imgIdx = headers.findIndex(h => h.includes('image') || h.includes('image_url') || h.includes('imageurl') || h.includes('photo'));
        urlIdx = headers.findIndex(h => h.includes('url') || h.includes('buy_url') || h.includes('tracking_url') || h.includes('landing_page') || h.includes('link'));
        merchantIdx = headers.findIndex(h => h.includes('merchant') || h.includes('brand') || h.includes('advertiser') || h.includes('vendor'));
        descIdx = headers.findIndex(h => h.includes('description') || h.includes('desc') || h.includes('summary'));
        catIdx = headers.findIndex(h => h.includes('category') || h.includes('categories'));

        continue;
      }

      if (!line.trim()) continue;

      const cols = parseCsvLine(line);
      const title = cols[nameIdx !== -1 ? nameIdx : 2] || '';
      if (!title || title.length < 3) continue;

      const rawSku = cols[skuIdx !== -1 ? skuIdx : 1] || `impact-${lineIndex}`;
      const merchant = cols[merchantIdx !== -1 ? merchantIdx : 19] || 'Impact Merchant';
      const cleanId = `imp-${merchant.toLowerCase().replace(/[^a-z0-9]/g, '')}-${rawSku.replace(/[^a-z0-9_-]/gi, '')}`;

      const rawPrice = parseFloat((cols[priceIdx !== -1 ? priceIdx : 11] || '0').replace(/[^0-9.]/g, '')) || 19.99;
      const rawSalePrice = salePriceIdx !== -1 && cols[salePriceIdx] ? parseFloat(cols[salePriceIdx].replace(/[^0-9.]/g, '')) : null;
      
      const imageUrl = cols[imgIdx !== -1 ? imgIdx : 15] || '/placeholder-product.svg';
      let affiliateUrl = cols[urlIdx !== -1 ? urlIdx : 16] || '';
      
      if (!affiliateUrl) continue;
      if (!affiliateUrl.includes('subId') && !affiliateUrl.includes('sid=')) {
        affiliateUrl += (affiliateUrl.includes('?') ? '&' : '?') + 'subId1=supernova';
      }

      const description = cols[descIdx !== -1 ? descIdx : 6] || `Producto verificado de ${merchant} en Supernova Store.`;
      const rawCategory = cols[catIdx !== -1 ? catIdx : 13] || '';
      const { slug: categorySlug } = normalizeCategory(rawCategory, title);

      productsToInsert.push({
        id: cleanId,
        title,
        description,
        price: rawPrice,
        sale_price: rawSalePrice,
        currency: 'EUR',
        merchant,
        category: categorySlug,
        affiliate_url: affiliateUrl,
        image_url: imageUrl,
        network: 'impact',
        tags: `impact,${merchant.toLowerCase()},${categorySlug}`
      });
    }

    console.log(`📦 Procesados ${productsToInsert.length.toLocaleString()} productos para inserción...`);

    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO products (
        id, title, description, price, sale_price, currency, merchant,
        category, affiliate_url, image_url, network, tags, is_active
      ) VALUES (
        @id, @title, @description, @price, @sale_price, @currency, @merchant,
        @category, @affiliate_url, @image_url, @network, @tags, 1
      )
    `);

    const insertMany = db.transaction((items) => {
      for (const item of items) {
        insertStmt.run(item);
      }
    });

    insertMany(productsToInsert);

    // Actualizar FTS5
    db.exec(`INSERT INTO products_fts(products_fts) VALUES('rebuild');`);
    
    const count = db.prepare('SELECT COUNT(*) as total FROM products WHERE is_active = 1').get().total;
    console.log(`✅ Base de datos actualizada: ${count.toLocaleString()} productos activos.`);

    db.close();
    console.log('🎉 Secuencia Anti-Gravedad finalizada con éxito.');

  } catch (err) {
    console.error('❌ Error en la propulsión Anti-Gravedad:', err.message);
  } finally {
    try {
      await sftp.end();
    } catch (e) {}
    if (tempDownloadPath && fs.existsSync(tempDownloadPath) && tempDownloadPath !== LOCAL_FEED_BACKUP) {
      try {
        fs.unlinkSync(tempDownloadPath);
      } catch (e) {}
    }
  }
}

if (require.main === module) {
  syncImpactCatalog();
}

module.exports = { syncImpactCatalog };
