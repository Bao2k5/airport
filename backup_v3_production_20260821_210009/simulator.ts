import type {
  Aircraft,
  AirportEdge,
  AirportGraph,
  AirlineCode,
  LiveEventLogItem,
  RunwayOccupancyState,
  SimulationConfig,
  SimulationState,
  TrafficLevel,
} from '../types';
import { airportGraphV3 as airportGraph } from '../data/airportGraph.v3';
import { getAircraftSpec } from '../data/aircraftTypes';
import { getAirlineDef, AIRLINES } from '../data/airlineTypes';
import { findPath, routeToEdges, estimateTravelTimeSeconds } from './pathfinding';

const KNOTS_TO_MS = 0.5144;

/** Apply weather speed penalty (fraction of max speed to use) */
export function weatherSpeedFactor(config: SimulationConfig): number {
  switch (config.weather) {
    case 'fog':          return 0.45;
    case 'thunderstorm': return 0.35;
    case 'rain':         return 0.70;
    default:             return 1.00;
  }
}

/** Apply traffic speed penalty */
export function trafficSpeedFactor(config: SimulationConfig): number {
  switch (config.trafficLevel) {
    case 'high':   return 0.55;
    case 'medium': return 0.75;
    default:       return 1.00;
  }
}

/**
 * Effective taxi speed (kts) taking aircraft type, weather and traffic into account.
 */
export function effectiveTaxiSpeedKts(config: SimulationConfig): number {
  const spec = getAircraftSpec(config.aircraftType);
  const baseSpeed = Math.min(config.taxiSpeedKts, spec.maxTaxiKts);
  return baseSpeed * spec.speedFactor * weatherSpeedFactor(config) * trafficSpeedFactor(config);
}

// ── Background traffic (visual-only) ──────────────────────────────────────────
const NO_BLOCKED: Set<string> = new Set();

function getRunwayEdgeIds(graph: AirportGraph): Set<string> {
  return new Set(graph.edges.filter(e => e.type === 'runway').map(e => e.id));
}

function bgAvoid(graph: AirportGraph, ...extra: Set<string>[]): Set<string> {
  const s = getRunwayEdgeIds(graph);
  for (const set of extra) for (const id of set) s.add(id);
  return s;
}

function backgroundTrafficCount(level: TrafficLevel): number {
  switch (level) {
    case 'high':   return 2;
    case 'medium': return 1;
    default:       return 0;
  }
}

function pickId(pool: { id: string }[]): string {
  if (!pool.length) return '';
  return pool[Math.floor(Math.random() * pool.length)].id;
}

function getRampNodes(graph: AirportGraph) {
  const nodes = graph.nodes.filter(n => n.type === 'stand' || n.id.startsWith('DOM_S') || n.id.startsWith('INTL_S') || n.id.startsWith('P') || n.id.startsWith('ST'));
  return nodes.length ? nodes : graph.nodes.slice(0, 5);
}

function getHoldingNodes(graph: AirportGraph) {
  const nodes = graph.nodes.filter(n => n.type === 'holding_point' || n.id.startsWith('H') || n.id.startsWith('HS'));
  return nodes.length ? nodes : graph.nodes.slice(-5);
}

function oppositeEndpoint(fromId: string, graph: AirportGraph): string {
  const hp = getHoldingNodes(graph);
  const ramps = getRampNodes(graph);
  const isHp = hp.some(n => n.id === fromId);
  return isHp ? pickId(ramps) : pickId(hp);
}

function randomRoute(
  fromId: string,
  avoid: Set<string> = NO_BLOCKED,
  graph: AirportGraph = airportGraph,
): { dest: string; route: string[] } | null {
  const blocked = bgAvoid(graph, avoid);
  for (let i = 0; i < 14; i++) {
    const dest = oppositeEndpoint(fromId, graph);
    if (!dest || dest === fromId) continue;
    const route = findPath(graph, fromId, dest, blocked);
    if (route && route.length > 1) return { dest, route };
  }
  return null;
}

export function spawnBackgroundTraffic(
  config: SimulationConfig,
  reserved: Set<string> = NO_BLOCKED,
  graph: AirportGraph = airportGraph,
): Aircraft[] {
  const count = backgroundTrafficCount(config.trafficLevel);
  if (count === 0) return [];

  const weatherFactor = weatherSpeedFactor(config);
  const fleet: Aircraft[] = [];
  let attempts = 0;

  const ramps = getRampNodes(graph);
  const hp = getHoldingNodes(graph);
  const airlineCodes: AirlineCode[] = ['VN', 'VJ', 'QH', 'VU', 'SQ', 'TG'];

  while (fleet.length < count && attempts < count * 20) {
    attempts++;
    const start = Math.random() < 0.7 ? pickId(ramps) : pickId(hp);
    if (!start) continue;
    const plan = randomRoute(start, reserved, graph);
    if (!plan) continue;

    const routeEdgeIds = routeToEdges(plan.route, graph.edges) ?? [];
    if (!routeEdgeIds.length) continue;

    const startIdx = Math.floor(Math.random() * routeEdgeIds.length);
    const baseSpeedKts = 10 + Math.random() * 6;
    const aCode = airlineCodes[fleet.length % airlineCodes.length];
    const aDef = AIRLINES[aCode];

    const candidate: Aircraft = {
      id: `BG${fleet.length + 1}`,
      callsign: `${aCode}${100 + fleet.length}`,
      airline: aDef.name,
      airlineCode: aCode,
      airlineName: aDef.name,
      aircraftAsset: aDef.asset,
      aircraftType: 'A321',
      currentNodeId: plan.route[startIdx],
      targetNodeId: plan.dest,
      currentEdgeId: routeEdgeIds[startIdx],
      progressOnEdge: Math.random(),
      speedKts: baseSpeedKts * weatherFactor,
      status: 'taxiing',
      assignedRoute: plan.route,
      routeEdgeIndex: startIdx,
    };

    if (candidate.currentEdgeId && reserved.has(candidate.currentEdgeId)) continue;
    const cp = aircraftXY(candidate, graph);
    const clash = fleet.some(f => {
      if (f.currentEdgeId === candidate.currentEdgeId) return true;
      const fp = aircraftXY(f, graph);
      return cp && fp && Math.hypot(cp.x - fp.x, cp.y - fp.y) < 15;
    });
    if (clash) continue;

    fleet.push(candidate);
  }

  return fleet;
}

