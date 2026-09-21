/**
 * Compiles the schematics of zenit-ui (`ng add`, `migrate-material`) into the package.
 *
 * ng-packagr never sees the `schematics` folder (tsconfig.lib.json only
 * includes `src/**`), so the schematics are built separately with plain
 * TypeScript and the JSON files are copied next to the emitted JavaScript.
 *
 *   node tools/build-schematics.mjs      # run after `ng build zenit-ui`
 */
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'projects', 'zenit-ui', 'schematics');
const target = join(root, 'dist', 'zenit-ui', 'schematics');
const tsc = createRequire(import.meta.url).resolve('typescript/bin/tsc');

const tsconfig = join(root, 'projects', 'zenit-ui', 'tsconfig.schematics.json');
const build = spawnSync(process.execPath, [tsc, '-p', tsconfig], { stdio: 'inherit' });
if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

// The schema files are read at runtime by the schematics engine and are not
// touched by tsc, so they have to be copied verbatim.
mkdirSync(target, { recursive: true });
cpSync(source, target, {
  recursive: true,
  // Test fixtures are neither code nor schema and stay out of the package.
  filter: (path) =>
    (!path.endsWith('.ts') || path.endsWith('.d.ts')) && !/[\\/]fixtures([\\/]|$)/.test(path),
});

// ng-packagr writes `"type": "module"` into dist/zenit-ui/package.json, which
// would make Node read the compiled CommonJS factories as ESM. A nested
// manifest moves this folder back to CommonJS.
writeFileSync(join(target, 'package.json'), `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`);

console.log(`schematics -> ${target}`);
