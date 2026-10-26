# Verification: "Xuất GLB" (iteration 1)

## Files changed
New (`src/features/airport3d/export/`):
- `prepareExportScene.ts`: builds an export-only copy of the r3f scene. It shallow-clones nodes and shares geometry, materials and textures. It excludes cameras, lights, Points, Lines, Sprites, `*Helper`, TransformControls, wireframe meshes, `userData.noExport` and invisible objects, and prunes empty (Html) groups. InstancedMesh is baked into one merged unlit mesh per colour. Alpha-test cutouts become MASK. Non-glTF materials become MeshStandardMaterial.
- `exportGlb.ts`: `exportSceneToGlb` (lazy GLTFExporter with `binary, onlyVisible, trs, maxTextureSize 4096`) and `downloadGlb` (`san-bay-sgn-3d.glb`, `model/gltf-binary`).
- `SceneExportBridge.tsx`: an in-Canvas `useThree` bridge that hands the exporter to a ref.

Modified (all under `src/features/airport3d/`):
- `Airport3DView.tsx`: ref, busy/error state, handler, bridge mounted in Canvas.
- `components/AirportToolbar.tsx`: button plus `role="alert"` error.
- `components/AirportScene.tsx`: per-kind ASCII node names for layout props, plus `noExport` on the editing ring.
- `components/AircraftModel.tsx`: `Aircraft_<callsign>` name, plus `noExport` on the selection ring.
- `components/UnifiedAirportGround.tsx`: names, plus `noExport` on the 1200×1200 horizon plane.
- `components/AirportBannerPlaque.tsx`: `BannerFace` name, plus `noExport` on the wireframe.
- `assets/DecorativeTerminal.tsx`: `noExport` on the editing ring.
- Node names only: `assets/ImportedModel.tsx`, `components/FireEffect.tsx`, `components/FodObstacle3D.tsx`, `components/StandDisplays.tsx`, `surface/AirportLights.tsx`, `surface/AirportPavement.tsx`.

No visual props changed. No dependencies added. No commit.

Verification scripts (gitignored `artifacts/`): `artifacts/glb-export/check-glb-export.mjs` and `artifacts/glb-export/blender-glb-preview.py`.

## Commands and results (cwd `d:\Thao\airport-simulator`)
- `npm run build` (`tsc -b && vite build`) passed. It emits a separate `GLTFExporter-*.js` chunk (36.6 kB). The ">500 kB chunk" warning was already there before this change.
- `npm run lint` fails with `ESLint couldn't find an eslint.config.(js|mjs|cjs) file`. No ESLint config exists in the repo, so this is a pre-existing failure and not caused by this change.
- `node artifacts/glb-export/check-glb-export.mjs unit` printed `GLB_UNIT_OK`. The synthetic scene checks cover: exclusions, empty-group pruning, instanced bake (2 colours, correct vertex counts and world centre), Lambert→Standard, cutout→MASK, and an unchanged source scene.
- `node artifacts/glb-export/check-glb-export.mjs e2e` printed `GLB_E2E_OK`.
  - Port 5173 was not running, so the script started Vite on 5179 and closed it afterwards. Nothing is listening on 5179 now.
  - It uses Playwright with Chromium 1243 and SwiftShader, and runs: open `/` → click "Trang 3D" → wait → screenshot `app.png` → click "Xuất GLB".
  - The busy state was observed: the button was disabled and read "Đang xuất GLB…".
  - The download's suggestedFilename was `san-bay-sgn-3d.glb`. The button was re-enabled afterwards and no alert appeared. Export took about 16.4 s under SwiftShader.
  - The file was parsed back in-browser with three's GLTFLoader: 322 meshes, 13 mapped textures.
  - Structural checks passed: GLB header and chunks, bufferView and accessor bounds, all primitives in triangle mode.
  - World positions match the default layout within 1e-3.
  - Bounds are x/z ±58.6 and y −0.77..11.76, so no −9999 points or 1200 plane leaked in.
- `blender.exe -b --factory-startup --python-exit-code 1 --python artifacts/glb-export/blender-glb-preview.py -- ...glb ...preview-blender.png` exited 0 and printed `BLENDER_OK`.
  - Blender 5.1.1 imported 456 objects, 322 meshes and 6 aircraft.
  - The banner material image is `Image_16` at (1916, 247).
