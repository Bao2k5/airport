import type { SimulationState, SimulationConfig, AirportGraph, RunwayOccupancyState } from '../types';
import {
  getPresetScenarioDefs,
  type ScenarioAircraft,
  type ScenarioState,
  type ScenarioObservation,
} from '../data/presetScenarios';
import { airportGraphV3 as airportGraph } from '../data/airportGraph.v3';
import { findPath, routeToEdges } from './pathfinding';
import { getRunwayCorridor } from './simulator';

export const PIXELS_PER_METER = 1 / 3; // 1 pixel = 3.0 meters (Graph V2 SVG 1200x860)
export const SEPARATION_TAXIWAY_M = 28; // Standard Taxiway longitudinal separation (28m)
export const SEPARATION_APRON_M = 36;   // Apron Taxilane separation (36m)
export const SEPARATION_TAXIWAY_PX = SEPARATION_TAXIWAY_M * PIXELS_PER_METER; // 9.333 px
export const SEPARATION_APRON_PX = SEPARATION_APRON_M * PIXELS_PER_METER;     // 12.000 px
export const STAND_CLEARANCE_RADIUS_M = 34; // Stand clearance safety radius (34m)
export const STAND_CLEARANCE_RADIUS_PX = STAND_CLEARANCE_RADIUS_M * PIXELS_PER_METER; // 11.333 px

// Standard Educational Simulation Speeds (Educational demo parameters, not real-world aviation ops)
export const SCENARIO_TAXI_SPEED_KTS = 15;     // Standard Taxiway speed baseline (15 kts)
export const SCENARIO_APRON_SPEED_KTS = 7;      // Apron/Stand area speed limit (7 kts)
export const SCENARIO_JUNCTION_SPEED_KTS = 5;   // Approaching junction / stop-bar speed (5 kts)
export const SCENARIO_STOP_SPEED_KTS = 0;       // Holding / Stopped speed (0 kts)
export const MAX_ACCEL_KTS_PER_S = 6.0;         // Smooth acceleration rate
export const MAX_DECEL_KTS_PER_S = 10.0;        // Smooth deceleration rate

const KNOTS_TO_MS = 0.5144;
const JUNCTION_FORCE_WAIT_S = 4.0;   // Force junction entry if waiting > 4s to resolve minor gridlocks
const ARRIVAL_HOLD_S = 12.0;         // Arrival threshold hold before DEPARTED
const LOOKAHEAD_NODES = 12;
const LOOKAHEAD_COMMITMENTS = 14;

export function assertNoTwoAircraftOnSameRunway(
  aircraftList: ScenarioAircraft[]
): { pass: boolean; violation?: string } {
  const runwayOccupants: Record<'NORTH' | 'SOUTH', string[]> = {
    NORTH: [],
    SOUTH: [],
  };

  for (const ac of aircraftList) {
    // Only aircraft actively on the runway (taxiing or holding mid-runway) occupy the active corridor
    if (ac.status !== 'taxiing' && !(ac.status === 'holding' && ac.progressOnEdge > 0)) continue;
    const corridor = getRunwayCorridor(ac.currentEdgeId, ac.currentNodeId);
    if (corridor) {
      runwayOccupants[corridor].push(ac.callsign || ac.id);
    }
  }

  if (runwayOccupants.NORTH.length > 1) {
    return {
      pass: false,
      violation: `Runway NORTH occupied simultaneously by [${runwayOccupants.NORTH.join(', ')}]`,
    };
  }
  if (runwayOccupants.SOUTH.length > 1) {
    return {
      pass: false,
      violation: `Runway SOUTH occupied simultaneously by [${runwayOccupants.SOUTH.join(', ')}]`,
    };
  }

  return { pass: true };
}

export function recalculateRoutePreservingProgress(
  ac: ScenarioAircraft,
  destinationNodeId: string,
  blockedEdgeIds: Set<string>,
  graph: AirportGraph
): ScenarioAircraft {
  const currentEdgeId = ac.currentEdgeId;
  const currentRoute = ac.assignedRoute;
  const currentIndex = ac.routeEdgeIndex;
  const currentProgress = ac.progressOnEdge;

  // If at start node and progress is 0
  if (currentIndex === 0 && currentProgress === 0) {
    const fromNode = currentRoute[0] || ac.currentNodeId;
    const newRoute = findPath(graph, fromNode, destinationNodeId, blockedEdgeIds);
    if (newRoute && newRoute.length > 1) {
      const newEdges = routeToEdges(newRoute, graph.edges) ?? [];
      return {
        ...ac,
        assignedRoute: newRoute,
        clearedRoute: newRoute,
        routeEdgeIndex: 0,
        progressOnEdge: 0,
        currentNodeId: fromNode,
        currentEdgeId: newEdges[0] ?? null,
        targetNodeId: destinationNodeId,
        holdReason: undefined,
        status: 'taxiing',
      };
    }
    return ac;
  }

  // Mid-edge: current segment from U to V
  const uNode = currentRoute[currentIndex];
  const vNode = currentRoute[currentIndex + 1];
  if (!uNode || !vNode) return ac;

  // Path from V to destinationNodeId avoiding blockedEdgeIds
  const pathFromV = findPath(graph, vNode, destinationNodeId, blockedEdgeIds);
  if (pathFromV && pathFromV.length > 0) {
    const splicedRoute = [uNode, ...pathFromV];

    return {
      ...ac,
      assignedRoute: splicedRoute,
      clearedRoute: splicedRoute,
      routeEdgeIndex: 0, // Points to segment U -> V (the exact current edge!)
      progressOnEdge: currentProgress, // Preserves exact same progress, 0 position jump!
      currentNodeId: uNode,
      currentEdgeId: currentEdgeId,
      targetNodeId: destinationNodeId,
      holdReason: undefined,
      status: 'taxiing',
    };
  }

  return ac;
}

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

