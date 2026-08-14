import { chromium, devices } from 'playwright';
import fs from 'fs';
import path from 'path';

// URL objetivo (puedes cambiarla por tu URL de Render o local http://localhost:3000)
const TARGET_URL = process.env.TEST_URL || 'https://supernovastore.humancentric.online';

// Dispositivos y resoluciones a testear
const TEST_DEVICES = [
  { name: 'iPhone 13 / 14', ...devices['iPhone 13'] },
  { name: 'Pixel 7 (Android)', ...devices['Pixel 7'] },
  { name: 'Pantalla Móvil Pequeña (360x640)', viewport: { width: 360, height: 640 }, isMobile: true, userAgent: 'Mozilla/5.0 (Linux; Android 10)' },
  { name: 'iPad / Tablet (768x1024)', viewport: { width: 768, height: 1024 }, isMobile: true, userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0)' }
];

const SCREENSHOT_DIR = path.resolve('test-results/mobile-screenshots');

async function runResponsiveTests() {
  console.log(`📱 [RESPONSIVE TEST] Iniciando auditoría móvil en: ${TARGET_URL}\n`);

  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  let globalPassed = true;

  for (const deviceConfig of TEST_DEVICES) {
    console.log(`🔍 Probando en: ${deviceConfig.name} (${deviceConfig.viewport.width}x${deviceConfig.viewport.height})...`);
    
    const context = await browser.newContext({
      viewport: deviceConfig.viewport,
      userAgent: deviceConfig.userAgent,
      isMobile: deviceConfig.isMobile,
      hasTouch: true
    });

    const page = await context.newPage();

    try {
      let attempts = 0;
      let loaded = false;
      while (attempts < 2 && !loaded) {
        attempts++;
        try {
          await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
          await page.waitForTimeout(3000);
          loaded = true;
        } catch (e) {
          if (attempts >= 2) throw e;
          console.log(`   ⏳ Reintentando conexión con ${deviceConfig.name}...`);
          await page.waitForTimeout(2000);
        }
      }

      // 1. Validar etiqueta Meta Viewport
      const hasViewportMeta = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="viewport"]');
        return meta && meta.content.includes('width=device-width');
      });

      if (!hasViewportMeta) {
        console.error(`   ❌ [FALLO] Falta <meta name="viewport" content="width=device-width, initial-scale=1.0">`);
        globalPassed = false;
      } else {
        console.log(`   ✅ Meta Viewport configurado correctamente.`);
      }

      // 2. Validar que NO hay Scroll Horizontal (Overflow-X)
      const overflowIssue = await page.evaluate(() => {
        const docWidth = document.documentElement.clientWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        const elementsBreaking = [];

        // Buscar qué elemento específico se sale de la pantalla
        document.querySelectorAll('*').forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.right > docWidth + 1) { // 1px tolerancia por subpíxeles
            elementsBreaking.push({
              tag: el.tagName.toLowerCase(),
              className: el.className,
              id: el.id,
              right: rect.right,
              maxWidth: docWidth
            });
          }
        });

        return {
          hasHorizontalScroll: scrollWidth > docWidth,
          docWidth,
          scrollWidth,
          elementsBreaking: elementsBreaking.slice(0, 3) // Solo primeros 3
        };
      });

      if (overflowIssue.hasHorizontalScroll) {
        console.error(`   ❌ [FALLO] Existe desbordamiento horizontal (Scroll Width: ${overflowIssue.scrollWidth}px > Viewport: ${overflowIssue.docWidth}px)`);
        console.error(`      Elementos causantes:`, JSON.stringify(overflowIssue.elementsBreaking, null, 2));
        globalPassed = false;
      } else {
        console.log(`   ✅ Sin desbordamiento horizontal (0 scroll horizontal no deseado).`);
      }

      // 3. Validar visibilidad de botones y productos
      const elementsStatus = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button, a[target="_blank"]');
        const images = document.querySelectorAll('img');
        return {
          buttonsCount: buttons.length,
          imagesCount: images.length
        };
      });

      console.log(`   ✅ Elementos interactivos renderizados: ${elementsStatus.buttonsCount} botones / enlaces y ${elementsStatus.imagesCount} imágenes.`);

      // 4. Captura de pantalla para revisión visual
      const screenshotPath = path.join(SCREENSHOT_DIR, `${deviceConfig.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`   📸 Captura guardada en: ${screenshotPath}\n`);

    } catch (err) {
      console.error(`   ❌ Error durante el test en ${deviceConfig.name}:`, err.message);
      globalPassed = false;
    } finally {
      await context.close();
    }
  }

  await browser.close();

  console.log('=============================================');
  if (globalPassed) {
    console.log('🎉 AUDITORÍA EXITOSA: La web es 100% responsive en todos los dispositivos móviles testeados.');
  } else {
    console.log('⚠️ SE DETECTARON PROBLEMAS RESPONSIVE: Revisa los logs y las capturas generadas.');
  }
  console.log('=============================================\n');
}

runResponsiveTests();
