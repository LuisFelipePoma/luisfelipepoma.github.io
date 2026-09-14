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
  let quietRects: DOMRect[] = [], darkRects: DOMRect[] = [];
  let zoneRects: (DOMRect | undefined)[] = [];
  let width = 0, height = 0, frameCount = 0, maxDrawMs = 0;
  let previousFrame = 0, pointerX = 0, pointerY = 0;
  let manualReduced = false, attached = false, suspended = false;
  let worlds = buildMatterScenes(mobile.matches ? 600 : 1800, mobile.matches);
  let timeline: gsap.core.Timeline | undefined;
  let trigger: ScrollTrigger | undefined;
  const state = {value:0};
  try {manualReduced = localStorage.getItem('portfolio-reduced-motion') === 'true';} catch { /* System preference remains available. */ }
  const isReduced = () => reduced.matches || manualReduced;
  const updateRects = () => {
    quietRects = quiet.map(e=>e.getBoundingClientRect());
    darkRects = darkSections.map(e=>e.getBoundingClientRect());
    zoneRects = zones.map(e=>e?.getBoundingClientRect());
  };

  const draw = (time=0) => {
    if (document.hidden || suspended || !width || !height) return;
    const started = performance.now();
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
    context.clearRect(0,0,width,height);
    const living = isReduced() ? 0 : Math.sin(time * .23);
    for (let i=0;i<a.length;i++) {
      const from = a[i], to = b[i], depth = from.z + (to.z - from.z) * mix;
      const phase = i * 2.399963;
      const startX=sourcePlane.left+from.x*sourcePlane.width, endX=targetPlane.left+to.x*targetPlane.width;
      const startY=sourcePlane.top+from.y*sourcePlane.height, endY=targetPlane.top+to.y*targetPlane.height;
      const x = startX+(endX-startX)*mix + Math.cos(phase)*scatter*width + living * depth * 5 + pointerX * depth;
      const y = startY+(endY-startY)*mix + Math.sin(phase)*scatter*height + Math.cos(time*.17)*living*depth*4 + pointerY * depth;
      const onDark = darkRects.some(r=>y>=r.top && y<=r.bottom);
      // Exclude complete particle footprints, including breathing/scatter,
      // rather than fading particles over text, diagrams or image frames.
      const behindCopy = quietRects.some(r=>x>=r.left-16 && x<=r.right+16 && y>=r.top-16 && y<=r.bottom+16);
      if (behindCopy) continue;
      const alpha = from.alpha + (to.alpha-from.alpha)*mix;
      context.globalAlpha = alpha * (isReduced() ? 1 : .88 + .12*Math.sin(i*.7+time));
      context.fillStyle = from.accent ? onDark ? '#91a4ff' : '#3157ff' : onDark ? '#f2efe7' : '#11110f';
      const size = (from.size + (to.size-from.size)*mix) * (1+depth*.035);
      if ((value>1.5 && value<2.5) || (value>4.5 && value<5.5)) context.fillRect(x,y,size*1.35,size*1.35);
      else {context.beginPath(); context.arc(x,y,size,0,Math.PI*2); context.fill();}
    }
    context.globalAlpha = 1;
    frameCount++;
    maxDrawMs = Math.max(maxDrawMs,performance.now()-started);
    canvas.dataset.drawCount = String(frameCount);
    canvas.dataset.maxDrawMs = maxDrawMs.toFixed(2);
    canvas.dataset.sceneProgress = state.value.toFixed(3);
    canvas.dataset.activeScene = sceneNames[Math.round(value)];
  };
  const frame = (time:number) => {
    if (time-previousFrame < 1/30) return;
    previousFrame = time;
    draw(time);
  };
  const syncPlayback = () => {
    const play = !isReduced() && !document.hidden && !suspended;
    if (play && !attached) {gsap.ticker.add(frame); attached=true;}
    else if (!play && attached) {gsap.ticker.remove(frame); attached=false;}
    canvas.dataset.renderState = play ? 'continuous' : document.hidden || suspended ? 'paused' : 'static';
    draw();
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
    timeline=gsap.timeline({paused:true,onUpdate:()=>{if (isReduced()) draw();}});
    let previous=0;
    sections.slice(1).forEach((section,i)=>{
      const top=section.getBoundingClientRect().top + scrollY;
      const anchor=Math.min(maximum,Math.max(previous+1,top+Math.max(0,(section.offsetHeight-height)/2)));
      timeline!.to(state,{value:i+1,duration:Math.max(1,anchor-previous),ease:'none'});
      previous=anchor;
    });
    if (previous<maximum) timeline.to(state,{value:sections.length-1,duration:maximum-previous,ease:'none'});
    trigger=ScrollTrigger.create({animation:timeline,start:0,end:maximum,scrub:isReduced() ? true : .55,onUpdate:updateRects});
    trigger.refresh();
    timeline.progress(Math.min(1,scrollY/maximum));
  };
  const resize = () => {
    width=innerWidth; height=innerHeight;
    const dpr=Math.min(devicePixelRatio || 1,1.5);
    canvas.width=Math.round(width*dpr); canvas.height=Math.round(height*dpr);
    context.setTransform(dpr,0,0,dpr,0,0);
    worlds=buildMatterScenes(mobile.matches ? 600 : 1800,mobile.matches);
    canvas.dataset.particleCount=String(worlds[0].length);
    updateRects(); rebuildScroll(); draw();
  };
  let resizeFrame=0;
  window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame); resizeFrame=requestAnimationFrame(resize);},{passive:true});
  window.addEventListener('scroll',()=>{updateRects(); if (isReduced()) draw();},{passive:true});
  window.addEventListener('pointermove',event=>{
    if (!finePointer.matches || isReduced()) return;
    pointerX=(event.clientX/width-.5)*14;
    pointerY=(event.clientY/height-.5)*10;
  },{passive:true});
  document.addEventListener('visibilitychange',()=>{updateRects(); syncPlayback();});
  window.addEventListener('pagehide',()=>{suspended=true; syncPlayback();});
  window.addEventListener('pageshow',()=>{suspended=false; updateRects(); syncPlayback();});
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
  void document.fonts.ready.then(()=>{updateRects(); rebuildScroll(); draw();});
  document.querySelectorAll<HTMLImageElement>('img').forEach(image=>image.addEventListener('load',()=>{updateRects(); rebuildScroll();},{once:true}));
}

export function initializePortfolio() {
  initializeClipboard();
  try {initializeMatter();} catch {
    document.documentElement.removeAttribute('data-matter-ready');
    document.querySelector('[data-matter-canvas]')?.classList.add('hidden');
  }
}
