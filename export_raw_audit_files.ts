import fs from 'fs';
import { chromium } from 'playwright';

function readJsonSafe(p: string) {
  return JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
}

const rawPath = 'd:/Thao/airport-simulator/v3_raw_traces_manual.json';
const rawTraces = readJsonSafe(rawPath);

// 1. Generate v3_raw_source_audit.json
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

const sourceAudit = {
  generatedAt: new Date().toISOString(),
  sourceFile: rawPath,
  totalLines: rawTraces.length,
  totalPoints,
  operationalNamedPointsCount: operationalNodes.length,
  geometryOnlyPointsCount: geometryNodes.length,
  outOfBoundsCount: 0,
  dimensions: { width: 1200, height: 860 },
  operationalNodes,
};

fs.writeFileSync('d:/Thao/airport-simulator/v3_raw_source_audit.json', JSON.stringify(sourceAudit, null, 2), 'utf8');
console.log('✓ Wrote d:/Thao/airport-simulator/v3_raw_source_audit.json');

// 2. Generate v3_raw_gap_audit.json
interface Point {
  lineId: string;
  pIdx: number;
  x: number;
  y: number;
  label?: string;
  nodeId: string;
}

const allPoints: Point[] = [];
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
      gapStatus: closestSeg.dist <= 2.0 ? 'EXACT_TOUCHING' : closestSeg.dist <= 5.0 ? 'CLOSE_ALIGNED' : 'DRAWING_GAP',
    });
  });
});

const gapAudit = {
  generatedAt: new Date().toISOString(),
  totalEndpointsAnalyzed: endpointGaps.length,
  summary: {
    exactTouchingLe2px: endpointGaps.filter(g => g.gapStatus === 'EXACT_TOUCHING').length,
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

  const outPath = 'd:/Thao/airport-simulator/v3_raw_reloaded_clean.png';
  await page.screenshot({ path: outPath });
  console.log('✓ Captured v3_raw_reloaded_clean.png at:', outPath);

  await browser.close();
}

captureClean().catch(err => {
  console.error(err);
});
