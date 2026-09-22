#!/usr/bin/env node
/**
 * Checks the examples in docs/components/*.md against the library source.
 *
 * (a) Every `z-…` element and every `z…` attribute used in an `html` fence has
 *     to be a selector of a component or directive in projects/zenit-ui/src/lib.
 * (b) Every binding on such an element (`[x]`, `(x)`, `[(x)]` and static
 *     attributes) has to be an input, model or output of one of the classes
 *     that own the selectors on that element, or a native/Angular attribute.
 * (c) Every identifier imported from 'zenit-ui' in a `ts` fence has to be
 *     exported from the public API.
 *
 * Plain Node, no dependencies. Prints a table and exits non-zero on a mismatch.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LIB = join(WURZEL, 'projects/zenit-ui/src/lib');
const PUBLIC_API = join(WURZEL, 'projects/zenit-ui/src/public-api.ts');
const DOCS = join(WURZEL, 'docs/components');

/** Attributes the browser or Angular itself owns, so no library input is needed. */
const NATIV = new Set([
  'alt',
  'autocomplete',
  'autofocus',
  'checked',
  'class',
  'colspan',
  'cols',
  'contenteditable',
  'dir',
  'download',
  'draggable',
  'for',
  'height',
  'hidden',
  'href',
  'id',
  'inputmode',
  'lang',
  'loading',
  'max',
  'maxlength',
  'min',
  'minlength',
  'multiple',
  'name',
  'open',
  'pattern',
  'placeholder',
  'readonly',
  'rel',
  'required',
  'role',
  'rows',
  'rowspan',
  'scope',
  'selected',
  'size',
  'span',
  'spellcheck',
  'src',
  'srcset',
  'step',
  'style',
  'tabindex',
  'target',
  'title',
  'type',
  'value',
  'width',
  'wrap',
]);

/** Angular directives and template syntax that may sit on any element. */
const ANGULAR = new Set([
  'cdkMenuTriggerFor',
  'formArrayName',
  'formControl',
  'formControlName',
  'formGroup',
  'formGroupName',
  'ngClass',
  'ngComponentOutlet',
  'ngFor',
  'ngForOf',
  'ngIf',
  'ngModel',
  'ngModelChange',
  'ngStyle',
  'ngSwitch',
  'ngSwitchCase',
  'ngTemplateOutlet',
  'queryParams',
  'routerLink',
  'routerLinkActive',
  'routerLinkActiveOptions',
]);

/** Native DOM events, usable on every element. */
const EREIGNISSE = new Set([
  'blur',
  'change',
  'click',
  'contextmenu',
  'dblclick',
  'focus',
  'focusin',
  'focusout',
  'input',
  'keydown',
  'keyup',
  'mouseenter',
  'mouseleave',
  'scroll',
  'submit',
  'toggle',
]);

const probleme = [];
const zeilen = [];

function melde(datei, art, text) {
  probleme.push({ datei, art, text });
}

/* ---------------------------------------------------------------- sources */

function tsDateien(ordner) {
  const raus = [];
  for (const eintrag of readdirSync(ordner)) {
    const pfad = join(ordner, eintrag);
    if (statSync(pfad).isDirectory()) {
      raus.push(...tsDateien(pfad));
    } else if (eintrag.endsWith('.ts') && !eintrag.endsWith('.spec.ts')) {
      raus.push(pfad);
    }
  }
  return raus;
}

/** Body of `export class <name>`, up to the next top-level export. */
function klassenRumpf(quelle, ab) {
  const ende = quelle.slice(ab).search(/\nexport (class|function|const|interface|type|abstract) /);
  return ende === -1 ? quelle.slice(ab) : quelle.slice(ab, ab + ende);
}

/**
 * Reads every selector of the library and the members each owning class
 * exposes. Returns `{ elemente, attribute, mitglieder }`.
 */
