import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import { SRGBColorSpace } from 'three';
import { HIDE_SCHOOL_BRANDING } from '../../../config/branding';

export default function AirportBannerPlaque({
  selected = false,
  editing = false,
}: {
  color?: string;
  selected?: boolean;
  editing?: boolean;
}) {
  // Ẩn logo trường (Euréka 2026): dùng banner không logo (public/sgn-banner.png).
  // Khi bật lại nhận diện trường thì quay về banner gốc có logo VAA.
  const bannerTexture = useTexture(
    HIDE_SCHOOL_BRANDING ? '/sgn-banner.png' : '/textures/vaa-banner-sgn.png',
  );

  useMemo(() => {
    bannerTexture.colorSpace = SRGBColorSpace;
    bannerTexture.anisotropy = 8;
    bannerTexture.needsUpdate = true;
  }, [bannerTexture]);

  // Cả hai texture đều có tỉ lệ ~7.7 : 1 (1024x133 và 1916x247)
  const width = 28;
  const depth = 3.64;

  return (
    <group position={[0, 0.035, 0]}>
      {/* Borderless banner graphic face sitting flat on the airport surface */}
      <mesh name="BannerFace" rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial
          map={bannerTexture}
          toneMapped={false}
          transparent={true}
        />
      </mesh>

      {/* Subtle selection highlight shown ONLY during editing when selected */}
      {editing && selected && (
        <mesh userData={{ noExport: true }} position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width + 0.1, depth + 0.1]} />
          <meshBasicMaterial color="#28d8ff" wireframe />
        </mesh>
      )}
    </group>
  );
}
