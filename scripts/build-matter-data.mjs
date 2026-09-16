import {mkdir, readFile, writeFile} from 'node:fs/promises';
import sharp from 'sharp';

const scenes=['terrain','monitoreo','documentos','uribe','catmap','about','contact'];
const budgets={desktop:2400,mobile:850};
const rasterWidth=1000, rasterHeight=700;
const hash=(x,y,seed)=>{
  let n=Math.imul(x+seed*73,374761393)+Math.imul(y+seed*19,668265263);
  n=Math.imul(n^(n>>>13),1274126177);
  return ((n^(n>>>16))>>>0)/4294967296;
};
const morton=(x,y)=>{
  let result=0;
  const a=Math.round(x*1023), b=Math.round(y*1023);
  for(let bit=0;bit<10;bit++) result|=((a>>bit)&1)<<(bit*2)|((b>>bit)&1)<<(bit*2+1);
  return result;
};
const progressiveOrder=count=>{
  const order=[], seen=new Set();
  for(let i=0;order.length<count;i++) {
    let reversed=0, value=i;
    for(let bit=0;bit<12;bit++){reversed=(reversed<<1)|(value&1);value>>=1;}
    const position=Math.floor(reversed*count/4096);
    if(!seen.has(position)){seen.add(position);order.push(position);}
  }
  return order;
};
function choose(candidates,count,seed) {
  const ordered=candidates.sort((a,b)=>a.score-b.score);
  const selected=[], usedPixels=new Set();
  for(const cell of [9,6,3,1]) {
    const cells=new Set(selected.map(p=>`${Math.floor(p.x/cell)},${Math.floor(p.y/cell)}`));
    for(const point of ordered) {
      if(selected.length===count) break;
      const pixel=point.y*rasterWidth+point.x;
      const key=`${Math.floor(point.x/cell)},${Math.floor(point.y/cell)}`;
      if(usedPixels.has(pixel)||cells.has(key)) continue;
      selected.push(point);usedPixels.add(pixel);cells.add(key);
    }
    if(selected.length===count) break;
  }
  if(selected.length<count) throw new Error(`${seed}: SVG has ${selected.length} usable points; needs ${count}. Add filled stipple regions.`);
  return selected;
}
async function renderScene(name,variant,count,seed) {
  const path=new URL(`../public/matter-svg/${name}${variant==='mobile'?'-mobile':''}.svg`,import.meta.url);
  const svg=await readFile(path);
  const {data,info}=await sharp(svg).resize(rasterWidth,rasterHeight,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}})
    .ensureAlpha().raw().toBuffer({resolveWithObject:true});
  if(info.width!==rasterWidth||info.height!==rasterHeight||info.channels!==4) throw new Error(`Unexpected raster for ${name}`);
  const base=[], blue=[];
  for(let y=0;y<rasterHeight;y++) for(let x=0;x<rasterWidth;x++) {
    const offset=(y*rasterWidth+x)*4, alpha=data[offset+3];
    if(alpha<88) continue;
    const accent=data[offset+2]-data[offset]>70 && data[offset+2]-data[offset+1]>55;
    const point={x,y,alpha,accent,score:hash(x,y,seed)/(alpha/255)};
    (accent?blue:base).push(point);
  }
  const blueCount=Math.min(Math.round(count*.035),blue.length);
  const selected=[...choose(base,count-blueCount,`${name}/${variant}`),...choose(blue,blueCount,`${name}/${variant}/blue`)];
  selected.sort((a,b)=>morton(a.x/rasterWidth,a.y/rasterHeight)-morton(b.x/rasterWidth,b.y/rasterHeight));
  return progressiveOrder(count).map(position=>selected[position]);
}
for(const [variant,count] of Object.entries(budgets)) {
  const scenePoints=await Promise.all(scenes.map((name,index)=>renderScene(name,variant,count,index+1)));
  const bytes=Buffer.alloc(8+scenes.length*count*6);
  bytes.write('MATR',0,'ascii');bytes.writeUInt8(1,4);bytes.writeUInt8(scenes.length,5);bytes.writeUInt16LE(count,6);
  let offset=8;
  for(const world of scenePoints) for(const point of world) {
    bytes.writeUInt16LE(Math.round(point.x/rasterWidth*65535),offset);offset+=2;
    bytes.writeUInt16LE(Math.round(point.y/rasterHeight*65535),offset);offset+=2;
    bytes.writeUInt8(point.alpha,offset++);bytes.writeUInt8(point.accent?1:0,offset++);
  }
  await mkdir(new URL('../public/matter-data/',import.meta.url),{recursive:true});
  await writeFile(new URL(`../public/matter-data/${variant}.bin`,import.meta.url),bytes);
  console.log(`${variant}: ${count} points × ${scenes.length} scenes, ${bytes.length} bytes`);
}
