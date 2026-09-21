/**
 * What does zenit-ui cost a consumer?
 *
 * Measures the shipped artifacts of `dist/zenit-ui` and then builds throwaway
 * applications against the package with the real Angular application builder
 * (`@angular/build:application`, optimization on, linker and Angular's esbuild
 * plugins in play). Nothing outside `.tmp-bundle/` is written: the probes live
 * in a workspace of their own with its own `angular.json`, and the package is
 * copied into that workspace's `node_modules`, so it is resolved through its own
 * `package.json` (`exports`, `sideEffects`) like after `npm install`. All other
 * packages are found by Node's upward walk in the real `node_modules`.
 *
 * Run `npx ng build zenit-ui` first, then `node tools/bundle-report.mjs`
 * (about 40 production builds, two to three minutes). The numbers land in
 * `docs/bundle-report.md`.
 */
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const wurzel = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(wurzel, 'dist', 'zenit-ui');
const tmp = join(wurzel, '.tmp-bundle');
const libDir = join(wurzel, 'projects', 'zenit-ui', 'src', 'lib');

const require = createRequire(import.meta.url);
// The CLI of this workspace; fail loudly instead of guessing a path.
const ng = require.resolve('@angular/cli/bin/ng.js');

/** Gzip at level 9 and Brotli at quality 11, so the numbers do not drift with defaults. */
const gz = (buf) => gzipSync(buf, { level: 9 }).length;
const br = (buf) =>
  brotliCompressSync(buf, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length;
const kb = (n) => (n / 1024).toFixed(1);
const delta = (n) => `${n >= 0 ? '+' : '−'}${kb(Math.abs(n))} kB`;

const sag = (s = '') => console.log(s);

const fesm = join(dist, 'fesm2022', 'zenit-ui.mjs');
const quelle = readFileSync(fesm, 'utf8');

// ---------------------------------------------------------------------------
// Throwaway workspaces for the real builder
// ---------------------------------------------------------------------------

/**
 * Creates `.tmp-bundle/<name>` with one application per entry of `apps`
 * (`{ 'main.ts': …, 'b.ts': … }`) and one copy of the built package per entry
 * of `pakete`. The value of `pakete` decides which `@angular/cdk` import lines
 * a copy keeps: `null` keeps the file untouched, a predicate filters them. See
 * "lazy routes" below for why a copy without CDK imports is needed.
 */
function arbeitsbereich(name, apps, pakete = { 'zenit-ui': null }) {
  const ws = join(tmp, name);
  rmSync(ws, { recursive: true, force: true });
  for (const [paket, behalte] of Object.entries(pakete)) {
    const ziel = join(ws, 'node_modules', paket);
    cpSync(dist, ziel, { recursive: true });
    if (!behalte) continue;
    const datei = join(ziel, 'fesm2022', 'zenit-ui.mjs');
    const gefiltert = readFileSync(datei, 'utf8')
      .split(/\r?\n/)
      .filter((z) => !(z.startsWith('import ') && z.includes("'@angular/cdk/")) || behalte(z));
    writeFileSync(datei, gefiltert.join('\n'));
  }
  const projects = {};
  for (const [app, dateien] of Object.entries(apps)) {
    const ordner = join(ws, 'projects', app);
    mkdirSync(ordner, { recursive: true });
    for (const [datei, text] of Object.entries(dateien)) writeFileSync(join(ordner, datei), text);
    writeFileSync(
      join(ordner, 'tsconfig.app.json'),
      JSON.stringify({ extends: '../../tsconfig.json', files: ['main.ts'] }),
    );
    projects[app] = {
      projectType: 'application',
      root: `projects/${app}`,
      sourceRoot: `projects/${app}`,
      architect: {
        build: {
          builder: '@angular/build:application',
          options: {
            browser: `projects/${app}/main.ts`,
            index: 'index.html',
            tsConfig: `projects/${app}/tsconfig.app.json`,
            outputPath: `dist/${app}`,
            // The production settings of `ng new`, minus hashing so file names
            // are stable, plus the esbuild metafile.
            optimization: true,
            outputHashing: 'none',
            sourceMap: false,
            extractLicenses: false,
            statsJson: true,
            progress: false,
          },
        },
      },
    };
  }
  // The compiler options of the real workspace, without its path mapping: the
  // package has to come from node_modules here, not from the sources.
  const tsconfig = JSON.parse(
    readFileSync(join(wurzel, 'tsconfig.json'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''),
  );
  delete tsconfig.compilerOptions.paths;
  delete tsconfig.references;
  delete tsconfig.files;
  tsconfig.compilerOptions.types = [];
  tsconfig.compilerOptions.strict = true;
  tsconfig.angularCompilerOptions.strictTemplates = true;
  writeFileSync(join(ws, 'tsconfig.json'), JSON.stringify(tsconfig));
  writeFileSync(join(ws, 'package.json'), JSON.stringify({ name, private: true }));
  writeFileSync(
    join(ws, 'angular.json'),
    JSON.stringify({ version: 1, cli: { cache: { enabled: false }, analytics: false }, projects }),
  );
  writeFileSync(
    join(ws, 'index.html'),
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>probe</title></head><body><app-root></app-root></body></html>\n',
  );
  return ws;
}

/** Runs `ng build <app>` in the throwaway workspace and measures the result. */
function bauen(ws, app) {
  const lauf = spawnSync(process.execPath, [ng, 'build', app], {
    cwd: ws,
    encoding: 'utf8',
    env: { ...process.env, NG_CLI_ANALYTICS: 'false', CI: '1' },
  });
  if (lauf.status !== 0) throw new Error(`ng build ${app} failed:\n${lauf.stdout}\n${lauf.stderr}`);
  const aus = join(ws, 'dist', app, 'browser');
  // Initial JS is what index.html loads: the entry script and its modulepreload links.
  const index = readFileSync(join(aus, 'index.html'), 'utf8');
  const initial = [...new Set([...index.matchAll(/(?:src|href)="([^"]+\.js)"/g)].map((m) => m[1]))];
  const bufs = initial.map((f) => readFileSync(join(aus, f)));
  // Bytes per npm package inside the initial files, from esbuild's metafile.
  const meta = JSON.parse(readFileSync(join(ws, 'dist', app, 'stats.json'), 'utf8'));
  const pakete = {};
  for (const [datei, ausgabe] of Object.entries(meta.outputs)) {
    if (!initial.includes(datei)) continue;
    for (const [eingabe, { bytesInOutput }] of Object.entries(ausgabe.inputs)) {
      const paket = /node_modules\/((?:@[^/]+\/)?[^/]+)/.exec(eingabe)?.[1] ?? 'app';
      pakete[paket] = (pakete[paket] ?? 0) + bytesInOutput;
    }
  }
  return {
    roh: bufs.reduce((a, b) => a + b.length, 0),
    gzip: bufs.reduce((a, b) => a + gz(b), 0),
    brotli: bufs.reduce((a, b) => a + br(b), 0),
    pakete,
    code: Buffer.concat(bufs).toString('utf8'),
  };
}

/**
 * Second, independent instrument next to the metafile: strings that survive
 * minification. CDK class names are runtime strings; zenit-ui components carry
 * their BEM block in `hostAttrs`, class bindings and templates.
 */
const CDK_MARKER = [
  'cdk-overlay-container',
  'cdk-dialog-container',
  'cdk-menu',
  'cdk-focus-trap-anchor',
  'cdk-visually-hidden',
];
const cdkMarker = (code) => CDK_MARKER.filter((m) => code.includes(m));
const zBloecke = (code) =>
  [...new Set([...code.matchAll(/["' ](z-[a-z]+(?:-[a-z]+)*)/g)].map((m) => m[1]))]
    .filter((b) => b !== 'z-index')
    .sort();

// ---------------------------------------------------------------------------
// Probe sources
// ---------------------------------------------------------------------------

const knopf = '<button type="button">Speichern</button>';
/** A zoneless standalone application with one root component. */
const app = ({ kopf = '', imports = '', template = knopf, klasse = '', providers = '' }) => `
import { Component, inject, signal, provideBrowserGlobalErrorListeners } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
${kopf}
void inject;
void signal;
@Component({ selector: 'app-root', imports: [${imports}], template: \`${template}\` })
class App { ${klasse} }
bootstrapApplication(App, { providers: [provideBrowserGlobalErrorListeners()${providers && ', ' + providers}] }).catch((e) => console.error(e));
`;

// Control for P1: the library's own ZSpinner and ZButton sources as application
// code, compiled by the application's AOT compiler instead of the linker. The
// difference between P1 and this is what the packaging itself costs.
const eigenerButton = ['spinner/spinner.ts', 'button/button.ts']
  .map((p) => readFileSync(join(libDir, p), 'utf8'))
  .join('\n')
  .replace(/^import [^;]*;$/gm, '');

const proben = [
  ['P0', 'no zenit-ui import (baseline)', app({})],
  [
    'P1',
    '`ZButton`',
    app({
      kopf: `import { ZButton } from 'zenit-ui';`,
      imports: 'ZButton',
      template: '<button zBtn="primary" type="button">Speichern</button>',
    }),
  ],
  [
    'P1c',
    'control: the same button as application code',
    app({
      kopf:
        `import { booleanAttribute, ChangeDetectionStrategy, computed, ElementRef, HostAttributeToken, input } from '@angular/core';\n` +
        eigenerButton,
      imports: 'ZButton',
      template: '<button zBtn="primary" type="button">Speichern</button>',
    }),
  ],
  [
    'P2',
    '`ZButton`, `ZBadge`, `ZPanel`',
    app({
      kopf: `import { ZButton, ZBadge, ZPanel } from 'zenit-ui';`,
      imports: 'ZButton, ZBadge, ZPanel',
      template:
        '<z-panel title="Server"><z-badge status="success" dot>Online</z-badge><button zBtn="primary" type="button">Speichern</button></z-panel>',
    }),
  ],
  [
    'P3',
    'forms: `ZField`, `ZInput`, `ZSelect`, `ZCheckbox`, `ZToggle`, `ZSlider`, `ZSegment`',
    app({
      kopf: `import { ZField, ZInput, ZSelect, ZCheckbox, ZToggle, ZSlider, ZSegment } from 'zenit-ui';`,
      imports: 'ZField, ZInput, ZSelect, ZCheckbox, ZToggle, ZSlider, ZSegment',
      template: `<z-field label="Name" for="n"><input zInput id="n" /></z-field>
        <z-field label="Status" for="s"><z-select><select id="s"><option>Alle</option></select></z-select></z-field>
        <z-checkbox [(checked)]="an">Alle</z-checkbox>
        <z-toggle [(checked)]="an" ariaLabel="PvP" />
        <z-slider label="RAM" unit="GB" [min]="2" [max]="16" [step]="2" [(value)]="ram" />
        <z-segment [options]="[{ value: '1', label: '1 Monat' }, { value: '12', label: '12 Monate' }]" [(value)]="zeit" ariaLabel="Zeitraum" />`,
      klasse: `an = signal(false); ram = signal(4); zeit = signal('1');`,
    }),
  ],
  [
    'P4',
    '`ZDialog` (service, `confirm`)',
    app({
      kopf: `import { ZDialog } from 'zenit-ui';`,
      template: '<button type="button" (click)="frag()">Löschen</button>',
      klasse: `private readonly dialog = inject(ZDialog); frag() { this.dialog.confirm({ title: 'Löschen', body: 'Wirklich?', confirmLabel: 'Löschen', cancelLabel: 'Abbrechen', danger: true }).subscribe(); }`,
    }),
  ],
  [
    'P5',
    '`ZMenu`, `ZMenuItem`, `ZMenuSeparator` with `CdkMenuTrigger`',
    app({
      kopf: `import { CdkMenuTrigger } from '@angular/cdk/menu';\nimport { ZMenu, ZMenuItem, ZMenuSeparator } from 'zenit-ui';`,
      imports: 'CdkMenuTrigger, ZMenu, ZMenuItem, ZMenuSeparator',
      template: `<button type="button" [cdkMenuTriggerFor]="m">Mehr</button>
        <ng-template #m><z-menu><button zMenuItem icon="content_copy">Kopieren</button><z-menu-separator /><button zMenuItem icon="delete" danger>Löschen</button></z-menu></ng-template>`,
    }),
  ],
  [
    'P6',
    '`ZToast` and `ZToastOutlet`',
    app({
      kopf: `import { ZToast, ZToastOutlet } from 'zenit-ui';`,
      imports: 'ZToastOutlet',
      template: '<button type="button" (click)="zeig()">Speichern</button><z-toast-outlet />',
      klasse: `private readonly toast = inject(ZToast); zeig() { this.toast.success('Gespeichert'); }`,
    }),
  ],
  [
    'P7',
    '`ZTooltip`',
    app({
      kopf: `import { ZTooltip } from 'zenit-ui';`,
      imports: 'ZTooltip',
      template: '<button type="button" zTooltip="Aktualisieren">Neu laden</button>',
    }),
  ],
  [
    'P8',
    '`provideZenitTheme()` and `provideZenitLabels({})` only',
    app({
      kopf: `import { provideZenitTheme, provideZenitLabels } from 'zenit-ui';`,
      providers: 'provideZenitTheme(), provideZenitLabels({})',
    }),
  ],
  [
    'P9',
    // The namespace object escapes to a global, so no export can be dropped.
    'everything (`import * as Z`, pinned to a global)',
    app({
      kopf: `import * as Z from 'zenit-ui';\n(globalThis as unknown as Record<string, unknown>)['__zenit'] = Z;`,
      providers: 'Z.provideZenitTheme(), Z.provideZenitLabels({})',
    }),
  ],
];

// ---------------------------------------------------------------------------
// Lazy routes: where does the code land?
// ---------------------------------------------------------------------------

/**
 * esbuild shakes single statements but places code per file: everything an
 * application uses from one file lands in the chunk shared by all importers of
 * that file. A shell that uses `ZButton` and a lazy route that uses `ZDialog`
 * therefore share one chunk, and the shell loads it up front.
 *
 * What a secondary entry point would change is measured with stand-ins, since
 * the package is not split: `zenit-ui-x` is a byte-identical copy (the code of
 * the candidate entry, in a file of its own) and `zenit-ui-p` is the same file
 * without its `@angular/cdk` import lines (the primary entry after a split,
 * which would not import the CDK). The code that needs those imports is not
 * reachable from the shell and is shaken away exactly as before.
 */
const shell = (paket, menuPaket = '') => `
import { Component, provideBrowserGlobalErrorListeners } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, RouterOutlet } from '@angular/router';
import { ZButton } from '${paket}';
${menuPaket && `import { CdkMenuTrigger } from '@angular/cdk/menu';\nimport { ZMenu, ZMenuItem } from '${menuPaket}';`}
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ZButton${menuPaket && ', CdkMenuTrigger, ZMenu, ZMenuItem'}],
  template: \`<button zBtn type="button"${menuPaket && ' [cdkMenuTriggerFor]="m"'}>Konto</button>${menuPaket && '<ng-template #m><z-menu><button zMenuItem>Abmelden</button></z-menu></ng-template>'}<router-outlet />\`,
})
class App {}
bootstrapApplication(App, { providers: [provideBrowserGlobalErrorListeners(), provideRouter([{ path: 'b', loadComponent: () => import('./b').then((m) => m.B) }])] }).catch((e) => console.error(e));
`;
/** A lazy route that pins the given exports, so all of their code is kept. */
const route = (paket, namen) => `
import { Component } from '@angular/core';
${namen.length ? `import { ${namen.join(', ')} } from '${paket}';` : ''}
(globalThis as unknown as Record<string, unknown>)['__pin'] = [${namen.join(', ')}];
@Component({ template: 'B' })
export class B {}
`;

const oeffentlich = new Set(
  /\nexport \{([^}]+)\}/
    .exec(quelle)[1]
    .split(',')
    .map((s) => s.trim()),
);
/** Public runtime exports of the given `lib/` folders, read from the sources. */
const exporte = (ordner) =>
  ordner
    .flatMap((o) =>
      readdirSync(join(libDir, o))
        .filter((d) => d.endsWith('.ts') && !d.endsWith('.spec.ts'))
        .flatMap((d) =>
          [
            ...readFileSync(join(libDir, o, d), 'utf8').matchAll(
              /^export (?:class|const|function) (\w+)/gm,
            ),
          ].map((m) => m[1]),
        ),
    )
    .filter((name) => oeffentlich.has(name));

// Candidate entries along lib/pakete/*; the CDK users are listed one by one as well.
const eintraege = [
  ['(nothing)', []],
  ['formulare', ['checkbox', 'toggle', 'slider', 'segment']],
  ['navigation', ['navigation']],
  ['daten', ['metric', 'rows', 'table', 'pagination']],
  ['rueckmeldung without tooltip', ['feedback', 'toast']],
  ['werkzeuge', ['console', 'marketing']],
  ['tooltip', ['tooltip']],
  ['dialog', ['dialog']],
  ['menu', ['menu']],
  ['overlays (dialog + menu)', ['dialog', 'menu']],
  ['overlays + tooltip', ['dialog', 'menu', 'tooltip']],
];

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

sag('# Shipped artifacts');
sag();
sag('| File | raw | gzip |');
sag('| --- | --- | --- |');
const fesmBuf = readFileSync(fesm);
sag(`| fesm2022/zenit-ui.mjs | ${kb(fesmBuf.length)} kB | ${kb(gz(fesmBuf))} kB |`);
let cssRoh = 0;
let cssGzip = 0;
const stile = readdirSync(join(dist, 'styles'), { recursive: true })
  .map((d) => String(d).replaceAll('\\', '/'))
  .filter((d) => d.endsWith('.css'))
  .sort();
for (const datei of stile) {
  const buf = readFileSync(join(dist, 'styles', datei));
  cssRoh += buf.length;
  cssGzip += gz(buf);
  sag(`| styles/${datei} | ${kb(buf.length)} kB | ${kb(gz(buf))} kB |`);
}
sag(`| **CSS total** | **${kb(cssRoh)} kB** | **${kb(cssGzip)} kB** |`);

rmSync(tmp, { recursive: true, force: true });

sag();
sag('# Real-builder probes (initial JS of a production `ng build`)');
sag();
const wsProben = arbeitsbereich(
  'proben',
  Object.fromEntries(proben.map(([id, , main]) => [id.toLowerCase(), { 'main.ts': main }])),
);
const erg = new Map(proben.map(([id]) => [id, bauen(wsProben, id.toLowerCase())]));
const p0 = erg.get('P0');
sag(
  '| Probe | imports | raw | gzip | brotli | Δ raw | Δ gzip | zenit-ui bytes | @angular/cdk bytes | CDK markers | zenit-ui blocks in the output |',
);
sag('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
for (const [id, titel] of proben) {
  const r = erg.get(id);
  sag(
    `| ${id} | ${titel} | ${kb(r.roh)} kB | ${kb(r.gzip)} kB | ${kb(r.brotli)} kB | ${delta(r.roh - p0.roh)} | ${delta(r.gzip - p0.gzip)} | ${r.pakete['zenit-ui'] ?? 0} | ${r.pakete['@angular/cdk'] ?? 0} | ${cdkMarker(r.code).length ? 'yes' : 'no'} | ${
      id === 'P9'
        ? `${zBloecke(r.code).length} blocks`
        : zBloecke(r.code)
            .map((b) => `\`${b}\``)
            .join(' ') || 'none'
    } |`,
  );
}

sag();
sag('# Lazy routes: initial JS today and with a secondary entry point (stand-ins)');
sag();
const ohneCdk = () => false;
const apps = {};
eintraege.forEach(([, ordner], i) => {
  const namen = exporte(ordner);
  apps[`heute-${i}`] = { 'main.ts': shell('zenit-ui'), 'b.ts': route('zenit-ui', namen) };
  apps[`split-${i}`] = { 'main.ts': shell('zenit-ui-p'), 'b.ts': route('zenit-ui-x', namen) };
});
// The shell already opens a menu, as an application header with a user menu does.
const nurMenu = (z) => z.includes("'@angular/cdk/menu'");
const mitMenu = [
  ['dialog', ['dialog']],
  ['tooltip', ['tooltip']],
  ['dialog + tooltip', ['dialog', 'tooltip']],
];
mitMenu.forEach(([, ordner], i) => {
  const namen = exporte(ordner);
  apps[`menu-heute-${i}`] = {
    'main.ts': shell('zenit-ui', 'zenit-ui'),
    'b.ts': route('zenit-ui', namen),
  };
  apps[`menu-split-${i}`] = {
    'main.ts': shell('zenit-ui-p', 'zenit-ui-m'),
    'b.ts': route('zenit-ui-x', namen),
  };
});
// A primary entry that re-exports the split-off entry for compatibility.
apps['reexport'] = {
  'main.ts': shell('zenit-ui-r'),
  'b.ts': route('zenit-ui-x', exporte(['dialog', 'menu', 'tooltip'])),
};
const wsLazy = arbeitsbereich('lazy', apps, {
  'zenit-ui': null,
  'zenit-ui-x': null,
  'zenit-ui-p': ohneCdk,
  'zenit-ui-m': nurMenu,
  'zenit-ui-r': ohneCdk,
});
const reexportDatei = join(wsLazy, 'node_modules', 'zenit-ui-r', 'fesm2022', 'zenit-ui.mjs');
writeFileSync(
  reexportDatei,
  readFileSync(reexportDatei, 'utf8') +
    "\nexport { ZDialog as ZDialogCompat, ZMenu as ZMenuCompat, ZTooltip as ZTooltipCompat } from 'zenit-ui-x';\n",
);

const paar = (heute, split) =>
  `${kb(heute.roh)} kB | ${kb(heute.gzip)} kB | ${kb(split.roh)} kB | ${kb(split.gzip)} kB | ${delta(split.roh - heute.roh)} | ${delta(split.gzip - heute.gzip)} | ${heute.pakete['@angular/cdk'] ?? 0} → ${split.pakete['@angular/cdk'] ?? 0}`;
const kopfzeile =
  'today raw | today gzip | split raw | split gzip | Δ raw | Δ gzip | @angular/cdk bytes in the initial JS |';
sag('Shell uses `ZButton` only; the lazy route pins every export of one candidate entry.');
sag();
sag(`| Lazy route uses | exports | ${kopfzeile}`);
sag('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
const lazyErg = eintraege.map(([titel, ordner], i) => {
  const heute = bauen(wsLazy, `heute-${i}`);
  const split = bauen(wsLazy, `split-${i}`);
  sag(`| ${titel} | ${exporte(ordner).length} | ${paar(heute, split)} |`);
  return { heute, split };
});
sag();
sag('Shell uses `ZButton` and a `ZMenu` behind `CdkMenuTrigger`.');
sag();
sag(`| Lazy route uses | ${kopfzeile}`);
sag('| --- | --- | --- | --- | --- | --- | --- | --- |');
mitMenu.forEach(([titel], i) => {
  sag(`| ${titel} | ${paar(bauen(wsLazy, `menu-heute-${i}`), bauen(wsLazy, `menu-split-${i}`))} |`);
});
const reexport = bauen(wsLazy, 'reexport');
const besteSplit = lazyErg.at(-1);
sag();
sag(
  `Compatibility re-export from the primary entry, lazy route uses overlays + tooltip: initial JS ${kb(reexport.roh)} kB raw, ${kb(reexport.gzip)} kB gzip (split without re-export: ${kb(besteSplit.split.roh)} kB, today: ${kb(besteSplit.heute.roh)} kB).`,
);

sag();
sag('# Bytes of the fesm per area');
sag();
sag(
  'Attributed from each `class Z…` line to the next one, so JSDoc and the metadata block of a class count towards it. These are source bytes of the shipped file, not bundle bytes.',
);
sag();
// class name -> lib folder, read from the sources instead of a hand-kept list.
const bereichVon = new Map();
for (const ordner of readdirSync(libDir)) {
  if (ordner === 'pakete') continue;
  for (const datei of readdirSync(join(libDir, ordner))) {
    if (!datei.endsWith('.ts') || datei.endsWith('.spec.ts')) continue;
    const text = readFileSync(join(libDir, ordner, datei), 'utf8');
    for (const m of text.matchAll(/^export class (Z\w+)/gm)) bereichVon.set(m[1], ordner);
  }
}
const zeilenFesm = quelle.split('\n');
const grenzen = [];
zeilenFesm.forEach((z, i) => {
  const m = /^class (Z\w+) \{/.exec(z);
  if (m) grenzen.push([m[1], i]);
});
const proBereich = new Map();
grenzen.forEach(([name, start], i) => {
  const ende = i + 1 < grenzen.length ? grenzen[i + 1][1] : zeilenFesm.length;
  const bytes = Buffer.byteLength(zeilenFesm.slice(start, ende).join('\n'));
  const bereich = bereichVon.get(name) ?? 'other';
  proBereich.set(bereich, (proBereich.get(bereich) ?? 0) + bytes);
});
sag('| Area | classes | raw bytes | share of the fesm |');
sag('| --- | --- | --- | --- |');
const gesamt = [...proBereich.values()].reduce((a, b) => a + b, 0);
for (const [bereich, bytes] of [...proBereich].sort((a, b) => b[1] - a[1])) {
  const anzahl = grenzen.filter(([n]) => (bereichVon.get(n) ?? 'other') === bereich).length;
  sag(
    `| \`lib/${bereich}\` | ${anzahl} | ${kb(bytes)} kB | ${((bytes / fesmBuf.length) * 100).toFixed(0)} % |`,
  );
}
sag(
  `| **attributed total** | **${grenzen.length}** | **${kb(gesamt)} kB** | **${((gesamt / fesmBuf.length) * 100).toFixed(0)} %** |`,
);

rmSync(tmp, { recursive: true, force: true });

// The runnable check: every headline claim of the report is asserted here, so a
// change in the library, in esbuild or in the Angular builder fails loudly
// instead of letting the report go stale.
const p1 = erg.get('P1');
const p9 = erg.get('P9');
const pruefungen = [
  // positive controls first: the instruments can see what they look for
  [
    'P9 contains CDK markers and CDK bytes',
    cdkMarker(p9.code).length > 0 && p9.pakete['@angular/cdk'] > 0,
  ],
  ['P9 contains more than 40 zenit-ui blocks', zBloecke(p9.code).length > 40],
  [
    'P1 has no CDK bytes and no CDK markers',
    !p1.pakete['@angular/cdk'] && !cdkMarker(p1.code).length,
  ],
  ['P1 contains only z-btn and z-spinner', zBloecke(p1.code).join() === 'z-btn,z-spinner'],
  [
    'P1 is within 200 bytes of the same button as application code',
    Math.abs(p1.roh - erg.get('P1c').roh) < 200,
  ],
  [
    'today, a lazy dialog puts the CDK into the initial JS',
    besteSplit.heute.pakete['@angular/cdk'] > 0,
  ],
  ['with a split entry it does not', !besteSplit.split.pakete['@angular/cdk']],
  ['a compatibility re-export brings it back', reexport.pakete['@angular/cdk'] > 0],
];
for (const [text, ok] of pruefungen) console.error(`${ok ? 'ok  ' : 'FAIL'} ${text}`);
if (pruefungen.some(([, ok]) => !ok)) process.exitCode = 1;
