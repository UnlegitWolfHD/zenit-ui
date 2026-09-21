#!/usr/bin/env node
/**
 * Generates the machine-readable documentation that ships inside the package:
 *
 *   projects/zenit-ui/llms.txt       index, llms.txt convention, under 8 kB
 *   projects/zenit-ui/llms-full.txt  everything a model needs with no other file
 *
 * `ng-package.json` copies both into the package root, so a consumer reads
 * `node_modules/zenit-ui/llms-full.txt` and needs neither the repository nor
 * the sources.
 *
 *   node tools/generate-llms.mjs            write both files
 *   node tools/generate-llms.mjs --check    write nothing, assert completeness
 *
 * The API part is read out of the sources, never hand-maintained: selectors
 * come from the `@Component`/`@Directive` decorator, inputs, models and outputs
 * from the `input()`/`model()`/`output()` members with their declared type,
 * their real initialiser as the default and their JSDoc as the description,
 * slots from the `<ng-content select="…">` of the template, tokens from
 * `tokens.css` and the layout classes from `_grundlage.css`. Examples and the
 * "don't" notes come from the guides under `docs/components/`.
 *
 * Only the TypeScript the workspace has anyway; no new dependency, no checker,
 * no timestamps, stable ordering, so a check can diff the output.
 */

import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PAKET = join(WURZEL, 'projects/zenit-ui');
const QUELLE = join(PAKET, 'src');
const PUBLIC_API = join(QUELLE, 'public-api.ts');
const STYLES = join(QUELLE, 'styles');
const DOCS = join(WURZEL, 'docs');
const ZIEL = join(PAKET, 'llms');

const VERSION = JSON.parse(readFileSync(join(PAKET, 'package.json'), 'utf8')).version;

/* ------------------------------------------------------------------ helpers */

/** One line, collapsed whitespace. */
function zeile(text) {
  return text.replace(/\s+/g, ' ').trim();
}

/** The same, escaped for a markdown table cell. */
function zelle(text) {
  return zeile(text).replaceAll('|', '\\|');
}

/** The text of a JSDoc comment node, tags excluded. */
function jsdocText(knoten) {
  const docs = knoten.jsDoc ?? [];
  const letzter = docs[docs.length - 1];
  if (!letzter) {
    return '';
  }
  return teileText(letzter.comment);
}

/**
 * A JSDoc comment is either a string or a list of parts. `{@link X}` is its own
 * part, whose identifier sits in `name`, not in `text`; without reading it the
 * reference vanishes from the sentence.
 */
function teileText(roh) {
  if (typeof roh === 'string') {
    return roh;
  }
  return (roh ?? [])
    .map((t) => (t.name ? `\`${t.name.getText()}\`${t.text ?? ''}` : (t.text ?? '')))
    .join('');
}

/** `{@link X}` reads as the code span `X`; there is nothing to link to here. */
function entlinke(text) {
  return text.replace(/\{@link\s+([^}|]+?)(?:\s*\|[^}]*)?\}/g, '`$1`');
}

/** First paragraph of a JSDoc comment, as one line. */
function ersterAbsatz(text) {
  return zeile(entlinke(text.split(/\n\s*\n/)[0] ?? ''));
}

/** Everything after the first paragraph, paragraphs kept. */
function weitereAbsaetze(text) {
  return entlinke(
    text
      .split(/\n\s*\n/)
      .slice(1)
      .join('\n\n'),
  ).trim();
}

function tag(knoten, name) {
  for (const doc of knoten.jsDoc ?? []) {
    for (const t of doc.tags ?? []) {
      if (t.tagName.text === name) {
        return teileText(t.comment);
      }
    }
  }
  return null;
}

function istIntern(knoten) {
  return tag(knoten, 'internal') !== null;
}

/** The first fenced block of `@example`, with its language. */
function beispielAusJsdoc(knoten) {
  const roh = tag(knoten, 'example');
  if (!roh) {
    return null;
  }
  const treffer = roh.match(/```(\w*)\n([\s\S]*?)```/);
  return treffer ? { sprache: treffer[1] || 'html', code: treffer[2].trimEnd() } : null;
}

/* -------------------------------------------------------- the public surface */

/**
 * Every name the public API exports, in the order the barrels reach them, with
 * the file each name is declared in. Mirrors what `public-api.ts` re-exports,
 * so a name that is not reachable from there never lands in the output.
 */
