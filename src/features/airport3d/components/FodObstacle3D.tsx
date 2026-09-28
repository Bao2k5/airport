import { memo, useMemo } from 'react';
import { useGLTF, Center, Html } from '@react-three/drei';

export default memo(function FodObstacle3D({
  position = [-26.4, 0.04, 17.4],
  rotationY = 0.4,
  scale = 0.22,
}: {
  position?: [number, number, number];
  rotationY?: number;
  scale?: number;
}) {
  const { scene } = useGLTF('/models/FOD.glb');

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  return (
    <group position={position}>
      {/* 3D Barrier Obstacle centered at ground level */}
      <group rotation={[0, rotationY, 0]} scale={scale}>
        <Center top position={[0, 0, 0]}>
          <primitive object={clonedScene} />
        </Center>
      </group>

      {/* Flashing Amber/Red Emergency Hazard Beacon on top */}
      <pointLight position={[0, 1.8, 0]} color="#ff3b00" intensity={25} distance={30} decay={2} />

      {/* 3D Warning Tag Label */}
      <Html position={[0, 3.2, 0]} center distanceFactor={28} style={{ pointerEvents: 'none' }}>
        <div className="flex items-center gap-1.5 rounded-lg border border-rose-500 bg-[#25080cee] px-2.5 py-1 font-mono text-[10px] font-bold text-rose-200 shadow-xl select-none whitespace-nowrap">
          <span className="inline-block h-2 w-2 rounded-full bg-rose-500 animate-ping" />
          <span>⚠️ CHƯỚNG NGẠI VẬT FOD (W7A)</span>
        </div>
      </Html>
    </group>
  );
});

useGLTF.preload('/models/FOD.glb');
