/**
 * Supernova Store — CJ Affiliate GraphQL API Product Synchronizer
 *
 * Connects to CJ's Product Search GraphQL API (https://ads.api.cj.com/query)
 * to fetch live advertiser product catalogs, map fields, and upsert them into
 * the Supernova SQLite database.
 *
 * Usage:
 *   node scripts/fetch-cj-api.js --cid <YOUR_CJ_PUBLISHER_CID>
 *   node scripts/fetch-cj-api.js --cid 1234567 --limit 500 --category electronics
 *   node scripts/fetch-cj-api.js --demo (demonstrates sync with realistic CJ response)
 *
 * Options:
 *   --cid, -c        Your 7-digit CJ Publisher Company ID (CID).
 *   --token, -t      Personal Access Token (defaults to configured token).
 *   --limit, -l      Products per request (default: 100, max: 1000).
 *   --max, -m        Maximum total products to sync (default: 10000).
 *   --keywords, -k   Filter by search keywords (comma-separated).
 *   --advertiser     Filter by specific advertiser IDs (comma-separated).
 *   --status         Partner status: JOINED (default) or ALL.
 *   --demo           Run a simulated CJ GraphQL sync to test database ingestion.
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const CJ_GRAPHQL_ENDPOINT = 'https://ads.api.cj.com/query';
const DEFAULT_TOKEN = process.env.CJ_PERSONAL_ACCESS_TOKEN || 'hUKoNNFZLA4PeWxd8JS0KN726w';
const DEFAULT_CID = process.env.CJ_COMPANY_ID || '';

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const DB_PATH = path.join(DATA_DIR, 'supernova.db');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// --------------------------------------------------------------------------
// Database Setup
// --------------------------------------------------------------------------
function getDb() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  return db;
}

// --------------------------------------------------------------------------
// Category Normalizer
// --------------------------------------------------------------------------
function mapToCategory(title, description, catalogName, brand) {
  const text = `${title} ${description} ${catalogName} ${brand}`.toLowerCase();

  if (/(headphone|earbud|audio|keyboard|mouse|laptop|monitor|screen|phone|camera|speaker|gadget|wireless|usb|charger|cable|tech|electronic|gaming)/i.test(text)) {
    return 'electronics';
  }
  if (/(shirt|dress|jacket|pants|trouser|sweater|hoodie|coat|denim|jeans|cotton|wool|silk|apparel|clothing|shoe|sneaker|boot|sock|suit|blazer)/i.test(text)) {
    return 'fashion';
  }
  if (/(chair|desk|table|lamp|light|sofa|bed|rug|vase|kitchen|cook|pan|knife|home|decor|furniture|blanket|cushion|pillow|ceramic|planter)/i.test(text)) {
    return 'home';
  }
  if (/(serum|cream|cleanser|skincare|perfume|fragrance|lotion|makeup|lipstick|mascara|shampoo|conditioner|oil|beauty|cosmetic|tonic|balm)/i.test(text)) {
    return 'beauty';
  }
  if (/(yoga|mat|fitness|gym|workout|dumbbell|running|sport|ball|tennis|bike|bicycle|cycling|hiking|outdoor|climb|swim|athletic)/i.test(text)) {
    return 'sports';
  }
  if (/(book|novel|biography|hardcover|paperback|guide|handbook|edition|read|author|literature|essay|monograph)/i.test(text)) {
    return 'books';
  }
  if (/(wallet|watch|sunglasses|eyewear|glasses|belt|bag|backpack|purse|tote|cardholder|keychain|jewelry|ring|necklace|bracelet|hat|cap)/i.test(text)) {
    return 'accessories';
  }

  return 'accessories';
}

// --------------------------------------------------------------------------
// GraphQL Query Builder
// --------------------------------------------------------------------------
function buildGqlQuery() {
  return `
    query GetCjProducts(
      $companyId: ID!
      $limit: Int
      $page: String
      $partnerStatus: PartnerStatus
      $keywords: [String!]
      $partnerIds: [ID!]
    ) {
      products(
        companyId: $companyId
        limit: $limit
        page: $page
        partnerStatus: $partnerStatus
        keywords: $keywords
        partnerIds: $partnerIds
      ) {
        totalCount
        count
        limit
        nextPage
        resultList {
          id
          title
          description
          price {
            amount
            currency
          }
          salePrice {
            amount
            currency
          }
          advertiserId
          advertiserName
          brand
          imageLink
          link
          catalogName
          targetCountry
        }
      }
    }
  `;
}

// --------------------------------------------------------------------------
// Fetch Products Page from CJ API
// --------------------------------------------------------------------------
async function fetchCjPage({ token, companyId, limit, page, partnerStatus, keywords, partnerIds }) {
  const query = buildGqlQuery();
  const variables = {
    companyId: String(companyId),
    limit: limit || 100,
    partnerStatus: partnerStatus || 'JOINED',
  };

  if (page) variables.page = page;
  if (keywords && keywords.length > 0) variables.keywords = keywords;
  if (partnerIds && partnerIds.length > 0) variables.partnerIds = partnerIds;

  const res = await fetch(CJ_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'SupernovaStore-CJSync/1.0',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const responseText = await res.text();

  if (!res.ok) {
    throw new Error(`CJ API returned HTTP ${res.status}: ${responseText}`);
  }

  let json;
  try {
    json = JSON.parse(responseText);
  } catch {
    throw new Error(`Invalid JSON returned by CJ API: ${responseText.substring(0, 300)}`);
  }

  if (json.errors && json.errors.length > 0) {
    throw new Error(`CJ GraphQL Error: ${json.errors.map((e) => e.message).join(' | ')}`);
  }

  if (!json.data || !json.data.products) {
    throw new Error(`Unexpected GraphQL response structure: ${JSON.stringify(json)}`);
  }

  return json.data.products;
}

// --------------------------------------------------------------------------
// Upsert Products to SQLite
// --------------------------------------------------------------------------
function upsertProducts(db, products) {
  const insertStmt = db.prepare(`
    INSERT INTO products (
      id, title, description, price, sale_price, currency, merchant,
      category, affiliate_url, image_url, network, tags, is_active
    ) VALUES (
      @id, @title, @description, @price, @salePrice, @currency, @merchant,
      @category, @affiliateUrl, @imageUrl, 'cj', @tags, 1
    )
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      price = excluded.price,
      sale_price = excluded.sale_price,
      currency = excluded.currency,
      merchant = excluded.merchant,
      category = excluded.category,
      affiliate_url = excluded.affiliate_url,
      image_url = excluded.image_url,
      network = 'cj',
      tags = excluded.tags,
      is_active = 1
  `);

  const insertBatch = db.transaction((items) => {
    for (const item of items) {
      insertStmt.run(item);
    }
  });

  insertBatch(products);
}

// --------------------------------------------------------------------------
// Demo / Simulation Mode
// --------------------------------------------------------------------------
function runDemoSync(db) {
  console.log(`\n[CJ_DEMO] Generating 25 realistic CJ Affiliate products for preview...`);
  const demoBrands = [
    { name: 'AliExpress', cat: 'electronics', id: '1001' },
    { name: 'Ashampoo Software', cat: 'electronics', id: '1002' },
    { name: 'Booking.com', cat: 'home', id: '1003' },
    { name: 'GearUP Games', cat: 'electronics', id: '1004' },
    { name: 'HumanCentric', cat: 'home', id: '1005' },
    { name: 'Monochrome Living', cat: 'fashion', id: '1006' },
  ];

  const demoItems = [];
  for (let i = 1; i <= 25; i++) {
    const brand = demoBrands[i % demoBrands.length];
    const id = `cj-${brand.name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${1000 + i}`;
    const title = `${brand.name} Minimalist Pro Edition ${String.fromCharCode(65 + (i % 26))}-${100 + i}`;
    const desc = `Official affiliate offering from ${brand.name}. Verified active partnership via CJ Affiliate.`;
    const price = (29.99 + (i * 12.5)).toFixed(2);
    const salePrice = i % 2 === 0 ? (parseFloat(price) * 0.85).toFixed(2) : null;
    const category = brand.cat;
    const affiliateUrl = `https://www.anrdoezrs.net/click-cj-sample-${i}?url=https%3A%2F%2F${brand.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com%2Fitem-${i}`;
    const imageUrl = `https://picsum.photos/seed/cj_${i}/600/800`;
    const tags = `cj,${brand.name.toLowerCase()},${category},affiliate`;

    demoItems.push({
      id,
      title,
      description: desc,
      price: parseFloat(price),
      salePrice: salePrice ? parseFloat(salePrice) : null,
      currency: 'USD',
      merchant: brand.name,
      category,
      affiliateUrl,
      imageUrl,
      tags,
    });
  }

  upsertProducts(db, demoItems);
  console.log(`[CJ_DEMO] Successfully ingested 25 CJ demo products into SQLite.`);
}

// --------------------------------------------------------------------------
// Main Synchronizer
// --------------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const getArg = (flag, alias) => {
    const idx = args.findIndex((a) => a === flag || a === alias);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
  };
  const hasFlag = (flag) => args.includes(flag);

  const token = getArg('--token', '-t') || DEFAULT_TOKEN;
  const companyId = getArg('--cid', '-c') || DEFAULT_CID;
  const limit = parseInt(getArg('--limit', '-l') || '100', 10);
  const maxTotal = parseInt(getArg('--max', '-m') || '5000', 10);
  const keywordsArg = getArg('--keywords', '-k');
  const keywords = keywordsArg ? keywordsArg.split(',').map((k) => k.trim()) : undefined;
  const advertiserArg = getArg('--advertiser', '-a');
  const partnerIds = advertiserArg ? advertiserArg.split(',').map((p) => p.trim()) : undefined;
  const partnerStatus = (getArg('--status') || 'JOINED').toUpperCase();

  console.log(`=============================================================`);
  console.log(`  SUPERNOVA STORE — CJ AFFILIATE GRAPHQL SYNCHRONIZER`);
  console.log(`=============================================================`);
  console.log(`[CJ_SYNC] Endpoint:    ${CJ_GRAPHQL_ENDPOINT}`);
  console.log(`[CJ_SYNC] Token:       ${token.substring(0, 6)}...${token.substring(token.length - 4)}`);
  console.log(`[CJ_SYNC] Target DB:   ${DB_PATH}`);

  const db = getDb();

  // If user requested demo simulation
  if (hasFlag('--demo') || (!companyId && hasFlag('--test'))) {
    runDemoSync(db);
    db.close();
    return;
  }

  // If companyId is missing, guide the user
  if (!companyId) {
    console.log(`\n⚠️  MISSING CJ COMPANY ID (CID)`);
    console.log(`-------------------------------------------------------------`);
    console.log(`The CJ Product Search GraphQL API requires your 7-digit Publisher CID.`);
    console.log(`\nWhere to find your CID:`);
    console.log(`1. Log in to https://members.cj.com`);
    console.log(`2. Look in the top right corner (next to your account name: e.g. "CID: 1234567")`);
    console.log(`3. Or go to Account > Users / Company Settings.`);
    console.log(`\nRun the command with your CID:`);
    console.log(`   node scripts/fetch-cj-api.js --cid <YOUR_7_DIGIT_CID>`);
    console.log(`\nOr test the database ingestion right now with demo data:`);
    console.log(`   node scripts/fetch-cj-api.js --demo\n`);
    db.close();
    process.exit(1);
  }

  console.log(`[CJ_SYNC] Company ID:  ${companyId}`);
  console.log(`[CJ_SYNC] Status:      ${partnerStatus}`);
  console.log(`[CJ_SYNC] Batch Size:  ${limit}`);
  console.log(`[CJ_SYNC] Max Limit:   ${maxTotal.toLocaleString()}`);

  const startTime = Date.now();
  let totalIngested = 0;
  let nextPageToken = null;
  let pageNumber = 1;

  try {
    do {
      console.log(`\n[CJ_SYNC] Fetching page ${pageNumber} (Cursor: ${nextPageToken || 'start'})...`);

      const result = await fetchCjPage({
        token,
        companyId,
        limit,
        page: nextPageToken,
        partnerStatus: partnerStatus === 'ALL' ? undefined : 'JOINED',
        keywords,
        partnerIds,
      });

      const items = result.resultList || [];
      console.log(`[CJ_SYNC] Received ${items.length} products (Total available in CJ: ${result.totalCount || 'unknown'})`);

      if (items.length === 0) {
        console.log(`[CJ_SYNC] No more products found from joined advertisers.`);
        break;
      }

      // Map CJ items to Supernova Product schema
      const mappedBatch = items.map((item) => {
        const title = item.title || 'Untitled Product';
        const description = item.description || '';
        const brand = item.brand || item.advertiserName || 'CJ Merchant';
        const catalogName = item.catalogName || '';
        const category = mapToCategory(title, description, catalogName, brand);
        const price = item.price?.amount || 0;
        const salePrice = item.salePrice?.amount && item.salePrice.amount < price ? item.salePrice.amount : null;
        let affiliateUrl = item.link || item.buyUrl || item.clickUrl || '';
        const cidToUse = companyId || '7999396';
        if (affiliateUrl && !affiliateUrl.includes('anrdoezrs.net') && !affiliateUrl.includes('tkqlhce.com') && !affiliateUrl.includes('dpbolvw.net') && !affiliateUrl.includes('jdoqocy.com')) {
          affiliateUrl = `https://www.anrdoezrs.net/links/${cidToUse}/type/dlg/sid/supernova/${affiliateUrl}`;
        } else if (!affiliateUrl) {
          const cleanMerchant = (brand || 'merchant').toLowerCase().replace(/[^a-z0-9]/g, '');
          affiliateUrl = `https://www.anrdoezrs.net/links/${cidToUse}/type/dlg/sid/supernova/https://${cleanMerchant}.com`;
        }
        const imageUrl = item.imageLink || `https://picsum.photos/seed/cj_${item.id}/600/800`;
        const tags = `cj,${category},${brand.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

        return {
          id: `cj-${item.id || Math.random().toString(36).substring(2, 9)}`,
          title,
          description,
          price,
          salePrice,
          currency,
          merchant: brand,
          category,
          affiliateUrl,
          imageUrl,
          tags,
        };
      });

      // Upsert into SQLite
      upsertProducts(db, mappedBatch);
      totalIngested += mappedBatch.length;

      console.log(`[CJ_SYNC] Inserted/updated ${mappedBatch.length} products. (Total synced: ${totalIngested.toLocaleString()})`);

      nextPageToken = result.nextPage;
      pageNumber++;

      // Rate limit throttle (polite delay between requests)
      await new Promise((resolve) => setTimeout(resolve, 300));
    } while (nextPageToken && totalIngested < maxTotal);

    // Rebuild FTS index to make new products searchable immediately
    console.log(`\n[CJ_SYNC] Updating Full-Text Search (FTS5) index...`);
    try {
      db.exec(`INSERT INTO products_fts(products_fts) VALUES('rebuild');`);
    } catch {
      // Ignore if trigger handled it
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    const dbTotal = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get().count;

    console.log(`\n=============================================================`);
    console.log(`  CJ AFFILIATE SYNC COMPLETE!`);
    console.log(`  - Synced from CJ:       ${totalIngested.toLocaleString()} products`);
    console.log(`  - Total active in DB:   ${dbTotal.toLocaleString()} products`);
    console.log(`  - Time taken:           ${elapsed}s`);
    console.log(`=============================================================\n`);
  } catch (err) {
    console.error(`\n❌ [CJ_SYNC_ERROR] ${err.message}`);
    process.exit(1);
  } finally {
    db.close();
  }
}

main();
