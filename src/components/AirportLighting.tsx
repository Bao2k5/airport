// Lớp đèn sân bay ban đêm — RENDER TĨNH, chỉ hiển thị khi timeOfDay = 'night'.
// Gồm 2 phần, vẽ từ dưới lên: (0) MẶT ĐƯỜNG dải xám tối để thấy hình dáng
// runway/taxiway, (1) ĐÈN — mỗi đèn 2 lớp: quầng glow mờ (radialGradient + blur)
// bên dưới + lõi nhỏ sáng rực bên trên → lung linh như đèn thật.
// Z-order tổng thể (do AirportMap sắp xếp): mặt đường → đèn tĩnh (đây) →
// route/lightStates động → máy bay.
//
// Đặc tả (theo chuẩn hàng không, tính theo % chiều dài vì bản đồ NOT TO SCALE):
//   RUNWAY : đèn viền TRẮNG khít 2 mép (vàng ~15% cuối mỗi chiều),
//            đèn tâm TRẮNG to & thưa (xen kẽ đỏ–trắng 15–30% gần cuối,
//            toàn ĐỎ 15% cuối), hàng đèn ĐỎ vuông góc ở 2 vạch kết thúc.
//   TAXIWAY: đèn mép XANH DƯƠNG 2 bên, thưa hơn viền runway.
//   APRON  : dải tối mờ hơn, không rải đèn (edge chạm DOM_S*/INTL_S*/P*).
//
// Hình học tính MỘT LẦN từ airportGraph (useMemo + memo) — không đụng simulation.

import { memo, useMemo, type JSX } from 'react';
import { airportGraph, getNode } from '../data/airportGraph';
import type { AirportEdge } from '../types';

// ── Hằng số tinh chỉnh (mật độ / độ sáng / kích thước đèn) ───────────────────
// RUNWAY: đèn tâm phải TO & THƯA hơn đèn viền rõ rệt (spacing tâm ≈ 2× viền).
const RWY_HALF_WIDTH   = 12;    // nửa bề rộng đường băng (khớp stroke 26 của map)
const RWY_EDGE_STEP    = 15;    // khoảng cách đèn viền runway (giãn cho thoáng)
const RWY_EDGE_RADIUS  = 1.3;   // bán kính lõi đèn viền
const RWY_CTR_STEP     = 30;    // khoảng cách đèn tâm ≈ 2× viền (thưa rõ rệt)
const RWY_CTR_RADIUS   = 2.6;   // đèn tâm TO hơn đèn viền rõ rệt
const RWY_END_RADIUS   = 1.8;   // đèn đỏ cuối đường băng
const RWY_END_COUNT    = 7;     // số đèn trong hàng đèn cuối (vuông góc)
const CAUTION_ZONE     = 0.15;  // % cuối mỗi chiều: đèn viền đổi VÀNG
const RED_ZONE         = 0.15;  // % cuối: đèn tâm toàn ĐỎ
const ALTERNATE_ZONE   = 0.30;  // % gần cuối: đèn tâm xen kẽ ĐỎ–TRẮNG

const TWY_STEP         = 24;    // khoảng cách đèn mép taxiway (thưa để đỡ rối)
const TWY_OFFSET       = 3.5;   // offset vuông góc từ tim ra mỗi mép
const TWY_RADIUS       = 1.2;   // bán kính lõi đèn xanh
const TWY_MIN_EDGE_LEN = 14;    // edge ngắn hơn ngưỡng này thì bỏ, tránh chồng chập

// ── Mặt đường (pavement) — dải xám vẽ DƯỚI đèn để thấy hình dáng đường ────────
// Bề rộng = 2× offset đèn viền → đèn viền ôm SÁT hai mép, không lọt trong/ngoài.
const RUNWAY_PAVE      = '#2a3140'; // runway: hơi sáng hơn taxiway
const TAXIWAY_PAVE     = '#232a38'; // taxiway: tối hơn runway
const APRON_PAVE       = '#141824'; // apron: mờ nhất, không rải đèn
const PAVE_EDGE_STROKE = '#0c1017'; // viền mảnh tối quanh dải cho cạnh sắc nét
const PAVE_OUTLINE     = 1.4;       // độ dày viền lòi ra mỗi bên dải
const RWY_PAVE_WIDTH   = 2 * RWY_HALF_WIDTH + 2; // đèn viền runway sát 2 mép
const TWY_PAVE_WIDTH   = 2 * TWY_OFFSET + 1;      // đèn mép taxiway sát 2 mép
const APRON_PAVE_WIDTH = 2 * TWY_OFFSET + 1;      // dải apron rộng như taxiway

