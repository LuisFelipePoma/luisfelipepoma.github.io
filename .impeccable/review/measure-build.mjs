import { readFile, readdir, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
const files = await readdir('dist/_astro');
const sizes = [];
for (const name of files) {
  if (!/\.(js|css|webp)$/.test(name)) continue;
  const bytes = await readFile('dist/_astro/' + name);
  sizes.push({name, bytes:bytes.length, ...(name.endsWith('.js') || name.endsWith('.css') ? {gzipBytes:gzipSync(bytes).length} : {})});
}
const result = {generatedAt:new Date().toISOString(), files:sizes, javascriptBytes:sizes.filter(f=>f.name.endsWith('.js')).reduce((a,f)=>a+f.bytes,0), javascriptGzipBytes:sizes.filter(f=>f.name.endsWith('.js')).reduce((a,f)=>a+f.gzipBytes,0)};
await writeFile('.impeccable/review/build-size.json', JSON.stringify(result,null,2));
console.log(JSON.stringify(result));
