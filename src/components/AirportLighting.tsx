// Lớp đèn sân bay ban đêm — TSN V3 (activeGraph /anhchinh.png).

import { memo, useMemo, type JSX } from 'react';
import type { AirportGraph, AirportEdge, AirportNode } from '../types';
import { airportGraphV3 } from '../data/airportGraph.v3';

interface Props {
  graph?: AirportGraph;
  isRunwayEmergencyRed?: boolean;
}

// ── Hằng số tinh chỉnh đèn ──────────────────────────────────────────────────
const RWY_HALF_WIDTH   = 10;    // nửa bề rộng đường băng
const RWY_EDGE_STEP    = 20;    // khoảng cách đèn viền runway
const RWY_EDGE_RADIUS  = 1.3;   // bán kính lõi đèn viền
const RWY_CTR_STEP     = 36;    // khoảng cách đèn tâm
const RWY_CTR_RADIUS   = 2.4;   // đèn tâm to hơn
const RWY_END_RADIUS   = 1.8;   // đèn đỏ cuối đường băng
const RWY_END_COUNT    = 7;     // số đèn trong hàng đèn cuối
const CAUTION_ZONE     = 0.15;  // % cuối mỗi chiều: đèn viền đổi VÀNG
const RED_ZONE         = 0.15;  // % cuối: đèn tâm toàn ĐỎ
const ALTERNATE_ZONE   = 0.30;  // % gần cuối: đèn tâm xen kẽ ĐỎ–TRẮNG

const TWY_STEP         = 28;    // khoảng cách đèn mép taxiway
const TWY_OFFSET       = 3.5;   // offset vuông góc từ tim ra mỗi mép
const TWY_RADIUS       = 1.1;   // bán kính lõi đèn xanh
const TWY_MIN_EDGE_LEN = 16;    // edge ngắn hơn ngưỡng này thì bỏ, tránh chồng chập

const HALO_SCALE       = 3.8;
const HALO_OPACITY     = 0.75;
const HALO_BLUR        = 2;
const CORE_BLUR        = 0.5;

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
  r: number;
  color: LightColor;
}

function getNode(graph: AirportGraph, id: string): AirportNode | undefined {
  return graph.nodes.find(n => n.id === id);
}

function isApronEdge(edge: AirportEdge): boolean {
  const touchesStand = (id: string) =>
    id.startsWith('DOM_S') || id.startsWith('INTL_S') || /^P\d/.test(id) || id === 'T49' || id.includes('STAND') || id.startsWith('v3_line_29') || id.startsWith('v3_line_30');
  return edge.type === 'apron' || touchesStand(edge.fromNodeId) || touchesStand(edge.toNodeId);
}

// Tìm các cặp đầu đường băng trong graph V3
function getRunwayThresholds(graph: AirportGraph): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  const v3_07l = graph.nodes.find(n => n.id === 'v3_line_01_p00' || n.label === '07L' || n.id === 'RWY07L_THR');
  const v3_25r = graph.nodes.find(n => n.id === 'v3_line_01_p03' || n.label === 'STOP BAR 25R' || n.id === 'RWY25R_THR');
  if (v3_07l && v3_25r) pairs.push([v3_07l.id, v3_25r.id]);

  const v3_07r = graph.nodes.find(n => n.id === 'v3_line_05_p00' || n.label === '07R' || n.id === 'RWY07R_THR');
  const v3_25l = graph.nodes.find(n => n.id === 'v3_line_05_p07' || n.id === 'v3_line_17_p16' || n.label === 'STOP BAR 25L' || n.id === 'RWY25L_THR');
  if (v3_07r && v3_25l) pairs.push([v3_07r.id, v3_25l.id]);

  return pairs;
}

