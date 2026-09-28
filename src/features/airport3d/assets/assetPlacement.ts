import type { AirportGraph } from '../../../types';
import { getSegments, worldPoint } from '../surface/geometry';

export const ASSET_ZONE = { width: 24, depth: 24, clearance: 5 };
export function getAssetZone(graph: AirportGraph): [number, number, number] {
  const segments = getSegments(graph);
  const east = Math.max(56.6, ...segments.map(s => Math.max(s.a.x, s.b.x) + s.width / 2));
  const stands = graph.nodes.filter(n => /^STAND[_ -]?\d+/i.test(n.label)).map(worldPoint);
  const z = stands.length ? stands.reduce((sum, n) => sum + n.z, 0) / stands.length : 0;
  return [east + ASSET_ZONE.clearance + ASSET_ZONE.width / 2, 0.025, z];
}
