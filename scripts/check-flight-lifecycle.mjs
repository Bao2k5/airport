import assert from 'node:assert/strict';
import { createServer } from 'vite';
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { airportGraphV3: graph } = await server.ssrLoadModule('/src/data/airportGraph.v3.ts');
  const { createFlightMotion, advanceFlight } = await server.ssrLoadModule('/src/simulation/flightMotion.ts');
  const { createDefaultManualFleet, simulationTick, startManualAircraft, sanitizeManualFleet, resetManualAircraft } = await server.ssrLoadModule('/src/simulation/simulator.ts');
  const { startFtgScenario } = await server.ssrLoadModule('/src/features/airport3d/ftgScenarios.ts');
  const { addManualFlight } = await server.ssrLoadModule('/src/simulation/manualFlights.ts');
  const { getPositionForAircraft } = await server.ssrLoadModule('/src/presentation/aircraftPose.ts');
  const { getAircraftWorldPose } = await server.ssrLoadModule('/src/features/airport3d/sceneCoordinates.ts');
  const fleet = createDefaultManualFleet(graph);
  const base = { ...startFtgScenario('lvc_wrong_turn_radio_failure', graph), scenario: undefined, scenarioAircraft: undefined, manualFleet: fleet, isPaused: false, practiceMode: false, blockedEdgeIds: new Set(), lightStates: {} };
  const original = JSON.stringify(graph);
  let outboundState = startManualAircraft({ ...base, selectedAircraftId: fleet[0].id, aircraft: fleet[0] }, fleet[0].id, graph);
  let coreRotated = false;
  for (let i = 0; i < 6000 && outboundState.aircraft.status !== 'departed'; i++) {
    outboundState = simulationTick(outboundState, 0.5, graph);
    coreRotated ||= outboundState.aircraft.flight?.phase === 'rotate';
  }
  assert(coreRotated, 'ground route must hand over to shared departure motion');
  assert.equal(outboundState.aircraft.status, 'departed', 'stand to departure must finish');
  let departure = { ...fleet[0], currentNodeId: fleet[0].targetNodeId, status: 'taxiing' };
  departure.flight = createFlightMotion(departure, graph, 'departure');
  assert(departure.flight);
  const phases = new Set();
  for (let i = 0; i < 120; i++) {
    departure = advanceFlight(departure, 0.5);
    if (departure.flight) {
      phases.add(departure.flight.phase);
      const p2 = getPositionForAircraft(departure, graph), p3 = getAircraftWorldPose(departure, graph);
      assert(Math.abs(p3.position[0] - (p2.x - 600) * 0.075) < 1e-8);
      assert.equal(p3.position[1], departure.flight.altitudeWorld);
    }
  }
  assert.equal(departure.status, 'departed');
  for (const phase of ['lineup', 'takeoff-roll', 'rotate', 'climb']) assert(phases.has(phase));
  const freeStand = graph.nodes.find(n => /^STAND/.test(n.label) && !fleet.some(a => a.currentNodeId === n.id || a.targetNodeId === n.id));
  const landing = graph.nodes.find(n => n.label === 'STOP BAR 25R');
  assert(freeStand && landing);
  let state = addManualFlight(base, { callsign: 'TEST99', aircraftType: 'A321', airlineCode: 'VN', startNodeId: landing.id, destinationNodeId: freeStand.id }, graph);
  assert.equal(state.manualFleet.length, 7);
  assert.equal(sanitizeManualFleet(state.manualFleet, graph).length, 7);
  assert.equal(addManualFlight(state, { callsign: 'TEST99', aircraftType: 'A321', airlineCode: 'VN', startNodeId: landing.id, destinationNodeId: freeStand.id }, graph).manualFleet.length, 7);
  state = startManualAircraft(state, 'manual-TEST99', graph);
  assert(state.aircraft.flight);
  assert.equal(simulationTick({ ...state, isPaused: true }, 10, graph).aircraft.flight.elapsed, 0);
  const arrivalPhases = new Set();
  for (let i = 0; i < 80; i++) {
    state = simulationTick(state, 0.5, graph);
    if (state.aircraft.flight) arrivalPhases.add(state.aircraft.flight.phase);
  }
  for (const phase of ['approach', 'flare', 'rollout']) assert(arrivalPhases.has(phase));
  assert.equal(state.aircraft.flight, undefined);
  for (let i = 0; i < 6000 && state.aircraft.status !== 'arrived'; i++) state = simulationTick(state, 0.5, graph);
  assert.equal(state.aircraft.status, 'arrived', 'approach must finish at the assigned stand');
  assert.equal(state.aircraft.currentNodeId, freeStand.id);
  const reset = resetManualAircraft(state, 'manual-TEST99', graph);
  assert.equal(reset.aircraft.id, 'manual-TEST99');
  assert.equal(reset.aircraft.status, 'parked');
  assert.equal(JSON.stringify(graph), original);
  console.log('FLIGHT_OK: departure phases, arrival/core handover, shared poses, pause, custom spawn/reset, graph unchanged.');
} finally { await server.close(); }
