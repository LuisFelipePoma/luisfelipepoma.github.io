import {readFile,mkdir} from 'node:fs/promises';
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';

const bytes=await readFile(new URL('../public/matter-lab/terrain-desktop.bin',import.meta.url));
const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
const count=view.getUint32(4,true);
const phases=[0,.25,.5,.75,1];
const width=800,height=330,gap=18,label=31;
const rise=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
const panels=[];
for(const progress of phases) {
  const dots=[];
  for(let index=0;index<count;index++) {
    const offset=8+index*18;
    const x=view.getFloat32(offset,true),z=view.getFloat32(offset+8,true);
    const layer=view.getUint8(offset+17),accent=view.getUint8(offset+16);
    const phase=index*2.399963229728653;
    const assembled=rise(layer*.045,.86+layer*.045,progress);
    const startX=x*.85+(layer-1.5)*.7+Math.cos(phase)*.75;
    const startZ=-1+z*.08+(layer-1.5)*.55+Math.sin(phase)*.9;
    const movedX=startX+(x-startX)*assembled;
    const movedZ=startZ+(z-startZ)*assembled;
    const px=(movedX+9.5)/19*width,py=(3.9-movedZ)/7.8*height;
    if(px<0||px>width||py<0||py>height) continue;
    const opacity=accent ? rise(.45,.88,assembled) : 1;
    if(opacity<.08) continue;
    dots.push(`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${accent?1.25:.49}" fill="${accent?'#3157ff':'#11110f'}" opacity="${opacity.toFixed(2)}"/>`);
  }
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height+label}"><rect width="100%" height="100%" fill="#f2efe7"/><text x="10" y="22" font-family="monospace" font-size="14" fill="#11110f">SCROLL ${Math.round(progress*100)}%</text><g transform="translate(0 ${label})">${dots.join('')}</g></svg>`;
  panels.push(await sharp(Buffer.from(svg)).png().toBuffer());
}
const destination=new URL('../.impeccable/review/matter-lab-storyboard.png',import.meta.url);
await mkdir(new URL('../.impeccable/review/',import.meta.url),{recursive:true});
await sharp({create:{width:(width+gap)*panels.length-gap,height:height+label,channels:3,background:'#f2efe7'}})
  .composite(panels.map((input,index)=>({input,left:index*(width+gap),top:0}))).png().toFile(fileURLToPath(destination));
console.log(destination.pathname);
