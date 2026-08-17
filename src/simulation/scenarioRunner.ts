import type { SimulationState, SimulationConfig, AirportGraph, RunwayOccupancyState } from '../types';
import { getPresetScenarioDefs, type ScenarioAircraft, type ScenarioState, type ScenarioObservation } from '../data/presetScenarios';
import { airportGraph } from '../data/airportGraph';
import { routeToEdges } from './pathfinding';
import { getRunwayCorridor } from './simulator';

const DEFAULT_SCENARIO_CONFIG: SimulationConfig = {
  startNodeId: 'HS3',
  destinationNodeId: 'RWY07L_THR',
  callsign: 'SCENARIO',
  airlineCode: 'VN',
  aircraftType: 'A321',
  weather: 'clear',
  timeOfDay: 'morning',
  trafficLevel: 'low',
  taxiSpeedKts: 15,
  incident: 'none',
  incidentEdgeId: null,
  autoReroute: true,
};


function getNodePos(nodeId: string, graph: AirportGraph = airportGraph) {
  return graph.nodes.find(n => n.id === nodeId) ?? null;
}

function getBlockedEdgeIds(config: SimulationConfig, graph: AirportGraph = airportGraph): Set<string> {
  const blocked = new Set<string>();
  for (const edge of graph.edges) {
    if (edge.status === 'closed' || edge.status === 'restricted') {
      blocked.add(edge.id);
    }
  }
  if (config.incidentEdgeId && config.incident !== 'none') {
    blocked.add(config.incidentEdgeId);
  }
  return blocked;
}

function computeScenarioLightStates(
  scenarioAircraft: ScenarioAircraft[],
  blockedEdgeIds: Set<string>,
  graph: AirportGraph = airportGraph
): Record<string, 'green' | 'red' | 'off'> {
  const lights: Record<string, 'green' | 'red' | 'off'> = {};

  for (const edge of graph.edges) {
    if (blockedEdgeIds.has(edge.id)) {
      lights[edge.id] = 'red';
    }
  }

  for (const ac of scenarioAircraft) {
    if (ac.status === 'arrived' || ac.status === 'departed') continue;
    if (ac.status !== 'taxiing') continue;

    const routeEdges = routeToEdges(ac.assignedRoute, graph.edges) ?? [];
    const remainingEdges = routeEdges.slice(ac.routeEdgeIndex);

    for (let i = 0; i < remainingEdges.length; i++) {
      const edgeId = remainingEdges[i];
      if (lights[edgeId] === 'red') continue;

      if (i === 0 && ac.holdReason === 'stop-bar') {
        lights[edgeId] = 'red';
      } else {
        lights[edgeId] = 'green';
      }
    }
  }

  return lights;
}

export function startScenario(scenarioId: string, graph: AirportGraph = airportGraph): SimulationState {
  const defs = getPresetScenarioDefs(graph);
  const def = defs[scenarioId];
  if (!def) {
    throw new Error(`Unknown scenario ID: ${scenarioId}`);
  }

  const setupRes = def.setup(graph);
  const { weather, aircraft, triggers } = setupRes;
  const observations: ScenarioObservation[] = setupRes.observations || def.observations || [];

  const scenarioState: ScenarioState = {
    id: scenarioId,
    title: def.title,
    situation: def.situation,
    challenges: def.challenges,
    watchFor: def.watchFor,
    observations,
    startedAtSeconds: 0,
    events: [{ atSeconds: 0, message: 'Kịch bản bắt đầu.', severity: 'info' }],
    pendingTriggers: triggers,
    completed: false,
  };

  const config: SimulationConfig = {
    ...DEFAULT_SCENARIO_CONFIG,
    weather,
  };

  const blockedEdgeIds = getBlockedEdgeIds(config, graph);

  const initialLogs: any[] = [
    {
      id: `sc_init_${scenarioId}`,
      atSeconds: 0,
      message: `Khởi chạy kịch bản: ${def.title}`,
      severity: 'info',
    },
  ];

  for (const ac of aircraft) {
    if (ac.status === 'taxiing' && (!ac.queueOrder || ac.queueOrder === 1)) {
      initialLogs.push({
        id: `release_${ac.id}_0`,
        atSeconds: 0,
        message: `[AIRCRAFT_RELEASED] ${ac.callsign}`,
        severity: 'info',
      });
    }
  }

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
    lightStates: computeScenarioLightStates(aircraft, blockedEdgeIds, graph),
    blockedEdgeIds,
    runwayOccupancy: { NORTH: null, SOUTH: null },
    liveEventLog: initialLogs,
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
    liveEventLog: [
      ...(state.liveEventLog || []),
      {
        id: `sc_evt_${state.elapsedSeconds}_${Math.random().toString(36).slice(2, 6)}`,
        atSeconds: state.elapsedSeconds,
        message: msg,
        severity,
      },
    ],
  };
}

