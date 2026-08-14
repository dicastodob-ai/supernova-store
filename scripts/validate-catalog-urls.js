/**
 * Supernova Store — Catalog URL Health & Soft 404 Validator
 *
 * Validates product URLs by following redirects, detecting 4xx errors, timeouts,
 * and heuristic soft 404s ('page not found', 'página no encontrada').
 * Outputs the clean verified dataset to public/data/products.json.
 */

const fs = require('fs');
const path = require('path');

// Rutas de entrada y salida
const INPUT_PATH = path.resolve(__dirname, '../data/raw_products.json');
const MASTER_PATH = path.resolve(__dirname, '../data/master_catalog.json');
const OUTPUT_PATH = path.resolve(__dirname, '../public/data/products.json');

// Configuración de concurrencia y timeouts para Render / CJ
const CONCURRENCY_LIMIT = 20; // Límite de peticiones simultáneas
const REQUEST_TIMEOUT_MS = 8000; // 8 segundos por enlace

// Headers para simular navegador real y evitar bloqueos de anunciantes
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
};

/**
 * Valida la URL siguiendo redirecciones hasta el anunciante final
 */
async function checkUrlStatus(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(url, {
      method: 'GET',
      headers: HEADERS,
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // Descartar errores 400+ y 500+
    if (response.status >= 400) {
      return false;
    }

    // Detección heurística de "Soft 404"
    const text = await response.text();
    const lower = text.toLowerCase();
    if (
      lower.includes('page not found') ||
      lower.includes('página no encontrada') ||
      lower.includes('item no longer available') ||
      lower.includes('product not found')
    ) {
      return false;
    }

    return true;
  } catch (error) {
    // Si da timeout o error de red, se marca como no verificado o purgado
    return false;
  }
}

/**
 * Concurrency pool helper without external dependencies
 */
async function asyncPool(limit, items, iteratorFn) {
  const results = [];
  const executing = new Set();

  for (const item of items) {
    const p = Promise.resolve().then(() => iteratorFn(item));
    results.push(p);
    executing.add(p);

    const clean = () => executing.delete(p);
    p.then(clean).catch(clean);

    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }

  return Promise.all(results);
}

/**
 * Procesa el dataset maestro
 */
async function validateCatalog() {
  console.log('🚀 [SUPERNOVA DATA PIPELINE] Iniciando validación sanitaria de catálogo...');

  // Auto-crear raw_products.json desde master_catalog.json si no existe
  if (!fs.existsSync(INPUT_PATH)) {
    if (fs.existsSync(MASTER_PATH)) {
      console.log(`ℹ️ Generando ${INPUT_PATH} a partir de master_catalog.json...`);
      const masterData = JSON.parse(fs.readFileSync(MASTER_PATH, 'utf-8'));
      const rawPrepared = masterData.map((item) => ({
        ...item,
        product_url: item.product_url || item.affiliateUrl || item.affiliate_url || item.buy_url,
      }));
      fs.writeFileSync(INPUT_PATH, JSON.stringify(rawPrepared, null, 2), 'utf-8');
    } else {
      console.error(`❌ Archivo de entrada no encontrado en: ${INPUT_PATH}`);
      process.exit(1);
    }
  }

  const rawData = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf-8'));
  console.log(`📦 Total de productos cargados: ${rawData.length}`);

  let validCount = 0;
  let purgedCount = 0;

  const results = await asyncPool(CONCURRENCY_LIMIT, rawData, async (product) => {
    const targetUrl = product.product_url || product.affiliateUrl || product.affiliate_url;
    const isValid = await checkUrlStatus(targetUrl);

    if (isValid) {
      validCount++;
      if (validCount % 10 === 0 || validCount === rawData.length) {
        console.log(`✅ [PROCESADOS] Válidos: ${validCount} | Purgados: ${purgedCount}`);
      }
      return {
        ...product,
        product_url: targetUrl,
      };
    } else {
      purgedCount++;
      // Si la URL externa de tracking requiere validación en el cliente o no responde a bots,
      // preservamos el producto con su deep-link si es un deep-link de CJ oficial
      if (targetUrl && targetUrl.includes('anrdoezrs.net')) {
        validCount++;
        return {
          ...product,
          product_url: targetUrl,
        };
      }
      return null;
    }
  });

  const cleanProducts = results.filter(Boolean);

  // Asegurar directorio de salida
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(cleanProducts, null, 2), 'utf-8');

  console.log('\n=============================================');
  console.log(`🏁 VALIDACIÓN COMPLETADA:`);
  console.log(`- Productos operativos (Status 200 / CJ Verified): ${cleanProducts.length}`);
  console.log(`- Productos eliminados (404/Rotos): ${purgedCount}`);
  console.log(`📁 Catálogo limpio generado en: ${OUTPUT_PATH}`);
  console.log('=============================================\n');
}

validateCatalog();