function aircraftXY(ac: Aircraft, graph: AirportGraph = airportGraph): { x: number; y: number } | null {
  const f = graph.nodes.find(n => n.id === ac.assignedRoute[ac.routeEdgeIndex]);
  const t = graph.nodes.find(n => n.id === ac.assignedRoute[ac.routeEdgeIndex + 1]);
  if (!f || !t) return null;
  return { x: f.x + (t.x - f.x) * ac.progressOnEdge, y: f.y + (t.y - f.y) * ac.progressOnEdge };
}

/** Build the initial set of blocked edge IDs from incident + edge statuses */
export function buildBlockedEdgeIds(
  config: SimulationConfig,
  edges: AirportEdge[]
): Set<string> {
  const blocked = new Set<string>();

  for (const e of edges) {
    if (e.status === 'closed' || e.status === 'restricted') {
      blocked.add(e.id);
    }
  }

  if (config.incidentEdgeId && config.incident !== 'none') {
    blocked.add(config.incidentEdgeId);
  }

  return blocked;
}

/** Compute light states for all edges based on aircraft position and route */
export function computeLightStates(
  aircraft: Aircraft,
  blockedEdgeIds: Set<string>,
  graph: AirportGraph = airportGraph,
): Record<string, 'green' | 'red' | 'off'> {
  const lights: Record<string, 'green' | 'red' | 'off'> = {};

  if (!aircraft || !aircraft.assignedRoute || !aircraft.assignedRoute.length) return lights;

  const allEdges = graph.edges;
  const routeEdgeIds = routeToEdges(aircraft.assignedRoute, allEdges) ?? [];

  for (const edge of allEdges) {
    if (blockedEdgeIds.has(edge.id)) {
      lights[edge.id] = 'red';
      continue;
    }

    const idxInRoute = routeEdgeIds.indexOf(edge.id);
    if (idxInRoute === -1) {
      lights[edge.id] = 'off';
      continue;
    }

    const currentEdgeRouteIdx = aircraft.routeEdgeIndex;

    if (idxInRoute < currentEdgeRouteIdx) {
      lights[edge.id] = 'off';
    } else {
      lights[edge.id] = 'green';
    }
  }

  return lights;
}

// ── 6 Manual Aircraft Factory ──────────────────────────────────────────────────
export const CANONICAL_FLEET_SPECS: {
  id: string;
  callsign: string;
  airlineCode: AirlineCode;
  type: SimulationConfig['aircraftType'];
  startId: string;
  destId: string;
}[] = [
  { id: 'VN001', callsign: 'VN001', airlineCode: 'VJ', type: 'A321', startId: 'v3_line_33_p00', destId: 'v3_line_05_p07' }, // STAND_10 -> STOP BAR 25L
  { id: 'VN002', callsign: 'VN002', airlineCode: 'VN', type: 'A321', startId: 'v3_line_31_p00', destId: 'v3_line_01_p03' }, // STAND_12 -> STOP BAR 25R
  { id: 'VN003', callsign: 'VN003', airlineCode: 'QH', type: 'B737', startId: 'v3_line_32_p00', destId: 'v3_line_05_p07' }, // STAND_11 -> STOP BAR 25L
  { id: 'VN004', callsign: 'VN004', airlineCode: 'VU', type: 'A321', startId: 'v3_line_29_p01', destId: 'v3_line_01_p03' }, // STAND_7 -> STOP BAR 25R
  { id: 'VN005', callsign: 'VN005', airlineCode: 'SQ', type: 'A350', startId: 'v3_line_22_p01', destId: 'v3_line_03_p00' }, // STAND_17 -> W5/07L
  { id: 'VN006', callsign: 'VN006', airlineCode: 'TG', type: 'A350', startId: 'v3_line_26_p04', destId: 'v3_line_16_p01' }, // STAND_22 -> W11/07R
];

