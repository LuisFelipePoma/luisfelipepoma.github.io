/// <reference types="node" />
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {decodeMatterScenes,sceneNames} from '../src/scripts/matter-scenes.ts';

const worlds=(variant:'desktop'|'mobile')=>decodeMatterScenes(readFileSync(`public/matter-data/${variant}.bin`));

for(const [variant,count] of [['desktop',2400],['mobile',850]] as const) {
  test(`${variant}: seven SVG-authored scenes are complete and spatially substantial`,()=>{
    const all=worlds(variant);
    assert.equal(all.length,sceneNames.length);
    for(const [index,world] of all.entries()) {
      assert.equal(world.length,count);
      assert.ok(existsSync(`public/matter-svg/${sceneNames[index]}${variant==='mobile'?'-mobile':''}.svg`));
      assert.ok(world.every(p=>[p.x,p.y,p.z,p.size,p.alpha].every(Number.isFinite) && p.x>=0 && p.x<=1 && p.y>=0 && p.y<=1));
      const xs=world.map(p=>p.x),ys=world.map(p=>p.y);
      assert.ok(Math.max(...xs)-Math.min(...xs)>.35,`${sceneNames[index]} must occupy visual width`);
      assert.ok(Math.max(...ys)-Math.min(...ys)>.3,`${sceneNames[index]} must occupy visual height`);
      const accents=world.filter(p=>p.accent).length;
      assert.ok(accents>0 && accents/count<=.04,'blue remains an accent');
    }
    assert.equal(new Set(all.map(world=>JSON.stringify(world))).size,sceneNames.length);
  });
}

test('reduced budgets use distributed prefixes of the authored positions',()=>{
  for(const [variant,count] of [['desktop',1200],['mobile',400]] as const) {
    for(const world of worlds(variant)) {
      const smaller=world.slice(0,count);
      const left=smaller.filter(p=>p.x<.5).length/count;
      const upper=smaller.filter(p=>p.y<.5).length/count;
      assert.ok(left>.08 && left<.92);
      assert.ok(upper>.05 && upper<.95);
    }
  }
});

test('malformed or truncated artist data fails and preserves SVG fallback',()=>{
  const bytes=readFileSync('public/matter-data/desktop.bin');
  assert.throws(()=>decodeMatterScenes(bytes.subarray(0,bytes.length-1)),/Incomplete/);
  assert.throws(()=>decodeMatterScenes(Buffer.from('BAD!0000')),/Unsupported/);
});
