import { memo, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { CanvasTexture, SRGBColorSpace } from 'three';
import type { AirportGraph } from '../../../types';
import { paintSurface } from './paintSurface';
import { SURFACE_SIZE } from './geometry';
import { useSafeDispose } from '../hooks/useSafeDispose';

export default memo(function AirportPavement({ graph }: { graph: AirportGraph }) {
  const gl = useThree(state => state.gl);
  const texture = useMemo(() => {
    const resolution = Math.min(gl.capabilities.maxTextureSize, window.innerWidth < 900 ? 2048 : 4096);
    const value = new CanvasTexture(paintSurface(graph, resolution));
    value.colorSpace = SRGBColorSpace;
    value.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    return value;
  }, [graph, gl]);
  useSafeDispose(texture);
  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, SURFACE_SIZE.elevation, 0]} receiveShadow>
    <planeGeometry args={[SURFACE_SIZE.width, SURFACE_SIZE.depth]} />
    <meshStandardMaterial map={texture} transparent alphaTest={0.05} roughness={0.92} metalness={0} />
  </mesh>;
});
