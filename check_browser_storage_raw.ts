import { chromium } from 'playwright';
import fs from 'fs';

async function checkStorage() {
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  }

  const page = await browser.newPage();
  await page.goto('http://localhost:5173/annotate.html?graph=v3&mode=raw-only', { waitUntil: 'networkidle' });

  const rawOnlyStorage = await page.evaluate(() => localStorage.getItem('v3_raw_only_traces_v1'));
  const normalStorage = await page.evaluate(() => localStorage.getItem('v3_chart_pen_raw_traces_v1'));

  console.log('--- CHECKING LOCALSTORAGE IN BROWSER ---');
  if (rawOnlyStorage) {
    const parsed = JSON.parse(rawOnlyStorage);
    console.log(`v3_raw_only_traces_v1 exists with ${parsed.length} lines.`);
  } else {
    console.log('v3_raw_only_traces_v1 is empty in localStorage.');
  }

  if (normalStorage) {
    const parsed = JSON.parse(normalStorage);
    console.log(`v3_chart_pen_raw_traces_v1 exists with ${parsed.length} lines.`);
  } else {
    console.log('v3_chart_pen_raw_traces_v1 is empty in localStorage.');
  }

  await browser.close();
}

checkStorage().catch(err => {
  console.error(err);
  process.exit(1);
});
