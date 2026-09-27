#!/usr/bin/env node
/**
 * Load gate for the built package: the bundle has to load without AOT linking.
 *
 *   node tools/check-bundle-load.mjs                 checks dist/zenit-ui (run `npm run build:lib` first)
 *   node tools/check-bundle-load.mjs <path-to.mjs>   checks another copy of the bundle
 *
 * An application build runs the Angular linker over the package, which replaces
 * every `ɵɵngDeclare*` call by its final definition. A consumer whose unit
 * tests run in JIT mode (`aot: false`) gets no linker: the partial declarations
 * are evaluated as written, at the moment their class is defined. A reference
 * in there to a class that is declared further down (a signal query predicate,
 * a host directive, a provider) is still in its temporal dead zone and throws,
 * which breaks every spec that imports anything from the package. The library's
 * own tests and the AOT builds never see that, so this tool does what such a
 * consumer does: load `@angular/compiler`, then import the bundle in plain Node.
 *
 * Beyond the import it touches every Angular definition of every export
 * (`ɵcmp`, `ɵdir`, `ɵfac`, …) and resolves the lazy parts of a definition
 * (template dependencies, host directives), so broken metadata is reported
 * with the name of the class it belongs to.
 *
 * Plain Node, no dependencies beyond the ones the workspace has anyway. Exit
 * code 1 if anything failed.
 */

import '@angular/compiler';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// The bundle is named after the package (ng-packagr); `module` in the built package.json names it.
const DIST = resolve(WURZEL, 'dist/zenit-ui');
const standard = () =>
  resolve(DIST, JSON.parse(readFileSync(resolve(DIST, 'package.json'), 'utf8')).module);
const BUNDLE = resolve(process.argv[2] ?? standard());

/** Static fields the partial declarations install on a class. */
const DEFINITIONEN = ['ɵcmp', 'ɵdir', 'ɵpipe', 'ɵmod', 'ɵinj', 'ɵprov', 'ɵfac'];

const fehler = [];
const melde = (wo, e) => fehler.push(`${wo}: ${e?.stack?.split('\n')[0] ?? e}`);

if (!existsSync(BUNDLE)) {
  console.error(`check-bundle-load: ${BUNDLE} does not exist, run "npm run build:lib" first.`);
  process.exit(1);
}

let modul = {};
try {
  // `@angular/*` and rxjs resolve from the node_modules above the bundle, the
  // way they do for a consumer's test runner.
  modul = await import(pathToFileURL(BUNDLE).href);
} catch (e) {
  melde('import', e);
}

/** Resolves a `forwardRef`; core marks those functions with `__forward_ref__`. */
const aufloesen = (t) => (typeof t === 'function' && Object.hasOwn(t, '__forward_ref__') ? t() : t);

let klassen = 0;
for (const [name, wert] of Object.entries(modul)) {
  if (typeof wert !== 'function') {
    continue;
  }
  let angular = false;
  for (const feld of DEFINITIONEN) {
    try {
      const def = wert[feld];
      if (def == null) {
        continue;
      }
      angular = true;
      if (feld !== 'ɵcmp' && feld !== 'ɵdir') {
        continue;
      }
      // Template dependencies are a closure until the first render.
      for (const liste of ['directiveDefs', 'pipeDefs']) {
        const defs = typeof def[liste] === 'function' ? def[liste]() : (def[liste] ?? []);
        if (defs.some((d) => d == null)) {
          throw new Error(`${liste} contains an unresolved entry`);
        }
      }
      // Host directives stay raw until the first match, forwardRef included.
      const hosts =
        typeof def.hostDirectives === 'function' ? def.hostDirectives() : def.hostDirectives;
      for (const host of hosts ?? []) {
        const typ = aufloesen(typeof host === 'function' ? host : host.directive);
        if (typ?.ɵdir == null) {
          throw new Error(`host directive ${typ?.name ?? typ} has no directive definition`);
        }
      }
    } catch (e) {
      melde(`${name}.${feld}`, e);
    }
  }
  klassen += angular ? 1 : 0;
}

if (fehler.length > 0) {
  console.error(`check-bundle-load: ${BUNDLE}\n  ${fehler.join('\n  ')}`);
  console.error(
    `check-bundle-load: FAILED, ${fehler.length} error(s). The bundle does not load without AOT.`,
  );
  process.exit(1);
}
if (klassen === 0) {
  console.error(`check-bundle-load: ${BUNDLE} exports no Angular class, that cannot be right.`);
  process.exit(1);
}
console.log(
  `check-bundle-load: OK, ${klassen} Angular classes of ${BUNDLE} load and compile without AOT.`,
);
