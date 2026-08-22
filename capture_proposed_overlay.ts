import { chromium } from 'playwright';

async function run() {
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  }

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5173/annotate_junctions.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const outPath = 'd:/Thao/airport-simulator/v3_proposed_junctions_overlay.png';
  await page.screenshot({ path: outPath });
  console.log('✓ Captured v3_proposed_junctions_overlay.png at:', outPath);

  await browser.close();
}

run().catch(err => {
  console.error('Error capturing proposed junctions overlay:', err);
  process.exit(1);
});
