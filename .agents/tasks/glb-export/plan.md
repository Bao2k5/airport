# Implementation Plan: "Xuất GLB" button (export whole 3D airport to one .glb)

Project root: `d:\Thao\airport-simulator` (all paths below are relative to it). Do NOT git commit, do NOT delete assets, do NOT add npm dependencies, do NOT run `npx playwright install` (network).

## Findings (scene inventory, read from code)

Canvas: `src/features/airport3d/Airport3DView.tsx` renders `<Canvas key={sceneMode}>` → `ResponsiveCameraAdjuster`, `WebGLContextWatcher` (no objects) → `<Suspense>` → `AirportScene` (`components/AirportScene.tsx`). The Canvas remounts when `sceneMode` changes. The same `AirportScene` renders in "Sa bàn sân bay" and in tower/room mode (only camera controls and Html markers differ).

| Source | What | Type / pitfalls |
|---|---|---|
| `AirportScene.tsx` | `<color>`, `<fog>`, hemisphereLight, ambientLight, directionalLight (castShadow) | scene props + lights → not exported |
| `UnifiedAirportGround.tsx` | 1200×1200 horizon plane (y −0.38), slab box, concrete plane | procedural; concrete uses `useTiledTexture('/textures/concrete-albedo.jpg')` with RepeatWrapping + repeat ≠ 1 (exporter writes KHR_texture_transform) |
| `surface/AirportPavement.tsx` | runways/taxiways plane | procedural; **CanvasTexture** (paintSurface, up to 4096²), `transparent` + `alphaTest 0.05` |
| `surface/AirportLights.tsx` | all FTG/edge/stop-bar fixtures | **InstancedMesh** (SphereGeometry 0.08, MeshBasicMaterial toneMapped=false) with **instanceColor** |
| `surface/LightGlow.tsx` (6×) | glow halos/cores | **Points** + PointsMaterial (CanvasTexture sprites, sizeAttenuation=false, additive); hidden lamps placed at **y = −9999** |
| `surface/AirportRestrictions.tsx` | red closure crosses | procedural planes, MeshBasicMaterial |
| `FodObstacle3D.tsx` | FOD barrier (only when edge W7A blocked / layout kind `equipment`) | **GLB** `/models/FOD.glb` (26 MB, 43 jpeg/png images), drei `<Center>`, pointLight, **Html** tag |
| `AirportMarkers` (in AirportScene) | stand/hold labels | **Html** only (empty groups in scene graph) |
| `StandDisplays.tsx` | stand sign posts | procedural meshes + **Html transform** |
| `GroundEquipment.tsx` | vehicles/people (off by default: `vehicles:false`) | procedural `ServiceVehicle` |
| `AirportProp` (in AirportScene) per layout item | tower, masts, vehicle, sign, equipment, terminal | see below; editing-only **TransformControls** and selection **ringGeometry** |
| `TowerCutaway.tsx` | control tower (procedural! `ControlTower.glb` is NOT used) | MeshStandard/MeshPhysical(glass, transparent 0.19)/MeshBasic, FTG monitor **CanvasTexture**, pointLight, `TowerOperator` (useFrame arm anim) |
| mast (in AirportProp) | light masts ×6 | procedural, emissive heads (emissiveIntensity 1.2/2.8 → KHR_materials_emissive_strength), pointLight |
| `AirportBannerPlaque.tsx` | banner plaque | plane + MeshBasicMaterial(map, transparent). Texture = `HIDE_SCHOOL_BRANDING ? '/sgn-banner.png' (1916×247) : '/textures/vaa-banner-sgn.png' (1024×133)`; editing+selected **wireframe** outline |
| `assets/DecorativeTerminal.tsx` → `ImportedModel.tsx` | terminal zone | **GLBs** in `public/models/airport-assets/optimized/`: terminal, aircraft-static (×2), jetbridge (×2), baggage-tug, baggage-cart, bus, stairs, hangar, dumpster (per `modelConfig.ts`); collider meshes set `visible=false`; `BoardingConnections` procedural; `ServiceVehicle`; editing ring; **Html** label |
| `AircraftModel.tsx` | aircraft (default state: 6 in `manualFleet`) | **GLB** `/models/Aircraft_A321_Illustrative.glb` cloned (shared geometry), livery MeshStandardMaterial; **selected ring** (`#ffd166`, visible in normal mode); `AircraftTag` = **Html** |
| `FireEffect.tsx` | engine fire (only BAV315 emergency scenario) | **GLB** `/models/fire_animation (1).glb` (17 meshes, clip "Take 001", scale tracks, no skins), SkeletonUtils.clone + AnimationMixer |
| `SkyEnvironment.tsx` | `scene.environment` CanvasTexture | not an object; not exported |
| `AirportCameraControls` / `TowerCameraControls` | OrbitControls | not Object3D in scene |