// ── Sinh toàn bộ vị trí đèn tĩnh từ graph hiện tại ───────────────────────────
function buildLights(graph: AirportGraph, isRunwayEmergencyRed: boolean = false): LightPoint[] {
  const lights: LightPoint[] = [];

  // 1. RUNWAY — viền, tâm, và hàng đèn cuối
  const thresholds = getRunwayThresholds(graph);
  for (const [fromId, toId] of thresholds) {
    const a = getNode(graph, fromId);
    const b = getNode(graph, toId);
    if (!a || !b) continue;

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len < 50) continue;

    const ux = dx / len;
    const uy = dy / len;
    const nx = -uy * RWY_HALF_WIDTH;
    const ny = ux * RWY_HALF_WIDTH;

    // Đèn viền 2 mép
    const countEdge = Math.floor(len / RWY_EDGE_STEP);
    for (let i = 0; i <= countEdge; i++) {
      const t = i / countEdge;
      const cx = a.x + dx * t;
      const cy = a.y + dy * t;
      const distEnd = Math.min(t, 1 - t);
      const color: LightColor = distEnd < CAUTION_ZONE ? 'yellow' : 'white';

      lights.push({ x: cx + nx, y: cy + ny, r: RWY_EDGE_RADIUS, color });
      lights.push({ x: cx - nx, y: cy - ny, r: RWY_EDGE_RADIUS, color });
    }

    // Đèn tâm (Chấm tròn phát quang trên tim đường băng)
    const countCenter = Math.floor(len / RWY_CTR_STEP);
    for (let i = 1; i < countCenter; i++) {
      const t = i / countCenter;
      const cx = a.x + dx * t;
      const cy = a.y + dy * t;
      const distEnd = Math.min(t, 1 - t);
      let color: LightColor = 'white';

      if (isRunwayEmergencyRed) {
        // Khi khẩn nguy: toàn bộ chấm đèn tim 2 đường băng chuyển sang màu ĐỎ
        color = 'red';
      } else {
        if (distEnd < RED_ZONE) color = 'red';
        else if (distEnd < ALTERNATE_ZONE) color = i % 2 === 0 ? 'red' : 'white';
      }

      lights.push({ x: cx, y: cy, r: RWY_CTR_RADIUS, color });
    }

    // Đèn đỏ 2 đầu đường băng
    for (const pt of [a, b]) {
      for (let i = 0; i < RWY_END_COUNT; i++) {
        const factor = (i / (RWY_END_COUNT - 1)) * 2 - 1;
        lights.push({ x: pt.x + nx * factor, y: pt.y + ny * factor, r: RWY_END_RADIUS, color: 'red' });
      }
    }
  }

  // 2. TAXIWAY — đèn xanh dương 2 mép theo từng edge
  const step = TWY_STEP;
  for (const edge of graph.edges) {
    if (edge.type === 'runway') continue;
    if (isApronEdge(edge)) continue; // apron để tối

    const from = getNode(graph, edge.fromNodeId);
    const to   = getNode(graph, edge.toNodeId);
    if (!from || !to) continue;

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy);
    if (len < TWY_MIN_EDGE_LEN) continue;

    const nx = (-dy / len) * TWY_OFFSET;
    const ny = (dx / len) * TWY_OFFSET;
    const count = Math.max(1, Math.round(len / step));

    for (let i = 1; i < count; i++) {
      const t = i / count;
      const cx = from.x + dx * t;
      const cy = from.y + dy * t;
      lights.push({ x: cx - nx, y: cy - ny, r: TWY_RADIUS, color: 'blue' });
      lights.push({ x: cx + nx, y: cy + ny, r: TWY_RADIUS, color: 'blue' });
    }
  }

  return lights;
}

function AirportLighting({ graph = airportGraphV3, isRunwayEmergencyRed = false }: Props) {
  const currentGraph = graph || airportGraphV3;
  const lights = useMemo(() => buildLights(currentGraph, isRunwayEmergencyRed), [currentGraph, isRunwayEmergencyRed]);

  const halos: JSX.Element[] = lights.map((l, i) => (
    <circle
      key={`halo-${i}`}
      cx={l.x} cy={l.y} r={l.r * HALO_SCALE}
      fill={`url(#nl-halo-${l.color})`}
    />
  ));
  const cores: JSX.Element[] = lights.map((l, i) => (
    <circle key={`core-${i}`} cx={l.x} cy={l.y} r={l.r} fill={LIGHT_COLORS[l.color]} />
  ));

  return (
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
      </defs>

      {/* Lớp đèn lung linh ban đêm */}
      <g filter="url(#nl-halo-blur)" opacity={HALO_OPACITY}>{halos}</g>
      <g filter="url(#nl-core-blur)">{cores}</g>
    </g>
  );
}

export default memo(AirportLighting);
