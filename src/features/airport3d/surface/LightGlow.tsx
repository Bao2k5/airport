import { useLayoutEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferGeometry, CanvasTexture, Color, Float32BufferAttribute, NormalBlending, PointsMaterial } from 'three';
import type { SimulationState } from '../../../types';
import { AIRPORT_VISUAL } from '../visualTokens';
import { useSafeDispose } from '../hooks/useSafeDispose';
import { fixtureColor, type Fixture } from './lightLayout';
import { SURFACE_SIZE } from './geometry';

// Dual-layer light rendering:
// 1. Core (NormalBlending): Sharp, saturated pinpoint center.
// 2. Halo (AdditiveBlending): Subtle, soft radiant halo that avoids blurring or glaring when viewed from afar.
export default function LightGlow({ fixtures, state, size, colors: resolvedColors }: { fixtures: Fixture[]; state: SimulationState; size: number; colors?: Map<string, string> }) {
  // Sharp, clean LED/halogen core with tight anti-aliased perimeter
  // High-luminance crisp core with solid center
  const coreTexture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const glow = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    glow.addColorStop(0, 'rgba(255, 255, 255, 1)');
    glow.addColorStop(0.65, 'rgba(255, 255, 255, 1)');
    glow.addColorStop(0.85, 'rgba(255, 255, 255, 0.65)');
    glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, 64, 64);
    return new CanvasTexture(canvas);
  }, []);

  // Luminous yet controlled halo radiating bright light without blurry overlap
  const haloTexture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const glow = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    glow.addColorStop(0, 'rgba(255, 255, 255, 0.75)');
    glow.addColorStop(0.35, 'rgba(255, 255, 255, 0.40)');
    glow.addColorStop(0.7, 'rgba(255, 255, 255, 0.12)');
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

  const baseCoreSize = Math.max(3.2, size * 0.95);
  const baseHaloSize = Math.max(4.5, size * 1.5);

  const coreMaterial = useMemo(() => new PointsMaterial({
    map: coreTexture,
    size: baseCoreSize,
    sizeAttenuation: false,
    vertexColors: true,
    transparent: true,
    blending: NormalBlending,
    depthWrite: false,
    toneMapped: false,
  }), [coreTexture, baseCoreSize]);

  const haloMaterial = useMemo(() => new PointsMaterial({
    map: haloTexture,
    size: baseHaloSize,
    sizeAttenuation: false,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  }), [haloTexture, baseHaloSize]);

  // Dynamic distance-adaptive light sizing: scales gracefully at far zoom (overview)
  // keeping lights visibly bright, sparkling and clear without blurring.
  useFrame(({ camera }) => {
    const dist = camera.position.length();
    // Reference distance = 45. At overview (dist ~120), factor is ~0.75
    const factor = Math.min(1.15, Math.max(0.72, Math.sqrt(45 / Math.max(dist, 10))));
    const targetCore = Math.max(2.4, baseCoreSize * factor);
    const targetHalo = Math.max(3.5, baseHaloSize * factor);
    if (Math.abs(coreMaterial.size - targetCore) > 0.05) {
      coreMaterial.size = targetCore;
    }
    if (Math.abs(haloMaterial.size - targetHalo) > 0.05) {
      haloMaterial.size = targetHalo;
    }
  });

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
      const lit = fixture.kind === 'runway' ||
                  fixture.kind === 'taxiway' ||
                  fixture.kind === 'runway_end' ||
                  fixture.kind === 'runway_centerline' ||
                  value === AIRPORT_VISUAL.ftgCenterline ||
                  value === AIRPORT_VISUAL.stopBar;
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
