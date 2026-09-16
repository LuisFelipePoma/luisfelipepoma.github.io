import * as THREE from 'three';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

type GroupMeta={id:string;layer:'core'|'inner'|'outer';count:number;offset:number;bounds:[[number,number],[number,number],[number,number]]};
type VariantMeta={src:string;pointCount:number;bytes:number;groups:GroupMeta[]};
type DysonMeta={format:'DYPC/1';sampleFrames:number[];tracks:Record<string,number[][]>;variants:Record<'desktop'|'mobile',VariantMeta>};

function decode(buffer:ArrayBuffer,variant:VariantMeta) {
  const view=new DataView(buffer);
  if(buffer.byteLength<16||String.fromCharCode(...new Uint8Array(buffer,0,4))!=='DYPC') throw new Error('Unsupported Dyson cache');
  const version=view.getUint16(4,true),groupCount=view.getUint16(6,true),total=view.getUint32(8,true),stride=view.getUint32(12,true);
  if(version!==1||groupCount!==variant.groups.length||total!==variant.pointCount||stride!==8||buffer.byteLength!==16+total*stride) throw new Error('Incomplete Dyson cache');
  let offset=16;
  return variant.groups.map(group=>{
    const positions=new Float32Array(group.count*3),sizes=new Float32Array(group.count),opacities=new Float32Array(group.count);
    for(let point=0;point<group.count;point++,offset+=stride) {
      for(let axis=0;axis<3;axis++) {
        const q=view.getInt16(offset+axis*2,true)/32767;
        const [minimum,maximum]=group.bounds[axis];
        positions[point*3+axis]=minimum+(q+1)*.5*(maximum-minimum);
      }
      sizes[point]=view.getUint8(offset+6)/48;
      opacities[point]=view.getUint8(offset+7)/255;
    }
    return {meta:group,positions,sizes,opacities};
  });
}