Not present anywhere: ShaderMaterial, onBeforeCompile, postprocessing/EffectComposer, GridHelper/AxesHelper, Sprite, Line meshes (only inside the TransformControls gizmo), VideoTexture, skinned meshes. Unused GLBs: `ControlTower.glb`, `Tug.glb`, all non-optimized `airport-assets/*.glb`. Loaded GLBs use no Draco/meshopt/KTX2 (only `KHR_materials_specular`), so the in-memory data exports directly.

three 0.185.1 `GLTFExporter` (`node_modules/three/examples/jsm/exporters/GLTFExporter.js`) supports `parseAsync`, `binary`, `onlyVisible` (default true), `maxTextureSize`, `trs`, EXT_mesh_gpu_instancing, KHR_materials_unlit (MeshBasicMaterial), KHR_materials_emissive_strength, KHR_texture_transform, KHR_lights_punctual, and handles `texture.flipY` itself (`processImage(..., flipY)`). TransformControls helper objects carry `isTransformControlsRoot` / `isTransformControlsGizmo` / `isTransformControlsPlane`.

## Tooling found (offline)

- Scripts (`package.json`): `dev` (vite), `build` (`tsc -b && vite build`), `lint` (`eslint .`), `preview`. three 0.185.1, @types/three 0.185.4, r3f 9.8, drei 10.7.8, vite 8.
- `npm run build`: passes on the current tree (baseline verified).
- `npm run lint`: **already broken at baseline** ("ESLint couldn't find an eslint.config.(js|mjs|cjs) file"). Do not add an ESLint config (out of scope). Type safety comes from `tsc -b` inside `npm run build`.
- No test runner. Existing check scripts live in `scripts/*.mjs` (gitignored) and use `vite.createServer` + `server.ssrLoadModule(...)` and a GLB `decode()` helper + geometry-only `GLTFLoader.parseAsync` in Node (`scripts/check-airport-assets.mjs`) — reuse those patterns.
- Playwright 1.60.0 (`node_modules/playwright`, devDependency). Its default headless-shell build is **not installed**; launch with `executablePath: process.env.LOCALAPPDATA + '/ms-playwright/chromium-1243/chrome-win64/chrome.exe'` (fallback `{ channel: 'msedge' }`), args `['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']`. Verified: WebGL2 works headless (MAX_TEXTURE_SIZE 8192) with both.
- Blender 5.1.1 at `C:\Program Files\Blender Foundation\Blender 5.1\blender.exe` (glTF importer available; `-b --factory-startup` verified). Use it for the import-compatibility check and the preview render.
- Not available: `@playwright/test`, puppeteer, gltf-validator, @gltf-transform, Python trimesh/pygltflib.

## Design decisions

