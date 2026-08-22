import { chromium } from 'playwright';

async function captureOverlayProof() {
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  }

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5173/?graph=v3', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Click on "Overlay V3" button to enable Overlay V3 layer
  const overlayBtn = await page.$('button:has-text("Overlay V3"), button:has-text("Lớp phủ V3")');
  if (overlayBtn) {
    await overlayBtn.click();
    await page.waitForTimeout(1000);
    console.log('✓ Toggled Overlay V3 button!');
  } else {
    console.log('⚠️ Overlay V3 button not found by text, trying toggle selector...');
  }

  const outPath = 'd:/Thao/airport-simulator/v3_overlay_source_proof.png';
  await page.screenshot({ path: outPath });
  console.log('✓ Captured v3_overlay_source_proof.png at:', outPath);

  await browser.close();
}

captureOverlayProof().catch(err => {
  console.error(err);
  process.exit(1);
});
