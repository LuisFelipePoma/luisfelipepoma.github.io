"""Create an editable, art-directed terrain model from traced reference contours.

Run with Blender 5.2: blender -b --python scripts/build-terrain-blend.py
The control points below trace the existing terrain.png; no procedural noise defines
the silhouette. Edit the STRATUM meshes in the saved .blend, then re-export points.
"""

from pathlib import Path
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "art" / "terrain.blend"
REFERENCE = ROOT / "src" / "assets" / "terrain.png"

# (horizontal position, height in the reference image), traced from left to right.
STRATA = [
    {
        "name": "STRATUM_01_DISTANCE", "depth": 2.0,
        "crest": [(0,.82),(.08,.79),(.18,.78),(.28,.73),(.37,.66),(.44,.56),(.52,.45),(.58,.51),(.66,.47),(.73,.34),(.79,.29),(.85,.20),(.89,.26),(.96,.34),(1,.35)],
        "foot": [(0,.95),(.12,.94),(.24,.89),(.38,.88),(.52,.77),(.65,.75),(.79,.65),(.90,.67),(1,.68)],
    },
    {
        "name": "STRATUM_02_MIDDLE", "depth": 0.65,
        "crest": [(0,.83),(.09,.81),(.20,.76),(.29,.79),(.38,.70),(.44,.62),(.52,.65),(.62,.65),(.70,.52),(.78,.43),(.85,.37),(.91,.40),(1,.47)],
        "foot": [(0,.94),(.12,.94),(.25,.91),(.38,.91),(.52,.84),(.66,.83),(.79,.75),(.91,.76),(1,.80)],
    },
    {
        "name": "STRATUM_03_NEAR", "depth": -0.6,
        "crest": [(0,.87),(.10,.85),(.20,.83),(.30,.78),(.40,.78),(.48,.72),(.58,.64),(.66,.68),(.76,.71),(.85,.59),(.92,.55),(1,.62)],
        "foot": [(0,.98),(.15,.97),(.31,.96),(.46,.94),(.60,.90),(.75,.91),(.90,.85),(1,.87)],
    },
    {
        "name": "STRATUM_04_FOREGROUND", "depth": -1.9,
        "crest": [(0,.89),(.12,.87),(.22,.86),(.34,.84),(.43,.80),(.52,.72),(.61,.70),(.70,.73),(.79,.80),(.88,.76),(.95,.73),(1,.74)],
        "foot": [(0,1.03),(.14,1.03),(.30,1.02),(.45,1.00),(.61,.97),(.76,1.00),(.89,.94),(1,.94)],
    },
]

def catmull(points, x):
    for index in range(len(points) - 1):
        a, b = points[index], points[index + 1]
        if a[0] <= x <= b[0]:
            before = points[max(0,index - 1)]
            after = points[min(len(points) - 1,index + 2)]
            t = (x - a[0]) / (b[0] - a[0])
            # Hermite interpolation through hand-traced heights.
            m0 = (b[1] - before[1]) / (b[0] - before[0]) * (b[0] - a[0])
            m1 = (after[1] - a[1]) / (after[0] - a[0]) * (b[0] - a[0])
            return ((2*t**3 - 3*t**2 + 1)*a[1]
                    + (t**3 - 2*t**2 + t)*m0
                    + (-2*t**3 + 3*t**2)*b[1]
                    + (t**3 - t**2)*m1)
    return points[0][1] if x < points[0][0] else points[-1][1]

def world_point(u, v, crest, foot, depth):
    image_y = catmull(crest,u) * (1-v) + catmull(foot,u) * v
    return ((u-.5)*18, depth-v*.9, (.5-image_y)*7.4)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
bpy.context.preferences.filepaths.save_version=0
scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 1600
scene.render.resolution_y = 660
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.world.color = (.882,.867,.824)
scene.view_settings.view_transform = "Standard"

for stratum in STRATA:
    cols, rows = 180, 34
    verts = []
    faces = []
    for row in range(rows):
        v = row/(rows-1)
        for col in range(cols):
            verts.append(world_point(col/(cols-1),v,stratum["crest"],stratum["foot"],stratum["depth"]))
    for row in range(rows-1):
        for col in range(cols-1):
            a = row*cols+col
            faces.append((a,a+1,a+cols+1,a+cols))
    mesh = bpy.data.meshes.new(stratum["name"] + "_mesh")
    mesh.from_pydata(verts,[],faces)
    mesh.update()
    obj = bpy.data.objects.new(stratum["name"],mesh)
    scene.collection.objects.link(obj)
    obj["columns"] = cols
    obj["rows"] = rows
    obj["stratum_depth"] = stratum["depth"]
    obj.hide_render = True
    obj.display_type = "WIRE"

    # Editable contour guide, separate from the sampled surface.
    guide = bpy.data.curves.new(stratum["name"] + "_crest", "CURVE")
    guide.dimensions = "3D"
    spline = guide.splines.new("POLY")
    spline.points.add(len(stratum["crest"])-1)
    for point, (u, y) in zip(spline.points,stratum["crest"]):
        point.co = ((u-.5)*18,stratum["depth"],(.5-y)*7.4,1)
    guide_obj = bpy.data.objects.new(stratum["name"] + "_GUIDE",guide)
    scene.collection.objects.link(guide_obj)
    guide_obj.hide_render = True

image = bpy.data.images.load(str(REFERENCE),check_existing=True)
reference = bpy.data.objects.new("REFERENCE_terrain_png",None)
scene.collection.objects.link(reference)
reference.empty_display_type = "IMAGE"
reference.data = image
reference.empty_display_size = 18
reference.location = (0,3,0)
reference.rotation_euler = (1.5707963268,0,0)
reference.hide_render = True

camera_data = bpy.data.cameras.new("Editorial orthographic camera")
camera = bpy.data.objects.new("CAMERA_Editorial",camera_data)
scene.collection.objects.link(camera)
camera.location = (0,-26,2.0)
target = Vector((0,0,0))
camera.rotation_euler = (target-Vector(camera.location)).to_track_quat("-Z","Y").to_euler()
camera_data.type = "ORTHO"
camera_data.ortho_scale = 19
scene.camera = camera

OUT.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT),compress=True)
print(f"Saved editable model: {OUT}")