1. **Where the logic lives.** New folder `src/features/airport3d/export/`:
   - `prepareExportScene.ts` — pure three.js (no React/DOM) so it can be unit-checked via `ssrLoadModule` in Node. Exports `prepareExportScene(source: Object3D): { root: Scene; dispose(): void }`.
   - `exportGlb.ts` — `exportSceneToGlb(scene: Object3D): Promise<ArrayBuffer>` (calls prepare, dynamic-imports `three/examples/jsm/exporters/GLTFExporter.js` to keep the exporter out of the main 3D chunk, runs `parseAsync`, always calls `dispose()` in `finally`) and `downloadGlb(buffer: ArrayBuffer, filename = 'san-bay-sgn-3d.glb')`.
   - `SceneExportBridge.tsx` — tiny in-Canvas component: `useThree(s => s.scene)`, and in a `useEffect` assigns `exportRef.current = () => exportSceneToGlb(scene)`; cleanup sets it back to `null` (Canvas remounts on `sceneMode`). Rationale: the toolbar lives outside the Canvas, so a ref bridge is the least invasive way to reach the r3f scene.
2. **Copy, never mutate.** Build a new `Scene` (name `SanBay_SGN_3D`) and recursively copy the r3f scene's children with `object.clone(false)` (shares geometry/material/texture references, which keeps the six aircraft as one exported mesh), skipping excluded subtrees. The live scene root itself is not cloned (avoids background/fog/environment). Only newly created geometries/materials are tracked and disposed after export; shared ones are never touched or mutated. Local TRS of every node is copied as-is, and since the r3f scene root has identity transform, world positions/scales/rotations are preserved. Export with `trs: true` for editable nodes in Blender.
3. **Exclusion rules** (skip the object and its whole subtree) in `prepareExportScene`:
   - `object.userData.noExport === true`
   - `!object.visible` (also drops GLB `collider` meshes)
   - `isCamera`, `isLight` (lights are not exported: ambient/hemisphere are unsupported in glTF, point-light units and directional-light targets import inconsistently across Blender/viewers; emissive materials keep lamps/mast heads visibly "lit")
   - `isPoints`, `isLine` (covers Line/LineSegments/LineLoop), `isSprite` — LightGlow halos are screen-space sprites and hide lamps at y=−9999, which would wreck the model bounds; the instanced lamp spheres already represent every fixture
   - `isTransformControlsRoot`, `isTransformControlsGizmo`, `isTransformControlsPlane`, or `object.type` ending in `Helper`
   - a Mesh whose material (any of an array) has `wireframe === true`
   - After copying, **prune** any Group/Object3D subtree that contains no Mesh (removes the empty groups drei `Html` leaves behind for labels, tags, stand-display HTML, etc.).
4. **InstancedMesh strategy: bake.** Do not rely on EXT_mesh_gpu_instancing (instance colors are ignored by most viewers and Blender support is inconsistent). For each InstancedMesh: group instances `0..count-1` by `getColorAt` hex (fallback to material color when `instanceColor` is null); for each group clone the geometry per instance, `applyMatrix4(getMatrixAt(i))`, merge with `mergeGeometries` from `three/examples/jsm/utils/BufferGeometryUtils.js`, and create one `Mesh` per colour with a new `MeshBasicMaterial({ color })` (exports as unlit, so FTG green / stop-bar red / edge blue stay exact). The baked meshes go under a Group that copies the InstancedMesh's name and local transform; child names `${name}_${hex}` (e.g. `AirfieldLights_22c55e`). Result: ~6–8 meshes instead of thousands of nodes.
5. **Materials.** Keep `MeshStandardMaterial`, `MeshPhysicalMaterial`, `MeshBasicMaterial` by reference (exporter-native; Basic → KHR_materials_unlit, which suits the banner and monitor screen). Two conversions, cached in a `Map<Material, Material>` so shared materials stay shared:
   - `transparent && alphaTest > 0 && opacity === 1` → clone with `transparent = false` so it exports as `alphaMode: MASK` (pavement; avoids BLEND sorting artifacts on a large ground plane in Blender/viewers).
   - Any other material type (Lambert/Phong/Toon/ShaderMaterial/etc. — none exist today, it is a safety net) → new `MeshStandardMaterial` copying `name, color, map, emissive, emissiveMap, emissiveIntensity, opacity, transparent, alphaTest, side, vertexColors` where present (ShaderMaterial: colour from `uniforms.diffuse`/`uniforms.color` if present, else white).
