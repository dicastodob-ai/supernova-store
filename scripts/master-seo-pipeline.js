/**
 * PROYECTO SUPERNOVA STORE - MASTER SEO & TAXONOMY PIPELINE
 * Dominio: https://supernovastore.humancentric.online
 * Zinio PURGADO por enlaces rotos 404 en origen.
 */

const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://supernovastore.humancentric.online';
const OUTPUT_DIR = path.resolve(__dirname, '..', 'public');
const INPUT_DATA_FILE = path.resolve(__dirname, '..', 'src', 'data', 'products.json');
const OUTPUT_DATA_FILE = path.resolve(__dirname, '..', 'src', 'data', 'products.optimized.json');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('====================================================');
console.log('🚀 SUPERNOVA STORE: PURGA DE ZINIO Y ACTUALIZACIÓN');
console.log('====================================================\n');

let rawProducts = [];
try {
  const data = fs.readFileSync(INPUT_DATA_FILE, 'utf-8');
  rawProducts = JSON.parse(data);
} catch (error) {
  console.error(`❌ Error al leer ${INPUT_DATA_FILE}:`, error.message);
  process.exit(1);
}

// 1. LISTA NEGRA: Incluimos Zinio junto a AliExpress, Booking y Abracadabra
const BLOCKED_ADVERTISERS = [
  'booking',
  'booking.com',
  'aliexpress',
  'ali express',
  'abracadabra',
  'abracadabra nyc',
  'zinio',
  'zinio.com'
];

// 2. TAXONOMÍA MAESTRA
const MASTER_CATEGORIES = {
  software: {
    name: 'Software',
    slug: 'software',
    keywords: ['software', 'ashampoo', 'wondershare', 'antivirus', 'utility', 'pdf', 'driver', 'backup', 'licencia', 'filmora']
  },
  magazines: {
    name: 'Magazines',
    slug: 'magazines',
    keywords: ['ceneo', 'magazine', 'revista', 'periodical', 'prensa', 'subscription', 'suscripción', 'press']
  },
  audio: {
    name: 'Audio',
    slug: 'audio',
    keywords: ['audio', 'sound', 'headphone', 'auricular', 'auriculares', 'speaker', 'altavoz', 'mic', 'bluetooth']
  },
  electronics: {
    name: 'Electronics',
    slug: 'electronics',
    keywords: ['electronics', 'rexing', 'dash cam', 'camera', 'cámara', 'gadget', 'sensor', 'gps']
  },
  tech: {
    name: 'Tech',
    slug: 'tech',
    keywords: ['ucase', 'case', 'funda', 'cable', 'charger', 'cargador', 'adapter', 'tech', 'tecnología', 'usb']
  }
};

function assignCategory(rawCat = '', rawName = '', advertiser = '') {
  const text = `${rawCat} ${rawName} ${advertiser}`.toLowerCase();
  const adv = advertiser.toLowerCase();

  if (adv.includes('ashampoo') || adv.includes('wondershare')) return MASTER_CATEGORIES.software;
  if (adv.includes('ceneo')) return MASTER_CATEGORIES.magazines; // Ceneo cubre Magazines
  if (adv.includes('rexing')) return MASTER_CATEGORIES.electronics;
  if (adv.includes('ucase')) return MASTER_CATEGORIES.tech;

  for (const key of ['software', 'magazines', 'audio', 'electronics', 'tech']) {
    for (const kw of MASTER_CATEGORIES[key].keywords) {
      if (text.includes(kw)) return MASTER_CATEGORIES[key];
    }
  }
  return MASTER_CATEGORIES.tech;
}

function sanitizeUrl(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return `${DOMAIN}/catalogo`;
  }
  return encodeURI(url.trim());
}

const cleanProducts = [];
let purgedCount = 0;

for (const prod of rawProducts) {
  const adv = (prod.advertiser || prod.brand || prod.merchant || '').toLowerCase();
  const title = (prod.name || prod.title || '').toLowerCase();

  // Purga estricta de anunciantes vetados (incluyendo Zinio)
  if (BLOCKED_ADVERTISERS.some(blocked => adv.includes(blocked) || title.includes(blocked))) {
    purgedCount++;
    continue;
  }

  if (!prod.name || (!prod.price && !prod.regular_price)) continue;

  const categoryObj = assignCategory(prod.category || prod.tax_product_cat || '', prod.name, prod.advertiser || prod.merchant || '');
  const slug = prod.slug || prod.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const canonicalUrl = `${DOMAIN}/producto/${slug}`;
  const affiliateUrl = sanitizeUrl(prod.affiliateUrl || prod.url || prod.product_url);
  const currentPrice = prod.salePrice || prod.sale_price || prod.price || prod.regular_price;

  cleanProducts.push({
    id: prod.id || slug,
    name: prod.name,
    slug,
    category: categoryObj.name,
    categorySlug: categoryObj.slug,
    price: prod.price || prod.regular_price,
    salePrice: prod.salePrice || prod.sale_price || null,
    advertiser: prod.advertiser || prod.merchant || 'Supernova Partner',
    merchant: prod.advertiser || prod.merchant || 'Supernova Partner',
    image: prod.image || prod.images || `${DOMAIN}/placeholder.jpg`,
    description: prod.description || '',
    affiliateUrl,
    canonicalUrl,
    safeButtonHtml: `<a href="${affiliateUrl}" target="_blank" rel="sponsored nofollow noopener" class="btn-vip">${prod.buttonText || 'Ver Oferta VIP'}</a>`,
    metaTitle: `${prod.name} | Supernova Store`
  });
}

fs.writeFileSync(OUTPUT_DATA_FILE, JSON.stringify(cleanProducts, null, 2));

// robots.txt
const robotsTxt = `# Supernova Store Robots
User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${DOMAIN}/sitemap.xml
`;
fs.writeFileSync(path.join(OUTPUT_DIR, 'robots.txt'), robotsTxt);

// Sitemap dinámico solo con categorías que realmente tienen productos activos
const activeCategorySlugs = [...new Set(cleanProducts.map(p => p.categorySlug))];
const today = new Date().toISOString().split('T')[0];

let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
sitemapXml += `  <url><loc>${DOMAIN}/</loc><lastmod>${today}</lastmod><priority>1.0</priority></url>\n`;

activeCategorySlugs.forEach(cat => {
  sitemapXml += `  <url><loc>${DOMAIN}/categoria/${cat}</loc><lastmod>${today}</lastmod><priority>0.8</priority></url>\n`;
});

cleanProducts.forEach(prod => {
  sitemapXml += `  <url><loc>${prod.canonicalUrl}</loc><lastmod>${today}</lastmod><priority>0.6</priority></url>\n`;
});

sitemapXml += `</urlset>`;
fs.writeFileSync(path.join(OUTPUT_DIR, 'sitemap.xml'), sitemapXml);

console.log(`✅ Zinio eliminado con éxito.`);
console.log(`✅ Catálogo activo resultante: ${cleanProducts.length} productos 100% operativos.`);
console.log(`✅ Total de productos bloqueados: ${purgedCount}`);
