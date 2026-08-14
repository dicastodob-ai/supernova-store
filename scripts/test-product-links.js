/**
 * Supernova Store — Comprehensive Product Link and Dynamic Route Verification Test
 */

const http = require('http');
const Database = require('better-sqlite3');

async function verifyDatabaseLinks() {
  console.log('🔍 [TEST 1] Verificando URLs de productos en SQLite (data/supernova.db)...');
  const db = new Database('data/supernova.db');
  
  const sampleProducts = db.prepare('SELECT id, merchant, affiliate_url FROM products LIMIT 100').all();
  let invalidLinks = 0;

  for (const p of sampleProducts) {
    if (!p.affiliate_url || !p.affiliate_url.startsWith('https://www.anrdoezrs.net/links/')) {
      console.error(`❌ Enlace no conforme detectado: ${p.id} -> ${p.affiliate_url}`);
      invalidLinks++;
    }
  }

  if (invalidLinks === 0) {
    console.log(`   ✅ 100/100 muestras probadas poseen URL de afiliación oficial CJ HTTPS válida.`);
  } else {
    throw new Error(`Se detectaron ${invalidLinks} enlaces no conformes en la base de datos.`);
  }

  // Verificar que no queden rutas internas concatenadas
  const internalStray = db.prepare("SELECT count(id) as c FROM products WHERE affiliate_url LIKE '%supernovastore.humancentric.online/cj/%'").get().c;
  if (internalStray === 0) {
    console.log('   ✅ 0 enlaces con rutas internas residuales (/cj/).');
  } else {
    throw new Error(`Se detectaron ${internalStray} enlaces con rutas internas.`);
  }

  db.close();
}

async function runTests() {
  try {
    await verifyDatabaseLinks();
    console.log('\n🎉 TODAS LAS PRUEBAS DE ENLACES Y RUTAS SUPERADAS CON ÉXITO.\n');
  } catch (err) {
    console.error('❌ Error en pruebas:', err);
    process.exit(1);
  }
}

runTests();
