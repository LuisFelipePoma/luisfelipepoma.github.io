"""Render seven final point poses with Blender (transparent PNG fallbacks)."""
from pathlib import Path
import json
import bpy

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'public'/'matter-approved'; OUT.mkdir(parents=True,exist_ok=True)
scene=bpy.context.scene
scene.render.engine='BLENDER_EEVEE'
scene.render.film_transparent=True
scene.render.image_settings.color_mode='RGBA'
for node in bpy.data.node_groups['Point preview - editable radius'].nodes:
    if node.bl_idname=='GeometryNodeMeshIcoSphere':node.inputs['Radius'].default_value=.00095
if hasattr(scene,'eevee') and hasattr(scene.eevee,'taa_render_samples'):
    scene.eevee.taa_render_samples=16
manifest=json.loads(scene['approved_manifest'])
for entry in manifest:
    scene.frame_set(entry['frame'])
    aspect=entry['aspect']
    if aspect>=1:
        scene.render.resolution_x=1100
        scene.render.resolution_y=max(320,round(1100/aspect))
    else:
        scene.render.resolution_y=1100
        scene.render.resolution_x=max(320,round(1100*aspect))
    scene.camera.data.ortho_scale=1.94
    scene.render.filepath=str(OUT/(entry['id']+'.png'))
    bpy.ops.render.render(write_still=True)
    print('Rendered '+entry['id'],flush=True)
