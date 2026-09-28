import { getStopBarDefinitions } from '../../../presentation/stopBars';
import { FTG_GUIDANCE_CONFIG } from '../../../presentation/ftgGuidance';
import type { AirportGraph, SimulationState } from '../../../types';
import { AIRPORT_VISUAL as COLORS } from '../visualTokens';
import { distanceToSegment, getPaths, getSegments, samplePaths, type Point } from './geometry';

export type Fixture = { id: string; point: Point; edgeIds: string[]; kind: 'runway' | 'taxiway' | 'guidance' | 'stop' };
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
  return fixtures;
}

export function fixtureColor(fixture: Fixture, state: Pick<SimulationState, 'lightStates' | 'blockedEdgeIds'>): string {
  const red = fixture.edgeIds.some(id => state.lightStates[id] === 'red' || state.blockedEdgeIds.has(id));
  if (fixture.kind === 'guidance') return !red && fixture.edgeIds.some(id => state.lightStates[id] === 'green') ? COLORS.ftgCenterline : COLORS.unlitFixture;
  if (fixture.kind === 'stop') return red ? COLORS.stopBar : COLORS.unlitFixture;
  return fixture.kind === 'runway' ? COLORS.runwayEdgeLight : COLORS.taxiwayEdgeLight;
}
