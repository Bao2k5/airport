import type { AirportGraph } from '../../../types';
import type { AirportLayout, LayoutObject } from '../layout';
import { ASSET_ZONE, getAssetZone } from '../assets/assetPlacement';
import { getSegments, SURFACE_SIZE } from './geometry';

export const FOUNDATION_SURFACE_Y = SURFACE_SIZE.elevation - 0.001;
export const FOUNDATION_PADDING = 2;

export interface FoundationBounds {
  center: [number, number, number];
  side: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/** Horizontal bounds only: growing the base must never move any scene object. */
export function getFoundationBounds(graph: AirportGraph, layout: AirportLayout): FoundationBounds {
  let minX = -56.6, maxX = 56.6, minZ = -41.6, maxZ = 41.6;
  const include = (x: number, z: number) => {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
  };
  for (const segment of getSegments(graph)) {
    const halfWidth = segment.width / 2;
    for (const point of [segment.a, segment.b]) {
      include(point.x - halfWidth, point.z - halfWidth);
      include(point.x + halfWidth, point.z + halfWidth);
    }
  }
  const includeObject = (item: Pick<LayoutObject, 'kind' | 'position' | 'rotationY' | 'scale'>) => {
    const radius = item.kind === 'tower' ? 3.2 : item.kind === 'mast' ? 1 : 4;
    const width = item.kind === 'terminal' ? ASSET_ZONE.width : radius * 2;
    const depth = item.kind === 'terminal' ? ASSET_ZONE.depth : radius * 2;
    const c = Math.cos(item.rotationY), s = Math.sin(item.rotationY);
    for (const x of [-width / 2, width / 2]) for (const z of [-depth / 2, depth / 2]) {
      include(item.position[0] + (x * c + z * s) * item.scale, item.position[2] + (-x * s + z * c) * item.scale);
    }
  };
  layout.forEach(includeObject);
  // Reserve the terminal area even when the models have not yet loaded.
  if (!layout.some(item => item.kind === 'terminal')) {
    includeObject({ kind: 'terminal', position: getAssetZone(graph), rotationY: 0, scale: 1 });
  }
  const x = (minX + maxX) / 2, z = (minZ + maxZ) / 2;
  const side = Math.max(maxX - minX, maxZ - minZ) + FOUNDATION_PADDING * 2;
  return { center: [x, FOUNDATION_SURFACE_Y, z], side, minX: x - side / 2, maxX: x + side / 2, minZ: z - side / 2, maxZ: z + side / 2 };
}
