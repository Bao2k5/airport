import { chromium } from 'playwright';

async function captureEvidence() {
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  }

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // 1. Overlay from raw only
  console.log('1. Capturing v3_overlay_from_raw_only.png...');
  await page.goto('http://localhost:5173/?graph=v3', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'd:/Thao/airport-simulator/v3_overlay_from_raw_only.png' });

  // 2. Manual Route Preview
  console.log('2. Capturing v3_manual_route_preview.png...');
  await page.goto('http://localhost:5173/?graph=v3', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  // Look for route preview or buttons without waiting too long
  const previewBtn = await page.$('button:has-text("Chấp nhận tuyến"), button:has-text("Xác nhận"), button:has-text("Route")');
  if (previewBtn) {
    try { await previewBtn.click({ timeout: 3000 }); } catch {}
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: 'd:/Thao/airport-simulator/v3_manual_route_preview.png' });

  // 3. Manual FTG Running
  console.log('3. Capturing v3_manual_ftg_running.png...');
  const startBtn = await page.$('button:has-text("Bắt đầu lăn"), button:has-text("Bắt đầu"), button:has-text("Khởi hành")');
  if (startBtn) {
    try { await startBtn.click({ timeout: 3000 }); } catch {}
    await page.waitForTimeout(1500);
  }
  await page.screenshot({ path: 'd:/Thao/airport-simulator/v3_manual_ftg_running.png' });

  // 4. Scenario Runtime Summary
  console.log('4. Capturing v3_scenario_runtime_summary.png...');
  await page.goto('http://localhost:5173/?graph=v3', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const scenarioBtn = await page.$('button:has-text("Kịch bản 1"), button:has-text("Kịch bản"), button:has-text("Scenario")');
  if (scenarioBtn) {
    try { await scenarioBtn.click({ timeout: 3000 }); } catch {}
    await page.waitForTimeout(1500);
  }
  await page.screenshot({ path: 'd:/Thao/airport-simulator/v3_scenario_runtime_summary.png' });

  console.log('✓ All 4 evidence screenshots captured successfully!');
  await browser.close();
}

captureEvidence().catch(err => {
  console.error('Error capturing evidence:', err);
  process.exit(1);
});
