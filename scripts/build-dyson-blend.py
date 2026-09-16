"""Build the approved continuous-ring Dyson-inspired scene in Blender 5.2.

The Blender file owns the eight closed ring meshes and their independent
animation. The web export contains local point geometry plus sampled Blender
quaternions; the browser only replays those authored transforms.
"""

from pathlib import Path
import json
import math
import struct

import bpy
import numpy as np
from mathutils import Vector

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'public'/'matter-lab'/'dyson'
BLEND=ROOT/'art'/'dyson-hero.blend'
OUT.mkdir(parents=True,exist_ok=True)
BLEND.parent.mkdir(parents=True,exist_ok=True)
RNG=np.random.default_rng(20260916)
FRAME_START=1
FRAME_END=241
SAMPLE_FRAMES=np.linspace(FRAME_START,FRAME_END,61).round().astype(int)


def continuous_ring_mesh(name,radius,width,thickness,segments=192):
    verts=[]
    # Rectangular architectural section: inner/outer × lower/upper.
    section=[(-width/2,-thickness/2),(width/2,-thickness/2),(width/2,thickness/2),(-width/2,thickness/2)]
    for step in range(segments):
        angle=math.tau*step/segments
        c,s=math.cos(angle),math.sin(angle)
        for radial,z in section:
            verts.append(((radius+radial)*c,(radius+radial)*s,z))
    faces=[]
    for step in range(segments):
        following=(step+1)%segments
        for side in range(4):
            a=step*4+side;b=step*4+(side+1)%4;c=following*4+(side+1)%4;d=following*4+side
            faces.append((a,b,c,d))
    mesh=bpy.data.meshes.new(name+'_MESH')
    mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new(name,mesh)
    return obj


def sample_ring(radius,width,thickness,count,seed):
    rng=np.random.default_rng(seed)
    angle=(np.arange(count)*2.399963229728653+rng.uniform(0,math.tau))%math.tau
    face=np.arange(count)%4
    along=rng.uniform(-1,1,count)
    radial=np.empty(count);z=np.empty(count)
    # Top, outer, bottom and inner faces are all represented continuously.
    top=face==0;outer=face==1;bottom=face==2;inner=face==3
    radial[top]=along[top]*width/2;z[top]=thickness/2
    radial[outer]=width/2;z[outer]=along[outer]*thickness/2
    radial[bottom]=along[bottom]*width/2;z[bottom]=-thickness/2
    radial[inner]=-width/2;z[inner]=along[inner]*thickness/2
    points=np.column_stack(((radius+radial)*np.cos(angle),(radius+radial)*np.sin(angle),z)).astype(np.float32)
    points+=rng.normal(0,.006,points.shape).astype(np.float32)
    return points


def sample_sphere(count,seed):
    rng=np.random.default_rng(seed)
    index=np.arange(count,dtype=np.float32)+.5
    z=1-2*index/count
    radius=np.sqrt(np.maximum(0,1-z*z))
    angle=index*2.399963229728653
    points=np.column_stack((np.cos(angle)*radius,np.sin(angle)*radius,z))*.58
    # A second, sparse inner volume gives the nucleus depth without glow.
    depth=np.where(np.arange(count)%5==0,rng.uniform(.35,.92,count),1)
    return (points*depth[:,None]).astype(np.float32)


bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.context.preferences.filepaths.save_version=0
scene=bpy.context.scene
scene.frame_start=FRAME_START;scene.frame_end=FRAME_END
scene.render.engine='BLENDER_EEVEE'
scene.render.resolution_x=1600;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.world.color=(.888,.868,.819)

material=bpy.data.materials.new('MAT_INK')
material.diffuse_color=(.006,.006,.005,1)

core_collection=bpy.data.collections.new('00_NUCLEUS')
inner_collection=bpy.data.collections.new('01_INNER_CONTINUOUS_RINGS')
outer_collection=bpy.data.collections.new('02_OUTER_CONTINUOUS_RINGS')
scene.collection.children.link(core_collection);scene.collection.children.link(inner_collection);scene.collection.children.link(outer_collection)

bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=5,radius=.58,location=(0,0,0))
core=bpy.context.object;core.name='NUCLEUS'
for collection in list(core.users_collection): collection.objects.unlink(core)
core_collection.objects.link(core);core.data.materials.append(material)

