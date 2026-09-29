import type { Aircraft, AirportGraph, FlightMotion } from '../types';

/** Educational timing/height only. Coordinates always derive from graph. */
export const FLIGHT_ANIMATION = {
  approachSeconds: 28,
  flareSeconds: 6,
  rolloutSeconds: 14,
  lineupSeconds: 1,
  rollSeconds: 12,
  rotateSeconds: 3,
  climbSeconds: 12,
  approachDistanceSvg: 300,
  flareDistanceSvg: 45,
  cruiseHeightWorld: 12
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);

export function createFlightMotion(aircraft: Aircraft, graph: AirportGraph, kind: FlightMotion['kind']): FlightMotion | undefined {
  const node = graph.nodes.find(n => n.id === (kind === 'arrival' ? aircraft.assignedRoute[0] : aircraft.currentNodeId));
  if (!node) return;
  const segments = graph.edges.filter(e => e.type === 'runway').flatMap(edge => {
    const a = graph.nodes.find(n => n.id === edge.fromNodeId), b = graph.nodes.find(n => n.id === edge.toNodeId);
    if (!a || !b) return [];
    return [{ edge, a, b }];
  });
  const nonZeroSegments = segments.filter(s => Math.hypot(s.b.x - s.a.x, s.b.y - s.a.y) >= 0.01);
  const closest = (nonZeroSegments.length > 0 ? nonZeroSegments : segments).sort((u, v) => Math.min(Math.hypot(u.a.x - node.x, u.a.y - node.y), Math.hypot(u.b.x - node.x, u.b.y - node.y)) - Math.min(Math.hypot(v.a.x - node.x, v.a.y - node.y), Math.hypot(v.b.x - node.x, v.b.y - node.y)))[0];
  if (!closest) return;
  const connected = new Set([closest.a.id, closest.b.id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const s of segments) if (connected.has(s.a.id) || connected.has(s.b.id)) {
      if (!connected.has(s.a.id) || !connected.has(s.b.id)) changed = true;
      connected.add(s.a.id); connected.add(s.b.id);
    }
  }
  const runwayNodes = graph.nodes.filter(n => connected.has(n.id));
  const near = runwayNodes.reduce((a, b) => Math.hypot(a.x - node.x, a.y - node.y) < Math.hypot(b.x - node.x, b.y - node.y) ? a : b);
  const far = runwayNodes.reduce((a, b) => Math.hypot(a.x - near.x, a.y - near.y) > Math.hypot(b.x - near.x, b.y - near.y) ? a : b);
  let start: [number, number] = [near.x, near.y], end: [number, number] = [far.x, far.y], resumeIndex = 0;
  if (kind === 'arrival') {
    start = [node.x, node.y];
    const next = aircraft.assignedRoute.slice(1).map(id => graph.nodes.find(n => n.id === id)).find(n => n && Math.hypot(n.x - node.x, n.y - node.y) > 1);
    if (!next) return;
    end = [next.x, next.y];
    resumeIndex = aircraft.assignedRoute.indexOf(next.id) - 1;
  }
  const heading = Math.atan2(end[0] - start[0], start[1] - end[1]) * 180 / Math.PI;
  const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
  if (length < 1) return;
  const approachOffset = FLIGHT_ANIMATION.approachDistanceSvg + FLIGHT_ANIMATION.flareDistanceSvg;
  const x = kind === 'arrival' ? start[0] - (end[0] - start[0]) / length * approachOffset : node.x;
  const y = kind === 'arrival' ? start[1] - (end[1] - start[1]) / length * approachOffset : node.y;
  return { kind, phase: kind === 'arrival' ? 'approach' : 'lineup', elapsed: 0, x, y, altitudeWorld: kind === 'arrival' ? 8.5 : 0, pitch: kind === 'arrival' ? 0.035 : 0, heading, start, end, entry: [x, y], resumeIndex,
    corridor: closest.edge.id.includes('line_01') || closest.a.id.includes('line_01') ? 'NORTH' : 'SOUTH' };
}

export function advanceFlight(aircraft: Aircraft, dt: number): Aircraft {
  if (!aircraft.flight) return aircraft;
  const f = { ...aircraft.flight, elapsed: aircraft.flight.elapsed + Math.max(0, dt) };
  const c = FLIGHT_ANIMATION;
  let t = f.elapsed;
  const length = Math.hypot(f.end[0] - f.start[0], f.end[1] - f.start[1]);
  let along = 0;
  let speed = 0;
  if (f.kind === 'arrival') {
    if (t < c.approachSeconds) {
      const p = t / c.approachSeconds;
      f.phase = 'approach';
      along = -c.approachDistanceSvg * (1 - p) - c.flareDistanceSvg;
      f.altitudeWorld = lerp(8.5, 0.4, p);
      f.pitch = 0.035;
      speed = lerp(150, 135, p);
    } else if ((t -= c.approachSeconds) < c.flareSeconds) {
      const p = t / c.flareSeconds;
      f.phase = 'flare';
      along = -c.flareDistanceSvg * (1 - p);
      f.altitudeWorld = 0.4 * (1 - smooth(p));
      f.pitch = 0.035 + 0.065 * Math.sin(p * Math.PI);
      speed = lerp(135, 120, p);
    } else {
      t -= c.flareSeconds;
      const p = Math.min(1, t / c.rolloutSeconds);
      f.phase = 'rollout';
      along = length * 0.85 * (2 * p - p * p);
      f.altitudeWorld = 0;
      f.pitch = 0.035 * (1 - smooth(p));
      speed = lerp(120, 20, smooth(p));
      if (p === 1) return { ...aircraft, flight: undefined, status: 'taxiing', routeEdgeIndex: f.resumeIndex, currentNodeId: aircraft.assignedRoute[f.resumeIndex], progressOnEdge: 0.85, speedKts: 20, guidanceVisible: true };
    }
  } else {
    if (t < c.lineupSeconds) {
      const p = smooth(t / c.lineupSeconds);
      f.phase = 'lineup';
      f.x = lerp(f.entry[0], f.start[0], p);
      f.y = lerp(f.entry[1], f.start[1], p);
      return { ...aircraft, flight: f, status: 'taxiing', speedKts: 15, guidanceVisible: false };
    }
    t -= c.lineupSeconds;
    if (t < c.rollSeconds) {
      const p = t / c.rollSeconds;
      f.phase = 'takeoff-roll';
      along = length * 0.55 * (0.25 * p + 0.75 * p * p);
      speed = lerp(35, 145, p);
    } else if ((t -= c.rollSeconds) < c.rotateSeconds) {
      const p = t / c.rotateSeconds;
      f.phase = 'rotate';
      along = length * (0.55 + 0.15 * p);
      f.altitudeWorld = 0.8 * p * p;
      f.pitch = 0.15 * smooth(p);
      speed = 145;
    } else {
      t -= c.rotateSeconds;
      const p = Math.min(1, t / c.climbSeconds);
      f.phase = 'climb';
      along = length * (0.7 + 0.65 * p);
      f.altitudeWorld = lerp(0.8, c.cruiseHeightWorld, p);
      f.pitch = 0.15;
      speed = 165;
      if (p === 1) return { ...aircraft, flight: undefined, status: 'departed', hidden: true, speedKts: 0, guidanceVisible: false };
    }
  }
  f.x = f.start[0] + (f.end[0] - f.start[0]) / length * along;
  f.y = f.start[1] + (f.end[1] - f.start[1]) / length * along;
  return { ...aircraft, flight: f, status: 'taxiing', speedKts: speed, guidanceVisible: false };
}
