import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { airportGraphV3: graph } = await server.ssrLoadModule('/src/data/airportGraph.v3.ts');
  const { startScenario, scenarioTick } = await server.ssrLoadModule('/src/simulation/scenarioRunner.ts');

  let state = startScenario('lvc_peak_runway_direction_change', graph);
  assert(state, 'Scenario 5 must start');

  const inb01_init = state.scenarioAircraft.find(a => a.callsign === 'INB01');
  assert(inb01_init, 'INB01 must exist');
  assert(inb01_init.flight, 'INB01 must have initial flight motion');
  assert.equal(inb01_init.flight.kind, 'arrival');
  assert.equal(inb01_init.flight.phase, 'approach');
  assert(inb01_init.flight.altitudeWorld > 7, 'INB01 must start in high approach');

  let inb01_touchedDown = false;
  let inb01_rollout = false;
  let inb01_taxiingOnGround = false;

  let out01_rotated = false;
  let out01_climbed = false;
  let out01_departed = false;

  let out02_waitedStand12 = false;
  let out02_startedTaxi = false;
  let out02_waitedAtW11 = false;
  let out02_rotated = false;

  const dt = 0.5;
  // Run for 300 simulation seconds (600 steps)
  for (let step = 0; step < 600; step++) {
    state = scenarioTick(state, dt, graph);
    const t = state.elapsedSeconds;

    const inb = state.scenarioAircraft.find(a => a.callsign === 'INB01');
    const out1 = state.scenarioAircraft.find(a => a.callsign === 'OUT01');
    const out2 = state.scenarioAircraft.find(a => a.callsign === 'OUT02');

    // INB01 flight checks
    if (inb) {
      if (inb.flight?.phase === 'flare') inb01_touchedDown = true;
      if (inb.flight?.phase === 'rollout') inb01_rollout = true;
      if (!inb.flight && inb.status === 'taxiing') inb01_taxiingOnGround = true;
    }

    // OUT01 flight checks
    if (out1) {
      if (out1.flight?.phase === 'rotate') out01_rotated = true;
      if (out1.flight?.phase === 'climb') out01_climbed = true;
      if (out1.status === 'departed') out01_departed = true;
    }

    // OUT02 checks
    if (out2) {
      if (t < 6.0 && out2.status === 'holding' && out2.routeEdgeIndex === 0) {
        out02_waitedStand12 = true;
      }
      if (t > 7.0 && out2.status === 'taxiing' && out2.routeEdgeIndex === 0) {
        out02_startedTaxi = true;
      }
      if (out2.scenarioLabel?.includes('CHỜ TÀU 2') || (out2.currentNodeId === 'v3_line_16_p01' && out2.status === 'holding')) {
        out02_waitedAtW11 = true;
      }
      if (out2.flight?.phase === 'rotate') {
        out02_rotated = true;
      }
    }
  }

  console.log('--- TEST RESULTS FOR SCENARIO 5 ---');
  console.log('INB01 approach & flare:', inb01_touchedDown);
  console.log('INB01 rollout:', inb01_rollout);
  console.log('INB01 ground handover (flight -> taxiing):', inb01_taxiingOnGround);
  console.log('OUT01 rotated (nose pitch up):', out01_rotated);
  console.log('OUT01 climbed:', out01_climbed);
  console.log('OUT01 departed:', out01_departed);
  console.log('OUT02 waited 7s at Stand 12:', out02_waitedStand12);
  console.log('OUT02 started taxi after 7s:', out02_startedTaxi);
  console.log('OUT02 waited at W11 if needed:', out02_waitedAtW11);
  console.log('OUT02 rotated:', out02_rotated);

  assert(inb01_touchedDown, 'INB01 must touch down');
  assert(inb01_rollout, 'INB01 must rollout on runway 25R');
  assert(inb01_taxiingOnGround, 'INB01 must transition to ground taxiing');
  assert(out01_rotated, 'OUT01 must rotate on runway 07R');
  assert(out01_departed, 'OUT01 must depart');
  assert(out02_waitedStand12, 'OUT02 must wait at Stand 12 for 7s');
  assert(out02_startedTaxi, 'OUT02 must start taxiing after 7s');

  console.log('SCENARIO_5_FLIGHT_VERIFIED_SUCCESSFULLY!');
} finally {
  await server.close();
}
