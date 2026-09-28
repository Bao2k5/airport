import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Box3, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createServer } from 'vite';

const directory = path.resolve('public/models/airport-assets');
async function walk(dir) {
  return (await Promise.all((await fs.readdir(dir, { withFileTypes: true })).map(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : /\.(glb|gltf)$/i.test(file) ? [file] : [];
  }))).flat();
}
function decode(buffer, file) {
  if (file.endsWith('.gltf')) return { json: JSON.parse(buffer.toString('utf8')), binary: null };
  assert.equal(buffer.readUInt32LE(0), 0x46546c67, `GLB signature: ${file}`);
  assert.equal(buffer.readUInt32LE(4), 2, `GLB version: ${file}`);
  assert.equal(buffer.readUInt32LE(8), buffer.length, `GLB byte length: ${file}`);
  let json, binary;
  for (let cursor = 12; cursor < buffer.length;) {
    const length = buffer.readUInt32LE(cursor), type = buffer.readUInt32LE(cursor + 4);
    const chunk = buffer.subarray(cursor + 8, cursor + 8 + length);
    if (type === 0x4e4f534a) json = JSON.parse(chunk.toString('utf8').trim());
    if (type === 0x004e4942) binary = chunk;
    cursor += 8 + length;
  }
  assert(json?.asset?.version === '2.0', `glTF asset header: ${file}`);
  return { json, binary };
}
// Textures are omitted only in this geometry test; runtime loads real materials.
async function geometryScene(file) {
  const { json, binary } = decode(await fs.readFile(file), file);
  delete json.materials; delete json.images; delete json.textures;
  delete json.extensionsUsed; delete json.extensionsRequired;
  for (const mesh of json.meshes ?? []) for (const primitive of mesh.primitives) delete primitive.material;
  if (binary) json.buffers[0].uri = `data:application/octet-stream;base64,${binary.toString('base64')}`;
  return (await new GLTFLoader().parseAsync(JSON.stringify(json), '')).scene;
}
if (!globalThis.ProgressEvent) globalThis.ProgressEvent = class ProgressEvent { constructor(type, data) { this.type = type; Object.assign(this, data); } };