ring_specs=[
    # name, radius, width, thickness, initial Euler, animation delta Euler
    ('INNER_01',1.40,.18,.14,(.15,.05,.05),(1.10,.35,1.85)),
    ('INNER_02',2.05,.18,.14,(1.42,.20,.30),(-.55,1.55,-1.20)),
    ('INNER_03',2.70,.19,.15,(.72,.92,-.28),(1.35,-.70,.85)),
    ('INNER_04',3.35,.20,.15,(-.82,.62,.55),(-1.05,.95,1.30)),
    ('OUTER_01',4.65,.24,.18,(.05,.10,.08),(.75,.40,1.10)),
    ('OUTER_02',5.50,.24,.18,(1.48,.12,.42),(-.55,1.00,-.90)),
    ('OUTER_03',6.35,.25,.19,(.78,.88,-.35),(.90,-.70,.65)),
    ('OUTER_04',7.20,.26,.20,(-.72,.58,.72),(-.80,.65,.90)),
]
rings=[]
for index,(name,radius,width,thickness,initial,delta) in enumerate(ring_specs):
    obj=continuous_ring_mesh(name,radius,width,thickness)
    (inner_collection if index<4 else outer_collection).objects.link(obj)
    obj.data.materials.append(material)
    obj.rotation_mode='XYZ';obj.rotation_euler=initial
    obj.keyframe_insert('rotation_euler',frame=FRAME_START)
    midpoint=tuple(initial[axis]+delta[axis]*.46+(.08 if axis==(index%3) else 0) for axis in range(3))
    obj.rotation_euler=midpoint;obj.keyframe_insert('rotation_euler',frame=121)
    obj.rotation_euler=tuple(initial[axis]+delta[axis] for axis in range(3));obj.keyframe_insert('rotation_euler',frame=FRAME_END)
    obj['layer']='inner' if index<4 else 'outer';obj['continuous_loop']=True;obj['radius']=radius
    rings.append(obj)

# Camera and explicit spacing metadata make the authored composition reviewable.
camera_data=bpy.data.cameras.new('CAMERA_EDITORIAL_DATA')
camera=bpy.data.objects.new('CAMERA_EDITORIAL',camera_data);scene.collection.objects.link(camera)
camera.location=(0,-18,3.4)
camera.rotation_euler=(Vector((0,0,0))-camera.location).to_track_quat('-Z','Y').to_euler()
camera_data.type='ORTHO';camera_data.ortho_scale=17.2
scene.camera=camera

scene['matter_scene']='dyson_continuous_rings'
scene['ring_count']=8
scene['spacing']='inner radii 1.40/2.05/2.70/3.35; outer radii 4.65/5.50/6.35/7.20'

bpy.ops.wm.save_as_mainfile(filepath=str(BLEND),compress=True)

# Capture Blender's evaluated animation as quaternions. Browser interpolation is
# only between these dense authored samples.
tracks={obj.name:[] for obj in rings}
for frame in SAMPLE_FRAMES:
    scene.frame_set(int(frame));bpy.context.view_layer.update()
    for obj in rings:
        q=obj.matrix_world.to_quaternion().normalized()
        tracks[obj.name].append([q.x,q.y,q.z,q.w])
scene.frame_set(FRAME_START)

metadata={
    'format':'DYPC/1','duration':1,'frameStart':FRAME_START,'frameEnd':FRAME_END,
    'sampleFrames':SAMPLE_FRAMES.tolist(),'tracks':tracks,'groups':[],
    'variants':{},'palette':{'paper':'#f2efe7','ink':'#11110f'},
}

def build_groups(variant):
    if variant=='desktop':
        core_count,inner_count,outer_count=4000,4500,5500
    else:
        core_count,inner_count,outer_count=1600,1700,2900
    groups=[('NUCLEUS',sample_sphere(core_count,11),'core')]
    for index,(name,radius,width,thickness,_initial,_delta) in enumerate(ring_specs):
        count=inner_count if index<4 else outer_count
        groups.append((name,sample_ring(radius,width,thickness,count,100+index),'inner' if index<4 else 'outer'))
    return groups

def write_variant(variant):
    groups=build_groups(variant)
    destination=OUT/f'dyson-{variant}.bin'
    group_meta=[];offset=0
    with destination.open('wb') as output:
        output.write(struct.pack('<4sHHII',b'DYPC',1,len(groups),sum(len(points) for _name,points,_layer in groups),8))
        for name,points,layer in groups:
            minimum=points.min(axis=0);maximum=points.max(axis=0)
            span=np.maximum(maximum-minimum,1e-5)
            quantized=np.clip(np.round(((points-minimum)/span*2-1)*32767),-32767,32767).astype('<i2')
            size=np.full(len(points),54 if layer=='core' else (48 if layer=='inner' else 44),dtype=np.uint8)
            opacity=np.full(len(points),255,dtype=np.uint8)
            record=np.empty(len(points),dtype=np.dtype([('x','<i2'),('y','<i2'),('z','<i2'),('size','u1'),('opacity','u1')]))
            record['x'],record['y'],record['z']=quantized[:,0],quantized[:,1],quantized[:,2]
            record['size'],record['opacity']=size,opacity
            output.write(record.tobytes())
            group_meta.append({'id':name,'layer':layer,'count':len(points),'offset':offset,'bounds':np.column_stack((minimum,maximum)).tolist()})
            offset+=len(points)
    metadata['variants'][variant]={'src':f'/matter-lab/dyson/{destination.name}','pointCount':offset,'bytes':destination.stat().st_size,'groups':group_meta}

write_variant('desktop');write_variant('mobile')
(OUT/'dyson.json').write_text(json.dumps(metadata,indent=2),encoding='utf-8')
print(f'Saved {BLEND}')
print(json.dumps(metadata['variants'],indent=2))