function leseBibliothek() {
  const elemente = new Map(); // 'z-icon' -> 'ZIcon'
  const attribute = new Map(); // 'zBtn' -> Set<'ZButton'>
  const mitglieder = new Map(); // 'ZButton' -> Set<'zBtn'|'size'|…>

  for (const datei of tsDateien(LIB)) {
    const quelle = readFileSync(datei, 'utf8');
    const selektor = /selector:\s*'([^']+)'/g;
    let treffer;
    while ((treffer = selektor.exec(quelle)) !== null) {
      const nachKlasse = /\nexport class (\w+)/g;
      nachKlasse.lastIndex = treffer.index;
      const klasseTreffer = nachKlasse.exec(quelle);
      if (!klasseTreffer) {
        continue;
      }
      const klasse = klasseTreffer[1];
      const rumpf = klassenRumpf(quelle, klasseTreffer.index + klasseTreffer[0].length);

      const namen = mitglieder.get(klasse) ?? new Set();
      // readonly x = input(…) / model(…) / output(…)
      for (const m of rumpf.matchAll(/(\w+)\s*=\s*(input|model|output)(?:\.required)?[(<]/g)) {
        namen.add(m[1]);
        // A model() also exposes the output <name>Change for [(name)].
        if (m[2] === 'model') {
          namen.add(`${m[1]}Change`);
        }
      }
      // alias: input(…, { alias: 'x' })
      for (const m of rumpf.matchAll(/alias:\s*'([^']+)'/g)) {
        namen.add(m[1]);
      }
      // hostDirectives inputs/outputs: 'cdkMenuItemDisabled: disabled'
      const kopf = quelle.slice(treffer.index, klasseTreffer.index);
      for (const m of kopf.matchAll(/(?:inputs|outputs):\s*\[([^\]]*)\]/g)) {
        for (const eintrag of m[1].matchAll(/'([^']+)'/g)) {
          namen.add(eintrag[1].split(':').pop().trim());
        }
      }
      mitglieder.set(klasse, namen);

      for (const teil of treffer[1].split(',').map((t) => t.trim())) {
        const attr = teil.match(/\[([\w-]+)\]/);
        if (attr) {
          if (!attribute.has(attr[1])) {
            attribute.set(attr[1], new Set());
          }
          attribute.get(attr[1]).add(klasse);
        } else if (/^[\w-]+$/.test(teil)) {
          elemente.set(teil, klasse);
        }
      }
    }
  }
  return { elemente, attribute, mitglieder };
}

/** Every identifier the public API exports, by following the barrels. */
function leseExporte() {
  const raus = new Set();
  const gesehen = new Set();

  const aufloesen = (basis, spez) => {
    const roh = resolve(dirname(basis), spez);
    for (const kandidat of [`${roh}.ts`, join(roh, 'index.ts')]) {
      try {
        if (statSync(kandidat).isFile()) {
          return kandidat;
        }
      } catch {
        /* next candidate */
      }
    }
    return null;
  };

  const gehe = (datei) => {
    if (gesehen.has(datei)) {
      return;
    }
    gesehen.add(datei);
    const quelle = readFileSync(datei, 'utf8');

    // export * from './x'
    for (const m of quelle.matchAll(/export\s+\*\s+from\s+'([^']+)'/g)) {
      const ziel = aufloesen(datei, m[1]);
      if (ziel) {
        gehe(ziel);
      }
    }
    // export { A, B } from './x'  /  export type { T } from './x'
    for (const m of quelle.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}\s*from\s+'([^']+)'/g)) {
      for (const name of m[1].split(',')) {
        const sauber = name.replace(/^\s*type\s+/, '').trim();
        if (sauber) {
          raus.add(
            sauber
              .split(/\s+as\s+/)
              .pop()
              .trim(),
          );
        }
      }
      const ziel = aufloesen(datei, m[2]);
      if (ziel) {
        gehe(ziel);
      }
    }
    // Declarations in this file, but only when it is reached by `export *`.
    for (const m of quelle.matchAll(
      /export\s+(?:declare\s+)?(?:abstract\s+)?(?:class|interface|type|const|function|enum)\s+(\w+)/g,
    )) {
      raus.add(m[1]);
    }
  };

  // Only barrels reached through `export *` contribute their own declarations;
  // a `export { … } from` barrel lists its names explicitly above.
  gehe(PUBLIC_API);
  const eigen = readFileSync(PUBLIC_API, 'utf8');
  for (const m of eigen.matchAll(
    /export\s+(?:abstract\s+)?(?:class|interface|type|const|function|enum)\s+(\w+)/g,
  )) {
    raus.add(m[1]);
  }
  return raus;
}

/* ------------------------------------------------------------------ fences */