function isStandNode(nodeId: string, graph: AirportGraph): boolean {
  const n = graph.nodes.find(node => node.id === nodeId);
  if (n?.type === 'stand' || (n?.label && n.label.startsWith('STAND_'))) return true;
  return (
    nodeId.startsWith('DOM_S') ||
    nodeId.startsWith('INTL_S') ||
    /^P\d/.test(nodeId) ||
    nodeId.startsWith('ST') ||
    nodeId === 'T49'
  );
}

function isHoldingPointNode(nodeId: string, graph: AirportGraph): boolean {
  const n = graph.nodes.find(node => node.id === nodeId);
  if (n?.type === 'holding_point' || (n?.label && (n.label.startsWith('STOP BAR') || n.label.startsWith('HS ')))) return true;
  return nodeId.startsWith('H0') || nodeId.startsWith('H25') || nodeId.startsWith('HS');
}

export function getAircraftPriority(ac: ScenarioAircraft, graph: AirportGraph): number {
  if (ac.priority !== undefined) return ac.priority;
  if (isStandNode(ac.targetNodeId, graph)) return 1;
  if (isHoldingPointNode(ac.targetNodeId, graph)) return 2;
  return 3;
}

function getReservedEdges(ac: ScenarioAircraft, graph: AirportGraph, lookahead = LOOKAHEAD_NODES): Set<string> {
  const set = new Set<string>();
  const routeEdges = routeToEdges(ac.assignedRoute, graph.edges) ?? [];
  const limit = Math.min(routeEdges.length, ac.routeEdgeIndex + lookahead);
  for (let i = ac.routeEdgeIndex; i < limit; i++) {
    set.add(routeEdges[i]);
  }
  return set;
}

function getReservedNodes(ac: ScenarioAircraft, lookahead = LOOKAHEAD_NODES): Set<string> {
  const set = new Set<string>();
  const limit = Math.min(ac.assignedRoute.length, ac.routeEdgeIndex + 1 + lookahead);
  for (let i = ac.routeEdgeIndex + 1; i < limit; i++) {
    set.add(ac.assignedRoute[i]);
  }
  return set;
}

interface CommitmentEntry {
  id: string;
  rank: number;
  fromNode: string;
}

function getCommitments(fleet: ScenarioAircraft[], graph: AirportGraph): Map<string, CommitmentEntry[]> {
  const map = new Map<string, CommitmentEntry[]>();
  for (const ac of fleet) {
    if (ac.status === 'arrived' || ac.status === 'departed') continue;
    const routeEdges = routeToEdges(ac.assignedRoute, graph.edges) ?? [];
    const limit = Math.min(routeEdges.length, ac.routeEdgeIndex + LOOKAHEAD_COMMITMENTS);
    const rank = getAircraftPriority(ac, graph);
    for (let i = ac.routeEdgeIndex; i < limit; i++) {
      const edgeId = routeEdges[i];
      const entry: CommitmentEntry = {
        id: ac.id,
        rank,
        fromNode: ac.assignedRoute[i],
      };
      const existing = map.get(edgeId);
      if (existing) existing.push(entry);
      else map.set(edgeId, [entry]);
    }
  }
  return map;
}

interface AircraftOccupant {
  id: string;
  edgeId: string;
  from: string;
  to: string;
  progress: number;
  lenPx: number;
  x: number;
  y: number;
}

function getAircraftOccupant(ac: ScenarioAircraft, graph: AirportGraph): AircraftOccupant | null {
  if (!ac.currentEdgeId || ac.assignedRoute.length < 2) return null;
  const fromNode = getNodePos(ac.assignedRoute[ac.routeEdgeIndex], graph);
  const toNode = getNodePos(ac.assignedRoute[ac.routeEdgeIndex + 1], graph);
  if (!fromNode || !toNode) return null;

  const lenPx = Math.hypot(toNode.x - fromNode.x, toNode.y - fromNode.y) || 1;
  const prog = Math.max(0, Math.min(1, ac.progressOnEdge));
  return {
    id: ac.id,
    edgeId: ac.currentEdgeId,
    from: fromNode.id,
    to: toNode.id,
    progress: prog,
    lenPx,
    x: fromNode.x + (toNode.x - fromNode.x) * prog,
    y: fromNode.y + (toNode.y - fromNode.y) * prog,
  };
}

interface SpatialContext {
  occupants: AircraftOccupant[];
  claimed: Map<string, string>; // edgeId -> fromNodeId
  reserved: Set<string>;
  reservedNodes: Set<string>;
  commitments: Map<string, CommitmentEntry[]>;
}