// ── Glow nền "đường tự phát sáng" — bản sao dải RỘNG HƠN, xanh-navy sáng hơn
//    nền, BLUR mạnh, opacity thấp → toàn tuyến sáng lên nhẹ, liếc là thấy ngay.
const ROAD_GLOW_COLOR    = '#2b3a52'; // xanh-navy sáng hơn nền #0a0e18
const ROAD_GLOW_OPACITY  = 0.4;       // độ mờ glow runway/taxiway
const APRON_GLOW_OPACITY = 0.25;      // apron glow mờ hơn (vùng đỗ)
const ROAD_GLOW_BLUR     = 4.5;       // stdDeviation lớn → quầng lan rộng
const ROAD_GLOW_EXTRA    = 6;         // glow rộng hơn mặt đường bao nhiêu (mỗi bên ×0.5)

// ── Centerline taxiway — nét mảnh xanh nhạt dọc tim giúp lần theo tuyến ───────
const TWY_CENTERLINE_COLOR   = '#3d5a80';
const TWY_CENTERLINE_OPACITY = 0.5;
const TWY_CENTERLINE_WIDTH   = 0.8;

// ── Glow: halo = vòng lớn mờ (bán kính gấp HALO_SCALE lần lõi) + blur, nằm dưới
//    lõi nhỏ sáng rực. Chỉnh 4 hằng số này để tăng/giảm độ lung linh.
const HALO_SCALE       = 4;     // bán kính quầng glow = lõi × hệ số này (3–4)
const HALO_OPACITY     = 0.75;  // độ mờ tổng của lớp halo
const HALO_BLUR        = 2;     // stdDeviation của feGaussianBlur cho halo bleed
const CORE_BLUR        = 0.5;   // blur rất nhẹ cho lõi → sáng rực, đỡ cứng cạnh

// Màu đèn — trắng ám ấm nhẹ cho tự nhiên
const LIGHT_COLORS = {
  white:  '#fff6e0',
  yellow: '#ffd60a',
  red:    '#ff3b30',
  blue:   '#4d9bff',
} as const;

type LightColor = keyof typeof LIGHT_COLORS;

interface LightPoint {
  x: number;
  y: number;
  r: number;        // bán kính lõi
  color: LightColor;
}

type StripKind = 'runway' | 'taxiway' | 'apron';

interface Strip {
  x1: number; y1: number; x2: number; y2: number;
  width: number;    // bề rộng dải mặt đường
  fill: string;     // màu mặt đường
  kind: StripKind;  // quyết định glow opacity + có vẽ centerline không
}

// 2 đường băng nằm ngang, hình học lấy từ node threshold
const RUNWAY_THRESHOLDS: Array<[string, string]> = [
  ['RWY07L_THR', 'RWY25R_THR'], // đường băng bắc 07L/25R
  ['RWY07R_THR', 'RWY25L_THR'], // đường băng nam 07R/25L
];

// Apron/sân đỗ: edge chạm stand hoặc parking position → để tối, không rải đèn
function isApronEdge(edge: AirportEdge): boolean {
  const touchesStand = (id: string) =>
    id.startsWith('DOM_S') || id.startsWith('INTL_S') || /^P\d/.test(id);
  return edge.type === 'apron' || touchesStand(edge.fromNodeId) || touchesStand(edge.toNodeId);
}

// ── Sinh dải mặt đường từ airportGraph ───────────────────────────────────────
// Thứ tự trả về = thứ tự vẽ: apron (tối nhất, dưới) → taxiway → runway (trên).
function buildPavement(): Strip[] {
  const apron: Strip[] = [];
  const taxi: Strip[]  = [];

  for (const edge of airportGraph.edges) {
    if (edge.type === 'runway') continue;
    const from = getNode(edge.fromNodeId);
    const to   = getNode(edge.toNodeId);
    if (!from || !to) continue;
    const strip: Strip = isApronEdge(edge)
      ? { x1: from.x, y1: from.y, x2: to.x, y2: to.y, width: APRON_PAVE_WIDTH, fill: APRON_PAVE, kind: 'apron' }
      : { x1: from.x, y1: from.y, x2: to.x, y2: to.y, width: TWY_PAVE_WIDTH,  fill: TAXIWAY_PAVE, kind: 'taxiway' };
    (isApronEdge(edge) ? apron : taxi).push(strip);
  }

  const runway: Strip[] = [];
  for (const [fromId, toId] of RUNWAY_THRESHOLDS) {
    const a = getNode(fromId);
    const b = getNode(toId);
    if (!a || !b) continue;
    runway.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, width: RWY_PAVE_WIDTH, fill: RUNWAY_PAVE, kind: 'runway' });
  }

  return [...apron, ...taxi, ...runway];
}

