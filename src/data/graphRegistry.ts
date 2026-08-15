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
    name: 'Mô hình Đồ thị Gốc (Graph V1 - Bản đồ cũ)',
    shortName: 'Graph V1 (Cũ)',
    description: 'Graph 127 nodes, 142 edges chuẩn của simulator ban đầu.',
    graph: airportGraph,
    bgImage: '/ref_full.png',
  },
  v2: {
    id: 'v2',
    name: 'Mô hình Đồ thị Chuẩn Hóa V2 (Graph V2 - anhtren.png)',
    shortName: 'Graph V2 (Mới)',
    description: 'Graph 162 nodes, 166 edges khớp 100% với 44 nhánh raw trace trên ảnh anhtren.png.',
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