export function createDefaultManualFleet(
  graph: AirportGraph = airportGraph,
  _unusedConfig?: SimulationConfig,
): Aircraft[] {
  const staticBlockedEdgeIds = new Set<string>();
  for (const e of graph.edges) {
    if (e.status === 'closed' || e.status === 'restricted') staticBlockedEdgeIds.add(e.id);
  }

  return CANONICAL_FLEET_SPECS.map(spec => {
    const route = findPath(graph, spec.startId, spec.destId, staticBlockedEdgeIds) || [spec.startId];
    const routeEdgeIds = routeToEdges(route, graph.edges);
    const airlineDef = getAirlineDef(spec.airlineCode);

    return {
      id: spec.id,
      callsign: spec.callsign,
      airline: airlineDef.name,
      airlineCode: spec.airlineCode,
      airlineName: airlineDef.name,
      aircraftAsset: airlineDef.asset,
      aircraftType: spec.type,
      currentNodeId: spec.startId,
      targetNodeId: spec.destId,
      currentEdgeId: routeEdgeIds ? routeEdgeIds[0] : null,
      progressOnEdge: 0,
      speedKts: 0,
      status: 'parked' as const,
      isMoving: false,
      routeVisible: false,
      guidanceVisible: false,
      assignedRoute: route,
      routeEdgeIndex: 0,
    };
  });
}

/**
 * Sanitize and heal manual fleet state against corruption:
 * - Ensures exactly 6 unique aircraft: VN001, VN002, VN003, VN004, VN005, VN006.
 * - Prevents duplicate IDs, duplicate callsigns, or stand collisions at initial parking.
 * - Reconstructs missing/corrupted aircraft from canonical specs.
 */
export function sanitizeManualFleet(
  fleet: Aircraft[] | undefined,
  graph: AirportGraph = airportGraph,
): Aircraft[] {
  const defaultFleet = createDefaultManualFleet(graph);
  if (!fleet || !Array.isArray(fleet) || fleet.length === 0) {
    return defaultFleet;
  }

  const defaultMap = new Map(defaultFleet.map(a => [a.id, a]));
  const seenIds = new Set<string>();
  const seenCallsigns = new Set<string>();
  const seenParkedStands = new Set<string>();
  let hasCorruption = false;

  // Check if exactly 6 canonical IDs exist
  for (const requiredId of CANONICAL_FLEET_SPECS.map(s => s.id)) {
    const matches = fleet.filter(a => a && a.id === requiredId);
    if (matches.length !== 1) {
      hasCorruption = true;
      break;
    }
  }

  if (!hasCorruption) {
    for (const ac of fleet) {
      if (!ac || !ac.id || seenIds.has(ac.id)) {
        hasCorruption = true;
        break;
      }
      seenIds.add(ac.id);

      const effectiveCallsign = ac.callsign || ac.id;
      if (seenCallsigns.has(effectiveCallsign)) {
        hasCorruption = true;
        break;
      }
      seenCallsigns.add(effectiveCallsign);

      if (ac.status === 'parked') {
        if (seenParkedStands.has(ac.currentNodeId)) {
          hasCorruption = true;
          break;
        }
        seenParkedStands.add(ac.currentNodeId);
      }
    }
  }

  if (hasCorruption) {
    console.warn('[FleetSanitizer] Rebuilding clean canonical 6-aircraft fleet.');
    return CANONICAL_FLEET_SPECS.map(spec => {
      const canonicalDefault = defaultMap.get(spec.id)!;
      const existing = fleet.find(a => a && a.id === spec.id);
      if (!existing) return canonicalDefault;

      const airlineDef = getAirlineDef(existing.airlineCode || spec.airlineCode);
      const isCustomCallsignValid = existing.callsign && !CANONICAL_FLEET_SPECS.some(s => s.id !== spec.id && s.callsign === existing.callsign);
      const safeCallsign = isCustomCallsignValid ? existing.callsign : spec.callsign;

      const safeCurrentNode = (existing.status === 'taxiing' || existing.status === 'holding')
        ? existing.currentNodeId
        : spec.startId;

      const route = findPath(graph, safeCurrentNode, existing.targetNodeId || spec.destId) || [safeCurrentNode];
      const routeEdges = routeToEdges(route, graph.edges);

      return {
        ...canonicalDefault,
        callsign: safeCallsign,
        airlineCode: (existing.airlineCode || spec.airlineCode) as any,
        airlineName: airlineDef.name,
        aircraftAsset: airlineDef.asset,
        aircraftType: existing.aircraftType || spec.type,
        currentNodeId: safeCurrentNode,
        targetNodeId: existing.targetNodeId || spec.destId,
        assignedRoute: route,
        currentEdgeId: routeEdges ? routeEdges[0] : null,
        status: existing.status === 'taxiing' ? ('taxiing' as const) : ('parked' as const),
        isMoving: existing.status === 'taxiing',
        routeVisible: existing.status === 'taxiing',
        guidanceVisible: existing.status === 'taxiing',
      };
    });
  }

  return fleet;
}

function appendLiveLog(
  logs: LiveEventLogItem[] | undefined,
  item: Omit<LiveEventLogItem, 'id'>,
): LiveEventLogItem[] {
  const current = logs || [];
  const next = [
    ...current,
    {
      ...item,
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    },
  ];
  return next.slice(-100);
}

/**
 * Start moving a specific aircraft in the manual fleet by its ID
 */