export function scenarioTick(state: SimulationState, dt: number, graph: AirportGraph = airportGraph): SimulationState {
  if (!state.isRunning || state.isPaused || !state.scenario || !state.scenarioAircraft) {
    return state;
  }

  const elapsed = state.elapsedSeconds + dt;
  const currentOccupancy: RunwayOccupancyState = {
    NORTH: state.runwayOccupancy?.NORTH || null,
    SOUTH: state.runwayOccupancy?.SOUTH || null,
  };

  // Pre-calculate physical occupancy
  for (const ac of state.scenarioAircraft) {
    if (ac.status !== 'taxiing' && ac.status !== 'holding') continue;
    const corridor = getRunwayCorridor(ac.currentEdgeId, ac.currentNodeId);
    if (corridor) {
      currentOccupancy[corridor] = ac.id;
    }
  }

  const clearedRunways: { corridor: 'NORTH' | 'SOUTH'; callsign: string; order?: number }[] = [];

  const scenarioAircraft = state.scenarioAircraft.map((ac: ScenarioAircraft) => {
    if (ac.status === 'departed' || ac.status === 'arrived' || ac.status === 'queued') return ac;

    // Check release delay
    if (ac.releaseAtSeconds !== undefined && elapsed < ac.releaseAtSeconds) {
      return { ...ac, status: 'waiting' as const };
    }

    if (ac.status === 'holding' || ac.speedKts === 0) {
      return ac;
    }

    const routeEdges = routeToEdges(ac.assignedRoute, graph.edges) ?? [];
    if (ac.routeEdgeIndex >= routeEdges.length) {
      return { ...ac, status: 'arrived' as const, speedKts: 0 };
    }

    const currentEdge = graph.edges.find(e => e.id === routeEdges[ac.routeEdgeIndex]);
    const fromNode = getNodePos(ac.assignedRoute[ac.routeEdgeIndex], graph);
    const toNode = getNodePos(ac.assignedRoute[ac.routeEdgeIndex + 1], graph);

    if (!currentEdge || !fromNode || !toNode) {
      return { ...ac, status: 'arrived' as const, speedKts: 0 };
    }

    // ── RUNWAY OCCUPANCY SAFETY ──
    const nextNodeId = ac.assignedRoute[ac.routeEdgeIndex + 1];
    const nextEdgeId = routeEdges[ac.routeEdgeIndex + 1];
    const targetCorridor = getRunwayCorridor(nextEdgeId, nextNodeId);
    const currentCorridor = getRunwayCorridor(currentEdge.id, fromNode.id);

    if (targetCorridor && targetCorridor !== currentCorridor) {
      const occupantId = currentOccupancy[targetCorridor];
      if (occupantId && occupantId !== ac.id) {
        // Runway occupied by another aircraft: MUST HOLD at Stop Bar
        return {
          ...ac,
          status: 'holding' as const,
          holdReason: 'stop-bar' as const,
          speedKts: 0,
        };
      } else {
        currentOccupancy[targetCorridor] = ac.id;
      }
    }

    if (currentCorridor && !targetCorridor) {
      if (currentOccupancy[currentCorridor] === ac.id) {
        currentOccupancy[currentCorridor] = null;
        clearedRunways.push({ corridor: currentCorridor, callsign: ac.callsign, order: ac.queueOrder });
      }
    }

    // Distance step using exact kinematics and strict numeric guards
    const speedMetersPerSecond = Number.isFinite(ac.speedKts) ? ac.speedKts * 0.5144 : 15 * 0.5144;
    let edgeLengthMs = 50;
    if (currentEdge && Number.isFinite(currentEdge.lengthMeters) && currentEdge.lengthMeters > 0) {
      edgeLengthMs = currentEdge.lengthMeters;
    } else {
      console.warn(`[Kinematics Fallback] Edge ${currentEdge?.id || 'unknown'} has invalid length (${currentEdge?.lengthMeters}m). Fallback 50m applied.`);
    }

    const deltaProgress = Number.isFinite(speedMetersPerSecond) && Number.isFinite(dt) && edgeLengthMs > 0
      ? Math.max(0, (speedMetersPerSecond * dt) / edgeLengthMs)
      : 0;
    const nextProgress = Number.isFinite(ac.progressOnEdge)
      ? ac.progressOnEdge + deltaProgress
      : 0;

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
        if (currentCorridor && currentOccupancy[currentCorridor] === ac.id) {
          currentOccupancy[currentCorridor] = null;
          clearedRunways.push({ corridor: currentCorridor, callsign: ac.callsign, order: ac.queueOrder });
        }
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
    runwayOccupancy: currentOccupancy,
    elapsedSeconds: elapsed,
  };

  // ── SEQUENTIAL AIRCRAFT RELEASE AFTER RUNWAY_CLEARED ──
  for (const cleared of clearedRunways) {
    nextState = logScenarioEvent(nextState, `[RUNWAY_CLEARED] ${cleared.corridor} by ${cleared.callsign}`, 'info');

    // Find next queued aircraft for this runway
    const nextInQueue = nextState.scenarioAircraft?.find(
      (a: any) => a.status === 'queued' && (a.queueRunway === cleared.corridor || !a.queueRunway)
    );

    if (nextInQueue) {
      nextState.scenarioAircraft = nextState.scenarioAircraft?.map((a: any) => {
        if (a.id === nextInQueue.id) {
          return {
            ...a,
            status: 'taxiing',
            speedKts: 15,
          };
        }
        return a;
      });
      nextState = logScenarioEvent(nextState, `[AIRCRAFT_RELEASED] ${nextInQueue.callsign}`, 'info');
    }
  }

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

  // ── EVALUATE RUNTIME OBSERVATIONS ─────────────────────────────────────────
  if (nextState.scenario && nextState.scenario.observations) {
    const updatedObservations = nextState.scenario.observations.map((obs: ScenarioObservation) => {
      if (obs.status === 'pass') return obs; // already verified pass

      if (obs.check) {
        const res = obs.check(nextState, graph);
        if (res.pass) {
          return {
            ...obs,
            status: 'pass' as const,
            checkedAtSeconds: elapsed,
            evidence: res.evidence || `Xác nhận lúc ${elapsed.toFixed(1)}s`,
          };
        } else if (res.fail) {
          return {
            ...obs,
            status: 'fail' as const,
            checkedAtSeconds: elapsed,
            evidence: res.evidence || `Không đạt lúc ${elapsed.toFixed(1)}s`,
          };
        }
      }
      return obs;
    });

    nextState.scenario.observations = updatedObservations;
  }

  // Check scenario completion
  const allObsPass = !nextState.scenario?.observations || nextState.scenario.observations.every((o: ScenarioObservation) => !o.required || o.status === 'pass');
  const allArrived = nextState.scenarioAircraft && nextState.scenarioAircraft.length > 0 && nextState.scenarioAircraft.every((ac: ScenarioAircraft) => ac.status === 'arrived' || ac.status === 'departed');

  if (nextState.scenario && !nextState.scenario.completed && allArrived) {
    if (allObsPass) {
      nextState = logScenarioEvent(nextState, 'Kịch bản hoàn tất — tất cả tiêu chí quan sát đã đạt chuẩn 100%.', 'info');
      if (nextState.scenario) {
        nextState.scenario.completed = true;
      }
    } else {
      nextState = logScenarioEvent(nextState, 'Chưa đạt — còn điều kiện cần quan sát chưa được xác nhận.', 'warning');
    }
  }

  nextState.lightStates = computeScenarioLightStates(nextState.scenarioAircraft ?? [], nextState.blockedEdgeIds, graph);

  return nextState;
}
