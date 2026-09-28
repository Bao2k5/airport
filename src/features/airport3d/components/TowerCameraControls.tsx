import { useEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3 } from 'three';
import type { LayoutObject } from '../layout';
import type { SceneMode } from '../viewTypes';

/** Cabin coordinates use the actual tower transform, including saved edits. */
export default function TowerCameraControls({ tower, mode }: {
  tower: LayoutObject;
  mode: Exclude<SceneMode, 'airport'>;
}) {
  const { camera } = useThree();
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const pose = useMemo(() => {
    const world = (x: number, y: number, z: number) => new Vector3(x, y, z)
      .multiplyScalar(tower.scale).applyAxisAngle(new Vector3(0, 1, 0), tower.rotationY)
      .add(new Vector3(...tower.position));
    const x = mode === 'gnd' ? -0.87 : mode === 'twr' ? 0.91 : 0;
    return { eye: world(x, mode === 'room' ? 10.05 : 9.58, mode === 'room' ? 2.35 : 1.3), target: world(x, 9.35, -1.9) };
  }, [tower, mode]);
  useEffect(() => {
    camera.position.copy(pose.eye);
    camera.lookAt(pose.target);
    if (controls.current) { controls.current.target.copy(pose.target); controls.current.update(); }
  }, [camera, pose]);
  return <OrbitControls ref={controls} makeDefault target={pose.target} enableDamping
    minDistance={0.35 * tower.scale} maxDistance={5 * tower.scale}
    maxPolarAngle={Math.PI * 0.88} />;
}
