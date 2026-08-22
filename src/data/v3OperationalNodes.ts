// Exact 45 Operational Nodes Specification for Graph V3 (Tân Sơn Nhất)
// 18 Stands + 27 Operational Intersection/Stop Bar Nodes

export interface OperationalNodeDef {
  id: string;          // Safe internal ID (no slashes or spaces, e.g. W5_07L, STOP_BAR_25R)
  label: string;       // Exact display label with slashes/spaces (e.g. "W5/07L", "STOP BAR 25R")
  category: 'STAND' | 'INTERSECTION' | 'STOP_BAR';
  description?: string;
}

// 18 Stands
export const V3_OPERATIONAL_STANDS: OperationalNodeDef[] = [
  { id: 'STAND_1', label: 'STAND_1', category: 'STAND', description: 'Bến đỗ số 1' },
  { id: 'STAND_2', label: 'STAND_2', category: 'STAND', description: 'Bến đỗ số 2' },
  { id: 'STAND_3', label: 'STAND_3', category: 'STAND', description: 'Bến đỗ số 3' },
  { id: 'STAND_4', label: 'STAND_4', category: 'STAND', description: 'Bến đỗ số 4' },
  { id: 'STAND_5', label: 'STAND_5', category: 'STAND', description: 'Bến đỗ số 5' },
  { id: 'STAND_7', label: 'STAND_7', category: 'STAND', description: 'Bến đỗ số 7' },
  { id: 'STAND_8', label: 'STAND_8', category: 'STAND', description: 'Bến đỗ số 8' },
  { id: 'STAND_9', label: 'STAND_9', category: 'STAND', description: 'Bến đỗ số 9' },
  { id: 'STAND_10', label: 'STAND_10', category: 'STAND', description: 'Bến đỗ số 10' },
  { id: 'STAND_11', label: 'STAND_11', category: 'STAND', description: 'Bến đỗ số 11' },
  { id: 'STAND_12', label: 'STAND_12', category: 'STAND', description: 'Bến đỗ số 12' },
  { id: 'STAND_13', label: 'STAND_13', category: 'STAND', description: 'Bến đỗ số 13' },
  { id: 'STAND_16', label: 'STAND_16', category: 'STAND', description: 'Bến đỗ số 16' },
  { id: 'STAND_17', label: 'STAND_17', category: 'STAND', description: 'Bến đỗ số 17' },
  { id: 'STAND_18', label: 'STAND_18', category: 'STAND', description: 'Bến đỗ số 18' },
  { id: 'STAND_20', label: 'STAND_20', category: 'STAND', description: 'Bến đỗ số 20' },
  { id: 'STAND_21', label: 'STAND_21', category: 'STAND', description: 'Bến đỗ số 21' },
  { id: 'STAND_22', label: 'STAND_22', category: 'STAND', description: 'Bến đỗ số 22' },
];

