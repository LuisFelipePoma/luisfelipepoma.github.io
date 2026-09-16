"""New Blender scene, built only from the seven user-approved point-cloud views.

These are editorial 2.5D point sculptures, not inferred watertight back surfaces.
Run once to create the source; export-approved-matter.py exports subsequent edits.
"""
from pathlib import Path
import hashlib
import json
import math
import bpy
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
COUNT = 28000
SCENES = [
    ('terrain', 'src/assets/terrain.png', False),
    ('monitoreo', 'art/concepts/monitoring-pointcloud-v3.png', False),
    ('documentos', 'art/concepts/documents-wave-pointcloud-v1.png', True),
    ('uribe', 'art/concepts/uribe-ascending-pointcloud-v1.png', False),
    ('catmap', 'art/concepts/catmap-mountain-pointcloud-v2.png', False),
    ('about', 'art/concepts/about-knot-pointcloud-v1.png', False),
    ('contact', 'art/concepts/contact-joint-pointcloud-v1.png', False),
]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.preferences.filepaths.save_version = 0
scene = bpy.context.scene
scene.name = 'APPROVED_MATTER_2026'
scene.frame_start, scene.frame_end = 1, 601
scene.render.fps = 30
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x, scene.render.resolution_y = 1200, 800
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.film_transparent = True
scene.view_settings.view_transform = 'Standard'
scene.world = bpy.data.worlds.new('Paper studio')
scene.world.color = (.9, .9, .9)

references = bpy.data.collections.new('01_APPROVED_REFERENCES_PACKED')
poses_collection = bpy.data.collections.new('02_EDITABLE_FINAL_POSES')
animation_collection = bpy.data.collections.new('03_CONTINUOUS_ANIMATION')
for collection in (references, poses_collection, animation_collection):
    scene.collection.children.link(collection)

def morton_order(points):
    """Spatial correspondence established once, never reassigned in the player."""
    q = np.clip(((points[:, [0, 2]] + 1) * 511.5).astype(np.uint32), 0, 1023)
    code = np.zeros(len(points), dtype=np.uint32)
    for bit in range(10):
        code |= ((q[:, 0] >> bit) & 1) << (bit * 2)
        code |= ((q[:, 1] >> bit) & 1) << (bit * 2 + 1)
    return np.argsort(code, kind='stable')

def reconstruct(index, name, path, dark):
    image = bpy.data.images.load(str(ROOT/path), check_existing=True)
    image.pack()
    width, height = image.size
    pixels = np.empty(width*height*4, dtype=np.float32)
    image.pixels.foreach_get(pixels)
    rgb = pixels.reshape(height, width, 4)[:, :, :3]
    luminance = rgb @ np.array([.2126, .7152, .0722], dtype=np.float32)
    # Sample actual ink, not the paper/background. White-on-dark uses the reverse.
    strength = luminance if dark else 1-luminance
    yy, xx = np.nonzero(strength > (.46 if dark else .64))
    if len(xx) < COUNT:
        raise RuntimeError(f'{name}: insufficient visible reference points ({len(xx)})')
    rng = np.random.default_rng(73021+index)
    weights = strength[yy, xx] ** 1.5
    picked = rng.choice(len(xx), COUNT, replace=False, p=weights/weights.sum())
    x, z = xx[picked].astype(float), yy[picked].astype(float)
    # Fit silhouette without anisotropic scaling. Blender and web use the same view.
    lo = np.array([xx.min(), yy.min()]); hi = np.array([xx.max(), yy.max()])
    span = float(max(hi-lo)) / 1.78
    x = (x-(lo[0]+hi[0])/2)/span
    z = (z-(lo[1]+hi[1])/2)/span
    # Authored depth guide per approved view; frontal silhouette remains exact.
    # The relief is deliberately shallow: the approved images do not specify backs.
    depth = [.14, .20, .30, .18, .22, .26, .16][index]
    y = depth * (z*.55 + x*.20)
    if name == 'documentos':
        y += .16*np.sin(x*3.0) * np.exp(-z*z*2)
    elif name == 'catmap':
        y += .06*np.floor((z+.9)*4)
    elif name == 'about':
        y += .12*np.sin(np.arctan2(z, x)*3)
    points = np.column_stack((x,y,z)).astype(np.float32)
    points = points[morton_order(points)]
    reference = bpy.data.objects.new(f'REFERENCE_{index:02d}_{name}', None)
    references.objects.link(reference)
    reference.empty_display_type = 'IMAGE'; reference.data = image
    reference.empty_display_size = 2.2
    reference.location = (index*3.2, 1, 0)
    reference.rotation_euler = (math.pi/2, 0, 0)
    reference.hide_render = True; reference.hide_viewport = True
    return points, {'id':name, 'time':index, 'frame':index*100+1, 'dark':dark,
                    'reference':path, 'referenceSha256':hashlib.sha256((ROOT/path).read_bytes()).hexdigest(),
                    'aspect':float((hi[0]-lo[0])/(hi[1]-lo[1]))}

poses, metadata = [], []
for index, (name, path, dark) in enumerate(SCENES):
    points, entry = reconstruct(index,name,path,dark)
    poses.append(points); metadata.append(entry)

# One shared permutation gives every density a spatially distributed subset.
permutation = np.random.default_rng(991).permutation(COUNT)
poses = [pose[permutation] for pose in poses]
for entry, points in zip(metadata, poses):
    mesh = bpy.data.meshes.new(entry['id']+'_reference_points')
    mesh.from_pydata(points.tolist(), [], [])
    obj = bpy.data.objects.new('POSE_'+entry['id'], mesh)
    poses_collection.objects.link(obj)
    obj.hide_render = True; obj.hide_viewport = True
    obj['reference'] = entry['reference']

