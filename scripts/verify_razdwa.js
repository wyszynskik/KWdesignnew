// Wymaga uruchomionego `npm run serve` (localhost:8787) w drugim terminalu.
// BASE_URL=http://inny-host:port node scripts/verify_razdwa.js  -- zeby zmienic host.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

const BASE_URL = process.env.BASE_URL || 'http://localhost:8787';
const OUT = path.join(os.tmpdir(), 'kwdesign-verify', 'razdwa_shots');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  const fileUrl = `${BASE_URL}/projects/razdwa_aplikacja.html`;
  await page.goto(fileUrl, { waitUntil: 'networkidle' });

  // Full page overview
  await page.screenshot({ path: `${OUT}/00_fullpage.png`, fullPage: true });

  // Section 1: Interfejs i UX — showcase images
  const ux = page.locator('#razdwa-ux').first();
  await ux.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const sec1 = page.locator('.kwcs-website-showcase');
  const box1 = await sec1.boundingBox();
  if (box1) {
    await page.screenshot({ path: `${OUT}/01_interfejs_ux.png`, clip: { x: box1.x, y: box1.y - 20, width: box1.width, height: box1.height + 40 } });
  }

  // Section 2: CAD gallery
  const cad = page.locator('#razdwa-cad').first();
  await cad.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const cadSec = page.locator('#razdwa-cad + .kwcs-sec');
  const boxCad = await cadSec.boundingBox();
  if (boxCad) {
    await page.screenshot({ path: `${OUT}/02_kalkulator_cad.png`, clip: { x: boxCad.x, y: boxCad.y - 20, width: boxCad.width, height: Math.min(boxCad.height, 800) } });
  }

  // Section 3: Panel cennika
  const panel = page.locator('#razdwa-panel').first();
  await panel.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const panelSec = page.locator('#razdwa-panel + .kwcs-sec');
  const boxPanel = await panelSec.boundingBox();
  if (boxPanel) {
    await page.screenshot({ path: `${OUT}/03_panel_cennika.png`, clip: { x: boxPanel.x, y: boxPanel.y - 20, width: boxPanel.width, height: Math.min(boxPanel.height + 40, 1200) } });
  }

  // Section 4: Warianty
  const warianty = page.locator('#razdwa-warianty').first();
  await warianty.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const wariantySec = page.locator('#razdwa-warianty + .kwcs-sec');
  const boxW = await wariantySec.boundingBox();
  if (boxW) {
    await page.screenshot({ path: `${OUT}/04_warianty.png`, clip: { x: boxW.x, y: boxW.y - 20, width: boxW.width, height: Math.min(boxW.height + 40, 1000) } });
  }

  // Section 5: Droga zamówienia — trio
  const droga = page.locator('#razdwa-droga').first();
  await droga.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const drogaSec = page.locator('#razdwa-droga + .kwcs-sec');
  const boxD = await drogaSec.boundingBox();
  if (boxD) {
    await page.screenshot({ path: `${OUT}/05_droga_zamowienia.png`, clip: { x: boxD.x, y: boxD.y - 20, width: boxD.width, height: Math.min(boxD.height + 40, 1400) } });
  }

  // Trio gallery specifically
  const trio = page.locator('.kwcs-gallery-grid--trio');
  if (await trio.count() > 0) {
    await trio.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const boxTrio = await trio.boundingBox();
    if (boxTrio) {
      await page.screenshot({ path: `${OUT}/05b_trio_gallery.png`, clip: { x: boxTrio.x - 20, y: boxTrio.y - 20, width: boxTrio.width + 40, height: boxTrio.height + 40 } });
    }
  }

  // Mobile view: 375px
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(fileUrl, { waitUntil: 'networkidle' });
  const trioMobile = page.locator('.kwcs-gallery-grid--trio');
  if (await trioMobile.count() > 0) {
    await trioMobile.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const boxTM = await trioMobile.boundingBox();
    if (boxTM) {
      await page.screenshot({ path: `${OUT}/05c_trio_mobile.png`, clip: { x: 0, y: boxTM.y - 20, width: 375, height: boxTM.height + 60 } });
    }
  }

  // Tablet 768px
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto(fileUrl, { waitUntil: 'networkidle' });
  const trioTablet = page.locator('.kwcs-gallery-grid--trio');
  if (await trioTablet.count() > 0) {
    await trioTablet.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const boxTT = await trioTablet.boundingBox();
    if (boxTT) {
      await page.screenshot({ path: `${OUT}/05d_trio_tablet.png`, clip: { x: 0, y: boxTT.y - 20, width: 768, height: boxTT.height + 60 } });
    }
  }

  await browser.close();
  console.log('DONE:', OUT);
})();
