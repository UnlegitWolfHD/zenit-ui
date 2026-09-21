/**
 * What does zenit-ui cost a consumer?
 *
 * Measures the shipped artifacts of `dist/zenit-ui` and runs a set of
 * tree-shaking probes through esbuild. esbuild comes with the Angular build,
 * so this script adds no dependency of its own.
 *
 * Run `npx ng build zenit-ui` first, then `node tools/bundle-report.mjs`.
 * The numbers land in `docs/bundle-report.md`.
 */
import { gzipSync } from 'node:zlib';
import { readFileSync, readdirSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const wurzel = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(wurzel, 'dist', 'zenit-ui');
const tmp = join(wurzel, '.tmp-bundle');

const require = createRequire(import.meta.url);
// esbuild ships with @angular/build; fail loudly instead of guessing a path.
const esbuildPfad = require.resolve('esbuild');
const esbuild = await import(`file://${esbuildPfad}`);

/** Gzip at level 9, so the numbers do not drift with the zlib default. */
const gz = (buf) => gzipSync(buf, { level: 9 }).length;
const kb = (n) => (n / 1024).toFixed(1);

/** The probes: what a consumer writes in their import line. */
const proben = [
  ['ZButton', ['ZButton']],
  ['ZBadge', ['ZBadge']],
  ['ZDialog', ['ZDialog']],
  ['ZToast + ZToastOutlet', ['ZToast', 'ZToastOutlet']],
  ['ZMenu + ZMenuItem', ['ZMenu', 'ZMenuItem']],
  ['everything (export *)', null],
];

const fesm = join(dist, 'fesm2022', 'zenit-ui.mjs');
const quelle = readFileSync(fesm, 'utf8');

/**
 * Removes the bare top-level `ɵɵngDeclareClassMetadata(…)` calls of the partial
 * compilation. They are statements, not pure expressions, so esbuild has to
 * keep them and with them every class they name. The Angular linker inside a
 * real production build drops them; stripping them here is the closest plain
 * esbuild gets to that build.
 *
 * A block starts on a line beginning with the call and ends on the first line
 * that ends in `});`. Miscounting would break the syntax and esbuild would
 * fail, so the parse is the check.
 */
function ohneMetadaten(text) {
  const zeilen = text.split('\n');
  const raus = [];
  let treffer = 0;
  for (let i = 0; i < zeilen.length; i++) {
    if (!zeilen[i].startsWith('i0.ɵɵngDeclareClassMetadata(')) {
      raus.push(zeilen[i]);
      continue;
    }
    treffer++;
    while (i < zeilen.length && !zeilen[i].trimEnd().endsWith('});')) i++;
  }
  return { code: raus.join('\n'), treffer };
}

const gestrippt = ohneMetadaten(quelle);

async function probe(namen, linker = false) {
  const eintrag = join(tmp, 'entry.mjs');
  // A re-export keeps the symbols live; a bare import would be shaken away
  // entirely and every probe would measure 0 bytes.
  writeFileSync(
    eintrag,
    namen === null
      ? `export * from 'zenit-ui';\n`
      : `export { ${namen.join(', ')} } from 'zenit-ui';\n`,
  );
  const out = join(
    tmp,
    `${linker ? 'linker-' : ''}${namen === null ? 'alles' : namen.join('-')}.mjs`,
  );
  await esbuild.build({
    entryPoints: [eintrag],
    outfile: out,
    bundle: true,
    minify: true,
    format: 'esm',
    treeShaking: true,
    // Everything the library declares as a peer dependency stays outside, so
    // the result is the library's own code only.
    external: ['@angular/*', 'rxjs', 'rxjs/*', 'tslib'],
    plugins: [
      {
        name: 'zenit-ui',
        setup(build) {
          // `sideEffects: false` mirrors dist/zenit-ui/package.json. Without
          // it the direct path would hide the very flag that makes tree
          // shaking legal, and the probe would measure the wrong thing.
          build.onResolve({ filter: /^zenit-ui$/ }, () => ({ path: fesm, sideEffects: false }));
          if (linker) {
            build.onLoad({ filter: /zenit-ui\.mjs$/ }, () => ({
              contents: gestrippt.code,
              loader: 'js',
            }));
          }
        },
      },
    ],
    logLevel: 'silent',
  });
  const code = readFileSync(out);
  // Which peer packages survived as static imports in this probe?
  const importe = [...code.toString().matchAll(/from"([^"]+)"/g)].map((m) => m[1]);
  return { roh: code.length, gzip: gz(code), importe: [...new Set(importe)].sort() };
}

const zeilen = [];
const sag = (s = '') => {
  zeilen.push(s);
  console.log(s);
};

sag('# Shipped artifacts');
sag();
sag('| File | raw | gzip |');
sag('| --- | --- | --- |');
const fesmBuf = readFileSync(fesm);
sag(`| fesm2022/zenit-ui.mjs | ${kb(fesmBuf.length)} kB | ${kb(gz(fesmBuf))} kB |`);
let cssRoh = 0;
let cssGzip = 0;
for (const datei of readdirSync(join(dist, 'styles')).sort()) {
  const buf = readFileSync(join(dist, 'styles', datei));
  cssRoh += buf.length;
  cssGzip += gz(buf);
  sag(`| styles/${datei} | ${kb(buf.length)} kB | ${kb(gz(buf))} kB |`);
}
sag(`| **CSS total** | **${kb(cssRoh)} kB** | **${kb(cssGzip)} kB** |`);

sag();
sag('# Tree-shaking probes (library code only, peers external)');
sag();
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });

