import type { AirportGraph, AirportNode } from '../../types';
import { getAssetZone } from './assets/assetPlacement';

export const LAYOUT_STORAGE_KEY = 'tsn-airport-3d-layout-v8';
export const LAYOUT_VERSION = 8;

export interface LayoutObject {
  id: string;
  name: string;
  kind: 'tower' | 'mast' | 'terminal' | 'hangar' | 'vehicle' | 'equipment';
  position: [number, number, number];
  rotationY: number;
  scale: number;
  color: string;
}

export type AirportLayout = LayoutObject[];

export interface CameraPose {
  position: [number, number, number];
  target: [number, number, number];
}

export function validateCameraPose(value: unknown): CameraPose | null {
  if (!value || typeof value !== 'object') return null;
  const pose = value as { position?: unknown; target?: unknown };
  if (!Array.isArray(pose.position) || pose.position.length !== 3 || !Array.isArray(pose.target) || pose.target.length !== 3) return null;
  if (![...pose.position, ...pose.target].every(item => typeof item === 'number' && Number.isFinite(item))) return null;
  if (pose.position.some(item => Math.abs(item as number) > 160) || pose.target.some(item => Math.abs(item as number) > 120)) return null;
  return {
    position: pose.position as [number, number, number],
    target: pose.target as [number, number, number],
  };
}

const toWorld = (node: AirportNode): [number, number, number] => [
  (node.x - 600) * 0.075,
  0,
  (node.y - 430) * 0.075,
];

export function createDefaultLayout(graph: AirportGraph): AirportLayout {
  const stands = graph.nodes.filter(node => /^STAND[_ -]?\d+/i.test(node.label));
  const anchorNodes = stands.length ? stands : graph.nodes.filter(node => node.type === 'apron');
  const anchor = anchorNodes.length
    ? anchorNodes.reduce((sum, node) => {
        const p = toWorld(node);
        return [sum[0] + p[0] / anchorNodes.length, 0, sum[2] + p[2] / anchorNodes.length] as [number, number, number];
      }, [0, 0, 0] as [number, number, number])
    : [24, 0, 13] as [number, number, number];

  const zone = getAssetZone(graph);

  return [
    { id: 'tower', name: 'Đài kiểm soát không lưu', kind: 'tower', position: [9.5, 0, 1.0], rotationY: 0, scale: 1, color: '#9eaeb9' },
    { id: 'terminal_zone', name: 'Khu nhà ga & Ống lồng', kind: 'terminal', position: [Number(zone[0].toFixed(1)), 0, Number(zone[2].toFixed(1))], rotationY: 0, scale: 1, color: '#303c43' },
    { id: 'apron_light_1', name: 'Đèn sân đỗ 1', kind: 'mast', position: [anchor[0] - 8, 0, anchor[2] - 6], rotationY: 0, scale: 1, color: '#fff0bf' },
    { id: 'apron_light_2', name: 'Đèn sân đỗ 2', kind: 'mast', position: [anchor[0] + 6, 0, anchor[2] - 6], rotationY: 0, scale: 1, color: '#fff0bf' },
    { id: 'apron_light_3', name: 'Đèn sân đỗ 3', kind: 'mast', position: [anchor[0] - 8, 0, anchor[2] + 4], rotationY: 0, scale: 1, color: '#fff0bf' },
    { id: 'apron_light_4', name: 'Đèn sân đỗ 4', kind: 'mast', position: [anchor[0] + 6, 0, anchor[2] + 4], rotationY: 0, scale: 1, color: '#fff0bf' },
    { id: 'apron_light_5', name: 'Đèn sân đỗ 5', kind: 'mast', position: [anchor[0] - 8, 0, anchor[2] + 14], rotationY: 0, scale: 1, color: '#fff0bf' },
    { id: 'apron_light_6', name: 'Đèn sân đỗ 6', kind: 'mast', position: [anchor[0] + 6, 0, anchor[2] + 14], rotationY: 0, scale: 1, color: '#fff0bf' },
  ];
}

export function validateLayoutImport(value: unknown, defaults: AirportLayout): AirportLayout {
  if (!value || typeof value !== 'object') throw new Error('File không phải JSON bố cục hợp lệ.');
  const document = value as { version?: unknown; layout?: unknown };
  if (!Array.isArray(document.layout)) {
    throw new Error('Dữ liệu bố cục không hợp lệ.');
  }

  const imported = document.layout as unknown[];
  const result: AirportLayout = [];

  for (const raw of imported) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Partial<LayoutObject>;
    if (typeof item.id !== 'string' || !item.id.trim()) continue;
    if (item.id === 'apron_pad' || (item as any).kind === 'pad' || (typeof item.name === 'string' && item.name.includes('Nền sân đỗ'))) {
      continue;
    }
    if (!Array.isArray(item.position) || item.position.length !== 3) continue;
    const [x, y, z] = item.position;
    if (![x, y, z].every(Number.isFinite)) continue;
    if (Math.abs(Number(x)) > 150 || Math.abs(Number(y)) > 25 || Math.abs(Number(z)) > 150) continue;

    const rotationY = Number.isFinite(item.rotationY) ? Number(item.rotationY) : 0;
    const scale = Number.isFinite(item.scale) ? Math.max(0.2, Math.min(4.0, Number(item.scale))) : 1;
    const color = typeof item.color === 'string' && /^#[0-9a-f]{6}$/i.test(item.color) ? item.color : '#fff0bf';
    const kind = item.kind && ['tower', 'mast', 'terminal', 'hangar', 'vehicle', 'equipment'].includes(item.kind)
      ? item.kind
      : 'mast';
    const name = typeof item.name === 'string' && item.name.trim() ? item.name : `Vật thể ${item.id}`;

    result.push({
      id: item.id,
      name,
      kind: kind as LayoutObject['kind'],
      position: [Number(x), Number(y), Number(z)],
      rotationY,
      scale,
      color,
    });
  }

  // Ensure essential objects (tower & terminal) exist if missing
  for (const base of defaults.filter(d => d.id === 'tower' || d.id === 'terminal_zone')) {
    if (!result.some(r => r.id === base.id)) {
      result.unshift(base);
    }
  }

  return result.length > 0 ? result : defaults;
}
