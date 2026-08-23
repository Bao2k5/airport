import type { AircraftStatus, AirportGraph, AirlineCode, AircraftType } from '../../types';
import { airportGraphV3 } from '../airportGraph.v3';
import { getAirlineDef } from '../airlineTypes';
import { findPath, routeToEdges } from '../../simulation/pathfinding';

export interface ScenarioAircraft {
  id: string;
  callsign: string;
  airlineCode?: AirlineCode;
  airlineName?: string;
  aircraftAsset?: string;
  aircraftType?: AircraftType;
  currentNodeId: string;
  targetNodeId: string;
  currentEdgeId: string | null;
  progressOnEdge: number;
  speedKts: number;
  status: AircraftStatus;
  assignedRoute: string[];
  routeEdgeIndex: number;
  role?: 'emergency' | 'departing' | 'arriving' | 'pushback';
  priority?: number;
  clearedRoute?: string[];
  scenarioLabel?: string;
  releaseAtSeconds?: number;
  arrivedAtSeconds?: number;
  radioFailure?: boolean;
  deviated?: boolean;
  holdReason?: 'stop-bar' | 'separation' | 'deviation';
  heldSeconds?: number;
  queueOrder?: number;
  queueRunway?: 'NORTH' | 'SOUTH';
  speedLimitKts?: number;
  speedReason?: string;
  routeVisible?: boolean;
  guidanceVisible?: boolean;
  isMoving?: boolean;
  hidden?: boolean;
  isFireExtinguished?: boolean;
}

