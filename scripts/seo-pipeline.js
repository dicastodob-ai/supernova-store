/**
 * PROYECTO SUPERNOVA STORE - MASTER SEO & TAXONOMY PIPELINE
 * Dominio Oficial: https://supernovastore.humancentric.online
 * * Categorías Oficiales Activas:
 * 1. Software (slug: 'software')
 * 2. Electrónica (slug: 'electronics')
 * 3. Tech & Gadgets (slug: 'tech') - Incluye Ceneo, fundas, cables, gadgets
 * * Anunciantes Purgados: Booking, AliExpress, Abracadabra, Zinio
 */

const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://supernovastore.humancentric.online';
const OUTPUT_DIR = path.resolve(__dirname, '..', 'public');
const INPUT_DATA_FILE = path.resolve(__dirname, '..', 'src', 'data', 'products.json');
const OUTPUT_DATA_FILE = path.resolve(__dirname, '..', 'src', 'data', 'products.optimized.json');

// Crear carpeta public si no existiera
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('====================================================');
console.log('🚀 PROYECTO SUPERNOVA STORE: PIPELINE TAXONOMÍA SEO');
console.log(`🌐 Dominio Oficial Canónico: ${DOMAIN}`);
console.log('====================================================\n');

// 1. CARGA DEL CATÁLOGO
let rawProducts = [];
try {
  const data = fs.readFileSync(INPUT_DATA_FILE, 'utf-8');
  rawProducts = JSON.parse(data);
  console.log(`📦 Catálogo cargado: ${rawProducts.length} productos detectados.`);
} catch (error) {
  console.error(`❌ Error al leer ${INPUT_DATA_FILE}:`, error.message);
  process.exit(1);
}

// 2. LISTA NEGRA DE ANUNCIANTES (PURGA AUTOMÁTICA)
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

// 3. TAXONOMÍA MAESTRA (3 CATEGORÍAS ACTIVAS)
const MASTER_CATEGORIES = {
  software: {
    name: 'Software',
    slug: 'software',
    keywords: ['software', 'ashampoo', 'wondershare', 'antivirus', 'utility', 'pdf', 'driver', 'backup', 'licencia', 'filmora', 'burning']
  },
  electronics: {
    name: 'Electrónica',
    slug: 'electronics',
    keywords: ['electronics', 'rexing', 'dash cam', 'camera', 'cámara', 'gadget', 'sensor', 'gps', 'display', 'radar']
  },
  tech: {
    name: 'Tech & Gadgets',
    slug: 'tech',
    keywords: ['ceneo', 'ucase', 'case', 'funda', 'cable', 'charger', 'cargador', 'adapter', 'tech', 'tecnología', 'usb', 'audio', 'sound', 'headphone', 'auricular', 'speaker', 'altavoz', 'hub']
  }
};

function assignCategory(rawCat = '', rawName = '', advertiser = '') {
  const text = `${rawCat} ${rawName} ${advertiser}`.toLowerCase();
  const adv = advertiser.toLowerCase();

  // Asignación directa por anunciante
  if (adv.includes('ashampoo') || adv.includes('wondershare')) return MASTER_CATEGORIES.software;
  if (adv.includes('rexing')) return MASTER_CATEGORIES.electronics;
  if (adv.includes('ceneo') || adv.includes('ucase')) return MASTER_CATEGORIES.tech;

  // Asignación por palabras clave
  for (const key of ['software', 'electronics', 'tech']) {
    for (const kw of MASTER_CATEGORIES[key].keywords) {
      if (text.includes(kw)) return MASTER_CATEGORIES[key];
    }
  }

  return MASTER_CATEGORIES.tech; // Fallback seguro
}

function sanitizeUrl(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return `${DOMAIN}/catalogo`;
  }
  return encodeURI(url.trim());
}

// 4. PROCESAMIENTO Y LIMPIEZA
console.log('🔹 Limpiando catálogo y clasificando en 3 categorías maestras...');

const cleanProducts = [];
let purgedCount = 0;
let invalidCount = 0;

for (const prod of rawProducts) {
  const adv = (prod.advertiser || prod.brand || prod.merchant || '').toLowerCase();
  const title = (prod.name || prod.title || '').toLowerCase();

  // Filtrar lista negra
  if (BLOCKED_ADVERTISERS.some(blocked => adv.includes(blocked) || title.includes(blocked))) {
    purgedCount++;
    continue;
  }

  // Filtrar productos sin datos básicos
  if (!prod.name || (!prod.price && !prod.regular_price)) {
    invalidCount++;
    continue;
  }

  const categoryObj = assignCategory(prod.category || prod.tax_product_cat || '', prod.name, prod.advertiser || prod.merchant || '');
  const slug = prod.slug || prod.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const canonicalUrl = `${DOMAIN}/producto/${slug}`;
  const affiliateUrl = sanitizeUrl(prod.affiliateUrl || prod.url || prod.product_url);
  const currentPrice = prod.salePrice || prod.sale_price || prod.price || prod.regular_price;

  // Botón seguro de afiliación
  const safeButtonHtml = `<a href="${affiliateUrl}" target="_blank" rel="sponsored nofollow noopener" class="btn-vip">${prod.buttonText || 'Ver Oferta VIP'}</a>`;

  // Schema.org JSON-LD
  const schemaJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': prod.name,
    'image': prod.image || prod.images || `${DOMAIN}/placeholder.jpg`,
    'description': prod.description || `Oferta verificada de ${prod.name} en Supernova Store.`,
    'sku': prod.sku || `SPN-${prod.id || slug.slice(0, 8)}`,
    'brand': { '@type': 'Brand', 'name': prod.advertiser || prod.merchant || 'Supernova Verified Partner' },
    'offers': {
      '@type': 'Offer',
      'url': canonicalUrl,
      'priceCurrency': 'EUR',
      'price': currentPrice,
      'priceValidUntil': '2026-12-31',
      'itemCondition': 'https://schema.org/NewCondition',
      'availability': 'https://schema.org/InStock',
      'seller': { '@type': 'Organization', 'name': prod.advertiser || prod.merchant || 'Supernova Store' }
    }
  };

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
    safeButtonHtml,
    metaTitle: `${prod.name} | Supernova Store`,
    schemaJsonLd
  });
}

// Guardar archivo limpio
fs.writeFileSync(OUTPUT_DATA_FILE, JSON.stringify(cleanProducts, null, 2));
console.log(`✅ Catálogo limpio guardado: ${cleanProducts.length} productos activos.`);
console.log(`   (Eliminados: ${purgedCount} de lista negra | ${invalidCount} sin precio/datos)\n`);

// 5. GENERAR ROBOTS.TXT Y SITEMAP.XML
console.log('🔹 Generando archivos de rastreo para Google Search Console...');

// robots.txt
const robotsTxt = `# Supernova Store Robots
User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${DOMAIN}/sitemap.xml
`;
fs.writeFileSync(path.join(OUTPUT_DIR, 'robots.txt'), robotsTxt);

// sitemap.xml
const today = new Date().toISOString().split('T')[0];
const activeCategorySlugs = [...new Set(cleanProducts.map(p => p.categorySlug))];

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

console.log(`✅ robots.txt y sitemap.xml creados con ${1 + activeCategorySlugs.length + cleanProducts.length} URLs.`);
console.log(`✅ Categorías activas en Sitemap: ${activeCategorySlugs.join(', ')}`);
console.log('\n====================================================');
console.log('🎉 PIPELINE COMPLETADO EXITOSAMENTE');
console.log('====================================================');
