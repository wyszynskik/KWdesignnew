// Wymaga uruchomionego `npm run serve` (localhost:8787) w drugim terminalu.
// BASE_URL=http://inny-host:port node scripts/verify_razdwa2.js  -- zeby zmienic host.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const os = require('os');

const OUT = path.join(os.tmpdir(), 'kwdesign-verify', 'razdwa_shots2');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const BASE = process.env.BASE_URL || 'http://localhost:8787';

(async () => {
  const browser = await chromium.launch();

  async function shot(page, name, selectorOrFull, margin = 20) {
    if (selectorOrFull === 'full') {
      await page.screenshot({ path: `${OUT}/${name}`, fullPage: true });
      return;
    }
    const el = page.locator(selectorOrFull).first();
    if (await el.count() === 0) { console.log('MISS:', selectorOrFull); return; }
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    const box = await el.boundingBox();
    if (!box) return;
    await page.screenshot({ path: `${OUT}/${name}`, clip: {
      x: Math.max(0, box.x - margin),
      y: Math.max(0, box.y - margin),
      width:  box.width  + margin * 2,
      height: Math.min(box.height + margin * 2, 1600)
    }});
    console.log('OK:', name);
  }

  // ── Desktop 1440px ──────────────────────────────────────────────
  const desk = await browser.newPage();
  await desk.setViewportSize({ width: 1440, height: 900 });
  await desk.goto(`${BASE}/projects/razdwa_aplikacja.html`, { waitUntil: 'networkidle' });

  await shot(desk, '00_fullpage_desktop.png', 'full');

  // Cz.1 — showcase section (3-kolumny hero)
  await shot(desk, '01_interfejs_ux_showcase.png', '.kwcs-website-showcase');

  // Sprawdź: showcase-row--single
  const hasRowSingle = await desk.locator('.showcase-row--single').count();
  console.log('showcase-row--single count:', hasRowSingle);

  // Cz.2 — CAD gallery
  await shot(desk, '02_cad_gallery.png', '#razdwa-cad ~ .kwcs-sec .kwcs-gallery-grid');

  // Cz.3 — panel cennika cały
  await shot(desk, '03_panel_cennika.png', '#razdwa-panel ~ .kwcs-sec');

  // Sprawdź: --single modifiers count
  const singleCount = await desk.locator('.kwcs-gallery-grid--single').count();
  console.log('kwcs-gallery-grid--single count:', singleCount);

  // Cz.4 — warianty gallery
  await shot(desk, '04_warianty_gallery.png', '#razdwa-warianty ~ .kwcs-sec .kwcs-gallery-grid');

  // Cz.5 — trio gallery
  await shot(desk, '05_trio_desktop.png', '.kwcs-gallery-grid--trio');
  const trioCount = await desk.locator('.kwcs-gallery-grid--trio').count();
  console.log('kwcs-gallery-grid--trio count:', trioCount);

  // Sekcja 5 pełna
  await shot(desk, '05_droga_full.png', '#razdwa-droga ~ .kwcs-sec', 0);

  // ── Tablet 768px ────────────────────────────────────────────────
  const tab = await browser.newPage();
  await tab.setViewportSize({ width: 768, height: 1024 });
  await tab.goto(`${BASE}/projects/razdwa_aplikacja.html`, { waitUntil: 'networkidle' });
  await shot(tab, '05_trio_tablet.png', '.kwcs-gallery-grid--trio');

  // ── Mobile 375px ─────────────────────────────────────────────────
  const mob = await browser.newPage();
  await mob.setViewportSize({ width: 375, height: 812 });
  await mob.goto(`${BASE}/projects/razdwa_aplikacja.html`, { waitUntil: 'networkidle' });
  await shot(mob, '05_trio_mobile.png', '.kwcs-gallery-grid--trio');
  await shot(mob, '03_panel_mobile.png', '#razdwa-panel ~ .kwcs-sec .kwcs-gallery-grid--single');

  await browser.close();
  console.log('ALL DONE →', OUT);
})();
