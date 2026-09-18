// Dijkstra pathfinding over the airport graph.
// Returns an ordered list of node IDs representing the shortest valid taxi route.

import type { AirportEdge, AirportGraph } from '../types';

interface DijkstraNode {
  id: string;
  cost: number;
  prev: string | null;
}

/**
 * Resolve any node ID, operational label or alias to the exact internal node ID in graph.nodes.
 */
export function resolveGraphNodeId(idOrLabel: string, graph: AirportGraph): string {
  if (!idOrLabel) return idOrLabel;
  const direct = graph.nodes.find(n => n.id === idOrLabel);
  if (direct) return direct.id;

  const norm = idOrLabel.trim().toLowerCase();
  const normClean = norm.replace(/[\s_\/]/g, '');

  const matched = graph.nodes.find(n => {
    const idClean = n.id.toLowerCase().replace(/[\s_\/]/g, '');
    const labelClean = (n.label || '').trim().toLowerCase().replace(/[\s_\/]/g, '');
    return n.id.toLowerCase() === norm ||
           (n.label && n.label.trim().toLowerCase() === norm) ||
           idClean === normClean ||
           labelClean === normClean;
  });
  if (matched) return matched.id;

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
    'stand_16': 'v3_line_21_p01',
    'stand_17': 'v3_line_22_p01',
    'stand_18': 'v3_line_23_p01',
    'stand_20': 'v3_line_24_p01',
    'stand_21': 'v3_line_25_p01',
    'stand_22': 'v3_line_26_p04',
    'stop_bar_25r': 'v3_line_01_p03',
    'stop_bar_25l': 'v3_line_17_p16',
    'w6_07l': 'v3_line_03_p00',
    'w11_07r': 'v3_line_16_p01',
    'w9b_w7a': 'v3_line_18_p03',
    'w7a_25l': 'v3_line_18_p01',
    'w4_25r': 'v3_line_04_p01',
    'w4_25l': 'v3_line_04_p03',
  };
  if (standMap[norm]) return standMap[norm];
  if (standMap[normClean]) return standMap[normClean];

  return idOrLabel;
}

/**
 * Find shortest path from startNodeId to endNodeId using raw Dijkstra.
 */
function dijkstraShortest(
  graph: AirportGraph,
  rawStartId: string,
  rawEndId: string,
  blockedEdgeIds: Set<string> = new Set()
): string[] | null {
  const startNodeId = resolveGraphNodeId(rawStartId, graph);
  const endNodeId = resolveGraphNodeId(rawEndId, graph);
  if (!graph.nodes.some(n => n.id === startNodeId) || !graph.nodes.some(n => n.id === endNodeId)) {
    return null;
  }
  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const visited = new Set<string>();

  for (const node of graph.nodes) {
    dist[node.id] = Infinity;
    prev[node.id] = null;
  }
  dist[startNodeId] = 0;

  const queue: DijkstraNode[] = [{ id: startNodeId, cost: 0, prev: null }];

  while (queue.length > 0) {
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift()!;

    if (visited.has(current.id)) continue;
    visited.add(current.id);

    if (current.id === endNodeId) break;

    for (const edge of getTraversableEdges(current.id, graph.edges, blockedEdgeIds)) {
      const neighborId = getOtherEnd(edge, current.id);
      if (visited.has(neighborId)) continue;

      const edgeLen = edge.lengthMeters ?? (edge as any).length ?? 10;
      const newCost = dist[current.id] + edgeLen;
      if (newCost < dist[neighborId]) {
        dist[neighborId] = newCost;
        prev[neighborId] = current.id;
        queue.push({ id: neighborId, cost: newCost, prev: current.id });
      }
    }
  }

  if (dist[endNodeId] === Infinity) return null;

  const path: string[] = [];
  let cur: string | null = endNodeId;
  while (cur !== null) {
    path.unshift(cur);
    cur = prev[cur];
  }
  return path;
}

/**
 * Find shortest path from startNodeId to endNodeId with ATC Waypoint compliance.
 * When aircraft taxis to STOP BAR 25L for takeoff, it must route through E6 taxiway loop.
 */
