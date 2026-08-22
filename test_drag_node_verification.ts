import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function run() {
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  }

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('1. Navigating to http://localhost:5173/annotate.html?graph=v3...');
  await page.goto('http://localhost:5173/annotate.html?graph=v3', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Capture Before Screenshot
  const beforeImgPath = 'd:/Thao/airport-simulator/test_drag_node_before.png';
  await page.screenshot({ path: beforeImgPath });
  console.log('✓ Captured BEFORE screenshot:', beforeImgPath);

  // 2. Read initial lines from localStorage / DOM
  const beforeJsonRaw = await page.evaluate(() => localStorage.getItem('v3_chart_pen_raw_traces_v1'));
  const beforeLines = JSON.parse(beforeJsonRaw!);

  // Find line_17 (W9A) point 0:
  const targetLineId = 'line_17';
  const targetPointIndex = 0;
  const targetLineBefore = beforeLines.find((l: any) => l.id === targetLineId);
  const targetPointBefore = targetLineBefore.points[targetPointIndex];

  console.log(`Target Node to test: ${targetLineId} [#${targetPointIndex + 1}] | Before: (${targetPointBefore.x}, ${targetPointBefore.y})`);

  // 3. Locate the SVG circle element for this point
  const circleHandle = page.locator(`circle[cx="${targetPointBefore.x}"][cy="${targetPointBefore.y}"]`).first();
  const box = await circleHandle.boundingBox();

  if (!box) {
    throw new Error('Could not find bounding box for target node handle!');
  }

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  const dragDeltaX = 50;
  const dragDeltaY = 30;

  console.log(`Dragging from (${startX}, ${startY}) by (+${dragDeltaX}, +${dragDeltaY})...`);

  // Drag and drop with mouse
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + dragDeltaX, startY + dragDeltaY, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(500);

  // 4. Capture After Screenshot
  const afterImgPath = 'd:/Thao/airport-simulator/test_drag_node_after.png';
  await page.screenshot({ path: afterImgPath });
  console.log('✓ Captured AFTER screenshot:', afterImgPath);

  // 5. Read after lines from localStorage
  const afterJsonRaw = await page.evaluate(() => localStorage.getItem('v3_chart_pen_raw_traces_v1'));
  const afterLines = JSON.parse(afterJsonRaw!);
  const targetLineAfter = afterLines.find((l: any) => l.id === targetLineId);
  const targetPointAfter = targetLineAfter.points[targetPointIndex];

  console.log(`Target Node after drag: (${targetPointAfter.x}, ${targetPointAfter.y})`);

  // 6. Detailed Diff Audit
  let changedNodesCount = 0;
  const diffReport: any[] = [];

  for (let lIdx = 0; lIdx < beforeLines.length; lIdx++) {
    const bL = beforeLines[lIdx];
    const aL = afterLines[lIdx];
    if (bL.id !== aL.id) {
      diffReport.push({ error: `Line ID mismatch: ${bL.id} vs ${aL.id}` });
    }
    if (bL.points.length !== aL.points.length) {
      diffReport.push({ error: `Points length mismatch in ${bL.id}` });
    }

    for (let pIdx = 0; pIdx < bL.points.length; pIdx++) {
      const bP = bL.points[pIdx];
      const aP = aL.points[pIdx];
      if (bP.x !== aP.x || bP.y !== aP.y) {
        changedNodesCount++;
        diffReport.push({
          lineId: bL.id,
          lineName: bL.name,
          pointIndex: pIdx,
          before: { x: bP.x, y: bP.y },
          after: { x: aP.x, y: aP.y },
          delta: { dx: aP.x - bP.x, dy: aP.y - bP.y },
        });
      }
    }
  }

  console.log('\n--- DIFF AUDIT REPORT ---');
  console.log(`Total Lines Before: ${beforeLines.length} | Total Lines After: ${afterLines.length}`);
  const totalPtsBefore = beforeLines.reduce((s: number, l: any) => s + l.points.length, 0);
  const totalPtsAfter = afterLines.reduce((s: number, l: any) => s + l.points.length, 0);
  console.log(`Total Points Before: ${totalPtsBefore} | Total Points After: ${totalPtsAfter}`);
  console.log(`Total Nodes Changed: ${changedNodesCount}`);
  console.log('Diff Details:', JSON.stringify(diffReport, null, 2));

  // Assertions
  if (changedNodesCount !== 1) {
    throw new Error(`FAIL: Expected exactly 1 node to change, but found ${changedNodesCount}!`);
  }
  if (beforeLines.length !== 38 || afterLines.length !== 38) {
    throw new Error(`FAIL: Total lines must be exactly 38!`);
  }
  if (totalPtsBefore !== 119 || totalPtsAfter !== 119) {
    throw new Error(`FAIL: Total points must be exactly 119!`);
  }

  // Restore the tested line in localStorage to pristine state
  await page.evaluate((cleanData) => {
    localStorage.setItem('v3_chart_pen_raw_traces_v1', cleanData);
  }, beforeJsonRaw);
  console.log('✓ Restored test environment localStorage back to pristine state');

  console.log('\n✅ ALL VERIFICATION ASSERTIONS PASSED PERFECTLY (100% SINGLE-NODE PRECISION)!');
  await browser.close();
}

run().catch(err => {
  console.error('Error during test:', err);
  process.exit(1);
});
