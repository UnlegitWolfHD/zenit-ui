#!/usr/bin/env node
/**
 * Server-rendering gate: both applications have to prerender without a single
 * render error.
 *
 *   node tools/check-ssr.mjs                checks beispiel-app and ui-demo
 *   node tools/check-ssr.mjs beispiel-app   checks one of them
 *
 * `npm run build:lib` has to have run first, because beispiel-app compiles
 * against dist/zenit-ui.
 *
 * Why this exists next to the other checks: none of them renders on a server.
 * The unit tests run in jsdom, which has `MutationObserver`, `ResizeObserver`
 * and a layout; the Playwright suites run in a real browser; `check:bundle`
 * only loads the package. A component that touches a browser global while it
 * is being constructed therefore passes everything and still takes down the
 * build of a consumer who renders on the server. `ng build --configuration ssr`
 * prerenders every route of both applications in plain Node, where those
 * globals do not exist, which is exactly the environment that consumer has.
 *
 * Exit code alone is not enough. The CLI fails the build when a route throws
 * during rendering, but an error that Angular's error handler catches (inside a
 * signal computation, an effect, a control binding) is only printed as
 * `ERROR <Something>Error: …` and the route still counts as prerendered — the
 * build then reports success and writes a page that is silently broken. So the
 * output is scanned as well, and any of those markers fails the gate.
 */

import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const NG = resolve(WURZEL, 'node_modules/@angular/cli/bin/ng.js');

/** The applications with an `ssr` build configuration in angular.json. */
const ANWENDUNGEN = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['beispiel-app', 'ui-demo'];

/**
 * What a render error looks like in the output. `ERROR` covers both the CLI's
 * own `X [ERROR] An error occurred while prerendering route …` and the
 * `ERROR TypeError: …` that Angular's error handler prints; the other two are
 * there so a swallowed missing-global still fails even if that prefix changes.
 */
const MARKER = /\bERROR\b|\bReferenceError\b|is not defined/;

/** Positive evidence: how many routes the CLI actually wrote. */
const GERENDERT = /Prerendered (\d+) static routes?\./;

const fehler = [];
const start = Date.now();

for (const app of ANWENDUNGEN) {
  const t0 = Date.now();
  const lauf = spawnSync(process.execPath, [NG, 'build', app, '--configuration', 'ssr'], {
    cwd: WURZEL,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    // Without this the markers arrive wrapped in ANSI colour codes.
    env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
  });
  const ausgabe = `${lauf.stdout ?? ''}${lauf.stderr ?? ''}`;
  const sekunden = ((Date.now() - t0) / 1000).toFixed(1);
  const treffer = ausgabe.split('\n').filter((zeile) => MARKER.test(zeile));
  const routen = ausgabe.match(GERENDERT)?.[1] ?? '0';

  if (lauf.status !== 0 || treffer.length > 0) {
    // The whole output, so the stack under the first marker is readable.
    console.error(ausgabe);
    fehler.push(
      `${app}: exit ${lauf.status}, ${treffer.length} render error(s), ${routen} route(s) written` +
        (treffer[0] ? `\n    first: ${treffer[0].trim()}` : ''),
    );
    continue;
  }
  console.log(`check-ssr: ${app} prerendered ${routen} routes in ${sekunden}s.`);
}

const gesamt = ((Date.now() - start) / 1000).toFixed(1);
if (fehler.length > 0) {
  console.error(`check-ssr: FAILED after ${gesamt}s\n  ${fehler.join('\n  ')}`);
  console.error('check-ssr: a component touched a browser global while rendering on the server.');
  process.exit(1);
}
console.log(`check-ssr: OK, ${ANWENDUNGEN.join(' and ')} render on the server (${gesamt}s).`);