6. **Textures.** No special handling: the exporter re-encodes Image/ImageBitmap/Canvas sources to PNG and applies `flipY` itself; repeat/offset become KHR_texture_transform. Pass `maxTextureSize: 4096` to cap size. The banner texture is whatever the live plaque uses, so `HIDE_SCHOOL_BRANDING` is respected automatically (`/sgn-banner.png`, 1916×247, when hidden).
7. **Animation.** Export static (current frame) for everything, including FireEffect. Rationale: the fire exists only in one scenario, and binding the "Take 001" tracks to cloned/renamed nodes is fragile. The TowerOperator arm is also static.
8. **Horizon plane excluded.** The 1200×1200 backdrop plane in `UnifiedAirportGround.tsx` gets `userData.noExport`. It only hides the horizon edge on screen; in a GLB it would make "frame all" in viewers/Blender zoom out ~10×. The structural slab and concrete surface stay.
9. **Node naming** (ASCII, no spaces/dots, so GLTFLoader/Blender keep them intact; never derived from layout ids such as `vaa_banner_plaque` or user names, so no school branding leaks):
   - AirportProp outer group: `${PREFIX[kind]}_${n}` with n counted per kind in layout order: tower→`ControlTower`, mast→`LightMast`, terminal→`TerminalZone`, sign→`BannerPlaque`, vehicle→`ServiceVehicle`, equipment→`FodEquipment`, hangar→`Hangar`. So defaults give `ControlTower_1`, `TerminalZone_1`, `BannerPlaque_1`, `LightMast_1..6`.
   - `UnifiedAirportGround` group `AirportGround` (meshes `GroundSlab`, `GroundConcrete`); pavement mesh `RunwaysTaxiways`; lights InstancedMesh `AirfieldLights`; restrictions group `ClosureMarker_${n}` (index); StandDisplays group `StandSign_${label without spaces}`; AircraftModel outer group `Aircraft_${callsign sanitised to [A-Za-z0-9_]}`; FireEffect group `EngineFire`; FodObstacle3D outer group `FodObstacle`; ImportedModel group `Terminal_${config.id}` (e.g. `Terminal_aircraft-a` → use `config.id.replace(/[^A-Za-z0-9_]/g, '_')`); GroundEquipment groups `GroundVehicle_${i}` / `PushbackTug_${n}`.
10. **Button.** In `AirportToolbar.tsx`, inside the right-hand `ml-auto` group, placed before `{children}` (SceneSettings), shown in every scene mode (the Canvas holds the full airport in all modes). Uses the existing `button()` class helper. Text "Xuất GLB" (while busy "Đang xuất GLB…"), `title="Xuất toàn bộ cảnh 3D đang hiển thị thành một file .glb"`, `disabled` + `aria-busy` while exporting. Error shown next to it as `<span role="alert">` in red small bold text. The visible text is the accessible name, so no aria-label is needed (keeps label-in-name).
11. **State in Airport3DView.** `const exportSceneRef = useRef<(() => Promise<ArrayBuffer>) | null>(null)`, `const [glbExporting, setGlbExporting] = useState(false)`, `const [glbExportError, setGlbExportError] = useState('')`. Handler `handleExportGlb`: return if busy; clear error; set busy; `await new Promise(r => requestAnimationFrame(() => r(null)))` so the disabled state paints before the heavy traversal; if ref null → error "Cảnh 3D chưa sẵn sàng, vui lòng thử lại."; else `downloadGlb(await exportSceneRef.current())`; catch → `console.error` + "Không xuất được file GLB. Vui lòng thử lại."; finally clear busy. `downloadGlb` uses Blob type `model/gltf-binary`, appends the anchor to `document.body`, clicks, removes it, and revokes the URL after `setTimeout(..., 1000)` (large blobs).

