import * as THREE from 'three';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

type Theme='light'|'dark';
type MatterFrameMeta={id:string;scene:string;kind:'scene'|'bridge';time:number;theme:Theme};
type MatterSceneMeta={id:string;time:number;theme:Theme;frame:number};
type MatterMetadata={format:'PMAT/1';pointStride:number;duration:number;bounds:[[number,number],[number,number],[number,number]];frames:MatterFrameMeta[];scenes:MatterSceneMeta[];variants:Record<'desktop'|'mobile',{src:string;pointCount:number;bytes:number}>};
type MatterFrame={positions:Float32Array;sizes:Float32Array;accents:Float32Array;opacities:Float32Array};
type MatterCache={frames:MatterFrame[];pointCount:number};

const PAPER=[242,239,231] as const;
const INK=[17,17,15] as const;

function decodeCache(buffer:ArrayBuffer,metadata:MatterMetadata):MatterCache {
  const view=new DataView(buffer);
  if(buffer.byteLength<16||String.fromCharCode(...new Uint8Array(buffer,0,4))!=='PMAT') throw new Error('Unsupported PMAT cache');
  const version=view.getUint16(4,true),frameCount=view.getUint16(6,true),pointCount=view.getUint32(8,true),stride=view.getUint32(12,true);
  if(version!==1||frameCount!==metadata.frames.length||stride!==metadata.pointStride||buffer.byteLength!==16+frameCount*pointCount*stride) throw new Error('Incomplete PMAT cache');
  const frames:MatterFrame[]=[];
  let offset=16;
  for(let frameIndex=0;frameIndex<frameCount;frameIndex++) {
    const positions=new Float32Array(pointCount*3),sizes=new Float32Array(pointCount),accents=new Float32Array(pointCount),opacities=new Float32Array(pointCount);
    for(let point=0;point<pointCount;point++,offset+=stride) {
      for(let axis=0;axis<3;axis++) {
        const q=view.getInt16(offset+axis*2,true)/32767;
        const [minimum,maximum]=metadata.bounds[axis];
        positions[point*3+axis]=minimum+(q+1)*.5*(maximum-minimum);
      }
      sizes[point]=view.getUint8(offset+6)/52;
      accents[point]=view.getUint8(offset+7)/255;
      opacities[point]=view.getUint8(offset+8)/255;
    }
    frames.push({positions,sizes,accents,opacities});
  }
  return {frames,pointCount};
}

function locateFrame(metadata:MatterMetadata,time:number) {
  const scaled=Math.max(0,Math.min(metadata.frames.length-1,time*2));
  const first=Math.floor(scaled);
  return {first,next:Math.min(metadata.frames.length-1,first+1),mix:scaled-first};
}

function mixColor(a:readonly number[],b:readonly number[],amount:number) {
  return `rgb(${a.map((channel,index)=>Math.round(channel+(b[index]-channel)*amount)).join(' ')})`;
}

