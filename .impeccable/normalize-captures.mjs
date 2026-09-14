// Normalize CUA's JPEG screenshot bytes to PNG without changing their pixels.
import sharp from 'sharp';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve, sep} from 'node:path';
const root = resolve('.');
for (const input of process.argv.slice(2)) {
  const path = resolve(input);
  if (!path.startsWith(root + sep)) throw Error('Capture outside workspace');
  const bytes = await readFile(path);
  if (bytes.subarray(0,8).toString('hex') === '89504e470d0a1a0a') continue;
  await writeFile(path, await sharp(bytes).png().toBuffer());
}
