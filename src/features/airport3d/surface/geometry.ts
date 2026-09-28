import type { AirportGraph, AirportNode, AirportEdge } from '../../../types';
import { V3_OPERATIONAL_STANDS } from '../../../data/v3OperationalNodes';

export type Point = { x: number; z: number };
export type Segment = { edge: AirportEdge; a: Point; b: Point; length: number; width: number; apron: boolean };
export type PathPart = { segment: Segment; a: Point; b: Point };
export const SURFACE_SIZE = { width: 112, depth: 82, elevation: 0.025 };
// Some historical junctions (INTL_S3/S4) carry type=stand. Only actual
// operational parking positions may suppress the taxiway pavement.
export const isStand = (node: AirportNode) => /^STAND[_ -]?\d+/i.test(node.label) || V3_OPERATIONAL_STANDS.some(stand => stand.id === node.id || stand.label === node.label);
export const worldPoint = (node: AirportNode): Point => ({ x: (node.x - 600) * 0.075, z: (node.y - 430) * 0.075 });

export function getSegments(graph: AirportGraph): Segment[] {
  const nodes = new Map(graph.nodes.map(node => [node.id, node]));
  return graph.edges.flatMap(edge => {
    const from = nodes.get(edge.fromNodeId), to = nodes.get(edge.toNodeId);
    if (!from || !to) return [];
    const a = worldPoint(from), b = worldPoint(to);
    const length = Math.hypot(b.x - a.x, b.z - a.z);
    if (length < 0.0001) return [];
    const apron = isStand(from) || isStand(to);
    return [{ edge, a, b, length, apron, width: edge.type === 'runway' ? 5.2 : apron || edge.type === 'apron' ? 2.8 : 1.35 }];
  });
}

// Degree-two vertices continue the same line; junctions terminate a chain.
// This is presentation geometry only: node IDs and graph connections stay intact.
export function getPaths(segments: Segment[]): PathPart[][] {
  const adjacent = new Map<string, Segment[]>();
  for (const segment of segments) {
    for (const id of [segment.edge.fromNodeId, segment.edge.toNodeId]) {
      adjacent.set(id, [...(adjacent.get(id) ?? []), segment]);
    }
  }
  const visited = new Set<string>();
  const paths: PathPart[][] = [];
  function walk(start: string, initial: Segment) {
    let current: Segment | undefined = initial, node = start;
    const path: PathPart[] = [];
    while (current && !visited.has(current.edge.id)) {
      visited.add(current.edge.id);
      const forward = current.edge.fromNodeId === node;
      path.push({ segment: current, a: forward ? current.a : current.b, b: forward ? current.b : current.a });
      node = forward ? current.edge.toNodeId : current.edge.fromNodeId;
      const next = adjacent.get(node) ?? [];
      current = next.length === 2 ? next.find(item => !visited.has(item.edge.id)) : undefined;
    }
    if (path.length) paths.push(path);
  }
  for (const [id, connected] of adjacent) if (connected.length !== 2) connected.forEach(segment => walk(id, segment));
  segments.forEach(segment => walk(segment.edge.fromNodeId, segment));
  return paths;
}

export function distanceToSegment(point: Point, segment: Segment) {
  const dx = segment.b.x - segment.a.x, dz = segment.b.z - segment.a.z;
  const t = Math.max(0, Math.min(1, ((point.x - segment.a.x) * dx + (point.z - segment.a.z) * dz) / segment.length ** 2));
  return Math.hypot(point.x - segment.a.x - dx * t, point.z - segment.a.z - dz * t);
}

export function samplePaths(paths: PathPart[][], spacing: number, visit: (point: Point, tangent: Point, segment: Segment, distance: number, index: number, count: number) => void) {
  for (const path of paths) {
    const total = path.reduce((sum, part) => sum + part.segment.length, 0);
    const count = Math.max(1, Math.floor(total / spacing));
    // Spacing is distributed over the whole line, never restarted at every edge.
    for (let index = 0; index < count; index += 1) {
      const distance = (index + 0.5) * total / count;
      let remaining = distance;
      for (const part of path) {
        if (remaining > part.segment.length) { remaining -= part.segment.length; continue; }
        const tangent = { x: (part.b.x - part.a.x) / part.segment.length, z: (part.b.z - part.a.z) / part.segment.length };
        visit({ x: part.a.x + tangent.x * remaining, z: part.a.z + tangent.z * remaining }, tangent, part.segment, distance, index, count);
        break;
      }
    }
  }
}
