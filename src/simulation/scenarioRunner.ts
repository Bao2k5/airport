// Complete Scenario Physics Engine decompiled 100% from Vercel Demo

import type { SimulationState, SimulationConfig } from '../types';
import { PRESET_SCENARIO_DEFS, type ScenarioAircraft, type ScenarioState } from '../data/presetScenarios';
import { airportGraph } from '../data/airportGraph';
import { routeToEdges } from './pathfinding';

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

const KTS_TO_PX_PER_SEC = 0.3;

function getNodePos(nodeId: string) {
  return airportGraph.nodes.find(n => n.id === nodeId) ?? null;
}

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

function logScenarioEvent(state: SimulationState, msg: string, severity: 'info' | 'warning' | 'critical' = 'info'): SimulationState {
  if (!state.scenario) return state;
  const evt = { atSeconds: state.elapsedSeconds, message: msg, severity };
  return {
    ...state,
    scenario: {
      ...state.scenario,
      events: [...state.scenario.events, evt],
    },
  };
}

export function scenarioTick(state: SimulationState, dt: number): SimulationState {
  if (!state.isRunning || state.isPaused || !state.scenario || !state.scenarioAircraft) {
    return state;
  }

  const elapsed = state.elapsedSeconds + dt;
  const scenarioAircraft = state.scenarioAircraft.map((ac: ScenarioAircraft) => {
    if (ac.status === 'departed' || ac.status === 'arrived') return ac;

    // Check release delay
    if (ac.releaseAtSeconds !== undefined && elapsed < ac.releaseAtSeconds) {
      return { ...ac, status: 'waiting' as const };
    }

    const routeEdges = routeToEdges(ac.assignedRoute, airportGraph.edges) ?? [];
    if (ac.routeEdgeIndex >= routeEdges.length) {
      return { ...ac, status: 'arrived' as const, speedKts: 0 };
    }

    const currentEdge = airportGraph.edges.find(e => e.id === routeEdges[ac.routeEdgeIndex]);
    const fromNode = getNodePos(ac.assignedRoute[ac.routeEdgeIndex]);
    const toNode = getNodePos(ac.assignedRoute[ac.routeEdgeIndex + 1]);

    if (!currentEdge || !fromNode || !toNode) {
      return { ...ac, status: 'arrived' as const, speedKts: 0 };
    }

    // Distance step
    const distPx = Math.hypot(toNode.x - fromNode.x, toNode.y - fromNode.y) || 1;
    const speedPxPerSec = ac.speedKts * KTS_TO_PX_PER_SEC;
    const deltaProgress = (speedPxPerSec * dt) / distPx;
    const nextProgress = ac.progressOnEdge + deltaProgress;

    if (nextProgress < 1) {
      return {
        ...ac,
        progressOnEdge: nextProgress,
        status: 'taxiing' as const,
        currentNodeId: ac.assignedRoute[ac.routeEdgeIndex],
        currentEdgeId: currentEdge.id,
      };
    } else {
      // Advance to next edge in route
      const nextIndex = ac.routeEdgeIndex + 1;
      if (nextIndex >= routeEdges.length) {
        return {
          ...ac,
          routeEdgeIndex: nextIndex,
          progressOnEdge: 1,
          currentNodeId: toNode.id,
          targetNodeId: toNode.id,
          status: 'arrived' as const,
          speedKts: 0,
        };
      } else {
        return {
          ...ac,
          routeEdgeIndex: nextIndex,
          progressOnEdge: 0,
          currentNodeId: toNode.id,
          currentEdgeId: routeEdges[nextIndex],
          status: 'taxiing' as const,
        };
      }
    }
  });

  let nextState: SimulationState = {
    ...state,
    scenarioAircraft,
    elapsedSeconds: elapsed,
  };

  // Run pending scenario triggers
  if (nextState.scenario) {
    const pending = [...nextState.scenario.pendingTriggers];
    const ready = pending.filter(t => t.atSeconds <= elapsed);
    const remaining = pending.filter(t => t.atSeconds > elapsed);

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
    nextState.scenarioAircraft.every((ac: ScenarioAircraft) => ac.status === 'arrived' || ac.status === 'departed')
  ) {
    nextState = logScenarioEvent(nextState, 'Kịch bản hoàn tất — toàn bộ tàu bay đã đến vị trí.', 'info');
    if (nextState.scenario) {
      nextState.scenario.completed = true;
    }
  }

  return nextState;
}
