"""Offline Blender inspection renders; source GLBs are never overwritten."""
import bpy, math, os, json
from mathutils import Vector

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = os.path.join(root, 'artifacts', 'asset-review')
os.makedirs(out, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=os.path.join(root, 'public/models/airport-assets/airport_pack_total.glb'))
objects = list(bpy.context.scene.objects)
report = []
for needle in ['07.Modulo1', '07.Modulo2', '18.1.Airplane', '21.1.BaggageTruck']:
    selected = [o for o in objects if needle in o.name and o.type == 'MESH' and 'Collider' not in o.name]
    for o in objects: o.hide_render = o not in selected
    points = [o.matrix_world @ Vector(corner) for o in selected for corner in o.bound_box]
    if not points: continue
    lo = Vector(tuple(min(p[i] for p in points) for i in range(3)))
    hi = Vector(tuple(max(p[i] for p in points) for i in range(3)))
    center = (hi + lo) * .5; size = max(hi - lo)
    cam_data = bpy.data.cameras.new('ReviewCamera'); cam = bpy.data.objects.new('ReviewCamera', cam_data)
    bpy.context.collection.objects.link(cam); bpy.context.scene.camera = cam
    cam.location = center + Vector((1.2, -1.6, 1.3)) * size
    cam.rotation_euler = (center - cam.location).to_track_quat('-Z', 'Y').to_euler()
    cam_data.type = 'ORTHO'; cam_data.ortho_scale = size * 1.6
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.display.shading.light = 'STUDIO'; scene.display.shading.color_type = 'TEXTURE'
    scene.display.shading.show_shadows = True; scene.display.shading.show_cavity = True
    scene.render.resolution_x = 600; scene.render.resolution_y = 500; scene.render.resolution_percentage = 100
    scene.render.filepath = os.path.join(out, needle + '.png')
    bpy.ops.render.render(write_still=True)
    report.append({'name': needle, 'bounds_blender': [list(lo), list(hi)]})
    bpy.data.objects.remove(cam, do_unlink=True)
with open(os.path.join(out, 'preview-bounds.json'), 'w') as f: json.dump(report, f, indent=2)
