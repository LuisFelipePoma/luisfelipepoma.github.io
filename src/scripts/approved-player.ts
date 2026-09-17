import * as THREE from 'three';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {approvedScenes,decodeApproved,fitPlane,samplePair,sectionTime,type ApprovedManifest} from './approved-data';

const MAX_QUIET=40;
const vertexShader=`
attribute vec3 aNext;
attribute float aTerrainX;
uniform float uMix, uBound, uDpr, uSize, uTerrainWeight;
uniform vec2 uViewport;
uniform vec3 uPlane;
uniform vec4 uQuiet[40];
uniform int uQuietCount;
varying vec2 vPixel;
varying float vEdgeOpacity;
void main(){
  vec3 p=mix(position,aNext,uMix)*uBound;
  // Feather the source silhouette's cropped edge, following each point through the morph.
  vEdgeOpacity=1.-smoothstep(.60,.89,aTerrainX)*uTerrainWeight;
  vec2 pixel=vec2(uPlane.x+p.x*uPlane.z,uPlane.y-p.z*uPlane.z);
  bool hidden=false;
  for(int i=0;i<40;i++){
    if(i>=uQuietCount)break;
    vec4 r=uQuiet[i];
    if(pixel.x>=r.x && pixel.x<=r.z && pixel.y>=r.y && pixel.y<=r.w)hidden=true;
  }
  vPixel=pixel;
  gl_Position=vec4(pixel.x/uViewport.x*2.-1.,1.-pixel.y/uViewport.y*2.,0.,1.);
  if(hidden)gl_Position=vec4(2.,2.,2.,1.);
  gl_PointSize=uSize*uDpr;
}`;
const fragmentShader=`
uniform vec2 uDark;
varying vec2 vPixel;
varying float vEdgeOpacity;
void main(){
  float d=length(gl_PointCoord-vec2(.5));
  if(d>.5)discard;
  bool dark=vPixel.y>=uDark.x && vPixel.y<=uDark.y;
  vec3 ink=dark?vec3(.949,.937,.906):vec3(.067,.067,.059);
  gl_FragColor=vec4(ink,(1.-smoothstep(.30,.5,d))*.85*vEdgeOpacity);
}`;

type Rect={left:number;top:number;width:number;height:number};