## Objects that get `userData={{ noExport: true }}`

- `AirportScene.tsx` → AirportProp editing ring `<mesh>` (ringGeometry, `editing && …`).
- `AircraftModel.tsx` → selected ring `<mesh>` (`selected && …`, `#ffd166`).
- `DecorativeTerminal.tsx` → editing ring `<mesh>` (ringGeometry 13.5–14.5).
- `AirportBannerPlaque.tsx` → selection wireframe `<mesh>` (also caught by the wireframe rule).
- `UnifiedAirportGround.tsx` → 1200×1200 horizon plane `<mesh>`.

TransformControls, Points/LightGlow, lights, cameras and Html groups are handled by the generic rules. No other edits.

## Steps

- [ ] 1. Create `prepareExportScene.ts` with the copy/exclude/prune/bake/material rules (decisions 2–5), plus the unit check that proves it.
      `prepareExportScene(source)` returns `{ root, dispose }`. Keep it free of React/DOM imports. Use `mergeGeometries` from `three/examples/jsm/utils/BufferGeometryUtils.js`.
      Also create `scripts/check-glb-export.mjs` with only its `unit` phase for now. It starts `createServer({ server: { middlewareMode: true }, appType: 'custom' })`, `ssrLoadModule('/src/features/airport3d/export/prepareExportScene.ts')`, and builds a synthetic scene: a positioned Group with a Mesh; an InstancedMesh (3 instances, 2 colours, non-identity matrices); a Points; a LineSegments; a GridHelper; a PointLight; a mesh with `userData.noExport`; a wireframe mesh; an empty Group; an invisible mesh; and a MeshLambertMaterial mesh. Assert: the output has exactly the expected nodes; the InstancedMesh becomes 2 meshes with correct merged vertex counts and world-space vertex positions; Lambert becomes MeshStandardMaterial; and the source scene is unchanged (`JSON.stringify` of a traversal of names/matrices/child counts/material uuids before vs after). Then `dispose()` runs without throwing.
      Files: `src/features/airport3d/export/prepareExportScene.ts`, `scripts/check-glb-export.mjs`
      Verify: `node scripts/check-glb-export.mjs unit` prints `GLB_UNIT_OK`; `npm run build` passes.

- [ ] 2. Create `exportGlb.ts` (`exportSceneToGlb`, `downloadGlb`) and `SceneExportBridge.tsx` (decision 1).
      Exporter options: `{ binary: true, onlyVisible: true, trs: true, maxTextureSize: 4096 }`. Throw if the result is not an ArrayBuffer.
      Files: `src/features/airport3d/export/exportGlb.ts`, `src/features/airport3d/export/SceneExportBridge.tsx`
      Verify: `npm run build` passes (tsc + vite). A separate GLTFExporter chunk is expected.

- [ ] 3. Add the node names (decision 9) and `userData.noExport` flags (list above).
      In `AirportScene.tsx`, compute `exportName` per layout item in the `layout.map` (per-kind counter) and pass it to `MemoAirportProp`. Add `previous.exportName === next.exportName` to the memo comparator and set `name={exportName}` on the AirportProp group. Add `name` props in the other listed components. Do not change any visual props.
      Files: `src/features/airport3d/components/AirportScene.tsx`, `components/AircraftModel.tsx`, `components/UnifiedAirportGround.tsx`, `components/AirportBannerPlaque.tsx`, `components/StandDisplays.tsx`, `components/GroundEquipment.tsx`, `components/FireEffect.tsx`, `components/FodObstacle3D.tsx`, `surface/AirportPavement.tsx`, `surface/AirportLights.tsx`, `surface/AirportRestrictions.tsx`, `assets/ImportedModel.tsx`, `assets/DecorativeTerminal.tsx` (all under `src/features/airport3d/`)
      Verify: `npm run build` passes; `node scripts/check-3d-surface.mjs` and `node scripts/check-airport-assets.mjs` still print `SURFACE_CHECKS_OK` / `ASSETS_OK` (regression).

