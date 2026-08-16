import type { AirportGraph } from '../types';
import { airportGraph } from './airportGraph';
import { airportGraphV2 } from './airportGraph.v2';

export type GraphId = 'v1' | 'v2';

export interface GraphRegistryEntry {
  id: GraphId;
  name: string;
  shortName: string;
  description: string;
  graph: AirportGraph;
  bgImage: string;
}

export const GRAPH_REGISTRY: Record<GraphId, GraphRegistryEntry> = {
  v1: {
    id: 'v1',
    name: 'Sân bay TSN (v1)',
    shortName: 'Sân bay TSN (v1)',
    description: 'Sân bay Tân Sơn Nhất - Mô hình V1 (127 nodes, 142 edges).',
    graph: airportGraph,
    bgImage: '/ref_full.png',
  },
  v2: {
    id: 'v2',
    name: 'Sân bay TSN (v2)',
    shortName: 'Sân bay TSN (v2)',
    description: 'Sân bay Tân Sơn Nhất - Mô hình V2 (162 nodes, 166 edges).',
    graph: airportGraphV2,
    bgImage: '/anhtren.png',
  },
};

export const DEFAULT_GRAPH_ID: GraphId = 'v1';

export function getAirportGraph(id: GraphId = DEFAULT_GRAPH_ID): AirportGraph {
  return GRAPH_REGISTRY[id]?.graph ?? airportGraph;
}

export function getGraphEntry(id: GraphId = DEFAULT_GRAPH_ID): GraphRegistryEntry {
  return GRAPH_REGISTRY[id] ?? GRAPH_REGISTRY.v1;
}
