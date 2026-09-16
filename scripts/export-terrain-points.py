"""Sample the edited Blender strata and export WebGL points and a render.

Run: blender -b art/terrain.blend --python scripts/export-terrain-points.py
Point placement follows the saved STRATUM meshes, so edits to the .blend survive.
"""

from pathlib import Path
import struct
import bpy
import numpy as np
from mathutils import Vector

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "matter-lab"
OUT.mkdir(parents=True,exist_ok=True)
bpy.context.preferences.filepaths.save_version=0

def sample_mesh(obj, u, v):
    columns, rows = int(obj["columns"]), int(obj["rows"])
    x, y = min(u*(columns-1),columns-1.000001), min(v*(rows-1),rows-1.000001)
    col, row = int(x), int(y)
    tx, ty = x-col, y-row
    verts = obj.data.vertices
    a = verts[row*columns+col].co
    b = verts[row*columns+col+1].co
    c = verts[(row+1)*columns+col].co
    d = verts[(row+1)*columns+col+1].co
    return obj.matrix_world @ (a*(1-tx)*(1-ty)+b*tx*(1-ty)+c*(1-tx)*ty+d*tx*ty)

strata = sorted((obj for obj in bpy.data.objects if obj.name.startswith("STRATUM_") and obj.type=="MESH"),key=lambda obj:obj.name)
if len(strata)!=4:
    raise RuntimeError("Expected four editable STRATUM meshes")

reference=bpy.data.images.get("terrain.png") or bpy.data.images.load(str(ROOT/"src"/"assets"/"terrain.png"))
width,height=reference.size
pixels=np.empty(width*height*4,dtype=np.float32)
reference.pixels.foreach_get(pixels)
rgb=pixels.reshape(height,width,4)[:,:,:3]
ink=np.max(rgb,axis=2)<.36
blue=(rgb[:,:,2]>.3)&(rgb[:,:,2]>rgb[:,:,0]*2)&(rgb[:,:,2]>rgb[:,:,1]*1.4)&(rgb[:,:,0]<.5)
rows,columns=np.nonzero(ink|blue)
print(f"Reference candidates: {len(rows)} ink/blue pixels")
# Stable, spatially dispersed thinning preserves the authored stipple and silhouette.
hashes=(columns.astype(np.uint64)*73856093)^(rows.astype(np.uint64)*19349663)
order=np.argsort(hashes,kind="stable")

def projected_points(limit):
    points=[]
    for picked in order[:min(limit,len(order))]:
        row,col=int(rows[picked]),int(columns[picked])
        u=col/(width-1)
        image_y=(height-1-row)/(height-1)
        candidates=[]
        for layer,obj in enumerate(strata):
            upper=(.5-sample_mesh(obj,u,0).z/7.4)
            lower=(.5-sample_mesh(obj,u,1).z/7.4)
            v=(image_y-upper)/max(.001,lower-upper)
            if -.05<=v<=1.05:
                candidates.append((abs(v-.35),layer,max(0,min(1,v))))
        if candidates:
            _distance,layer,v=min(candidates)
        else:
            layer=min(range(len(strata)),key=lambda index:abs(image_y-(.5-sample_mesh(strata[index],u,.5).z/7.4)))
            layer_obj=strata[layer]
            upper=.5-sample_mesh(layer_obj,u,0).z/7.4
            lower=.5-sample_mesh(layer_obj,u,1).z/7.4
            v=max(0,min(1,(image_y-upper)/max(.001,lower-upper)))
        sculpted=sample_mesh(strata[layer],u,v)
        accent=int(blue[row,col])
        radius=.013 if accent else .0058
        # Image coordinates preserve the reference; Blender controls their 3D depth.
        points.append(((u-.5)*18,sculpted.y,(.5-image_y)*7.4,radius,accent,layer))
    return points

desktop=projected_points(105000)
mobile=projected_points(38000)

def write_points(name, points):
    with (OUT/name).open("wb") as output:
        output.write(b"MPNT")
        output.write(struct.pack("<I",len(points)))
        for point in points:
            output.write(struct.pack("<ffffBB",*point))
    print(f"{name}: {len(points)} points, {(OUT/name).stat().st_size} bytes")

write_points("terrain-desktop.bin",desktop)
write_points("terrain-mobile.bin",mobile)

old=bpy.data.objects.get("RENDER_PointCloud")
if old:
    bpy.data.objects.remove(old,do_unlink=True)

def emission(name, color):
    mat=bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes=True
    nodes=mat.node_tree.nodes
    nodes.clear()
    out=nodes.new("ShaderNodeOutputMaterial")
    shader=nodes.new("ShaderNodeEmission")
    shader.inputs["Color"].default_value=(*color,1)
    shader.inputs["Strength"].default_value=1
    mat.node_tree.links.new(shader.outputs["Emission"],out.inputs["Surface"])
    return mat

ink=emission("MAT_Ink",(.005,.005,.004))
blue=emission("MAT_Electric",(.031,.09,1))
camera=bpy.context.scene.camera
bpy.context.view_layer.update()
right=camera.matrix_world.to_quaternion() @ Vector((1,0,0))
up=camera.matrix_world.to_quaternion() @ Vector((0,1,0))
verts=[]
faces=[]
flags=[]
for x,y,z,radius,accent,_layer in desktop:
    center=Vector((x,y,z))
    base=len(verts)
    verts.extend(tuple(center+right*dx*radius+up*dy*radius)
                 for dx,dy in [(-1,-1),(1,-1),(1,1),(-1,1)])
    faces.append((base,base+1,base+2,base+3))
    flags.append(accent)
mesh=bpy.data.meshes.new("PointCloud_preview_mesh")
mesh.from_pydata(verts,[],faces)
mesh.materials.append(ink)
mesh.materials.append(blue)
mesh.update()
for polygon,flag in zip(mesh.polygons,flags):
    polygon.material_index=flag
cloud=bpy.data.objects.new("RENDER_PointCloud",mesh)
bpy.context.scene.collection.objects.link(cloud)

world=bpy.context.scene.world
world.use_nodes=True
background=world.node_tree.nodes.get("Background")
background.inputs["Color"].default_value=(.888,.868,.819,1)
background.inputs["Strength"].default_value=1
scene=bpy.context.scene
scene.render.film_transparent=False
scene.render.filepath=str(OUT/"terrain-blender.png")
bpy.ops.render.render(write_still=True)
original_resolution=(scene.render.resolution_x,scene.render.resolution_y)
original_camera=(camera.location.copy(),camera.rotation_euler.copy(),camera.data.ortho_scale)
scene.render.resolution_x=600
scene.render.resolution_y=750
camera.data.ortho_scale=6.28
camera.location.x=4.15
camera.rotation_euler=(Vector((4.15,0,0))-camera.location).to_track_quat("-Z","Y").to_euler()
scene.render.filepath=str(OUT/"terrain-blender-mobile.png")
bpy.ops.render.render(write_still=True)
scene.render.resolution_x,scene.render.resolution_y=original_resolution
camera.location=original_camera[0]
camera.rotation_euler=original_camera[1]
camera.data.ortho_scale=original_camera[2]
scene.render.filepath=str(OUT/"terrain-blender.png")
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/"art"/"terrain.blend"),compress=True)
print(f"Rendered desktop and mobile previews in {OUT}")
