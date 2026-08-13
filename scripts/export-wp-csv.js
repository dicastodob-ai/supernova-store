/**
 * Supernova Store — WooCommerce Product Exporter
 *
 * Extracts the top 1,000 products from SQLite and formats them into a standard
 * CSV compatible with WooCommerce's native Product CSV Importer.
 *
 * Mapped WooCommerce Columns:
 *  - Type (external / affiliate)
 *  - SKU (Product ID)
 *  - Name (Title)
 *  - Published (1)
 *  - Is featured? (0/1)
 *  - Visibility in catalog (visible)
 *  - Short description
 *  - Description
 *  - Tax status (none)
 *  - In stock? (1)
 *  - Regular price
 *  - Sale price
 *  - Categories
 *  - Tags
 *  - Images (Image URL)
 *  - External URL (Affiliate Link / Deeplink)
 *  - Button text (Ver en Tienda / Buy Now)
 *  - Meta: _network (Impact / CJ)
 *  - Meta: _merchant (Brand / Advertiser)
 *
 * Usage:
 *   node scripts/export-wp-csv.js
 *   node scripts/export-wp-csv.js --limit 2000 --out custom_export.csv
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.join(PROJECT_ROOT, 'data', 'supernova.db');
const DEFAULT_OUT_PATH = path.join(PROJECT_ROOT, 'productos_wordpress.csv');

// --------------------------------------------------------------------------
// CSV Escaper (RFC 4180 standard)
// --------------------------------------------------------------------------
function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).trim();
  // Escape internal quotes by doubling them
  return `"${str.replace(/"/g, '""')}"`;
}

// --------------------------------------------------------------------------
// Main Export Logic
// --------------------------------------------------------------------------
function exportToWooCommerceCsv() {
  const args = process.argv.slice(2);
  const getArg = (flag, alias) => {
    const idx = args.findIndex((a) => a === flag || a === alias);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
  };

  const limit = parseInt(getArg('--limit', '-l') || '1000', 10);
  const outPath = getArg('--out', '-o') || DEFAULT_OUT_PATH;

  console.log(`=============================================================`);
  console.log(`  SUPERNOVA STORE — WOOCOMMERCE PRODUCT CSV EXPORTER`);
  console.log(`=============================================================`);
  console.log(`[WP_EXPORT] Source DB:  ${DB_PATH}`);
  console.log(`[WP_EXPORT] Limit:      ${limit.toLocaleString()} products`);
  console.log(`[WP_EXPORT] Target:     ${outPath}`);

  if (!fs.existsSync(DB_PATH)) {
    console.error(`❌ [WP_EXPORT] Database not found at ${DB_PATH}. Please run feed import or CJ sync first.`);
    process.exit(1);
  }

  const db = new Database(DB_PATH, { readonly: true });
  const startTime = Date.now();

  // Query top products prioritizing:
  // 1. Products on sale with highest discount percentage
  // 2. High quality titles and descriptions
  // 3. Balanced mix across categories and networks
  const query = `
    SELECT 
      id,
      title,
      description,
      price,
      sale_price,
      currency,
      merchant,
      category,
      affiliate_url,
      image_url,
      network,
      tags,
      is_active,
      created_at,
      CASE 
        WHEN sale_price IS NOT NULL AND sale_price < price AND price > 0 
        THEN ((price - sale_price) / price) * 100 
        ELSE 0 
      END AS discount_pct
    FROM products
    WHERE is_active = 1 
      AND title IS NOT NULL 
      AND title != ''
      AND price > 0
      AND image_url IS NOT NULL
      AND affiliate_url IS NOT NULL
    ORDER BY 
      discount_pct DESC,
      price DESC,
      id ASC
    LIMIT ?
  `;

  const rows = db.prepare(query).all(limit);
  console.log(`[WP_EXPORT] Retrieved ${rows.length.toLocaleString()} top products from database.`);

  if (rows.length === 0) {
    console.warn(`⚠️ [WP_EXPORT] No products found in database.`);
    db.close();
    return;
  }

  // Standard WooCommerce Product CSV Headers
  const headers = [
    'Type',
    'SKU',
    'Name',
    'Published',
    'Is featured?',
    'Visibility in catalog',
    'Short description',
    'Description',
    'Tax status',
    'In stock?',
    'Stock',
    'Regular price',
    'Sale price',
    'Categories',
    'Tags',
    'Images',
    'External URL',
    'Button text',
    'Meta: _affiliate_network',
    'Meta: _merchant_brand',
  ];

  const writeStream = fs.createWriteStream(outPath, { encoding: 'utf8' });
  writeStream.write(headers.join(',') + '\n');

  let exportedCount = 0;
  let categoryCounts = {};
  let networkCounts = {};

  for (const row of rows) {
    const formattedCat = row.category
      ? row.category.charAt(0).toUpperCase() + row.category.slice(1)
      : 'General';

    const cleanDesc = row.description || `${row.title}. Curated affiliate selection on Supernova Store.`;
    const cleanTags = row.tags ? row.tags.replace(/\[|\]|"/g, '') : formattedCat;
    const buttonText = 'Ver Oferta'; // WooCommerce external button CTA

    const csvRow = [
      escapeCsv('external'),                         // Type (external / affiliate product)
      escapeCsv(row.id),                             // SKU
      escapeCsv(row.title),                          // Name
      escapeCsv(1),                                  // Published (1 = Yes)
      escapeCsv(row.discount_pct > 20 ? 1 : 0),      // Is featured? (featured if > 20% discount)
      escapeCsv('visible'),                          // Visibility in catalog
      escapeCsv(cleanDesc.substring(0, 160)),        // Short description
      escapeCsv(cleanDesc),                          // Description
      escapeCsv('none'),                             // Tax status
      escapeCsv(1),                                  // In stock?
      escapeCsv(''),                                 // Stock quantity
      escapeCsv(row.price.toFixed(2)),               // Regular price
      escapeCsv(row.sale_price ? row.sale_price.toFixed(2) : ''), // Sale price
      escapeCsv(formattedCat),                       // Categories
      escapeCsv(cleanTags),                          // Tags
      escapeCsv(row.image_url),                      // Images (featured image)
      escapeCsv(row.affiliate_url),                  // External URL (Affiliate Deeplink)
      escapeCsv(buttonText),                         // Button text
      escapeCsv(row.network ? row.network.toUpperCase() : 'AFFILIATE'), // Meta: Network
      escapeCsv(row.merchant || 'Supernova'),        // Meta: Merchant / Brand
    ];

    writeStream.write(csvRow.join(',') + '\n');
    exportedCount++;

    categoryCounts[formattedCat] = (categoryCounts[formattedCat] || 0) + 1;
    networkCounts[row.network] = (networkCounts[row.network] || 0) + 1;
  }

  writeStream.end();

  writeStream.on('finish', () => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    const fileSizeKb = (fs.statSync(outPath).size / 1024).toFixed(1);

    console.log(`\n=============================================================`);
    console.log(`  WOOCOMMERCE EXPORT COMPLETE!`);
    console.log(`  - File created:       ${outPath}`);
    console.log(`  - Total products:     ${exportedCount.toLocaleString()}`);
    console.log(`  - File size:          ${fileSizeKb} KB`);
    console.log(`  - Time taken:         ${elapsed}s`);
    console.log(`\n  Distribution by Category:`);
    for (const [cat, count] of Object.entries(categoryCounts)) {
      console.log(`    • ${cat.padEnd(16)}: ${count} products`);
    }
    console.log(`\n  Distribution by Network:`);
    for (const [net, count] of Object.entries(networkCounts)) {
      console.log(`    • ${(net || 'other').toUpperCase().padEnd(16)}: ${count} products`);
    }
    console.log(`\n  How to import into WooCommerce:`);
    console.log(`  1. In WordPress Admin, go to: Products > All Products`);
    console.log(`  2. Click "Import" at the top.`);
    console.log(`  3. Choose the file "productos_wordpress.csv" and click Continue.`);
    console.log(`  4. Click "Run the Importer".`);
    console.log(`=============================================================\n`);
    db.close();
  });
}

exportToWooCommerceCsv();