export function findPath(
  graph: AirportGraph,
  rawStartId: string,
  rawEndId: string,
  blockedEdgeIds: Set<string> = new Set()
): string[] | null {
  const startNodeId = resolveGraphNodeId(rawStartId, graph);
  const endNodeId = resolveGraphNodeId(rawEndId, graph);
  if (startNodeId === endNodeId) return [startNodeId];

  // 1. Kiểm tra nếu là tàu bay hạ cánh (từ RWY 25R vào sân đỗ)
  // Quy chuẩn khai thác TSN: Mặc định tàu bay hạ cánh phải thoát qua các tuyến đường W7 (W7A).
  // Chỉ khi có sự cố (bị chặn/FOD trên W7) thì mới tự động gợi ý vòng qua các tuyến đường khác.
  const startNode = graph.nodes.find(n => n.id === startNodeId || n.label === startNodeId);
  const isLanding25R = startNodeId === 'v3_line_01_p03' ||
    startNodeId === 'STOP_BAR_25R' ||
    startNodeId.startsWith('v3_line_01_') ||
    (startNode && (startNode.label.includes('25R') || startNode.label.includes('hạ cánh')));

  const w7NodeId = 'v3_line_18_p03'; // Điểm nút giao đáy ngã ba W9B/W7A (chạy thẳng xuống hết W7A)
  const hasW7Node = graph.nodes.some(n => n.id === w7NodeId);
  const isDestPastW7 = endNodeId !== w7NodeId &&
    endNodeId !== 'v3_line_18_p01' &&
    endNodeId !== 'v3_line_18_p02' &&
    endNodeId !== 'v3_line_04_p00' &&
    endNodeId !== 'v3_line_04_p01' &&
    !endNodeId.startsWith('v3_line_01_');

  // Kiểm tra xem W7 (trục W7A) có đang bị sự cố/chặn không
  const isW7Incident = Array.from(blockedEdgeIds).some(id =>
    id.includes('v3_line_18_p01') ||
    id.includes('v3_line_18_p02') ||
    id.includes('v3_line_18_p03') ||
    id.includes('E_v3_line_18')
  );

  if (isLanding25R && hasW7Node && startNodeId !== w7NodeId && isDestPastW7 && !isW7Incident) {
    // Chặng 1: Thoát ly hạ cánh (Mặc định qua W4; nếu W4 gặp sự cố tự động qua W6) -> rẽ vào W7A -> chạy thẳng xuống hết ngã ba W9B/W7A
    const leg1 = dijkstraShortest(graph, startNodeId, w7NodeId, blockedEdgeIds);

    // Chặng 2: Từ W9B/W7A -> Bến đỗ / Điểm đến
    // Tuyệt đối không cho phép máy bay lăn ngược vào các đoạn đường băng (Runway 25L/07R, W11/07R) để đi tắt
    const leg2Blocked = new Set(blockedEdgeIds);
    for (const e of graph.edges) {
      if (e.type === 'runway') {
        leg2Blocked.add(e.id);
      }
    }

    const leg2 = dijkstraShortest(graph, w7NodeId, endNodeId, leg2Blocked);

    if (leg1 && leg2) {
      // Ghép 2 chặng đi qua W7A chuẩn xác
      return [...leg1, ...leg2.slice(1)];
    }
    // Khi có sự cố chặn trên W7A -> tự động fallback sang Dijkstra toàn đồ thị bên dưới để đi đường vòng khác
  }

  // 2. Kiểm tra nếu đích đến là vạch cất cánh STOP BAR 25L
  const destNode = graph.nodes.find(n => n.id === endNodeId || n.label === endNodeId);
  const isDest25L = endNodeId === 'v3_line_17_p16' ||
    endNodeId === 'v3_line_05_p07' ||
    endNodeId === 'STOP_BAR_25L' ||
    (destNode && (destNode.label.includes('25L') || destNode.label.includes('STOP BAR 25L')));

  // Điểm nút E6 trên trục đường lăn vòng
  const e6NodeId = 'v3_line_17_p13';
  const hasE6Node = graph.nodes.some(n => n.id === e6NodeId);

  // Nếu cất cánh 25L và xuất phát không phải từ chính E6 hay đầu đường băng
  if (isDest25L && hasE6Node && startNodeId !== e6NodeId && startNodeId !== endNodeId) {
    // Chặng 1: Từ bến đỗ -> E6
    const leg1 = dijkstraShortest(graph, startNodeId, e6NodeId, blockedEdgeIds);
    // Chặng 2: Từ E6 -> STOP BAR 25L
    const leg2 = dijkstraShortest(graph, e6NodeId, endNodeId, blockedEdgeIds);

    if (leg1 && leg2) {
      // Ghép 2 chặng (loại bỏ node trùng lặp ở giữa)
      return [...leg1, ...leg2.slice(1)];
    }
  }

  // Mặc định chạy Dijkstra thông thường
  return dijkstraShortest(graph, startNodeId, endNodeId, blockedEdgeIds);
}

