/**
 * PROYECTO SUPERNOVA STORE - MASTER SEO & TAXONOMY PIPELINE
 * Dominio Oficial: https://supernovastore.humancentric.online
 * * Funcionalidades:
 * 1. Purga estricta de anunciantes (AliExpress, Booking, Abracadabra)
 * 2. Normalización de taxonomía en 5 categorías maestras (sin "net" ni ruido)
 * 3. Enriquecimiento Schema.org JSON-LD (Product, Offer, BreadcrumbList)
 * 4. Blindaje de enlaces de afiliación (rel="sponsored nofollow noopener")
 * 5. Generación dinámica de robots.txt y sitemap.xml en /public
 */

const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://supernovastore.humancentric.online';
const OUTPUT_DIR = path.resolve(__dirname, '..', 'public');
const INPUT_DATA_FILE = path.resolve(__dirname, '..', 'src', 'data', 'products.json');
const OUTPUT_DATA_FILE = path.resolve(__dirname, '..', 'src', 'data', 'products.optimized.json');

// Asegurar existencia del directorio público de Next.js
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('====================================================');
console.log('🚀 INICIANDO MASTER SEO PIPELINE - SUPERNOVA STORE');
console.log(`🌐 Dominio Canónico: ${DOMAIN}`);
console.log('====================================================\n');

// 1. CARGA DEL DATASET BASE
let rawProducts = [];
try {
  const data = fs.readFileSync(INPUT_DATA_FILE, 'utf-8');
  rawProducts = JSON.parse(data);
  console.log(`📦 Catálogo base cargado: ${rawProducts.length} productos detectados en bruto.`);
} catch (error) {
  console.error(`❌ Error crítico al leer ${INPUT_DATA_FILE}:`, error.message);
  process.exit(1);
}

// 2. LISTA NEGRA DE ANUNCIANTES EXCLUIDOS
const BLOCKED_ADVERTISERS = [
  'booking',
  'booking.com',
  'aliexpress',
  'ali express',
  'abracadabra',
  'abracadabra nyc'
];

// 3. TAXONOMÍA MAESTRA Y REGLAS DE CATEGORIZACIÓN
const MASTER_CATEGORIES = {
  software: {
    name: 'Software',
    slug: 'software',
    keywords: [
      'software', 'ashampoo', 'wondershare', 'antivirus', 'utility', 
      'pdf', 'driver', 'backup', 'license', 'licencia', 'app', 
      'uninstaller', 'burning studio', 'filmora', 'pdfelement', 'recovery'
    ]
  },
  magazines: {
    name: 'Magazines',
    slug: 'magazines',
    keywords: [
      'zinio', 'magazine', 'revista', 'periodical', 'journal', 
      'news', 'press', 'subscription', 'suscripción', 'prensa'
    ]
  },
  audio: {
    name: 'Audio',
    slug: 'audio',
    keywords: [
      'audio', 'sound', 'headphone', 'auricular', 'auriculares', 
      'speaker', 'altavoz', 'mic', 'microphone', 'bluetooth', 'soundbar'
    ]
  },
  electronics: {
    name: 'Electronics',
    slug: 'electronics',
    keywords: [
      'electronics', 'rexing', 'dash cam', 'camera', 'cámara', 
      'gadget', 'sensor', 'display', 'gps', 'radar'
    ]
  },
  tech: {
    name: 'Tech',
    slug: 'tech',
    keywords: [
      'ucase', 'ceneo', 'case', 'funda', 'cable', 'charger', 
      'cargador', 'adapter', 'hardware', 'tech', 'tecnología', 'hub', 'usb'
    ]
  }
};

function assignCategory(rawCategory = '', rawName = '', advertiser = '') {
  const text = `${rawCategory} ${rawName} ${advertiser}`.toLowerCase();
  const adv = advertiser.toLowerCase();

  // Asignación prioritaria por anunciante clave
  if (adv.includes('ashampoo') || adv.includes('wondershare')) return MASTER_CATEGORIES.software;
  if (adv.includes('zinio')) return MASTER_CATEGORIES.magazines;
  if (adv.includes('rexing')) return MASTER_CATEGORIES.electronics;
  if (adv.includes('ucase') || adv.includes('ceneo')) return MASTER_CATEGORIES.tech;

  // Asignación por coincidencia de palabras clave
  for (const key of ['software', 'magazines', 'audio', 'electronics', 'tech']) {
    for (const kw of MASTER_CATEGORIES[key].keywords) {
      if (text.includes(kw)) {
        return MASTER_CATEGORIES[key];
      }
    }
  }

  // Categoría fallback por defecto
  return MASTER_CATEGORIES.tech;
}

// 4. SANITIZACIÓN DE ENLACES EXTERNOS
function sanitizeAffiliateUrl(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return `${DOMAIN}/catalogo`;
  }
  return encodeURI(url.trim());
}

// 5. PROCESAMIENTO, FILTRADO Y GENERACIÓN DE SCHEMAS
console.log('🔹 Procesando productos, sanitizando afiliados y estructurando Schemas...');

const cleanProducts = [];
let purgedAdvertisers = 0;
let discardedInvalid = 0;

