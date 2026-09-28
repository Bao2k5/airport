import { DECORATIVE_MODELS } from './modelConfig';

/** Short accordion collars connect the jetway cabins to the port entry, aft of the cockpit. */
export default function BoardingConnections({ detailed }: { detailed: boolean }) {
  return <>{DECORATIVE_MODELS.filter(model => model.id.startsWith('aircraft-') && (detailed || !model.detailOnly)).map(model =>
    <group key={model.id} position={[model.position[0] - 0.4, 0.86, 4.13]}>
      {[-0.21, 0.21].map(z => <mesh key={`wall-${z}`} position={[0, 0, z]} castShadow><boxGeometry args={[0.48, 0.6, 0.035]} /><meshStandardMaterial color="#30383d" roughness={0.9} /></mesh>)}
      {[-0.3, 0.3].map(y => <mesh key={`deck-${y}`} position={[0, y, 0]} castShadow><boxGeometry args={[0.48, 0.035, 0.45]} /><meshStandardMaterial color="#737e86" metalness={0.3} roughness={0.65} /></mesh>)}
      {[-0.18, -0.08, 0.02, 0.12, 0.22].map(x => <group key={x} position={[x, 0, 0]}>
        {[-0.23, 0.23].map(z => <mesh key={z} position={[0, 0, z]}><boxGeometry args={[0.022, 0.66, 0.018]} /><meshStandardMaterial color="#171c20" roughness={0.95} /></mesh>)}
        <mesh position={[0, 0.33, 0]}><boxGeometry args={[0.022, 0.018, 0.48]} /><meshStandardMaterial color="#171c20" roughness={0.95} /></mesh>
      </group>)}
    </group>
  )}</>;
}
