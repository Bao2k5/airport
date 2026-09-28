import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, MeshBasicMaterial, Object3D, SphereGeometry, type InstancedMesh } from 'three';
import type { AirportGraph, SimulationState } from '../../../types';
import { createLightLayout } from './lightLayout';
import { SURFACE_SIZE } from './geometry';
import { useSafeDispose } from '../hooks/useSafeDispose';
import LightGlow from './LightGlow';
import { guidanceColors } from './guidanceColors';

export default function AirportLights({ graph, state, lightScale = 1 }: { graph: AirportGraph; state: SimulationState; lightScale?: number }) {
  const fixtures = useMemo(() => createLightLayout(graph), [graph]);
  const colors = useMemo(() => guidanceColors(fixtures, graph, state), [fixtures, graph, state]);
  const edgeLights = useMemo(() => fixtures.filter(f => f.kind === 'runway' || f.kind === 'taxiway'), [fixtures]);
  const guidanceLights = useMemo(() => fixtures.filter(f => f.kind === 'guidance' || f.kind === 'stop'), [fixtures]);
  const mesh = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => new SphereGeometry(0.08, 8, 6), []);
  const material = useMemo(() => new MeshBasicMaterial({ toneMapped: false }), []);
  useSafeDispose(geometry);
  useSafeDispose(material);
  useLayoutEffect(() => {
    if (!mesh.current) return;
    const helper = new Object3D();
    fixtures.forEach((fixture, index) => {
      helper.position.set(fixture.point.x, SURFACE_SIZE.elevation + 0.025, fixture.point.z);
      helper.scale.set(1, fixture.kind === 'taxiway' ? 0.9 : 0.35, 1);
      helper.updateMatrix(); mesh.current!.setMatrixAt(index, helper.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [fixtures]);
  useLayoutEffect(() => {
    if (!mesh.current) return;
    const color = new Color();
    fixtures.forEach((fixture, index) => mesh.current!.setColorAt(index, color.set(colors.get(fixture.id)!)));
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  }, [fixtures, colors]);
  return <>
    <instancedMesh ref={mesh} args={[geometry, material, fixtures.length]} frustumCulled={false} />
    <LightGlow fixtures={edgeLights} state={state} colors={colors} size={8 * lightScale} />
    <LightGlow fixtures={guidanceLights} state={state} colors={colors} size={14 * lightScale} />
  </>;
}