export function startManualAircraft(
  state: SimulationState,
  aircraftId: string,
  graph: AirportGraph = airportGraph,
): SimulationState {
  if (!state.manualFleet || state.manualFleet.length === 0) {
    if (state.aircraft) {
      return {
        ...state,
        isRunning: true,
        isPaused: false,
        aircraft: {
          ...state.aircraft,
          status: 'taxiing',
          isMoving: true,
          routeVisible: true,
          guidanceVisible: true,
        },
      };
    }
    return state;
  }

  const updatedFleet = state.manualFleet.map(ac => {
    if (ac.id === aircraftId) {
      const route = ac.assignedRoute && ac.assignedRoute.length >= 2
        ? ac.assignedRoute
        : (findPath(graph, ac.currentNodeId, ac.targetNodeId) || [ac.currentNodeId]);
      const routeEdgeIds = routeToEdges(route, graph.edges);

      return {
        ...ac,
        status: 'taxiing' as const,
        isMoving: true,
        routeVisible: true,
        guidanceVisible: true,
        assignedRoute: route,
        currentEdgeId: routeEdgeIds ? routeEdgeIds[ac.routeEdgeIndex] : null,
      };
    }
    return ac;
  });

  const selectedAc = updatedFleet.find(a => a.id === aircraftId) || updatedFleet[0];
  const newLogs = appendLiveLog(state.liveEventLog, {
    atSeconds: state.elapsedSeconds,
    callsign: selectedAc.callsign,
    message: `Tàu bay ${selectedAc.callsign} (${selectedAc.airlineName}) bắt đầu lăn bánh từ ${selectedAc.currentNodeId} ra ${selectedAc.targetNodeId}.`,
    severity: 'info',
  });

  return {
    ...state,
    isRunning: true,
    isPaused: false,
    manualFleet: updatedFleet,
    aircraft: selectedAc,
    selectedAircraftId: aircraftId,
    warningMessage: null,
    liveEventLog: newLogs,
  };
}

/**
 * Reset simulation state completely from Scenario mode back to Manual Control mode.
 * Completely removes scenario state, clears scenario aircraft, recreates manual fleet with 6 parked aircraft,
 * clears dynamic incidents, and preserves the selected graph and configuration.
 */
export function resetToManualMode(
  state: SimulationState,
  graph: AirportGraph = airportGraph,
): SimulationState {
  const staticBlockedEdgeIds = new Set<string>();
  for (const e of graph.edges) {
    if (e.status === 'closed' || e.status === 'restricted') {
      staticBlockedEdgeIds.add(e.id);
    }
  }

  const manualFleet = createDefaultManualFleet(graph);
  const selectedId = CANONICAL_FLEET_SPECS.some(s => s.id === state.selectedAircraftId)
    ? state.selectedAircraftId!
    : 'VN001';
  const selectedAc = manualFleet.find(a => a.id === selectedId) || manualFleet[0];

  const effectiveSpeed = effectiveTaxiSpeedKts(state.config);
  const eta = selectedAc ? estimateTravelTimeSeconds(selectedAc.assignedRoute, graph.edges, effectiveSpeed) : null;

  return {
    aircraft: selectedAc,
    manualFleet,
    selectedAircraftId: selectedId,
    trafficAircraft: spawnBackgroundTraffic(state.config, new Set(), graph),
    config: {
      ...state.config,
      callsign: selectedAc.callsign,
      airlineCode: selectedAc.airlineCode || 'VJ',
      aircraftType: selectedAc.aircraftType || 'A321',
      startNodeId: selectedAc.currentNodeId,
      destinationNodeId: selectedAc.targetNodeId,
      incident: 'none',
      incidentEdgeId: null,
    },
    isRunning: false,
    isPaused: false,
    routeStatus: 'pending',
    elapsedSeconds: 0,
    etaSeconds: eta,
    warningMessage: null,
    lightStates: selectedAc ? computeLightStates(selectedAc, staticBlockedEdgeIds, graph) : {},
    blockedEdgeIds: staticBlockedEdgeIds,
    liveEventLog: [
      {
        id: `manual_ready_${Date.now()}`,
        atSeconds: 0,
        message: 'Đã chuyển về chế độ Điều khiển thủ công. 6 máy bay sẵn sàng tại sân đỗ.',
        severity: 'info',
      },
    ],
    scenario: undefined,
    scenarioAircraft: undefined,
  };
}

/**
 * Reset a specific aircraft in the manual fleet back to its initial parking stand
 */
export function resetManualAircraft(
  state: SimulationState,
  aircraftId: string,
  graph: AirportGraph = airportGraph,
): SimulationState {
  const sanitizedFleet = sanitizeManualFleet(state.manualFleet, graph);
  const defaultFleet = createDefaultManualFleet(graph);
  const defaultSpec = defaultFleet.find(a => a.id === aircraftId) || defaultFleet[0];

  const updatedFleet = sanitizedFleet.map(ac => {
    if (ac.id === aircraftId) {
      return {
        ...defaultSpec,
        status: 'parked' as const,
        isMoving: false,
        routeVisible: false,
        guidanceVisible: false,
        progressOnEdge: 0,
        routeEdgeIndex: 0,
      };
    }
    return ac;
  });

  const selectedId = sanitizedFleet.some(a => a.id === state.selectedAircraftId)
    ? state.selectedAircraftId!
    : aircraftId;
  const selectedAc = updatedFleet.find(a => a.id === selectedId) || updatedFleet[0];
  const anyTaxiing = updatedFleet.some(a => a.status === 'taxiing');
  const newLogs = appendLiveLog(state.liveEventLog, {
    atSeconds: state.elapsedSeconds,
    callsign: defaultSpec.callsign,
    message: `Tàu bay ${defaultSpec.callsign} đã được đặt lại về vị trí sân đỗ ${defaultSpec.currentNodeId}.`,
    severity: 'info',
  });

  return {
    ...state,
    scenario: undefined,
    scenarioAircraft: undefined,
    isRunning: anyTaxiing,
    manualFleet: updatedFleet,
    aircraft: selectedAc,
    selectedAircraftId: selectedId,
    liveEventLog: newLogs,
  };
}

