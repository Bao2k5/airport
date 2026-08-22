import { chromium } from 'playwright';
import fs from 'fs';

async function checkLocalStorage() {
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  }

  const page = await browser.newPage();
  await page.goto('http://localhost:5173/annotate_junctions.html', { waitUntil: 'networkidle' });

  const candidateState = await page.evaluate(() => localStorage.getItem('v3_junctions_candidate_state_v1'));
  const manualConfirmed = await page.evaluate(() => localStorage.getItem('v3_manual_confirmed_junctions_v1'));

  console.log('--- LOCALSTORAGE CHECK ---');
  if (candidateState) {
    const cands = JSON.parse(candidateState);
    console.log(`v3_junctions_candidate_state_v1 found: ${cands.length} items`);
    const confirmed = cands.filter((c: any) => c.status === 'confirmed');
    const rejected = cands.filter((c: any) => c.status === 'rejected');
    const pending = cands.filter((c: any) => c.status === 'pending_review');
    console.log(`  - Confirmed: ${confirmed.length}`);
    console.log(`  - Rejected: ${rejected.length}`);
    console.log(`  - Pending: ${pending.length}`);
    
    if (confirmed.length > 0) {
      // Let's format and write this to d:/Thao/airport-simulator/v3_junctions.confirmed.json!
      const formatted = confirmed.map((c: any, idx: number) => ({
        junctionId: `J${String(idx + 1).padStart(2, '0')}`,
        fromNodeId: c.nodeA,
        toNodeId: c.nodeB,
        fromTraceId: c.lineA,
        toTraceId: c.lineB,
        fromCoords: c.coordA,
        toCoords: c.coordB,
        geometryDistancePx: c.distancePx,
        lengthMeters: Math.round(c.distancePx * 3.0 * 10) / 10,
        junctionType: c.type,
        verifiedByUser: true,
        allowedDirections: 'bidirectional',
        note: `Xác nhận junction ${c.type} giữa ${c.lineA} và ${c.lineB} (${c.distancePx}px)`,
        extra: c.extra,
      }));

      const exportData = {
        exportDate: new Date().toISOString(),
        exportTimestamp: Date.now(),
        summary: {
          totalConfirmed: formatted.length,
          totalRejected: rejected.length,
          totalPending: pending.length,
        },
        confirmedJunctions: formatted,
      };

      fs.writeFileSync('d:/Thao/airport-simulator/v3_junctions.confirmed.json', JSON.stringify(exportData, null, 2), 'utf8');
      console.log(`✓ Saved ${formatted.length} confirmed junctions from localStorage to d:/Thao/airport-simulator/v3_junctions.confirmed.json!`);
    }
  } else {
    console.log('No v3_junctions_candidate_state_v1 in localStorage');
  }

  if (manualConfirmed) {
    console.log('v3_manual_confirmed_junctions_v1 found');
  }

  await browser.close();
}

checkLocalStorage().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