export async function initializeMatterLab() {
  const stage=document.querySelector<HTMLElement>('[data-lab-stage]');
  const canvas=document.querySelector<HTMLCanvasElement>('[data-lab-canvas]');
  const story=document.querySelector<HTMLElement>('[data-lab-story]');
  const status=document.querySelector<HTMLElement>('[data-lab-status]');
  const progressLabel=document.querySelector<HTMLElement>('[data-lab-progress]');
  const sceneLabel=document.querySelector<HTMLElement>('[data-lab-scene]');
  const scrubber=document.querySelector<HTMLInputElement>('[data-lab-scrubber]');
  const fallbackImage=document.querySelector<HTMLImageElement>('[data-lab-fallback-image]');
  const fallbackSource=document.querySelector<HTMLSourceElement>('[data-lab-fallback-source]');
  const enableMotion=document.querySelector<HTMLButtonElement>('[data-lab-enable-motion]');
  if(!stage||!canvas||!story||!status||!progressLabel||!sceneLabel||!scrubber||!fallbackImage||!enableMotion) return;

  gsap.registerPlugin(ScrollTrigger);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const mobile=matchMedia('(max-width: 760px)');
  const variant=mobile.matches?'mobile':'desktop';
  const motionOverride=new URL(location.href).searchParams.get('motion')==='on';
  let metadata:MatterMetadata;
  try {
    metadata=await fetch('/matter-lab/portfolio-matter.json').then(response=>{
      if(!response.ok) throw new Error(`Matter metadata ${response.status}`);
      return response.json() as Promise<MatterMetadata>;
    });
  } catch(error) {
    console.error('Matter lab metadata fallback:',error);
    canvas.hidden=true;
    status.textContent='Vista fija: no se pudieron cargar los datos de la animación.';
    return;
  }
  let trigger:ScrollTrigger|undefined;
  let currentTime=0;
  let gone=false;

  const nearestScene=(time:number)=>metadata.scenes.reduce((best,scene)=>Math.abs(scene.time-time)<Math.abs(best.time-time)?scene:best);
  const describeTime=(time:number)=>{
    if(time<.45) return 'Dispersión inicial';
    const exact=metadata.scenes.find(scene=>Math.abs(scene.time-time)<.16);
    if(exact) return exact.id;
    const previous=[...metadata.scenes].reverse().find(scene=>scene.time<time);
    const next=metadata.scenes.find(scene=>scene.time>time);
    return previous&&next?`${previous.id} → ${next.id}`:(next?.id||previous?.id||'terrain');
  };
  const setLabels=(time:number,fromScroll:boolean)=>{
    currentTime=time;
    const percentage=Math.round(time/metadata.duration*100);
    progressLabel.textContent=`Scroll ${String(percentage).padStart(3,'0')}%`;
    sceneLabel.textContent=describeTime(time);
    if(fromScroll) scrubber.value=String(Math.round(time/metadata.duration*1000));
    canvas.dataset.progress=(time/metadata.duration).toFixed(3);
    canvas.dataset.scene=nearestScene(time).id;
  };
  const createScroll=(update:(time:number,fromScroll:boolean)=>void)=>{
    const state={time:0};
    const tween=gsap.to(state,{time:metadata.duration,ease:'none',paused:true,onUpdate:()=>update(state.time,true)});
    trigger=ScrollTrigger.create({animation:tween,trigger:story,start:'top top',end:'bottom bottom',scrub:.12});
    scrubber.addEventListener('input',()=>update(Number(scrubber.value)/1000*metadata.duration,false));
    return ()=>{trigger?.kill();tween.kill();};
  };
  const setFallback=(time:number)=>{
    const scene=nearestScene(time);
    const suffix=mobile.matches?'mobile':'desktop';
    const src=`/matter-lab/previews/${scene.id}-${suffix}.png`;
    fallbackImage.src=src;
    if(fallbackSource) fallbackSource.srcset=src;
    stage.dataset.theme=scene.theme;
    stage.style.backgroundColor=scene.theme==='dark'?'#11110f':'#f2efe7';
    setLabels(time,true);
  };
  const useFallback=(message:string)=>{
    stage.removeAttribute('data-lab-ready');
    canvas.hidden=true;
    status.textContent=message;
    createScroll(time=>setFallback(time));
    setFallback(currentTime);
  };

  if(reduced.matches&&!motionOverride) {
    enableMotion.hidden=false;
    enableMotion.addEventListener('click',()=>{const url=new URL(location.href);url.searchParams.set('motion','on');location.href=url.href;});
    useFallback('Movimiento reducido: las poses cambian sin desplazamiento de partículas.');
    return;
  }

  let renderer:THREE.WebGLRenderer|undefined;
  let geometry:THREE.BufferGeometry|undefined;
  let material:THREE.ShaderMaterial|undefined;
  let resizeObserver:ResizeObserver|undefined;
  let frameRequest=0,lastRendered=-1,drawCount=0,activePair=-1;
  try {
    const dataResponse=await fetch(metadata.variants[variant].src);
    if(!dataResponse.ok) throw new Error(`Matter cache ${dataResponse.status}`);
    const cache=decodeCache(await dataResponse.arrayBuffer(),metadata);
    if(gone) return;

    renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:false,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
    renderer.setClearColor(0x000000,0);
    const threeScene=new THREE.Scene();
    const camera=new THREE.OrthographicCamera(-10,10,4.6,-4.6,.1,100);
    camera.position.set(0,-26,2);
    camera.lookAt(camera.position.x,0,0);
    geometry=new THREE.BufferGeometry();
    const fromPosition=new THREE.BufferAttribute(new Float32Array(cache.pointCount*3),3);
    const toPosition=new THREE.BufferAttribute(new Float32Array(cache.pointCount*3),3);
    const fromSize=new THREE.BufferAttribute(new Float32Array(cache.pointCount),1);
    const toSize=new THREE.BufferAttribute(new Float32Array(cache.pointCount),1);
    const fromAccent=new THREE.BufferAttribute(new Float32Array(cache.pointCount),1);
    const toAccent=new THREE.BufferAttribute(new Float32Array(cache.pointCount),1);
    const fromOpacity=new THREE.BufferAttribute(new Float32Array(cache.pointCount),1);
    const toOpacity=new THREE.BufferAttribute(new Float32Array(cache.pointCount),1);
    geometry.setAttribute('position',fromPosition);geometry.setAttribute('aPositionNext',toPosition);
    geometry.setAttribute('aSize',fromSize);geometry.setAttribute('aSizeNext',toSize);
    geometry.setAttribute('aAccent',fromAccent);geometry.setAttribute('aAccentNext',toAccent);
    geometry.setAttribute('aOpacity',fromOpacity);geometry.setAttribute('aOpacityNext',toOpacity);
    material=new THREE.ShaderMaterial({
      uniforms:{uMix:{value:0},uDpr:{value:renderer.getPixelRatio()},uTheme:{value:0}},
      vertexShader:`
        attribute vec3 aPositionNext; attribute float aSize; attribute float aSizeNext;
        attribute float aAccent; attribute float aAccentNext; attribute float aOpacity; attribute float aOpacityNext;
        uniform float uMix; uniform float uDpr; varying float vAccent; varying float vOpacity;
        void main(){ vec3 point=mix(position,aPositionNext,uMix); gl_Position=projectionMatrix*modelViewMatrix*vec4(point,1.0); gl_PointSize=clamp(mix(aSize,aSizeNext,uMix),.75,2.6)*uDpr; vAccent=mix(aAccent,aAccentNext,uMix); vOpacity=mix(aOpacity,aOpacityNext,uMix); }`,
      fragmentShader:`
        uniform float uTheme; varying float vAccent; varying float vOpacity;
        void main(){ if(length(gl_PointCoord-vec2(.5))>.5) discard; vec3 ink=mix(vec3(.067,.067,.059),vec3(.949,.937,.906),uTheme); vec3 blue=mix(vec3(.192,.341,1.0),vec3(.569,.643,1.0),uTheme); gl_FragColor=vec4(mix(ink,blue,vAccent),vOpacity); }`,
      transparent:true,depthWrite:false,
    });
    threeScene.add(new THREE.Points(geometry,material));
    canvas.dataset.pointCount=String(cache.pointCount);canvas.dataset.frameCount=String(cache.frames.length);canvas.dataset.assetBytes=String(metadata.variants[variant].bytes);

    const loadPair=(first:number,next:number)=>{
      if(activePair===first) return;
      const a=cache.frames[first],b=cache.frames[next];
      (fromPosition.array as Float32Array).set(a.positions);(toPosition.array as Float32Array).set(b.positions);
      (fromSize.array as Float32Array).set(a.sizes);(toSize.array as Float32Array).set(b.sizes);
      (fromAccent.array as Float32Array).set(a.accents);(toAccent.array as Float32Array).set(b.accents);
      (fromOpacity.array as Float32Array).set(a.opacities);(toOpacity.array as Float32Array).set(b.opacities);
      [fromPosition,toPosition,fromSize,toSize,fromAccent,toAccent,fromOpacity,toOpacity].forEach(attribute=>attribute.needsUpdate=true);
      activePair=first;
    };
    const draw=()=>{
      frameRequest=0;
      if(gone||document.hidden||!renderer||!material||currentTime===lastRendered) return;
      const started=performance.now();
      const location=locateFrame(metadata,currentTime);loadPair(location.first,location.next);
      material.uniforms.uMix.value=location.mix;
      const themeA=metadata.frames[location.first].theme==='dark'?1:0,themeB=metadata.frames[location.next].theme==='dark'?1:0;
      const theme=themeA+(themeB-themeA)*location.mix;
      material.uniforms.uTheme.value=theme;
      stage.style.backgroundColor=mixColor(PAPER,INK,theme);stage.dataset.theme=theme>.5?'dark':'light';
      renderer.render(threeScene,camera);
      lastRendered=currentTime;drawCount++;
      canvas.dataset.drawCount=String(drawCount);canvas.dataset.renderSubmitMs=(performance.now()-started).toFixed(2);canvas.dataset.renderState='idle';
    };
    const requestDraw=()=>{if(!frameRequest&&!gone&&!document.hidden){canvas.dataset.renderState='active';frameRequest=requestAnimationFrame(draw);}};
    const update=(time:number,fromScroll:boolean)=>{setLabels(time,fromScroll);requestDraw();};
    const resize=()=>{
      if(!renderer||!material) return;
      const width=stage.clientWidth,height=stage.clientHeight;if(width<1||height<1) return;
      const span=9.2,aspect=width/height;camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;
      camera.updateProjectionMatrix();renderer.setSize(width,height,false);material.uniforms.uDpr.value=renderer.getPixelRatio();lastRendered=-1;requestDraw();
    };
    resizeObserver=new ResizeObserver(resize);resizeObserver.observe(stage);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden){lastRendered=-1;requestDraw();}});
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();trigger?.kill();useFallback('Vista fija: se perdió el contexto WebGL.');});
    mobile.addEventListener('change',()=>location.reload());reduced.addEventListener('change',()=>location.reload());
    createScroll(update);canvas.hidden=false;resize();update(0,true);draw();stage.dataset.labReady='true';
    status.textContent='Animación Blender activa · desplázate o usa el control.';
  } catch(error) {
    console.error('Matter lab fallback:',error);renderer?.dispose();material?.dispose();geometry?.dispose();resizeObserver?.disconnect();
    useFallback('Vista fija: no se pudo iniciar la nube WebGL.');
  }

  window.addEventListener('pagehide',()=>{gone=true;trigger?.kill();resizeObserver?.disconnect();if(frameRequest)cancelAnimationFrame(frameRequest);renderer?.dispose();material?.dispose();geometry?.dispose();},{once:true});
}
