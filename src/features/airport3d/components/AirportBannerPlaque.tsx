import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import { SRGBColorSpace } from 'three';

export default function AirportBannerPlaque({
  selected = false,
  editing = false,
}: {
  color?: string;
  selected?: boolean;
  editing?: boolean;
}) {
  const bannerTexture = useTexture('/textures/vaa-banner-sgn.png');

  useMemo(() => {
    bannerTexture.colorSpace = SRGBColorSpace;
    bannerTexture.anisotropy = 8;
    bannerTexture.needsUpdate = true;
  }, [bannerTexture]);

  // Texture aspect ratio is 1024 x 133 (~7.7 : 1)
  const width = 28;
  const depth = 3.64;

  return (
    <group position={[0, 0.035, 0]}>
      {/* Borderless banner graphic face sitting flat on the airport surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial
          map={bannerTexture}
          toneMapped={false}
          transparent={true}
        />
      </mesh>

      {/* Subtle selection highlight shown ONLY during editing when selected */}
      {editing && selected && (
        <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width + 0.1, depth + 0.1]} />
          <meshBasicMaterial color="#28d8ff" wireframe />
        </mesh>
      )}
    </group>
  );
}
