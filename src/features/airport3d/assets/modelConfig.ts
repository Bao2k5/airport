export interface ModelPlacement {
  id: string;
  file: string;
  position: [number, number, number];
  rotationY: number;
  /** Fit longest horizontal extent uniformly unless explicit dimensions are set. */
  span: number;
  dimensions?: [number, number, number];
  detailOnly?: boolean;
}

const base = '/models/airport-assets/optimized/';
export const MODEL_BASE_URL = base;
// This is a separate decorative display area, never an operational stand/route.
export const DECORATIVE_MODELS: ModelPlacement[] = [
  { id: 'terminal', file: 'terminal.glb', position: [0, 0, -6], rotationY: -Math.PI / 2, span: 15.5 },
  // Imported aircraft nose is +X; +90 degrees makes it face the terminal (-Z).
  { id: 'aircraft-a', file: 'aircraft-static.glb', position: [-4, 0.02, 6], rotationY: Math.PI / 2, span: 7.2 },
  { id: 'aircraft-b', file: 'aircraft-static.glb', position: [4, 0.02, 6], rotationY: Math.PI / 2, span: 7.2, detailOnly: true },
  { id: 'jetbridge-a', file: 'jetbridge.glb', position: [-4.9, 0, 0.9], rotationY: -Math.PI / 2, span: 7.2, dimensions: [0.95, 1.45, 7.2] },
  { id: 'jetbridge-b', file: 'jetbridge.glb', position: [3.1, 0, 0.9], rotationY: -Math.PI / 2, span: 7.2, dimensions: [0.95, 1.45, 7.2], detailOnly: true },
  { id: 'tug-a', file: 'baggage-tug.glb', position: [-2.8, 0, 3.4], rotationY: Math.PI / 2, span: 0.9 },
  { id: 'cart-a', file: 'baggage-cart.glb', position: [-1, 0, 7], rotationY: 0, span: 0.85 },
  { id: 'bus', file: 'bus.glb', position: [8.5, 0, -4], rotationY: Math.PI / 2, span: 2.1 },
  { id: 'stairs', file: 'stairs.glb', position: [-1, 0, 9.3], rotationY: 0, span: 1.25, detailOnly: true },
  { id: 'hangar', file: 'hangar.glb', position: [8.8, 0, 8.5], rotationY: Math.PI, span: 3.4, detailOnly: true },
  { id: 'dumpster', file: 'dumpster.glb', position: [-8.4, 0, -8.5], rotationY: 0, span: 0.6, detailOnly: true },
];
