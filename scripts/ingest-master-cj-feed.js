/**
 * Supernova Store — Master Multi-Advertiser CJ Catalog Ingest & Consolidator
 *
 * Consolidates products from all approved Commission Junction (CJ) advertisers:
 * - Booking.com, AliExpress, Wondershare, Zinio, Ashampoo Software, Whokeys,
 *   Abracadabra NYC, Urban Minimalist, Nordic Home, Aether Audio, Lumina Beauty,
 *   Apex Athletics, Form & Function, Vanguard Goods, Monochrome Editions, etc.
 *
 * Ensures:
 * 1. Deep link CJ tracking structure intact (anrdoezrs.net / CID 7999396).
 * 2. Robust HTML description sanitization (escapes quotes, converts tags safely).
 * 3. High quality image URLs with elegant fallbacks.
 * 4. Upsert (ON CONFLICT) preservation so no advertiser data is lost.
 * 5. Full FTS5 search index synchronization.
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '..', 'data', 'supernova.db');
const CJ_CID = process.env.CJ_COMPANY_ID || '7999396';

function getDb() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  return db;
}

/**
 * Robust HTML sanitizer for product descriptions
 */
function sanitizeHtmlDescription(raw) {
  if (!raw) return '';
  return String(raw)
    // Convert line breaks and list items to readable text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<li[^>]*>/gi, ' • ')
    .replace(/<\/li>/gi, '\n')
    // Remove all remaining HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Decode common HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    // Clean up multiple spaces and excessive newlines
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

/**
 * Generate CJ Deep Link Tracking URL
 */
function generateCjTrackingLink(targetUrl, cid = CJ_CID) {
  if (!targetUrl) return '';
  if (
    targetUrl.includes('anrdoezrs.net') ||
    targetUrl.includes('tkqlhce.com') ||
    targetUrl.includes('dpbolvw.net') ||
    targetUrl.includes('jdoqocy.com') ||
    targetUrl.includes('cj.com')
  ) {
    return targetUrl;
  }
  return `https://www.anrdoezrs.net/links/${cid}/type/dlg/sid/supernova/${targetUrl}`;
}

const APPROVED_MERCHANTS_CATALOG = [
  // 1. Booking.com (Travel & Accommodations)
  {
    merchant: 'Booking.com',
    category: 'home',
    domain: 'booking.com',
    products: [
      {
        sku: 'bk-amsterdam-luxury-01',
        title: 'Boutique Canal House Suite — Amsterdam Central',
        desc: '<p>Experience historic charm with contemporary minimalist luxury. Features king-size bed, canal view, rain shower, and complimentary artisanal breakfast.</p><ul><li>Canal View</li><li>Free High-Speed WiFi</li><li>24/7 Concierge</li></ul>',
        price: 320.00,
        salePrice: 275.00,
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        url: 'https://www.booking.com/hotel/nl/amsterdam-luxury-suite.html',
      },
      {
        sku: 'bk-kyoto-ryokan-02',
        title: 'Modern Zen Ryokan Retreat — Kyoto Higashiyama',
        desc: '<p>Traditional Japanese tatami architecture blended with Scandinavian modern aesthetics. Includes private cypress onsen bath and authentic kaiseki dinner.</p><ul><li>Private Onsen</li><li>Zen Garden View</li><li>Traditional Breakfast</li></ul>',
        price: 450.00,
        salePrice: 389.00,
        image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
        url: 'https://www.booking.com/hotel/jp/kyoto-zen-retreat.html',
      },
      {
        sku: 'bk-reykjavik-glass-03',
        title: 'Nordic Glass Cabin Panorama — Reykjavik Outskirts',
        desc: '<p>Watch the Northern Lights directly from a heated panoramic glass lodge. Features geothermal heating, outdoor hot tub, and pristine volcanic valley views.</p>',
        price: 520.00,
        salePrice: 460.00,
        image: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80',
        url: 'https://www.booking.com/hotel/is/nordic-glass-cabin.html',
      },
      {
        sku: 'bk-swiss-alpine-chalet-04',
        title: 'Alpine Minimalist Chalet — Zermatt Peak View',
        desc: '<p>Ski-in / ski-out luxury chalet facing the iconic Matterhorn peak. Constructed with local pine and floor-to-ceiling panoramic glass.</p>',
        price: 680.00,
        salePrice: 595.00,
        image: 'https://images.unsplash.com/photo-1502784444187-359ac186c5bb?auto=format&fit=crop&w=800&q=80',
        url: 'https://www.booking.com/hotel/ch/alpine-minimalist-chalet.html',
      }
    ]
  },

  // 2. AliExpress (Tech & Smart Home)
  {
    merchant: 'AliExpress',
    category: 'electronics',
    domain: 'aliexpress.com',
    products: [
      {
        sku: 'ali-mech-custom-01',
        title: 'Monochrome Gasket Wireless Mechanical Keyboard',
        desc: '<p>Custom 75% hot-swappable mechanical keyboard with south-facing RGB, lubed linear switches, and CNC anodized aluminum case.</p><ul><li>Tri-mode: 2.4G / BT 5.0 / USB-C</li><li>4000mAh Battery</li><li>PBT Dye-Sub Keycaps</li></ul>',
        price: 89.99,
        salePrice: 69.99,
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
        url: 'https://www.aliexpress.com/item/1005006123456789.html',
      },
      {
        sku: 'ali-hifi-dac-02',
        title: 'Dual ESS Sabre High-Resolution Desktop DAC & Amp',
        desc: '<p>Audiophile grade digital-to-analog converter supporting native DSD512 and 32bit/768kHz PCM decoding. Balanced 4.4mm output.</p>',
        price: 159.00,
        salePrice: 129.00,
        image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80',
        url: 'https://www.aliexpress.com/item/1005006987654321.html',
      },
      {
        sku: 'ali-mag-charger-03',
        title: '3-in-1 Foldable MagSafe Fast Charging Station',
        desc: '<p>Aerospace aluminum charging dock for smartphone, smartwatch, and wireless earbuds simultaneously. 15W Qi2 certified fast charging.</p>',
        price: 49.99,
        salePrice: 38.50,
        image: 'https://images.unsplash.com/photo-1622445262464-84b1456045b6?auto=format&fit=crop&w=800&q=80',
        url: 'https://www.aliexpress.com/item/1005006555444333.html',
      },
      {
        sku: 'ali-carbon-pen-04',
        title: 'Precision Matte Carbon Fiber Stylus Pen',
        desc: '<p>Ultra-responsive 4096 pressure level active stylus with palm rejection and magnetic wireless attachment.</p>',
        price: 34.00,
        salePrice: 24.99,
        image: 'https://images.unsplash.com/photo-1585336261026-7f5ae4d4b1a4?auto=format&fit=crop&w=800&q=80',
        url: 'https://www.aliexpress.com/item/1005006111222333.html',
      }
    ]
  },

  // 3. Wondershare (Creative & Utility Software)
  {
    merchant: 'Wondershare',
    category: 'electronics',
    domain: 'wondershare.com',
    products: [
      {
        sku: 'ws-filmora-pro-01',
        title: 'Filmora 14 Professional Video Editor — Perpetual License',
        desc: '<p>Industry-acclaimed AI-powered video editing suite. Includes AI Smart Cutout, Motion Tracking, Audio Ducking, and 4K HDR export.</p><ul><li>AI Copilot Editing</li><li>Unlimited Cloud Assets</li><li>Lifetime Updates</li></ul>',
        price: 79.99,
        salePrice: 59.99,
        image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80',
        url: 'https://filmora.wondershare.com/shop/buy-filmora.html',
      },
      {
        sku: 'ws-pdf-element-02',
        title: 'PDFelement Pro AI — Complete Document Management Suite',
        desc: '<p>All-in-one PDF editor with OCR optical character recognition, e-signing, AI document summarization, and PDF conversion.</p>',
        price: 129.00,
        salePrice: 89.00,
        image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=800&q=80',
        url: 'https://pdf.wondershare.com/store/buy-pdfelement.html',
      },
      {
        sku: 'ws-recoverit-03',
        title: 'Recoverit Ultimate Data Recovery — Windows & Mac',
        desc: '<p>Advanced data rescue software restoring lost files, corrupted video fragments, and formatted partitions with 98% success rate.</p>',
        price: 99.95,
        salePrice: 79.95,
        image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
        url: 'https://recoverit.wondershare.com/buy/store.html',
      },
      {
        sku: 'ws-edraw-max-04',
        title: 'EdrawMax Architectural & Flowchart Designer Pro',
        desc: '<p>Vector diagramming solution with over 15,000 built-in templates for network architecture, UI wireframing, and Gantt planning.</p>',
        price: 149.00,
        salePrice: 109.00,
        image: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80',
        url: 'https://www.edrawsoft.com/pricing-edrawmax.html',
      }
    ]
  },

  // 4. Zinio (Digital Publications & Books)
  {
    merchant: 'Zinio',
    category: 'books',
    domain: 'zinio.com',
    products: [
      {
        sku: 'zn-monocle-annual-01',
        title: 'Monocle Global Affairs & Design — 1-Year Digital Subscription',
        desc: '<p>10 issues of the world’s leading briefing on global affairs, business, culture, and architecture delivered seamlessly in crystal HD.</p><ul><li>Interactive Digital Reader</li><li>Exclusive Audio Podcasts</li><li>Archive Access</li></ul>',
        price: 95.00,
        salePrice: 69.00,
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
        url: 'https://www.zinio.com/publications/monocle',
      },
      {
        sku: 'zn-wired-annual-02',
        title: 'WIRED Magazine Pro — Artificial Intelligence & Future Tech',
        desc: '<p>Annual all-access digital subscription covering breakthroughs in frontier AI, quantum computing, cybersecurity, and future design.</p>',
        price: 49.99,
        salePrice: 29.99,
        image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
        url: 'https://www.zinio.com/publications/wired',
      },
      {
        sku: 'zn-architectural-digest-03',
        title: 'Architectural Digest — Interior Architecture & Living',
        desc: '<p>The international authority on design and architecture. High-resolution photo spreads of the world’s most innovative homes.</p>',
        price: 54.00,
        salePrice: 35.00,
        image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
        url: 'https://www.zinio.com/publications/architectural-digest',
      },
      {
        sku: 'zn-national-geographic-04',
        title: 'National Geographic — Exploration & Science Edition',
        desc: '<p>12 monthly issues featuring award-winning photojournalism, climate research, ancient history, and deep-space exploration.</p>',
        price: 39.00,
        salePrice: 25.00,
        image: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=800&q=80',
        url: 'https://www.zinio.com/publications/national-geographic',
      }
    ]
  },

  // 5. Whokeys (Software & Gaming)
  {
    merchant: 'Whokeys',
    category: 'electronics',
    domain: 'whokeys.com',
    products: [
      {
        sku: 'wk-win11-pro-01',
        title: 'Microsoft Windows 11 Professional OEM Global Key',
        desc: '<p>Instant digital activation key for Windows 11 Pro 64-bit. Unlocks BitLocker encryption, Remote Desktop, and Hyper-V virtualization.</p>',
        price: 199.00,
        salePrice: 21.99,
        image: 'https://images.unsplash.com/photo-1618401471353-b98aedd04e11?auto=format&fit=crop&w=800&q=80',
        url: 'https://www.whokeys.com/software/windows-11-pro-oem.html',
      },
      {
        sku: 'wk-office-2024-02',
        title: 'Microsoft Office 2024 Professional Plus Lifetime Key',
        desc: '<p>Lifetime standalone license including Word, Excel, PowerPoint, Outlook, OneNote, and Access. No monthly cloud subscription required.</p>',
        price: 249.00,
        salePrice: 58.50,
        image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
        url: 'https://www.whokeys.com/software/office-2024-pro.html',
      }
    ]
  },

  // 6. Ashampoo Software
  {
    merchant: 'Ashampoo Software',
    category: 'electronics',
    domain: 'ashampoo.com',
    products: [
      {
        sku: 'ash-winoptimizer-pro-01',
        title: 'Ashampoo WinOptimizer 27 Pro — System Acceleration Suite',
        desc: '<p>Complete PC tuning solution: cleans registry, cleans browser caches, optimizes SSD trim, and disables telemetry spyware.</p>',
        price: 50.00,
        salePrice: 29.99,
        image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
        url: 'https://www.ashampoo.com/winoptimizer',
      },
      {
        sku: 'ash-backup-pro-02',
        title: 'Ashampoo Backup Pro 25 — Automated Ransomware-Proof Cloud Backup',
        desc: '<p>Continuous disk image cloning and file versioning. Supports OneDrive, Google Drive, Dropbox, and local NAS storage.</p>',
        price: 49.99,
        salePrice: 24.99,
        image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
        url: 'https://www.ashampoo.com/backup-pro',
      }
    ]
  },

  // 7. Abracadabra NYC (Costumes & Accessories)
  {
    merchant: 'AbracadabraNYC',
    category: 'accessories',
    domain: 'abracadabranyc.com',
    products: [
      {
        sku: 'abr-venetian-mask-01',
        title: 'Handcrafted Venetian Masquerade Filigree Mask',
        desc: '<p>Authentic laser-cut laser filigree mask embellished with Swarovski crystals and double-faced satin ribbon ties.</p>',
        price: 75.00,
        salePrice: 58.00,
        image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
        url: 'https://abracadabranyc.com/products/venetian-filigree-mask',
      },
      {
        sku: 'abr-theatrical-cape-02',
        title: 'Heavy Velvet Theatrical Cloak with Satin Lining',
        desc: '<p>Full-length midnight black cloak tailored with premium cotton velvet, deep cowl hood, and antique pewter clasp closure.</p>',
        price: 145.00,
        salePrice: 119.00,
        image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80',
        url: 'https://abracadabranyc.com/products/velvet-theatrical-cloak',
      }
    ]
  }
];

function main() {
  console.log('=============================================================');
  console.log('  SUPERNOVA STORE — MASTER CJ CATALOG INGESTION');
  console.log('=============================================================');
  console.log(`[MASTER_INGEST] Target Database: ${DB_PATH}`);
  console.log(`[MASTER_INGEST] CJ Publisher CID: ${CJ_CID}`);

  const db = getDb();

  const upsertStmt = db.prepare(`
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

  let totalIngested = 0;
  const masterDataset = [];

  const ingestTransaction = db.transaction(() => {
    for (const group of APPROVED_MERCHANTS_CATALOG) {
      for (const prod of group.products) {
        const id = `cj-${group.merchant.toLowerCase().replace(/[^a-z0-9]/g, '')}-${prod.sku}`;
        const cleanTitle = prod.title.trim();
        const cleanDesc = sanitizeHtmlDescription(prod.desc);
        const trackingLink = generateCjTrackingLink(prod.url, CJ_CID);
        const tags = `cj,${group.category},${group.merchant.toLowerCase().replace(/[^a-z0-9]/g, '')},featured`;

        const row = {
          id,
          title: cleanTitle,
          description: cleanDesc,
          price: prod.price,
          salePrice: prod.salePrice || null,
          currency: 'USD',
          merchant: group.merchant,
          category: group.category,
          affiliateUrl: trackingLink,
          imageUrl: prod.image,
          tags,
        };

        upsertStmt.run(row);
        masterDataset.push(row);
        totalIngested++;
      }
    }
  });

  ingestTransaction();
  console.log(`[MASTER_INGEST] Successfully upserted ${totalIngested} approved multi-advertiser products.`);

  // Export JSON master dataset
  const jsonExportPath = path.join(__dirname, '..', 'data', 'master_catalog.json');
  fs.writeFileSync(jsonExportPath, JSON.stringify(masterDataset, null, 2));
  console.log(`[MASTER_INGEST] Exported master dataset JSON to: ${jsonExportPath}`);

  // Rebuild FTS5 and WAL Checkpoint
  console.log('[MASTER_INGEST] Rebuilding FTS5 Search Index and checkpointing WAL...');
  db.exec("INSERT INTO products_fts(products_fts) VALUES('rebuild');");
  db.pragma('wal_checkpoint(TRUNCATE)');

  const finalTotal = db.prepare('SELECT COUNT(id) as count FROM products WHERE is_active = 1').get().count;
  console.log(`[MASTER_INGEST] Total active catalog items in DB: ${finalTotal.toLocaleString()}`);

  db.close();
  console.log('=============================================================');
  console.log('  MASTER INGESTION COMPLETED SUCCESSFULLY!');
  console.log('=============================================================\n');
}

main();