- [ ] 4. Wire the button (decisions 10–11).
      Mount `<SceneExportBridge exportRef={exportSceneRef} />` inside the `<Canvas>` (next to `WebGLContextWatcher`, outside Suspense). Add the state and handler in `Airport3DView.tsx`. Pass `onExportGlb`, `exportingGlb` and `exportGlbError` to `AirportToolbar`, and render the button and the alert there. Keep the existing layout and classes.
      Files: `src/features/airport3d/Airport3DView.tsx`, `src/features/airport3d/components/AirportToolbar.tsx`
      Verify: `npm run build` passes. `npm run lint` still fails only with the pre-existing "couldn't find an eslint.config" message (record this in the report; do not fix).

- [ ] 5. Extend `scripts/check-glb-export.mjs` with the `e2e` phase (headless download + GLB validation) and run it.
      - Start Vite programmatically: `const server = await createServer({ server: { port: 5179, strictPort: true } }); await server.listen();`. Launch Chromium via `executablePath` (fallback `channel: 'msedge'`) with the swiftshader args from "Tooling found". Use `newContext({ acceptDownloads: true, viewport: { width: 1600, height: 900 } })`. Log page console/pageerror lines to `artifacts/glb-export/console.log`.
      - `goto('http://localhost:5179/3d')`, `waitForLoadState('networkidle')`, wait for `canvas`, wait 5 s more, then screenshot to `artifacts/glb-export/app.png`.
      - Locate `getByRole('button', { name: 'Xuất GLB' })`. Run `Promise.all([page.waitForEvent('download', { timeout: 180000 }), click])` and assert the button becomes disabled/"Đang xuất GLB…" right after the click. `download.saveAs('artifacts/glb-export/san-bay-sgn-3d.glb')`. Assert `suggestedFilename() === 'san-bay-sgn-3d.glb'`, the button is re-enabled, and there is no `[role=alert]` text.
      - Three.js browser parse (the same loader the donmccurdy viewer and three.js editor use): in the page, `const { GLTFLoader } = await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js'); const gltf = await new GLTFLoader().loadAsync('/artifacts/glb-export/san-bay-sgn-3d.glb')` (Vite serves project-root files). Return mesh count, image count and loader errors; assert it succeeded, with mesh count > 50.
      - Node structural checks (reuse `decode()` from `check-airport-assets.mjs`): GLB magic, version 2, total length, JSON + BIN chunks; every bufferView fits in BIN; every accessor fits in its bufferView. `extensionsUsed` must not contain `EXT_mesh_gpu_instancing` or `KHR_lights_punctual`. Every primitive mode is undefined or 4. Node names include `ControlTower_1`, `TerminalZone_1`, `BannerPlaque_1`, `RunwaysTaxiways`, `AirportGround`, `LightMast_1`…`LightMast_6`, at least one `Aircraft_*` (log the count; default fleet is 6) and at least one `AirfieldLights_*`. The JSON chunk must not match `/\bVAA\b|vaa[_\- ]|Học viện|Hàng không Việt Nam/i`.
      - Banner check: from node `BannerPlaque_1`, descend to its mesh → material → `pbrMetallicRoughness.baseColorTexture` → texture source image → bufferView bytes. Read the PNG IHDR (width BE at byte 16, height at 20) and assert 1916×247 (`/sgn-banner.png`). Also assert no image in the file is 1024×133 (`/textures/vaa-banner-sgn.png`).
      - World transforms: geometry-only parse (the `geometryScene` trick from `check-airport-assets.mjs`) → `updateMatrixWorld`. Compare world positions with `createDefaultLayout()` loaded via `ssrLoadModule('/src/features/airport3d/layout.ts')` (the fresh browser profile has no saved layout): `ControlTower_1` ≈ [22.84, 0, 9.31], `BannerPlaque_1` ≈ [-0.1, 0.03, -39.95], `LightMast_1` ≈ [10.31, 0, 9.58] (tolerance 1e-3). Scene Box3 must be finite with |x|, |z| < 300 and −2 < y < 40 (catches the −9999 points or the 1200 plane leaking in).
      - Write `artifacts/glb-export/report.json` (byte size, node/mesh/material/image counts, names found, aircraft count, bounds). Print `GLB_E2E_OK`. Close the browser and server in `finally`.
      Files: `scripts/check-glb-export.mjs`
      Verify: `node scripts/check-glb-export.mjs e2e` (timeout ~10 min) prints `GLB_E2E_OK`, and `artifacts/glb-export/san-bay-sgn-3d.glb` exists. Fix product code (not the checks) if any assertion fails.