- Regression scripts:
  - `node scripts/check-3d-surface.mjs` printed `SURFACE_CHECKS_OK`.
  - `node scripts/check-airport-assets.mjs` fails at the assertion "base must remain just below the pavement atlas" (`FOUNDATION_SURFACE_Y` vs `SURFACE_SIZE.elevation`). It compares constants in `surface/foundationBounds.ts` and `surface/geometry.ts`, neither of which this change touched. I did not run it against the unmodified tree, so this is inferred as pre-existing rather than proven.

## Exported file
`d:\Thao\airport-simulator\artifacts\glb-export\san-bay-sgn-3d.glb` is 21,855,868 bytes (about 20.8 MiB). Full details are in `artifacts/glb-export/report.json`.

| | count |
|---|---|
| nodes | 456 |
| meshes | 294 |
| materials | 287 |
| textures | 17 |
| images | 17 |
| animations | 0 |
| accessors | 1145 |

- extensionsUsed: `KHR_texture_transform`, `KHR_materials_unlit`, `KHR_materials_emissive_strength`, `KHR_materials_specular`. None are required (`extensionsRequired` is empty). There is no `EXT_mesh_gpu_instancing` and no `KHR_lights_punctual`.
- Scene name: `SanBay_SGN_3D`.
- Top-level nodes: `AirportGround`, `RunwaysTaxiways`, `AirfieldLights`, 16× `StandSign_STAND_*`, `ControlTower_1`, `TerminalZone_1`, `BannerPlaque_1`, `LightMast_1`…`LightMast_6`, and `Aircraft_VN001`…`Aircraft_VN006`.
- Baked fixture meshes: `AirfieldLights_ffb700`, `_ffffff`, `_0088ff`, `_ebe7df`, `_ff1744`.
- Pavement material: `alphaMode MASK`, cutoff 0.05. Banner material: `BLEND` + `KHR_materials_unlit`.

## Branding (HIDE_SCHOOL_BRANDING on, default)
- Images have no name or URI. The exporter embeds them all as bufferViews, so they are identified by size instead.
- Embedded image sizes: 1024², 4096×2999 (pavement canvas), 512×320, 256²×8, 1024²×5 (two are JPEG), and 1916×247.
- The banner (`BannerPlaque_1` → material → baseColorTexture) resolves to the 1916×247 PNG, which is `/sgn-banner.png`.
- No 1024×133 image (`/textures/vaa-banner-sgn.png`) is embedded.
- The JSON chunk does not match `/\bVAA\b|vaa[_\- ]|Học viện|Hàng không Việt Nam/i`. Node names come from fixed prefixes, not from layout ids or user names.

## Previews
- `artifacts/glb-export/preview.png`: the reloaded GLB rendered by three.js from the app's "Tổng quan" camera. It matches `app.png` (runways and taxiways, tower, terminal/hangar, 6 aircraft, SGN banner without logo, masts, fixtures).
- `artifacts/glb-export/preview-blender.png`: Blender Workbench render. The geometry is correct, but the pavement atlas looks dark because Workbench draws MASK alpha poorly. This is a render-mode artefact; the three.js preview shows the pavement normally.

## Included / not included
- Included: ground slab and concrete (tiled, via KHR_texture_transform), runway/taxiway surface texture, all FTG/edge/stop-bar fixtures with their current colours (unlit), control tower with interior and FTG monitor texture, terminal zone GLBs (terminal, jet bridges, static aircraft, bus, tug, carts, stairs, hangar, dumpster), service vehicle, banner, light masts (emissive heads), stand sign posts, and live aircraft. Closure markers, FOD and the engine fire are included only when the current scenario shows them.
- Not included:
  - Lights: hemisphere, ambient, directional and point lights.
  - Background colour, fog and the environment map.
  - The LightGlow halo sprites (Points). The fixture spheres still show every fixture.
  - Html overlays: aircraft tags, stand numbers, labels.
  - The 1200×1200 horizon backdrop plane.
  - Editing rings, selection ring/wireframe and TransformControls.
  - Animation: the export is a static snapshot. The fire clip and tower operator are frozen at the current frame.

## Known limitations
- Shadows, fog and post-tone-mapping look differ per viewer because no lights are exported; viewers apply their own.
- The file is about 21 MB, mostly embedded PNG textures: imported GLB textures are re-encoded to PNG by GLTFExporter, plus the 4096×2999 pavement canvas.
- The export shows whatever the current state is (scenario, aircraft positions, light colours). The Canvas remounts per scene mode, and the same airport is exported in "Toàn phòng KSVKL" mode.
- The GLB was not uploaded to gltf-viewer.donmccurdy.com, to avoid sending the file to a third party. That viewer uses three's GLTFLoader, which was exercised in-browser.
