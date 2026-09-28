"""Offline placement review in Blender; uses exported application model configuration."""
import bpy, os, json, math
from mathutils import Vector, Matrix

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = os.path.join(root, 'artifacts', 'asset-review')
with open(os.path.join(out, 'placements.json')) as f:
    placements = json.load(f)
bpy.ops.wm.read_factory_settings(use_empty=True)
report = []
for config in placements:
    before = set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(root, 'public/models/airport-assets/optimized', config['file']))
    imported = set(bpy.context.scene.objects) - before
    objects = [o for o in imported if o.type == 'MESH']
    # Bake hierarchy before fitting all world extents, matching normalizeModel.
    matrices = {o: o.matrix_world.copy() for o in objects}
    rotate = Matrix.Rotation(config['rotationY'], 4, 'Z')
    for o in objects:
        o.parent = None
        o.matrix_world = rotate @ matrices[o]
    bpy.context.view_layer.update()
    points = [o.matrix_world @ Vector(v) for o in objects for v in o.bound_box]
    lo = Vector([min(p[i] for p in points) for i in range(3)])
    hi = Vector([max(p[i] for p in points) for i in range(3)])
    size = hi - lo
    if 'dimensions' in config:
        x, y, z = config['dimensions']
        scale = Vector((x / size.x, z / size.y, y / size.z))
    else:
        scale = Vector((1, 1, 1)) * (config['span'] / max(size.x, size.y))
    center = (lo + hi) / 2
    offset = Vector((-center.x * scale.x, -center.y * scale.y, -lo.z * scale.z))
    x, y, z = config['position']
    transform = Matrix.Translation(Vector((x, -z, y)) + offset) @ Matrix.Diagonal((*scale, 1))
    for o in objects:
        o.matrix_world = transform @ o.matrix_world
    bpy.context.view_layer.update()
    points = [o.matrix_world @ Vector(v) for o in objects for v in o.bound_box]
    report.append({'id': config['id'], 'min': [min(p[i] for p in points) for i in range(3)], 'max': [max(p[i] for p in points) for i in range(3)]})
bpy.ops.mesh.primitive_plane_add(size=24)
floor = bpy.context.object
floor.color = (.38, .41, .43, 1)
scene = bpy.context.scene
scene.render.engine = 'BLENDER_WORKBENCH'
scene.display.shading.light = 'STUDIO'
scene.display.shading.color_type = 'TEXTURE'
scene.display.shading.show_shadows = True
scene.display.shading.show_cavity = True
scene.render.resolution_x = 1400
scene.render.resolution_y = 1000
scene.render.resolution_percentage = 100
cam_data = bpy.data.cameras.new('ReviewCamera')
cam = bpy.data.objects.new('ReviewCamera', cam_data)
bpy.context.collection.objects.link(cam)
scene.camera = cam
cam_data.type = 'ORTHO'
for name, eye, target, span in [('zone', (19, -25, 23), (0, 0, 0), 30), ('gate', (-10, -10, 8), (-4, -2, 0), 14), ('top', (0, 0, 35), (0, 0, 0), 29)]:
    cam.location = Vector(eye)
    cam.rotation_euler = (Vector(target) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    cam_data.ortho_scale = span
    scene.render.filepath = os.path.join(out, name + '.png')
    bpy.ops.render.render(write_still=True)
with open(os.path.join(out, 'zone-bounds.json'), 'w') as f:
    json.dump(report, f, indent=2)
print('ZONE_PREVIEW_OK')