- [ ] 6. Blender import check and preview render.
      Create `scripts/blender-glb-preview.py` (run with `"C:\Program Files\Blender Foundation\Blender 5.1\blender.exe" -b --factory-startup --python-exit-code 1 --python scripts/blender-glb-preview.py -- artifacts/glb-export/san-bay-sgn-3d.glb artifacts/glb-export/preview.png`). The script:
      - Clears the scene and runs `bpy.ops.import_scene.gltf(filepath=...)`, raising on failure.
      - Asserts objects whose names start with `ControlTower`, `BannerPlaque`, `Aircraft_`, `RunwaysTaxiways` exist and that mesh objects number > 50.
      - Finds the image used by the BannerPlaque material and asserts `size == (1916, 247)`. Prints the world bounding box (Blender is Z-up: three (x, y, z) → Blender (x, −z, y)).
      - Adds a sun lamp and a camera matching the app's "Tổng quan" preset (three position [0, 92, 78] → Blender (0, −78, 92), looking at the origin, vertical FOV 43°, `sensor_fit='VERTICAL'`).
      - Renders with `BLENDER_WORKBENCH`, `shading.color_type='TEXTURE'`, 1600×900, to `preview.png`, then prints `BLENDER_OK`.
      Files: `scripts/blender-glb-preview.py`
      Verify: the command exits 0 and prints `BLENDER_OK`. Open `artifacts/glb-export/preview.png` and `artifacts/glb-export/app.png` with the image reader. They should show the same layout (runways/taxiways, tower, terminal zone, aircraft at stands, banner reading SGN without a school logo, light masts, coloured fixture dots).

- [ ] 7. Final regression and report.
      Run `npm run build`, `node scripts/check-glb-export.mjs unit`, `node scripts/check-glb-export.mjs e2e`, `node scripts/check-3d-surface.mjs` and `node scripts/check-airport-assets.mjs`. Report the GLB byte size, the counts from report.json, the lint baseline failure, and these known limits: static snapshot (no animation), lights and glow sprites not exported, horizon plane excluded, and whatever the current scenario shows is what gets exported. Do not upload the GLB to gltf-viewer.donmccurdy.com (third-party transfer); the in-browser three.js GLTFLoader parse covers that viewer's loader. Remove any temp files; keep `artifacts/glb-export/*`. No git commit.
      Verify: all commands above succeed.

## Assumptions / gaps

- The export captures the current state (camera-independent): current aircraft, light colours, selected ring excluded, editing aids excluded. Scenario-only objects (FOD, fire) appear only when that scenario is on screen.
- If `mergeGeometries` returns null (it should not, since all instances share one geometry), fall back to one Mesh per instance under the same group, and log a warning.
- If headless SwiftShader is too slow to reach `networkidle` within the timeouts, raise the timeouts before changing the approach. The 4096² pavement canvas is clamped by `gl.capabilities.maxTextureSize`, which is 8192 here.
