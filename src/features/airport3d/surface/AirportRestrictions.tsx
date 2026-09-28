import { useMemo } from 'react';
import type { AirportGraph, SimulationState } from '../../../types';
import { getPaths, getSegments, SURFACE_SIZE } from './geometry';
import { AIRPORT_VISUAL } from '../visualTokens';

// A closure without a mapped holding point is a closure symbol, not a fabricated
// stop bar at the middle of each edge. One symbol represents each closed chain.
export default function AirportRestrictions({ graph, state }: { graph: AirportGraph; state: SimulationState }) {
  const locations = useMemo(() => getPaths(getSegments(graph).filter(s => state.blockedEdgeIds.has(s.edge.id) || s.edge.status === 'closed')).map(path => {
    let remaining = path.reduce((sum, part) => sum + part.segment.length, 0) / 2;
    for (const part of path) {
      if (remaining > part.segment.length) { remaining -= part.segment.length; continue; }
      const t = remaining / part.segment.length;
      return { id: path[0].segment.edge.id, x: part.a.x + (part.b.x - part.a.x) * t, z: part.a.z + (part.b.z - part.a.z) * t };
    }
    return null;
  }).filter(item => item !== null), [graph, state.blockedEdgeIds]);
  return <>{locations.map(item => <group key={item.id} position={[item.x, SURFACE_SIZE.elevation + 0.01, item.z]}>
    {[-Math.PI / 4, Math.PI / 4].map(angle => <mesh key={angle} rotation={[-Math.PI / 2, 0, angle]}>
      <planeGeometry args={[0.8, 0.09]} /><meshBasicMaterial color={AIRPORT_VISUAL.stopBar} />
    </mesh>)}
  </group>)}</>;
}