export async function initializeDysonLab() {
  const stage=document.querySelector<HTMLElement>('[data-dyson-stage]');
  const story=document.querySelector<HTMLElement>('[data-dyson-story]');
  const canvas=document.querySelector<HTMLCanvasElement>('[data-dyson-canvas]');
  const status=document.querySelector<HTMLElement>('[data-dyson-status]');
  const progressLabel=document.querySelector<HTMLElement>('[data-dyson-progress]');
  const scrubber=document.querySelector<HTMLInputElement>('[data-dyson-scrubber]');
  const enableMotion=document.querySelector<HTMLButtonElement>('[data-dyson-enable-motion]');
  if(!stage||!story||!canvas||!status||!progressLabel||!scrubber||!enableMotion) return;

  const mobile=matchMedia('(max-width:760px)');
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const override=new URL(location.href).searchParams.get('motion')==='on';
  if(reduced.matches&&!override) {
    status.textContent='Movimiento reducido: se muestra la referencia estática.';
    enableMotion.hidden=false;
    enableMotion.addEventListener('click',()=>{const url=new URL(location.href);url.searchParams.set('motion','on');location.href=url.href;});
    return;
  }

  let renderer:THREE.WebGLRenderer|undefined,material:THREE.ShaderMaterial|undefined;
  let trigger:ScrollTrigger|undefined,resizeObserver:ResizeObserver|undefined;
  let request=0,last=-1,drawCount=0,gone=false;
  const state={progress:0};
  try {
    const metadata=await fetch('/matter-lab/dyson/dyson.json').then(response=>{
      if(!response.ok) throw new Error(`Dyson metadata ${response.status}`);
      return response.json() as Promise<DysonMeta>;
    });
    const variant=metadata.variants[mobile.matches?'mobile':'desktop'];
    const response=await fetch(variant.src);
    if(!response.ok) throw new Error(`Dyson points ${response.status}`);
    const groups=decode(await response.arrayBuffer(),variant);
    if(gone) return;

    renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:false,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setClearColor(0x000000,0);
    const scene=new THREE.Scene();
    const camera=new THREE.OrthographicCamera(-8,8,8.6,-8.6,.1,100);
    camera.position.set(mobile.matches?0:-3,-22,3.6);camera.lookAt(mobile.matches?0:-3,0,0);
    material=new THREE.ShaderMaterial({
      uniforms:{uDpr:{value:renderer.getPixelRatio()}},
      vertexShader:`attribute float aSize;attribute float aOpacity;uniform float uDpr;varying float vOpacity;void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_PointSize=clamp(aSize,.72,1.8)*uDpr;vOpacity=aOpacity;}`,
      fragmentShader:`varying float vOpacity;void main(){if(length(gl_PointCoord-vec2(.5))>.5)discard;gl_FragColor=vec4(.067,.067,.059,vOpacity);}`,
      transparent:true,depthWrite:false,
    });
    const objects=new Map<string,THREE.Points>();
    const geometries:THREE.BufferGeometry[]=[];
    for(const group of groups) {
      const geometry=new THREE.BufferGeometry();geometries.push(geometry);
      geometry.setAttribute('position',new THREE.BufferAttribute(group.positions,3));
      geometry.setAttribute('aSize',new THREE.BufferAttribute(group.sizes,1));
      geometry.setAttribute('aOpacity',new THREE.BufferAttribute(group.opacities,1));
      const points=new THREE.Points(geometry,material);points.frustumCulled=false;scene.add(points);objects.set(group.meta.id,points);
    }
    canvas.dataset.pointCount=String(variant.pointCount);canvas.dataset.ringCount='8';canvas.dataset.sampleCount=String(metadata.sampleFrames.length);canvas.dataset.assetBytes=String(variant.bytes);
    const qa=new THREE.Quaternion(),qb=new THREE.Quaternion();

    const draw=()=>{
      request=0;
      if(gone||document.hidden||!renderer||state.progress===last) return;
      const started=performance.now();
      const scaled=Math.max(0,Math.min(metadata.sampleFrames.length-1,state.progress*(metadata.sampleFrames.length-1)));
      const first=Math.floor(scaled),next=Math.min(metadata.sampleFrames.length-1,first+1),mix=scaled-first;
      for(const [id,track] of Object.entries(metadata.tracks)) {
        const object=objects.get(id);if(!object) continue;
        qa.fromArray(track[first]);qb.fromArray(track[next]);object.quaternion.slerpQuaternions(qa,qb,mix);
      }
      renderer.render(scene,camera);last=state.progress;drawCount++;
      canvas.dataset.drawCount=String(drawCount);canvas.dataset.progress=state.progress.toFixed(3);canvas.dataset.renderSubmitMs=(performance.now()-started).toFixed(2);canvas.dataset.renderState='idle';
    };
    const requestDraw=()=>{if(!request&&!gone&&!document.hidden){canvas.dataset.renderState='active';request=requestAnimationFrame(draw);}};
    const update=(fromScroll:boolean)=>{
      progressLabel.textContent=`Movimiento ${String(Math.round(state.progress*100)).padStart(3,'0')}%`;
      if(fromScroll) scrubber.value=String(Math.round(state.progress*1000));
      requestDraw();
    };
    const resize=()=>{
      if(!renderer||!material) return;
      const width=stage.clientWidth,height=stage.clientHeight;if(width<1||height<1)return;
      const span=17.2,aspect=width/height;camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;
      camera.updateProjectionMatrix();renderer.setSize(width,height,false);material.uniforms.uDpr.value=renderer.getPixelRatio();last=-1;requestDraw();
    };
    resizeObserver=new ResizeObserver(resize);resizeObserver.observe(stage);
    gsap.registerPlugin(ScrollTrigger);
    const tween=gsap.to(state,{progress:1,ease:'none',paused:true,onUpdate:()=>update(true)});
    trigger=ScrollTrigger.create({animation:tween,trigger:story,start:'top top',end:'bottom bottom',scrub:.12});
    ScrollTrigger.refresh();
    scrubber.addEventListener('input',()=>{state.progress=Number(scrubber.value)/1000;update(false);});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden){last=-1;requestDraw();}});
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();trigger?.kill();stage.removeAttribute('data-dyson-ready');canvas.hidden=true;status.textContent='Vista fija: se perdió el contexto WebGL.';});
    mobile.addEventListener('change',()=>location.reload());reduced.addEventListener('change',()=>location.reload());
    canvas.hidden=false;resize();draw();stage.dataset.dysonReady='true';
    status.textContent='Animación de Blender activa · ocho anillos independientes.';
    window.addEventListener('pagehide',()=>{gone=true;trigger?.kill();resizeObserver?.disconnect();if(request)cancelAnimationFrame(request);geometries.forEach(geometry=>geometry.dispose());material?.dispose();renderer?.dispose();},{once:true});
  } catch(error) {
    console.error('Dyson lab fallback:',error);stage.removeAttribute('data-dyson-ready');canvas.hidden=true;status.textContent='Vista fija: no se pudo iniciar la animación.';
  }
}
