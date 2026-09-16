import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root=path.resolve(import.meta.dirname,'..');
const publicDir=path.join(root,'public','matter-lab','dyson');
const metadata=JSON.parse(await readFile(path.join(publicDir,'dyson.json'),'utf8'));
const variant=metadata.variants.desktop;
const binary=await readFile(path.join(root,'public',variant.src));

if(binary.toString('ascii',0,4)!=='DYPC'||binary.readUInt16LE(4)!==1) throw new Error('Invalid DYPC cache');

let byteOffset=16;
const groups=variant.groups.map(group=>{
  const positions=new Float32Array(group.count*3);
  for(let index=0;index<group.count;index++,byteOffset+=8) {
    for(let axis=0;axis<3;axis++) {
      const q=binary.readInt16LE(byteOffset+axis*2)/32767;
      const [minimum,maximum]=group.bounds[axis];
      positions[index*3+axis]=minimum+(q+1)*.5*(maximum-minimum);
    }
  }
  return {id:group.id,positions};
});

function slerp(a,b,t) {
  let cosine=a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3];
  const target=[...b];
  if(cosine<0) {cosine=-cosine;for(let index=0;index<4;index++) target[index]*=-1;}
  if(cosine>.9995) {
    const value=a.map((component,index)=>component+(target[index]-component)*t);
    const length=Math.hypot(...value);return value.map(component=>component/length);
  }
  const angle=Math.acos(Math.min(1,cosine));
  const sine=Math.sin(angle);
  const wa=Math.sin((1-t)*angle)/sine,wb=Math.sin(t*angle)/sine;
  return a.map((component,index)=>component*wa+target[index]*wb);
}

function rotate(x,y,z,[qx,qy,qz,qw]) {
  const tx=2*(qy*z-qz*y),ty=2*(qz*x-qx*z),tz=2*(qx*y-qy*x);
  return [x+qw*tx+qy*tz-qz*ty,y+qw*ty+qz*tx-qx*tz,z+qw*tz+qx*ty-qy*tx];
}

function quaternionAt(id,progress) {
  if(id==='NUCLEUS') return [0,0,0,1];
  const track=metadata.tracks[id];
  const scaled=progress*(track.length-1),first=Math.floor(scaled),next=Math.min(track.length-1,first+1);
  return slerp(track[first],track[next],scaled-first);
}

const paper='#f2efe7',ink='#11110f';
const panels=[];
for(const progress of [0,.25,.5,.75,1]) {
  const circles=[];
  for(const group of groups) {
    const quaternion=quaternionAt(group.id,progress);
    const step=Math.max(1,Math.ceil(group.positions.length/3/9000));
    for(let index=0;index<group.positions.length/3;index+=step) {
      const [x,y,z]=rotate(group.positions[index*3],group.positions[index*3+1],group.positions[index*3+2],quaternion);
      // Same orthographic viewing direction as the browser camera.
      const screenX=x;
      const screenY=z*.987+y*.16;
      const px=210+screenX*22.5,py=157-screenY*22.5;
      if(px<4||px>416||py<30||py>292) continue;
      const radius=group.id==='NUCLEUS'?.52:.38;
      circles.push(`<circle cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="${radius}"/>`);
    }
  }
  const label=String(Math.round(progress*100)).padStart(3,'0')+'%';
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="420" height="300" viewBox="0 0 420 300"><rect width="420" height="300" fill="${paper}"/><text x="14" y="20" font-family="monospace" font-size="10" letter-spacing="2" fill="#66635c">${label}</text><g fill="${ink}" fill-opacity=".82">${circles.join('')}</g><rect x=".5" y=".5" width="419" height="299" fill="none" stroke="#11110f" stroke-opacity=".18"/></svg>`;
  panels.push(await sharp(Buffer.from(svg)).png().toBuffer());
}

const gap=12,panelWidth=420,panelHeight=300,width=panelWidth*panels.length+gap*(panels.length-1);
const output=sharp({create:{width,height:panelHeight,channels:4,background:paper}}).composite(panels.map((input,index)=>({input,left:index*(panelWidth+gap),top:0})));
const destination=path.join(publicDir,'dyson-storyboard.png');
await output.png().toFile(destination);
await mkdir(path.join(root,'.impeccable','review'),{recursive:true});
await writeFile(path.join(root,'.impeccable','review','dyson-storyboard.png'),await readFile(destination));

const poseCircles=[];
for(const group of groups) {
  const quaternion=quaternionAt(group.id,0);
  for(let index=0;index<group.positions.length/3;index++) {
    const [x,y,z]=rotate(group.positions[index*3],group.positions[index*3+1],group.positions[index*3+2],quaternion);
    const px=800+x*52,py=450-(z*.987+y*.16)*52;
    if(px<4||px>1596||py<4||py>896) continue;
    poseCircles.push(`<circle cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="${group.id==='NUCLEUS'?.72:.5}"/>`);
  }
}
const poseSvg=`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900"><rect width="1600" height="900" fill="${paper}"/><g fill="${ink}" fill-opacity=".82">${poseCircles.join('')}</g></svg>`;
await sharp(Buffer.from(poseSvg)).png().toFile(path.join(publicDir,'dyson-pose.png'));
console.log(`Wrote ${destination}`);
