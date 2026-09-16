export interface MatterPoint {x:number; y:number; z:number; size:number; alpha:number; accent:boolean}
export const sceneNames = ['terrain', 'monitoreo', 'documentos', 'uribe', 'catmap', 'about', 'contact'] as const;

/** Decode artist-authored SVG samples. Prefixes remain spatially distributed at lower budgets. */
export function decodeMatterScenes(input:ArrayBuffer | Uint8Array):MatterPoint[][] {
  const bytes=input instanceof Uint8Array ? input : new Uint8Array(input);
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  if(bytes.byteLength<8 || String.fromCharCode(...bytes.slice(0,4))!=='MATR' || view.getUint8(4)!==1 || view.getUint8(5)!==sceneNames.length)
    throw new Error('Unsupported matter data');
  const count=view.getUint16(6,true);
  if(bytes.byteLength!==8+sceneNames.length*count*6) throw new Error('Incomplete matter data');
  let offset=8;
  return sceneNames.map(()=>Array.from({length:count},(_,index)=>{
    const x=view.getUint16(offset,true)/65535;offset+=2;
    const y=view.getUint16(offset,true)/65535;offset+=2;
    const sourceAlpha=view.getUint8(offset++)/255;
    const accent=view.getUint8(offset++)===1;
    const mobile=count<=850;
    return {x,y,z:((index*17)%13-6)*.045,size:accent?(mobile?3.3:2.4):(mobile?2.1:1.3)+(index%7)*.075,alpha:.48+sourceAlpha*.34,accent};
  }));
}

const cache=new Map<string,Promise<MatterPoint[][]>>();
export function loadMatterScenes(mobile:boolean):Promise<MatterPoint[][]> {
  const variant=mobile?'mobile':'desktop';
  if(!cache.has(variant)) cache.set(variant,fetch(`${import.meta.env.BASE_URL}matter-data/${variant}.bin`)
    .then(response=>{if(!response.ok) throw new Error(`Matter data ${response.status}`);return response.arrayBuffer();})
    .then(decodeMatterScenes));
  return cache.get(variant)!;
}
