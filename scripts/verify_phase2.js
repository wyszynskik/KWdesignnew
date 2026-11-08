// Wymaga uruchomionego `npm run serve` (localhost:8787) w drugim terminalu.
// BASE_URL=http://inny-host:port node scripts/verify_phase2.js  -- zeby zmienic host.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const os = require('os');

const OUT = path.join(os.tmpdir(), 'kwdesign-verify', 'razdwa_phase2');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
const BASE = process.env.BASE_URL || 'http://localhost:8787';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/projects/razdwa_aplikacja.html`, { waitUntil: 'networkidle' });

  async function shot(name, selector, margin = 20) {
    const el = page.locator(selector).first();
    if (await el.count() === 0) { console.log('MISS:', selector); return; }
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const b = await el.boundingBox();
    if (!b) return;
    await page.screenshot({ path: `${OUT}/${name}`, clip: {
      x: Math.max(0, b.x - margin), y: Math.max(0, b.y - margin),
      width: b.width + margin*2, height: Math.min(b.height + margin*2, 1200)
    }});
    console.log('OK:', name);
  }

  // Cz.1 — czy showcase-section "Dynamiczny" usunięty, zostało tylko 3-kolumny
  await shot('01_cz1_showcase.png', '.kwcs-website-showcase');

  // Cz.2 — placeholder CAD
  await shot('02_cz2_cad_placeholder.png', '#razdwa-cad ~ .kwcs-sec .kwcs-gallery-grid');

  // Cz.3 — panel cennika bez PIN gallery
  await shot('03_cz3_panel.png', '#razdwa-panel ~ .kwcs-sec');

  // Cz.4 — warianty z placeholderem
  await shot('04_cz4_warianty.png', '#razdwa-warianty ~ .kwcs-sec .kwcs-gallery-grid');

  // Cz.5 — trio bez zmian
  await shot('05_cz5_trio.png', '.kwcs-gallery-grid--trio');

  await browser.close();
  console.log('DONE →', OUT);
})();
