import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { airportGraphV3: graph } = await server.ssrLoadModule('/src/data/airportGraph.v3.ts');
  const { getSegments, getPaths, distanceToSegment, isStand } = await server.ssrLoadModule('/src/features/airport3d/surface/geometry.ts');
  const { createLightLayout, fixtureColor } = await server.ssrLoadModule('/src/features/airport3d/surface/lightLayout.ts');
  const { AIRPORT_VISUAL: colors } = await server.ssrLoadModule('/src/features/airport3d/visualTokens.ts');
  const { startScenario, scenarioTick } = await server.ssrLoadModule('/src/simulation/scenarioRunner.ts');
  const { getPresetScenarioDefs } = await server.ssrLoadModule('/src/data/presetScenarios.ts');
  const { getPositionForAircraft, getStandParkingHeading } = await server.ssrLoadModule('/src/presentation/aircraftPose.ts');
  const { getAircraftWorldPose, headingToYaw } = await server.ssrLoadModule('/src/features/airport3d/sceneCoordinates.ts');
  const { startFtgScenario, getFtgScenarioDefs } = await server.ssrLoadModule('/src/features/airport3d/ftgScenarios.ts');
  const original = JSON.stringify(graph);
  const segments = getSegments(graph), fixtures = createLightLayout(graph);
  for (const label of ['INTL_S2', 'INTL_S3', 'INTL_S4']) {
    const node = graph.nodes.find(n => n.label === label);
    assert(node, `missing regression junction ${label}`);
    assert.equal(isStand(node), false, `${label} is a through taxiway, not a parking stand`);
    const trunk = segments.filter(s => (s.edge.fromNodeId === node.id || s.edge.toNodeId === node.id) && !isStand(graph.nodes.find(n => n.id === s.edge.fromNodeId)) && !isStand(graph.nodes.find(n => n.id === s.edge.toNodeId)));
    assert(trunk.length > 0);
    assert(trunk.every(s => !s.apron), `${label} must have continuous asphalt`);
  }
  const close = (a, b) => assert(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
  for (const heading of [0, 90, 180, 270]) {
    // A glTF -Z nose after yaw must match the SVG compass direction.
    close(-Math.sin(headingToYaw(heading)), Math.sin(heading * Math.PI / 180));
    close(-Math.cos(headingToYaw(heading)), -Math.cos(heading * Math.PI / 180));
  }
  const template = startScenario('lvc_wrong_turn_radio_failure', graph).scenarioAircraft[0];
  for (const stand of graph.nodes.filter(isStand)) {
    const parked = { ...template, status: 'parked', currentNodeId: stand.id, assignedRoute: [] };
    close(getAircraftWorldPose(parked, graph).yaw, headingToYaw(getStandParkingHeading(stand.id, stand)));
  }
  for (const def of Object.values(getFtgScenarioDefs(graph))) {
    assert(!/truyền thống|so sánh/i.test([def.teaser, def.situation, ...def.challenges, ...def.watchFor].join(' ')), `${def.id}: 3D must describe FTG only`);
    const state = startFtgScenario(def.id, graph);
    assert.equal(state.renderMode, 'ftg');
    assert.deepEqual(state.scenarioAircraft.map(a => a.assignedRoute), startScenario(def.id, graph).scenarioAircraft.map(a => a.assignedRoute));
    for (const ac of state.scenarioAircraft) {
      for (let index = 0; index < ac.assignedRoute.length - 1; index++) {
        for (const progress of [0, 0.3, 0.6, 0.8, 0.999]) {
          const moving = { ...ac, status: 'taxiing', routeEdgeIndex: index, progressOnEdge: progress };
          const svg = getPositionForAircraft(moving, graph), world = getAircraftWorldPose(moving, graph);
          assert(svg && world);
          close(world.position[0], (svg.x - 600) * 0.075);
          close(world.position[2], (svg.y - 430) * 0.075);
          close(world.yaw, headingToYaw(svg.heading));
        }
      }
    }
  }
  console.log('REGRESSIONS_OK: INTL pavement, stand orientation, all route poses/pushback match 2D, FTG-only 3D definitions');
  const positions = JSON.stringify(fixtures);
  assert.deepEqual(createLightLayout(graph), fixtures, 'layout must be deterministic');
  assert.equal(getPaths(segments).flat().length, segments.length, 'each nonzero edge must occur once');
  for (const segment of segments) {
    assert(fixtures.some(f => f.kind === 'guidance' && f.edgeIds.includes(segment.edge.id)), `missing guidance on ${segment.edge.id}`);
  }
  for (const fixture of fixtures.filter(f => f.kind === 'taxiway' || f.kind === 'runway')) {
    assert(!segments.some(s => !fixture.edgeIds.includes(s.edge.id) && distanceToSegment(fixture.point, s) < s.width / 2 + 0.015), `boundary light inside junction: ${fixture.id}`);
  }
  const off = { lightStates: {}, blockedEdgeIds: new Set() };
  assert(fixtures.filter(f => f.kind === 'guidance').every(f => fixtureColor(f, off) !== colors.ftgCenterline));
  for (const fixture of fixtures.filter(f => f.kind === 'guidance')) {
    const id = fixture.edgeIds[0];
    assert.equal(fixtureColor(fixture, { lightStates: { [id]: 'green' }, blockedEdgeIds: new Set() }), colors.ftgCenterline);
    assert.notEqual(fixtureColor(fixture, { lightStates: { [id]: 'green' }, blockedEdgeIds: new Set([id]) }), colors.ftgCenterline);
  }
  for (const id of Object.keys(getPresetScenarioDefs(graph))) {
    let state = startScenario(id, graph);
    const initial = JSON.stringify(state.scenarioAircraft.map(a => [a.currentNodeId, a.progressOnEdge]));
    let greenSeen = false;
    for (let tick = 0; tick < 240; tick++) {
      state = scenarioTick(state, 0.5, graph);
      for (const fixture of fixtures.filter(f => f.kind === 'guidance')) {
        const expected = fixture.edgeIds.some(edge => state.lightStates[edge] === 'green') && !fixture.edgeIds.some(edge => state.lightStates[edge] === 'red' || state.blockedEdgeIds.has(edge));
        assert.equal(fixtureColor(fixture, state) === colors.ftgCenterline, expected);
        greenSeen ||= expected;
      }
    }
    assert.notEqual(JSON.stringify(state.scenarioAircraft.map(a => [a.currentNodeId, a.progressOnEdge])), initial, `${id}: aircraft must advance`);
    assert.equal(scenarioTick({ ...state, isPaused: true }, 1, graph).elapsedSeconds, state.elapsedSeconds);
    console.log(`${id}: movement and FTG state mapping OK (green seen: ${greenSeen})`);
  }
  assert.equal(JSON.stringify(fixtures), positions, 'state updates must not move lamps');
  assert.equal(JSON.stringify(graph), original, 'presentation must not mutate airport graph');
  console.log(`SURFACE_CHECKS_OK: ${segments.length} segments, ${fixtures.length} fixed fixtures. Browser appearance is not covered.`);
} finally {
  await server.close();
}
