import { Suspense } from 'react';
import { Html } from '@react-three/drei';
import { DECORATIVE_MODELS } from './modelConfig';
import ImportedModel, { ModelBoundary } from './ImportedModel';
import BoardingConnections from './BoardingConnections';
import { ServiceVehicle } from '../components/GroundEquipment';

export default function DecorativeTerminal({
  detailed = true,
  editing = false,
  selected = false,
}: {
  detailed?: boolean;
  editing?: boolean;
  selected?: boolean;
}) {
  return (
    <group position={[0, 0.05, 0]}>
      {DECORATIVE_MODELS.filter(c => detailed || !c.detailOnly).map(config => (
        <ModelBoundary key={config.id}>
          <Suspense fallback={null}>
            <ImportedModel config={config} />
          </Suspense>
        </ModelBoundary>
      ))}
      <BoardingConnections detailed={detailed} />
      <group position={[-2.7, 0, 5.1]} scale={0.7}><ServiceVehicle kind={1} /></group>
      {editing && (
        <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[13.5, 14.5, 64]} />
          <meshBasicMaterial color={selected ? '#28d8ff' : '#e6b85c'} side={2} />
        </mesh>
      )}
      <Html position={[0, 0.1, 11.5]} center distanceFactor={30} style={{ pointerEvents: 'none' }}>
        <span className="whitespace-nowrap rounded bg-[#102849] px-3 py-1 text-xs text-white">
          Khu nhà ga trưng bày · Có thể chỉnh bố cục
        </span>
      </Html>
    </group>
  );
}
