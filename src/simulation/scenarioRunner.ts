import type { SimulationState, SimulationConfig } from '../types';
import { PRESET_SCENARIO_DEFS, type ScenarioAircraft, type ScenarioState } from '../data/presetScenarios';
import { airportGraph } from '../data/airportGraph';

const DEFAULT_SCENARIO_CONFIG: SimulationConfig = {
  startNodeId: 'HS3',
  destinationNodeId: 'RWY07L_THR',
  callsign: 'SCENARIO',
  aircraftType: 'A321',
  weather: 'clear',
  timeOfDay: 'morning',
  trafficLevel: 'low',
  taxiSpeedKts: 15,
  incident: 'none',
  incidentEdgeId: null,
  autoReroute: true,
};

function getBlockedEdgeIds(config: SimulationConfig): Set<string> {
  const blocked = new Set<string>();
  for (const edge of airportGraph.edges) {
    if (edge.status === 'closed' || edge.status === 'restricted') {
      blocked.add(edge.id);
    }
  }
  if (config.incidentEdgeId && config.incident !== 'none') {
    blocked.add(config.incidentEdgeId);
  }
  return blocked;
}

export function startScenario(scenarioId: string): SimulationState {
  const def = PRESET_SCENARIO_DEFS[scenarioId];
  if (!def) {
    throw new Error(`Unknown scenario ID: ${scenarioId}`);
  }

  const { weather, aircraft, triggers } = def.setup();

  const scenarioState: ScenarioState = {
    id: scenarioId,
    title: def.title,
    situation: def.situation,
    challenges: def.challenges,
    watchFor: def.watchFor,
    startedAtSeconds: 0,
    events: [{ atSeconds: 0, message: 'Kịch bản bắt đầu.', severity: 'info' }],
    pendingTriggers: triggers,
    completed: false,
  };

  const config: SimulationConfig = {
    ...DEFAULT_SCENARIO_CONFIG,
    weather,
  };

  return {
    aircraft: null,
    trafficAircraft: [],
    config,
    isRunning: true,
    isPaused: false,
    routeStatus: 'accepted',
    elapsedSeconds: 0,
    etaSeconds: null,
    warningMessage: null,
    lightStates: {},
    blockedEdgeIds: getBlockedEdgeIds(config),
    scenario: scenarioState,
    scenarioAircraft: aircraft,
  };
}

export function scenarioTick(state: SimulationState, dt: number): SimulationState {
  if (!state.isRunning || state.isPaused || !state.scenario || !state.scenarioAircraft) {
    return state;
  }

  const elapsed = state.elapsedSeconds + dt;
  let nextState: SimulationState = {
    ...state,
    elapsedSeconds: elapsed,
  };

  // Process time triggers
  if (nextState.scenario) {
    const pending = [...nextState.scenario.pendingTriggers];
    const ready = pending.filter(t => t.atSeconds <= elapsed * 10); // scale check
    const remaining = pending.filter(t => t.atSeconds > elapsed * 10);

    for (const trigger of ready) {
      nextState = trigger.apply(nextState);
    }

    if (ready.length > 0 && nextState.scenario) {
      nextState.scenario.pendingTriggers = remaining;
    }
  }

  // Check scenario completion
  if (
    nextState.scenario &&
    !nextState.scenario.completed &&
    nextState.scenarioAircraft &&
    nextState.scenarioAircraft.length > 0 &&
    nextState.scenarioAircraft.every((ac: ScenarioAircraft) => ac.status === 'arrived' || ac.status === 'stopped')
  ) {
    nextState.scenario.completed = true;
    nextState.scenario.events.push({
      atSeconds: elapsed,
      message: 'Kịch bản hoàn tất — toàn bộ tàu bay đã đến vị trí.',
      severity: 'info',
    });
  }

  return nextState;
}
