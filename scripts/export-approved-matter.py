"""Export the evaluated Blender animation without replacing the editable .blend."""
from pathlib import Path
import hashlib
import json
import struct
import bpy
import numpy as np

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'public'/'matter-approved'; OUT.mkdir(parents=True,exist_ok=True)
scene=bpy.context.scene
cloud=bpy.data.objects.get('APPROVED_CONTINUOUS_POINTS')
if cloud is None: raise RuntimeError('Open art/approved-matter.blend before exporting')
manifest=json.loads(scene['approved_manifest'])
modifiers=[(modifier,modifier.show_viewport) for modifier in cloud.modifiers]
for modifier,_ in modifiers: modifier.show_viewport=False
times=np.linspace(0,6,49)
frames=[]
for time in times:
    frame=1+time*100
    scene.frame_set(int(frame),subframe=float(frame-int(frame)))
    bpy.context.view_layer.update()
    evaluated=cloud.evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh=evaluated.to_mesh()
    points=np.empty(len(mesh.vertices)*3,dtype=np.float32)
    mesh.vertices.foreach_get('co',points)
    evaluated.to_mesh_clear()
    points=points.reshape(-1,3)
    if not np.isfinite(points).all(): raise RuntimeError('Nonfinite point position')
    frames.append(points)
poses=np.stack(frames)
count=poses.shape[1]
if count!=28000: raise RuntimeError('Stable topology changed')
# Fixed normalized domain, shared by every pose and variant. Never clip silently.
bound=2.0
if np.abs(poses).max()>=bound: raise RuntimeError('Animation exceeded export domain')
metadata={'format':'APC1','version':1,'duration':6,'samples':times.tolist(),
          'bound':bound,'scenes':manifest,'variants':{},'source':'art/approved-matter.blend',
          'method':scene['method']}
for variant,n in [('desktop',count),('mobile',10000)]:
    data=np.rint(poses[:,:n,:]/bound*32767).astype('<i2')
    payload=struct.pack('<4sIII',b'APC1',len(times),n,6)+data.tobytes()
    digest=hashlib.sha256(payload).hexdigest()[:12]
    filename=f'{variant}-{digest}.bin'
    (OUT/filename).write_bytes(payload)
    metadata['variants'][variant]={'src':f'/matter-approved/{filename}','count':n,'bytes':len(payload)}
    print(f'{variant}: {n} points x {len(times)} samples = {len(payload)} bytes')
(OUT/'manifest.json').write_text(json.dumps(metadata,indent=2),encoding='utf8')
for modifier,visible in modifiers: modifier.show_viewport=visible
scene.frame_set(1)
print('Export complete; editable source preserved.')
