import { useLayoutEffect, useMemo } from 'react';
import { AdditiveBlending, BufferGeometry, CanvasTexture, Color, Float32BufferAttribute, NormalBlending, PointsMaterial } from 'three';
import type { SimulationState } from '../../../types';
import { AIRPORT_VISUAL } from '../visualTokens';
import { useSafeDispose } from '../hooks/useSafeDispose';
import { fixtureColor, type Fixture } from './lightLayout';
import { SURFACE_SIZE } from './geometry';

// Dual-layer light rendering:
// 1. Core (NormalBlending): Solid, saturated center that prevents daytime gray pavement from washing out the color into pale pastel.
// 2. Halo (AdditiveBlending): Luminous outer bloom radiating into the surroundings.
export default function LightGlow({ fixtures, state, size, colors: resolvedColors }: { fixtures: Fixture[]; state: SimulationState; size: number; colors?: Map<string, string> }) {
  // Saturated, high-density core texture with smooth anti-aliased edge
  const coreTexture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const glow = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    glow.addColorStop(0, 'rgba(255, 255, 255, 1)');
    glow.addColorStop(0.45, 'rgba(255, 255, 255, 1)');
    glow.addColorStop(0.75, 'rgba(255, 255, 255, 0.7)');
    glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, 64, 64);
    return new CanvasTexture(canvas);
  }, []);

  // Soft radiant halo texture spreading light outward
  const haloTexture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const glow = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    glow.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    glow.addColorStop(0.3, 'rgba(255, 255, 255, 0.55)');
    glow.addColorStop(0.65, 'rgba(255, 255, 255, 0.18)');
    glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, 64, 64);
    return new CanvasTexture(canvas);
  }, []);

  const geometry = useMemo(() => {
    const value = new BufferGeometry();
    const pos = new Float32Array(fixtures.length * 3);
    fixtures.forEach((f, i) => {
      pos[i * 3] = f.point.x;
      pos[i * 3 + 1] = -9999;
      pos[i * 3 + 2] = f.point.z;
    });
    value.setAttribute('position', new Float32BufferAttribute(pos, 3));
    value.setAttribute('color', new Float32BufferAttribute(new Float32Array(fixtures.length * 3), 3));
    return value;
  }, [fixtures]);

  const coreMaterial = useMemo(() => new PointsMaterial({
    map: coreTexture,
    size: Math.max(4, Math.round(size * 0.85)),
    sizeAttenuation: false,
    vertexColors: true,
    transparent: true,
    blending: NormalBlending,
    depthWrite: false,
    toneMapped: false,
  }), [coreTexture, size]);

  const haloMaterial = useMemo(() => new PointsMaterial({
    map: haloTexture,
    size: Math.max(7, Math.round(size * 1.8)),
    sizeAttenuation: false,
    vertexColors: true,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  }), [haloTexture, size]);

  useSafeDispose(coreTexture);
  useSafeDispose(haloTexture);
  useSafeDispose(geometry);
  useSafeDispose(coreMaterial);
  useSafeDispose(haloMaterial);

  useLayoutEffect(() => {
    const positions = geometry.getAttribute('position');
    const colors = geometry.getAttribute('color');
    const color = new Color();
    fixtures.forEach((fixture, index) => {
      const value = resolvedColors?.get(fixture.id) ?? fixtureColor(fixture, state);
      const lit = fixture.kind === 'runway' || fixture.kind === 'taxiway' || value === AIRPORT_VISUAL.ftgCenterline || value === AIRPORT_VISUAL.stopBar;
      if (lit) {
        positions.setXYZ(index, fixture.point.x, SURFACE_SIZE.elevation + 0.09, fixture.point.z);
        color.set(value);
        colors.setXYZ(index, color.r, color.g, color.b);
      } else {
        positions.setXYZ(index, fixture.point.x, -9999, fixture.point.z);
        colors.setXYZ(index, 0, 0, 0);
      }
    });
    positions.needsUpdate = true;
    colors.needsUpdate = true;
  }, [fixtures, state.lightStates, state.blockedEdgeIds, geometry, resolvedColors]);

  return (
    <>
      <points geometry={geometry} material={haloMaterial} frustumCulled={false} renderOrder={2} />
      <points geometry={geometry} material={coreMaterial} frustumCulled={false} renderOrder={3} />
    </>
  );
}