function getHeadwayDistance(
  edgeId: string,
  fromNodeId: string,
  progress: number,
  acId: string,
  ctx: SpatialContext
): number {
  let minHeadway = Infinity;
  for (const occ of ctx.occupants) {
    if (occ.id === acId) continue;
    if (occ.edgeId !== edgeId || occ.from !== fromNodeId) continue;
    if (occ.progress > progress) {
      const distPx = (occ.progress - progress) * occ.lenPx;
      minHeadway = Math.min(minHeadway, distPx);
    }
  }
  return minHeadway;
}

function isNodeOccupied(
  nodeId: string,
  acId: string,
  rank: number,
  ctx: SpatialContext,
  graph: AirportGraph,
  radius = 15
): boolean {
  const node = getNodePos(nodeId, graph);
  if (!node) return false;
  for (const occ of ctx.occupants) {
    if (occ.id === acId) continue;
    // Lower-priority holding traffic does not block higher-priority entry
    const occEntry = (ctx.commitments.get(occ.edgeId) || []).find(c => c.id === occ.id);
    const occRank = occEntry?.rank ?? 3;
    if (occRank > rank) continue;

    if (Math.hypot(occ.x - node.x, occ.y - node.y) < radius) {
      return true;
    }
  }
  return false;
}

function getTaxiwayNeighbors(nodeId: string, graph: AirportGraph): Array<{ to: string; edgeId: string }> {
  const list: Array<{ to: string; edgeId: string }> = [];
  for (const e of graph.edges) {
    if (e.type === 'runway') continue;
    if (e.fromNodeId === nodeId) list.push({ to: e.toNodeId, edgeId: e.id });
    else if (e.bidirectional && e.toNodeId === nodeId) list.push({ to: e.fromNodeId, edgeId: e.id });
  }
  return list;
}

function getTaxiwayDegree(nodeId: string, graph: AirportGraph): number {
  return getTaxiwayNeighbors(nodeId, graph).length;
}

function getCorridorEndNode(edgeId: string, fromNode: string, graph: AirportGraph): string {
  let curTo = fromNode;
  let curEdge = edgeId;
  for (let step = 0; step < 32 && getTaxiwayDegree(curTo, graph) === 2; step++) {
    const next = getTaxiwayNeighbors(curTo, graph).find(n => n.edgeId !== curEdge);
    if (!next) break;
    curEdge = next.edgeId;
    curTo = next.to;
  }
  return curTo;
}

function getCorridorEdgeChain(edgeId: string, fromNode: string, toNode: string, graph: AirportGraph): string[] {
  const chain = [edgeId];
  let curFrom = fromNode;
  let curTo = toNode;
  for (let step = 0; step < 32 && getTaxiwayDegree(curTo, graph) === 2; step++) {
    const next = getTaxiwayNeighbors(curTo, graph).find(n => n.to !== curFrom);
    if (!next) break;
    chain.push(next.edgeId);
    curFrom = curTo;
    curTo = next.to;
  }
  return chain;
}

function hasCircularDeadlock(
  edgeId: string,
  fromNode: string,
  toNode: string,
  acId: string,
  ctx: SpatialContext,
  graph: AirportGraph
): boolean {
  const endNode = getCorridorEndNode(edgeId, fromNode, graph);
  const chainSet = new Set(getCorridorEdgeChain(edgeId, fromNode, toNode, graph));
  if (chainSet.size < 2) return false;

  for (const occ of ctx.occupants) {
    if (occ.id === acId || !chainSet.has(occ.edgeId)) continue;
    if (getCorridorEndNode(occ.edgeId, occ.from, graph) !== endNode) return true;
  }
  for (const [eId, fromN] of ctx.claimed.entries()) {
    if (chainSet.has(eId) && getCorridorEndNode(eId, fromN, graph) !== endNode) return true;
  }
  return false;
}

function hasHeadOnConflict(
  edgeId: string,
  fromNode: string,
  toNode: string,
  acId: string,
  ctx: SpatialContext,
  graph: AirportGraph
): boolean {
  let prev = fromNode;
  let cur = toNode;
  let curEdge = edgeId;

  for (let step = 0; step < 14; step++) {
    for (const occ of ctx.occupants) {
      if (occ.id !== acId && occ.edgeId === curEdge && occ.from === cur) return true;
    }
    const claimFrom = ctx.claimed.get(curEdge);
    if (claimFrom && claimFrom === cur) return true;

    if (getTaxiwayDegree(cur, graph) !== 2) break;
    const next = getTaxiwayNeighbors(cur, graph).find(n => n.to !== prev);
    if (!next) break;
    prev = cur;
    cur = next.to;
    curEdge = next.edgeId;
  }
  return false;
}

function isEntryBlocked(
  edgeId: string,
  fromNode: string,
  toNode: string,
  acId: string,
  rank: number,
  ctx: SpatialContext,
  graph: AirportGraph
): boolean {
  for (const occ of ctx.occupants) {
    if (occ.id !== acId && occ.edgeId === edgeId && occ.from === fromNode && occ.progress * occ.lenPx < 15) {
      return true;
    }
  }
  return isNodeOccupied(toNode, acId, rank, ctx, graph, 15);
}

