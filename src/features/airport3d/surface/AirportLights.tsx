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
  const taxiwayEdgeLights = useMemo(() => fixtures.filter(f => f.kind === 'taxiway'), [fixtures]);
  const runwayEdgeLights = useMemo(() => fixtures.filter(f => f.kind === 'runway'), [fixtures]);
  const guidanceLights = useMemo(() => fixtures.filter(f => f.kind === 'guidance'), [fixtures]);
  const stopBarLights = useMemo(() => fixtures.filter(f => f.kind === 'stop'), [fixtures]);
  const runwayEndLights = useMemo(() => fixtures.filter(f => f.kind === 'runway_end'), [fixtures]);
  const runwayCenterlineLights = useMemo(() => fixtures.filter(f => f.kind === 'runway_centerline'), [fixtures]);
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
      helper.scale.set(
        fixture.kind === 'stop' || fixture.kind === 'runway_end' ? 1.15 : 0.9,
        fixture.kind === 'taxiway' ? 0.7 : fixture.kind === 'stop' || fixture.kind === 'runway_end' ? 0.55 : 0.32,
        fixture.kind === 'stop' || fixture.kind === 'runway_end' ? 1.15 : 0.9
      );
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
    {/* 1. Stop Bar Đỏ: Ưu tiên cao nhất, nổi bật và rực rỡ từ Đài KSVKL */}
    <LightGlow fixtures={stopBarLights} state={state} colors={colors} size={12.5 * lightScale} />
    {/* 2. Runway End Đỏ (ICAO): 5 bóng đỏ ngang tim đường băng báo hiệu giới hạn dừng tuyệt đối */}
    <LightGlow fixtures={runwayEndLights} state={state} colors={colors} size={11 * lightScale} />
    {/* 3. Taxiway Centerline FTG Xanh lá: Dải dẫn đường thông minh sắc nét trước mũi tàu */}
    <LightGlow fixtures={guidanceLights} state={state} colors={colors} size={9.5 * lightScale} />
    {/* 4. Runway Centerline (ICAO): Trắng dọc thân, đỏ/trắng ở 2 đầu */}
    <LightGlow fixtures={runwayCenterlineLights} state={state} colors={colors} size={7.2 * lightScale} />
    {/* 5. Runway Edge: Trắng và Vàng cảnh báo ở 600m cuối */}
    <LightGlow fixtures={runwayEdgeLights} state={state} colors={colors} size={6.2 * lightScale} />
    {/* 6. Taxiway Edge Xanh dương: Dịu mắt định hình mép đường lăn */}
    <LightGlow fixtures={taxiwayEdgeLights} state={state} colors={colors} size={4.8 * lightScale} />
  </>;
}
