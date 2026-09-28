import { memo, useMemo } from 'react';
import type { AirportGraph } from '../../../types';
import type { AirportLayout } from '../layout';
import { useTiledTexture } from '../hooks/useTiledTexture';
import { getFoundationBounds } from '../surface/foundationBounds';

/** One continuous concrete surface and one square structural slab underneath. */
export default memo(function UnifiedAirportGround({ graph, layout }: { graph: AirportGraph; layout: AirportLayout }) {
  const bounds = useMemo(() => getFoundationBounds(graph, layout), [graph, layout]);
  // Same texture, tint, roughness and six-world-unit tile scale as the terminal pad.
  const concrete = useTiledTexture('/textures/concrete-albedo.jpg', bounds.side / 6, bounds.side / 6);
  return <group position={bounds.center}>
    {/* Extended horizon ground to prevent sharp edge when looking diagonally */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.38, 0]} receiveShadow>
      <planeGeometry args={[1200, 1200]} />
      <meshStandardMaterial color="#a6aaad" roughness={0.95} />
    </mesh>
    <mesh position={[0, -0.40, 0]} receiveShadow castShadow>
      <boxGeometry args={[bounds.side, 0.76, bounds.side]} />
      <meshStandardMaterial color="#73797e" roughness={0.85} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[bounds.side, bounds.side]} />
      <meshStandardMaterial map={concrete} color="#adb1b2" roughness={0.9} />
    </mesh>
  </group>;
});