function hasOpposingCommitment(
  edgeId: string,
  fromNode: string,
  toNode: string,
  acId: string,
  rank: number,
  ctx: SpatialContext,
  graph: AirportGraph
): boolean {
  if (ctx.commitments.size === 0) return false;
  let prev = fromNode;
  let cur = toNode;
  let curEdge = edgeId;

  for (let step = 0; step < 14; step++) {
    const list = ctx.commitments.get(curEdge) ?? [];
    for (const entry of list) {
      if (entry.id !== acId && entry.fromNode !== prev) {
        // Priority comparison: lower rank number = higher priority
        const hasHigherPriority = entry.rank === rank ? entry.id < acId : entry.rank < rank;
        if (hasHigherPriority) return true;
      }
    }
    if (getTaxiwayDegree(cur, graph) !== 2) break;
    const next = getTaxiwayNeighbors(cur, graph).find(n => n.to !== prev);
    if (!next) break;
    prev = cur;
    cur = next.to;
    curEdge = next.edgeId;
  }
  return false;
}

function isJunctionClear(
  edgeId: string,
  fromNode: string,
  toNode: string,
  acId: string,
  rank: number,
  ctx: SpatialContext,
  force: boolean,
  graph: AirportGraph
): boolean {
  if (hasHeadOnConflict(edgeId, fromNode, toNode, acId, ctx, graph)) return false;
  if (hasCircularDeadlock(edgeId, fromNode, toNode, acId, ctx, graph)) return false;
  if (hasOpposingCommitment(edgeId, fromNode, toNode, acId, rank, ctx, graph)) return false;
  return force || !isEntryBlocked(edgeId, fromNode, toNode, acId, rank, ctx, graph);
}

function isStandDepartureClear(
  ac: ScenarioAircraft,
  ctx: SpatialContext,
  startingStandAircraftIds: Set<string>,
  graph: AirportGraph
): boolean {
  const nextNodeId = ac.assignedRoute[1];
  const nextNode = getNodePos(nextNodeId, graph);
  if (!nextNode) return false;

  for (const occ of ctx.occupants) {
    if (occ.id === ac.id || startingStandAircraftIds.has(occ.id)) continue;
    if (occ.edgeId === ac.currentEdgeId) return false;
    if (Math.hypot(occ.x - nextNode.x, occ.y - nextNode.y) < STAND_CLEARANCE_RADIUS_PX) {
      return false;
    }
  }
  return true;
}