function getAircraftCoordinate(ac: Aircraft, graph: AirportGraph): { x: number; y: number } | null {
  if (ac.assignedRoute && ac.assignedRoute.length >= 2 && ac.routeEdgeIndex < ac.assignedRoute.length - 1) {
    const f = graph.nodes.find(n => n.id === ac.assignedRoute[ac.routeEdgeIndex]);
    const t = graph.nodes.find(n => n.id === ac.assignedRoute[ac.routeEdgeIndex + 1]);
    if (f && t) {
      const prog = Math.max(0, Math.min(1, ac.progressOnEdge));
      return { x: f.x + (t.x - f.x) * prog, y: f.y + (t.y - f.y) * prog };
    }
  }
  const n = graph.nodes.find(n => n.id === ac.currentNodeId);
  return n ? { x: n.x, y: n.y } : null;
}

export type RunwayCorridor = 'NORTH' | 'SOUTH' | null;

export function getRunwayCorridor(edgeId: string | null | undefined, nodeId?: string | null): RunwayCorridor {
  if (edgeId) {
    if (edgeId.startsWith('RWY1_SEG_') || edgeId.startsWith('v3_line_01_s')) return 'NORTH';
    if (edgeId.startsWith('RWY2_SEG_') || edgeId.startsWith('v3_line_05_s')) return 'SOUTH';
  }
  if (nodeId && !edgeId) {
    if (nodeId.startsWith('v3_line_01_p') || ['RWY07L_THR', 'RWY25R_THR', 'R1_W4', 'R1_MID_V2', 'R1_NS_ENTRY_V2', 'R1_NS'].includes(nodeId)) return 'NORTH';
    if (nodeId.startsWith('v3_line_05_p') || ['RWY07R_THR', 'RWY25L_THR', 'R2_W11_ENTRY_V2', 'R2_W7', 'R2_W6_EXIT_V2', 'R2_W5', 'R2_W3', 'R2_NS2_V2', 'R2_E1_EXIT_V2', 'R2_E4', 'R2_W6_CROSS'].includes(nodeId)) return 'SOUTH';
  }
  return null;
}

export function isRunwayNodeOrEdge(nodeId?: string | null, edge?: AirportEdge | null): boolean {
  return getRunwayCorridor(edge?.id, nodeId) !== null;
}

