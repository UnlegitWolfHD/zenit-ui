#!/usr/bin/env node
/**
 * Contrast gate for the Zenit colour schemes.
 *
 *   node tools/check-theme-contrast.mjs          table plus verdict
 *   node tools/check-theme-contrast.mjs --md     the same table as Markdown
 *
 * There is no spec for the light and contrast schemes; they were derived by
 * the rules written at the top of each theme file. This tool is the proof that
 * the derivation holds. It reads tokens.css and the files themes.css imports,
 * rebuilds the cascade for every scheme x accent combination, resolves var()
 * aliases, composites rgba() over the background it is stated on, and measures
 * WCAG 2.1 contrast for every pair the rules name.
 *
 * Plain Node, no dependencies, exits 1 on the first failing combination.
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const STYLES = join(WURZEL, 'projects/zenit-ui/src/styles');

/* ------------------------------------------------------------------ CSS ---- */

/** Strips comments and returns every rule as { selector, decls, reihe }. */
function parseCss(text, datei, reiheAb) {
  const ohneKommentar = text.replace(/\/\*[\s\S]*?\*\//g, '');
  const regeln = [];
  let reihe = reiheAb;
  for (const treffer of ohneKommentar.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const decls = new Map();
    for (const zeile of treffer[2].split(';')) {
      const i = zeile.indexOf(':');
      if (i < 0) continue;
      const name = zeile.slice(0, i).trim();
      if (!name.startsWith('--')) continue;
      decls.set(name, zeile.slice(i + 1).trim());
    }
    for (const teil of treffer[1].split(',')) {
      regeln.push({ selector: teil.trim(), decls, datei, reihe: reihe++ });
    }
  }
  return regeln;
}

/** Reads themes.css so the include order of the tool is the real one. */
function themenDateien() {
  const text = readFileSync(join(STYLES, 'themes.css'), 'utf8');
  return [...text.matchAll(/@import\s+["']\.\/(.+?)["']/g)].map((m) => m[1]);
}

function regelnLaden() {
  const dateien = ['tokens.css', ...themenDateien()];
  const regeln = [];
  for (const datei of dateien) {
    regeln.push(...parseCss(readFileSync(join(STYLES, datei), 'utf8'), datei, regeln.length * 1000));
  }
  return { dateien, regeln };
}

/**
 * Does this selector apply to <html> in the given combination? Only :root and
 * attribute selectors count; a class or element rule (.display-xl) never sets
 * tokens for the root and is skipped.
 */
function passt(selector, schema, akzent) {
  if (/[.#\s>+~]/.test(selector.replace(/\[[^\]]*\]/g, ''))) return false;
  const rest = selector.replace(/\[data-(theme|accent)="[^"]*"\]/g, '').replace(/:root/g, '');
  if (rest.trim() !== '') return false;
  for (const m of selector.matchAll(/\[data-theme="([^"]*)"\]/g)) {
    if (m[1] !== schema) return false;
  }
  for (const m of selector.matchAll(/\[data-accent="([^"]*)"\]/g)) {
    if (m[1] !== akzent) return false;
  }
  return true;
}

/** Specificity of the selectors used here: one per :root and per attribute. */
function gewicht(selector) {
  return (selector.match(/\[|:root/g) ?? []).length;
}

/** Applies the cascade: higher specificity wins, then later source order. */
function tokensFuer(regeln, schema, akzent) {
  const passend = regeln
    .filter((r) => passt(r.selector, schema, akzent))
    .sort((a, b) => gewicht(a.selector) - gewicht(b.selector) || a.reihe - b.reihe);
  const tokens = new Map();
  for (const regel of passend) {
    for (const [name, wert] of regel.decls) tokens.set(name, wert);
  }
  return tokens;
}

/** Follows var(--x) and var(--x, fallback) chains. */
function aufloesen(tokens, name, tiefe = 0) {
  const wert = tokens.get(name);
  if (wert === undefined || tiefe > 10) return wert;
  const m = wert.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*(.+))?\)$/);
  if (!m) return wert;
  const ziel = aufloesen(tokens, m[1], tiefe + 1);
  return ziel ?? m[2]?.trim();
}

/* ---------------------------------------------------------------- Farbe ---- */

/** #rgb, #rrggbb, #rrggbbaa, rgb(), rgba() -> { r, g, b, a } in 0..255 / 0..1. */
function farbe(wert) {
  if (!wert) return null;
  const t = wert.trim();
  const hex = t.match(/^#([0-9a-fA-F]{3,8})$/);
  if (hex) {
    const h = hex[1];
    const breit = h.length <= 4 ? [...h].map((c) => c + c).join('') : h;
    const n = (i) => parseInt(breit.slice(i * 2, i * 2 + 2), 16);
    return { r: n(0), g: n(1), b: n(2), a: breit.length === 8 ? n(3) / 255 : 1 };
  }
  const rgb = t.match(/^rgba?\(([^)]+)\)$/);
  if (rgb) {
    const teile = rgb[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    return { r: teile[0], g: teile[1], b: teile[2], a: teile.length > 3 ? teile[3] : 1 };
  }
  return null;
}

/** Puts a possibly transparent colour on an opaque one. */
function ueber(vorn, hinten) {
  if (vorn.a >= 1) return vorn;
  const mix = (a, b) => a * vorn.a + b * (1 - vorn.a);
  return { r: mix(vorn.r, hinten.r), g: mix(vorn.g, hinten.g), b: mix(vorn.b, hinten.b), a: 1 };
}

function leuchtdichte({ r, g, b }) {
  const k = (c) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * k(r) + 0.7152 * k(g) + 0.0722 * k(b);
}

function kontrast(a, b) {
  const la = leuchtdichte(a);
  const lb = leuchtdichte(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Hue in degrees, for the "danger is not the brand red" rule. */
function farbton({ r, g, b }) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return ((h * 60) % 360 + 360) % 360;
}

function tonAbstand(a, b) {
  const d = Math.abs(farbton(a) - farbton(b));
  return Math.min(d, 360 - d);
}

/* ---------------------------------------------------------------- Regeln --- */

/** Every colour token a scheme has to define itself. */
const SCHEMA_TOKENS = [
  'bg', 'surface', 'surface-raised', 'surface-hover',
  'border', 'border-control',
  'text', 'text-muted', 'text-subtle',
  'accent', 'accent-hover', 'on-accent', 'accent-text', 'accent-subtle',
  'scrim', 'focus',
  'success', 'success-subtle', 'warning', 'warning-subtle',
  'danger', 'danger-subtle', 'info', 'info-subtle',
  'mc-accent', 'mc-accent-hover', 'on-mc',
  'shadow-overlay',
].map((n) => `--${n}`);

/** Every token an accent has to define itself, for every scheme it applies to. */
const AKZENT_TOKENS = ['--accent', '--accent-hover', '--on-accent', '--accent-text', '--accent-subtle'];

/** vorn, hinten, soll; hinten may be a pair [fill, base] for a translucent fill. */
const PAARE = [
  ['--text', '--bg', 12],
  ['--text', '--surface', 12],
  ['--text', '--surface-raised', 12],
  ['--text-muted', '--bg', 7],
  ['--text-muted', '--surface', 7],
  ['--text-muted', '--surface-raised', 7],
  ['--text-subtle', '--bg', 4.5],
  ['--text-subtle', '--surface', 4.5],
  ['--text-subtle', '--surface-raised', 4.5],
  ['--border-control', '--surface', 3],
  ['--on-accent', '--accent', 4.5],
  ['--on-accent', '--accent-hover', 4.5],
  ['--accent-text', '--bg', 4.5],
  ['--accent-text', '--surface', 4.5],
  ['--on-mc', '--mc-accent', 4.5],
  ['--on-mc', '--mc-accent-hover', 4.5],
  ['--focus', '--bg', 3],
  ['--focus', '--surface', 3],
  ['--focus', '--surface-raised', 3],
  ['--focus', '--surface-hover', 3],
  ['--focus', '--accent', 3],
  // .z-side__count in the active sidebar entry: surface-hover is the one
  // ground text-subtle may not be read on, so the count takes text-muted.
  ['--text-muted', '--surface-hover', 4.5],
];
for (const status of ['success', 'warning', 'danger', 'info']) {
  PAARE.push([`--${status}`, '--bg', 4.5]);
  PAARE.push([`--${status}`, '--surface', 4.5]);
  PAARE.push([`--${status}`, [`--${status}-subtle`, '--surface-raised'], 4.5]);
  PAARE.push([`--${status}`, [`--${status}-subtle`, '--surface'], 4.5]);
  // Control border inside a tinted alert: .z-alert .z-btn--secondary takes
  // text-muted, because border-control misses the 3:1 on the tints. An alert
  // stands either free on bg or inside a panel on surface.
  PAARE.push(['--text-muted', [`--${status}-subtle`, '--bg'], 3]);
  PAARE.push(['--text-muted', [`--${status}-subtle`, '--surface'], 3]);
}

/* -------------------------------------------------------------- Ausfuehren -- */

const { dateien, regeln } = regelnLaden();

/** Schemes and accents come from the stylesheets, so a new one is checked too. */
const schemata = ['dark'];
const akzente = ['rot'];
for (const regel of regeln) {
  for (const m of regel.selector.matchAll(/\[data-theme="([^"]*)"\]/g)) {
    if (!schemata.includes(m[1])) schemata.push(m[1]);
  }
  for (const m of regel.selector.matchAll(/\[data-accent="([^"]*)"\]/g)) {
    if (!akzente.includes(m[1])) akzente.push(m[1]);
  }
}

const markdown = process.argv.includes('--md');
const fehler = [];
const zeilen = [];
const tiefstwert = new Map();

/** Declarations a selector makes across all files, for the completeness check. */
function erklaert(pruefung) {
  const namen = new Set();
  for (const regel of regeln) {
    if (!pruefung(regel.selector)) continue;
    for (const name of regel.decls.keys()) namen.add(name);
  }
  return namen;
}

for (const schema of schemata) {
  if (schema === 'dark') continue;
  const gesetzt = erklaert((s) => s === `[data-theme="${schema}"]`);
  for (const token of SCHEMA_TOKENS) {
    if (!gesetzt.has(token)) fehler.push(`Schema ${schema} definiert ${token} nicht.`);
  }
}
for (const akzent of akzente) {
  if (akzent === 'rot') continue;
  for (const schema of schemata) {
    const gesetzt = erklaert(
      (s) => s === `[data-accent="${akzent}"]` || s === `[data-theme="${schema}"][data-accent="${akzent}"]`,
    );
    for (const token of AKZENT_TOKENS) {
      if (!gesetzt.has(token)) fehler.push(`Akzent ${akzent} auf ${schema} definiert ${token} nicht.`);
    }
  }
}

for (const schema of schemata) {
  for (const akzent of akzente) {
    const tokens = tokensFuer(regeln, schema, akzent);
    const name = `${schema} / ${akzent}`;
    const hol = (token) => {
      const wert = aufloesen(tokens, token);
      const c = farbe(wert);
      if (!c) fehler.push(`${name}: ${token} ist kein Farbwert (${wert ?? 'fehlt'}).`);
      return c;
    };

    let tiefste = Infinity;
    for (const [vorne, hinten, soll] of PAARE) {
      const fg = hol(vorne);
      const [hgToken, basisToken] = Array.isArray(hinten) ? hinten : [hinten, null];
      const hgRoh = hol(hgToken);
      const basis = basisToken ? hol(basisToken) : null;
      if (!fg || !hgRoh || (basisToken && !basis)) continue;
      const hg = basis ? ueber(hgRoh, basis) : hgRoh;
      const wert = kontrast(ueber(fg, hg), hg);
      tiefste = Math.min(tiefste, wert / soll);
      const beschreibung = basisToken ? `${hgToken} auf ${basisToken}` : hgToken;
      if (wert + 1e-9 < soll) {
        fehler.push(
          `${name}: ${vorne} auf ${beschreibung} = ${wert.toFixed(2)}:1, gefordert ${soll}:1.`,
        );
      }
      zeilen.push({ name, paar: `${vorne} auf ${beschreibung}`, wert, soll });
    }

    // danger darf nicht wie die Marke aussehen: entweder andere Leuchtdichte
    // oder ein deutlich anderer Farbton.
    const danger = hol('--danger');
    const accentText = hol('--accent-text');
    if (danger && accentText) {
      const abstand = kontrast(danger, accentText);
      const ton = tonAbstand(danger, accentText);
      if (abstand < 1.25 && ton < 30) {
        fehler.push(
          `${name}: --danger und --accent-text sind zu aehnlich (${abstand.toFixed(2)}:1, ${ton.toFixed(0)} Grad).`,
        );
      }
      zeilen.push({
        name,
        paar: '--danger neben --accent-text',
        wert: abstand,
        soll: 1.25,
        ton,
      });
    }
    tiefstwert.set(name, tiefste);
  }
}

const breite = (spalte, min) =>
  Math.max(min, ...zeilen.map((z) => String(z[spalte]).length));
const bPaar = breite('paar', 4);
const bName = breite('name', 4);

const trenner = markdown ? ' | ' : '  ';
const kopf = ['Schema / Akzent'.padEnd(bName), 'Paar'.padEnd(bPaar), 'Soll'.padStart(5), 'Ist'.padStart(6), 'Status'];
console.log(`Zenit Kontrast-Gate: ${dateien.join(', ')}`);
console.log(`${schemata.length} Schemata x ${akzente.length} Akzente, ${zeilen.length} Paare\n`);
if (markdown) console.log(`| ${kopf.join(' | ')} |\n|${kopf.map((k) => '-'.repeat(k.length + 2)).join('|')}|`);
else console.log(kopf.join(trenner));

let letzte = '';
for (const z of zeilen) {
  if (!markdown && z.name !== letzte) {
    letzte = z.name;
    console.log('-'.repeat(bName + bPaar + 22));
  }
  const spalten = [
    z.name.padEnd(bName),
    z.paar.padEnd(bPaar),
    `${z.soll}`.padStart(5),
    z.wert.toFixed(2).padStart(6),
    z.wert + 1e-9 >= z.soll || (z.ton !== undefined && z.ton >= 30) ? 'ok' : 'FEHLER',
  ];
  console.log(markdown ? `| ${spalten.join(' | ')} |` : spalten.join(trenner));
}

console.log('\nKnappster Abstand je Kombination (Ist geteilt durch Soll, 1.00 ist gerade noch bestanden):');
for (const [name, wert] of tiefstwert) {
  console.log(`  ${name.padEnd(bName)}  ${wert.toFixed(2)}`);
}

if (fehler.length) {
  console.error(`\n${fehler.length} Fehler:`);
  for (const f of fehler) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`\nAlles bestanden: ${zeilen.length} Paare ueber ${schemata.length * akzente.length} Kombinationen.`);
