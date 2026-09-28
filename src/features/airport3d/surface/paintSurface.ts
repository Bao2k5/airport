import type { AirportGraph } from '../../../types';
import { AIRPORT_VISUAL as COLORS } from '../visualTokens';
import { getPaths, getSegments, isStand, worldPoint, SURFACE_SIZE, type Segment, type Point } from './geometry';

// A graph-generated pavement atlas combines intersecting strips on ONE plane.
// It is not a reference photograph: aircraft, lamps and camera remain live 3D.
export function paintSurface(graph: AirportGraph, resolution: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = resolution;
  canvas.height = Math.round(resolution * SURFACE_SIZE.depth / SURFACE_SIZE.width);
  const ctx = canvas.getContext('2d')!;
  const scale = resolution / SURFACE_SIZE.width;
  ctx.scale(scale, scale);
  ctx.translate(SURFACE_SIZE.width / 2, SURFACE_SIZE.depth / 2);
  const segments = getSegments(graph);
  const runways = segments.filter(s => s.edge.type === 'runway');
  const taxiways = segments.filter(s => s.edge.type !== 'runway');
  const stands = graph.nodes.filter(isStand);
  const standPoints = stands.map(worldPoint);
  function line(a: Point, b: Point, width: number, color: string) {
    ctx.lineWidth = width; ctx.strokeStyle = color;
    ctx.beginPath(); ctx.moveTo(a.x, a.z); ctx.lineTo(b.x, b.z); ctx.stroke();
  }
  function paths(items: Segment[], width: number, color: string) {
    ctx.lineWidth = width; ctx.strokeStyle = color;
    for (const path of getPaths(items)) {
      ctx.beginPath(); ctx.moveTo(path[0].a.x, path[0].a.z);
      path.forEach(part => ctx.lineTo(part.b.x, part.b.z)); ctx.stroke();
    }
  }
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (standPoints.length) {
    const left = Math.min(...standPoints.map(p => p.x)) - 2.8, top = Math.min(...standPoints.map(p => p.z)) - 2.8;
    const width = Math.max(...standPoints.map(p => p.x)) - left + 2.8;
    const depth = Math.max(...standPoints.map(p => p.z)) - top + 2.8;
    ctx.fillStyle = '#85898a'; ctx.fillRect(left, top, width, depth);
    ctx.strokeStyle = '#777c7d'; ctx.lineWidth = 0.018;
    for (let x = left; x <= left + width; x += 2) { ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, top + depth); ctx.stroke(); }
    for (let z = top; z <= top + depth; z += 2) { ctx.beginPath(); ctx.moveTo(left, z); ctx.lineTo(left + width, z); ctx.stroke(); }
  }
  for (const segment of taxiways.filter(s => !s.apron)) line(segment.a, segment.b, segment.width + 0.18, '#656a6b');
  for (const segment of taxiways.filter(s => !s.apron)) line(segment.a, segment.b, segment.width, COLORS.taxiwaySurface);
  // Stand approaches are paint on the apron, not separate raised black roads.
  paths(taxiways, 0.055, COLORS.taxiwayMarking);
  for (const stand of stands) {
    const p = worldPoint(stand);
    const approach = taxiways.find(s => s.edge.fromNodeId === stand.id || s.edge.toNodeId === stand.id);
    if (!approach) continue;
    const dx = (approach.b.x - approach.a.x) / approach.length;
    const dz = (approach.b.z - approach.a.z) / approach.length;
    line({ x: p.x - dz * 0.45, z: p.z + dx * 0.45 }, { x: p.x + dz * 0.45, z: p.z - dx * 0.45 }, 0.065, COLORS.standMarking);
    // Surface paint, aligned with the existing stand approach; no new route.
    ctx.save();
    ctx.translate(p.x, p.z);
    ctx.rotate(Math.atan2(dz, dx) - Math.PI / 2);
    ctx.fillStyle = '#292d2e';
    ctx.fillRect(-0.46, 0.3, 0.92, 0.42);
    ctx.fillStyle = COLORS.standMarking;
    ctx.font = 'bold 0.31px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(stand.label.replace(/^STAND[_ -]?/i, ''), 0, 0.51, 0.84);
    ctx.restore();
  }
  // Runway fill masks taxiway lines at runway crossings. The runway dashes share
  // one phase over each connected runway, including very short graph segments.
  ctx.lineCap = 'butt';
  paths(runways, 5.2, COLORS.runwaySurface);
  ctx.setLineDash([1.35, 1.85]);
  paths(runways, 0.12, COLORS.runwayMarking);
  ctx.setLineDash([]);
  // Clip side markings at open junction mouths using the actual pavement union.
  for (const path of getPaths(runways)) {
    for (const part of path) {
      const s = part.segment, dx = (s.b.x - s.a.x) / s.length, dz = (s.b.z - s.a.z) / s.length;
      for (const side of [-1, 1]) {
        // Sample tiny paint intervals; never draw across another pavement strip.
        const count = Math.ceil(s.length / 0.08);
        for (let i = 0; i < count; i++) {
          const t = (i + 0.5) / count;
          const p = { x: s.a.x + dx * s.length * t - dz * side * 2.25, z: s.a.z + dz * s.length * t + dx * side * 2.25 };
          const inJunction = taxiways.some(other => {
            const vx = other.b.x - other.a.x, vz = other.b.z - other.a.z;
            const u = Math.max(0, Math.min(1, ((p.x - other.a.x) * vx + (p.z - other.a.z) * vz) / other.length ** 2));
            return Math.hypot(p.x - other.a.x - vx * u, p.z - other.a.z - vz * u) < other.width / 2;
          });
          if (!inJunction) line({ x: p.x - dx * s.length / count / 2, z: p.z - dz * s.length / count / 2 }, { x: p.x + dx * s.length / count / 2, z: p.z + dz * s.length / count / 2 }, 0.075, COLORS.runwayMarking);
        }
      }
    }
  }
  // Fine, deterministic pavement grain; no geometry, cracks or extra lines.
  const grain = document.createElement('canvas'); grain.width = grain.height = 64;
  const grainCtx = grain.getContext('2d')!;
  const pixels = grainCtx.createImageData(64, 64);
  let seed = 12345;
  for (let i = 0; i < pixels.data.length; i += 4) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const v = 80 + seed % 150;
    pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = v;
    pixels.data[i + 3] = 255;
  }
  grainCtx.putImageData(pixels, 0, 0);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-atop'; ctx.globalAlpha = 0.07;
  const pattern = ctx.createPattern(grain, 'repeat');
  if (pattern) { ctx.fillStyle = pattern; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  ctx.restore();
  return canvas;
}
