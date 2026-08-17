/**
 * PROYECTO SUPERNOVA STORE - MASTER SEO & TAXONOMY PIPELINE
 * Dominio: https://supernovastore.humancentric.online
 * * Funcionalidades:
 * - Purga de anunciantes bloqueados (AliExpress, Booking, Abracadabra)
 * - Normalización de categorías y eliminación de ruido ("net", etc.)
 * - Generación de Schemas JSON-LD y botones con rel="sponsored nofollow"
 * - Creación dinámica de robots.txt y sitemap.xml
 */

const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://supernovastore.humancentric.online';
const OUTPUT_DIR = path.resolve(__dirname, '..', 'public');
const INPUT_DATA_FILE = path.resolve(__dirname, '..', 'src', 'data', 'products.json');
const OUTPUT_DATA_FILE = path.resolve(__dirname, '..', 'src', 'data', 'products.optimized.json');

// Asegurar existencia de directorio de salida
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('====================================================');
console.log('🚀 INICIANDO PIPELINE MAESTRO DE SUPERNOVA STORE');
console.log('====================================================\n');

// 1. CARGA DEL DATASET BASE
let rawProducts = [];
try {
  const data = fs.readFileSync(INPUT_DATA_FILE, 'utf-8');
  rawProducts = JSON.parse(data);
  console.log(`📦 Catálogo cargado: ${rawProducts.length} productos detectados en bruto.`);
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

  // Asignación directa por anunciante principal
  if (adv.includes('ashampoo') || adv.includes('wondershare')) return MASTER_CATEGORIES.software;
  if (adv.includes('zinio')) return MASTER_CATEGORIES.magazines;
  if (adv.includes('rexing')) return MASTER_CATEGORIES.electronics;
  if (adv.includes('ucase') || adv.includes('ceneo')) return MASTER_CATEGORIES.tech;

  // Asignación por palabras clave
  for (const key of ['software', 'magazines', 'audio', 'electronics', 'tech']) {
    for (const kw of MASTER_CATEGORIES[key].keywords) {
      if (text.includes(kw)) {
        return MASTER_CATEGORIES[key];
      }
    }
  }

  // Fallback por defecto si no coincide
  return MASTER_CATEGORIES.tech;
}

// 4. SANITIZACIÓN DE ENLACES
function sanitizeAffiliateUrl(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return `${DOMAIN}/catalogo`;
  }
  return encodeURI(url.trim());
}

// 5. PROCESAMIENTO Y FILTRADO
console.log('🔹 Purgando anunciantes, normalizando categorías y generando Schemas...');

const cleanProducts = [];
let purgedAdvertisers = 0;
let discardedInvalid = 0;

for (const prod of rawProducts) {
  const adv = (prod.advertiser || prod.brand || '').toLowerCase();

  // Filtro 1: Bloqueo de lista negra
  if (BLOCKED_ADVERTISERS.some(blocked => adv.includes(blocked))) {
    purgedAdvertisers++;
    continue;
  }

  // Filtro 2: Validación de datos mínimos
  if (!prod.name || (!prod.price && !prod.regular_price)) {
    discardedInvalid++;
    continue;
  }

  // Categorización limpia
  const categoryObj = assignCategory(
    prod.category || prod.tax_product_cat || '',
    prod.name,
    prod.advertiser || ''
  );

  const slug = prod.slug || prod.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const canonicalUrl = `${DOMAIN}/producto/${slug}`;
  const affiliateUrl = sanitizeAffiliateUrl(prod.affiliateUrl || prod.url || prod.product_url);
  const currentPrice = prod.salePrice || prod.sale_price || prod.price || prod.regular_price;

  // Botón con atributos nofollow + sponsored obligatorios por Google
  const safeButtonHtml = `<a href="${affiliateUrl}" target="_blank" rel="sponsored nofollow noopener" class="btn-vip">${prod.buttonText || 'Ver Oferta VIP'}</a>`;

  // Schema.org JSON-LD para Google Rich Snippets
  const schemaJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': prod.name,
    'image': prod.image || prod.images || `${DOMAIN}/placeholder.jpg`,
    'description': prod.description || prod.post_content || `Compra ${prod.name} con descuento exclusivo en Supernova Store.`,
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
    categorySlug: categoryObj.slug, // Clave exacta para el filtro del frontend
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

// Guardar archivo optimizado que consume la web
fs.writeFileSync(OUTPUT_DATA_FILE, JSON.stringify(cleanProducts, null, 2));

console.log(`✅ Catálogo limpio generado en ${OUTPUT_DATA_FILE}`);
console.log(`   - Productos activos y verificados: ${cleanProducts.length}`);
console.log(`   - Productos bloqueados (AliExpress/Booking/Abracadabra): ${purgedAdvertisers}`);
console.log(`   - Registros descartados por falta de datos: ${discardedInvalid}\n`);

// 6. GENERACIÓN DE ARCHIVOS DE RASTREO (SEO FASE 2)
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

activeCategorySlugs.forEach((catSlug) => {
  sitemapXml += `  <url>
    <loc>${DOMAIN}/categoria/${catSlug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>\n`;
});

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
console.log('🎉 PIPELINE COMPLETADO: LISTO PARA EL DESPLIEGUE');
console.log('====================================================');
