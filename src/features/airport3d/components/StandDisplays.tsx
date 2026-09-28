import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import type { AirportGraph, SimulationState } from '../../../types';
import { getStandParkingHeading } from '../../../presentation/aircraftPose';
import { distanceToSegment, getSegments, isStand, worldPoint } from '../surface/geometry';

export default function StandDisplays({ graph, state }: { graph: AirportGraph; state: SimulationState }) {
  const displays = useMemo(() => {
    const segments = getSegments(graph);
    return graph.nodes.filter(isStand).flatMap(node => {
      const p = worldPoint(node), heading = getStandParkingHeading(node.id, node) * Math.PI / 180;
      const point = { x: p.x + Math.sin(heading) * 2.4, z: p.z - Math.cos(heading) * 2.4 };
      if (segments.some(segment => distanceToSegment(point, segment) < segment.width / 2 + 0.35)) return [];
      return [{ node, point, heading }];
    });
  }, [graph]);
  const fleet = state.scenarioAircraft?.length ? state.scenarioAircraft : state.manualFleet ?? [];
  return <>{displays.map(({ node, point, heading }) => {
    const flight = fleet.find(a => a.status !== 'departed' && (a.currentNodeId === node.id || a.targetNodeId === node.id));
    const parked = flight && ['parked', 'arrived'].includes(flight.status) && flight.currentNodeId === node.id;
    return <group key={node.id} position={[point.x, 0, point.z]} rotation={[0, -heading, 0]}>
      <mesh position={[0, 0.7, 0]} castShadow><cylinderGeometry args={[0.04, 0.065, 1.4, 10]} /><meshStandardMaterial color="#768891" metalness={0.6} /></mesh>
      <mesh position={[0, 1.4, 0]} castShadow><boxGeometry args={[0.6, 0.42, 0.12]} /><meshStandardMaterial color="#17232e" roughness={0.45} /></mesh>
      <Html position={[0, 1.4, 0.07]} transform distanceFactor={1} style={{ pointerEvents: 'none' }}>
        <div className="w-44 bg-slate-950 p-2 text-center font-mono text-xl font-bold" style={{ color: parked ? '#fb7185' : '#facc15' }}>{node.label.replace('STAND_', '')}<small className="block text-sm">{parked ? 'STOP' : flight ? 'ASSIGNED' : 'FREE'}</small></div>
      </Html>
    </group>;
  })}</>;
}