// ── Sinh toàn bộ vị trí đèn tĩnh từ airportGraph ─────────────────────────────
function buildLights(): LightPoint[] {
  const lights: LightPoint[] = [];

  // RUNWAY — viền, tâm, và hàng đèn cuối
  for (const [fromId, toId] of RUNWAY_THRESHOLDS) {
    const a = getNode(fromId);
    const b = getNode(toId);
    if (!a || !b) continue;
    const xL = Math.min(a.x, b.x), xR = Math.max(a.x, b.x), cy = a.y;
    const span = xR - xL;

    // 1. Đèn viền: trắng khít 2 mép, vàng ở CAUTION_ZONE cuối mỗi chiều
    for (let x = xL; x <= xR + 0.1; x += RWY_EDGE_STEP) {
      const distEnd = Math.min((x - xL) / span, (xR - x) / span);
      const color: LightColor = distEnd < CAUTION_ZONE ? 'yellow' : 'white';
      lights.push({ x, y: cy - RWY_HALF_WIDTH, r: RWY_EDGE_RADIUS, color });
      lights.push({ x, y: cy + RWY_HALF_WIDTH, r: RWY_EDGE_RADIUS, color });
    }

    // 2. Đèn tâm: to & thưa; trắng → xen kẽ đỏ–trắng → toàn đỏ về cuối
    let idx = 0;
    for (let x = xL + RWY_CTR_STEP; x < xR - RWY_CTR_STEP * 0.5; x += RWY_CTR_STEP, idx++) {
      const distEnd = Math.min((x - xL) / span, (xR - x) / span);
      let color: LightColor = 'white';
      if (distEnd < RED_ZONE) color = 'red';
      else if (distEnd < ALTERNATE_ZONE) color = idx % 2 === 0 ? 'red' : 'white';
      lights.push({ x, y: cy, r: RWY_CTR_RADIUS, color });
    }

    // 3. Đèn cuối đường băng: hàng đèn đỏ vuông góc ngay vạch kết thúc (2 đầu)
    for (const x of [xL, xR]) {
      for (let i = 0; i <= RWY_END_COUNT - 1; i++) {
        const y = cy - RWY_HALF_WIDTH + (2 * RWY_HALF_WIDTH * i) / (RWY_END_COUNT - 1);
        lights.push({ x, y, r: RWY_END_RADIUS, color: 'red' });
      }
    }
  }

  // TAXIWAY — đèn xanh dương 2 mép, rải đều dọc edge, offset vuông góc
  for (const edge of airportGraph.edges) {
    if (edge.type === 'runway') continue;
    if (isApronEdge(edge)) continue; // apron để tối
    const from = getNode(edge.fromNodeId);
    const to   = getNode(edge.toNodeId);
    if (!from || !to) continue;
    const dx = to.x - from.x, dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < TWY_MIN_EDGE_LEN) continue;
    const nx = (-dy / len) * TWY_OFFSET, ny = (dx / len) * TWY_OFFSET;
    const count = Math.max(1, Math.round(len / TWY_STEP));
    // Bỏ 2 đầu mút (i=0 và i=count) để đèn không dồn đống tại node dùng chung
    for (let i = 1; i < count; i++) {
      const t = i / count;
      const cx = from.x + dx * t, cyy = from.y + dy * t;
      lights.push({ x: cx - nx, y: cyy - ny, r: TWY_RADIUS, color: 'blue' });
      lights.push({ x: cx + nx, y: cyy + ny, r: TWY_RADIUS, color: 'blue' });
    }
  }

  return lights;
}

