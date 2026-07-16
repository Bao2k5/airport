// Find left endpoint (M1 spine) and right endpoint (DOM stand) of pink band at each y level.
// Also find P-stand right endpoints.
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 6160, height: 3200 });
await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(800);

await page.evaluate(() => {
  for (const b of document.querySelectorAll('button'))
    if (b.textContent.trim() === 'Pink') { b.click(); break; }
});
await page.waitForTimeout(300);
await page.evaluate(() => {
  const s = document.querySelector('input[type=range]');
  if (s) { Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(s,'0.85'); s.dispatchEvent(new Event('input',{bubbles:true})); }
});
await page.waitForTimeout(400);

const SVG_SX = 5840/1200, SVG_SY = 3000/860, SVG_OY = 200;
const toScreen = (sx, sy) => ({ x: Math.round(sx * SVG_SX), y: Math.round(sy * SVG_SY + SVG_OY) });
const isPink = (r, g, b) => r > 180 && g < 160 && b > 120 && r > b && r > g + 50;
const CALIB_ERR = 5; // pink appears +5 SVG units right of truth

const scanRow = async (xMin, xMax, svgY, label) => {
  const scr = toScreen(xMin, svgY);
  const scW = Math.round((xMax - xMin) * SVG_SX);
  const stripH = Math.round(3 * SVG_SY);
  const clip = { x: scr.x, y: scr.y - stripH, width: scW, height: stripH * 2 + 1 };
  const buf = await page.screenshot({ clip });

  const res = await page.evaluate(async ({ imgData, isPinkStr, xMin, xMax }) => {
    const isPink = eval(isPinkStr);
    const img = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + imgData; });
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    c.getContext('2d').drawImage(img, 0, 0);
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    const sums = new Array(img.width).fill(0);
    for (let row = 0; row < img.height; row++)
      for (let col = 0; col < img.width; col++) {
        const i = (row * img.width + col) * 4;
        if (isPink(d[i], d[i+1], d[i+2])) sums[col]++;
      }
    const total = sums.reduce((a, b) => a + b, 0);
    if (total === 0) return { total: 0, left: null, right: null, peak: null };
    const svgPer = (xMax - xMin) / img.width;
    const left  = xMin + sums.findIndex(v => v > 0) * svgPer;
    const right = xMin + (img.width - 1 - [...sums].reverse().findIndex(v => v > 0)) * svgPer;
    const peak  = xMin + sums.indexOf(Math.max(...sums)) * svgPer;
    const com   = xMin + sums.reduce((a, v, i) => a + v * i, 0) / total * svgPer;
    return { total, left, right, peak, com };
  }, { imgData: buf.toString('base64'), isPinkStr: isPink.toString(), xMin, xMax });

  const adj = v => v != null ? Math.round(v - CALIB_ERR) : null;
  return { label, svgY, total: res.total, left: adj(res.left), right: adj(res.right), peak: adj(res.peak), com: adj(res.com) };
};

console.log('label          y    left   peak   right  total');
console.log('─────────────────────────────────────────────');

// M1 spine + DOM stand rows
const rows = [
  { label: 'M1_P3/P3',    y: 273 },  // P3 and M1_P3 at same y
  { label: 'M1_N/DOM_S5', y: 298 },
  { label: 'M1_P2',       y: 320 },
  { label: 'M1_P1/P1',    y: 348 },
  { label: 'M1_1/DOM_S4', y: 387 },
  { label: 'P4/M1_2',     y: 452 },
  { label: 'M1_2/DOM_S3', y: 436 },
  { label: 'P5/M1_3',     y: 518 },
  { label: 'M1_3/DOM_S2', y: 506 },
  { label: 'M1_S/DOM_S1', y: 571 },
];

const results = [];
for (const { label, y } of rows) {
  const r = await scanRow(440, 870, y, label);
  results.push(r);
  const fmt = v => v != null ? String(v).padStart(6) : '    --';
  console.log(`${label.padEnd(16)} ${y}  ${fmt(r.left)} ${fmt(r.peak)} ${fmt(r.right)} ${String(r.total).padStart(6)}`);
}

// Also scan NS_S connector at y=220 to verify NS position
const ns = await scanRow(540, 680, 220, 'NS_S check');
console.log(`\n${ns.label.padEnd(16)} ${ns.svgY}  left=${ns.left} peak=${ns.peak} right=${ns.right}`);

console.log('\n=== RECOMMENDED NODE POSITIONS ===');
const map = Object.fromEntries(results.map(r => [r.label, r]));
console.log(`M1_P3:  x=${map['M1_P3/P3']?.left}  (M1 left edge)   P3: x=${map['M1_P3/P3']?.right}`);
console.log(`M1_N:   x=${map['M1_N/DOM_S5']?.left}  DOM_S5: x=${map['M1_N/DOM_S5']?.right}`);
console.log(`M1_P1:  x=${map['M1_P1/P1']?.left}  P1: x=${map['M1_P1/P1']?.right}`);
console.log(`M1_2:   x=${map['M1_2/DOM_S3']?.left}  DOM_S3: x=${map['M1_2/DOM_S3']?.right}`);
console.log(`M1_S:   x=${map['M1_S/DOM_S1']?.left}  DOM_S1: x=${map['M1_S/DOM_S1']?.right}`);

await browser.close();
