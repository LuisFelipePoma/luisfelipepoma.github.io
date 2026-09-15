import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {copyEmail} from './copy-email';
import {buildMatterScenes, sceneNames} from './matter-scenes';

function initializeClipboard() {
  const button = document.querySelector<HTMLButtonElement>('[data-copy-email]');
  const status = document.querySelector<HTMLElement>('[data-copy-status]');
  const label = button?.querySelector('span');
  if (!button || !status || !label) return;
  const originalLabel = label.textContent || '';
  button.hidden = false;
  button.addEventListener('click', async () => {
    if (button.disabled) return;
    status.textContent = '';
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    label.textContent = button.dataset.pending || originalLabel;
    const success = await copyEmail(button.dataset.copyEmail || '', navigator.clipboard);
    status.textContent = (success ? button.dataset.success : button.dataset.error) || '';
    label.textContent = originalLabel;
    button.disabled = false;
    button.removeAttribute('aria-busy');
  });
}

function initializeMatter() {
  const element = document.querySelector<HTMLCanvasElement>('[data-matter-canvas]');
  const context = element?.getContext('2d', {alpha:true});
  if (!element || !context) return;
  const canvas = element;
  gsap.registerPlugin(ScrollTrigger);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 760px)');
  const finePointer = matchMedia('(pointer: fine)');
  const button = document.querySelector<HTMLButtonElement>('[data-motion-toggle]');
  const sections = sceneNames.map(name => document.querySelector<HTMLElement>('[data-scene="' + name + '"]')).filter((e):e is HTMLElement=>!!e);
  const quiet = [...document.querySelectorAll<HTMLElement>('[data-cloud-quiet]')];
  const darkSections = [...document.querySelectorAll<HTMLElement>('[data-cloud-dark]')];
  const zones = sections.map(section => section.querySelector<HTMLElement>('[data-cloud-zone]'));
  type Bounds = {left:number; right:number; top:number; bottom:number; width:number; height:number};
  let quietRects: Bounds[] = [], darkRects: Bounds[] = [];
  let zoneRects: (Bounds | undefined)[] = [];
  let width = 0, height = 0, frameCount = 0, scrollDrawCount = 0, maxDrawMs = 0;
  let pointerX = 0, pointerY = 0, drawFrame = 0, idleTimer = 0;
  let lastScrollAt = -Infinity;
  let rectsDirty = true, manualReduced = false, suspended = false;
  let worlds = buildMatterScenes(mobile.matches ? 600 : 1800, mobile.matches);
  let phaseCos = new Float32Array(worlds[0].length), phaseSin = new Float32Array(worlds[0].length);
  const colors = ['#11110f', '#3157ff', '#f2efe7', '#91a4ff'];
  const radii = [1.4, 2.2, 3.1];
  let sprites: HTMLCanvasElement[][] = [];
  const drawTimes: number[] = [];
  let timeline: gsap.core.Timeline | undefined;
  let trigger: ScrollTrigger | undefined;
  const state = {value:0};
  try {manualReduced = localStorage.getItem('portfolio-reduced-motion') === 'true';} catch { /* System preference remains available. */ }
  const isReduced = () => reduced.matches || manualReduced;
  const markRectsDirty = () => {rectsDirty = true;};
  const markScroll = () => {lastScrollAt=performance.now(); markRectsDirty(); requestDraw();};
  const updateRects = () => {
    if (!rectsDirty) return;
    const visible = (r:Bounds) => r.bottom >= -16 && r.top <= height+16 && r.right >= -16 && r.left <= width+16;
    quietRects = quiet.map(e=>e.getBoundingClientRect()).filter(visible);
    darkRects = darkSections.map(e=>e.getBoundingClientRect()).filter(visible);
    zoneRects = zones.map(e=>e?.getBoundingClientRect());
    rectsDirty = false;
  };
  const buildDrawingShapes = (dpr:number) => {
    for (let i=0;i<phaseCos.length;i++) {
      const phase = i * 2.399963;
      phaseCos[i] = Math.cos(phase);
      phaseSin[i] = Math.sin(phase);
    }
    sprites = colors.map(color => radii.map(radius => {
      const sprite = document.createElement('canvas');
      const diameter = Math.ceil((radius+1)*2*dpr);
      sprite.width = sprite.height = diameter;
      const ink = sprite.getContext('2d');
      if (ink) {
        ink.fillStyle = color;
        ink.beginPath();
        ink.arc(diameter/2,diameter/2,radius*dpr,0,Math.PI*2);
        ink.fill();
      }
      return sprite;
    }));
  };

  const draw = () => {
    if (document.hidden || suspended || !width || !height) return;
    const started = performance.now();
    updateRects();
    const value = isReduced() ? Math.round(state.value) : state.value;
    const first = Math.max(0, Math.min(worlds.length - 1, Math.floor(value)));
    const next = Math.min(worlds.length - 1, first + 1);
    const mix = value - first, scatter = Math.sin(mix * Math.PI) * .025;
    const a = worlds[first], b = worlds[next];
    const plane = (scene:number) => {
      const zone = zoneRects[scene];
      return zone ? {left:zone.left, top:Math.max(16,Math.min(height-zone.height-16,zone.top)),width:zone.width,height:zone.height}
        : {left:0,top:0,width,height};
    };
    const sourcePlane=plane(first), targetPlane=plane(next);
    const voxel = (value>1.5 && value<2.5) || (value>4.5 && value<5.5);
    context.clearRect(0,0,width,height);
    let previousColor = -1;
    for (let i=0;i<a.length;i++) {
      const from = a[i], to = b[i], depth = from.z + (to.z - from.z) * mix;
      const startX=sourcePlane.left+from.x*sourcePlane.width, endX=targetPlane.left+to.x*targetPlane.width;
      const startY=sourcePlane.top+from.y*sourcePlane.height, endY=targetPlane.top+to.y*targetPlane.height;
      const x = startX+(endX-startX)*mix + phaseCos[i]*scatter*width + pointerX*depth;
      const y = startY+(endY-startY)*mix + phaseSin[i]*scatter*height + pointerY*depth;
      if (x<-6 || x>width+6 || y<-6 || y>height+6) continue;
      // Exclude point footprints, including scatter, over text, diagrams and images.
      let behindCopy = false;
      for (const r of quietRects) {
        if (x>=r.left-16 && x<=r.right+16 && y>=r.top-16 && y<=r.bottom+16) {behindCopy=true; break;}
      }
      if (behindCopy) continue;
      let onDark = false;
      for (const r of darkRects) {
        if (y>=r.top && y<=r.bottom) {onDark=true; break;}
      }
      const alpha = from.alpha + (to.alpha-from.alpha)*mix;
      context.globalAlpha = alpha;
      const color = (onDark ? 2 : 0) + (from.accent ? 1 : 0);
      const size = (from.size + (to.size-from.size)*mix) * (1+depth*.035);
      if (voxel) {
        if (color!==previousColor) {context.fillStyle = colors[color]; previousColor=color;}
        context.fillRect(x,y,size*1.35,size*1.35);
      } else {
        const sprite = sprites[color][size<1.7 ? 0 : size<2.65 ? 1 : 2];
        const diameter = size*2+2;
        context.drawImage(sprite,x-diameter/2,y-diameter/2,diameter,diameter);
      }
    }
    context.globalAlpha = 1;
    frameCount++;
    const drawMs = performance.now()-started;
    maxDrawMs = Math.max(maxDrawMs,drawMs);
    drawTimes.push(drawMs);
    if (drawTimes.length>120) drawTimes.shift();
    canvas.dataset.drawCount = String(frameCount);
    if (performance.now()-lastScrollAt<240) scrollDrawCount++;
    canvas.dataset.scrollDrawCount = String(scrollDrawCount);
    canvas.dataset.maxDrawMs = maxDrawMs.toFixed(2);
    canvas.dataset.lastDrawMs = drawMs.toFixed(2);
    canvas.dataset.sceneProgress = state.value.toFixed(3);
    canvas.dataset.activeScene = sceneNames[Math.round(value)];
    if (frameCount%30===0) {
      const sorted = [...drawTimes].sort((a,b)=>a-b);
      canvas.dataset.drawP95Ms = sorted[Math.ceil(sorted.length*.95)-1].toFixed(2);
    }
    clearTimeout(idleTimer);
    idleTimer = window.setTimeout(()=>{
      canvas.dataset.renderState = isReduced() ? 'static' : 'idle';
      canvas.dataset.idleDrawCount = String(frameCount);
    },240);
  };
  const requestDraw = () => {
    if (document.hidden || suspended || drawFrame) return;
    canvas.dataset.renderState = isReduced() ? 'static' : 'active';
    drawFrame = requestAnimationFrame(()=>{drawFrame=0; draw();});
  };
  const syncPlayback = () => {
    if (document.hidden || suspended) {
      if (drawFrame) cancelAnimationFrame(drawFrame);
      drawFrame = 0;
      clearTimeout(idleTimer);
      canvas.dataset.renderState = 'paused';
    } else requestDraw();
  };
  const syncMotion = () => {
    document.documentElement.dataset.motion = isReduced() ? 'reduced' : 'full';
    if (button) {
      button.hidden=false;
      button.setAttribute('aria-pressed',String(isReduced()));
      button.disabled=reduced.matches;
      button.title=reduced.matches ? button.dataset.systemLabel || '' : '';
    }
    pointerX=pointerY=0;
    syncPlayback();
  };
  const rebuildScroll = () => {
    trigger?.kill(); timeline?.kill();
    const maximum = Math.max(1,ScrollTrigger.maxScroll(window));
    state.value=0;
    timeline=gsap.timeline({paused:true,onUpdate:requestDraw});
    let previous=0;
    sections.slice(1).forEach((section,i)=>{
      const top=section.getBoundingClientRect().top + scrollY;
      const anchor=Math.min(maximum,Math.max(previous+1,top+Math.max(0,(section.offsetHeight-height)/2)));
      timeline!.to(state,{value:i+1,duration:Math.max(1,anchor-previous),ease:'none'});
      previous=anchor;
    });
    if (previous<maximum) timeline.to(state,{value:sections.length-1,duration:maximum-previous,ease:'none'});
    trigger=ScrollTrigger.create({animation:timeline,start:0,end:maximum,scrub:isReduced() ? true : .12,onUpdate:markScroll});
    trigger.refresh();
    timeline.progress(Math.min(1,scrollY/maximum));
    markRectsDirty();
    requestDraw();
  };
  const resize = () => {
    width=innerWidth; height=innerHeight;
    const dpr=Math.min(devicePixelRatio || 1,1.5);
    canvas.width=Math.round(width*dpr); canvas.height=Math.round(height*dpr);
    context.setTransform(dpr,0,0,dpr,0,0);
    worlds=buildMatterScenes(mobile.matches ? 600 : 1800,mobile.matches);
    phaseCos=new Float32Array(worlds[0].length);
    phaseSin=new Float32Array(worlds[0].length);
    buildDrawingShapes(dpr);
    canvas.dataset.particleCount=String(worlds[0].length);
    markRectsDirty(); rebuildScroll(); requestDraw();
  };
  let resizeFrame=0;
  window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame); resizeFrame=requestAnimationFrame(resize);},{passive:true});
  window.addEventListener('scroll',markScroll,{passive:true});
  window.addEventListener('pointermove',event=>{
    if (!finePointer.matches || isReduced() || !width || !height) return;
    const x=(event.clientX/width-.5)*14, y=(event.clientY/height-.5)*10;
    if (Math.abs(x-pointerX)<.1 && Math.abs(y-pointerY)<.1) return;
    pointerX=x; pointerY=y; requestDraw();
  },{passive:true});
  document.addEventListener('visibilitychange',()=>{markRectsDirty(); syncPlayback();});
  window.addEventListener('pagehide',()=>{suspended=true; syncPlayback();});
  window.addEventListener('pageshow',()=>{suspended=false; markRectsDirty(); syncPlayback();});
  reduced.addEventListener('change',()=>{syncMotion(); rebuildScroll();});
  button?.addEventListener('click',()=>{
    if (reduced.matches) return;
    manualReduced=!manualReduced;
    try {if (manualReduced) localStorage.setItem('portfolio-reduced-motion','true'); else localStorage.removeItem('portfolio-reduced-motion');} catch { /* The control works for this visit. */ }
    syncMotion(); rebuildScroll();
  });
  resize();
  canvas.classList.remove('hidden');
  document.documentElement.dataset.matterReady='true';
  syncMotion();
  void document.fonts.ready.then(()=>{markRectsDirty(); rebuildScroll(); requestDraw();});
  document.querySelectorAll<HTMLImageElement>('img').forEach(image=>image.addEventListener('load',()=>{markRectsDirty(); rebuildScroll(); requestDraw();},{once:true}));
}

export function initializePortfolio() {
  initializeClipboard();
  try {initializeMatter();} catch {
    document.documentElement.removeAttribute('data-matter-ready');
    document.querySelector('[data-matter-canvas]')?.classList.add('hidden');
  }
}
