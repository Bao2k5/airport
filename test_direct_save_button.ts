import { chromium } from 'playwright';

async function testSave() {
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  }

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5173/annotate.html?graph=v3&mode=raw-only', { waitUntil: 'networkidle' });

  // Click the Direct Save button
  const saveBtn = await page.$('button:has-text("LƯU TRỰC TIẾP")');
  if (saveBtn) {
    await saveBtn.click();
    await page.waitForTimeout(1000);
    console.log('✓ Clicked Direct Save button!');
  } else {
    console.log('❌ Direct Save button not found!');
  }

  await browser.close();
}

testSave().catch(err => {
  console.error(err);
  process.exit(1);
});
