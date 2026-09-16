"""Build the authored portfolio point animation and its web caches in Blender 5.2.

The saved .blend owns the complete point topology and every authored pose. The
browser receives sampled shape-key states and only interpolates between them.

Run from the repository root:
  blender -b --python scripts/build-portfolio-matter.py
"""

from pathlib import Path
import json
import math
import struct

import bpy
import numpy as np


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "public" / "matter-lab" / "terrain-desktop.bin"
OUT = ROOT / "public" / "matter-lab"
BLEND = ROOT / "art" / "portfolio-matter.blend"
DESKTOP_COUNT = 44369
MOBILE_COUNT = 24000
BOUNDS = np.array([[-10.0, 10.0], [-4.0, 4.0], [-5.0, 5.0]], dtype=np.float32)
RNG = np.random.default_rng(20260916)


def read_terrain():
    data = SOURCE.read_bytes()
    if data[:4] != b"MPNT":
        raise RuntimeError("Generate the approved terrain export first")
    count = struct.unpack_from("<I", data, 4)[0]
    points = np.empty((count, 3), dtype=np.float32)
    for index in range(count):
        x, y, z, _size, _accent, _layer = struct.unpack_from("<ffffBB", data, 8 + index * 18)
        points[index] = (x, y, z)
    if count < DESKTOP_COUNT:
        raise RuntimeError(f"Terrain has {count} points; expected at least {DESKTOP_COUNT}")
    return points[:DESKTOP_COUNT]


def morton_order(points):
    normalized = (points[:, [0, 2]] - np.array([-10.0, -5.0])) / np.array([20.0, 10.0])
    cells = np.clip((normalized * 1023).astype(np.uint32), 0, 1023)

    def split(value):
        value &= 0x0000FFFF
        value = (value | (value << 8)) & 0x00FF00FF
        value = (value | (value << 4)) & 0x0F0F0F0F
        value = (value | (value << 2)) & 0x33333333
        return (value | (value << 1)) & 0x55555555

    code = split(cells[:, 0]) | (split(cells[:, 1]) << 1)
    return np.argsort(code, kind="stable")


def match_to_master(points):
    return points[morton_order(points)]


def allocate(weights, count):
    raw = np.asarray(weights, dtype=np.float64)
    raw = raw / raw.sum() * count
    result = np.floor(raw).astype(int)
    result[: count - result.sum()] += 1
    return result


def stroke(path, count, width=.035, depth=0.0, rng=RNG):
    path = np.asarray(path, dtype=np.float32)
    lengths = np.linalg.norm(np.diff(path[:, [0, 2]], axis=0), axis=1)
    chosen = rng.choice(len(lengths), count, p=lengths / lengths.sum())
    t = rng.random(count).astype(np.float32)
    start, end = path[chosen], path[chosen + 1]
    points = start + (end - start) * t[:, None]
    tangent = end[:, [0, 2]] - start[:, [0, 2]]
    tangent /= np.maximum(np.linalg.norm(tangent, axis=1)[:, None], 1e-5)
    normal = np.column_stack((-tangent[:, 1], tangent[:, 0]))
    offset = rng.normal(0, width, count)
    points[:, 0] += normal[:, 0] * offset
    points[:, 2] += normal[:, 1] * offset
    points[:, 1] += rng.normal(depth, max(width * .8, .015), count)
    return points


def ellipse(center, radii, count, start=0.0, end=math.tau, width=.035, depth=0.0, rng=RNG):
    angles = rng.uniform(start, end, count)
    path = np.column_stack((
        center[0] + np.cos(angles) * radii[0],
        np.full(count, center[1] + depth),
        center[2] + np.sin(angles) * radii[1],
    )).astype(np.float32)
    path[:, 0] += rng.normal(0, width, count)
    path[:, 2] += rng.normal(0, width, count)
    path[:, 1] += rng.normal(0, width, count)
    return path


