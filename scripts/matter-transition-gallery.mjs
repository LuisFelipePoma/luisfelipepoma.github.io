import {mkdir,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

const names=['terrain','monitoreo','documentos','uribe','catmap','about','contact'];
const data=await readFile(new URL('../public/matter-data/desktop.bin',import.meta.url));
const count=data.readUInt16LE(6),width=320,height=224,label=34,gap=16;
const totalWidth=3*width+4*gap,totalHeight=6*(height+label)+7*gap;
const layers=[];
for(let scene=0;scene<names.length-1;scene++) for(const [column,mix] of [0,.5,1].entries()) {
  const left=gap+column*(width+gap),top=gap+scene*(height+label+gap);
  const dark=scene===2;
  layers.push({input:await sharp({create:{width,height,channels:4,background:dark?'#11110f':'#f2efe7'}}).png().toBuffer(),left,top});
  let dots='';
  for(let index=0;index<count;index++) {
    const a=8+(scene*count+index)*6,b=8+((scene+1)*count+index)*6;
    const travels=index%5===0;
    const threshold=.06+((index*.61803398875)%1)*.88;
    const selected=mix<threshold?a:b;
    const x=(travels?data.readUInt16LE(a)*(1-mix)+data.readUInt16LE(b)*mix:data.readUInt16LE(selected))/65535*width;
    const y=(travels?data.readUInt16LE(a+2)*(1-mix)+data.readUInt16LE(b+2)*mix:data.readUInt16LE(selected+2))/65535*height;
    const accent=travels?(data.readUInt8(a+5)?1-mix:0)+(data.readUInt8(b+5)?mix:0):data.readUInt8(selected+5);
    const visibility=travels?1:Math.min(1,Math.abs(mix-threshold)/.045);
    const base=dark?'#f2efe7':'#11110f',blue=dark?'#91a4ff':'#3157ff';
    dots+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.1" fill="${base}" opacity="${(.7*visibility*(1-accent)).toFixed(2)}"/>`;
    if(accent) dots+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.7" fill="${blue}" opacity="${(.7*visibility*accent).toFixed(2)}"/>`;
  }
  layers.push({input:await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${dots}</svg>`)).png().toBuffer(),left,top});
  const title=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${label}"><text x="4" y="23" font-family="Arial" font-size="15" fill="#11110f">${names[scene]} → ${names[scene+1]} · ${mix}</text></svg>`;
  layers.push({input:Buffer.from(title),left,top:top+height});
}
await mkdir(new URL('../.impeccable/review/',import.meta.url),{recursive:true});
await sharp({create:{width:totalWidth,height:totalHeight,channels:4,background:'#f2efe7'}}).composite(layers).png()
  .toFile(fileURLToPath(new URL('../.impeccable/review/matter-transitions.png',import.meta.url)));
