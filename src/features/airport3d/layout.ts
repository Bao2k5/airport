import type { AirportGraph } from '../../types';

export const LAYOUT_STORAGE_KEY = 'tsn-airport-3d-layout-v8';
export const LAYOUT_VERSION = 8;

export interface LayoutObject {
  id: string;
  name: string;
  kind: 'tower' | 'mast' | 'terminal' | 'hangar' | 'vehicle' | 'equipment' | 'sign';
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

export function createDefaultLayout(_graph?: AirportGraph): AirportLayout {
  return [
    { id: 'tower', name: 'Đài kiểm soát không lưu', kind: 'tower', position: [22.84, 0, 9.31], rotationY: 0.7853981633974483, scale: 1, color: '#9eaeb9' },
    { id: 'terminal_zone', name: 'Khu nhà ga & Ống lồng', kind: 'terminal', position: [32.06, 0, 28.74], rotationY: 3.1415926535897936, scale: 1.2, color: '#303c43' },
    { id: 'vaa_banner_plaque', name: 'Biển hiệu mô hình VAA (SGN)', kind: 'sign', position: [-0.1, 0.03, -39.95], rotationY: 0, scale: 2.3, color: '#0d1f36' },
    { id: 'apron_light_1', name: 'Đèn sân đỗ 1', kind: 'mast', position: [10.31, 0, 9.58], rotationY: 1.5707963267948963, scale: 1, color: '#fff0bf' },
    { id: 'apron_light_2', name: 'Đèn sân đỗ 2', kind: 'mast', position: [25.94, 0, 6.97], rotationY: 0.2617993877991494, scale: 1, color: '#fff0bf' },
    { id: 'apron_light_3', name: 'Đèn sân đỗ 3', kind: 'mast', position: [9.94, 0, 18.71], rotationY: 1.5707963267948963, scale: 1, color: '#fff0bf' },
    { id: 'apron_light_4', name: 'Đèn sân đỗ 4', kind: 'mast', position: [31.34, 0, 4.96], rotationY: 0.2617993877991494, scale: 1, color: '#fff0bf' },
    { id: 'apron_light_5', name: 'Đèn sân đỗ 5', kind: 'mast', position: [9.79, 0, 26.97], rotationY: 1.5707963267948963, scale: 1, color: '#fff0bf' },
    { id: 'apron_light_6', name: 'Đèn sân đỗ 6', kind: 'mast', position: [36.46, 0, 2.76], rotationY: 0.2617993877991494, scale: 1, color: '#fff0bf' },
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
    const scale = Number.isFinite(item.scale) ? Math.max(0.1, Math.min(6.0, Number(item.scale))) : 1;
    const color = typeof item.color === 'string' && /^#[0-9a-f]{6}$/i.test(item.color) ? item.color : '#fff0bf';
    const kind = item.kind && ['tower', 'mast', 'terminal', 'hangar', 'vehicle', 'equipment', 'sign'].includes(item.kind)
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

  // Ensure essential objects (tower, terminal & banner) exist if missing
  for (const base of defaults.filter(d => d.id === 'tower' || d.id === 'terminal_zone' || d.id === 'vaa_banner_plaque')) {
    if (!result.some(r => r.id === base.id)) {
      result.push(base);
    }
  }

  return result.length > 0 ? result : defaults;
}