// 26 Operational Points (Intersections, Exits, Stop Bars)
export const V3_OPERATIONAL_POINTS: OperationalNodeDef[] = [
  { id: 'W5_07L', label: 'W5/07L', category: 'INTERSECTION', description: 'Giao cắt W5 và 07L' },
  { id: 'W5_07R', label: 'W5/07R', category: 'INTERSECTION', description: 'Giao cắt W5 và 07R' },
  { id: 'W11_07R', label: 'W11/07R', category: 'INTERSECTION', description: 'Nút vào W11 đầu 07R' },
  { id: 'W9A_07R', label: 'W9A/07R', category: 'INTERSECTION', description: 'Nút thoát W9A đầu 07R' },
  { id: 'W9B', label: 'W9B', category: 'INTERSECTION', description: 'Trục đáy đường lăn W9B' },
  { id: 'W4_25R', label: 'W4/25R', category: 'INTERSECTION', description: 'Nút thoát W4 ra 25R' },
  { id: 'W4_25L', label: 'W4/25L', category: 'INTERSECTION', description: 'Nút thoát W4 ra 25L' },
  { id: 'W7A_25L', label: 'W7A/25L', category: 'INTERSECTION', description: 'Nút thoát W7A từ 25L' },
  { id: 'W9B_W7A', label: 'W9B/W7A', category: 'INTERSECTION', description: 'Nút giao ngã ba W9B và W7A' },
  { id: 'W5_25L', label: 'W5/25L', category: 'INTERSECTION', description: 'Giao cắt W5 và 25L' },
  { id: 'W9B_M5', label: 'W9B/M5', category: 'INTERSECTION', description: 'Nút giao W9B và M5' },
  { id: 'W3_25L', label: 'W3/25L', category: 'INTERSECTION', description: 'Nút thoát W3 từ 25L' },
  { id: 'HS_W7', label: 'HS W7', category: 'INTERSECTION', description: 'Hotspot giao lộ W7' },
  { id: 'HS_NS', label: 'HS NS', category: 'INTERSECTION', description: 'Hotspot giao lộ trục NS' },
  { id: 'E6_NS2', label: 'E6/NS2', category: 'INTERSECTION', description: 'Giao cắt E6 và NS2' },
  { id: 'NS2_25L', label: 'NS2/25L', category: 'INTERSECTION', description: 'Giao cắt NS2 và 25L' },
  { id: 'NS1_25L', label: 'NS1/25L', category: 'INTERSECTION', description: 'Giao cắt NS1 và 25L' },
  { id: 'NS1_25R', label: 'NS1/25R', category: 'INTERSECTION', description: 'Giao cắt NS1 và 25R' },
  { id: 'E6_E2', label: 'E6/E2', category: 'INTERSECTION', description: 'Giao cắt E6 và E2' },
  { id: 'E2_25L', label: 'E2/25L', category: 'INTERSECTION', description: 'Nút vào E2 đầu 25L' },
  { id: 'E1_25L', label: 'E1/25L', category: 'INTERSECTION', description: 'Nút vào E1 đầu 25L' },
  { id: 'STOP_BAR_25R', label: 'STOP BAR 25R', category: 'STOP_BAR', description: 'Nơi máy bay hạ cánh' },
  { id: 'E4_25L', label: 'E4/25L', category: 'INTERSECTION', description: 'Nút rẽ E4 vào 25L' },
  { id: 'E6_E4', label: 'E6/E4', category: 'INTERSECTION', description: 'Nút giao E6 và E4' },
  { id: 'E6', label: 'E6', category: 'INTERSECTION', description: 'Đường lăn vòng E6' },
  { id: 'STOP_BAR_25L', label: 'STOP BAR 25L', category: 'STOP_BAR', description: 'Nơi máy bay cất cánh' },
];

// Exact Complete Operational Nodes List (44 items in order)
export const V3_EXACT_OPERATIONAL_NODES: OperationalNodeDef[] = [
  ...V3_OPERATIONAL_STANDS,
  ...V3_OPERATIONAL_POINTS,
];

// Maps for O(1) Lookups
export const V3_OPERATIONAL_MAP_BY_ID = new Map<string, OperationalNodeDef>(
  V3_EXACT_OPERATIONAL_NODES.map(item => [item.id, item])
);

export const V3_OPERATIONAL_MAP_BY_LABEL = new Map<string, OperationalNodeDef>(
  V3_EXACT_OPERATIONAL_NODES.map(item => [item.label, item])
);

// Normalize any label or alias to safe internal ID
export function toSafeNodeId(label: string): string {
  const trimmed = label.trim();
  const matched = V3_OPERATIONAL_MAP_BY_LABEL.get(trimmed) || V3_OPERATIONAL_MAP_BY_ID.get(trimmed);
  if (matched) return matched.id;
  return trimmed.replace(/[\/\s-]+/g, '_').toUpperCase();
}

// Get official display label (with slashes and spaces) for an ID
export function getOperationalDisplayLabel(idOrLabel: string): string {
  const safeId = toSafeNodeId(idOrLabel);
  const matched = V3_OPERATIONAL_MAP_BY_ID.get(safeId);
  return matched ? matched.label : idOrLabel;
}

// Check if a node ID or label is in the official 45 operational node whitelist
export function isOperationalNode(idOrLabel: string): boolean {
  const safeId = toSafeNodeId(idOrLabel);
  return V3_OPERATIONAL_MAP_BY_ID.has(safeId);
}