const inventory = [];
for (const file of await walk(directory)) {
  const buffer = await fs.readFile(file), { json } = decode(buffer, file);
  let triangles = 0;
  for (const mesh of json.meshes ?? []) for (const primitive of mesh.primitives) {
    const count = json.accessors[primitive.indices ?? primitive.attributes.POSITION]?.count ?? 0;
    if ((primitive.mode ?? 4) === 4) triangles += count / 3;
  }
  inventory.push({ file: path.relative(directory, file).replaceAll('\\', '/'), bytes: buffer.length,
    meshes: json.meshes?.length ?? 0, nodes: json.nodes?.length ?? 0, images: json.images?.length ?? 0, triangles });
}
assert.equal(inventory.filter(item => !item.file.startsWith('optimized/')).length, 9, 'all nine supplied models inspected');
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { airportGraphV3: graph } = await server.ssrLoadModule('/src/data/airportGraph.v3.ts');
  const { getSegments } = await server.ssrLoadModule('/src/features/airport3d/surface/geometry.ts');
  const { ASSET_ZONE, getAssetZone } = await server.ssrLoadModule('/src/features/airport3d/assets/assetPlacement.ts');
  const { DECORATIVE_MODELS } = await server.ssrLoadModule('/src/features/airport3d/assets/modelConfig.ts');
  const { normalizeModel } = await server.ssrLoadModule('/src/features/airport3d/assets/ImportedModel.tsx');
  const { createDefaultLayout } = await server.ssrLoadModule('/src/features/airport3d/layout.ts');
  const { getFoundationBounds, FOUNDATION_SURFACE_Y } = await server.ssrLoadModule('/src/features/airport3d/surface/foundationBounds.ts');
  const { SURFACE_SIZE } = await server.ssrLoadModule('/src/features/airport3d/surface/geometry.ts');
  const original = JSON.stringify(graph), zone = getAssetZone(graph), scenes = new Map(), normalized = [];
  const layout = createDefaultLayout(graph), layoutBefore = JSON.stringify(layout);
  const foundation = getFoundationBounds(graph, layout);
  assert(Math.abs((foundation.maxX - foundation.minX) - (foundation.maxZ - foundation.minZ)) < 1e-8, 'foundation must be square');
  assert(FOUNDATION_SURFACE_Y < SURFACE_SIZE.elevation && SURFACE_SIZE.elevation - FOUNDATION_SURFACE_Y < 0.002, 'base must remain just below the pavement atlas and terminal contact');
  assert(foundation.minX < -56.6 && foundation.maxX > 56.6 && foundation.minZ < -41.6 && foundation.maxZ > 41.6, 'foundation must contain original airport board');
  const contains = (bounds, x, z) => x >= bounds.minX && x <= bounds.maxX && z >= bounds.minZ && z <= bounds.maxZ;
  for (const item of layout) {
    assert(contains(foundation, item.position[0], item.position[2]), `${item.id}: layout position outside foundation`);
    if (item.kind === 'terminal') for (const x of [-ASSET_ZONE.width / 2, ASSET_ZONE.width / 2]) for (const z of [-ASSET_ZONE.depth / 2, ASSET_ZONE.depth / 2]) {
      assert(contains(foundation, item.position[0] + x, item.position[2] + z), 'terminal corner outside unified foundation');
    }
  }
  // Saved layouts may move/rotate/scale the terminal. The slab grows without moving it.
  const rotated = layout.map(item => item.kind === 'terminal' ? { ...item, position: [130, 0, -95], rotationY: Math.PI / 4, scale: 2 } : item);
  const expanded = getFoundationBounds(graph, rotated);
  const terminalRadius = ASSET_ZONE.width / 2 * 2 * Math.SQRT2;
  for (const x of [130 - terminalRadius, 130 + terminalRadius]) for (const z of [-95 - terminalRadius, -95 + terminalRadius]) {
    assert(contains(expanded, x, z), 'rotated scaled terminal outside foundation');
  }
  assert.equal(JSON.stringify(layout), layoutBefore, 'foundation must not move tower, terminal or masts');
  for (const segment of getSegments(graph)) {
    const rightEdge = Math.max(segment.a.x, segment.b.x) + segment.width / 2;
    assert(zone[0] - ASSET_ZONE.width / 2 >= rightEdge + ASSET_ZONE.clearance - 1e-8, `decorative zone overlaps operational edge ${segment.edge.id}`);
    for (const point of [segment.a, segment.b]) assert(contains(foundation, point.x, point.z), `${segment.edge.id}: graph outside foundation`);
  }
  for (const config of DECORATIVE_MODELS) {
    const file = path.join(directory, 'optimized', config.file);
    if (!scenes.has(file)) scenes.set(file, await geometryScene(file));
    const source = scenes.get(file), sourceBefore = source.matrixWorld.clone();
    const model = normalizeModel(source, config);
    const box = new Box3().setFromObject(model, true), size = box.getSize(new Vector3());
    assert(Math.abs(box.min.y) < 1e-5, `${config.id} is not grounded: ${box.min.y}`);
    assert(Math.abs((box.min.x + box.max.x) / 2) < 1e-5, `${config.id} not centered on X`);
    assert(Math.abs((box.min.z + box.max.z) / 2) < 1e-5, `${config.id} not centered on Z`);
    const expected = config.dimensions;
    if (expected) expected.forEach((extent, axis) => assert(Math.abs(size.getComponent(axis) - extent) < 1e-4, `${config.id}: wrong extent ${axis}`));
    else assert(Math.abs(Math.max(size.x, size.z) - config.span) < 1e-4, `${config.id}: wrong fitted span`);
    box.translate(new Vector3(...config.position));
    assert(box.min.x >= -ASSET_ZONE.width / 2 && box.max.x <= ASSET_ZONE.width / 2 && box.min.z >= -ASSET_ZONE.depth / 2 && box.max.z <= ASSET_ZONE.depth / 2, `${config.id} outside decorative pad`);
    assert.deepEqual(source.matrixWorld.elements, sourceBefore.elements, `${config.id}: source clone mutated`);
    normalized.push({ id: config.id, min: box.min.toArray(), max: box.max.toArray(), dimensions: size.toArray() });
  }
  assert.equal(JSON.stringify(graph), original, 'asset placement must never mutate graph');
  assert(!DECORATIVE_MODELS.some(item => /runway|tower|diorama|sign/i.test(item.file)), 'no replacement runway, tower or whole-airport layout');
  await fs.mkdir('artifacts/asset-review', { recursive: true });
  await fs.writeFile('artifacts/asset-review/asset-audit.json', JSON.stringify({ inventory, zone, foundation, normalized }, null, 2));
  console.log(`ASSETS_OK: ${inventory.length} files inspected; ${normalized.length} grounded placements; one ${foundation.side.toFixed(1)} x ${foundation.side.toFixed(1)} square foundation; graph, model transforms and 5-unit clearance preserved`);
} finally { await server.close(); }
