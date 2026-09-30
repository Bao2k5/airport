import { useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { AnimationMixer, Mesh, Object3D } from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

/**
 * Component hiệu ứng lửa cháy cho sự cố động cơ máy bay.
 * Nguồn: /public/models/fire_animation (1).glb
 *
 * File GLB gốc thường đi kèm vài mesh không liên quan (ví dụ ghế dùng để
 * dựng cảnh preview). Component này log toàn bộ tên node ra console khi
 * model được load, để dễ xác định chính xác tên mesh cần loại bỏ mỗi khi
 * đổi sang một file GLB khác.
 *
 * Cách loại bỏ mesh không mong muốn:
 *  - Thêm từ khóa (không phân biệt hoa/thường) vào REMOVE_KEYWORDS bên dưới.
 *  - Mở Console (F12) để xem log "[FireEffect] node:" và xác nhận tên chính xác.
 */

// Từ khóa nhận diện mesh KHÔNG liên quan tới lửa (ghế, đồ vật preview...).
// Thêm/xóa từ khóa tại đây khi đổi file GLB.
const REMOVE_KEYWORDS = ['chair', 'seat', 'sessel', 'stuhl', 'sofa', 'bench'];

function isUnwanted(name: string): boolean {
    const lower = name.toLowerCase();
    return REMOVE_KEYWORDS.some(keyword => lower.includes(keyword));
}

export default function FireEffect({
    position = [0, 0, 0],
    scale = 1,
    rotation = [0, 0, 0],
}: {
    position?: [number, number, number];
    scale?: number;
    rotation?: [number, number, number];
}) {
    const { scene, animations } = useGLTF('/models/fire_animation (1).glb');

    const fireModel = useMemo(() => {
        // SkeletonUtils.clone (thay vì Object3D.clone) giữ đúng tham chiếu
        // node cần cho AnimationMixer bind track chính xác — nếu dùng
        // scene.clone(true) thông thường, animation clip sẽ không tìm được
        // đúng object để chạy và lửa sẽ "đứng hình" như đang thấy.
        const clone = SkeletonUtils.clone(scene) as typeof scene;
        const toRemove: Object3D[] = [];

        clone.traverse(object => {
            if (object instanceof Mesh && isUnwanted(object.name)) toRemove.push(object);
        });
        toRemove.forEach(obj => obj.removeFromParent());

        return clone;
    }, [scene]);

    // Animation lửa (clip "Take 001": 17 ngọn lửa bật/tắt theo scale, lặp 1.375s).
    // Mixer phải được tạo VÀ play bên trong effect. Nếu tạo trong useMemo rồi
    // dừng ở cleanup, React StrictMode (dev) chạy cleanup giả một lần sau khi
    // mount -> stopAllAction() nhưng useMemo không tạo lại -> lửa đứng im.
    const mixerRef = useRef<AnimationMixer | null>(null);
    useEffect(() => {
        if (!animations.length) return;
        const mixer = new AnimationMixer(fireModel);
        animations.forEach(clip => mixer.clipAction(clip).reset().play());
        mixerRef.current = mixer;
        return () => {
            mixer.stopAllAction();
            mixer.uncacheRoot(fireModel);
            if (mixerRef.current === mixer) mixerRef.current = null;
        };
    }, [fireModel, animations]);
    useFrame((_, delta) => mixerRef.current?.update(delta));

    return (
        <group position={position} rotation={rotation}>
            <primitive object={fireModel} scale={scale} />
        </group>
    );
}
