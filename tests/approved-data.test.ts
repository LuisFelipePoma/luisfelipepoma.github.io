import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {approvedScenes,decodeApproved,sectionTime,samplePair,fitPlane,type ApprovedManifest} from '../src/scripts/approved-data.ts';

const manifest:ApprovedManifest=JSON.parse(readFileSync('public/matter-approved/manifest.json','utf8'));
const binary=(variant:'desktop'|'mobile')=>{
  const b=readFileSync('public'+manifest.variants[variant].src);
  return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);
};
const desktop=decodeApproved(binary('desktop'),manifest,'desktop');
const mobile=decodeApproved(binary('mobile'),manifest,'mobile');

test('Blender export contains every approved scene and intact quantized samples',()=>{
  assert.deepEqual(manifest.scenes.map(scene=>scene.id),[...approvedScenes]);
  assert.equal(desktop.length,49);
  for(const [i,frame] of desktop.entries()){
    assert.equal(frame.length,28000*3);
    for(const value of frame) assert.ok(value>-32767&&value<32767,'domain must not clip');
    assert.deepEqual(mobile[i],frame.subarray(0,10000*3),'mobile preserves point identity');
    if(i>0)assert.notDeepEqual(frame,desktop[i-1],'animation must not be frozen');
  }
  for(const variant of ['desktop','mobile'] as const){
    const digest=createHash('sha256').update(new Uint8Array(binary(variant))).digest('hex').slice(0,12);
    assert.ok(manifest.variants[variant].src.includes(digest),'immutable content hash');
  }
});

test('truncated or incompatible caches fail before allocating GPU geometry',()=>{
  assert.throws(()=>decodeApproved(binary('desktop').slice(0,-6),manifest,'desktop'));
  assert.throws(()=>decodeApproved(binary('mobile'),manifest,'desktop'));
  const bad=binary('desktop');new Uint8Array(bad)[0]=0;
  assert.throws(()=>decodeApproved(bad,manifest,'desktop'));
});

test('scroll mapping holds poses, supports reverse and reaches Contact at page end',()=>{
  const anchors=[0,800,1600,2400,3200,4000,4800];
  assert.equal(sectionTime(0,anchors),0);
  assert.equal(sectionTime(100,anchors),0);
  assert.ok(Math.abs(sectionTime(400,anchors)-.5)<1e-12);
  assert.equal(sectionTime(720,anchors),1);
  assert.equal(sectionTime(900,anchors),1);
  assert.equal(sectionTime(9999,anchors),6);
  const forward=Array.from({length:481},(_,i)=>sectionTime(i*10,anchors));
  const reverse=Array.from({length:481},(_,i)=>sectionTime(4800-i*10,anchors)).reverse();
  assert.deepEqual(forward,reverse);
  forward.slice(1).forEach((n,i)=>assert.ok(n>=forward[i]));
  assert.deepEqual(samplePair(6,manifest.samples),{first:48,next:48,mix:0});
  assert.deepEqual(samplePair(2.0625,manifest.samples),{first:16,next:17,mix:.5});
});

test('wide and tall approved silhouettes fit mobile and desktop without stretching',()=>{
  for(const width of [320,640])for(const height of [192,390])for(const aspect of [.68,1,2.4]){
    const plane=fitPlane({left:20,top:900,width,height},aspect,800);
    const shapeWidth=1.78*Math.min(1,aspect)*plane.scale;
    const shapeHeight=1.78*Math.min(1,1/aspect)*plane.scale;
    assert.ok(shapeWidth<=width&&shapeHeight<=height);
    assert.ok(plane.y+shapeHeight/2<=784);
    assert.ok(plane.y-shapeHeight/2>=16);
  }
});
