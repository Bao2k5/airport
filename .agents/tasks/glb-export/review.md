# Review: "Xuất GLB" (pass 1)

Verdict: APPROVED. No blockers found.

## Evidence checked
- Diff: 13 modified files under `src/features/airport3d/` (names and `userData.noExport` only, plus toolbar and view wiring). New untracked `src/features/airport3d/export/` (`prepareExportScene.ts`, `exportGlb.ts`, `SceneExportBridge.tsx`). `package.json` is unchanged, so no dependencies were added. Nothing is committed and no assets were deleted.
- Exporter (`exportGlb.ts:13`): lazy-loaded `GLTFExporter.parseAsync` with `binary: true, onlyVisible, trs, maxTextureSize 4096`. It rejects non-ArrayBuffer results, and `dispose()` always runs in `finally`. Download name is `san-bay-sgn-3d.glb` with type `model/gltf-binary`.
- Scene source: the r3f `useThree` scene goes through a ref bridge mounted in every `<Canvas key={sceneMode}>`. The bridge clears the ref on unmount.
- No live mutation: `prepareExportScene` builds a new Scene from `clone(false)` nodes. Geometry, materials and textures are shared, not changed. Only geometries/materials it creates are disposed: the baked instances, the MASK material clones and the converted materials. The only call that touches the live scene is `updateMatrixWorld`, which the renderer already runs every frame. The unit check asserts the source scene is unchanged.
- Exclusions (`prepareExportScene.ts:73-85`):
  - Covered by type: noExport, invisible objects, cameras, lights, Points, Lines, Sprites, TransformControls root/gizmo/plane, `*Helper`, wireframe meshes.
  - Empty Html groups are pruned.
  - noExport was added to the editing rings, the aircraft selection ring, the banner wireframe and the 1200² horizon plane.
- InstancedMesh: baked per colour, multiplying instanceColor × material color (the same as the shader), with the local instance matrix applied and the parent TRS copied. Non-glTF materials become Standard. Alpha-test cutouts become MASK. The exporter handles canvas/flipY textures.
- Branding:
  - The banner uses `HIDE_SCHOOL_BRANDING ? '/sgn-banner.png' : '/textures/vaa-banner-sgn.png'`.
  - The recorded check traces `BannerPlaque_1` to the 1916×247 image and finds no embedded 1024×133 image.
  - The JSON chunk does not match the VAA/school-name regex.
  - `preview.png` (re-loaded GLB) shows the SGN banner with no logo.
  - Searching `src/features/airport3d` found no other branding texture or canvas text (tower canvas strings are SGN/FTG only).
- UI (`AirportToolbar.tsx:47-48`):
  - Native `<button type="button">` with visible text "Xuất GLB" as its accessible name, plus a `title`.
  - While exporting it is `disabled` with `aria-busy` and reads "Đang xuất GLB…".
  - Failures show `role="alert"` with Vietnamese messages ("Không xuất được file GLB. Vui lòng thử lại." / "Cảnh 3D chưa sẵn sàng…").
  - It is placed in the existing `ml-auto` group using the existing `button()` class. `app.png` shows the layout is intact.
- Recorded verification:
  - `npm run build` passed. `npm run lint` fails because no eslint config exists (pre-existing, documented in the plan baseline).
  - `GLB_UNIT_OK`. `GLB_E2E_OK`: real button click, busy state seen, download name correct, three GLTFLoader re-parse gave 322 meshes, structural checks passed, world positions within 1e-3, bounds sane.
  - Blender import `BLENDER_OK` (456 objects, 6 aircraft).
  - The 21.9 MB GLB exists. `report.json` lists `ControlTower_1`, `TerminalZone_1`, `BannerPlaque_1`, `RunwaysTaxiways`, `AirportGround`, `AirfieldLights`, `LightMast_1..6` and `Aircraft_VN001..006`.
  - `check-airport-assets.mjs` fails on constants in files this change does not touch, so the failure is not attributable to this change.

## Notes (non-blocking)
- Glow halo sprites are excluded by design, so the fixture dots look smaller in the GLB than on screen (the plan approved this trade-off).
- Editing mode, with TransformControls on screen, was not exercised end-to-end. It is covered by the type-flag exclusion rule only.
