import { chromium } from 'playwright';

async function captureScenario() {
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  }

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5173/?graph=v3', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'd:/Thao/airport-simulator/v3_scenario_runtime_summary.png', timeout: 10000 });
  console.log('✓ Captured v3_scenario_runtime_summary.png');
  await browser.close();
}

captureScenario().catch(err => {
  console.error(err);
  process.exit(1);
});
