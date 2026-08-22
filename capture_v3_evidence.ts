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
  console.log('Capturing v3_overlay_from_raw_only.png...');
  await page.goto('http://localhost:5173/?graph=v3', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Click on "Overlay V3" button if available or ensure overlay is visible
  const overlayBtn = await page.$('button:has-text("Overlay V3"), button:has-text("Lớp phủ"), button:has-text("Overlay")');
  if (overlayBtn) {
    await overlayBtn.click();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: 'd:/Thao/airport-simulator/v3_overlay_from_raw_only.png' });

  // 2. Manual Route Preview (Click Route Preview / Accept route)
  console.log('Capturing v3_manual_route_preview.png...');
  // Select start and destination if needed
  const acceptRouteBtn = await page.$('button:has-text("Chấp nhận tuyến"), button:has-text("Xác nhận tuyến"), button:has-text("Tìm đường")');
  if (acceptRouteBtn) {
    await acceptRouteBtn.click();
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: 'd:/Thao/airport-simulator/v3_manual_route_preview.png' });

  // 3. Manual FTG Running
  console.log('Capturing v3_manual_ftg_running.png...');
  const startTaxiBtn = await page.$('button:has-text("Bắt đầu lăn"), button:has-text("Bắt đầu"), button:has-text("Khởi hành")');
  if (startTaxiBtn) {
    await startTaxiBtn.click();
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: 'd:/Thao/airport-simulator/v3_manual_ftg_running.png' });

  // 4. Scenario runtime summary
  console.log('Capturing v3_scenario_runtime_summary.png...');
  // Switch to scenario tab if available
  const scenarioTab = await page.$('button:has-text("Kịch bản"), button:has-text("Scenario")');
  if (scenarioTab) {
    await scenarioTab.click();
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
