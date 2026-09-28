import { useMemo } from 'react';
import { Html, useGLTF } from '@react-three/drei';
import { Mesh, MeshStandardMaterial } from 'three';
import { getAirlineDef } from '../../../data/airlineTypes';
import { useSafeDispose } from '../hooks/useSafeDispose';
import type { Aircraft, AirportGraph } from '../../../types';
import { getAircraftWorldPose } from '../sceneCoordinates';
function AircraftAsset({ color }: { color: string }) {
  const { scene } = useGLTF('/models/Aircraft_A321_Illustrative.glb');
  const livery = useMemo(() => new MeshStandardMaterial({ color, metalness: 0.22, roughness: 0.38 }), [color]);
  useSafeDispose(livery);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse(object => {
      if (object instanceof Mesh) {
        const replace = (material: MeshStandardMaterial) => /Deep teal|Warm gold/.test(material.name) ? livery : material;
        object.material = Array.isArray(object.material) ? object.material.map(replace) : replace(object.material);
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    return clone;
  }, [scene, livery]);
  return <primitive object={model} scale={0.08} />;
}

export default function AircraftModel({ aircraft, graph, selected, onSelect, showLabel = true }: {
  aircraft: Aircraft;
  graph: AirportGraph;
  selected: boolean;
  onSelect?: (aircraftId: string) => void;
  showLabel?: boolean;
}) {
  const color = getAirlineDef(aircraft.airlineCode ?? aircraft.callsign).accentColor;
  const pose = getAircraftWorldPose(aircraft, graph);
  if (!pose || aircraft.hidden || aircraft.status === 'departed') return null;
  const { position, yaw, pitch } = pose;

  return (
    <group position={[position[0], position[1] + 0.04, position[2]]} rotation={[0, yaw, 0]} onClick={onSelect ? (event) => { event.stopPropagation(); onSelect(aircraft.id); } : undefined}>
      <group rotation={[pitch, 0, 0]}><AircraftAsset color={color} /></group>
      {selected && <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[1.7, 1.82, 48]} /><meshBasicMaterial color="#ffd166" transparent opacity={0.82} />
      </mesh>}
      {showLabel && <Html position={[0, 1.45, 0]} center distanceFactor={13} style={{ pointerEvents: onSelect ? 'auto' : 'none' }}>
        <div style={{ borderLeft: `3px solid ${color}` }} className={`whitespace-nowrap rounded px-1.5 py-0.5 font-mono text-[9px] font-bold shadow ${selected ? 'bg-amber-300 text-slate-950' : 'bg-[#07111aee] text-white'}`}>{aircraft.callsign}</div>
      </Html>}
    </group>
  );
}

