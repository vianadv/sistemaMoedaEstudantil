import { build } from 'esbuild';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist/cloudflare/index.js');
await mkdir(path.dirname(output), { recursive: true });

await build({
  absWorkingDir: root,
  entryPoints: ['worker/index.mjs'],
  outfile: output,
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  logLevel: 'info',
  plugins: [{
    name: 'text-assets',
    setup(builder) {
      builder.onResolve({ filter: /\?raw$/ }, args => ({
        path: path.resolve(args.resolveDir, args.path.slice(0, -4)),
        namespace: 'text-asset'
      }));
      builder.onLoad({ filter: /.*/, namespace: 'text-asset' }, async args => ({
        contents: await readFile(args.path, 'utf8'),
        loader: 'text'
      }));
    }
  }]
});
console.log('Worker gerado em dist/cloudflare/index.js');
