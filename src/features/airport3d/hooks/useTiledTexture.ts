import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import { RepeatWrapping, SRGBColorSpace } from 'three';
import { useSafeDispose } from './useSafeDispose';
export function useTiledTexture(url: string, repeatX: number, repeatY: number) {
  const source = useTexture(url);
  const texture = useMemo(() => {
    const texture = source.clone();
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    return texture;
  }, [source, repeatX, repeatY]);
  useSafeDispose(texture);
  return texture;
}

