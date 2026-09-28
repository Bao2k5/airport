import { Component, useMemo, type ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';
import { Box3, Group, Mesh, Vector3 } from 'three';
import { MODEL_BASE_URL, type ModelPlacement } from './modelConfig';

/** Isolate one failed asset: the airport and simulation remain usable. */
export class ModelBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { console.error('Airport decorative model failed:', error); }
  render() { return this.state.failed ? null : this.props.children; }
}

export function normalizeModel(source: Group, config: ModelPlacement): Group {
  const root = new Group();
  const model = source.clone(true);
  model.traverse(object => {
    if (object instanceof Mesh) {
      object.visible = !/collider/i.test(object.name);
      object.castShadow = true; object.receiveShadow = true;
    }
  });
  root.add(model);
  root.rotation.y = config.rotationY;
  root.updateMatrixWorld(true);
  const bounds = new Box3().setFromObject(root, true);
  const size = bounds.getSize(new Vector3());
  const center = bounds.getCenter(new Vector3());
  if (bounds.isEmpty() || ![size.x, size.y, size.z].every(Number.isFinite)) throw new Error(`Invalid bounds: ${config.file}`);
  const uniform = config.span / Math.max(size.x, size.z, 0.001);
  // World-axis scaling belongs outside the rotated model.
  const wrapper = new Group(); wrapper.add(root);
  const scale = config.dimensions ? new Vector3(...config.dimensions).divide(size) : new Vector3(uniform, uniform, uniform);
  wrapper.scale.copy(scale);
  wrapper.position.set(-center.x * scale.x, -bounds.min.y * scale.y, -center.z * scale.z);
  wrapper.updateMatrixWorld(true);
  return wrapper;
}

export default function ImportedModel({ config }: { config: ModelPlacement }) {
  const { scene } = useGLTF(MODEL_BASE_URL + config.file);
  const model = useMemo(() => normalizeModel(scene, config), [scene, config]);
  // Geometry/materials/textures belong to useGLTF cache; clones share them.
  return <group position={config.position} dispose={null}><primitive object={model} /></group>;
}
