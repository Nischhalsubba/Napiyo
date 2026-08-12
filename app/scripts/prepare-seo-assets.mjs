import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const parts = [
  resolve(root, 'seo-assets/social-preview.part1.b64'),
  resolve(root, 'seo-assets/social-preview.part2.b64'),
];
const output = resolve(root, 'public/napiyo-social-preview-v1.png');

const encoded = parts.map((path) => readFileSync(path, 'utf8').trim()).join('');
const image = Buffer.from(encoded, 'base64');
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

if (image.length < 10_000 || !image.subarray(0, 8).equals(pngSignature)) {
  throw new Error('Napiyo social preview data is not a valid PNG image.');
}

const width = image.readUInt32BE(16);
const height = image.readUInt32BE(20);
if (width !== 1200 || height !== 630) {
  throw new Error(`Napiyo social preview must be 1200x630, received ${width}x${height}.`);
}

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, image);
console.log(`Prepared ${output} (${width}x${height}, ${image.length} bytes).`);
