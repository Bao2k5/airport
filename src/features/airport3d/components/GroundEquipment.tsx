import { useMemo } from 'react';
import type { AirportGraph, SimulationState, Aircraft } from '../../../types';
import { distanceToSegment, getSegments, isStand, worldPoint } from '../surface/geometry';
import { getAircraftWorldPose } from '../sceneCoordinates';
import type { AirportLayout } from '../layout';

export function findEquipmentPositions(graph: AirportGraph, layout: AirportLayout) {
  const segments = getSegments(graph), stands = graph.nodes.filter(isStand).map(worldPoint);
  const points: [number, number, number][] = [];
  for (const stand of stands) {
    for (const [dx, dz] of [[3, 3], [-3, 3], [3, -3], [-3, -3]]) {
      const p = { x: stand.x + dx, z: stand.z + dz };
      if (Math.abs(p.x) > 54 || Math.abs(p.z) > 39) continue;
      if (segments.some(s => distanceToSegment(p, s) < s.width / 2 + 1.4)) continue;
      if (stands.some(s => Math.hypot(p.x - s.x, p.z - s.z) < 3.2)) continue;
      if (layout.some(item => Math.hypot(p.x - item.position[0], p.z - item.position[2]) < (item.kind === 'tower' ? 4 * item.scale : 2))) continue;
      if (points.some(q => Math.hypot(p.x - q[0], p.z - q[2]) < 3)) continue;
      points.push([p.x, 0.08, p.z]); break;
    }
  }
  return points;
}

function Wheel({ x, z }: { x: number; z: number }) {
  return <group position={[x, 0.14, z]} rotation={[0, 0, Math.PI / 2]}>
    <mesh><cylinderGeometry args={[0.14, 0.14, 0.12, 14]} /><meshStandardMaterial color="#20252a" roughness={0.9} /></mesh>
    <mesh position={[0, x > 0 ? -0.065 : 0.065, 0]}><cylinderGeometry args={[0.07, 0.07, 0.014, 12]} /><meshStandardMaterial color="#aab5bb" metalness={0.7} /></mesh>
  </group>;
}

export function ServiceVehicle({ kind = 0 }: { kind?: number }) {
  return <group>
    <mesh position={[0, 0.28, 0]} castShadow><boxGeometry args={[0.72, 0.27, 1.1]} /><meshStandardMaterial color={kind === 1 ? '#d8b94d' : '#dce1dd'} metalness={0.25} roughness={0.48} /></mesh>
    {[-0.38, 0.38].flatMap(x => [-0.34, 0.34].map(z => <Wheel key={`${x}:${z}`} x={x} z={z} />))}
    {kind !== 2 ? <>
      <mesh position={[0, 0.58, -0.2]} castShadow><boxGeometry args={[0.63, 0.38, 0.46]} /><meshStandardMaterial color="#dce1dd" roughness={0.45} /></mesh>
      <mesh position={[0, 0.61, -0.435]}><planeGeometry args={[0.52, 0.22]} /><meshStandardMaterial color="#234859" metalness={0.55} roughness={0.12} /></mesh>
      <mesh position={[0, 0.81, -0.2]}><sphereGeometry args={[0.05, 10, 8]} /><meshStandardMaterial color="#e8aa32" emissive="#a76113" emissiveIntensity={0.5} /></mesh>
      {[-0.24, 0.24].map(x => <mesh key={x} position={[x, 0.3, -0.56]}><sphereGeometry args={[0.045, 8, 6]} /><meshBasicMaterial color="#fff4d2" /></mesh>)}
    </> : <>
      {[-0.3, 0.3].flatMap(x => [-0.4, 0.4].map(z => <mesh key={`${x}:${z}`} position={[x, 0.6, z]}><cylinderGeometry args={[0.025, 0.025, 0.6, 8]} /><meshStandardMaterial color="#83959d" metalness={0.6} /></mesh>))}
      <mesh position={[0, 0.91, 0]}><boxGeometry args={[0.7, 0.05, 1]} /><meshStandardMaterial color="#81919a" metalness={0.5} /></mesh>
      {[-0.22, 0.2].map(z => <mesh key={z} position={[0, 0.56, z]}><capsuleGeometry args={[0.17, 0.18, 4, 8]} /><meshStandardMaterial color="#46536a" /></mesh>)}
    </>}
    <mesh position={[0, 0.13, 0.8]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.025, 0.025, 0.5, 8]} /><meshStandardMaterial color="#8f9ba3" metalness={0.6} /></mesh>
  </group>;
}

export default function GroundEquipment({ graph, state, layout, density, people }: { graph: AirportGraph; state: SimulationState; layout: AirportLayout; density: number; people: boolean }) {
  const points = useMemo(() => findEquipmentPositions(graph, layout), [graph, layout]);
  const fleet: Aircraft[] = state.scenarioAircraft?.length ? state.scenarioAircraft : state.manualFleet ?? [];
  return <>
    {points.slice(0, density).map((point, index) => <group key={index} position={point}>
      <ServiceVehicle kind={index % 3} />
      {people && <group position={[0.9, 0, 0]}>
        <mesh position={[0, 0.62, 0]}><capsuleGeometry args={[0.09, 0.23, 4, 8]} /><meshStandardMaterial color="#d3ed44" /></mesh>
        <mesh position={[0, 0.92, 0]}><sphereGeometry args={[0.08, 10, 8]} /><meshStandardMaterial color="#c49a7a" /></mesh>
        {[-0.05, 0.05].map(x => <mesh key={x} position={[x, 0.29, 0]}><capsuleGeometry args={[0.035, 0.35, 4, 8]} /><meshStandardMaterial color="#253445" /></mesh>)}
      </group>}
    </group>)}
    {fleet.filter(a => !a.hidden && !a.flight && a.status === 'taxiing' && a.routeEdgeIndex === 0 && a.progressOnEdge < 0.6 && graph.nodes.some(n => n.id === a.assignedRoute[0] && isStand(n))).map(a => {
      const pose = getAircraftWorldPose(a, graph);
      return pose && <group key={a.id} position={pose.position} rotation={[0, pose.yaw, 0]}><group position={[0, 0.05, -1.9]} scale={0.65}><ServiceVehicle /></group></group>;
    })}
  </>;
}
