import { useLayoutEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { AirportGraph, Aircraft } from '../../../types';
import type { CameraPreset } from '../viewTypes';
import type { CameraPose } from '../layout';
import { getCurrentWorldPosition } from '../sceneCoordinates';
export default function AirportCameraControls({ preset, aircraft, graph, onPoseChange, initialPosition, initialTarget, cameraPose }: {
  preset: CameraPreset;
  aircraft: Aircraft | undefined;
  graph: AirportGraph;
  onPoseChange: (pose: CameraPose) => void;
  initialPosition: [number, number, number];
  initialTarget: [number, number, number];
  cameraPose: CameraPose;
}) {
  const { camera } = useThree();
  const controls = useRef<OrbitControlsImpl | null>(null);
  const target = useRef(new Vector3());
  const movement = useRef(new Vector3());
  const requestedPose = useRef({ position: initialPosition, target: initialTarget });
  requestedPose.current = { position: initialPosition, target: initialTarget };
  useLayoutEffect(() => {
    const controlsInstance = controls.current;
    if (!controlsInstance) return;
    const pose = requestedPose.current;
    camera.position.set(...pose.position);
    controlsInstance.target.set(...pose.target);
    controlsInstance.update();
  }, [camera, preset, cameraPose]);
  const follow = preset === 'follow';
  useFrame((_, delta) => {
    if (!follow) return;
    const point = getCurrentWorldPosition(aircraft, graph);
    if (!point) return;
    target.current.set(point[0], point[1] + 0.45, point[2]);
    if (controls.current) {
      // Move the camera and its orbit target together so manual orbit/zoom is preserved.
      movement.current.copy(target.current).sub(controls.current.target).multiplyScalar(1 - Math.exp(-3.5 * delta));
      camera.position.add(movement.current);
      controls.current.target.add(movement.current);
      controls.current.update();
    } else {
      camera.lookAt(target.current);
    }
  });
  const onEnd = () => {
    if (follow) return;
    onPoseChange({
      position: [camera.position.x, camera.position.y, camera.position.z],
      target: controls.current ? [controls.current.target.x, controls.current.target.y, controls.current.target.z] : initialTarget,
    });
  };
  return <OrbitControls ref={controls} makeDefault onEnd={onEnd} enableDamping dampingFactor={0.09} minDistance={4} maxDistance={220} maxPolarAngle={Math.PI / 2.08} />;
}

