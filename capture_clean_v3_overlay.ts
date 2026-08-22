import { chromium } from 'playwright';

async function captureCleanV3Overlay() {
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  }

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  // Navigate to simulator with graph=v3
  await page.goto('http://localhost:5173/?graph=v3', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const outPath = 'd:/Thao/airport-simulator/v3_overlay_all_edges.png';
  await page.screenshot({ path: outPath });
  console.log('✓ Captured clean v3_overlay_all_edges.png at:', outPath);

  await browser.close();
}

captureCleanV3Overlay().catch(err => {
  console.error('Error capturing clean overlay:', err);
  process.exit(1);
});
