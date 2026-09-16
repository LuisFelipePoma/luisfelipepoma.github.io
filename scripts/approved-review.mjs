import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const root=path.resolve(import.meta.dirname,'..');
const out=path.join(root,'public/matter-approved');
const review=path.join(root,'.impeccable/review/approved');await mkdir(review,{recursive:true});
const meta=JSON.parse(await readFile(path.join(out,'manifest.json'),'utf8'));
const buffer=await readFile(path.join(root,'public',meta.variants.desktop.src));
const count=meta.variants.desktop.count;
const frames=meta.samples.map((_,i)=>new Int16Array(buffer.buffer,buffer.byteOffset+16+i*count*6,count*3));
const paper='#f2efe7',ink='#11110f';
async function panel(time,width=360,height=250){
  const index=Math.round(time*8),frame=frames[index];
  const dark=Math.abs(time-2)<.26;
  const bg=dark?ink:paper,fg=dark?paper:ink;
  let maxX=0,maxZ=0;
  for(let i=0;i<count;i++){maxX=Math.max(maxX,Math.abs(frame[i*3]/32767*meta.bound));maxZ=Math.max(maxZ,Math.abs(frame[i*3+2]/32767*meta.bound));}
  const scale=Math.min((width-28)/(2*maxX),(height-40)/(2*maxZ));
  const points=[];
  for(let i=0;i<count;i++){
    const x=width/2+frame[i*3]/32767*meta.bound*scale;
    const y=(height+16)/2-frame[i*3+2]/32767*meta.bound*scale;
    points.push(`<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r=".38"/>`);
  }
  return sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${bg}"/><g fill="${fg}" opacity=".82">${points.join('')}</g></svg>`)).png().toBuffer();
}
const composites=[];
for(let row=0;row<6;row++)for(let col=0;col<5;col++){
  composites.push({input:await panel(row+col/4),left:col*360,top:row*250});
}
await sharp({create:{width:1800,height:1500,channels:4,background:paper}}).composite(composites).png().toFile(path.join(out,'transitions.png'));

const gallery=[];
for(let i=0;i<7;i++){
  const entry=meta.scenes[i],bg=entry.dark?ink:paper;
  const ref=await sharp(path.join(root,entry.reference)).resize(440,300,{fit:'contain',background:bg}).flatten({background:bg}).png().toBuffer();
  const render=await sharp(path.join(out,entry.id+'.png')).resize(440,300,{fit:'contain',background:bg}).flatten({background:bg}).png().toBuffer();
  gallery.push({input:ref,left:0,top:i*300},{input:render,left:440,top:i*300},{input:await panel(i,440,300),left:880,top:i*300});
}
await sharp({create:{width:1320,height:2100,channels:4,background:paper}}).composite(gallery).png().toFile(path.join(review,'reference-blender-export.png'));
await writeFile(path.join(review,'provenance.json'),JSON.stringify({columns:['approved reference','Blender EEVEE render','quantized animation cache'],source:meta.source,method:meta.method,scenes:meta.scenes},null,2));
console.log('Saved reference/Blender/cache comparison and all six transition strips.');