def quad(corners, count, edge_share=.55, depth=0.0, rng=RNG):
    corners = np.asarray(corners, dtype=np.float32)
    edge_count = int(count * edge_share)
    fill_count = count - edge_count
    edges = np.vstack([stroke([corners[i], corners[(i + 1) % 4]], edge_count // 4 + (i < edge_count % 4), .025, depth, rng) for i in range(4)])
    u, v = rng.random(fill_count), rng.random(fill_count)
    fill = ((1-u)[:,None]*(1-v)[:,None]*corners[0] + u[:,None]*(1-v)[:,None]*corners[1]
            + u[:,None]*v[:,None]*corners[2] + (1-u)[:,None]*v[:,None]*corners[3])
    fill[:,1] += rng.normal(depth, .035, fill_count)
    return np.vstack((edges, fill)).astype(np.float32)


def from_weighted(parts, weights, count):
    counts = allocate(weights, count)
    points = [factory(int(amount)) for factory, amount in zip(parts, counts)]
    return match_to_master(np.vstack(points)[:count])


def monitoring(count):
    parts, weights = [], []
    nodes = [(-6.8, 0, 2.15), (-7.2, 0, -.1), (-5.8, 0, -2.0), (-3.9, 0, 1.0)]
    for index, node in enumerate(nodes):
        parts.extend([
            lambda n, c=node, i=index: ellipse(c, (1.0-.1*i, .55), n, width=.045, depth=.22*i),
            lambda n, c=node: stroke([(c[0],0,c[2]-.55),(c[0],0,c[2]+.55)], n, .035),
        ])
        weights.extend([1.2, .35])
    spine=[(-3.3,0,-2.4),(-2.2,-.2,-1.35),(-1.2,.1,.1),(.1,-.15,.7),(1.4,.1,.65),(2.25,0,1.45)]
    parts.extend([lambda n: stroke(spine,n,.06),lambda n: stroke([(p[0],.55,p[2]-.42) for p in spine],n,.04)])
    weights.extend([2.0,1.15])
    panels=[[(3.1,0,2.6),(8.3,0,2.6),(8.3,0,.25),(3.1,0,.25)],[(3.7,.65,-.15),(7.65,.65,-.15),(7.65,.65,-2.65),(3.7,.65,-2.65)]]
    for panel in panels:
        parts.append(lambda n,p=panel: quad(p,n,.72)); weights.append(2.2)
    parts.extend([
        lambda n: stroke([(3.55,0,.85),(4.5,0,1.45),(5.2,0,.95),(6.15,0,1.9),(7.65,0,1.25)],n,.045),
        lambda n: stroke([(4.1,.65,-2.0),(4.9,.65,-1.35),(5.8,.65,-1.8),(6.55,.65,-.9),(7.2,.65,-1.45)],n,.045),
    ])
    weights.extend([1.15,1.0])
    return from_weighted(parts,weights,count)


def documents(count):
    paper=[(-7.4,0,3.05),(-.5,0,2.45),(.25,0,-2.65),(-6.6,0,-3.2)]
    fold=[(-.5,0,2.45),(.25,0,-2.65),(1.25,.65,-1.8),(.75,.65,1.65)]
    parts=[lambda n: quad(paper,n,.48),lambda n: quad(fold,n,.68)]
    weights=[4.1,1.3]
    for z,short in [(1.75,False),(1.1,True),(.25,False),(-.45,True),(-1.2,False),(-2.0,True)]:
        end=-2.4 if short else -1.1
        parts.append(lambda n,z=z,e=end: stroke([(-5.85,-.1,z),(e,-.1,z+.22)],n,.035)); weights.append(.45)
    blocks=[[(2.3,.3,2.4),(8.1,.3,2.4),(8.1,.3,1.35),(2.3,.3,1.35)],[(2.75,.1,.7),(6.7,.1,.7),(6.7,.1,-.15),(2.75,.1,-.15)],[(3.35,-.1,-.85),(8.45,-.1,-.85),(8.45,-.1,-2.45),(3.35,-.1,-2.45)]]
    for panel in blocks:
        parts.append(lambda n,p=panel: quad(p,n,.78)); weights.append(1.2)
    parts.append(lambda n: stroke([(-7.8,-.6,3.55),(-6.8,-.6,3.78),(-4.0,-.6,3.55),(-1.0,-.6,3.15),(1.1,-.6,2.3),(3.0,-.6,1.1),(5.4,-.6,.25),(8.6,-.6,-.05)],n,.055))
    weights.append(1.25)
    return from_weighted(parts,weights,count)


def uribe(count):
    panels=[
        ([(-8.5,1.2,2.65),(-1.0,1.2,3.0),(-1.0,1.2,-2.0),(-8.5,1.2,-2.35)],2.9),
        ([(-3.8,0,3.25),(4.0,0,2.7),(4.0,0,-2.45),(-3.8,0,-2.9)],3.9),
        ([(1.3,-1.1,2.15),(8.7,-1.1,1.45),(8.7,-1.1,-3.0),(1.3,-1.1,-2.35)],2.8),
    ]
    parts=[]; weights=[]
    for corners,weight in panels:
        parts.append(lambda n,c=corners: quad(c,n,.47)); weights.append(weight)
        top_left,top_right,bottom_right,bottom_left=corners
        z=(top_left[2]*.7+bottom_left[2]*.3)
        parts.append(lambda n,a=top_left,b=top_right,z=z: stroke([(a[0]+.45,a[1]-.05,z),(b[0]-.45,b[1]-.05,z)],n,.035));weights.append(.55)
    parts.extend([
        lambda n: quad([(-2.9,-.05,1.7),(3.1,-.05,1.3),(3.1,-.05,.1),(-2.9,-.05,.45)],n,.35),
        lambda n: stroke([(-2.8,-.1,-.55),(-.5,-.1,-.7),(1.1,-.1,-.55),(3.0,-.1,-.75)],n,.05),
        lambda n: stroke([(2.0,-1.15,.2),(4.0,-1.15,-.05),(6.0,-1.15,-.1),(7.8,-1.15,-.45)],n,.05),
    ])
    weights.extend([1.1,.55,.55])
    return from_weighted(parts,weights,count)


def catmap(count):
    paths=[
        [(-9,1.2,2.8),(-7,1.2,2.25),(-5.2,1.2,2.5),(-3,1.2,1.65),(-1,1.2,1.8),(1,1.2,1.15),(3.2,1.2,1.5),(5.5,1.2,.65),(9,1.2,.9)],
        [(-9,.7,1.7),(-7,.7,1.15),(-5,.7,1.5),(-3,.7,.6),(-1,.7,.85),(1,.7,.15),(3,.7,.55),(5.5,.7,-.35),(9,.7,-.05)],
        [(-9,.2,.65),(-7,.2,.0),(-5,.2,.4),(-3,.2,-.55),(-1,.2,-.25),(1,.2,-1.0),(3,.2,-.5),(5.5,.2,-1.4),(9,.2,-1.1)],
        [(-9,-.4,-.45),(-7,-.4,-1.0),(-5,-.4,-.65),(-3,-.4,-1.65),(-1,-.4,-1.35),(1,-.4,-2.1),(3,-.4,-1.7),(5.5,-.4,-2.55),(9,-.4,-2.25)],
        [(-9,-1,-1.55),(-7,-1,-2.1),(-5,-1,-1.8),(-3,-1,-2.75),(-1,-1,-2.55),(1,-1,-3.15),(3,-1,-2.9),(5.5,-1,-3.5),(9,-1,-3.25)],
    ]
    parts=[lambda n,p=p: stroke(p,n,.075) for p in paths]
    weights=[2.0,2.1,2.1,2.0,1.8]
    for x in (-6.5,-1.2,4.6,7.2):
        parts.extend([lambda n,x=x: stroke([(x,-1.2,3.2),(x,-1.2,-3.45)],n,.055),lambda n,x=x: ellipse((x,-1.25,3.25),(.34,.2),n,width=.035)])
        weights.extend([.48,.22])
    parts.append(lambda n: stroke([(-.8,-1.6,3.5),(.1,-1.6,1.2),(1.1,-1.6,-.1),(1.9,-1.6,-3.5)],n,.085));weights.append(1.2)
    return from_weighted(parts,weights,count)


def about(count):
    # Explicit block-letter contours: L, F and P share one editorial baseline.
    letters=[
        [[(-8,0,3),(-8,0,-3),(-3.8,0,-3)]],
        [[(-2.8,0,-3),(-2.8,0,3),(1.5,0,3)],[(-2.8,0,.35),(.7,0,.35)]],
        [[(2.2,0,-3),(2.2,0,3),(5.8,0,3),(7.4,0,2.2),(7.4,0,.65),(5.8,0,-.15),(2.2,0,-.15)]],
    ]
    parts=[];weights=[]
    for letter in letters:
        for path in letter:
            parts.append(lambda n,p=path: stroke(p,n,.22));weights.append(sum(np.linalg.norm(np.diff(np.asarray(path)[:,[0,2]],axis=0),axis=1)))
    # Offset outlines give the monogram genuine volume rather than a single wire.
    for offset in (-.42,.42):
        parts.extend([
            lambda n,o=offset: stroke([(-8+o,.55,3),(-8+o,.55,-3),(-3.8,.55,-3)],n,.07),
            lambda n,o=offset: stroke([(-2.8+o,.55,-3),(-2.8+o,.55,3),(1.5,.55,3)],n,.07),
            lambda n,o=offset: stroke([(2.2+o,.55,-3),(2.2+o,.55,3),(5.8+o,.55,3),(7.4+o,.55,2.2),(7.4+o,.55,.65),(5.8+o,.55,-.15),(2.2+o,.55,-.15)],n,.07),
        ]);weights.extend([2.2,2.2,3.0])
    return from_weighted(parts,weights,count)


def contact(count):
    origins=[(-8.6,0,-.2),(-7.9,.2,.45),(-8.2,-.2,-.95)]
    destinations=[(8.7,0,3.0),(8.4,.3,1.85),(9,-.2,.55),(8.5,.4,-.75),(8.8,-.3,-2.2),(7.7,.1,-3.2)]
    parts=[];weights=[]
    for index,dest in enumerate(destinations):
        origin=origins[index%len(origins)]
        bend=(-2.8+(index%2)*1.4, (-1)**index*.7, dest[2]*.2+(-1)**index*1.15)
        second=(2.2, -.4+index*.14, dest[2]*.72)
        parts.append(lambda n,p=[origin,bend,second,dest]: stroke(p,n,.065));weights.append(1.6)
        parts.append(lambda n,c=dest: ellipse(c,(.42,.24),n,width=.045));weights.append(.28)
    parts.extend([
        lambda n: ellipse((-8.25,0,-.2),(1.2,1.0),n,start=-1.1,end=1.1,width=.07),
        lambda n: ellipse((.4,1.2,0),(4.2,3.25),n,start=-1.2,end=1.18,width=.055),
    ]);weights.extend([.8,1.3])
    return from_weighted(parts,weights,count)


def scatter_from(terrain):
    result=terrain.copy()
    phase=np.arange(len(result),dtype=np.float32)*2.3999632
    result[:,0]=terrain[:,0]*.92+np.cos(phase)*.9
    result[:,1]=np.sin(phase*.37)*2.3
    result[:,2]=-1.0+terrain[:,2]*.08+np.sin(phase)*1.55
    return result


def bridge(a,b,index):
    phase=np.arange(len(a),dtype=np.float32)*2.3999632+index*.71
    result=(a+b)*.5
    travel=np.linalg.norm(b[:,[0,2]]-a[:,[0,2]],axis=1)
    result[:,0]+=np.cos(phase*.31)*(.18+np.minimum(travel*.045,.55))
    result[:,1]+=np.sin(phase*.19)*1.05+(index%3-1)*.18
    result[:,2]+=(.75+np.sin(phase)*.34)*(1-np.minimum(np.abs(result[:,0])/11,1))
    return result


def attributes(points, scene_id, bridge_frame=False):
    n=len(points)
    size=np.clip((1.0+(np.arange(n)*.61803398875%1)*.75)*52,1,255).astype(np.uint8)
    accent=np.zeros(n,dtype=np.uint8)
    if scene_id=="terrain": accent[np.argsort(points[:,2])[-max(12,n//220):]]=255
    elif scene_id=="monitoring":
        anchors=np.array([[-6.8,2.15],[-7.2,-.1],[-5.8,-2],[2.25,1.45],[8.1,2.4]],dtype=np.float32)
        distance=np.min(np.stack([np.sum((points[:,[0,2]]-anchor)**2,axis=1) for anchor in anchors]),axis=0)
        accent[distance<.07]=255
    elif scene_id=="documents": accent[(points[:,0]>.8)&(np.abs(points[:,2])<2.7)&((np.arange(n)%37)<2)]=255
    elif scene_id=="uribe": accent[((points[:,0]>-4)&(points[:,0]<4))&(np.arange(n)%89==0)]=255
    elif scene_id=="catmap": accent[(np.abs(points[:,0]+1.2)<.12)|(np.abs(points[:,0]-4.6)<.12)]=255
    elif scene_id=="about": accent[(points[:,0]>1.8)&(np.arange(n)%53==0)]=255
    elif scene_id=="contact": accent[(points[:,0]>7.4)&(np.arange(n)%13==0)]=255
    if accent.sum()/255>n*.025:
        ids=np.flatnonzero(accent)[:int(n*.025)]
        accent.fill(0);accent[ids]=255
    opacity=np.full(n,255,dtype=np.uint8)
    if bridge_frame:
        opacity[(np.arange(n)+np.arange(n)//7)%5==0]=150
    return size,accent,opacity


terrain=read_terrain()
terrain=terrain[morton_order(terrain)]
scenes=[
    ("terrain",terrain,"light"),
    ("monitoring",monitoring(DESKTOP_COUNT),"light"),
    ("documents",documents(DESKTOP_COUNT),"dark"),
    ("uribe",uribe(DESKTOP_COUNT),"light"),
    ("catmap",catmap(DESKTOP_COUNT),"light"),
    ("about",about(DESKTOP_COUNT),"light"),
    ("contact",contact(DESKTOP_COUNT),"light"),
]
scatter=scatter_from(terrain)
frames=[{"id":"scatter","scene":"scatter","kind":"scene","time":0.0,"theme":"light","points":scatter}]
previous=scatter
for index,(scene_id,points,theme) in enumerate(scenes):
    frames.append({"id":f"to-{scene_id}","scene":scene_id,"kind":"bridge","time":index+.5,"theme":theme,"points":bridge(previous,points,index)})
    frames.append({"id":scene_id,"scene":scene_id,"kind":"scene","time":index+1.0,"theme":theme,"points":points})
    previous=points

# Reset and build a directly editable shape-key animation.
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
for collection in list(bpy.data.collections):
    if collection.name != "Collection": bpy.data.collections.remove(collection)
bpy.context.preferences.filepaths.save_version=0
scene=bpy.context.scene
scene.render.engine="BLENDER_EEVEE"
scene.frame_start=1
scene.frame_end=(len(frames)-1)*20+1
mesh=bpy.data.meshes.new("Portfolio_Matter_Mesh")
mesh.from_pydata([tuple(p) for p in frames[0]["points"]],[],[])
mesh.update()
cloud=bpy.data.objects.new("PORTFOLIO_MATTER_EDITABLE",mesh)
scene.collection.objects.link(cloud)
cloud.show_name=True
cloud.display_type="WIRE"
bpy.context.view_layer.objects.active=cloud
cloud.select_set(True)
basis=cloud.shape_key_add(name="00_SCATTER",from_mix=False)
basis.interpolation="KEY_LINEAR"
for index,frame in enumerate(frames[1:],start=1):
    key=cloud.shape_key_add(name=f"{index:02d}_{frame['id'].upper()}",from_mix=False)
    key.data.foreach_set("co",frame["points"].astype(np.float32).reshape(-1))
    key.interpolation="KEY_LINEAR"
cloud.data.shape_keys.use_relative=False
cloud.data.shape_keys.eval_time=0
cloud.data.shape_keys.keyframe_insert("eval_time",frame=1)
cloud.data.shape_keys.eval_time=cloud.data.shape_keys.key_blocks[-1].frame
cloud.data.shape_keys.keyframe_insert("eval_time",frame=scene.frame_end)
cloud["matter_format"]="PMAT/1"
cloud["point_count"]=DESKTOP_COUNT
cloud["scene_order"]=json.dumps([item[0] for item in scenes])
cloud["authored_frames"]=json.dumps([{k:v for k,v in frame.items() if k!="points"} for frame in frames])

# Two explicit cameras and their safe-area frames live in the file for art direction.
for name,location,scale in [("CAMERA_DESKTOP",(0,-26,2),19.0),("CAMERA_MOBILE",(0,-26,2),9.2)]:
    camera_data=bpy.data.cameras.new(name+"_DATA")
    camera=bpy.data.objects.new(name,camera_data)
    scene.collection.objects.link(camera)
    camera.location=location
    camera.rotation_euler=((np.array([location[0],0,0])-np.array(location))).tolist()
    camera.rotation_euler=(math.radians(82),0,0)
    camera_data.type="ORTHO";camera_data.ortho_scale=scale
scene.camera=bpy.data.objects["CAMERA_DESKTOP"]

BLEND.parent.mkdir(parents=True,exist_ok=True)
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND),compress=True)

metadata={
    "format":"PMAT/1","pointStride":9,"bounds":BOUNDS.tolist(),
    "duration":7.0,
    "scenes":[{"id":scene_id,"time":index+1,"theme":theme,"frame":index*2+2} for index,(scene_id,_points,theme) in enumerate(scenes)],
    "frames":[{k:v for k,v in frame.items() if k!="points"} for frame in frames],
    "variants":{},
}
permutation=np.argsort((np.arange(DESKTOP_COUNT,dtype=np.uint64)*11400714819323198485)&0xFFFFFFFFFFFFFFFF)

def write_variant(name,count):
    selected=permutation[:count]
    destination=OUT/f"portfolio-matter-{name}.bin"
    with destination.open("wb") as output:
        output.write(struct.pack("<4sHHII",b"PMAT",1,len(frames),count,9))
        for frame in frames:
            points=frame["points"][selected].copy()
            if name=="mobile":
                points[:,0]*=.38
                points[:,2]*=.9
            normalized=(points-BOUNDS[:,0])/(BOUNDS[:,1]-BOUNDS[:,0])*2-1
            quantized=np.clip(np.round(normalized*32767),-32767,32767).astype("<i2")
            size,accent,opacity=attributes(points,frame["scene"],frame["kind"]=="bridge")
            record=np.empty(count,dtype=np.dtype([("x","<i2"),("y","<i2"),("z","<i2"),("size","u1"),("accent","u1"),("opacity","u1")]))
            record["x"],record["y"],record["z"]=quantized[:,0],quantized[:,1],quantized[:,2]
            record["size"],record["accent"],record["opacity"]=size,accent,opacity
            output.write(record.tobytes())
    metadata["variants"][name]={"src":f"/matter-lab/{destination.name}","pointCount":count,"bytes":destination.stat().st_size}

write_variant("desktop",DESKTOP_COUNT)
write_variant("mobile",MOBILE_COUNT)
(OUT/"portfolio-matter.json").write_text(json.dumps(metadata,indent=2),encoding="utf-8")
print(f"Saved {BLEND}")
print(json.dumps(metadata["variants"],indent=2))
