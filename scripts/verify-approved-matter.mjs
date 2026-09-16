import {readFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const manifest=JSON.parse(await readFile('public/matter-approved/manifest.json','utf8'));
if(manifest.format!=='APC1'||manifest.scenes.length!==7||manifest.samples.length!==49)throw new Error('Regenerate approved Blender assets');
await access(manifest.source);
for(const scene of manifest.scenes){
  await access('public/matter-approved/'+scene.id+'.png');
  const digest=createHash('sha256').update(await readFile(scene.reference)).digest('hex');
  if(digest!==scene.referenceSha256)throw new Error('Approved reference changed: '+scene.id);
}
for(const [name,variant] of Object.entries(manifest.variants)){
  const data=await readFile('public'+variant.src);
  if(data.toString('ascii',0,4)!=='APC1'||data.readUInt32LE(4)!==manifest.samples.length||data.readUInt32LE(8)!==variant.count||data.length!==variant.bytes||data.length!==16+manifest.samples.length*variant.count*6)throw new Error('Incomplete '+name+' cache');
  const digest=createHash('sha256').update(data).digest('hex').slice(0,12);
  if(!variant.src.includes(digest))throw new Error('Stale content hash: '+name);
}
console.log('Approved Blender assets verified: seven references, 49 samples, both density variants.');
