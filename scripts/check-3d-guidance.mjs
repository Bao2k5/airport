import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { airportGraphV3: graph } = await server.ssrLoadModule('/src/data/airportGraph.v3.ts');
  const { createLightLayout } = await server.ssrLoadModule('/src/features/airport3d/surface/lightLayout.ts');
  const { guidanceColors } = await server.ssrLoadModule('/src/features/airport3d/surface/guidanceColors.ts');
  const { computeSegmentedGuidanceDots } = await server.ssrLoadModule('/src/presentation/ftgGuidance.ts');
  const { startFtgScenario, getFtgScenarioDefs } = await server.ssrLoadModule('/src/features/airport3d/ftgScenarios.ts');
  const { AIRPORT_VISUAL } = await server.ssrLoadModule('/src/features/airport3d/visualTokens.ts');
  const fixtures = createLightLayout(graph);
  let samples = 0;
  for (const def of Object.values(getFtgScenarioDefs(graph))) {
    const seed = startFtgScenario(def.id, graph);
    for (const source of seed.scenarioAircraft) {
      for (let index = 0; index < source.assignedRoute.length - 1; index++) {
        for (const progress of [0, 0.4, 0.95]) {
          const aircraft = { ...source, flight: undefined, hidden: false, releaseAtSeconds: 0, guidanceVisible: true, routeVisible: true, status: 'taxiing', holdReason: undefined, routeEdgeIndex: index, progressOnEdge: progress };
          const state = { ...seed, scenarioAircraft: [aircraft], blockedEdgeIds: new Set(), lightStates: {} };
          const colors = guidanceColors(fixtures, graph, state);
          const expected = computeSegmentedGuidanceDots(aircraft, graph)?.activeDots ?? [];
          const lit = fixtures.filter(f => f.kind === 'guidance' && colors.get(f.id) === AIRPORT_VISUAL.ftgCenterline);
          const matches = (f, dot) => Math.hypot(f.point.x - (dot.x - 600) * 0.075, f.point.z - (dot.y - 430) * 0.075) < 0.002;
          assert(expected.every(dot => lit.some(f => matches(f, dot))), `${def.id}: missing shared 2D lamp ${aircraft.callsign} ${index} ${progress} ${JSON.stringify(expected.filter(dot => !lit.some(f => matches(f, dot))))}`);
          assert(lit.every(f => expected.some(dot => matches(f, dot))), `${def.id}: stale lamp behind aircraft`);
          const held = guidanceColors(fixtures, graph, { ...state, scenarioAircraft: [{ ...aircraft, status: 'holding', role: 'arriving', scenarioLabel: '' }] });
          assert(!fixtures.some(f => f.kind === 'guidance' && held.get(f.id) === AIRPORT_VISUAL.ftgCenterline), 'held aircraft must not show green guidance');
          samples++;
        }
      }
    }
  }
  console.log(`GUIDANCE_OK: ${samples} route/progress samples; 2D/3D lamp positions match, stale lamps off, holds suppress green.`);
} finally { await server.close(); }
