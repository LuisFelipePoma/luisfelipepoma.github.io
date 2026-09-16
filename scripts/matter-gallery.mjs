import {mkdir, readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

const names=['terrain','monitoreo','documentos','uribe','catmap','about','contact'];
const width=480, height=336, gap=24, label=42, columns=2;
const rows=names.length;
const galleryWidth=columns*width+(columns+1)*gap;
const galleryHeight=rows*(height+label)+(rows+1)*gap;
const layers=[];
const pointLayers=[];
const dataByVariant={desktop:await readFile(new URL('../public/matter-data/desktop.bin',import.meta.url)),mobile:await readFile(new URL('../public/matter-data/mobile.bin',import.meta.url))};
for (const [index,name] of names.entries()) {
  for (const [column,suffix] of ['', '-mobile'].entries()) {
    const left=gap+column*(width+gap);
    const top=gap+index*(height+label+gap);
    const dark=name==='documentos';
    const backdrop=await sharp({create:{width,height,channels:4,background:dark?'#11110f':'#f2efe7'}}).png().toBuffer();
    layers.push({input:backdrop,left,top});
    pointLayers.push({input:backdrop,left,top});
    const svg=await readFile(new URL(`../public/matter-svg/${name}${suffix}.svg`,import.meta.url));
    const image=await sharp(svg).resize(width,height,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
    layers.push({input:image,left,top});
    const variant=suffix?'mobile':'desktop', data=dataByVariant[variant];
    const count=data.readUInt16LE(6), baseOffset=8+index*count*6;
    let circles='';
    for(let point=0;point<count;point++) {
      const offset=baseOffset+point*6;
      const x=data.readUInt16LE(offset)/65535*width;
      const y=data.readUInt16LE(offset+2)/65535*height;
      const accent=data.readUInt8(offset+5)===1;
      const color=accent?(dark?'#91a4ff':'#3157ff'):(dark?'#f2efe7':'#11110f');
      const opacity=(.48+data.readUInt8(offset+4)/255*.34).toFixed(2);
      circles+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${variant==='mobile'?(accent?4.2:3.1):(accent?1.9:1.35)}" fill="${color}" opacity="${opacity}"/>`;
    }
    const pointSvg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${circles}</svg>`;
    pointLayers.push({input:await sharp(Buffer.from(pointSvg)).png().toBuffer(),left,top});
    const title=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${label}"><text x="8" y="27" font-family="Arial,sans-serif" font-size="19" fill="#11110f">${index+1}. ${name} ${suffix?'mobile':'desktop'}</text></svg>`;
    layers.push({input:Buffer.from(title),left,top:top+height});
    pointLayers.push({input:Buffer.from(title),left,top:top+height});
  }
}
await mkdir(new URL('../.impeccable/review/',import.meta.url),{recursive:true});
await sharp({create:{width:galleryWidth,height:galleryHeight,channels:4,background:'#f2efe7'}})
  .composite(layers).png().toFile(fileURLToPath(new URL('../.impeccable/review/matter-gallery.png',import.meta.url)));
await sharp({create:{width:galleryWidth,height:galleryHeight,channels:4,background:'#f2efe7'}})
  .composite(pointLayers).png().toFile(fileURLToPath(new URL('../.impeccable/review/matter-points-gallery.png',import.meta.url)));
