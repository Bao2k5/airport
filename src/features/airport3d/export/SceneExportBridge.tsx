import { useEffect, type MutableRefObject } from 'react';
import { useThree } from '@react-three/fiber';
import { exportSceneToGlb } from './exportGlb';

export type SceneExporter = () => Promise<ArrayBuffer>;

/** Exposes the r3f scene to the toolbar (outside the Canvas) as an export callback. */
export default function SceneExportBridge({ exportRef }: { exportRef: MutableRefObject<SceneExporter | null> }) {
  const scene = useThree(state => state.scene);
  useEffect(() => {
    const exporter: SceneExporter = () => exportSceneToGlb(scene);
    exportRef.current = exporter;
    return () => {
      if (exportRef.current === exporter) exportRef.current = null;
    };
  }, [scene, exportRef]);
  return null;
}