/**
 * Operational restrictions:
 * Segments prohibited from normal operational taxi routing per TSN regulations
 * (e.g. crossing directly between RWY 25R and RWY 25L via NS1 or E1).
 */
export const OPERATIONAL_RESTRICTED_EDGES = new Set<string>([
  'E_v3_line_06_p01_v3_line_06_p02', // NS1/25R - NS1/25L
  'E_v3_line_08_p00_v3_line_08_p01', // 25R - E1
  'E_v3_line_08_p01_v3_line_08_p02', // E1 - E1/25L
]);

/** Check if a route traverses any operationally restricted edges */
export function routeHasRestrictedEdges(route: string[], edges: AirportEdge[]): boolean {
  const edgeIds = routeToEdges(route, edges);
  if (!edgeIds) return false;
  return edgeIds.some(id => OPERATIONAL_RESTRICTED_EDGES.has(id));
}

/** Get edges the aircraft can use from a given node */
function getTraversableEdges(
  nodeId: string,
  edges: AirportEdge[],
  blockedEdgeIds: Set<string>
): AirportEdge[] {
  return edges.filter(e => {
    if (OPERATIONAL_RESTRICTED_EDGES.has(e.id)) return false;
    if (blockedEdgeIds.has(e.id)) return false;
    if (e.status === 'closed' || e.status === 'restricted') return false;
    if (e.fromNodeId === nodeId) return true;
    if (e.bidirectional && e.toNodeId === nodeId) return true;
    return false;
  });
}

function getOtherEnd(edge: AirportEdge, fromNodeId: string): string {
  return edge.fromNodeId === fromNodeId ? edge.toNodeId : edge.fromNodeId;
}

/**
 * Given an ordered route (array of node IDs), return the ordered edge IDs.
 * Returns null if any consecutive pair has no connecting edge.
 */
export function routeToEdges(route: string[], edges: AirportEdge[]): string[] | null {
  if (!route || route.length < 2) return [];
  const edgeIds: string[] = [];
  for (let i = 0; i < route.length - 1; i++) {
    const from = route[i];
    const to = route[i + 1];
    const edge = edges.find(e =>
      (e.fromNodeId === from && e.toNodeId === to) ||
      (e.bidirectional && e.fromNodeId === to && e.toNodeId === from)
    );
    if (!edge) return null;
    edgeIds.push(edge.id);
  }
  return edgeIds;
}

/**
 * Estimate travel time in seconds for a route given speed in knots.
 * 1 knot = 1 nautical mile/hour = 1852 m/3600 s = 0.5144 m/s
 */
export function estimateTravelTimeSeconds(
  route: string[],
  edges: AirportEdge[],
  speedKts: number
): number {
  const edgeIds = routeToEdges(route, edges);
  if (!edgeIds) return 0;

  let totalMeters = 0;
  for (const edgeId of edgeIds) {
    const edge = edges.find(e => e.id === edgeId);
    if (edge) totalMeters += edge.lengthMeters;
  }

  const speedMs = speedKts * 0.5144;
  return speedMs > 0 ? totalMeters / speedMs : 0;
}
