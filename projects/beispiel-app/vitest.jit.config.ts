import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Runner configuration of the `test-jit` target only.
 *
 * A real consumer has zenit-ui in node_modules. The unit-test builder keeps
 * packages out of the test bundle, so Vitest loads the published bundle as it
 * is: no Angular linker runs over it and its partial declarations are compiled
 * by the JIT compiler while the module loads. In this workspace the package is
 * not installed, the application reaches it through a path mapping, and a
 * mapped import is bundled and linked. So the `testing-jit` build configuration
 * declares `zenit-ui` external, and this alias points the import that is left
 * over at the built bundle.
 */
// The bundle is named after the package (ng-packagr), so its path comes from the built package.json.
const dist = new URL('../../dist/zenit-ui/', import.meta.url);
const bundle = (
  JSON.parse(readFileSync(new URL('package.json', dist), 'utf8')) as { module: string }
).module;

export default defineConfig({
  resolve: {
    alias: {
      'zenit-ui': fileURLToPath(new URL(bundle, dist)),
    },
  },
});