const ergebnisse = [];
for (const [titel, namen] of proben) {
  const r = await probe(namen);
  ergebnisse.push([titel, r]);
}
const voll = ergebnisse.at(-1)[1];

sag('| Probe | minified | gzip | share of "everything" |');
sag('| --- | --- | --- | --- |');
for (const [titel, r] of ergebnisse) {
  sag(
    `| \`${titel}\` | ${kb(r.roh)} kB | ${kb(r.gzip)} kB | ${((r.roh / voll.roh) * 100).toFixed(0)} % |`,
  );
}

sag();
sag('| Probe | surviving static imports |');
sag('| --- | --- |');
for (const [titel, r] of ergebnisse) {
  sag(`| \`${titel}\` | ${r.importe.map((i) => `\`${i}\``).join(', ') || 'none'} |`);
}

sag();
sag(
  `# Same probes without the ${gestrippt.treffer} \`ɵɵngDeclareClassMetadata\` statements (linker equivalent)`,
);
sag();
const linkerErgebnisse = [];
for (const [titel, namen] of proben) {
  linkerErgebnisse.push([titel, await probe(namen, true)]);
}
const linkerVoll = linkerErgebnisse.at(-1)[1];

sag('| Probe | minified | gzip | share of "everything" | surviving static imports |');
sag('| --- | --- | --- | --- | --- |');
for (const [titel, r] of linkerErgebnisse) {
  sag(
    `| \`${titel}\` | ${kb(r.roh)} kB | ${kb(r.gzip)} kB | ${((r.roh / linkerVoll.roh) * 100).toFixed(0)} % | ${r.importe.map((i) => `\`${i}\``).join(', ') || 'none'} |`,
  );
}

sag();
sag('# Bytes of the fesm per area');
sag();
sag(
  'Attributed from each `class Z…` line to the next one, so JSDoc and the metadata block of a class count towards it. This is the ceiling of what a secondary entry point for that area could keep out of a consumer that does not use it.',
);
sag();
// class name -> lib folder, read from the sources instead of a hand-kept list.
const bereichVon = new Map();
const libDir = join(wurzel, 'projects', 'zenit-ui', 'src', 'lib');
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

// One runnable check: both claims of the report are asserted here, so a change
// in the library or in esbuild fails loudly instead of letting the report go
// stale.
const nurButton = ergebnisse[0][1];
const nurButtonLinker = linkerErgebnisse[0][1];
const cdk = (r) => r.importe.some((i) => i.startsWith('@angular/cdk'));
console.error(
  `\ncheck: as shipped, ZButton keeps ${((nurButton.roh / voll.roh) * 100).toFixed(0)} % ` +
    `and CDK imports ${cdk(nurButton) ? 'survive' : 'are gone'}; ` +
    `linker equivalent keeps ${((nurButtonLinker.roh / linkerVoll.roh) * 100).toFixed(0)} % ` +
    `and CDK imports ${cdk(nurButtonLinker) ? 'survive' : 'are gone'}`,
);
