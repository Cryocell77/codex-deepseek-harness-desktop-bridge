import { build } from 'esbuild';
import { chmod, mkdir, writeFile } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
await build({
  entryPoints: ['src/cli.ts', 'src/desktop-plugin.ts'],
  outdir: 'dist',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  packages: 'external',
  sourcemap: true,
});
await chmod('dist/cli.js', 0o755);
await writeFile(
  'dist/build-info.json',
  JSON.stringify(
    {
      bridge: '0.1.0',
      adapter: 'dsh-v0.2.0-rc.2',
      upstream: '639ed015397290b3745d163aafe02ffee4aa3f84',
    },
    null,
    2,
  ),
);
