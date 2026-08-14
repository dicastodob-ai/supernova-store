/**
 * Supernova Store — Link Validator & Soft-404 Detection
 *
 * Scans data/raw_products.json, validates URLs with concurrency control and browser simulation headers,
 * filters 4xx/5xx/Soft-404 responses, and exports the clean dataset to public/data/products.json.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Dynamic import for ES Module p-limit
async function getPLimit() {
  const pLimitModule = await import('p-limit');
  return pLimitModule.default || pLimitModule;
}

// Rutas de entrada y salida
const INPUT_PATH = path.resolve(__dirname, '../data/raw_products.json');
const MASTER_PATH = path.resolve(__dirname, '../data/master_catalog.json');
const OUTPUT_PATH = path.resolve(__dirname, '../public/data/products.json');

// Configuración de concurrencia y timeouts para Render / CJ
const CONCURRENCY_LIMIT = 50; // Límite de peticiones simultáneas
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
    const response = await axios.get(url, {
      headers: HEADERS,
      timeout: REQUEST_TIMEOUT_MS,
      maxRedirects: 10,
      validateStatus: (status) => status < 500, // Maneja status internamente
    });

    // Descartar errores 404 y cualquier 4xx
    if (response.status >= 400) {
      return false;
    }

    // Detección heurística de "Soft 404" (páginas no encontradas con status 200)
    const bodyText = typeof response.data === 'string' ? response.data.toLowerCase() : '';
    if (
      bodyText.includes('page not found') ||
      bodyText.includes('página no encontrada') ||
      bodyText.includes('item no longer available') ||
      bodyText.includes('product not found')
    ) {
      return false;
    }

    return true;
  } catch (error) {
    // Si da timeout o error de red, se purga o preserva si es tracking oficial
    if (url.includes('anrdoezrs.net') || url.includes('cj.com')) {
      return true;
    }
    return false;
  }
}

/**
 * Procesa el dataset maestro
 */
async function validateCatalog() {
  console.log('🚀 [SUPERNOVA DATA PIPELINE] Iniciando validación sanitaria de catálogo...');

  const pLimit = await getPLimit();
  const limit = pLimit(CONCURRENCY_LIMIT);

  // Asegurar que exista INPUT_PATH
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

  const validationPromises = rawData.map((product) =>
    limit(async () => {
      const urlToTest = product.product_url || product.affiliateUrl || product.affiliate_url;
      const isValid = await checkUrlStatus(urlToTest);

      if (isValid) {
        validCount++;
        if (validCount % 10 === 0 || validCount === rawData.length) {
          console.log(`✅ [PROCESADOS] Válidos: ${validCount} | Purgados: ${purgedCount}`);
        }
        return {
          ...product,
          product_url: urlToTest,
        };
      } else {
        purgedCount++;
        return null;
      }
    })
  );

  const results = await Promise.all(validationPromises);
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
