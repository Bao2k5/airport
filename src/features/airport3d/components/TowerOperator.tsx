import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import type { SimulationState } from '../../../types';

export default function TowerOperator({ x, role, state }: { x: number; role: 'GND' | 'TWR'; state: SimulationState }) {
  const arm = useRef<Group>(null);
  const bubble = state.comicBubble;
  const transmitting = !!bubble?.active && new RegExp(`ATC|${role}`, 'i').test(bubble.speaker);
  useFrame(() => {
    if (arm.current) arm.current.rotation.x = transmitting ? -0.85 + Math.sin(state.elapsedSeconds * 4) * 0.04 : 0.15;
  });
  return <group position={[x, 8.68, 1.52]}>
    <mesh position={[0, 0.32, 0]}><capsuleGeometry args={[0.21, 0.3, 6, 12]} /><meshStandardMaterial color="#d4dbe1" roughness={0.9} /></mesh>
    <mesh position={[0, 0.8, -0.015]}><sphereGeometry args={[0.17, 20, 16]} /><meshStandardMaterial color="#c69a7a" roughness={0.9} /></mesh>
    <mesh position={[0, 0.86, 0.02]}><sphereGeometry args={[0.172, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.58]} /><meshStandardMaterial color="#28211d" /></mesh>
    <mesh position={[0, 0.83, 0]}><torusGeometry args={[0.18, 0.025, 8, 20, Math.PI]} /><meshStandardMaterial color="#17222d" /></mesh>
    {[-0.18, 0.18].map(dx => <mesh key={dx} position={[dx, 0.78, 0]}><sphereGeometry args={[0.065, 12, 8]} /><meshStandardMaterial color="#17222d" /></mesh>)}
    <group ref={arm} position={[0.25, 0.44, 0]}>
      <mesh position={[0, -0.12, -0.12]} rotation={[0.7, 0, 0]}><capsuleGeometry args={[0.067, 0.28, 4, 10]} /><meshStandardMaterial color="#d4dbe1" /></mesh>
      <mesh position={[0, -0.23, -0.27]}><sphereGeometry args={[0.065, 12, 8]} /><meshStandardMaterial color="#c69a7a" /></mesh>
      <mesh position={[0, -0.16, -0.3]}><capsuleGeometry args={[0.035, 0.14, 4, 8]} /><meshStandardMaterial color="#111b25" /></mesh>
    </group>
    {[-0.12, 0.12].map(dx => <mesh key={dx} position={[dx, -0.23, -0.2]} rotation={[-0.5, 0, 0]}><capsuleGeometry args={[0.09, 0.44, 4, 10]} /><meshStandardMaterial color="#253346" /></mesh>)}
  </group>;
}
