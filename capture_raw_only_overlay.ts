import { chromium } from 'playwright';

async function captureRawOnlyOverlay() {
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  }

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  // Navigate to annotate with mode=raw-only
  await page.goto('http://localhost:5173/annotate.html?graph=v3&mode=raw-only', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const outPath = 'd:/Thao/airport-simulator/v3_raw_only_overlay.png';
  await page.screenshot({ path: outPath });
  console.log('✓ Captured v3_raw_only_overlay.png at:', outPath);

  await browser.close();
}

captureRawOnlyOverlay().catch(err => {
  console.error('Error capturing raw-only overlay:', err);
  process.exit(1);
});