for (const prod of rawProducts) {
  const adv = (prod.advertiser || prod.brand || '').toLowerCase();

  // Filtro 1: Bloqueo de anunciantes en lista negra
  if (BLOCKED_ADVERTISERS.some(blocked => adv.includes(blocked))) {
    purgedAdvertisers++;
    continue;
  }

  // Filtro 2: Validación de datos mínimos requeridos
  if (!prod.name || (!prod.price && !prod.regular_price)) {
    discardedInvalid++;
    continue;
  }

  // Asignación normalizada de categoría
  const categoryObj = assignCategory(
    prod.category || prod.tax_product_cat || '',
    prod.name,
    prod.advertiser || ''
  );

  const slug = prod.slug || prod.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const canonicalUrl = `${DOMAIN}/producto/${slug}`;
  const affiliateUrl = sanitizeAffiliateUrl(prod.affiliateUrl || prod.url || prod.product_url);
  const currentPrice = prod.salePrice || prod.sale_price || prod.price || prod.regular_price;

  // Botón seguro de compra con rel="sponsored nofollow noopener"
  const safeButtonHtml = `<a href="${affiliateUrl}" target="_blank" rel="sponsored nofollow noopener" class="btn-vip">${prod.buttonText || 'Ver Oferta VIP'}</a>`;

  // Schema.org JSON-LD (Product + Offer)
  const schemaJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': prod.name,
    'image': prod.image || prod.images || `${DOMAIN}/placeholder.jpg`,
    'description': prod.description || prod.post_content || `Adquiere ${prod.name} con descuento exclusivo en Supernova Store.`,
    'sku': prod.sku || `SPN-${prod.id || slug.slice(0, 8)}`,
    'brand': {
      '@type': 'Brand',
      'name': prod.advertiser || 'Supernova Verified Partner'
    },
    'offers': {
      '@type': 'Offer',
      'url': canonicalUrl,
      'priceCurrency': 'EUR',
      'price': currentPrice,
      'priceValidUntil': '2026-12-31',
      'itemCondition': 'https://schema.org/NewCondition',
      'availability': 'https://schema.org/InStock',
      'seller': {
        '@type': 'Organization',
        'name': prod.advertiser || 'Supernova Store'
      }
    }
  };

  // Schema.org BreadcrumbList
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Inicio', 'item': DOMAIN },
      { '@type': 'ListItem', 'position': 2, 'name': categoryObj.name, 'item': `${DOMAIN}/categoria/${categoryObj.slug}` },
      { '@type': 'ListItem', 'position': 3, 'name': prod.name, 'item': canonicalUrl }
    ]
  };

  cleanProducts.push({
    id: prod.id || slug,
    name: prod.name,
    slug,
    category: categoryObj.name,
    categorySlug: categoryObj.slug, // Clave exacta para el filtrado reactivo del menú
    price: prod.price || prod.regular_price,
    salePrice: prod.salePrice || prod.sale_price || null,
    advertiser: prod.advertiser || 'Supernova Partner',
    merchant: prod.advertiser || 'Supernova Partner',
    image: prod.image || prod.images || `${DOMAIN}/placeholder.jpg`,
    description: prod.description || prod.post_content || '',
    affiliateUrl,
    canonicalUrl,
    safeButtonHtml,
    metaTitle: `${prod.name} | Oferta Exclusiva Supernova Store`,
    metaDescription: `Adquiere ${prod.name} de ${prod.advertiser || 'tienda oficial'}. Oferta verificada con entrega rápida en Supernova Store.`,
    schemaJsonLd,
    breadcrumbJsonLd
  });
}

// Guardar archivo optimizado que consume el frontend de Next.js
fs.writeFileSync(OUTPUT_DATA_FILE, JSON.stringify(cleanProducts, null, 2));

console.log(`✅ Catálogo limpio guardado en: ${OUTPUT_DATA_FILE}`);
console.log(`   - Productos activos y verificados: ${cleanProducts.length}`);
console.log(`   - Productos bloqueados (AliExpress/Booking/Abracadabra): ${purgedAdvertisers}`);
console.log(`   - Registros descartados por falta de datos: ${discardedInvalid}\n`);

// 6. GENERACIÓN DE ARCHIVOS DE RASTREO
console.log('🔹 Generando robots.txt y sitemap.xml...');

// 6.1 robots.txt
const robotsTxt = `# Supernova Store Robots Exclusion Standard
User-agent: *
Allow: /
Disallow: /api/
Disallow: /tracking/

Sitemap: ${DOMAIN}/sitemap.xml
`;
fs.writeFileSync(path.join(OUTPUT_DIR, 'robots.txt'), robotsTxt);
console.log('✅ public/robots.txt generado.');

// 6.2 sitemap.xml
const today = new Date().toISOString().split('T')[0];
const activeCategorySlugs = [...new Set(cleanProducts.map((p) => p.categorySlug))];

let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${DOMAIN}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`;

// Categorías activas
activeCategorySlugs.forEach((catSlug) => {
  sitemapXml += `  <url>
    <loc>${DOMAIN}/categoria/${catSlug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>\n`;
});

// Fichas de producto canónicas
cleanProducts.forEach((prod) => {
  sitemapXml += `  <url>
    <loc>${prod.canonicalUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>\n`;
});

sitemapXml += `</urlset>`;
fs.writeFileSync(path.join(OUTPUT_DIR, 'sitemap.xml'), sitemapXml);

console.log(`✅ public/sitemap.xml generado con ${1 + activeCategorySlugs.length + cleanProducts.length} URLs totales.`);
console.log('\n====================================================');
console.log('🎉 MASTER SEO PIPELINE COMPLETADO CON ÉXITO');
console.log('====================================================');