function AirportLighting() {
  // Hình học tĩnh — tính một lần, không tính lại mỗi frame RAF
  const pavement = useMemo(() => buildPavement(), []);
  const lights   = useMemo(() => buildLights(), []);

  // Glow nền: bản sao dải RỘNG HƠN, blur mạnh → toàn tuyến phát sáng nhẹ.
  const roadGlow: JSX.Element[] = pavement.map((s, i) => (
    <line
      key={i}
      x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
      stroke={ROAD_GLOW_COLOR} strokeWidth={s.width + ROAD_GLOW_EXTRA}
      strokeLinecap="round" strokeLinejoin="round"
      opacity={s.kind === 'apron' ? APRON_GLOW_OPACITY : ROAD_GLOW_OPACITY}
    />
  ));

  // Centerline: nét mảnh dọc tim, CHỈ cho taxiway (runway đã có đèn tâm).
  const centerlines: JSX.Element[] = pavement
    .filter(s => s.kind === 'taxiway')
    .map((s, i) => (
      <line
        key={i}
        x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
        stroke={TWY_CENTERLINE_COLOR} strokeWidth={TWY_CENTERLINE_WIDTH}
        strokeLinecap="round" opacity={TWY_CENTERLINE_OPACITY}
      />
    ));

  // Mặt đường: 2 lượt — viền tối (rộng hơn) dưới, rồi màu dải trên → cạnh sắc.
  const paveOutline: JSX.Element[] = pavement.map((s, i) => (
    <line
      key={i}
      x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
      stroke={PAVE_EDGE_STROKE} strokeWidth={s.width + PAVE_OUTLINE * 2}
      strokeLinecap="round" strokeLinejoin="round"
    />
  ));
  const paveFill: JSX.Element[] = pavement.map((s, i) => (
    <line
      key={i}
      x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
      stroke={s.fill} strokeWidth={s.width}
      strokeLinecap="round" strokeLinejoin="round"
    />
  ));

  // Vẽ 2 lượt: TẤT CẢ halo (nhóm có blur, dưới cùng) rồi TẤT CẢ lõi (trên cùng).
  // Tách nhóm để: (a) lõi không che mất halo của chính nó, (b) blur chỉ apply 1
  // lần cho cả nhóm halo → glow bleed rõ mà vẫn nhẹ cho ~1.000+ đèn.
  const halos: JSX.Element[] = lights.map((l, i) => (
    <circle
      key={i}
      cx={l.x} cy={l.y} r={l.r * HALO_SCALE}
      fill={`url(#nl-halo-${l.color})`}
    />
  ));
  const cores: JSX.Element[] = lights.map((l, i) => (
    <circle key={i} cx={l.x} cy={l.y} r={l.r} fill={LIGHT_COLORS[l.color]} />
  ));

  return (
    // geometricPrecision để quầng tròn mượt (svg cha đang crispEdges)
    <g pointerEvents="none" shapeRendering="geometricPrecision">
      <defs>
        {(Object.keys(LIGHT_COLORS) as LightColor[]).map(c => (
          <radialGradient key={c} id={`nl-halo-${c}`}>
            <stop offset="0%"   stopColor={LIGHT_COLORS[c]} stopOpacity={0.9} />
            <stop offset="45%"  stopColor={LIGHT_COLORS[c]} stopOpacity={0.35} />
            <stop offset="100%" stopColor={LIGHT_COLORS[c]} stopOpacity={0} />
          </radialGradient>
        ))}
        <filter id="nl-halo-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={HALO_BLUR} />
        </filter>
        <filter id="nl-core-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={CORE_BLUR} />
        </filter>
        <filter id="nl-road-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={ROAD_GLOW_BLUR} />
        </filter>
      </defs>
      {/* Lớp 0a: glow nền (dưới cùng) — quầng sáng lan khiến toàn tuyến "phát sáng" */}
      <g filter="url(#nl-road-glow)">{roadGlow}</g>
      {/* Lớp 0b: mặt đường — viền tối rồi màu dải */}
      <g>{paveOutline}</g>
      <g>{paveFill}</g>
      {/* Lớp 0c: centerline taxiway — giúp lần theo tuyến khi đèn thưa */}
      <g>{centerlines}</g>
      {/* Lớp 1: quầng glow mờ, blur mềm */}
      <g filter="url(#nl-halo-blur)" opacity={HALO_OPACITY}>{halos}</g>
      {/* Lớp 2: lõi sáng rực, blur rất nhẹ, nằm trên */}
      <g filter="url(#nl-core-blur)">{cores}</g>
    </g>
  );
}

// memo: component không có props — không re-render theo vòng lặp RAF của App
export default memo(AirportLighting);
