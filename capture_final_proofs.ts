import { chromium } from 'playwright';

async function captureAllFinalProofs() {
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  }

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // 1. Overlay proof
  console.log('1. Capturing v3_final_overlay_proof.png...');
  await page.goto('http://localhost:5173/?graph=v3', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const overlayBtn = await page.$('button:has-text("Overlay V3"), button:has-text("Lớp phủ V3")');
  if (overlayBtn) {
    await overlayBtn.click();
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: 'd:/Thao/airport-simulator/v3_final_overlay_proof.png' });

  // 2. Manual Preview proof
  console.log('2. Capturing v3_final_manual_preview.png...');
  await page.goto('http://localhost:5173/?graph=v3', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const acceptBtn = await page.$('button:has-text("Chấp nhận tuyến"), button:has-text("Chấp nhận"), button:has-text("Tìm đường")');
  if (acceptBtn) {
    await acceptBtn.click();
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: 'd:/Thao/airport-simulator/v3_final_manual_preview.png' });

  // 3. Manual FTG Rolling proof
  console.log('3. Capturing v3_final_manual_ftg.png...');
  const startBtn = await page.$('button:has-text("Bắt đầu lăn"), button:has-text("Bắt đầu")');
  if (startBtn) {
    await startBtn.click();
    await page.waitForTimeout(1500);
  }
  await page.screenshot({ path: 'd:/Thao/airport-simulator/v3_final_manual_ftg.png' });

  // 4. Scenarios 1 to 5
  for (let i = 1; i <= 5; i++) {
    console.log(`4.${i}. Capturing Scenario #${i}...`);
    await page.goto('http://localhost:5173/?graph=v3', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const scBtn = await page.$(`button:has-text("Kịch bản ${i}"), button:has-text("Scenario ${i}")`);
    if (scBtn) {
      await scBtn.click();
      await page.waitForTimeout(1000);
      const runScBtn = await page.$('button:has-text("Chạy kịch bản"), button:has-text("Bắt đầu")');
      if (runScBtn) {
        await runScBtn.click();
        await page.waitForTimeout(1500);
      }
    }
    await page.screenshot({ path: `d:/Thao/airport-simulator/v3_final_scenario_${i}.png` });
  }

  console.log('✓ All final proof screenshots captured successfully!');
  await browser.close();
}

captureAllFinalProofs().catch(err => {
  console.error('Error capturing proofs:', err);
  process.exit(1);
});
