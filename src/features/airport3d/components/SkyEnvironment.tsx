import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { CanvasTexture, EquirectangularReflectionMapping, SRGBColorSpace } from 'three';
import { useSafeDispose } from '../hooks/useSafeDispose';

/** Local environment map: no remote HDR download or network dependency. */
export default function SkyEnvironment({ night }: { night: boolean }) {
  const { scene } = useThree();
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, night ? '#142137' : '#9ea4a8');
    gradient.addColorStop(0.48, night ? '#52677e' : '#d5d9dc');
    gradient.addColorStop(0.55, '#757c80'); gradient.addColorStop(1, '#34383c');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = night ? '#b6c4d3' : '#fafafa'; ctx.beginPath(); ctx.arc(110, 70, night ? 3 : 12, 0, Math.PI * 2); ctx.fill();
    const map = new CanvasTexture(canvas); map.mapping = EquirectangularReflectionMapping; map.colorSpace = SRGBColorSpace; return map;
  }, [night]);
  useSafeDispose(texture);
  useEffect(() => {
    const previous = scene.environment; scene.environment = texture;
    return () => { scene.environment = previous; };
  }, [scene, texture]);
  return null;
}