export async function initializeApprovedMatter() {
  const element=document.querySelector<HTMLCanvasElement>('[data-matter-canvas]');
  if(!element)return;
  const canvas=element;
  const sections=approvedScenes.map(id=>document.querySelector<HTMLElement>(`[data-scene="${id}"]`));
  if(sections.some(section=>!section))return;
  const zones=sections.map(section=>section!.querySelector<HTMLElement>('[data-cloud-zone]')!);
  if(zones.some(zone=>!zone))return;
  const fallbacks=[...document.querySelectorAll<HTMLElement>('[data-matter-fallback]')];
  const quiet=[...document.querySelectorAll<HTMLElement>('[data-cloud-quiet]')];
  const dark=document.querySelector<HTMLElement>('[data-cloud-dark]');
  const toggle=document.querySelector<HTMLButtonElement>('[data-motion-toggle]');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const mobile=matchMedia('(max-width: 760px)');
  let manual=false;
  try{manual=localStorage.getItem('portfolio-reduced-motion')==='true';}catch{/* preference is optional */}
  const isReduced=()=>reduced.matches||manual;
  let renderer:THREE.WebGLRenderer|undefined, geometry:THREE.BufferGeometry|undefined, material:THREE.ShaderMaterial|undefined;
  let trigger:ScrollTrigger|undefined, tween:gsap.core.Tween|undefined;
  let frame=0, resizeFrame=0, disposed=false, ready=false, failed=false, loading=false;
  const abort=new AbortController(),signal=abort.signal;
  let rects:Rect[]=[],quietRects:Rect[]=[],darkRect:Rect|undefined,anchors:number[]=[];
  let width=innerWidth,height=innerHeight;
  let drawCount=0,lastPair=-1,lastNext=-1;
  const timings:number[]=[];
  const state={scroll:scrollY};
  const readRect=(el:HTMLElement):Rect=>{const r=el.getBoundingClientRect();return {left:r.left,top:r.top+scrollY,width:r.width,height:r.height};};
  const restoreFallback=()=>{
    canvas.classList.add('hidden');
    fallbacks.forEach(el=>el.hidden=false);
    document.documentElement.removeAttribute('data-matter-ready');
  };
  const syncMotion=()=>{
    document.documentElement.dataset.motion=isReduced()?'reduced':'full';
    if(toggle){toggle.hidden=false;toggle.disabled=reduced.matches;toggle.setAttribute('aria-pressed',String(isReduced()));toggle.title=reduced.matches?toggle.dataset.systemLabel||'':'';}
    if(isReduced()||failed){restoreFallback();if(frame)cancelAnimationFrame(frame);frame=0;canvas.dataset.renderState=isReduced()?'static':'fallback';}
    else if(ready){fallbacks.forEach(el=>el.hidden=true);canvas.classList.remove('hidden');document.documentElement.dataset.matterReady='true';requestDraw();}
  };
  let draw=()=>{};
  function requestDraw(){
    if(frame||disposed||document.hidden||isReduced()||!ready||failed)return;
    frame=requestAnimationFrame(()=>{frame=0;draw();});
  }
  const measure=()=>{
    width=innerWidth;height=innerHeight;
    rects=zones.map(readRect);quietRects=quiet.map(readRect);darkRect=dark?readRect(dark):undefined;
    const max=Math.max(1,document.documentElement.scrollHeight-height);
    anchors=rects.map((r,i)=>i===0?0:Math.min(max,Math.max(0,r.top+r.height/2-height*.6)));
    for(let i=1;i<anchors.length;i++)anchors[i]=Math.max(anchors[i-1]+1,anchors[i]);
    renderer?.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer?.setSize(width,height,false);
    if(material){material.uniforms.uViewport.value.set(width,height);material.uniforms.uDpr.value=renderer!.getPixelRatio();}
    trigger?.kill();tween?.kill();state.scroll=scrollY;
    if(ready){
      tween=gsap.fromTo(state,{scroll:0},{scroll:max,duration:1,ease:'none',paused:true,onUpdate:requestDraw});
      trigger=ScrollTrigger.create({animation:tween,start:0,end:()=>Math.max(1,document.documentElement.scrollHeight-innerHeight),scrub:.12,invalidateOnRefresh:true});
      trigger.refresh();tween.progress(Math.min(1,scrollY/max));
    }
    requestDraw();
  };
  const scheduleMeasure=()=>{if(resizeFrame)cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{resizeFrame=0;measure();});};

  async function load(){
    if(ready||loading||disposed||isReduced()||failed)return;
    loading=true;
    try{
      const response=await fetch('/matter-approved/manifest.json',{signal,cache:'no-cache'});
      if(!response.ok)throw new Error(`Blender manifest: ${response.status}`);
      const manifest:ApprovedManifest=await response.json();
      if(manifest.scenes.map(s=>s.id).join()!==approvedScenes.join())throw new Error('Scene order differs from the portfolio');
      const variant=mobile.matches?'mobile':'desktop';
      const asset=await fetch(manifest.variants[variant].src,{signal});
      if(!asset.ok)throw new Error(`Blender cache: ${asset.status}`);
      const frames=decodeApproved(await asset.arrayBuffer(),manifest,variant);
      if(disposed)return;
      renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:false,powerPreference:'high-performance'});
      renderer.setClearColor(0,0);
      const scene=new THREE.Scene(),camera=new THREE.Camera();
      const buffers=frames.map(array=>new THREE.BufferAttribute(array,3,true));
      geometry=new THREE.BufferGeometry();geometry.setAttribute('position',buffers[0]);geometry.setAttribute('aNext',buffers[1]);
      const terrainX=Float32Array.from({length:manifest.variants[variant].count},(_,i)=>frames[0][i*3]/32767*manifest.bound);
      geometry.setAttribute('aTerrainX',new THREE.BufferAttribute(terrainX,1));
      const quietUniform=Array.from({length:MAX_QUIET},()=>new THREE.Vector4());
      material=new THREE.ShaderMaterial({vertexShader,fragmentShader,transparent:true,depthTest:false,depthWrite:false,
        uniforms:{uMix:{value:0},uBound:{value:manifest.bound},uDpr:{value:1},uSize:{value:variant==='mobile'?1.05:1.15},uTerrainWeight:{value:1},
          uViewport:{value:new THREE.Vector2(width,height)},uPlane:{value:new THREE.Vector3()},uQuiet:{value:quietUniform},uQuietCount:{value:0},uDark:{value:new THREE.Vector2(-2,-1)}}});
      const points=new THREE.Points(geometry,material);points.frustumCulled=false;scene.add(points);
      canvas.dataset.source='approved-matter.blend';canvas.dataset.pointCount=String(manifest.variants[variant].count);
      canvas.dataset.assetBytes=String(manifest.variants[variant].bytes);canvas.dataset.sampleCount=String(frames.length);
      draw=()=>{
        if(!renderer||!material||!geometry||!ready||document.hidden||isReduced()||failed)return;
        const start=performance.now();
        const time=sectionTime(state.scroll,anchors),{first,next,mix}=samplePair(time,manifest.samples);
        if(first!==lastPair){geometry.setAttribute('position',buffers[first]);lastPair=first;}
        if(next!==lastNext){geometry.setAttribute('aNext',buffers[next]);lastNext=next;}
        material.uniforms.uMix.value=mix;
        const a=Math.min(6,Math.floor(time)),b=Math.min(6,a+1),fraction=time-a;
        const plane=(i:number)=>fitPlane({...rects[i],top:rects[i].top-scrollY},manifest.scenes[i].aspect,height);
        const pa=plane(a),pb=plane(b),smooth=fraction*fraction*(3-2*fraction);
        material.uniforms.uTerrainWeight.value=a===0?1-smooth:0;
        material.uniforms.uPlane.value.set(pa.x+(pb.x-pa.x)*smooth,pa.y+(pb.y-pa.y)*smooth,pa.scale+(pb.scale-pa.scale)*smooth);
        let count=0;
        for(const r of quietRects){
          const top=r.top-scrollY,bottom=top+r.height;
          if(bottom<0||top>height)continue;
          if(count===MAX_QUIET)break;
          quietUniform[count++].set(r.left-16,top-16,r.left+r.width+16,bottom+16);
        }
        material.uniforms.uQuietCount.value=count;
        material.uniforms.uDark.value.set(darkRect?darkRect.top-scrollY:-2,darkRect?darkRect.top+darkRect.height-scrollY:-1);
        renderer.render(scene,camera);
        drawCount++;
        const elapsed=performance.now()-start;timings.push(elapsed);if(timings.length>180)timings.shift();
        canvas.dataset.drawCount=String(drawCount);canvas.dataset.sceneProgress=time.toFixed(4);canvas.dataset.activeScene=approvedScenes[Math.round(time)];
        canvas.dataset.renderState='idle';canvas.dataset.submitMs=elapsed.toFixed(2);
        if(drawCount%30===0){const sorted=[...timings].sort((a,b)=>a-b);canvas.dataset.submitP95Ms=sorted[Math.ceil(sorted.length*.95)-1].toFixed(2);}
      };
      gsap.registerPlugin(ScrollTrigger);ready=true;measure();syncMotion();
      renderer.compile(scene,camera);
    }catch(error){
      if(disposed)return;
      failed=true;restoreFallback();canvas.dataset.renderState='fallback';
      geometry?.dispose();material?.dispose();renderer?.dispose();
      console.error('Approved Blender animation unavailable:',error);
    }finally{loading=false;}
  }
  window.addEventListener('scroll',requestDraw,{passive:true,signal});
  window.addEventListener('resize',scheduleMeasure,{passive:true,signal});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=0;canvas.dataset.renderState='paused';}
    else{state.scroll=scrollY;requestDraw();}
  },{signal});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();failed=true;trigger?.kill();tween?.kill();syncMotion();},{signal});
  reduced.addEventListener('change',()=>{syncMotion();void load();},{signal});
  toggle?.addEventListener('click',()=>{
    if(reduced.matches)return;manual=!manual;
    try{localStorage.setItem('portfolio-reduced-motion',String(manual));}catch{/* visit-only preference */}
    syncMotion();void load();
  },{signal});
  void document.fonts.ready.then(()=>{if(!disposed)scheduleMeasure();});
  document.querySelectorAll('img').forEach(img=>img.addEventListener('load',scheduleMeasure,{once:true,signal}));
  window.addEventListener('pagehide',event=>{
    if(frame)cancelAnimationFrame(frame);frame=0;
    if(event.persisted)return;
    disposed=true;abort.abort();trigger?.kill();tween?.kill();if(resizeFrame)cancelAnimationFrame(resizeFrame);
    geometry?.dispose();material?.dispose();renderer?.dispose();
  });
  window.addEventListener('pageshow',event=>{if(event.persisted){measure();syncMotion();}});
  syncMotion();await load();
}
