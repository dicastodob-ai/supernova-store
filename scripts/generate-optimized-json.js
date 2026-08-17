const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.join(PROJECT_ROOT, 'data', 'supernova.db');
const OUTPUT_PATH = path.join(PROJECT_ROOT, 'src', 'data', 'products.optimized.json');

function mapCategorySlug(category = '', merchant = '', tags = '', title = '') {
  const c = category.toLowerCase();
  const m = merchant.toLowerCase();
  const t = tags.toLowerCase();
  const ti = title.toLowerCase();

  if (m.includes('zinio') || c.includes('media') || c.includes('book') || t.includes('magazine') || ti.includes('magazine')) {
    return { category: 'Revistas & Prensa', categorySlug: 'magazines' };
  }
  if (m.includes('wondershare') || m.includes('ashampoo') || m.includes('whokeys') || c.includes('software') || t.includes('software') || ti.includes('software')) {
    return { category: 'Software & Herramientas', categorySlug: 'software' };
  }
  if (t.includes('audio') || t.includes('sound') || t.includes('headphone') || t.includes('speaker') || ti.includes('audio') || ti.includes('headphone') || ti.includes('speaker') || ti.includes('earbuds')) {
    return { category: 'Audio & Sonido', categorySlug: 'audio' };
  }
  if (c.includes('electronics') || t.includes('gadget') || ti.includes('gadget') || ti.includes('smart') || ti.includes('watch') || ti.includes('drone')) {
    return { category: 'Electrónica & Gadgets', categorySlug: 'electronics' };
  }
  return { category: 'Tecnología & Accesorios', categorySlug: 'tech' };
}

function generateOptimizedJson() {
  const db = new Database(DB_PATH, { readonly: true });
  const rows = db.prepare('SELECT * FROM products WHERE is_active = 1 LIMIT 500').all();
  db.close();

  const optimized = rows.map((r) => {
    const { category, categorySlug } = mapCategorySlug(r.category, r.merchant || '', r.tags || '', r.title || '');
    const price = r.sale_price !== null && r.sale_price !== undefined ? r.sale_price : r.price;
    const url = r.affiliate_url;

    return {
      id: r.id,
      name: r.title,
      description: r.description || '',
      price: price,
      originalPrice: r.price,
      merchant: r.merchant || 'Supernova Partner',
      category: category,
      categorySlug: categorySlug,
      image: r.image_url,
      affiliateUrl: url,
      safeButtonHtml: `<a href="${url}" target="_blank" rel="noopener noreferrer sponsored" class="inline-flex items-center justify-center w-full px-4 py-2 text-xs font-bold text-white bg-[#D96B27] hover:bg-[#c25a1b] rounded-lg transition-colors">Comprar Ahora</a>`
    };
  });

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(optimized, null, 2), 'utf8');
  console.log(`✅ Creado ${OUTPUT_PATH} con ${optimized.length} productos.`);
}

generateOptimizedJson();