function leseOberflaeche() {
  const namen = new Map(); // name -> { datei, paket }
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

  const gehe = (datei, paket) => {
    if (gesehen.has(datei)) {
      return;
    }
    gesehen.add(datei);
    const quelle = readFileSync(datei, 'utf8');
    const sf = ts.createSourceFile(datei, quelle, ts.ScriptTarget.Latest, true);

    for (const st of sf.statements) {
      if (ts.isExportDeclaration(st) && st.moduleSpecifier && !st.exportClause) {
        const ziel = aufloesen(datei, st.moduleSpecifier.text);
        if (ziel) {
          gehe(ziel, paket);
        }
        continue;
      }
      if (ts.isExportDeclaration(st) && st.exportClause && ts.isNamedExports(st.exportClause)) {
        const ziel = st.moduleSpecifier ? aufloesen(datei, st.moduleSpecifier.text) : datei;
        for (const el of st.exportClause.elements) {
          if (ziel && !namen.has(el.name.text)) {
            namen.set(el.name.text, { datei: ziel, paket });
          }
        }
        if (ziel && ziel !== datei) {
          gehe(ziel, paket);
        }
        continue;
      }
      const exportiert = ts.getModifiers(st)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
      if (!exportiert || istIntern(st)) {
        continue;
      }
      if (ts.isVariableStatement(st)) {
        for (const d of st.declarationList.declarations) {
          if (ts.isIdentifier(d.name) && !namen.has(d.name.text)) {
            namen.set(d.name.text, { datei, paket });
          }
        }
      } else if (st.name && ts.isIdentifier(st.name) && !namen.has(st.name.text)) {
        namen.set(st.name.text, { datei, paket });
      }
    }
  };

  // public-api.ts itself: every `export * from` line names a package.
  const sf = ts.createSourceFile(
    PUBLIC_API,
    readFileSync(PUBLIC_API, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  for (const st of sf.statements) {
    if (ts.isExportDeclaration(st) && st.moduleSpecifier && !st.exportClause) {
      const spez = st.moduleSpecifier.text;
      const paket = spez.includes('/pakete/') ? spez.split('/').pop() : 'grundlage';
      const ziel = aufloesen(PUBLIC_API, spez);
      if (ziel) {
        gehe(ziel, paket);
      }
    }
  }
  return namen;
}

/* ------------------------------------------------------------ the decorators */

/** The object literal of an Angular decorator on a class, or null. */
function dekorator(klasse, namen) {
  for (const d of ts.getDecorators(klasse) ?? []) {
    if (!ts.isCallExpression(d.expression) || !ts.isIdentifier(d.expression.expression)) {
      continue;
    }
    const name = d.expression.expression.text;
    if (!namen.includes(name)) {
      continue;
    }
    const arg = d.expression.arguments[0];
    return { name, literal: arg && ts.isObjectLiteralExpression(arg) ? arg : null };
  }
  return null;
}

function eigenschaft(literal, name) {
  for (const p of literal?.properties ?? []) {
    if (ts.isPropertyAssignment(p) && p.name.getText() === name) {
      return p.initializer;
    }
  }
  return null;
}

function stringWert(knoten) {
  return knoten && ts.isStringLiteralLike(knoten) ? knoten.text : null;
}

/** Type of an `input()`/`model()`/`output()` member, from the source alone. */
function typVon(aufruf, kind) {
  const args = aufruf.typeArguments;
  if (args?.length) {
    return { typ: zeile(args[0].getText()), akzeptiert: args[1] ? zeile(args[1].getText()) : null };
  }
  if (kind === 'output') {
    return { typ: 'void', akzeptiert: null };
  }
  const erst = aufruf.arguments[0];
  if (!erst) {
    return { typ: 'unknown', akzeptiert: null };
  }
  if (ts.isStringLiteralLike(erst)) {
    return { typ: 'string', akzeptiert: null };
  }
  if (erst.kind === ts.SyntaxKind.TrueKeyword || erst.kind === ts.SyntaxKind.FalseKeyword) {
    return { typ: 'boolean', akzeptiert: null };
  }
  if (ts.isNumericLiteral(erst) || ts.isPrefixUnaryExpression(erst)) {
    return { typ: 'number', akzeptiert: null };
  }
  if (erst.kind === ts.SyntaxKind.NullKeyword) {
    return { typ: 'null', akzeptiert: null };
  }
  if (ts.isArrayLiteralExpression(erst)) {
    return { typ: 'unknown[]', akzeptiert: null };
  }
  return { typ: zeile(erst.getText()), akzeptiert: null };
}

/** `input()`, `input.required()`, `model()`, `model.required()`, `output()`. */
function signalArt(aufruf) {
  const ziel = aufruf.expression;
  if (ts.isIdentifier(ziel) && ['input', 'model', 'output'].includes(ziel.text)) {
    return { kind: ziel.text, pflicht: false };
  }
  if (
    ts.isPropertyAccessExpression(ziel) &&
    ts.isIdentifier(ziel.expression) &&
    ['input', 'model'].includes(ziel.expression.text) &&
    ziel.name.text === 'required'
  ) {
    return { kind: ziel.expression.text, pflicht: true };
  }
  return null;
}

/** Inputs, models and outputs of one class, in source order. */
function mitgliederVon(klasse) {
  const raus = [];
  for (const m of klasse.members) {
    if (!ts.isPropertyDeclaration(m) || !m.initializer || istIntern(m)) {
      continue;
    }
    const privat = ts
      .getModifiers(m)
      ?.some((x) =>
        [ts.SyntaxKind.PrivateKeyword, ts.SyntaxKind.ProtectedKeyword].includes(x.kind),
      );
    if (privat || !ts.isCallExpression(m.initializer)) {
      continue;
    }
    const art = signalArt(m.initializer);
    if (!art) {
      continue;
    }
    const aufruf = m.initializer;
    const { typ, akzeptiert } = typVon(aufruf, art.kind);
    const optionen = art.kind === 'output' ? null : aufruf.arguments[1];
    const transform =
      optionen && ts.isObjectLiteralExpression(optionen)
        ? stringWertOderName(eigenschaft(optionen, 'transform'))
        : null;
    const alias =
      optionen && ts.isObjectLiteralExpression(optionen)
        ? stringWert(eigenschaft(optionen, 'alias'))
        : null;
    raus.push({
      name: alias ?? m.name.getText(),
      kind: art.kind,
      pflicht: art.pflicht,
      typ,
      akzeptiert,
      transform,
      standard: art.pflicht
        ? '(required)'
        : art.kind === 'output'
          ? ''
          : zeile(aufruf.arguments[0]?.getText() ?? 'undefined'),
      beschreibung: zelle(entlinke(jsdocText(m))),
    });
  }
  return raus;
}

function stringWertOderName(knoten) {
  if (!knoten) {
    return null;
  }
  return ts.isIdentifier(knoten) ? knoten.text : zeile(knoten.getText());
}

/** Public methods of a service, with their signature and first JSDoc line. */
function methodenVon(klasse) {
  const raus = [];
  for (const m of klasse.members) {
    if (istIntern(m)) {
      continue;
    }
    const privat = ts
      .getModifiers(m)
      ?.some((x) =>
        [ts.SyntaxKind.PrivateKeyword, ts.SyntaxKind.ProtectedKeyword].includes(x.kind),
      );
    if (privat) {
      continue;
    }
    if (ts.isMethodDeclaration(m) && ts.isIdentifier(m.name)) {
      const parameter = m.parameters.map((p) => zeile(p.getText())).join(', ');
      const rueck = m.type ? `: ${zeile(m.type.getText())}` : '';
      const typParameter = m.typeParameters?.length
        ? `<${m.typeParameters.map((p) => zeile(p.getText())).join(', ')}>`
        : '';
      raus.push({
        signatur: `${m.name.text}${typParameter}(${parameter})${rueck}`,
        beschreibung: ersterAbsatz(jsdocText(m)),
        rueckgabe: zeile(entlinke(tag(m, 'returns') ?? '')),
      });
    } else if (ts.isPropertyDeclaration(m) && ts.isIdentifier(m.name) && m.initializer) {
      const doc = jsdocText(m);
      if (doc) {
        raus.push({ signatur: m.name.text, beschreibung: ersterAbsatz(doc), rueckgabe: '' });
      }
    }
  }
  return raus;
}

/** Slot selectors of a component template, in template order. */
function slotsVon(literal) {
  const template = eigenschaft(literal, 'template');
  const text = template && ts.isStringLiteralLike(template) ? template.text : '';
  const raus = [];
  for (const m of text.matchAll(/<ng-content(\s[^>]*?)?\/?>/g)) {
    const select = m[1]?.match(/select\s*=\s*"([^"]+)"/);
    raus.push(select ? select[1] : '(default content)');
  }
  return [...new Set(raus)];
}

/** `inputs`/`outputs` an entry of `hostDirectives` exposes under a new name. */
function hostDirektiven(literal) {
  const knoten = eigenschaft(literal, 'hostDirectives');
  if (!knoten || !ts.isArrayLiteralExpression(knoten)) {
    return [];
  }
  const raus = [];
  for (const el of knoten.elements) {
    if (ts.isIdentifier(el)) {
      raus.push({ name: el.text, inputs: [], outputs: [] });
      continue;
    }
    if (!ts.isObjectLiteralExpression(el)) {
      continue;
    }
    const quelle = eigenschaft(el, 'directive');
    const liste = (feld) => {
      const knoten = eigenschaft(el, feld);
      if (!knoten || !ts.isArrayLiteralExpression(knoten)) {
        return [];
      }
      return knoten.elements
        .filter((x) => ts.isStringLiteralLike(x))
        .map((x) => x.text.split(':').pop().trim());
    };
    raus.push({
      name: quelle ? zeile(quelle.getText()) : '?',
      inputs: liste('inputs'),
      outputs: liste('outputs'),
    });
  }
  return raus;
}

/* ------------------------------------------------------------------ the scan */

/** Every exported declaration of the public API, enriched with its metadata. */
function sammle() {
  const oberflaeche = leseOberflaeche();
  const proDatei = new Map();
  for (const [name, { datei, paket }] of oberflaeche) {
    if (!proDatei.has(datei)) {
      proDatei.set(datei, { paket, namen: new Set() });
    }
    proDatei.get(datei).namen.add(name);
  }

  const eintraege = [];
  for (const [datei, { paket, namen }] of proDatei) {
    const sf = ts.createSourceFile(
      datei,
      readFileSync(datei, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
    );
    for (const st of sf.statements) {
      const deklarationen = ts.isVariableStatement(st)
        ? st.declarationList.declarations.filter((d) => ts.isIdentifier(d.name))
        : st.name && ts.isIdentifier(st.name)
          ? [st]
          : [];
      for (const d of deklarationen) {
        const name = d.name.text;
        if (!namen.has(name) || istIntern(st) || istIntern(d)) {
          continue;
        }
        eintraege.push(baue(name, st, d, paket, datei));
      }
    }
  }
  return eintraege;
}

function baue(name, statement, deklaration, paket, datei) {
  const doc = jsdocText(statement) || jsdocText(deklaration);
  const basis = {
    name,
    paket,
    datei,
    zweck: ersterAbsatz(doc),
    notizen: weitereAbsaetze(doc),
    beispiel: beispielAusJsdoc(statement) ?? beispielAusJsdoc(deklaration),
  };

  if (ts.isClassDeclaration(statement)) {
    const deko = dekorator(statement, ['Component', 'Directive', 'Service', 'Injectable', 'Pipe']);
    const literal = deko?.literal;
    const implementiert = (statement.heritageClauses ?? [])
      .filter((h) => h.token === ts.SyntaxKind.ImplementsKeyword)
      .flatMap((h) => h.types.map((t) => zeile(t.getText())));
    if (deko && ['Component', 'Directive'].includes(deko.name)) {
      return {
        ...basis,
        art: deko.name === 'Component' ? 'component' : 'directive',
        selektor: stringWert(eigenschaft(literal, 'selector')) ?? '',
        slots: deko.name === 'Component' ? slotsVon(literal) : [],
        hosts: hostDirektiven(literal),
        implementiert,
        cva: /NG_VALUE_ACCESSOR/.test(literal?.getText() ?? ''),
        mitglieder: mitgliederVon(statement),
      };
    }
    if (deko && ['Service', 'Injectable'].includes(deko.name)) {
      return { ...basis, art: 'service', methoden: methodenVon(statement), implementiert };
    }
    return { ...basis, art: 'class', mitglieder: mitgliederVon(statement), implementiert };
  }
  if (ts.isInterfaceDeclaration(statement)) {
    return { ...basis, art: 'interface', felder: felderVon(statement) };
  }
  if (ts.isTypeAliasDeclaration(statement)) {
    return { ...basis, art: 'type', signatur: zeile(statement.type.getText()) };
  }
  if (ts.isFunctionDeclaration(statement)) {
    const parameter = statement.parameters.map((p) => zeile(p.getText())).join(', ');
    const rueck = statement.type ? `: ${zeile(statement.type.getText())}` : '';
    return {
      ...basis,
      art: name.startsWith('provide') ? 'provider' : 'function',
      signatur: `${name}(${parameter})${rueck}`,
    };
  }
  const initialisierer = deklaration.initializer;
  const istToken =
    initialisierer &&
    ts.isNewExpression(initialisierer) &&
    /InjectionToken/.test(initialisierer.expression.getText());
  return {
    ...basis,
    art: istToken ? 'token' : 'const',
    signatur: deklaration.type
      ? zeile(deklaration.type.getText())
      : istToken
        ? zeile(initialisierer.typeArguments?.[0]?.getText() ?? 'unknown')
        : zeile(initialisierer?.getText().slice(0, 120) ?? ''),
  };
}

function felderVon(knoten) {
  const raus = [];
  for (const m of knoten.members) {
    if (!m.name || istIntern(m)) {
      continue;
    }
    const optional = m.questionToken ? '?' : '';
    const typ = m.type ? zeile(m.type.getText()) : 'unknown';
    raus.push({
      name: `${m.name.getText()}${optional}`,
      typ: zelle(typ),
      beschreibung: zelle(entlinke(jsdocText(m))),
    });
  }
  return raus;
}

/* ------------------------------------------------------------------- guides */

/** The guides under docs/components, keyed by the classes their import names. */
function leseLeitfaeden() {
  const raus = [];
  let dateien = [];
  try {
    dateien = readdirSync(DOCS ? join(DOCS, 'components') : '')
      .filter((n) => n.endsWith('.md') && n !== 'README.md')
      .sort();
  } catch {
    return raus;
  }
  for (const name of dateien) {
    const text = readFileSync(join(DOCS, 'components', name), 'utf8');
    const abschnitt = (ueberschrift) => {
      const treffer = text.match(
        new RegExp(`^##\\s+${ueberschrift}\\s*$([\\s\\S]*?)(?=^##\\s|\\Z)`, 'm'),
      );
      return treffer ? treffer[1] : '';
    };
    const klassen = [
      ...(abschnitt('Import').match(/\{([^}]*)\}/)?.[1] ?? '')
        .split(',')
        .map((n) => n.replace(/^\s*type\s+/, '').trim())
        .filter(Boolean),
    ];
    const beispiel = abschnitt('Examples').match(/```html\n([\s\S]*?)```/);
    const nicht = [
      ...abschnitt(`Do / Don't`).matchAll(/^-\s+(Don't\s+[^\n]*(?:\n\s{2,}[^\n]*)*)/gm),
    ].map((m) => zeile(m[1]));
    raus.push({
      datei: `docs/components/${name}`,
      klassen,
      beispiel: beispiel ? beispiel[1].trimEnd() : null,
      nicht,
    });
  }
  return raus;
}

/* -------------------------------------------------------- styles and tokens */

/** The tokens of tokens.css, grouped by the block they stand in. */
function leseTokens() {
  const text = readFileSync(join(STYLES, 'tokens.css'), 'utf8');
  const gruppen = [
    {
      name: 'Colour (scheme dark, the default)',
      muster:
        /^--(bg|surface|border|text|accent|on-accent|scrim|focus|success|warning|danger|info|mc-|on-mc|chart-|shadow-)/,
    },
    { name: 'Spacing', muster: /^--space-/ },
    { name: 'Radius', muster: /^--radius-/ },
    { name: 'Sizes', muster: /^--(control-|icon|container|sidebar|header|measure)/ },
    { name: 'Layers', muster: /^--z-/ },
    { name: 'Fonts', muster: /^--font-/ },
  ];
  const zugeordnet = new Map(gruppen.map((g) => [g.name, []]));
  for (const m of text.matchAll(/^\s*(--[\w-]+):\s*([^;]+);/gm)) {
    const gruppe = gruppen.find((g) => g.muster.test(m[1]));
    if (gruppe) {
      zugeordnet.get(gruppe.name).push(`${m[1]}: ${m[2].trim()}`);
    }
  }
  const stile = [
    ...text.matchAll(/^\.([\w-]+)\s*\{\s*font-family: var\(--font-(\w+)\);\s*font-size: (\d+)px/gm),
  ].map((m) => `.${m[1]} (${m[3]}px, ${m[2]})`);
  return { gruppen: [...zugeordnet].filter(([, w]) => w.length), stile };
}

/**
 * The classes a consumer sets by hand. Every one is verified against
 * `_grundlage.css`; an entry the stylesheet no longer has fails the run rather
 * than shipping a class that does not exist.
 */
function leseKlassen() {
  const css = readFileSync(join(STYLES, '_grundlage.css'), 'utf8');
  const liste = [
    [
      'z-root',
      'On `<html>` and on `<body>`. Background, text colour, fonts, `font: inherit` for controls, focus ring.',
    ],
    ['z-container', 'Centres content at `--container` width with the page gutter.'],
    ['z-stack', 'Grid with `--space-5` between its children. The vertical rhythm of a page.'],
    [
      'z-cluster',
      'Flex row that wraps, `--space-2` gap, items centred. Buttons and badges side by side.',
    ],
    ['z-section', 'A section of a public page: vertical padding plus the 1px separating line.'],
    ['z-panel-shell', 'Sidebar plus content from 900px up, one column below.'],
    [
      'z-mono',
      'JetBrains Mono with `tabular-nums`: prices, figures, IPs, ports, file names, log lines.',
    ],
    ['z-muted', 'Text in `--text-muted`: descriptions and icons.'],
    ['z-subtle', 'Text in `--text-subtle`: timestamps and placeholders.'],
    [
      'z-visually-hidden',
      'Hidden on screen, read by a screen reader. Live regions and skip links.',
    ],
    [
      'z-field__error',
      'The error sentence next to a control that sits outside a `z-field` (checkbox, toggle).',
    ],
    ['z-theme-mc', 'Minecraft subtheme on a page container: the primary button turns green.'],
  ];
  const fehlend = liste.filter(([k]) => !css.includes(`.${k}`)).map(([k]) => k);
  if (fehlend.length) {
    throw new Error(`_grundlage.css no longer has: ${fehlend.join(', ')}`);
  }
  return liste;
}

/** The mapping table of docs/migration-from-material.md, section 3. */
function leseMigration() {
  let text = '';
  try {
    text = readFileSync(join(DOCS, 'migration-from-material.md'), 'utf8');
  } catch {
    return [];
  }
  return [...text.matchAll(/^###\s+3\.\d+\s+(.+?)\s+→\s+(.+?)\s*$/gm)].map((m) => ({
    von: zeile(m[1]),
    nach: zeile(m[2]),
  }));
}

/* ------------------------------------------------------------------- output */

const REGELN = `- **No \`@angular/material\`.** Not the components, not the theme, not temporarily. The one
  exception is the Material Icons webfont, self-hosted. Peer dependencies are \`@angular/core\`,
  \`common\`, \`forms\`, \`cdk\` and \`rxjs\`; nothing else.
- **Tokens only.** Every colour, spacing, radius, font and shadow comes from \`var(--…)\`.
  \`tokens.css\` is the single place with hex and pixel values. Write no hex, no \`rgb()\`, no pixel
  value of your own.
- **\`z-root\` on \`<html>\` and on \`<body>\`.** Without it controls fall back to Arial, the focus
  ring is missing and overlays attached to \`body\` lose the variables.
- **Style order is binding**, by package specifier:
  \`zenit-ui/styles/tokens.css\`, \`@angular/cdk/overlay-prebuilt.css\`,
  [\`zenit-ui/styles/themes.css\`], \`zenit-ui/styles/zenit-ui.css\`, then your own stylesheet.
  \`:root\` and \`[data-theme="light"]\` weigh the same, so the later rule wins.
- **\`<z-toast-outlet />\` exactly once**, in the application shell. \`ZToast\` writes into it;
  without it nothing shows.
- **The CDK overlay CSS is required**: \`@angular/cdk/overlay-prebuilt.css\`. Dialog, menu, tooltip
  and the combobox panel are CDK overlays and are unpositioned without it.
- **Self-host the Material Icons font.** The library loads no font. Import
  \`material-icons/iconfont/filled.css\` with \`layer(schriften)\`, or \`.z-icon\` loses against the
  font's own \`font-size\`.
- **Providers**: \`provideZenitLabels(…)\` for the built-in texts, \`provideZenitTheme(…)\` for
  schemes and accents. Both at the application root.
- **Banned**: \`linear-gradient\`, \`radial-gradient\`, \`conic-gradient\`, \`backdrop-filter\`,
  \`text-shadow\`, \`filter\`, coloured \`box-shadow\`, grid backgrounds, all-caps labels, icon
  backplates, \`::ng-deep\`, \`!important\`.
- **Copy comes from you.** The library holds no product strings; its only texts are accessible
  names, overridable per input or through \`provideZenitLabels\`.
- Components ship no styles of their own and are \`OnPush\` with signal inputs. Form controls are
  native elements carrying library classes. Overlays, focus traps and menus come from
  \`@angular/cdk\`.`;

const SETUP = `1. **Install.** The package is not on npm; it is installed from the tarball built by
   \`npm pack\` inside \`dist/zenit-ui\`:
   \`\`\`bash
   npm i ./zenit-ui-${VERSION}.tgz
   \`\`\`
   \`ng add ./zenit-ui-${VERSION}.tgz --themes\` performs steps 2 to 6 automatically.

2. **Register the stylesheets** in \`angular.json\` (\`projects.<app>.architect.build.options.styles\`)
   or via \`@import\` in your entry stylesheet. The order is binding:
   \`\`\`json
   "styles": [
     "zenit-ui/styles/tokens.css",
     "@angular/cdk/overlay-prebuilt.css",
     "zenit-ui/styles/themes.css",
     "zenit-ui/styles/zenit-ui.css",
     "src/styles.css"
   ]
   \`\`\`
   \`themes.css\` is opt-in and only needed for light, contrast and the accents.

3. **Set \`z-root\`** on \`<html>\` and on \`<body>\` in \`index.html\`:
   \`\`\`html
   <html lang="de" class="z-root">
     <body class="z-root">
       <app-root></app-root>
     </body>
   </html>
   \`\`\`

4. **Self-host the fonts** in \`src/styles.css\`:
   \`\`\`css
   @import "material-icons/iconfont/filled.css" layer(schriften);
   @import "@fontsource/inter/400.css";
   @import "@fontsource/inter/500.css";
   @import "@fontsource/inter/600.css";
   @import "@fontsource/space-grotesk/600.css";
   @import "@fontsource/space-grotesk/700.css";
   @import "@fontsource/jetbrains-mono/400.css";
   @import "@fontsource/jetbrains-mono/600.css";
   \`\`\`
   The \`layer(schriften)\` is required: \`material-icons\` sets its own \`font-size\` on
   \`.material-icons\` and is loaded after \`zenit-ui.css\`, so without the layer an icon is 24px
   inside a 20px box.

5. **Mount the toast outlet once**, at the end of the application shell:
   \`\`\`html
   <app-header />
   <router-outlet />
   <app-footer />
   <z-toast-outlet />
   \`\`\`

6. **Providers** in \`app.config.ts\`:
   \`\`\`ts
   import { provideZenitLabels, provideZenitTheme, Z_LABELS_EN, zenitThemeInitScript } from 'zenit-ui';

   export const appConfig: ApplicationConfig = {
     providers: [
       provideRouter(routes),
       provideZenitTheme({ defaultScheme: 'system' }),
       provideZenitLabels(Z_LABELS_EN), // omit for the German defaults
     ],
   };
   \`\`\`
   Against a flash of the wrong scheme put the output of \`zenitThemeInitScript()\` as an inline
   \`<script>\` into the \`<head>\` of \`index.html\`, before the stylesheets, and set
   \`"inlineCritical": false\` for the production build.

Components are standalone: import the class into the \`imports\` array of your component, nothing
else. There is no \`NgModule\`.`;

/** The same rules as REGELN, one line each, for the index file. */
const REGELN_KURZ = `- **No \`@angular/material\`**, not even temporarily. The one exception is the Material Icons
  webfont. Peers: \`@angular/core\`, \`common\`, \`forms\`, \`cdk\`, \`rxjs\`; nothing else.
- **Tokens only.** Colour, spacing, radius, font and shadow come from \`var(--…)\`. Write no hex,
  no \`rgb()\`, no pixel value of your own; \`tokens.css\` is the only place that has them.
- **\`class="z-root"\` on \`<html>\` and on \`<body>\`**, or controls fall back to Arial, the focus
  ring is gone and overlays on \`body\` lose the variables.
- **Style order is binding**, by package specifier: \`zenit-ui/styles/tokens.css\`,
  \`@angular/cdk/overlay-prebuilt.css\`, [\`zenit-ui/styles/themes.css\`],
  \`zenit-ui/styles/zenit-ui.css\`, your own. Later rules of equal weight win.
- **\`<z-toast-outlet />\` exactly once** in the shell, or \`ZToast\` shows nothing.
- **\`@angular/cdk/overlay-prebuilt.css\` is required**: dialog, menu, tooltip and the combobox
  panel are CDK overlays and are unpositioned without it.
- **Self-host Material Icons**: \`@import "material-icons/iconfont/filled.css" layer(schriften);\`
  — without the layer \`.z-icon\` loses against the font's own \`font-size\`.
- **Providers at the root**: \`provideZenitLabels(…)\` for the built-in texts,
  \`provideZenitTheme(…)\` for schemes and accents.
- **Banned**: gradients, \`backdrop-filter\`, \`text-shadow\`, \`filter\`, coloured \`box-shadow\`,
  grid backgrounds, all-caps labels, icon backplates, \`::ng-deep\`, \`!important\`.
- **Copy comes from you.** The library holds no product strings, only accessible names.`;

/** The same six steps as SETUP, without the code blocks, for the index file. */
const SETUP_KURZ = `1. \`npm i ./zenit-ui-${VERSION}.tgz\` (the package is not on npm). \`ng add ./zenit-ui-${VERSION}.tgz --themes\`
   does steps 2 to 6 for you.
2. Register the stylesheets in \`angular.json\`, in this order:
   \`zenit-ui/styles/tokens.css\`, \`@angular/cdk/overlay-prebuilt.css\`,
   \`zenit-ui/styles/themes.css\` (opt-in: light, contrast, accents),
   \`zenit-ui/styles/zenit-ui.css\`, then your own.
3. Put \`class="z-root"\` on \`<html>\` and on \`<body>\`.
4. Self-host the fonts: \`material-icons/iconfont/filled.css\` with \`layer(schriften)\`, plus
   Inter 400/500/600, Space Grotesk 600/700, JetBrains Mono 400/600.
5. Put \`<z-toast-outlet />\` once into the application shell.
6. \`provideZenitTheme({ defaultScheme: 'system' })\` and, for English, \`provideZenitLabels(Z_LABELS_EN)\`
   at the application root; \`zenitThemeInitScript()\` inline in \`<head>\` against the flash.

Components are standalone: import the class into \`imports\`. No \`NgModule\`, no \`forRoot\`.`;

const FORMULARE = `Three ways to bind a value; every control of the library supports all three.

| Way | Use it for | Binding |
| --- | --- | --- |
| Signal Forms | new forms, the default since Angular 22 | \`[formField]\` |
| Signal \`model()\` | a single control outside a form | \`[(checked)]\`, \`[(value)]\` |
| Reactive / template-driven | existing forms (interop) | \`[formControl]\`, \`[(ngModel)]\` |

| Control | Value | Element that takes the binding |
| --- | --- | --- |
| \`z-checkbox\` | \`boolean\` | the component |
| \`z-toggle\` | \`boolean\` | the component |
| \`z-slider\` | \`number\` | the component |
| \`z-segment\` | \`string\` | the component |
| \`z-combobox\` | \`string\` | the component |
| \`input[zInput]\`, \`textarea[zInput]\` | \`string\` | the native element, next to \`zInput\` |
| \`z-select\` | \`string\` | the native \`<select>\` inside, not \`z-select\` |

Signal Forms:

\`\`\`ts
import { Component, signal } from '@angular/core';
import { disabled, form, FormField, max, min, required, submit } from '@angular/forms/signals';
import { ZButton, ZCheckbox, ZField, ZInput, ZSegment, ZSelect, ZSlider, ZToggle } from 'zenit-ui';

@Component({
  imports: [FormField, ZButton, ZCheckbox, ZField, ZInput, ZSegment, ZSelect, ZSlider, ZToggle],
  templateUrl: './bestellung.html',
})
export class Bestellung {
  protected readonly modell = signal({ name: '', ramGb: 4, backups: false, agb: false });

  protected readonly formular = form(this.modell, (pfad) => {
    required(pfad.name, { message: 'Gib dem Server einen Namen.' });
    min(pfad.ramGb, 2);
    max(pfad.ramGb, 16);
    required(pfad.agb, { message: 'Bestätige die AGB, um fortzufahren.' });
  });

  /** First error of a field, once it was left or the form was submitted. */
  protected fehler(feld: { touched(): boolean; errors(): readonly { message?: string }[] }): string {
    return feld.touched() ? (feld.errors()[0]?.message ?? '') : '';
  }

  protected bestellen(): void {
    // submit() touches every field, so all errors show, and runs only when valid.
    void submit(this.formular, async () => this.sende(this.modell()));
  }
}
\`\`\`

\`\`\`html
<z-field label="Servername" for="name" [error]="fehler(formular.name())">
  <input zInput id="name" [formField]="formular.name" />
</z-field>

<z-field label="Standort" for="standort">
  <z-select>
    <select id="standort" [formField]="formular.standort">
      <option value="nbg">Nürnberg</option>
    </select>
  </z-select>
</z-field>

<z-slider label="Arbeitsspeicher" unit="GB" [step]="2" [formField]="formular.ramGb" />
<z-toggle [formField]="formular.backups" ariaLabel="Backup jede Nacht" />

<z-checkbox [formField]="formular.agb" ariaDescribedby="agb-fehler">
  Ich stimme den <a href="/agb">Bedingungen</a> zu
</z-checkbox>
@if (fehler(formular.agb()); as satz) {
  <span class="z-field__error" id="agb-fehler" role="alert">{{ satz }}</span>
}

<button zBtn="primary" type="button" (click)="bestellen()">Server erstellen</button>
\`\`\`

Rules that follow from how Angular wires the directive:

- **State comes from the schema, not the template.** Next to \`[formField]\` Angular rejects
  \`[disabled]\`, \`[required]\`, \`[min]\`, \`[max]\`, \`[invalid]\`, \`[touched]\`, \`[value]\` and
  \`[checked]\` at compile time (NG8022). The scale of a slider therefore lives in \`min()\` and
  \`max()\`; without those rules the slider keeps its defaults, 0 to 100.
- **The slider stays on its scale.** A model value outside \`min()\`/\`max()\` or between two steps is
  corrected to the value the track really shows, and that correction is written into the field.
- **\`aria-invalid\` waits for \`touched\`.** \`zInput\`, \`z-checkbox\`, \`z-toggle\` and \`z-slider\`
  write it only once the field is invalid *and* touched. \`submit()\` touches every field.
- **\`reset()\`** on a field or the form writes the value back and clears touched and dirty.
- \`[formField]\` belongs on the native \`<select>\` inside \`z-select\`, never on the host.
- **Errors**: \`z-field\` takes the sentence as \`error\` (a string), replaces the hint with it and
  points \`aria-describedby\` at it. \`z-checkbox\` and \`z-toggle\` bring their own label and do not
  sit in a \`z-field\`; their sentence is a \`<span class="z-field__error" id="…" role="alert">\`
  referenced through \`ariaDescribedby\`.
- In reactive forms nothing sets \`invalid\` for you: bind \`[invalid]\` yourself.
- Not supported on the custom controls: \`readonly()\`, \`hidden()\`, \`pending\`, \`name\`, \`errors\`,
  \`dirty\`, \`minLength\`, \`maxLength\`, \`pattern\`; and \`required()\` is not reflected on
  \`z-toggle\`, \`z-slider\` and \`z-segment\` (the rule still validates).`;

const THEMING = `\`tokens.css\` carries one scheme, \`dark\`. The opt-in stylesheet
\`zenit-ui/styles/themes.css\` adds \`light\` and \`contrast\` plus the accents \`blau\`, \`gruen\`
and \`violett\`. \`provideZenitTheme()\` switches between them and stores the choice; the service
\`ZTheme\` reads and sets it. A scheme is a block of token overrides on \`[data-theme="…"]\`, an
accent one on \`[data-accent="…"]\`; components never learn about either.

\`\`\`ts
// app.config.ts
providers: [provideZenitTheme({ defaultScheme: 'system' })];
\`\`\`

\`\`\`ts
// a switch of your own
private readonly theme = inject(ZTheme);
this.theme.scheme();          // 'system' | 'dark' | 'light' | 'contrast'
this.theme.resolvedScheme();  // what is actually applied, 'system' resolved
this.theme.accent();          // 'rot' | 'blau' | 'gruen' | 'violett'
this.theme.setScheme('light');   // false for an unknown id, nothing changes
this.theme.setAccent('blau');
this.theme.reset();              // back to the defaults, storage cleared
\`\`\`

**No flash of the wrong theme.** \`provideZenitTheme\` applies the stored choice several frames
after the first paint. Put the output of \`zenitThemeInitScript()\` as an inline \`<script>\` in the
\`<head>\` of \`index.html\`, before the stylesheets: it reads the same storage key and writes
\`data-theme\` and \`data-accent\` onto \`<html>\` before the first paint. It needs
\`"inlineCritical": false\` in the production build options, because the critical-CSS inliner would
otherwise move the styles after the script. On the server a \`defaultScheme\` other than
\`'system'\` is written onto \`<html>\` of the server document, so the delivered HTML already
carries it.`;

const SERVICES = `**\`ZDialog\`** (root service, \`inject(ZDialog)\`) wraps \`@angular/cdk/dialog\`. Focus trap,
Escape, backdrop and focus return come from the CDK. Focus lands on the first tabbable element
when the dialog opens and returns to the trigger when it closes; pass \`restoreFocusTo\` when the
trigger is gone by then (opened from a menu: pass the menu trigger). The dialog's own component
has \`<z-dialog title="…">\` as its root element and \`[zDialogActions]\` for its buttons.

\`\`\`ts
this.dialog
  .confirm({
    title: \`Server "\${name}" löschen?\`,
    body: 'Alle Welten und Backups gehen verloren. Das lässt sich nicht rückgängig machen.',
    confirmLabel: 'Löschen',
    cancelLabel: 'Abbrechen',
    danger: true,
    requireText: name,          // the button stays locked until this is typed exactly
    restoreFocusTo: this.trigger(),
  })
  .subscribe((bestaetigt) => { if (bestaetigt) { this.entferne(name); } });
\`\`\`

**\`ZToast\`** (root service) shows short feedback above the content. At most three at a time, the
newest at the bottom. \`show\`, \`info\`, \`success\`, \`warning\` and \`error\` all return the id for
\`dismiss\`. \`error\` defaults to \`duration: 0\` and is announced as \`role="alert"\`; the other
four are announced politely. \`<z-toast-outlet />\` has to stand once in the shell.

\`\`\`ts
this.toast.success('Eigenschaften gespeichert');
this.toast.warning('Backup läuft noch', { title: 'Noch nicht fertig' });
this.toast.show('Server neu gestartet', { status: 'warning', title: 'Achtung', icon: 'warning' });
const id = this.toast.error('Neustart fehlgeschlagen', { actionLabel: 'Erneut', action: () => this.starte() });
this.toast.dismiss(id);
\`\`\`

**Menu** is markup, not a service: a trigger with \`[cdkMenuTriggerFor]\` from
\`@angular/cdk/menu\` and a \`<ng-template>\` holding \`<z-menu>\` with \`button[zMenuItem]\`
entries.

\`\`\`html
<button zBtn="ghost" iconOnly aria-label="Mehr" [cdkMenuTriggerFor]="mehr">
  <z-icon name="more_vert" />
</button>
<ng-template #mehr>
  <z-menu>
    <button zMenuItem icon="content_copy" (triggered)="kopiere()">Adresse kopieren</button>
    <z-menu-separator />
    <button zMenuItem icon="delete" danger (triggered)="loesche()">Server löschen</button>
  </z-menu>
</ng-template>
\`\`\``;

const LABELS = `The library holds no product copy. Its only texts are accessible names and the one visible
sentence a component cannot leave empty. They live in one registry.

| Symbol | What it is |
| --- | --- |
| \`ZLabels\` | The interface, one key per default text. |
| \`Z_LABELS_DE\` | The German defaults, used when nothing is provided. |
| \`Z_LABELS_EN\` | The English equivalents, complete. |
| \`Z_LABELS\` | The injection token that holds the registry. |
| \`provideZenitLabels(partial)\` | Merges an override over the enclosing injector's labels, or over \`Z_LABELS_DE\` at the root. |
| \`injectZLabels()\` | Reads the registry, complete. Use it in your own components. |

**For an English application**, once at bootstrap:

\`\`\`ts
import { provideZenitLabels, Z_LABELS_EN } from 'zenit-ui';

bootstrapApplication(App, { providers: [provideZenitLabels(Z_LABELS_EN)] });
\`\`\`

A partial override keeps the rest: \`provideZenitLabels({ tableRegion: 'Invoices, scrollable' })\`.
It returns \`EnvironmentProviders\`, so it also works in the \`providers\` of a route, where it
merges over the labels of the enclosing injector, not over German. For one subtree provide the
token directly: \`{ provide: Z_LABELS, useValue: { ...Z_LABELS_EN, headerMenu: 'Menu' } }\`.

Every input that used to carry a German default still wins over the registry: \`ariaLabel\`,
\`ariaLabelPrev\`, \`ariaLabelNext\`, \`rangeLabel\` and \`pageSizeLabel\` on \`z-pagination\`,
\`logLabel\`, \`inputLabel\` and \`endLabel\` on \`z-console\`, \`menuLabel\` on \`z-app-header\`,
\`closeLabel\` on \`z-toast-outlet\`, \`ariaLabel\` on \`z-table-container\`, \`editLabel\` on
\`z-wizard-step\`, \`emptyText\` on \`z-combobox\` and \`retryLabel\` on \`z-price-summary\`.
\`z-cost-chart\` has no such input; everything it says visibly is a registry key.`;

/* ----------------------------------------------------------------- rendering */

function mitgliedTabelle(mitglieder, kind) {
  const zeilen = mitglieder.filter((m) => m.kind === kind);
  if (!zeilen.length) {
    return '';
  }
  if (kind === 'output') {
    return [
      '',
      '| Output | Payload | Fires when |',
      '| --- | --- | --- |',
      ...zeilen.map((m) => `| \`(${m.name})\` | \`${zelle(m.typ)}\` | ${m.beschreibung || '—'} |`),
    ].join('\n');
  }
  const titel =
    kind === 'model'
      ? 'Two-way model (use `[(name)]`, or bind `[name]` and `(nameChange)`)'
      : 'Inputs';
  return [
    '',
    `${titel}:`,
    '',
    '| Name | Type | Default | Description |',
    '| --- | --- | --- | --- |',
    ...zeilen.map((m) => {
      const zusatz = m.transform
        ? ` — \`${m.transform}\`, so the bare attribute \`${m.name}\` counts as ${m.transform === 'booleanAttribute' ? '`true`' : 'that value'}`
        : m.akzeptiert
          ? ` — also accepts \`${zelle(m.akzeptiert)}\``
          : '';
      return `| \`${m.name}\` | \`${zelle(m.typ)}\`${zusatz} | \`${m.standard}\` | ${m.beschreibung || '—'} |`;
    }),
  ].join('\n');
}

function bausteinAbschnitt(e, leitfaden, beispielBesitzer) {
  const aus = [];
  const kopf = e.selektor ? `\`${e.selektor}\`` : e.art;
  aus.push(`### ${e.name} — ${kopf}`, '');
  aus.push(`Import: \`import { ${e.name} } from 'zenit-ui';\``);
  if (e.zweck) {
    aus.push('', e.zweck);
  }
  if (e.notizen) {
    aus.push('', e.notizen);
  }

  aus.push(mitgliedTabelle(e.mitglieder ?? [], 'input'));
  aus.push(mitgliedTabelle(e.mitglieder ?? [], 'model'));
  aus.push(mitgliedTabelle(e.mitglieder ?? [], 'output'));

  for (const host of e.hosts ?? []) {
    const teile = [];
    if (host.inputs.length) {
      teile.push(`inputs ${host.inputs.map((i) => `\`${i}\``).join(', ')}`);
    }
    if (host.outputs.length) {
      teile.push(`outputs ${host.outputs.map((o) => `\`(${o})\``).join(', ')}`);
    }
    aus.push(
      '',
      `Host directive \`${host.name}\`${teile.length ? `, which adds ${teile.join(' and ')}` : ''}.`,
    );
  }
  if (e.slots?.length) {
    aus.push('', `Content slots: ${e.slots.map((s) => `\`${s}\``).join(', ')}.`);
  }
  if (e.cva) {
    aus.push(
      '',
      'Forms: implements `ControlValueAccessor`, so `[formControl]`, `[(ngModel)]` and `[formField]` all work. See "Forms".',
    );
  }
  if (e.methoden?.length) {
    aus.push('', 'Members:', '');
    for (const m of e.methoden) {
      aus.push(
        `- \`${m.signatur}\` — ${m.beschreibung}${m.rueckgabe ? ` Returns: ${m.rueckgabe}` : ''}`,
      );
    }
  }
  if (e.felder?.length) {
    aus.push('', '| Field | Type | Description |', '| --- | --- | --- |');
    for (const f of e.felder) {
      aus.push(`| \`${f.name}\` | \`${f.typ}\` | ${f.beschreibung || '—'} |`);
    }
  }
  if (e.signatur && ['type', 'const', 'token', 'function', 'provider'].includes(e.art)) {
    aus.push(
      '',
      `\`\`\`ts\n${e.art === 'type' ? `type ${e.name} = ${e.signatur}` : e.art === 'token' ? `const ${e.name}: InjectionToken<${e.signatur}>` : e.signatur}\n\`\`\``,
    );
  }

  const beispiel = leitfaden?.beispiel ?? null;
  if (beispiel && beispielBesitzer === e.name) {
    aus.push('', 'Example:', '', '```html', beispiel, '```');
  } else if (beispiel) {
    aus.push('', `Example: see ${beispielBesitzer}.`);
  } else if (e.beispiel) {
    aus.push('', 'Example:', '', `\`\`\`${e.beispiel.sprache}`, e.beispiel.code, '```');
  }
  if (leitfaden?.nicht.length && beispielBesitzer === e.name) {
    aus.push('', 'Do not:', '');
    for (const n of leitfaden.nicht) {
      aus.push(`- ${n}`);
    }
  }
  // The trailing newline keeps a blank line between two sections when the
  // caller joins them.
  return `${aus.join('\n')}\n`;
}

