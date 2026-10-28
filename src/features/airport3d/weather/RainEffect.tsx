import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferAttribute, BufferGeometry, Color, DoubleSide, ShaderMaterial, Vector2, Vector3, Vector4 } from 'three';
import type { RainVisual } from './weatherParams';
import { useReducedMotion } from './useReducedMotion';
import { useSafeDispose } from '../hooks/useSafeDispose';

export interface RainExclusion { x: number; z: number; radius: number; topY: number }

const BOX = new Vector3(50, 36, 50);
const AHEAD = 12;

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Toàn bộ chuyển động chạy trong vertex shader; mỗi khung hình chỉ cập nhật uniform.
const vertexShader = /* glsl */`
uniform float uTime;
uniform vec3 uCenter;
uniform vec3 uRight;
uniform vec3 uBox;
uniform float uSpeed;
uniform float uLength;
uniform float uWidth;
uniform float uOpacity;
uniform vec2 uWind;
uniform vec4 uExclude;
attribute vec2 aCorner;
varying float vAlpha;
void main() {
  vec3 s = position;
  vec3 origin = uCenter - uBox * 0.5;
  float y = origin.y + mod(s.y * uBox.y - uTime * uSpeed - origin.y, uBox.y);
  vec2 xz = origin.xz + mod(s.xz * uBox.xz - origin.xz, uBox.xz);
  // Gió làm hạt rơi xiên: lệch theo thời gian còn lại đến đáy hộp.
  xz -= uWind * ((y - origin.y) / uSpeed);
  vec3 head = vec3(xz.x, y, xz.y);
  vec3 dir = normalize(vec3(uWind.x, -uSpeed, uWind.y));
  vec3 toCamera = cameraPosition - head;
  vec3 side = cross(dir, toCamera);
  side = length(side) > 1e-4 ? normalize(side) : uRight;
  float d = length(toCamera);
  // Bề ngang gần như cố định theo pixel: hạt sát camera không thành vệt dày.
  float widthScale = clamp(d / 12.0, 0.2, 1.4);
  vec3 p = head - dir * uLength * aCorner.y + side * uWidth * widthScale * aCorner.x;
  float alpha = uOpacity * mix(1.0, 0.15, aCorner.y);
  alpha *= smoothstep(2.0, 5.0, d) * (1.0 - smoothstep(16.0, 25.0, d));
  if (head.y < 0.0) alpha = 0.0;
  if (uExclude.z > 0.0 && distance(head.xz, uExclude.xy) < uExclude.z && head.y < uExclude.w) alpha = 0.0;
  vAlpha = alpha;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}
`;

const fragmentShader = /* glsl */`
uniform vec3 uColor;
varying float vAlpha;
void main() {
  if (vAlpha <= 0.002) discard;
  gl_FragColor = vec4(uColor, vAlpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/** Mưa rơi quanh camera: 1 mesh, 1 draw call. Không xuất GLB, không nhận click. */
export default function RainEffect({ rain, exclusion }: { rain: RainVisual; exclusion?: RainExclusion }) {
  const reducedMotion = useReducedMotion();
  const count = reducedMotion ? Math.round(rain.count * 0.5) : rain.count;

  const geometry = useMemo(() => {
    const random = mulberry32(1337);
    const seeds = new Float32Array(count * 4 * 3);
    const corners = new Float32Array(count * 4 * 2);
    const index = new Uint32Array(count * 6);
    const cornerValues = [-1, 0, 1, 0, 1, 1, -1, 1];
    for (let i = 0; i < count; i++) {
      const sx = random(), sy = random(), sz = random();
      for (let v = 0; v < 4; v++) {
        seeds.set([sx, sy, sz], (i * 4 + v) * 3);
        corners[(i * 4 + v) * 2] = cornerValues[v * 2];
        corners[(i * 4 + v) * 2 + 1] = cornerValues[v * 2 + 1];
      }
      const base = i * 4;
      index.set([base, base + 1, base + 2, base, base + 2, base + 3], i * 6);
    }
    const value = new BufferGeometry();
    value.setAttribute('position', new BufferAttribute(seeds, 3));
    value.setAttribute('aCorner', new BufferAttribute(corners, 2));
    value.setIndex(new BufferAttribute(index, 1));
    return value;
  }, [count]);

  const material = useMemo(() => new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uCenter: { value: new Vector3() },
      uRight: { value: new Vector3(1, 0, 0) },
      uBox: { value: BOX.clone() },
      uSpeed: { value: 30 },
      uLength: { value: 1 },
      uWidth: { value: 0.03 },
      uOpacity: { value: 0.4 },
      uWind: { value: new Vector2() },
      uColor: { value: new Color() },
      uExclude: { value: new Vector4() },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    fog: false,
    // Quad quay theo camera nên chiều winding không cố định: vẽ cả hai mặt.
    side: DoubleSide,
  }), []);

  useSafeDispose(geometry);
  useSafeDispose(material);

  useEffect(() => {
    const u = material.uniforms;
    u.uSpeed.value = rain.speed;
    u.uLength.value = rain.length;
    u.uWidth.value = rain.width;
    u.uOpacity.value = rain.opacity;
    (u.uColor.value as Color).set(rain.color);
    (u.uWind.value as Vector2).set(rain.wind[0], rain.wind[1]);
  }, [material, rain]);

  useEffect(() => {
    (material.uniforms.uExclude.value as Vector4).set(exclusion?.x ?? 0, exclusion?.z ?? 0, exclusion?.radius ?? 0, exclusion?.topY ?? 0);
  }, [material, exclusion?.x, exclusion?.z, exclusion?.radius, exclusion?.topY]);

  const forward = useMemo(() => new Vector3(), []);
  useFrame(({ camera }, delta) => {
    const u = material.uniforms;
    u.uTime.value += Math.min(delta, 0.1) * (reducedMotion ? 0.3 : 1);
    camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1); else forward.normalize();
    (u.uCenter.value as Vector3).copy(camera.position).addScaledVector(forward, AHEAD);
    const right = (u.uRight.value as Vector3).setFromMatrixColumn(camera.matrixWorld, 0);
    right.y = 0;
    if (right.lengthSq() < 1e-6) right.set(1, 0, 0); else right.normalize();
  });

  return <mesh name="WeatherRain" geometry={geometry} material={material} frustumCulled={false} renderOrder={5} userData={{ noExport: true }} raycast={() => null} />;
}