/** Step the simulation forward by dt seconds */
export function simulationTick(
  state: SimulationState,
  dt: number,
  graph: AirportGraph = airportGraph,
): SimulationState {
  if (!state.isRunning || state.isPaused) return state;

  const fleet = state.manualFleet && state.manualFleet.length
    ? state.manualFleet
    : (state.aircraft ? [state.aircraft] : []);

  let tickLogs = state.liveEventLog || [];

  // 1. Identify which runway corridors are currently occupied (NORTH: 07L/25R, SOUTH: 07R/25L)
  const currentOccupancy: RunwayOccupancyState = {
    NORTH: state.runwayOccupancy?.NORTH || null,
    SOUTH: state.runwayOccupancy?.SOUTH || null,
  };

  for (const ac of fleet) {
    if (ac.status !== 'taxiing' && ac.status !== 'holding') continue;
    const corridor = getRunwayCorridor(ac.currentEdgeId, ac.currentNodeId);
    if (corridor) {
      currentOccupancy[corridor] = ac.id;
    }
  }

  // 2. Pre-calculate aircraft coordinates for separation checks
  const coords = new Map<string, { x: number; y: number }>();
  for (const ac of fleet) {
    const pt = getAircraftCoordinate(ac, graph);
    if (pt) coords.set(ac.id, pt);
  }

  const updatedFleet = fleet.map(ac => {
    // Only aircraft with status === 'taxiing' or 'holding' are evaluated. Parked stays parked.
    if (ac.status !== 'taxiing' && ac.status !== 'holding') {
      return ac;
    }

    const effectiveSpeed = effectiveTaxiSpeedKts({
      ...state.config,
      aircraftType: ac.aircraftType || state.config.aircraftType,
      taxiSpeedKts: state.config.taxiSpeedKts,
    }) * 0.85; // Giảm tốc độ lăn bánh xuống một chút theo yêu cầu
    const effectiveSpeedMs = effectiveSpeed * KNOTS_TO_MS;
    const edges = graph.edges;
    const routeEdgeIds = routeToEdges(ac.assignedRoute, edges) ?? [];

    if (ac.routeEdgeIndex >= routeEdgeIds.length) {
      tickLogs = appendLiveLog(tickLogs, {
        atSeconds: state.elapsedSeconds + dt,
        callsign: ac.callsign,
        message: `Tàu bay ${ac.callsign} đã đến đích ${ac.targetNodeId} an toàn.`,
        severity: 'info',
      });
      return {
        ...ac,
        status: 'arrived' as const,
        currentNodeId: ac.assignedRoute[ac.assignedRoute.length - 1],
        progressOnEdge: 1,
        speedKts: 0,
      };
    }

    const currentEdgeId = routeEdgeIds[ac.routeEdgeIndex];
    const remainingEdgeIds = routeEdgeIds.slice(ac.routeEdgeIndex);
    const currentBlocked = state.blockedEdgeIds.has(currentEdgeId);
    const blockAhead = remainingEdgeIds.some(id => state.blockedEdgeIds.has(id));

    // Dynamic Rerouting via Dijkstra
    if (blockAhead && state.config.autoReroute) {
      const fromNode = ac.assignedRoute[ac.routeEdgeIndex];
      const reroutedPath = currentBlocked
        ? findPath(graph, fromNode, ac.targetNodeId, state.blockedEdgeIds)
        : findPath(graph, ac.assignedRoute[ac.routeEdgeIndex + 1], ac.targetNodeId, state.blockedEdgeIds);

      if (reroutedPath && reroutedPath.length > 1) {
        const fullPath = currentBlocked ? reroutedPath : [fromNode, ...reroutedPath];
        const newEdges = routeToEdges(fullPath, edges) ?? [];
        const totalMeters = newEdges.reduce((sum, eId) => sum + (edges.find(e => e.id === eId)?.lengthMeters || 0), 0);
        tickLogs = appendLiveLog(tickLogs, {
          atSeconds: state.elapsedSeconds + dt,
          callsign: ac.callsign,
          message: `Sự cố đoạn [${Array.from(state.blockedEdgeIds).join(', ')}] — ${ac.callsign} đã tự động đổi tuyến (Dijkstra) sang [${fullPath.join(' → ')}], tổng chi phí: ${totalMeters.toFixed(0)}m.`,
          severity: 'warning',
        });
        return {
          ...ac,
          assignedRoute: fullPath,
          routeEdgeIndex: 0,
          progressOnEdge: currentBlocked ? 0 : ac.progressOnEdge,
          currentNodeId: fromNode,
          currentEdgeId: newEdges ? newEdges[0] : null,
          status: 'taxiing' as const,
          holdReason: undefined,
        };
      }
    }

    // ── RUNWAY OCCUPANCY SAFETY (Strict 1 aircraft per runway max) ──
    const nextNode = ac.assignedRoute[ac.routeEdgeIndex + 1];
    const nextEdge = edges.find(e => e.id === routeEdgeIds[ac.routeEdgeIndex + 1]);
    const targetCorridor = getRunwayCorridor(nextEdge?.id, nextNode);
    const currentCorridor = getRunwayCorridor(ac.currentEdgeId, ac.currentNodeId);

    if (targetCorridor && targetCorridor !== currentCorridor) {
      const occupantId = currentOccupancy[targetCorridor];
      if (occupantId && occupantId !== ac.id) {
        const occupantAc = fleet.find(f => f.id === occupantId);
        if (ac.status !== 'holding' || ac.holdReason !== 'stop-bar') {
          tickLogs = appendLiveLog(tickLogs, {
            atSeconds: state.elapsedSeconds + dt,
            callsign: ac.callsign,
            message: `[HOLDING_AT_STOP_BAR] Tàu bay ${ac.callsign} dừng trước Stop Bar vì Runway ${targetCorridor} đang bị chiếm dụng bởi ${occupantAc?.callsign || occupantId}.`,
            severity: 'warning',
          });
        }
        return {
          ...ac,
          status: 'holding' as const,
          holdReason: 'stop-bar',
          speedKts: 0,
        };
      } else {
        // Reserve runway corridor
        currentOccupancy[targetCorridor] = ac.id;
        if (ac.status === 'holding' && ac.holdReason === 'stop-bar') {
          tickLogs = appendLiveLog(tickLogs, {
            atSeconds: state.elapsedSeconds + dt,
            callsign: ac.callsign,
            message: `[RUNWAY_OCCUPIED] Runway ${targetCorridor} đã giải phóng — ${ac.callsign} tiến vào chiếm dụng đường băng.`,
            severity: 'info',
          });
        }
      }
    }

    if (currentCorridor && !targetCorridor) {
      if (currentOccupancy[currentCorridor] === ac.id) {
        currentOccupancy[currentCorridor] = null;
        tickLogs = appendLiveLog(tickLogs, {
          atSeconds: state.elapsedSeconds + dt,
          callsign: ac.callsign,
          message: `[RUNWAY_CLEARED] Tàu bay ${ac.callsign} đã hoàn tất thoát khỏi Runway ${currentCorridor} an toàn.`,
          severity: 'info',
        });
      }
    }

    // Check Junction / Separation conflict with other active aircraft
    const myPos = coords.get(ac.id);
    if (myPos) {
      for (const other of fleet) {
        if (other.id === ac.id) continue;
        if (other.status !== 'taxiing' && other.status !== 'holding') continue;
        const otherPos = coords.get(other.id);
        if (!otherPos) continue;

        const dist = Math.hypot(myPos.x - otherPos.x, myPos.y - otherPos.y);
        if (dist < 22) {
          // Compare priority (canonical spec index)
          const myIdx = CANONICAL_FLEET_SPECS.findIndex(s => s.id === ac.id);
          const otherIdx = CANONICAL_FLEET_SPECS.findIndex(s => s.id === other.id);
          if (myIdx > otherIdx) {
            // Lower priority yields
            if (ac.status !== 'holding' || ac.holdReason !== 'separation') {
              tickLogs = appendLiveLog(tickLogs, {
                atSeconds: state.elapsedSeconds + dt,
                callsign: ac.callsign,
                message: `KSVKL: Giữ giãn cách giao lộ an toàn — ${ac.callsign} dừng nhường đường cho ${other.callsign}.`,
                severity: 'warning',
              });
            }
            return {
              ...ac,
              status: 'holding' as const,
              holdReason: 'separation',
              speedKts: 0,
            };
          }
        }
      }
    }

    // Resume taxiing if previously holding and path is now clear
    if (ac.status === 'holding' && (ac.holdReason === 'runway-occupied' || ac.holdReason === 'separation')) {
      tickLogs = appendLiveLog(tickLogs, {
        atSeconds: state.elapsedSeconds + dt,
        callsign: ac.callsign,
        message: `Đường lăn đã được giải phóng — ${ac.callsign} tiếp tục lăn bánh.`,
        severity: 'info',
      });
    }

    const currentEdge = edges.find(e => e.id === currentEdgeId);
    let edgeLengthMs = 50;
    if (currentEdge && Number.isFinite(currentEdge.lengthMeters) && currentEdge.lengthMeters > 0) {
      edgeLengthMs = currentEdge.lengthMeters;
    } else {
      console.warn(`[Kinematics Fallback] Edge ${currentEdge?.id || currentEdgeId || 'unknown'} has invalid length (${currentEdge?.lengthMeters}m). Fallback 50m applied.`);
    }

    const progressPerSecond = Number.isFinite(effectiveSpeedMs) && edgeLengthMs > 0
      ? effectiveSpeedMs / edgeLengthMs
      : 0;
    const deltaP = Number.isFinite(progressPerSecond) && Number.isFinite(dt)
      ? Math.max(0, progressPerSecond * dt)
      : 0;

    let newProgress = Number.isFinite(ac.progressOnEdge)
      ? ac.progressOnEdge + deltaP
      : 0;
    let newEdgeIndex = ac.routeEdgeIndex;
    let newCurrentNodeId = ac.currentNodeId;

    while (newProgress >= 1 && newEdgeIndex < routeEdgeIds.length) {
      newProgress -= 1;
      newEdgeIndex++;
      if (newEdgeIndex < routeEdgeIds.length) {
        newCurrentNodeId = ac.assignedRoute[newEdgeIndex];
      } else {
        newCurrentNodeId = ac.assignedRoute[ac.assignedRoute.length - 1];
        newProgress = 1;
      }
    }

    if (newCurrentNodeId !== ac.currentNodeId) {
      const prevWasRunway = isRunwayNodeOrEdge(ac.currentNodeId, currentEdge);
      const nowIsTaxiway = !isRunwayNodeOrEdge(newCurrentNodeId, edges.find(e => e.id === routeEdgeIds[newEdgeIndex]));
      if (prevWasRunway && nowIsTaxiway) {
        tickLogs = appendLiveLog(tickLogs, {
          atSeconds: state.elapsedSeconds + dt,
          callsign: ac.callsign,
          message: `Tàu bay ${ac.callsign} đã clear runway, thoát an toàn sang đường lăn.`,
          severity: 'info',
        });
      }

      tickLogs = appendLiveLog(tickLogs, {
        atSeconds: state.elapsedSeconds + dt,
        callsign: ac.callsign,
        message: `${ac.callsign} đã qua điểm ${newCurrentNodeId}.`,
        severity: 'info',
      });
    }

    const isArrived = newEdgeIndex >= routeEdgeIds.length;
    if (isArrived) {
      tickLogs = appendLiveLog(tickLogs, {
        atSeconds: state.elapsedSeconds + dt,
        callsign: ac.callsign,
        message: `Tàu bay ${ac.callsign} đã đến đích ${ac.targetNodeId} an toàn.`,
        severity: 'info',
      });
    }

    return {
      ...ac,
      routeEdgeIndex: newEdgeIndex,
      progressOnEdge: Math.min(newProgress, 1),
      currentNodeId: newCurrentNodeId,
      currentEdgeId: newEdgeIndex < routeEdgeIds.length ? routeEdgeIds[newEdgeIndex] : null,
      speedKts: effectiveSpeed,
      status: isArrived ? ('arrived' as const) : ('taxiing' as const),
      holdReason: undefined,
    };
  });

  const selectedId = state.selectedAircraftId || 'VN001';
  const activeSelected = updatedFleet.find(a => a.id === selectedId) || updatedFleet[0] || null;

  return {
    ...state,
    aircraft: activeSelected,
    manualFleet: updatedFleet,
    elapsedSeconds: state.elapsedSeconds + dt,
    runwayOccupancy: currentOccupancy,
    lightStates: computeLightStates(activeSelected || state.aircraft!, state.blockedEdgeIds, graph),
    liveEventLog: tickLogs,
  };
}

