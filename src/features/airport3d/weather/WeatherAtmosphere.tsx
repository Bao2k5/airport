import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, Fog, type AmbientLight, type HemisphereLight } from 'three';
import type { WeatherVisual } from './weatherParams';
import { createLightningScheduler } from './lightning';
import { useReducedMotion } from './useReducedMotion';

/** Nền trời, sương mù cảnh và ánh sáng chính theo thời tiết; Dông bão có thêm tia chớp. */
export default function WeatherAtmosphere({ visual }: { visual: WeatherVisual }) {
  const { scene } = useThree();
  const reducedMotion = useReducedMotion();
  const hemi = useRef<HemisphereLight>(null);
  const ambient = useRef<AmbientLight>(null);
  const lastK = useRef(0);
  const scheduler = useMemo(() => createLightningScheduler(), []);
  const colors = useMemo(() => ({
    background: new Color(visual.background),
    fog: new Color(visual.fogColor),
    flash: new Color(visual.lightning?.flashColor ?? visual.background),
  }), [visual.background, visual.fogColor, visual.lightning?.flashColor]);

  useEffect(() => {
    const previous = scene.environmentIntensity;
    scene.environmentIntensity = visual.env;
    return () => { scene.environmentIntensity = previous; };
  }, [scene, visual.env]);

  useFrame(({ clock }) => {
    const k = visual.lightning && !reducedMotion ? scheduler.sample(clock.elapsedTime) : 0;
    if (k === 0 && lastK.current === 0) return;
    lastK.current = k;
    const boost = visual.lightning;
    if (hemi.current) hemi.current.intensity = visual.hemiIntensity + k * (boost?.boostHemi ?? 0);
    if (ambient.current) ambient.current.intensity = visual.ambient + k * (boost?.boostAmbient ?? 0);
    if (scene.background instanceof Color) scene.background.copy(colors.background).lerp(colors.flash, k * 0.45);
    if (scene.fog instanceof Fog) scene.fog.color.copy(colors.fog).lerp(colors.flash, k * 0.45);
  });

  return (
    <>
      <color attach="background" args={[visual.background]} />
      <fog attach="fog" args={[visual.fogColor, visual.fogNear, visual.fogFar]} />
      <hemisphereLight ref={hemi} args={[visual.hemiSky, visual.hemiGround, visual.hemiIntensity]} />
      <ambientLight ref={ambient} intensity={visual.ambient} />
      <directionalLight position={[-28, 46, 22]} intensity={visual.directional} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-camera-left={-68} shadow-camera-right={105} shadow-camera-top={70} shadow-camera-bottom={-85} shadow-bias={-0.0002} />
    </>
  );
}
