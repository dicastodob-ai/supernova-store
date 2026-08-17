/**
 * PROYECTO SUPERNOVA STORE - MASTER SEO & TAXONOMY PIPELINE
 * Dominio Oficial: https://supernovastore.humancentric.online
 * * Acciones automáticas que realiza este script:
 * 1. Purga anunciantes rotos o vetados (Booking, AliExpress, Abracadabra).
 * 2. Clasifica el catálogo en las 5 categorías oficiales.
 * 3. Inyecta Schema.org JSON-LD para posicionar en Google.
 * 4. Protege enlaces de afiliación (rel="sponsored nofollow noopener").
 * 5. Genera automáticamente public/robots.txt y public/sitemap.xml.
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
console.log('🚀 PROYECTO SUPERNOVA STORE: EJECUTANDO PIPELINE');
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
  'abracadabra nyc'
];

// 3. TAXONOMÍA: 5 CATEGORÍAS MAESTRAS
const MASTER_CATEGORIES = {
  software: {
    name: 'Software',
    slug: 'software',
    keywords: ['software', 'ashampoo', 'wondershare', 'antivirus', 'utility', 'pdf', 'driver', 'backup', 'licencia', 'filmora', 'burning']
  },
  magazines: {
    name: 'Magazines',
    slug: 'magazines',
    keywords: ['zinio', 'magazine', 'revista', 'periodical', 'prensa', 'subscription', 'suscripción']
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
    keywords: ['ucase', 'ceneo', 'case', 'funda', 'cable', 'charger', 'cargador', 'adapter', 'tech', 'tecnología', 'usb']
  }
};

function assignCategory(rawCat = '', rawName = '', advertiser = '') {
  const text = `${rawCat} ${rawName} ${advertiser}`.toLowerCase();
  const adv = advertiser.toLowerCase();

  if (adv.includes('ashampoo') || adv.includes('wondershare')) return MASTER_CATEGORIES.software;
  if (adv.includes('zinio')) return MASTER_CATEGORIES.magazines;
  if (adv.includes('rexing')) return MASTER_CATEGORIES.electronics;
  if (adv.includes('ucase') || adv.includes('ceneo')) return MASTER_CATEGORIES.tech;

  for (const key of ['software', 'magazines', 'audio', 'electronics', 'tech']) {
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
console.log('🔹 Limpiando catálogo, asegurando enlaces y generando Schemas...');

const cleanProducts = [];
let purgedCount = 0;
let invalidCount = 0;

for (const prod of rawProducts) {
  const adv = (prod.advertiser || prod.brand || '').toLowerCase();

  // Filtrar lista negra
  if (BLOCKED_ADVERTISERS.some(blocked => adv.includes(blocked))) {
    purgedCount++;
    continue;
  }

  // Filtrar productos sin datos básicos
  if (!prod.name || (!prod.price && !prod.regular_price)) {
    invalidCount++;
    continue;
  }

  const categoryObj = assignCategory(prod.category || prod.tax_product_cat || '', prod.name, prod.advertiser || '');
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
    'brand': { '@type': 'Brand', 'name': prod.advertiser || 'Supernova Verified Partner' },
    'offers': {
      '@type': 'Offer',
      'url': canonicalUrl,
      'priceCurrency': 'EUR',
      'price': currentPrice,
      'priceValidUntil': '2026-12-31',
      'itemCondition': 'https://schema.org/NewCondition',
      'availability': 'https://schema.org/InStock',
      'seller': { '@type': 'Organization', 'name': prod.advertiser || 'Supernova Store' }
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
    advertiser: prod.advertiser || 'Supernova Partner',
    merchant: prod.advertiser || 'Supernova Partner',
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
console.log('\n====================================================');
console.log('🎉 PIPELINE COMPLETADO EXITOSAMENTE');
console.log('====================================================');