mesh = bpy.data.meshes.new('Stable_particle_identity_28000')
mesh.from_pydata(poses[0].tolist(), [], [])
cloud = bpy.data.objects.new('APPROVED_CONTINUOUS_POINTS', mesh)
animation_collection.objects.link(cloud)
bpy.context.view_layer.objects.active = cloud; cloud.select_set(True)
cloud.shape_key_add(name='terrain')
keys = cloud.data.shape_keys
keys.use_relative = False
keys.key_blocks[0].interpolation = 'KEY_CATMULL_ROM'

# Directed bridges: preserve spatial order, loosen the cloud, gather into target.
# These coordinates live in Blender; the front-end never invents this trajectory.
rng = np.random.default_rng(1911)
flow = rng.normal(0,1,(COUNT,3)).astype(np.float32)
flow[:,0] *= .13; flow[:,1] *= .24; flow[:,2] *= .09
for segment in range(6):
    source,target = poses[segment],poses[segment+1]
    for step in (1,2,3,4):
        t = step/4
        s = t*t*(3-2*t)
        envelope = 16*t*t*(1-t)*(1-t)
        bridge = source*(1-s)+target*s+flow*envelope
        # A shared curved current keeps the morph legible rather than a random burst.
        bridge[:,0] += .045*envelope*np.sin(source[:,2]*3+segment*.5)
        bridge[:,2] += .035*envelope*np.cos(source[:,0]*3)
        if step == 4: bridge = target
        name = metadata[segment+1]['id'] if step == 4 else f'{metadata[segment]["id"]}_to_{metadata[segment+1]["id"]}_{step*25:02d}'
        key = cloud.shape_key_add(name=name)
        key.data.foreach_set('co',bridge.ravel())
        key.interpolation = 'KEY_CATMULL_ROM'

keys.eval_time = 0; keys.keyframe_insert('eval_time',frame=1)
keys.eval_time = keys.key_blocks[-1].frame; keys.keyframe_insert('eval_time',frame=601)
# Linear time playback; the authored bridges already contain the easing.
action = keys.animation_data.action
for layer in action.layers:
    for strip in layer.strips:
        for bag in strip.channelbags:
            for curve in bag.fcurves:
                for point in curve.keyframe_points: point.interpolation = 'LINEAR'

material = bpy.data.materials.new('Point ink / paper in Documents')
material.use_nodes = True
nodes = material.node_tree.nodes; nodes.clear()
out = nodes.new('ShaderNodeOutputMaterial')
shader = nodes.new('ShaderNodeEmission')
material.node_tree.links.new(shader.outputs[0],out.inputs['Surface'])
for entry in metadata:
    color = (.888,.868,.819,1) if entry['dark'] else (.0056,.0056,.0048,1)
    shader.inputs['Color'].default_value = color
    shader.inputs['Color'].keyframe_insert('default_value',frame=entry['frame'])

# Editable Geometry Nodes preview; stable mesh vertices are the animation source.
tree = bpy.data.node_groups.new('Point preview - editable radius', 'GeometryNodeTree')
tree.interface.new_socket(name='Geometry',in_out='INPUT',socket_type='NodeSocketGeometry')
tree.interface.new_socket(name='Geometry',in_out='OUTPUT',socket_type='NodeSocketGeometry')
inp = tree.nodes.new('NodeGroupInput'); outp = tree.nodes.new('NodeGroupOutput')
ico = tree.nodes.new('GeometryNodeMeshIcoSphere'); ico.inputs['Radius'].default_value=.00095; ico.inputs['Subdivisions'].default_value=1
setmat = tree.nodes.new('GeometryNodeSetMaterial'); setmat.inputs['Material'].default_value=material
instance = tree.nodes.new('GeometryNodeInstanceOnPoints')
tree.links.new(ico.outputs['Mesh'],setmat.inputs['Geometry'])
tree.links.new(setmat.outputs['Geometry'],instance.inputs['Instance'])
tree.links.new(inp.outputs['Geometry'],instance.inputs['Points'])
tree.links.new(instance.outputs['Instances'],outp.inputs['Geometry'])
modifier = cloud.modifiers.new('Point-cloud render (disable for raw export)','NODES'); modifier.node_group=tree

camera_data = bpy.data.cameras.new('Editorial orthographic')
camera = bpy.data.objects.new('CAMERA_APPROVED',camera_data); scene.collection.objects.link(camera)
camera.location=(0,-6,0); camera.rotation_euler=(math.pi/2,0,0)
camera_data.type='ORTHO'; camera_data.ortho_scale=2.9; scene.camera=camera
for entry in metadata: scene.timeline_markers.new(entry['id'],frame=entry['frame'])
scene['approved_manifest'] = json.dumps(metadata)
scene['method'] = 'Reference-derived 2.5D point sculptures; no inferred rear geometry.'
scene['export_samples_per_transition'] = 8
readme = bpy.data.texts.new('READ_ME')
readme.write('Fresh scene. Approved references are packed. Edit the absolute shape keys on APPROVED_CONTINUOUS_POINTS.\n'
             'Timeline 1..601: seven final poses and 18 editable bridge poses. The point index is identity.\n'
             'Do not change vertex count/order. Geometry Nodes is a preview only.\n'
             'Export edits with: blender -b art/approved-matter.blend --python scripts/export-approved-matter.py\n'
             'These are reference-derived 2.5D sculptures, not watertight reconstructions.\n')
scene.frame_set(1)
for area in bpy.context.screen.areas if bpy.context.screen else []:
    if area.type=='VIEW_3D': area.spaces.active.region_3d.view_perspective='CAMERA'
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'art'/'approved-matter.blend'),compress=True)
print('Created fresh approved-matter.blend: 7 approved views, 25 editable keys, 28000 stable points.')