function baueDateien() {
  const eintraege = sammle();
  const leitfaeden = leseLeitfaeden();
  const tokens = leseTokens();
  const klassen = leseKlassen();
  const migration = leseMigration();

  // Guide per class, plus the class a guide prints its example under.
  const leitfadenVon = new Map();
  const besitzerVon = new Map();
  const bekannt = new Set(eintraege.map((e) => e.name));
  for (const l of leitfaeden) {
    const besitzer = l.klassen.find((k) => bekannt.has(k));
    for (const k of l.klassen) {
      leitfadenVon.set(k, l);
      besitzerVon.set(k, besitzer);
    }
  }

  const bausteine = eintraege.filter((e) => ['component', 'directive'].includes(e.art));
  const dienste = eintraege.filter((e) =>
    ['service', 'provider', 'token', 'function'].includes(e.art),
  );
  const typen = eintraege.filter((e) => ['interface', 'type', 'const', 'class'].includes(e.art));

  /* ------------------------------------------------------------- llms.txt */

  const kurz = [
    '# zenit-ui',
    '',
    `> Angular ${VERSION} component library of the Zenit design system: ${bausteine.length} standalone`,
    '> components and directives, dark by default, token-driven, `@angular/cdk` for overlays and no',
    '> Angular Material anywhere. This file is the index; `llms-full.txt` next to it is the complete',
    '> reference and needs no other file.',
    '',
    '## What it is',
    '',
    'Standalone components and directives with `OnPush` and signal inputs, for a game server hoster:',
    'public website, customer area, server panels. They ship no styles of their own — every class',
    'lives in the bundled CSS and uses only the tokens of `tokens.css`. Form fields are native',
    'elements with library classes; overlays, focus traps and menus come from `@angular/cdk`.',
    'Business logic, routes and copy stay in your application.',
    '',
    '## Hard rules',
    '',
    REGELN_KURZ,
    '',
    '## Setup in 6 steps',
    '',
    SETUP_KURZ,
    '',
    '## Components and directives',
    '',
    'Selector, import name, purpose.',
    '',
    ...bausteine.map((e) => `- \`${e.selektor}\` ${e.name} — ${kuerze(e.zweck)}`),
    '',
    '## Services, providers and tokens',
    '',
    ...dienste.map((e) => `- \`${e.name}\` (${e.art}) — ${kuerze(e.zweck)}`),
    '',
    '## Exported types',
    '',
    typen.map((e) => `\`${e.name}\``).join(', ') + '.',
    '',
    '## Full reference',
    '',
    '- `llms-full.txt` — every input with type and default, every output, slot, example and',
    '  "do not", plus forms, theming, labels, services, the mat-* migration table and all tokens.',
    '- `styles/tokens.css` — the token values themselves.',
    '',
  ].join('\n');

  /* -------------------------------------------------------- llms-full.txt */

  const voll = [
    '# zenit-ui — complete reference',
    '',
    `> Version ${VERSION}. Everything needed to use this library correctly, with no other file and`,
    '> no access to its sources. Generated from the sources; do not edit by hand.',
    '',
    '## Contents',
    '',
    '1. What it is',
    '2. Hard rules',
    '3. Setup',
    '4. Components and directives',
    '5. Services, providers and tokens',
    '6. Exported types',
    '7. Forms',
    '8. Theming',
    '9. Labels and languages',
    '10. CSS classes you may set',
    '11. Coming from Angular Material',
    '12. Design tokens',
    '',
    '## 1. What it is',
    '',
    `\`zenit-ui\` is the Angular component library of the Zenit design system: ${bausteine.length}`,
    'standalone components and directives plus services for dialog, toast, theme and labels, for a',
    'game server hoster — a public website, a customer area under `/user` and server panels. The',
    'look is technical, quiet and dense: dark by default, one accent colour that means "you can act',
    'here", no gradients, no glow, no motion beyond colour transitions.',
    '',
    'Peer dependencies: `@angular/core`, `@angular/common`, `@angular/forms`, `@angular/cdk` (all',
    '22) and `rxjs` 7.8. Its own only dependency is `tslib`.',
    '',
    'Every block is standalone: import the class into the `imports` array of your component. There',
    'is no `NgModule` and no `forRoot`.',
    '',
    '## 2. Hard rules',
    '',
    REGELN,
    '',
    '## 3. Setup',
    '',
    SETUP,
    '',
    '## 4. Components and directives',
    '',
    'Every input is a signal. `[(name)]` works where a member is listed as a two-way model. A',
    'boolean input marked `booleanAttribute` may be written as a bare attribute (`disabled`),',
    'which counts as `true`.',
    '',
    ...bausteine.map((e) =>
      bausteinAbschnitt(e, leitfadenVon.get(e.name), besitzerVon.get(e.name) ?? e.name),
    ),
    '',
    '## 5. Services, providers and tokens',
    '',
    SERVICES,
    '',
    ...dienste.map((e) =>
      bausteinAbschnitt(e, leitfadenVon.get(e.name), besitzerVon.get(e.name) ?? e.name),
    ),
    '',
    '## 6. Exported types',
    '',
    ...typen.map((e) =>
      bausteinAbschnitt(e, leitfadenVon.get(e.name), besitzerVon.get(e.name) ?? e.name),
    ),
    '',
    '## 7. Forms',
    '',
    FORMULARE,
    '',
    '## 8. Theming',
    '',
    THEMING,
    '',
    '## 9. Labels and languages',
    '',
    LABELS,
    '',
    '## 10. CSS classes you may set',
    '',
    'These are the classes a page sets by hand. Everything else is rendered by a component and is',
    'not part of the contract.',
    '',
    '| Class | What it does |',
    '| --- | --- |',
    ...klassen.map(([name, text]) => `| \`${name}\` | ${text} |`),
    '',
    'Text styles, one class each, from `tokens.css`:',
    '',
    tokens.stile.map((s) => `\`${s}\``).join(', ') + '.',
    '',
    '`display-*` and `heading-*` are Space Grotesk and belong to headings only; `body*`, `title-sm`',
    'and `caption` are Inter; `mono*` is JetBrains Mono with `tabular-nums` and belongs to prices,',
    'figures, IP addresses, ports, file names and log lines. Nothing is smaller than 12px.',
    '',
    '## 11. Coming from Angular Material',
    '',
    '| Angular Material | zenit-ui |',
    '| --- | --- |',
    ...migration.map((m) => `| ${m.von} | ${m.nach} |`),
    '',
    'Behaviour that differs and has to be handled, not just renamed: the native `<select>` has no',
    'overlay and no multi-select; `z-field` takes one `error` string instead of `mat-error`',
    'children; `ZDialog.confirm()` returns `Observable<boolean>` and emits exactly once;',
    '`ZToast` has no `openFromComponent`; `z-pagination` is 1-based and two-way bound, not',
    '0-based with an event; `z-toggle` has no `change` output, bind `[(checked)]` or a form;',
    'tabs are links first and a tab list second; `zTooltip` takes the text as its value and has no',
    'options; `z-icon` takes the ligature as `name`, not as content.',
    '',
    '## 12. Design tokens',
    '',
    'Every value the system has. Use them as `var(--name)`; write no literal of your own.',
    '`themes.css` overrides the colour block per scheme (`[data-theme="light"]`,',
    '`[data-theme="contrast"]`) and per accent (`[data-accent="blau"]` and so on); the other',
    'groups are the same in every scheme.',
    '',
    ...tokens.gruppen.flatMap(([name, werte]) => [
      `**${name}**`,
      '',
      '```css',
      ...werte.map((w) => `  ${w};`),
      '```',
      '',
    ]),
  ].join('\n');

  return { kurz: normalisiere(kurz), voll: normalisiere(voll), eintraege, bausteine };
}

