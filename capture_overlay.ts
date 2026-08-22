import { chromium } from 'playwright';

async function captureOverlay() {
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  }

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5173/annotate.html?graph=v3', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const outPath = 'd:/Thao/airport-simulator/v3_overlay_all_edges.png';
  await page.screenshot({ path: outPath });
  console.log('✓ Captured v3_overlay_all_edges.png at:', outPath);

  await browser.close();
}

captureOverlay().catch(err => {
  console.error('Error capturing overlay:', err);
  process.exit(1);
});
