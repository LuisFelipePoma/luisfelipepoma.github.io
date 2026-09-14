/// <reference types="node" />
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildMatterScenes, sceneNames} from '../src/scripts/matter-scenes.ts';

for (const [count,mobile] of [[1800,false],[600,true]] as const) {
  test(`all seven cloud worlds have ${count} finite drawable points`,()=>{
    const worlds=buildMatterScenes(count,mobile);
    assert.equal(worlds.length,sceneNames.length);
    for (const world of worlds) {
      assert.equal(world.length,count);
      assert.ok(world.every(p=>[p.x,p.y,p.z,p.size,p.alpha].every(Number.isFinite) && p.size>0 && p.alpha>=0 && p.alpha<=1));
      assert.ok(world.some(p=>p.accent));
    }
    assert.equal(new Set(worlds.map(world=>JSON.stringify(world))).size,sceneNames.length);
    for (const projectWorld of worlds.slice(1,5)) {
      assert.ok(projectWorld.every(p=>p.x>=0 && p.x<=1 && p.y>=0 && p.y<=1),
        'project particles must fit the reserved space opposite the image');
    }
  });
}
