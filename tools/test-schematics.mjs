/**
 * Runs the unit tests of the `ng add` schematic.
 *
 * The schematics engine loads factories through `require()`, so the collection
 * has to be compiled first; the specs themselves run straight from TypeScript
 * through Vitest, which is already a devDependency of the workspace. Node's
 * built-in test runner would need `@types/node` plus a second compile step for
 * the specs, so Vitest is the cheaper of the two here.
 *
 *   node tools/test-schematics.mjs
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const run = (args) => spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });

const build = run([join(root, 'tools', 'build-schematics.mjs')]);
if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

// The vitest `exports` map hides the bin, so resolve it through package.json.
const vitest = join(
  dirname(createRequire(import.meta.url).resolve('vitest/package.json')),
  'vitest.mjs',
);
const test = run([vitest, 'run', '--dir', 'projects/zenit-ui/schematics', ...process.argv.slice(2)]);
process.exit(test.status ?? 1);
