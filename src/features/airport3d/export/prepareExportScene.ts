import {
  BufferGeometry,
  Color,
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  Scene,
  type InstancedMesh,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Builds an export-only copy of the live r3f scene for GLTFExporter.
 * The live scene is never mutated: nodes are shallow-cloned and share geometry,
 * materials and textures with the originals. Only objects created here
 * (baked instance geometry, converted materials) are disposed afterwards.
 */
export function prepareExportScene(source: Object3D): { root: Scene; dispose: () => void } {
  const root = new Scene();
  root.name = 'SanBay_SGN_3D';
  const createdGeometries: BufferGeometry[] = [];
  const createdMaterials: Material[] = [];
  const materialCache = new Map<Material, Material>();

  const convertMaterial = (material: Material): Material => {
    const cached = materialCache.get(material);
    if (cached) return cached;
    let result = material;
    const m = material as Material & {
      isMeshStandardMaterial?: boolean;
      isMeshBasicMaterial?: boolean;
      color?: Color;
      map?: unknown;
      emissive?: Color;
      emissiveMap?: unknown;
      emissiveIntensity?: number;
      uniforms?: Record<string, { value?: unknown }>;
    };
    if (m.isMeshStandardMaterial || m.isMeshBasicMaterial) {
      // Cutout surfaces (pavement) export as alphaMode MASK instead of BLEND,
      // which avoids transparency sorting artifacts in viewers and Blender.
      if (material.transparent && material.alphaTest > 0 && material.opacity === 1) {
        result = material.clone();
        result.transparent = false;
        createdMaterials.push(result);
      }
    } else {
      // Safety net for materials glTF cannot express (Lambert/Phong/Shader...).
      const uniformColor = m.uniforms?.diffuse?.value ?? m.uniforms?.color?.value;
      const standard = new MeshStandardMaterial({
        name: material.name,
        color: m.color instanceof Color ? m.color : uniformColor instanceof Color ? uniformColor : new Color('#ffffff'),
        opacity: material.opacity,
        transparent: material.transparent,
        alphaTest: material.alphaTest,
        side: material.side,
        vertexColors: material.vertexColors,
      });
      if (m.map) standard.map = m.map as MeshStandardMaterial['map'];
      if (m.emissive instanceof Color) standard.emissive.copy(m.emissive);
      if (m.emissiveMap) standard.emissiveMap = m.emissiveMap as MeshStandardMaterial['emissiveMap'];
      if (typeof m.emissiveIntensity === 'number') standard.emissiveIntensity = m.emissiveIntensity;
      result = standard;
      createdMaterials.push(result);
    }
    materialCache.set(material, result);
    return result;
  };

  const isExcluded = (object: Object3D): boolean => {
    const flags = object as Object3D & Record<string, unknown>;
    if (object.userData?.noExport === true || !object.visible) return true;
    if (flags.isCamera || flags.isLight || flags.isPoints || flags.isLine || flags.isSprite) return true;
    if (flags.isTransformControlsRoot || flags.isTransformControlsGizmo || flags.isTransformControlsPlane) return true;
    if (object.type.endsWith('Helper')) return true;
    if ((object as Mesh).isMesh) {
      const materials = ([] as Material[]).concat((object as Mesh).material);
      if (materials.some(material => (material as Material & { wireframe?: boolean }).wireframe === true)) return true;
    }
    return false;
  };

  const copyTransform = (from: Object3D, to: Object3D) => {
    to.name = from.name;
    if (from.matrixAutoUpdate) {
      to.position.copy(from.position);
      to.quaternion.copy(from.quaternion);
      to.scale.copy(from.scale);
    } else {
      from.matrix.decompose(to.position, to.quaternion, to.scale);
    }
  };

  // InstancedMesh -> one merged Mesh per instance colour (unlit), so every
  // viewer shows the fixtures with their exact colours without extensions.
  const bakeInstances = (instanced: InstancedMesh): Object3D => {
    const group = new Group();
    copyTransform(instanced, group);
    const baseMaterial = ([] as Material[]).concat(instanced.material)[0] as Material & { color?: Color };
    const baseColor = baseMaterial?.color instanceof Color ? baseMaterial.color : new Color('#ffffff');
    const byColor = new Map<string, BufferGeometry[]>();
    const color = new Color();
    const matrix = instanced.matrix.clone();
    for (let index = 0; index < instanced.count; index++) {
      if (instanced.instanceColor) instanced.getColorAt(index, color); else color.setRGB(1, 1, 1);
      color.multiply(baseColor);
      const hex = color.getHexString();
      instanced.getMatrixAt(index, matrix);
      const geometry = instanced.geometry.clone().applyMatrix4(matrix);
      const list = byColor.get(hex) ?? [];
      list.push(geometry);
      byColor.set(hex, list);
    }
    const baseName = instanced.name || 'Instances';
    for (const [hex, geometries] of byColor) {
      const material = new MeshBasicMaterial({ color: `#${hex}`, name: `${baseName}_${hex}` });
      createdMaterials.push(material);
      const merged = mergeGeometries(geometries, false);
      if (merged) {
        geometries.forEach(geometry => geometry.dispose());
        createdGeometries.push(merged);
        const mesh = new Mesh(merged, material);
        mesh.name = `${baseName}_${hex}`;
        group.add(mesh);
      } else {
        console.warn('[GLB export] mergeGeometries failed, exporting instances individually');
        geometries.forEach((geometry, index) => {
          createdGeometries.push(geometry);
          const mesh = new Mesh(geometry, material);
          mesh.name = `${baseName}_${hex}_${index}`;
          group.add(mesh);
        });
      }
    }
    return group;
  };

  const copyChildren = (from: Object3D, to: Object3D) => {
    for (const child of from.children) {
      if (isExcluded(child)) continue;
      let copy: Object3D;
      if ((child as InstancedMesh).isInstancedMesh) {
        copy = bakeInstances(child as InstancedMesh);
      } else {
        copy = child.clone(false);
        copyTransform(child, copy);
        if ((copy as Mesh).isMesh) {
          const mesh = copy as Mesh;
          mesh.material = Array.isArray(mesh.material) ? mesh.material.map(convertMaterial) : convertMaterial(mesh.material);
        }
        copyChildren(child, copy);
      }
      to.add(copy);
    }
  };

  // Drop empty branches (e.g. groups left behind by drei <Html> labels).
  const prune = (object: Object3D): boolean => {
    for (const child of [...object.children]) {
      if (!prune(child)) object.remove(child);
    }
    return (object as Mesh).isMesh === true || object.children.length > 0;
  };

  copyChildren(source, root);
  prune(root);

  return {
    root,
    dispose: () => {
      createdGeometries.forEach(geometry => geometry.dispose());
      createdMaterials.forEach(material => material.dispose());
    },
  };
}
