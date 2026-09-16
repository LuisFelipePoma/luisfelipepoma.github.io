import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';

for(const variant of ['desktop','mobile']) {
  test(`Blender ${variant} export has complete, finite point data`,async()=>{
    const data=await readFile(`public/matter-lab/terrain-${variant}.bin`);
    assert.equal(data.toString('ascii',0,4),'MPNT');
    const count=data.readUInt32LE(4);
    assert.ok(count>= (variant==='desktop' ? 40000 : 20000));
    assert.equal(data.length,8+count*18);
    const layers=new Set();
    let accents=0;
    let minimumX=Infinity,maximumX=-Infinity;
    for(let index=0;index<count;index++) {
      const offset=8+index*18;
      const values=[0,4,8,12].map(delta=>data.readFloatLE(offset+delta));
      assert.ok(values.every(Number.isFinite));
      minimumX=Math.min(minimumX,values[0]);
      maximumX=Math.max(maximumX,values[0]);
      assert.ok(values[3]>0 && values[3]<.03);
      const accent=data.readUInt8(offset+16);
      const layer=data.readUInt8(offset+17);
      assert.ok(accent===0 || accent===1);
      assert.ok(layer<=3);
      accents+=accent;
      layers.add(layer);
    }
    assert.ok(maximumX-minimumX>17,'the authored terrain remains panoramic');
    assert.deepEqual([...layers].sort(),[0,1,2,3]);
    assert.ok(accents>4 && accents/count<.03,'blue stays an accent');
  });
}

test('the isolated review route ships both static fallbacks and an editable Blender source',async()=>{
  const html=await readFile('dist/matter-lab/index.html','utf8');
  assert.match(html,/<meta name="robots" content="noindex"/);
  assert.match(html,/data-matter-canvas/);
  assert.match(html,/data-motion-toggle/);
  assert.equal((html.match(/data-scene=/g)||[]).length,7);
  assert.match(html,/Referencia y render de Blender/);
  await access('art/approved-matter.blend');
  await access('dist/matter-approved/manifest.json');
  for(const path of ['art/terrain.blend','dist/matter-lab/terrain-blender.png','dist/matter-lab/terrain-blender-mobile.png','dist/matter-lab/terrain-desktop.bin','dist/matter-lab/terrain-mobile.bin']) await access(path);
  for(const path of ['art/portfolio-matter.blend','dist/matter-lab/portfolio-matter.json','dist/matter-lab/portfolio-matter-desktop.bin','dist/matter-lab/portfolio-matter-mobile.bin']) await access(path);
});

test('the Blender animation cache keeps one stable point topology across all authored frames',async()=>{
  const metadata=JSON.parse(await readFile('public/matter-lab/portfolio-matter.json','utf8'));
  assert.equal(metadata.format,'PMAT/1');
  assert.equal(metadata.frames.length,15);
  assert.deepEqual(metadata.scenes.map(scene=>scene.id),['terrain','monitoring','documents','uribe','catmap','about','contact']);
  assert.deepEqual(metadata.frames.filter(frame=>frame.kind==='scene').map(frame=>frame.id),['scatter','terrain','monitoring','documents','uribe','catmap','about','contact']);
  for(const variant of ['desktop','mobile']) {
    const data=await readFile(`public/matter-lab/portfolio-matter-${variant}.bin`);
    assert.equal(data.toString('ascii',0,4),'PMAT');
    assert.equal(data.readUInt16LE(4),1);
    assert.equal(data.readUInt16LE(6),metadata.frames.length);
    const pointCount=data.readUInt32LE(8),stride=data.readUInt32LE(12);
    assert.equal(pointCount,metadata.variants[variant].pointCount);
    assert.equal(stride,9);
    assert.equal(data.length,16+metadata.frames.length*pointCount*stride);
    for(let frame=0;frame<metadata.frames.length;frame++) {
      const frameOffset=16+frame*pointCount*stride;
      let opaque=0;
      for(let point=0;point<pointCount;point+=97) {
        const offset=frameOffset+point*stride;
        for(let axis=0;axis<3;axis++) assert.ok(Number.isInteger(data.readInt16LE(offset+axis*2)));
        assert.ok(data.readUInt8(offset+6)>0);
        opaque+=data.readUInt8(offset+8)>0?1:0;
      }
      assert.ok(opaque>pointCount/110,'each authored frame remains visibly populated');
    }
  }
});