export interface ScenarioEvent {
  atSeconds: number;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface ScenarioTrigger {
  atSeconds: number;
  apply: (state: any) => any;
}

export interface ScenarioObservation {
  id: string;
  text: string;
  required: boolean;
  status: 'pending' | 'pass' | 'fail';
  checkedAtSeconds: number | null;
  evidence: string;
  relatedAircraft?: string[];
  relatedEdgeIds?: string[];
  check?: (state: any, graph: AirportGraph) => { pass: boolean; evidence?: string; fail?: boolean };
}

export interface ScenarioState {
  id: string;
  title: string;
  situation: string;
  challenges: string[];
  watchFor: string[];
  observations: ScenarioObservation[];
  startedAtSeconds: number;
  events: ScenarioEvent[];
  pendingTriggers: ScenarioTrigger[];
  completed: boolean;
}

export interface QueuedAircraftEntry {
  id: string;
  runway: 'NORTH' | 'SOUTH';
  order: number;
  releaseDelaySeconds?: number;
}

export interface PresetScenarioDef {
  id: string;
  title: string;
  teaser: string;
  situation: string;
  challenges: string[];
  watchFor: string[];
  aircraftQueue?: QueuedAircraftEntry[];
  observations?: ScenarioObservation[];
  setup: (graph?: AirportGraph) => {
    weather: 'clear' | 'fog' | 'thunderstorm';
    aircraft: ScenarioAircraft[];
    triggers: ScenarioTrigger[];
    aircraftQueue?: QueuedAircraftEntry[];
    observations?: ScenarioObservation[];
  };
}

export function resolveV3NodeId(idOrLabel: string, graph: AirportGraph = airportGraphV3): string {
  const norm = (idOrLabel || '').trim().toLowerCase();
  const normClean = norm.replace(/[\s_\/]/g, '');

  const found = graph.nodes.find(n => {
    const idClean = n.id.toLowerCase().replace(/[\s_\/]/g, '');
    const labelClean = (n.label || '').trim().toLowerCase().replace(/[\s_\/]/g, '');
    return n.id.toLowerCase() === norm ||
           (n.label && n.label.trim().toLowerCase() === norm) ||
           idClean === normClean ||
           labelClean === normClean;
  });
  if (found) return found.id;

  const standMap: Record<string, string> = {
    'stand_1': 'v3_line_37_p00',
    'stand_2': 'v3_line_38_p00',
    'stand_3': 'v3_line_34_p02',
    'stand_4': 'v3_line_35_p00',
    'stand_5': 'v3_line_36_p00',
    'stand_7': 'v3_line_29_p01',
    'stand_8': 'v3_line_28_p01',
    'stand_9': 'v3_line_27_p01',
    'stand_10': 'v3_line_33_p00',
    'stand_11': 'v3_line_32_p00',
    'stand_12': 'v3_line_31_p00',
    'stand_13': 'v3_line_30_p00',
    'stand_14': 'v3_line_15_p00',
    'stand_15': 'v3_line_15_p01',
    'stand_16': 'v3_line_21_p01',
    'stand_17': 'v3_line_22_p01',
    'stand_18': 'v3_line_23_p01',
    'stand_19': 'v3_line_24_p00',
    'stand_20': 'v3_line_24_p01',
    'stand_21': 'v3_line_25_p01',
    'stand_22': 'v3_line_26_p04',
    'w4/25r': 'v3_line_04_p01',
    'w4/25l': 'v3_line_04_p03',
  };

  if (standMap[norm]) return standMap[norm];
  if (standMap[norm.replace(/\s+/g, '_')]) return standMap[norm.replace(/\s+/g, '_')];

  if (norm.includes('stop bar 25l') || norm.includes('25l')) return 'v3_line_05_p05';
  if (norm.includes('stop bar 25r') || norm.includes('25r')) return 'v3_line_01_p03';
  if (norm.includes('w5/07r') || norm.includes('w5/07l') || norm.includes('w5')) return 'v3_line_03_p00';
  if (norm.includes('w11/07r') || norm.includes('w11')) return 'v3_line_16_p01';
  if (norm.includes('w9a') || norm.includes('w9b') || norm.includes('w9')) return 'v3_line_17_p04';

  return idOrLabel;
}

export function createScenarioAircraft(
  opts: {
    id: string;
    callsign: string;
    airlineCode?: AirlineCode;
    airlineName?: string;
    aircraftAsset?: string;
    aircraftType?: AircraftType;
    from: string;
    to: string;
    role?: 'emergency' | 'departing' | 'arriving' | 'pushback';
    priority?: number;
    label?: string;
    speedKts?: number;
    speedLimitKts?: number;
    route?: string[];
  },
  graph: AirportGraph = airportGraphV3
): ScenarioAircraft | null {
  const fromNodeId = resolveV3NodeId(opts.from, graph);
  const toNodeId = resolveV3NodeId(opts.to, graph);

  const route = opts.route || findPath(graph, fromNodeId, toNodeId);
  if (!route || route.length === 0) return null;

  const edges = routeToEdges(route, graph.edges);
  const firstEdgeId = edges && edges.length > 0 ? edges[0] : null;

  const aDef = getAirlineDef(opts.airlineCode || opts.callsign);

  return {
    id: opts.id,
    callsign: opts.callsign,
    airlineCode: opts.airlineCode || (aDef.name.includes('Vietnam') ? 'VN' : 'VJ'),
    airlineName: opts.airlineName || aDef.name,
    aircraftAsset: opts.aircraftAsset || aDef.asset,
    aircraftType: opts.aircraftType || 'A321',
    currentNodeId: fromNodeId,
    targetNodeId: toNodeId,
    currentEdgeId: firstEdgeId,
    progressOnEdge: 0,
    speedKts: opts.speedKts !== undefined ? opts.speedKts : 15,
    speedLimitKts: opts.speedLimitKts !== undefined ? opts.speedLimitKts : 15,
    status: 'taxiing',
    assignedRoute: route,
    routeEdgeIndex: 0,
    role: opts.role || 'departing',
    priority: opts.priority !== undefined ? opts.priority : (opts.role === 'emergency' ? 0 : 2),
    scenarioLabel: opts.label,
    clearedRoute: route,
    routeVisible: true,
    guidanceVisible: true,
  };
}

export function filterNonNull<T>(arr: (T | null | undefined)[]): T[] {
  return arr.filter((item): item is T => item !== null && item !== undefined);
}