export function computeScenarioLightStates(
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
    if (ac.status !== 'taxiing' && ac.status !== 'holding') continue;

    const routeEdges = routeToEdges(ac.assignedRoute, graph.edges) ?? [];
    // Only illuminate current edge and 1 segment ahead (lookahead = 1), past edges are off
    const lookaheadLimit = Math.min(routeEdges.length, ac.routeEdgeIndex + 2);
    for (let i = ac.routeEdgeIndex; i < lookaheadLimit; i++) {
      const edgeId = routeEdges[i];
      if (lights[edgeId] !== 'red') {
        if (i === ac.routeEdgeIndex && ac.holdReason === 'stop-bar' && ac.status === 'holding') {
          lights[edgeId] = 'red';
        } else {
          lights[edgeId] = 'green';
        }
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

  const calibratedFleet = aircraft.map(ac => ({
    ...ac,
    speedKts: ac.speedKts > 0 ? ac.speedKts : SCENARIO_TAXI_SPEED_KTS,
    speedLimitKts: SCENARIO_TAXI_SPEED_KTS,
  }));

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

  const blockedEdgeIds = new Set<string>();
  for (const edge of graph.edges) {
    if (edge.status === 'closed' || edge.status === 'restricted') {
      blockedEdgeIds.add(edge.id);
    }
  }

  const initialLogs: any[] = [
    {
      id: `sc_init_${scenarioId}`,
      atSeconds: 0,
      message: `Khởi chạy kịch bản: ${def.title}`,
      severity: 'info',
    },
  ];

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
    lightStates: computeScenarioLightStates(calibratedFleet, blockedEdgeIds, graph),
    blockedEdgeIds,
    runwayOccupancy: { NORTH: null, SOUTH: null },
    liveEventLog: initialLogs,
    scenario: scenarioState,
    scenarioAircraft: calibratedFleet,
  };
}

function logScenarioEvent(
  state: SimulationState,
  msg: string,
  severity: 'info' | 'warning' | 'critical' = 'info'
): SimulationState {
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

export function scenarioTick(
  state: SimulationState,
  dt: number,
  graph: AirportGraph = airportGraph
): SimulationState {
  if (!state.isRunning || state.isPaused || !state.scenario || !state.scenarioAircraft) {
    return state;
  }

  const fleet = state.scenarioAircraft;
  const blockedEdgeIds = state.blockedEdgeIds;
  const elapsed = state.elapsedSeconds + dt;

  // 1. Identify highest priority active aircraft (e.g. priority 0 for emergency)
  const highestPriorityAc = fleet.reduce<ScenarioAircraft | null>((best, ac) => {
    const p = getAircraftPriority(ac, graph);
    if (p !== 0 || ac.status === 'arrived' || ac.status === 'departed') return best;
    if (!best || p < getAircraftPriority(best, graph)) return ac;
    return best;
  }, null);

  const reservedEdges = highestPriorityAc ? getReservedEdges(highestPriorityAc, graph, 9999) : new Set<string>();
  const reservedNodes = highestPriorityAc ? getReservedNodes(highestPriorityAc, 9999) : new Set<string>();

  const fullContext: SpatialContext = {
    occupants: [],
    claimed: new Map(),
    reserved: reservedEdges,
    reservedNodes,
    commitments: getCommitments(fleet, graph),
  };
  const bypassContext: SpatialContext = {
    ...fullContext,
    reserved: new Set(),
    reservedNodes: new Set(),
  };

  // Collect occupants
  for (const ac of fleet) {
    if (ac.status === 'departed' || (ac.releaseAtSeconds !== undefined && state.elapsedSeconds < ac.releaseAtSeconds)) {
      continue;
    }
    const occ = getAircraftOccupant(ac, graph);
    if (occ) fullContext.occupants.push(occ);
  }

  // Runway corridor occupancy
  const currentOccupancy: RunwayOccupancyState = {
    NORTH: state.runwayOccupancy?.NORTH || null,
    SOUTH: state.runwayOccupancy?.SOUTH || null,
  };
  for (const ac of fleet) {
    if (ac.status !== 'taxiing' && ac.status !== 'holding') continue;
    const corridor = getRunwayCorridor(ac.currentEdgeId, ac.currentNodeId);
    if (corridor) currentOccupancy[corridor] = ac.id;
  }

  // Sort aircraft by priority (lower number = higher priority)
  const sortedIndices = fleet.map((_, idx) => idx).sort(
    (a, b) => getAircraftPriority(fleet[a], graph) - getAircraftPriority(fleet[b], graph)
  );

  const updatedFleet = fleet.slice();
  const nextCoords = new Map<string, { x: number; y: number }>();

  const startingStandAircraftIds = new Set(
    fleet
      .filter(ac => isStandNode(ac.currentNodeId, graph) && (ac.status !== 'taxiing' || ac.progressOnEdge === 0))
      .map(ac => ac.id)
  );

  const standsWithQueuedPushback = new Set<string>();
  const hasEmergencyInbound = fleet.some(a => (a.role === 'emergency' || a.priority === 0) && a.status === 'taxiing');

  for (const idx of sortedIndices) {
    const ac = fleet[idx];
    const isAtInitialStand = ac.status !== 'arrived' && ac.routeEdgeIndex === 0 && ac.progressOnEdge === 0 && isStandNode(ac.assignedRoute[0], graph);
    if (!isAtInitialStand) continue;

    if (hasEmergencyInbound && (ac.role === 'pushback' || (ac.priority !== undefined && ac.priority > 0))) {
      standsWithQueuedPushback.add(ac.id);
      continue;
    }

    if (isStandDepartureClear(ac, fullContext, startingStandAircraftIds, graph)) {
      continue;
    }
    standsWithQueuedPushback.add(ac.id);
  }

  for (const idx of sortedIndices) {
    const ac = fleet[idx];

    if (ac.status === 'departed') {
      updatedFleet[idx] = ac;
      continue;
    }

    const nextElapsed = state.elapsedSeconds + dt;
    if (ac.releaseAtSeconds !== undefined && nextElapsed < ac.releaseAtSeconds - 1e-4) {
      updatedFleet[idx] = {
        ...ac,
        status: 'holding',
        speedKts: 0,
        holdReason: ac.holdReason || 'stop-bar',
        heldSeconds: (ac.heldSeconds ?? 0) + dt,
      };
      continue;
    }

    if (ac.status === 'arrived') {
      if (isHoldingPointNode(ac.targetNodeId, graph)) {
        const arrivedAt = ac.arrivedAtSeconds ?? state.elapsedSeconds;
        if (state.elapsedSeconds - arrivedAt >= ARRIVAL_HOLD_S) {
          updatedFleet[idx] = { ...ac, status: 'departed', arrivedAtSeconds: arrivedAt };
        } else {
          updatedFleet[idx] = { ...ac, arrivedAtSeconds: arrivedAt };
        }
      } else {
        updatedFleet[idx] = ac;
      }
      continue;
    }

    if (ac.status === 'stopped' || (ac.deviated && ac.holdReason === 'deviation')) {
      updatedFleet[idx] = {
        ...ac,
        status: 'stopped',
        speedKts: 0,
        holdReason: 'deviation',
      };
      continue;
    }

    const activeCtx = highestPriorityAc && ac.id === highestPriorityAc.id ? bypassContext : fullContext;
    const rank = getAircraftPriority(ac, graph);

    // ── KINEMATICS & JUNCTION STEP ──
    const routeEdges = routeToEdges(ac.assignedRoute, graph.edges) ?? [];
    if (ac.routeEdgeIndex >= routeEdges.length) {
      updatedFleet[idx] = { ...ac, status: 'arrived', speedKts: 0 };
      continue;
    }

    const currentEdge = graph.edges.find(e => e.id === routeEdges[ac.routeEdgeIndex]);
    const fromNode = getNodePos(ac.assignedRoute[ac.routeEdgeIndex], graph);
    const toNode = getNodePos(ac.assignedRoute[ac.routeEdgeIndex + 1], graph);

    if (!currentEdge || !fromNode || !toNode) {
      updatedFleet[idx] = { ...ac, status: 'arrived', speedKts: 0 };
      continue;
    }

    let steppedAc: ScenarioAircraft = ac;

    // Runway corridor protection for entry edge
    const currentCorridor = getRunwayCorridor(currentEdge.id, fromNode.id);
    const isCorridorOccupiedByOther = currentCorridor && currentOccupancy[currentCorridor] && currentOccupancy[currentCorridor] !== ac.id;
    if (isCorridorOccupiedByOther && ac.progressOnEdge === 0) {
      steppedAc = {
        ...ac,
        status: 'holding',
        holdReason: 'stop-bar',
        heldSeconds: (ac.heldSeconds ?? 0) + dt,
        speedKts: 0,
        speedLimitKts: 0,
        speedReason: 'Dừng: Stop Bar đường băng',
      };
      updatedFleet[idx] = steppedAc;
      continue;
    }
    if (currentCorridor) {
      currentOccupancy[currentCorridor] = ac.id;
    }

    // Stand pushback/departure clearance hold (for cross-traffic yield / emergency priority corridor)
    if (standsWithQueuedPushback.has(ac.id) && ac.progressOnEdge === 0) {
      steppedAc = {
        ...ac,
        status: 'holding',
        holdReason: 'stop-bar',
        heldSeconds: (ac.heldSeconds ?? 0) + dt,
        speedKts: 0,
        speedLimitKts: 0,
        speedReason: 'Dừng: Chờ giải tỏa hành lang',
      };
      updatedFleet[idx] = steppedAc;
      continue;
    }

    // 1. Determine zone speed limit
    const isApronZone = (isStandNode(fromNode.id, graph) && ac.progressOnEdge < 0.25) || ac.role === 'pushback';
    const isApproachingJunction = ac.progressOnEdge >= 0.85 && ac.routeEdgeIndex + 1 < routeEdges.length;

    let targetZoneSpeedKts = SCENARIO_TAXI_SPEED_KTS; // 15 kts baseline
    let speedReason = 'Tốc độ tiêu chuẩn';

    if (isApproachingJunction) {
      targetZoneSpeedKts = SCENARIO_JUNCTION_SPEED_KTS; // 5 kts
      speedReason = 'Giảm tốc: gần giao lộ';
    } else if (isApronZone) {
      targetZoneSpeedKts = SCENARIO_APRON_SPEED_KTS; // 7 kts
      speedReason = 'Giảm tốc: khu vực sân đỗ';
    }

    let currentSpeedKts = ac.speedKts;
    if (ac.holdReason === 'deviation') {
      targetZoneSpeedKts = 0;
      currentSpeedKts = 0;
      speedReason = 'Lệch tuyến: Dừng chờ lệnh KSVKL';
    } else {
      if (currentSpeedKts <= 0) currentSpeedKts = targetZoneSpeedKts;
      if (currentSpeedKts < targetZoneSpeedKts) {
        currentSpeedKts = Math.min(targetZoneSpeedKts, currentSpeedKts + MAX_ACCEL_KTS_PER_S * dt);
      } else if (currentSpeedKts > targetZoneSpeedKts) {
        currentSpeedKts = Math.max(targetZoneSpeedKts, currentSpeedKts - MAX_DECEL_KTS_PER_S * dt);
      }
    }

    const edgeLenMeters = currentEdge.lengthMeters > 0 ? currentEdge.lengthMeters : 50;
    const effectiveSpeedMs = currentSpeedKts * KNOTS_TO_MS;
    const stepProgress = (effectiveSpeedMs * dt) / edgeLenMeters;

    // Check headway buffer along current edge
    const headwayPx = getHeadwayDistance(currentEdge.id, fromNode.id, ac.progressOnEdge, ac.id, activeCtx);
    const edgePixelLen = Math.hypot(toNode.x - fromNode.x, toNode.y - fromNode.y) || 1;
    let targetProgress = ac.progressOnEdge + stepProgress;

    if (headwayPx !== Infinity) {
      const allowedProgress = ac.progressOnEdge + Math.max(0, (headwayPx - 15) / edgePixelLen);
      targetProgress = Math.min(targetProgress, allowedProgress);
    }

    const isHoldingAtJunction = ac.status === 'holding' && ac.progressOnEdge >= 0.90;
    const isApproachingJunctionStop = (targetProgress >= 0.90 || isHoldingAtJunction) && ac.routeEdgeIndex + 1 < routeEdges.length;

    if (isApproachingJunctionStop) {
      const nextEdgeId = routeEdges[ac.routeEdgeIndex + 1];
      const nextTargetNodeId = ac.assignedRoute[ac.routeEdgeIndex + 2];
      const isBlocked = blockedEdgeIds.has(nextEdgeId);
      const targetCorridor = getRunwayCorridor(nextEdgeId, nextTargetNodeId);
      const currentCorridor = getRunwayCorridor(currentEdge.id, fromNode.id);
      const isRunwayBlocked = targetCorridor && targetCorridor !== currentCorridor && currentOccupancy[targetCorridor] && currentOccupancy[targetCorridor] !== ac.id;
      const isNodeReserved = activeCtx.reservedNodes.has(toNode.id);
      const isEdgeReserved = activeCtx.reserved.has(nextEdgeId);
      const heldSec = (ac.heldSeconds ?? 0) + dt;
      const forceJunction = heldSec >= JUNCTION_FORCE_WAIT_S;

      const canProceed = !isBlocked && !isRunwayBlocked && !isNodeReserved && !isEdgeReserved && isJunctionClear(nextEdgeId, toNode.id, nextTargetNodeId, ac.id, rank, activeCtx, forceJunction, graph);

      if (!canProceed) {
        steppedAc = {
          ...ac,
          progressOnEdge: 0.92,
          currentNodeId: fromNode.id,
          status: 'holding',
          heldSeconds: heldSec,
          holdReason: 'stop-bar',
          speedKts: 0,
          speedLimitKts: 0,
          speedReason: 'Dừng: Stop Bar',
        };
        updatedFleet[idx] = steppedAc;
        continue;
      }
    }

    if (targetProgress < 1 && !isHoldingAtJunction) {
      if (targetProgress <= ac.progressOnEdge + 1e-6) {
        steppedAc = {
          ...ac,
          status: 'holding',
          holdReason: ac.holdReason || 'separation',
          heldSeconds: (ac.heldSeconds ?? 0) + dt,
          speedKts: 0,
          speedLimitKts: 0,
          speedReason: ac.holdReason === 'deviation' ? 'Lệch tuyến: Dừng chờ lệnh KSVKL' : (ac.holdReason === 'stop-bar' ? 'Dừng: Stop Bar' : 'Giảm tốc: giữ khoảng cách'),
        };
      } else {
        steppedAc = {
          ...ac,
          progressOnEdge: targetProgress,
          currentNodeId: fromNode.id,
          currentEdgeId: currentEdge.id,
          status: 'taxiing',
          heldSeconds: 0,
          holdReason: undefined,
          speedKts: currentSpeedKts,
          speedLimitKts: targetZoneSpeedKts,
          speedReason,
        };
      }
    } else {
      // Reached junction (progress >= 1 or currently holding at junction)
      const heldSec = (ac.heldSeconds ?? 0) + dt;
      const forceJunction = heldSec >= JUNCTION_FORCE_WAIT_S;

      if (ac.routeEdgeIndex + 1 >= routeEdges.length) {
        // Arrived at final destination
        steppedAc = {
          ...ac,
          routeEdgeIndex: routeEdges.length - 1,
          progressOnEdge: 1,
          currentNodeId: toNode.id,
          targetNodeId: toNode.id,
          currentEdgeId: routeEdges[routeEdges.length - 1] ?? null,
          status: 'arrived',
          speedKts: 0,
          speedLimitKts: 0,
          speedReason: 'Đã đến đích an toàn',
          holdReason: undefined,
        };
      } else {
        const nextEdgeId = routeEdges[ac.routeEdgeIndex + 1];
        const nextTargetNodeId = ac.assignedRoute[ac.routeEdgeIndex + 2];
        const isBlocked = blockedEdgeIds.has(nextEdgeId);

        // Runway corridor protection check
        const targetCorridor = getRunwayCorridor(nextEdgeId, nextTargetNodeId);
        const currentCorridor = getRunwayCorridor(currentEdge.id, fromNode.id);
        const isRunwayBlocked = targetCorridor && targetCorridor !== currentCorridor && currentOccupancy[targetCorridor] && currentOccupancy[targetCorridor] !== ac.id;

        const isNodeReserved = activeCtx.reservedNodes.has(toNode.id);
        const isEdgeReserved = activeCtx.reserved.has(nextEdgeId);

        const canProceed = !isBlocked && !isRunwayBlocked && !isNodeReserved && !isEdgeReserved && isJunctionClear(nextEdgeId, toNode.id, nextTargetNodeId, ac.id, rank, activeCtx, forceJunction, graph);

        if (canProceed) {
          activeCtx.claimed.set(nextEdgeId, toNode.id);
          if (targetCorridor) currentOccupancy[targetCorridor] = ac.id;
          if (currentCorridor && !targetCorridor && currentOccupancy[currentCorridor] === ac.id) {
            currentOccupancy[currentCorridor] = null;
          }

          steppedAc = {
            ...ac,
            routeEdgeIndex: ac.routeEdgeIndex + 1,
            progressOnEdge: 0,
            currentNodeId: toNode.id,
            currentEdgeId: nextEdgeId,
            status: 'taxiing',
            heldSeconds: 0,
            holdReason: undefined,
            speedKts: currentSpeedKts,
            speedLimitKts: targetZoneSpeedKts,
            speedReason,
          };
        } else {
          // Must hold at junction before Stop Bar (hold on incoming edge buffer to allow intersecting traffic to clear)
          const holdR = 'stop-bar';
          steppedAc = {
            ...ac,
            progressOnEdge: 0.92,
            currentNodeId: fromNode.id,
            status: 'holding',
            heldSeconds: heldSec,
            holdReason: holdR,
            speedKts: 0,
            speedLimitKts: 0,
            speedReason: 'Dừng: Stop Bar',
          };
        }
      }
    }

    // ── 2D SPATIAL SEPARATION CHECK (28m Taxiway / 36m Apron) ──
    const myPos = getNodePos(steppedAc.assignedRoute[steppedAc.routeEdgeIndex], graph);
    const myNextPos = getNodePos(steppedAc.assignedRoute[steppedAc.routeEdgeIndex + 1], graph);
    if (myPos && myNextPos) {
      const mx = myPos.x + (myNextPos.x - myPos.x) * steppedAc.progressOnEdge;
      const my = myPos.y + (myNextPos.y - myPos.y) * steppedAc.progressOnEdge;

      for (const occ of activeCtx.occupants) {
        if (occ.id === steppedAc.id) continue;
        const otherRank = getAircraftPriority(fleet.find(f => f.id === occ.id) || ac, graph);
        if (rank <= otherRank) continue; // Higher priority does not yield to lower priority

        const dist = Math.hypot(mx - occ.x, my - occ.y);
        const isApron = isStandNode(steppedAc.currentNodeId, graph);
        const minDist = isApron ? SEPARATION_APRON_PX : SEPARATION_TAXIWAY_PX;

        if (dist < minDist) {
          steppedAc = {
            ...steppedAc,
            status: 'holding',
            holdReason: 'separation',
            heldSeconds: (steppedAc.heldSeconds ?? 0) + dt,
            speedKts: 0,
          };
          break;
        }
      }

      nextCoords.set(steppedAc.id, { x: mx, y: my });
    }

    updatedFleet[idx] = steppedAc;
  }

  let nextState: SimulationState = {
    ...state,
    scenarioAircraft: updatedFleet,
    runwayOccupancy: currentOccupancy,
    elapsedSeconds: elapsed,
  };

  // ── HARD RUNWAY OCCUPANCY SAFETY ASSERTION EVERY TICK ─────────────────────
  const runwayCheck = assertNoTwoAircraftOnSameRunway(updatedFleet);
  if (!runwayCheck.pass && runwayCheck.violation) {
    nextState = logScenarioEvent(nextState, `[VIOLATION] ${runwayCheck.violation}`, 'critical');
  }

  // ── DEVIATION DETECTION & AUTOMATIC 4s RE-ROUTING ──────────────────────────
  for (let i = 0; i < updatedFleet.length; i++) {
    const ac = updatedFleet[i];
    if (!ac.clearedRoute || ac.deviated || !ac.currentEdgeId) continue;

    const clearedEdges = routeToEdges(ac.clearedRoute, graph.edges) ?? [];
    if (!clearedEdges.includes(ac.currentEdgeId)) {
      // Detected route deviation
      const stoppedAc = {
        ...ac,
        status: 'stopped' as const,
        deviated: true,
        holdReason: 'deviation' as const,
        speedKts: 0,
      };

      nextState = {
        ...nextState,
        scenarioAircraft: nextState.scenarioAircraft?.map((a, n) => n === i ? stoppedAc : a),
      };

      nextState = logScenarioEvent(
        nextState,
        `KSVKL phát hiện ${ac.callsign} lệch khỏi lộ trình đã cấp — lệnh dừng khẩn cấp.`,
        'critical'
      );

      // Register automatic re-routing trigger after exactly 4 seconds
      const rerouteTrigger = {
        atSeconds: nextState.elapsedSeconds + 4,
        apply: (s: SimulationState) => {
          const targetAc = s.scenarioAircraft?.find(a => a.id === ac.id);
          if (!targetAc) return s;

          const corrected = recalculateRoutePreservingProgress(targetAc, targetAc.targetNodeId, s.blockedEdgeIds, graph);
          const finalCorrectedAc: ScenarioAircraft = {
            ...corrected,
            deviated: false,
            holdReason: undefined,
            status: 'taxiing',
            speedKts: 30 * (s.config.weather === 'fog' ? 0.45 : 1.0),
          };

          let updatedS: SimulationState = {
            ...s,
            scenarioAircraft: s.scenarioAircraft?.map(a => a.id === ac.id ? finalCorrectedAc : a),
          };

          updatedS = logScenarioEvent(
            updatedS,
            `Đã cấp lại lộ trình an toàn cho ${ac.callsign} — tiếp tục lăn bánh.`,
            'info'
          );
          return updatedS;
        },
      };

      if (nextState.scenario) {
        nextState.scenario.pendingTriggers = [...nextState.scenario.pendingTriggers, rerouteTrigger];
      }
    }
  }

  // ── RUN PENDING SCENARIO TRIGGERS ──────────────────────────────────────────
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

  // ── EVALUATE RUNTIME OBSERVATIONS ──────────────────────────────────────────
  if (nextState.scenario && nextState.scenario.observations) {
    const updatedObservations = nextState.scenario.observations.map((obs: ScenarioObservation) => {
      if (obs.status === 'pass') return obs;

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
    }
  }

  nextState.lightStates = computeScenarioLightStates(nextState.scenarioAircraft ?? [], nextState.blockedEdgeIds, graph);

  return nextState;
}

