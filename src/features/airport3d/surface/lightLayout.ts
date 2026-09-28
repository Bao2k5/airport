import { getStopBarDefinitions } from '../../../presentation/stopBars';
import { FTG_GUIDANCE_CONFIG } from '../../../presentation/ftgGuidance';
import type { AirportGraph, SimulationState } from '../../../types';
import { AIRPORT_VISUAL as COLORS } from '../visualTokens';
import { distanceToSegment, getPaths, getSegments, samplePaths, type Point } from './geometry';

export type Fixture = { id: string; point: Point; edgeIds: string[]; kind: 'runway' | 'taxiway' | 'guidance' | 'stop' | 'runway_end' | 'runway_centerline'; caution?: boolean; color?: string };
export function createLightLayout(graph: AirportGraph): Fixture[] {
  const segments = getSegments(graph);
  const fixtures: Fixture[] = [];
  function add(point: Point, edgeId: string, kind: Fixture['kind']) {
    const nearby = fixtures.find(item => item.kind === kind && Math.hypot(item.point.x - point.x, item.point.z - point.z) < (kind === 'guidance' ? 0.001 : kind === 'stop' ? 0.1 : 0.32));
    if (nearby) { if (!nearby.edgeIds.includes(edgeId)) nearby.edgeIds.push(edgeId); return; }
    fixtures.push({ id: `${kind}:${fixtures.length}`, point, edgeIds: [edgeId], kind });
  }
  for (const kind of ['runway', 'taxiway'] as const) {
    const eligible = segments.filter(s => !s.apron && (s.edge.type === 'runway') === (kind === 'runway'));
    samplePaths(getPaths(eligible), kind === 'runway' ? 3.6 : 2.0, (p, tangent, segment) => {
      for (const side of [-1, 1]) {
        const offset = segment.width / 2 + 0.025;
        const point = { x: p.x - tangent.z * offset * side, z: p.z + tangent.x * offset * side };
        // Lamps belong to the exposed pavement boundary, never a junction mouth.
        if (segments.some(other => other.edge.id !== segment.edge.id && distanceToSegment(point, other) < other.width / 2 + 0.015)) continue;
        add(point, segment.edge.id, kind);
      }
    });
  }

  // ICAO Annex 14 & User requirement: Exactly 4 pairs (4 cặp = 8 đèn) of yellow caution lights at each end of the runway
  const runwayFixtures = fixtures.filter(f => f.kind === 'runway');
  const r1 = runwayFixtures.filter(f => parseInt(f.id.split(':')[1], 10) < 38).sort((a, b) => a.point.x - b.point.x);
  const r2 = runwayFixtures.filter(f => parseInt(f.id.split(':')[1], 10) >= 38).sort((a, b) => a.point.x - b.point.x);
  const cautionIds = new Set([
    ...r1.slice(0, 8).map(f => f.id),  // RWY1 West (07L): 4 pairs
    ...r1.slice(-8).map(f => f.id), // RWY1 East (25R): 4 pairs
    ...r2.slice(0, 8).map(f => f.id),  // RWY2 West (07R): 4 pairs
    ...r2.slice(-8).map(f => f.id), // RWY2 East (25L): 4 pairs
  ]);
  for (const f of runwayFixtures) {
    if (cautionIds.has(f.id)) {
      f.caution = true;
    }
  }

  // Same fixed midpoint samples as the 2D guidance renderer, not moving lamps.
  for (const segment of segments) {
    const count = Math.max(1, Math.round(segment.length / (FTG_GUIDANCE_CONFIG.dotStepSvg * 0.075)));
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count;
      add({ x: segment.a.x + (segment.b.x - segment.a.x) * t, z: segment.a.z + (segment.b.z - segment.a.z) * t }, segment.edge.id, 'guidance');
    }
  }
  for (const bar of getStopBarDefinitions(graph)) {
    for (const offset of [-6.4, -3.2, 0, 3.2, 6.4]) {
      const point = { x: (bar.x + bar.nx * offset - 600) * 0.075, z: (bar.y + bar.ny * offset - 430) * 0.075 };
      fixtures.push({ id: `stop:${bar.id}:${offset}`, point, edgeIds: bar.edgeIds, kind: 'stop' });
    }
  }

  // ICAO Annex 14: Runway End Lights - 5 red lamps across the runway centerline at each runway end
  const runwayEnds = [
    { id: '07L', point: { x: -40.80, z: 4.20 }, normal: { x: 0.275, z: 0.962 }, edgeId: 'E_v3_line_01_p00_v3_line_03_p00' },
    { id: '25R', point: { x: 24.97, z: -28.13 }, normal: { x: 0.423, z: 0.906 }, edgeId: 'E_v3_line_01_p02_v3_line_01_p03' },
    { id: '07R', point: { x: -39.90, z: 20.40 }, normal: { x: 0.371, z: 0.928 }, edgeId: 'E_v3_line_03_p01_v3_line_16_p00' },
    { id: '25L', point: { x: 40.20, z: -18.97 }, normal: { x: 0.441, z: 0.898 }, edgeId: 'E_v3_line_26_p00_v3_line_05_p07' },
  ];
  for (const end of runwayEnds) {
    for (const offset of [-1.6, -0.8, 0, 0.8, 1.6]) {
      const point = { x: end.point.x + end.normal.x * offset, z: end.point.z + end.normal.z * offset };
      fixtures.push({ id: `runway_end:${end.id}:${offset}`, point, edgeIds: [end.edgeId], kind: 'runway_end' });
    }
  }

  // ICAO Annex 14: Runway Centerline Lights (Đèn tim đường cất hạ cánh)
  // White along runway body; alternating Red/White in 900m-300m; Red in last 300m
  const eligibleRunways = segments.filter(s => !s.apron && s.edge.type === 'runway');
  const runwayPaths = getPaths(eligibleRunways);
  const rwy1Stations: { point: Point; edgeId: string }[] = [];
  samplePaths([runwayPaths[0]], 3.6, (p, _t, segment) => {
    rwy1Stations.push({ point: p, edgeId: segment.edge.id });
  });
  const rwy2Stations: { point: Point; edgeId: string }[] = [];
  for (const path of [runwayPaths[1], runwayPaths[2], runwayPaths[3]]) {
    samplePaths([path], 3.6, (p, _t, segment) => {
      rwy2Stations.push({ point: p, edgeId: segment.edge.id });
    });
  }
  rwy2Stations.sort((a, b) => a.point.x - b.point.x);

  const assignCenterlineColor = (idx: number, total: number) => {
    const fromEnd = Math.min(idx, total - 1 - idx);
    // User requested pattern: Đỏ - Đỏ - Đỏ - Trắng - Đỏ at runway ends
    if (fromEnd === 0 || fromEnd === 1 || fromEnd === 2 || fromEnd === 4) {
      return COLORS.runwayEndLight; // Red
    }
    return COLORS.runwayEdgeLight; // White in central body
  };

  rwy1Stations.forEach((s, idx) => {
    fixtures.push({
      id: `rwy_cl:1:${idx}`,
      point: s.point,
      edgeIds: [s.edgeId],
      kind: 'runway_centerline',
      color: assignCenterlineColor(idx, rwy1Stations.length),
    });
  });

  rwy2Stations.forEach((s, idx) => {
    fixtures.push({
      id: `rwy_cl:2:${idx}`,
      point: s.point,
      edgeIds: [s.edgeId],
      kind: 'runway_centerline',
      color: assignCenterlineColor(idx, rwy2Stations.length),
    });
  });

  return fixtures;
}

export function fixtureColor(fixture: Fixture, state: Pick<SimulationState, 'lightStates' | 'blockedEdgeIds'>): string {
  const red = fixture.edgeIds.some(id => state.lightStates[id] === 'red' || state.blockedEdgeIds.has(id));
  if (fixture.kind === 'guidance') return !red && fixture.edgeIds.some(id => state.lightStates[id] === 'green') ? COLORS.ftgCenterline : COLORS.unlitFixture;
  if (fixture.kind === 'stop') return red ? COLORS.stopBar : COLORS.unlitFixture;
  if (fixture.kind === 'runway_end') return COLORS.runwayEndLight;
  if (fixture.kind === 'runway_centerline') return fixture.color ?? COLORS.runwayEdgeLight;
  if (fixture.kind === 'runway') {
    return fixture.caution ? COLORS.runwayCautionLight : COLORS.runwayEdgeLight;
  }
  return COLORS.taxiwayEdgeLight;
}
