import type { Object3D } from 'three';
import { prepareExportScene } from './prepareExportScene';

export const GLB_FILENAME = 'san-bay-sgn-3d.glb';

/** Serialises the whole displayed airport scene into one binary glTF (.glb). */
export async function exportSceneToGlb(scene: Object3D): Promise<ArrayBuffer> {
  scene.updateMatrixWorld(true);
  const { root, dispose } = prepareExportScene(scene);
  try {
    // Loaded on demand so the exporter stays out of the main 3D chunk.
    const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
    const result = await new GLTFExporter().parseAsync(root, { binary: true, onlyVisible: true, trs: true, maxTextureSize: 4096 });
    if (!(result instanceof ArrayBuffer)) throw new Error('GLTFExporter did not return binary data');
    return result;
  } finally {
    dispose();
  }
}

export function downloadGlb(buffer: ArrayBuffer, filename = GLB_FILENAME) {
  const url = URL.createObjectURL(new Blob([buffer], { type: 'model/gltf-binary' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Large blobs: keep the URL alive briefly so the download can start.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
