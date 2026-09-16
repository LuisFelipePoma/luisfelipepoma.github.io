export const approvedScenes = ['terrain','monitoreo','documentos','uribe','catmap','about','contact'] as const;
export interface ApprovedManifest {
  format: 'APC1'; version: number; duration: number; bound: number; samples: number[];
  scenes: {id:string; time:number; frame:number; dark:boolean; aspect:number}[];
  variants: Record<'desktop'|'mobile',{src:string;count:number;bytes:number}>;
}

/** Normalized int16 arrays upload directly to GPU, avoiding float duplication. */
export function decodeApproved(buffer:ArrayBuffer, manifest:ApprovedManifest, variant:'desktop'|'mobile') {
  const view=new DataView(buffer), spec=manifest.variants[variant];
  if(buffer.byteLength<16 || view.getUint32(0,true)!==0x31435041) throw new Error('Invalid APC1 header');
  const samples=view.getUint32(4,true), count=view.getUint32(8,true), stride=view.getUint32(12,true);
  if(manifest.version!==1 || manifest.format!=='APC1' || samples!==manifest.samples.length || count!==spec.count || stride!==6 || buffer.byteLength!==16+samples*count*6 || buffer.byteLength!==spec.bytes) throw new Error('Incomplete Blender export');
  if(!Number.isFinite(manifest.bound)||manifest.bound<=0) throw new Error('Invalid export domain');
  return Array.from({length:samples},(_,i)=>new Int16Array(buffer,16+i*count*6,count*3));
}

export function samplePair(time:number,samples:number[]) {
  const scaled=Math.max(0,Math.min(samples.length-1,time/(samples.at(-1)||1)*(samples.length-1)));
  const first=Math.floor(scaled);
  return {first,next:Math.min(samples.length-1,first+1),mix:scaled-first};
}

/** Hold each recognizable form; transition only through the middle of the interval. */
export function sectionTime(scroll:number, anchors:number[]) {
  if(scroll<=anchors[0]) return 0;
  for(let i=0;i<anchors.length-1;i++) {
    if(scroll<=anchors[i+1]) {
      const fraction=(scroll-anchors[i])/Math.max(1,anchors[i+1]-anchors[i]);
      return i+Math.max(0,Math.min(1,(fraction-.16)/.68));
    }
  }
  return anchors.length-1;
}

export function fitPlane(rect:{left:number;top:number;width:number;height:number},aspect:number,viewportHeight:number) {
  const height=Math.min(rect.height,viewportHeight-32);
  const top=Math.max(16,Math.min(viewportHeight-height-16,rect.top));
  // Geometry's longest projected dimension is 1.78 Blender units.
  const sx=aspect>=1?1.78:1.78*aspect;
  const sy=aspect>=1?1.78/aspect:1.78;
  return {x:rect.left+rect.width/2,y:top+height/2,scale:Math.min(rect.width/sx,height/sy)*.93};
}
