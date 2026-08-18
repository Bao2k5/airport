// Core domain types for the airport surface movement simulator.
// This is an educational demo — not for real-world aviation use.

export type NodeType =
  | 'gate'
  | 'stand'
  | 'taxiway'
  | 'intersection'
  | 'holding_point'
  | 'runway_entry'
  | 'runway_exit'
  | 'apron'
  | 'hotspot';

export type EdgeType = 'taxiway' | 'runway' | 'apron' | 'holding';

export type EdgeStatus = 'open' | 'closed' | 'occupied' | 'restricted';

export type TrafficLevel = 'low' | 'medium' | 'high';

export type AircraftStatus =
  | 'parked'
  | 'idle'
  | 'waiting'
  | 'taxiing'
  | 'holding'
  | 'stopped'
  | 'arrived'
  | 'departed'
  | 'queued';

export type WeatherCondition = 'clear' | 'rain' | 'fog' | 'thunderstorm';

export type TimeOfDay = 'morning' | 'afternoon' | 'night';

export type AircraftType = 'A321' | 'B737' | 'A350' | 'ATR72';

export type AirlineCode = 'VJ' | 'VN' | 'QH' | 'VU' | 'SQ' | 'TG';

export type IncidentType =
  | 'none'
  | 'blocked_taxiway'
  | 'vehicle_crossing'
  | 'runway_incursion'
  | 'low_visibility'
  | 'aircraft_stopped_ahead';

export interface AirportNode {
  id: string;
  label: string;
  type: NodeType;
  x: number; // SVG coordinate
  y: number; // SVG coordinate
  description?: string;
}

export interface AirportEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  lengthMeters: number;
  maxSpeedKts: number;
  type: EdgeType;
  bidirectional: boolean;
  status: EdgeStatus;
  trafficLevel: TrafficLevel;
}

export interface AirportGraph {
  nodes: AirportNode[];
  edges: AirportEdge[];
}

export interface Aircraft {
  id: string;
  callsign: string;
  airline?: string;
  airlineCode?: AirlineCode;
  airlineName?: string;
  aircraftAsset?: string;
  aircraftType?: AircraftType;
  currentNodeId: string;
  targetNodeId: string;
  currentEdgeId: string | null;
  progressOnEdge: number; // 0.0 to 1.0
  speedKts: number;
  status: AircraftStatus;
  assignedRoute: string[]; // ordered node IDs
  routeEdgeIndex: number;  // which edge in the route we're currently traversing
  routeVisible?: boolean;  // only true after user presses Start for this aircraft
  guidanceVisible?: boolean;
  isMoving?: boolean;
  heldSeconds?: number;
  radioFailure?: boolean;
  deviated?: boolean;
  holdReason?: string;
  releaseAtSeconds?: number;
  queueOrder?: number;
  queueRunway?: 'NORTH' | 'SOUTH';
  role?: string;
  scenarioLabel?: string;
  speedLimitKts?: number;
  speedReason?: string;
}

export interface SimulationConfig {
  startNodeId: string;
  destinationNodeId: string;
  callsign: string;
  aircraftType: AircraftType;
  airlineCode: AirlineCode;
  weather: WeatherCondition;
  timeOfDay: TimeOfDay;
  trafficLevel: TrafficLevel;
  taxiSpeedKts: number;
  incident: IncidentType;
  incidentEdgeId: string | null; // which edge is affected by incident
  autoReroute: boolean;
}

export interface LiveEventLogItem {
  id: string;
  atSeconds: number;
  callsign?: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface RunwayOccupancyState {
  NORTH: string | null;
  SOUTH: string | null;
  [key: string]: string | null | undefined;
}

export interface SimulationState {
  aircraft: Aircraft | null;
  manualFleet?: Aircraft[];
  selectedAircraftId?: string;
  // Visual-only background traffic that roams hot-spot to hot-spot. Driven by
  // config.trafficLevel; does not affect routing, lights or incidents.
  trafficAircraft: Aircraft[];
  config: SimulationConfig;
  isRunning: boolean;
  isPaused: boolean;
  routeStatus: 'pending' | 'accepted';
  elapsedSeconds: number;
  etaSeconds: number | null;
  warningMessage: string | null;
  // Light states: edge id -> 'green' | 'red' | 'off'
  lightStates: Record<string, 'green' | 'red' | 'off'>;
  // Edges blocked due to incidents
  blockedEdgeIds: Set<string>;
  liveEventLog: LiveEventLogItem[];
  runwayOccupancy?: RunwayOccupancyState;
  scenario?: any;
  scenarioAircraft?: any[];
}
