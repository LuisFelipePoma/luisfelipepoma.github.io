import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';

const metadata=JSON.parse(await readFile(new URL('../public/matter-lab/dyson/dyson.json',import.meta.url),'utf8'));

test('Dyson export preserves eight independently animated continuous rings',()=>{
  assert.equal(metadata.format,'DYPC/1');
  assert.equal(metadata.sampleFrames.length,61);
  assert.deepEqual(Object.keys(metadata.tracks),['INNER_01','INNER_02','INNER_03','INNER_04','OUTER_01','OUTER_02','OUTER_03','OUTER_04']);
  for(const [id,track] of Object.entries(metadata.tracks)) {
    assert.equal(track.length,61,id);
    track.flat().forEach(value=>assert.ok(Number.isFinite(value),id));
    track.forEach(quaternion=>assert.ok(Math.abs(Math.hypot(...quaternion)-1)<1e-4,id));
    assert.notDeepEqual(track[0],track.at(-1),id);
  }
});

for(const [name,count] of [['desktop',44000],['mobile',20000]]) test(`Dyson ${name} cache is complete`,async()=>{
  const variant=metadata.variants[name];
  assert.equal(variant.pointCount,count);
  assert.equal(variant.groups.length,9);
  assert.equal(variant.groups[0].id,'NUCLEUS');
  const binary=await readFile(new URL(`../public${variant.src}`,import.meta.url));
  assert.equal(binary.toString('ascii',0,4),'DYPC');
  assert.equal(binary.readUInt16LE(4),1);
  assert.equal(binary.readUInt16LE(6),9);
  assert.equal(binary.readUInt32LE(8),count);
  assert.equal(binary.readUInt32LE(12),8);
  assert.equal(binary.byteLength,16+count*8);
  assert.equal((await stat(new URL(`../public${variant.src}`,import.meta.url))).size,variant.bytes);
});

test('Dyson rings have increasing radial separation',()=>{
  const groups=metadata.variants.desktop.groups.slice(1);
  const radii=groups.map(group=>(Math.abs(group.bounds[0][0])+group.bounds[0][1])/2);
  for(let index=1;index<4;index++) assert.ok(radii[index]-radii[index-1]>.60);
  for(let index=5;index<8;index++) assert.ok(radii[index]-radii[index-1]>.80);
  assert.ok(radii[4]-radii[3]>1);
});