/** Initialize a fresh simulation state from config */
export function initSimulation(
  config: SimulationConfig,
  graph: AirportGraph = airportGraph,
): SimulationState {
  const blockedEdgeIds = buildBlockedEdgeIds(config, graph.edges);
  const manualFleet = createDefaultManualFleet(graph);
  const selectedId = CANONICAL_FLEET_SPECS.some(s => s.id === config.callsign) ? config.callsign! : 'VN001';
  const selectedAircraft = manualFleet.find(a => a.id === selectedId) || manualFleet[0];

  const trafficAircraft = spawnBackgroundTraffic(config, new Set(), graph);
  const effectiveSpeed = effectiveTaxiSpeedKts(config);
  const eta = selectedAircraft ? estimateTravelTimeSeconds(selectedAircraft.assignedRoute, graph.edges, effectiveSpeed) : null;

  return {
    aircraft: selectedAircraft,
    manualFleet,
    selectedAircraftId: selectedAircraft ? selectedAircraft.id : 'VN001',
    trafficAircraft,
    config,
    isRunning: false,
    isPaused: false,
    routeStatus: 'pending',
    elapsedSeconds: 0,
    etaSeconds: eta,
    warningMessage: null,
    lightStates: selectedAircraft ? computeLightStates(selectedAircraft, blockedEdgeIds, graph) : {},
    blockedEdgeIds,
    runwayOccupancy: { NORTH: null, SOUTH: null },
    liveEventLog: [
      {
        id: 'init_ready',
        atSeconds: 0,
        message: 'Hệ thống Follow-the-Green và 6 máy bay sẵn sàng tại sân đỗ.',
        severity: 'info',
      },
    ],
  };
}