function kuerze(text) {
  const satz = text.split(/(?<=\.)\s/)[0] ?? text;
  if (satz.length <= 58) {
    return satz;
  }
  // Cut at the last colon, comma or word boundary before the limit, so the
  // line still ends on something readable.
  const kurz = satz.slice(0, 57);
  const schnitt = Math.max(kurz.lastIndexOf(': '), kurz.lastIndexOf(', '), kurz.lastIndexOf(' '));
  let rumpf = kurz.slice(0, schnitt > 32 ? schnitt : 57).replace(/[,:]$/, '');
  // An odd number of backticks would leave a code span open.
  if ((rumpf.match(/`/g)?.length ?? 0) % 2) {
    rumpf = rumpf.slice(0, rumpf.lastIndexOf('`')).trimEnd().replace(/[,:]$/, '');
  }
  return `${rumpf}…`;
}

/** No trailing spaces, at most one blank line in a row, one final newline. */
function normalisiere(text) {
  return `${text
    .split('\n')
    .map((z) => z.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()}\n`;
}

/* -------------------------------------------------------------- self-check */

/**
 * Asserts that nothing exported is missing from the output: every component,
 * directive, service and provider function in `llms-full.txt`, every input,
 * model and output with its default, every selector in `llms.txt`.
 */
function pruefe({ kurz, voll, eintraege, bausteine }) {
  const fehler = [];
  let mitglieder = 0;

  for (const e of eintraege) {
    const muss = ['component', 'directive', 'service', 'provider'].includes(e.art);
    if (muss && !voll.includes(`### ${e.name} —`)) {
      fehler.push(`llms-full.txt has no section for ${e.art} ${e.name}`);
    }
    for (const m of e.mitglieder ?? []) {
      mitglieder++;
      const zelle = m.kind === 'output' ? `| \`(${m.name})\` |` : `| \`${m.name}\` |`;
      if (!voll.includes(zelle)) {
        fehler.push(`llms-full.txt is missing ${e.name}.${m.name}`);
        continue;
      }
      if (m.kind !== 'output' && !voll.includes(`\`${m.standard}\` |`)) {
        fehler.push(`llms-full.txt is missing the default of ${e.name}.${m.name} (${m.standard})`);
      }
    }
    for (const m of e.methoden ?? []) {
      if (!voll.includes(`\`${m.signatur}\``)) {
        fehler.push(`llms-full.txt is missing ${e.name}.${m.signatur}`);
      }
    }
  }

  const selektoren = new Set();
  for (const e of bausteine) {
    for (const teil of e.selektor.split(',').map((t) => t.trim())) {
      selektoren.add(teil);
      if (!kurz.includes(teil)) {
        fehler.push(`llms.txt is missing the selector ${teil}`);
      }
    }
  }
  return { fehler, mitglieder, selektoren: selektoren.size };
}

/* -------------------------------------------------------------------- main */

const nurPruefen = process.argv.includes('--check');
const ergebnis = baueDateien();
const { fehler, mitglieder, selektoren } = pruefe(ergebnis);

const kb = (t) => `${(Buffer.byteLength(t, 'utf8') / 1024).toFixed(1)} kB`;

if (!nurPruefen) {
  mkdirSync(ZIEL, { recursive: true });
  writeFileSync(join(ZIEL, 'llms.txt'), ergebnis.kurz, 'utf8');
  writeFileSync(join(ZIEL, 'llms-full.txt'), ergebnis.voll, 'utf8');
}

const zaehlung = {
  components: ergebnis.bausteine.filter((e) => e.art === 'component').length,
  directives: ergebnis.bausteine.filter((e) => e.art === 'directive').length,
  services: ergebnis.eintraege.filter((e) => e.art === 'service').length,
  providers: ergebnis.eintraege.filter((e) => e.art === 'provider').length,
  tokens: ergebnis.eintraege.filter((e) => e.art === 'token').length,
  types: ergebnis.eintraege.filter((e) => ['interface', 'type', 'const', 'class'].includes(e.art))
    .length,
};

console.log(
  `${nurPruefen ? 'check' : 'generate'}: ${zaehlung.components} components, ` +
    `${zaehlung.directives} directives, ${zaehlung.services} services, ` +
    `${zaehlung.providers} provider functions, ${zaehlung.tokens} injection tokens, ` +
    `${zaehlung.types} types; ${selektoren} selectors, ${mitglieder} inputs/models/outputs.`,
);
console.log(`llms.txt ${kb(ergebnis.kurz)}, llms-full.txt ${kb(ergebnis.voll)}`);

if (Buffer.byteLength(ergebnis.kurz, 'utf8') > 8 * 1024) {
  console.warn(`warning: llms.txt is over 8 kB (${kb(ergebnis.kurz)})`);
}

if (fehler.length) {
  console.error(`\n${fehler.length} gap(s):`);
  for (const f of fehler) {
    console.error(`  ${f}`);
  }
  process.exit(1);
}
console.log('OK: every export, member and selector is covered.');
