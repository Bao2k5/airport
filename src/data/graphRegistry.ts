import type { AirportGraph } from '../types';
import { airportGraphV3 } from './airportGraph.v3';

export type GraphId = 'v3';

export interface GraphRegistryEntry {
  id: GraphId;
  name: string;
  shortName: string;
  description: string;
  graph: AirportGraph;
  bgImage: string;
}

export const GRAPH_REGISTRY: Record<GraphId, GraphRegistryEntry> = {
  v3: {
    id: 'v3',
    name: 'Sân bay TSN (v3)',
    shortName: 'Sân bay TSN (v3)',
    description: 'Sân bay Tân Sơn Nhất - Mô hình V3 (Nền /anhchinh.png, 45 operational nodes).',
    graph: airportGraphV3,
    bgImage: '/anhchinh.png',
  },
};

export const DEFAULT_GRAPH_ID: GraphId = 'v3';

export function getAirportGraph(_id: GraphId = DEFAULT_GRAPH_ID): AirportGraph {
  return GRAPH_REGISTRY.v3.graph;
}

export function getGraphEntry(_id: GraphId = DEFAULT_GRAPH_ID): GraphRegistryEntry {
  return GRAPH_REGISTRY.v3;
}