/** Activate lights after controller accepts the proposed route */
export function acceptRoute(
  state: SimulationState,
  graph: AirportGraph = airportGraph,
): SimulationState {
  const selectedId = state.selectedAircraftId || 'VN001';
  const updatedFleet = (state.manualFleet || []).map(ac => {
    if (ac.id === selectedId) {
      return {
        ...ac,
        routeVisible: true,
      };
    }
    return ac;
  });
  const activeAc = updatedFleet.find(a => a.id === selectedId) || state.aircraft;
  return {
    ...state,
    routeStatus: 'accepted',
    manualFleet: updatedFleet,
    aircraft: activeAc || null,
    lightStates: activeAc ? computeLightStates(activeAc, state.blockedEdgeIds, graph) : {},
  };
}

/** Block or unblock a taxiway edge live. */
export function setIncidentEdge(
  state: SimulationState,
  edgeId: string,
  blocked: boolean,
  graph: AirportGraph = airportGraph,
): SimulationState {
  const next = new Set(state.blockedEdgeIds);
  if (blocked) next.add(edgeId);
  else next.delete(edgeId);

  const activeAc = (state.manualFleet?.find(a => a.id === state.selectedAircraftId)) || state.aircraft;
  const newLogs = appendLiveLog(state.liveEventLog, {
    atSeconds: state.elapsedSeconds,
    callsign: activeAc?.callsign,
    message: blocked
      ? `Đoạn đường lăn [${edgeId}] phía trước ${activeAc?.callsign || 'tàu bay'} bị đóng / xảy ra sự cố.`
      : `Đoạn đường lăn [${edgeId}] đã được mở lại.`,
    severity: blocked ? 'warning' : 'info',
  });

  return {
    ...state,
    config: {
      ...state.config,
      incident: blocked ? (state.config.incident !== 'none' ? state.config.incident : 'blocked_taxiway') : (next.size === 0 ? 'none' : state.config.incident),
      incidentEdgeId: blocked ? edgeId : null,
    },
    blockedEdgeIds: next,
    warningMessage: blocked
      ? `Sự cố trên đường lăn [${edgeId}] — đang tính lại lộ trình…`
      : state.warningMessage,
    lightStates: activeAc
      ? computeLightStates(activeAc, next, graph)
      : state.lightStates,
    liveEventLog: newLogs,
  };
}

/** Clear all live incidents. */
export function clearIncidents(
  state: SimulationState,
  graph: AirportGraph = airportGraph,
): SimulationState {
  const next = new Set<string>();
  for (const e of graph.edges) {
    if (e.status === 'closed' || e.status === 'restricted') next.add(e.id);
  }
  const activeAc = state.aircraft || (state.manualFleet ? state.manualFleet[0] : null);
  const newLogs = appendLiveLog(state.liveEventLog, {
    atSeconds: state.elapsedSeconds,
    message: 'Đã giải tỏa toàn bộ sự cố chướng ngại vật trên các đường lăn.',
    severity: 'info',
  });

  return {
    ...state,
    config: {
      ...state.config,
      incident: 'none',
      incidentEdgeId: null,
    },
    blockedEdgeIds: next,
    warningMessage: null,
    lightStates: activeAc ? computeLightStates(activeAc, next, graph) : {},
    liveEventLog: newLogs,
  };
}

/** Pick a random edge strictly AHEAD of the aircraft on its current route */
export function randomIncidentEdge(
  state: SimulationState,
  graph: AirportGraph = airportGraph,
): string | null {
  const selectedId = state.selectedAircraftId;
  const ac = (state.manualFleet?.find(a => a.id === selectedId && a.status === 'taxiing'))
    || state.manualFleet?.find(a => a.status === 'taxiing')
    || state.aircraft
    || (state.manualFleet ? state.manualFleet[0] : null);
  if (!ac) return null;
  const routeEdgeIds = routeToEdges(ac.assignedRoute, graph.edges) ?? [];
  const ahead = routeEdgeIds
    .slice(ac.routeEdgeIndex + 1)
    .filter(id => !state.blockedEdgeIds.has(id));
  if (!ahead.length) return null;

  const fromNode = ac.assignedRoute[ac.routeEdgeIndex + 1] || ac.currentNodeId;
  const reroutable = ahead.filter(id => {
    const test = new Set(state.blockedEdgeIds);
    test.add(id);
    const p = findPath(graph, fromNode, ac.targetNodeId, test);
    return p !== null && p.length > 1;
  });
  const pool = reroutable.length ? reroutable : ahead;
  return pool[Math.floor(Math.random() * pool.length)];
}
