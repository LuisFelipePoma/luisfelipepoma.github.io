import {mkdir,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

const root=new URL('../',import.meta.url);
const metadata=JSON.parse(await readFile(new URL('public/matter-lab/portfolio-matter.json',root),'utf8'));
const review=new URL('.impeccable/review/',root);
const previews=new URL('public/matter-lab/previews/',root);
await Promise.all([mkdir(review,{recursive:true}),mkdir(previews,{recursive:true})]);

async function decode(name) {
  const bytes=await readFile(new URL(`public/matter-lab/portfolio-matter-${name}.bin`,root));
    const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
    if(bytes.toString('ascii',0,4)!=='PMAT') throw new Error('Invalid PMAT cache');
    const frameCount=view.getUint16(6,true),pointCount=view.getUint32(8,true),stride=view.getUint32(12,true);
    const frames=[];
    let offset=16;
    for(let frame=0;frame<frameCount;frame++) {
      const positions=new Float32Array(pointCount*3),size=new Uint8Array(pointCount),accent=new Uint8Array(pointCount),opacity=new Uint8Array(pointCount);
      for(let point=0;point<pointCount;point++,offset+=stride) {
        for(let axis=0;axis<3;axis++) {
          const q=view.getInt16(offset+axis*2,true)/32767;
          const [minimum,maximum]=metadata.bounds[axis];
          positions[point*3+axis]=minimum+(q+1)*.5*(maximum-minimum);
        }
        size[point]=view.getUint8(offset+6);accent[point]=view.getUint8(offset+7);opacity[point]=view.getUint8(offset+8);
      }
      frames.push({positions,size,accent,opacity});
    }
  return {frames,pointCount};
}

const caches={desktop:await decode('desktop'),mobile:await decode('mobile')};
const paper='#f2efe7',ink='#11110f',electric='#3157ff',darkElectric='#91a4ff';

function locate(time) {
  const scaled=Math.max(0,Math.min(metadata.frames.length-1,time*2));
  const first=Math.floor(scaled),next=Math.min(metadata.frames.length-1,first+1);
  return {first,next,mix:scaled-first};
}

function renderSvg(variant,time,width,height,limit=14000) {
  const cache=caches[variant],{first,next,mix}=locate(time),a=cache.frames[first],b=cache.frames[next];
  const themeA=metadata.frames[first].theme==='dark'?1:0,themeB=metadata.frames[next].theme==='dark'?1:0;
  const dark=themeA+(themeB-themeA)*mix>.5;
  const dots=[];
  const step=Math.max(1,Math.floor(cache.pointCount/limit));
  const aspect=width/height;
  const span=variant==='mobile'?9.4:9.2;
  const horizontal=span*aspect;
  const centerX=0;
  for(let index=0;index<cache.pointCount;index+=step) {
    const base=index*3;
    const x=a.positions[base]+(b.positions[base]-a.positions[base])*mix;
    const y=a.positions[base+1]+(b.positions[base+1]-a.positions[base+1])*mix;
    const z=a.positions[base+2]+(b.positions[base+2]-a.positions[base+2])*mix;
    const px=(x-centerX+horizontal/2)/horizontal*width;
    const py=(span/2-z-y*.045)/span*height;
    if(px<-4||px>width+4||py<-4||py>height+4) continue;
    const accent=(a.accent[index]+(b.accent[index]-a.accent[index])*mix)/255;
    const opacity=(a.opacity[index]+(b.opacity[index]-a.opacity[index])*mix)/255;
    const radius=(a.size[index]+(b.size[index]-a.size[index])*mix)/52*(variant==='mobile'?.62:.5);
    const baseColor=dark?'#f2efe7':ink;
    dots.push(`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${Math.max(.35,radius).toFixed(2)}" fill="${accent>.35?(dark?darkElectric:electric):baseColor}" opacity="${opacity.toFixed(2)}"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${dark?ink:paper}"/><g>${dots.join('')}</g></svg>`;
}

const desktopBuffers=[],mobileBuffers=[];
for(const scene of metadata.scenes) {
  const desktop=await sharp(Buffer.from(renderSvg('desktop',scene.time,1000,420))).png().toBuffer();
  const mobile=await sharp(Buffer.from(renderSvg('mobile',scene.time,320,420,9000))).png().toBuffer();
  await Promise.all([
    sharp(desktop).toFile(fileURLToPath(new URL(`${scene.id}-desktop.png`,previews))),
    sharp(mobile).toFile(fileURLToPath(new URL(`${scene.id}-mobile.png`,previews))),
  ]);
  desktopBuffers.push(desktop);mobileBuffers.push(mobile);
}

for(let index=0;index<metadata.scenes.length;index++) {
  const end=metadata.scenes[index].time,start=index===0?0:metadata.scenes[index-1].time;
  const panels=[];
  for(const fraction of [0,.25,.5,.75,1]) {
    const svg=renderSvg('desktop',start+(end-start)*fraction,360,180,7000);
    const label=`<svg xmlns="http://www.w3.org/2000/svg" width="360" height="210"><rect width="100%" height="100%" fill="${paper}"/><image href="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}" width="360" height="180"/><text x="12" y="200" font-family="monospace" font-size="11" fill="${ink}">${Math.round(fraction*100)}%</text></svg>`;
    panels.push(await sharp(Buffer.from(label)).png().toBuffer());
  }
  await sharp({create:{width:1800,height:210,channels:3,background:paper}}).composite(panels.map((input,left)=>({input,left:left*360,top:0}))).png().toFile(fileURLToPath(new URL(`transition-${index+1}.png`,previews)));
}

const tileWidth=1000,tileHeight=470,gap=24,columns=2,rows=Math.ceil(desktopBuffers.length/columns);
const gallery=sharp({create:{width:tileWidth*columns+gap*(columns-1),height:tileHeight*rows+gap*(rows-1),channels:3,background:paper}});
const composites=[];
for(let index=0;index<desktopBuffers.length;index++) {
  const label=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="50"><rect width="100%" height="100%" fill="${paper}"/><text x="12" y="31" font-family="monospace" font-size="15" fill="${ink}">${String(index+1).padStart(2,'0')} / ${metadata.scenes[index].id.toUpperCase()}</text></svg>`);
  const x=index%columns*(tileWidth+gap),y=Math.floor(index/columns)*(tileHeight+gap);
  composites.push({input:desktopBuffers[index],left:x,top:y},{input:label,left:x,top:y+420});
}
await gallery.composite(composites).png().toFile(fileURLToPath(new URL('portfolio-matter-gallery.png',review)));
console.log(fileURLToPath(new URL('portfolio-matter-gallery.png',review)));
