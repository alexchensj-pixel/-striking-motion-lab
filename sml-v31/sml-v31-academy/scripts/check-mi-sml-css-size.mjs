import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const assetsDir = new URL('../dist/assets/', import.meta.url);
const { pathname } = assetsDir;
const files = await readdir(pathname);
const cssFile = files.find((name) => /^MiSML-.*\.css$/i.test(name));
if (!cssFile) {
  console.error('MI SML CSS size check failed: no MiSML-*.css found in dist/assets.');
  process.exit(1);
}
const { size } = await stat(join(pathname, cssFile));
console.log(`MI SML CSS size: ${size} bytes (${cssFile})`);
if (size < 3400) {
  console.error(`MI SML CSS is unexpectedly small (${size} bytes; minimum 3400). Build stopped.`);
  process.exit(1);
}