/** All fenced code blocks of a markdown file as `{ sprache, code, zeile }`. */
function bloecke(text) {
  const raus = [];
  const zeilenArr = text.split('\n');
  let sprache = null;
  let puffer = [];
  let start = 0;
  for (let i = 0; i < zeilenArr.length; i++) {
    const zeile = zeilenArr[i];
    const zaun = zeile.match(/^```(\w*)\s*$/);
    if (!zaun) {
      if (sprache !== null) {
        puffer.push(zeile);
      }
      continue;
    }
    if (sprache === null) {
      sprache = zaun[1];
      puffer = [];
      start = i + 2;
    } else {
      raus.push({ sprache, code: puffer.join('\n'), zeile: start });
      sprache = null;
    }
  }
  return raus;
}

/** Attributes of one start tag: `{ name, art }` with art 'prop'|'event'|'banana'|'static'. */
function leseAttribute(roh) {
  const raus = [];
  const muster =
    /(\[\(?[\w.-]+\)?\]|\(\w[\w.-]*\)|[\w@#*:.-]+)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/g;
  let m;
  while ((m = muster.exec(roh)) !== null) {
    const token = m[1];
    if (token.startsWith('[(') && token.endsWith(')]')) {
      raus.push({ name: token.slice(2, -2), art: 'banana' });
    } else if (token.startsWith('[') && token.endsWith(']')) {
      raus.push({ name: token.slice(1, -1), art: 'prop' });
    } else if (token.startsWith('(') && token.endsWith(')')) {
      raus.push({ name: token.slice(1, -1), art: 'event' });
    } else if (/^[a-zA-Z][\w-]*$/.test(token)) {
      raus.push({ name: token, art: 'static' });
    }
  }
  return raus;
}

function istErlaubt(name, art) {
  const blank = name.replace(/^attr\./, '').split('.')[0];
  if (blank.startsWith('aria-') || blank.startsWith('data-') || blank.startsWith('#')) {
    return true;
  }
  if (art === 'event') {
    return EREIGNISSE.has(blank.split('.')[0]) || ANGULAR.has(blank);
  }
  return NATIV.has(blank) || ANGULAR.has(blank);
}

/* ------------------------------------------------------------------- check */

const { elemente, attribute, mitglieder } = leseBibliothek();
const exporte = leseExporte();

const dateien = readdirSync(DOCS)
  .filter((n) => n.endsWith('.md'))
  .sort();

let elementePruefung = 0;
let attributePruefung = 0;
let bindungen = 0;
let importe = 0;

for (const name of dateien) {
  const text = readFileSync(join(DOCS, name), 'utf8');
  let dateiSel = 0;
  let dateiBind = 0;
  let dateiImp = 0;

  for (const block of bloecke(text)) {
    if (block.sprache === 'html') {
      const tag = /<([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)\/?>/g;
      let t;
      while ((t = tag.exec(block.code)) !== null) {
        const element = t[1];
        const attrs = leseAttribute(t[2]);
        const besitzer = new Set();

        if (element.startsWith('z-')) {
          elementePruefung++;
          dateiSel++;
          const klasse = elemente.get(element);
          if (!klasse) {
            melde(name, 'selector', `<${element}> is no selector of the library`);
          } else {
            besitzer.add(klasse);
          }
        }

        for (const a of attrs) {
          if (a.art !== 'static' && a.art !== 'prop') {
            continue;
          }
          const klassen = attribute.get(a.name);
          if (klassen) {
            attributePruefung++;
            dateiSel++;
            for (const k of klassen) {
              besitzer.add(k);
            }
          } else if (/^z[A-Z]/.test(a.name)) {
            attributePruefung++;
            dateiSel++;
            melde(name, 'selector', `[${a.name}] on <${element}> is no selector of the library`);
          }
        }

        if (besitzer.size === 0) {
          continue;
        }
        const bekannt = new Set();
        for (const k of besitzer) {
          for (const m of mitglieder.get(k) ?? []) {
            bekannt.add(m);
          }
        }
        for (const a of attrs) {
          const blank = a.name.replace(/^attr\./, '').split('.')[0];
          if (attribute.has(blank) || bekannt.has(blank)) {
            bindungen++;
            dateiBind++;
            continue;
          }
          if (istErlaubt(a.name, a.art)) {
            continue;
          }
          bindungen++;
          dateiBind++;
          melde(
            name,
            'binding',
            `${a.art === 'event' ? `(${a.name})` : a.name} on <${element}> is no input, ` +
              `model or output of ${[...besitzer].join(', ')}`,
          );
        }
      }
    }

    if (block.sprache === 'ts') {
      const muster = /import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+'zenit-ui'/g;
      let i;
      while ((i = muster.exec(block.code)) !== null) {
        for (const roh of i[1].split(',')) {
          const ident = roh
            .replace(/^\s*type\s+/, '')
            .split(/\s+as\s+/)[0]
            .trim();
          if (!ident) {
            continue;
          }
          importe++;
          dateiImp++;
          if (!exporte.has(ident)) {
            melde(name, 'import', `${ident} is not exported from 'zenit-ui'`);
          }
        }
      }
    }
  }
  zeilen.push({ name, sel: dateiSel, bind: dateiBind, imp: dateiImp });
}

/* ------------------------------------------------------------------ output */

const breite = Math.max(4, ...zeilen.map((z) => z.name.length));
const kopf = `${'file'.padEnd(breite)}  selectors  bindings  imports`;
console.log(kopf);
console.log('-'.repeat(kopf.length));
for (const z of zeilen) {
  console.log(
    `${z.name.padEnd(breite)}  ${String(z.sel).padStart(9)}  ${String(z.bind).padStart(8)}  ${String(
      z.imp,
    ).padStart(7)}`,
  );
}
console.log('-'.repeat(kopf.length));
console.log(
  `${String(dateien.length + ' files').padEnd(breite)}  ${String(
    elementePruefung + attributePruefung,
  ).padStart(9)}  ${String(bindungen).padStart(8)}  ${String(importe).padStart(7)}`,
);
console.log(
  `\n${elementePruefung} element selectors, ${attributePruefung} attribute selectors, ` +
    `${bindungen} bindings, ${importe} imports checked against ${elemente.size + attribute.size} ` +
    `library selectors and ${exporte.size} exports.`,
);

if (probleme.length) {
  console.error(`\n${probleme.length} mismatch(es):`);
  for (const p of probleme) {
    console.error(`  ${p.datei}  [${p.art}]  ${p.text}`);
  }
  process.exit(1);
}
console.log('\nOK: no mismatches.');
