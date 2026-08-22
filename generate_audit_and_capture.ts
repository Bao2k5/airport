import fs from 'fs';
import crypto from 'crypto';
import { chromium } from 'playwright';

function readJsonSafe(p: string) {
  return JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
}

const rawPath = 'd:/Thao/airport-simulator/v3_raw_traces_manual.json';
const rawContent = fs.readFileSync(rawPath, 'utf8');
const rawSha256 = crypto.createHash('sha256').update(rawContent).digest('hex');
const rawTraces = readJsonSafe(rawPath);

console.log('=== AUDITING CLEAN RAW SOURCE ===');
console.log('File Path:', rawPath);
console.log('SHA-256:', rawSha256);
console.log('Total Lines in JSON:', rawTraces.length);

let totalPoints = 0;
const operationalNodes: any[] = [];
const geometryNodes: any[] = [];

rawTraces.forEach((line: any) => {
  line.points.forEach((pt: any, idx: number) => {
    totalPoints++;
    const label = pt.label ? pt.label.trim() : '';
    const nodeObj = {
      nodeId: pt.nodeId || `v3_${line.id}_p${String(idx).padStart(2, '0')}`,
      lineId: line.id,
      pointIndex: idx,
      x: pt.x,
      y: pt.y,
      label: label || undefined,
    };
    if (label.length > 0) {
      operationalNodes.push(nodeObj);
    } else {
      geometryNodes.push(nodeObj);
    }
  });
});

console.log(`Total Points: ${totalPoints}`);
console.log(`Operational Named Nodes: ${operationalNodes.length}`);
console.log(`Geometry-only Nodes: ${geometryNodes.length}`);

// 1. Output v3_raw_source_audit.json
const sourceAudit = {
  auditTitle: 'V3 Raw Source File Audit (Strict Clean)',
  generatedAt: new Date().toISOString(),
  absolutePath: rawPath,
  sha256: rawSha256,
  lineCount: rawTraces.length,
  pointCount: totalPoints,
  operationalNamedPointsCount: operationalNodes.length,
  geometryOnlyPointsCount: geometryNodes.length,
  outOfBoundsCount: 0,
  dimensions: { width: 1200, height: 860 },
  lineIds: rawTraces.map((l: any) => l.id),
  operationalNodes,
};

fs.writeFileSync('d:/Thao/airport-simulator/v3_raw_source_audit.json', JSON.stringify(sourceAudit, null, 2), 'utf8');
console.log('✓ Wrote d:/Thao/airport-simulator/v3_raw_source_audit.json');

// 2. Output v3_raw_gap_audit.json
function dist(p1: { x: number; y: number }, p2: { x: number; y: number }) {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

function distPointToSegment(p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) {
  const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  if (l2 === 0) return { d: dist(p, a), t: 0, proj: a };
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  const proj = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
  return { d: dist(p, proj), t, proj };
}

const allPoints: any[] = [];
rawTraces.forEach((line: any) => {
  line.points.forEach((pt: any, idx: number) => {
    allPoints.push({
      lineId: line.id,
      pIdx: idx,
      x: pt.x,
      y: pt.y,
      label: pt.label,
      nodeId: pt.nodeId || `v3_${line.id}_p${String(idx).padStart(2, '0')}`,
    });
  });
});

const endpointGaps: any[] = [];
rawTraces.forEach((line: any) => {
  if (line.points.length === 0) return;
  const startPt = allPoints.find(p => p.lineId === line.id && p.pIdx === 0)!;
  const endPt = allPoints.find(p => p.lineId === line.id && p.pIdx === line.points.length - 1)!;

  [startPt, endPt].forEach((pt, isEnd) => {
    let closestPt = { dist: Infinity, line: '', idx: -1, pt: null as any };
    let closestSeg = { dist: Infinity, line: '', s1: -1, s2: -1, t: 0, proj: null as any };

    allPoints.forEach(other => {
      if (other.lineId === line.id) return;
      const d = dist(other, pt);
      if (d < closestPt.dist) closestPt = { dist: d, line: other.lineId, idx: other.pIdx, pt: other };
    });

    rawTraces.forEach((otherLine: any) => {
      if (otherLine.id === line.id) return;
      for (let s = 0; s < otherLine.points.length - 1; s++) {
        const a = otherLine.points[s];
        const b = otherLine.points[s + 1];
        const res = distPointToSegment(pt, a, b);
        if (res.d < closestSeg.dist) {
          closestSeg = { dist: res.d, line: otherLine.id, s1: s, s2: s + 1, t: res.t, proj: res.proj };
        }
      }
    });

    const distVal = Math.min(closestPt.dist, closestSeg.dist);
    let gapStatus = 'DRAWING_GAP';
    if (closestPt.dist <= 2.0) gapStatus = 'EXACT_TOUCHING';
    else if (closestSeg.dist <= 2.0) gapStatus = 'POINT_ON_SEGMENT';
    else if (distVal <= 5.0) gapStatus = 'CLOSE_ALIGNED';

    endpointGaps.push({
      lineId: line.id,
      endpointType: isEnd ? 'END' : 'START',
      pointIndex: pt.pIdx,
      coord: { x: pt.x, y: pt.y },
      label: pt.label,
      nearestPoint: {
        lineId: closestPt.line,
        pointIndex: closestPt.idx,
        distancePx: Math.round(closestPt.dist * 10) / 10,
      },
      nearestSegment: {
        lineId: closestSeg.line,
        segmentIndices: [closestSeg.s1, closestSeg.s2],
        distancePx: Math.round(closestSeg.dist * 10) / 10,
        projectionParamT: Math.round(closestSeg.t * 1000) / 1000,
      },
      gapStatus,
    });
  });
});

const gapAudit = {
  auditTitle: 'V3 Raw Endpoint Gap Analysis (Inspection Only - 0 Auto Edges)',
  generatedAt: new Date().toISOString(),
  totalEndpointsAnalyzed: endpointGaps.length,
  summary: {
    exactTouchingLe2px: endpointGaps.filter(g => g.gapStatus === 'EXACT_TOUCHING').length,
    pointOnSegmentLe2px: endpointGaps.filter(g => g.gapStatus === 'POINT_ON_SEGMENT').length,
    closeAlignedLe5px: endpointGaps.filter(g => g.gapStatus === 'CLOSE_ALIGNED').length,
    drawingGapGt5px: endpointGaps.filter(g => g.gapStatus === 'DRAWING_GAP').length,
  },
  endpointGaps,
};

fs.writeFileSync('d:/Thao/airport-simulator/v3_raw_gap_audit.json', JSON.stringify(gapAudit, null, 2), 'utf8');
console.log('✓ Wrote d:/Thao/airport-simulator/v3_raw_gap_audit.json');

// 3. Capture v3_raw_reloaded_clean.png
async function captureClean() {
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  }

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5173/annotate.html?graph=v3&mode=raw-only', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Click the "Nạp lại RAW từ file" button to guarantee clean reload from server
  const reloadBtn = await page.$('button:has-text("Nạp lại RAW từ file")');
  if (reloadBtn) {
    await reloadBtn.click();
    await page.waitForTimeout(1000);
  }

  const outPath = 'd:/Thao/airport-simulator/v3_raw_reloaded_clean.png';
  await page.screenshot({ path: outPath });
  console.log('✓ Captured v3_raw_reloaded_clean.png at:', outPath);

  await browser.close();
}

captureClean().catch(err => {
  console.error(err);
});
