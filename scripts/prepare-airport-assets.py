"""Extract renderable assets and make smaller copies. Never edit source GLBs."""
import bpy, os, json
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, 'public/models/airport-assets')
OUTPUT = os.path.join(SOURCE, 'optimized')
os.makedirs(OUTPUT, exist_ok=True)
report = []

def load(name):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(SOURCE, name))
    for image in bpy.data.images:
        w, h = image.size
        if max(w, h) > 1024:
            ratio = 1024 / max(w, h)
            image.scale(max(1, int(w * ratio)), max(1, int(h * ratio)))

def export(name, objects, budget=30000):
    bpy.ops.object.select_all(action='DESELECT')
    objects = [obj for obj in objects if obj.type == 'MESH' and 'collider' not in obj.name.lower()]
    if not objects: raise ValueError('No mesh for ' + name)
    total = sum(len(obj.data.polygons) for obj in objects)
    for obj in objects:
        obj.select_set(True)
        if total > budget:
            modifier = obj.modifiers.new('WebLOD', 'DECIMATE'); modifier.ratio = budget / total
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.modifier_apply(modifier=modifier.name)
    target = os.path.join(OUTPUT, name + '.glb')
    bpy.ops.export_scene.gltf(filepath=target, export_format='GLB', use_selection=True, export_yup=True, export_apply=True, export_image_format='AUTO')
    report.append({'file': name + '.glb', 'meshes': len(objects), 'polygons': sum(len(o.data.polygons) for o in objects), 'bytes': os.path.getsize(target)})

load('airport_pack_total.glb')
for name, needle in [('terminal', '07.Modulo1'), ('aircraft-static', '18.1.Airplane'), ('baggage-tug', '21.1.BaggageTruck'), ('baggage-cart', '21.2.BaggageTruck'), ('bus', '20.PassengerBus')]:
    export(name, [o for o in bpy.context.scene.objects if needle in o.name])
for source, name, budget in [('airport_jetway.glb', 'jetbridge', 18000), ('airport_stairs.glb', 'stairs', 10000), ('airport_hangar.glb', 'hangar', 10000), ('dumpster.glb', 'dumpster', 6000)]:
    load(source); export(name, list(bpy.context.scene.objects), budget)
with open(os.path.join(OUTPUT, 'manifest.json'), 'w') as file: json.dump(report, file, indent=2)
print('ASSET_PREPARATION_OK', json.dumps(report))
