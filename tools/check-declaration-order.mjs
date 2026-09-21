#!/usr/bin/env node
/**
 * Source scan for the class of bug that `check-bundle-load.mjs` catches in the
 * built bundle, with file and line instead of a ReferenceError.
 *
 *   node tools/check-declaration-order.mjs
 *
 * 1. Per file: references that are evaluated while the module loads (decorator
 *    metadata, the predicate of a signal query, `extends`, static fields,
 *    top-level initialisers) to a class, const, let or enum that the same file
 *    declares further down. Without the AOT linker those hit the temporal dead
 *    zone. Function bodies are skipped, so `forwardRef(() => X)` and factories
 *    pass, and so are types.
 * 2. Across files: cycles of value imports, where the same reference would be
 *    `undefined` or in its dead zone depending on which file loads first.
 *
 * Uses the TypeScript the workspace has anyway. Exit code 1 on any finding.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const QUELLE = join(WURZEL, 'projects/zenit-ui/src');
const ABFRAGEN = new Set(['contentChild', 'contentChildren', 'viewChild', 'viewChildren']);

const dateien = readdirSync(QUELLE, { recursive: true })
  .map((d) => join(QUELLE, d))
  .filter((d) => d.endsWith('.ts') && !d.endsWith('.spec.ts') && !d.endsWith('.d.ts'));
const kurz = (d) => relative(WURZEL, d).replaceAll('\\', '/');

const funde = [];
const importe = new Map();

for (const datei of dateien) {
  const sf = ts.createSourceFile(datei, readFileSync(datei, 'utf8'), ts.ScriptTarget.Latest, true);
  const zeile = (n) => sf.getLineAndCharacterOfPosition(n.getStart()).line + 1;

  // Lexical top-level declarations: these have a dead zone, functions do not.
  const spaeter = new Map();
  for (const st of sf.statements) {
    if ((ts.isClassDeclaration(st) || ts.isEnumDeclaration(st)) && st.name) {
      spaeter.set(st.name.text, st);
    } else if (ts.isVariableStatement(st)) {
      for (const d of st.declarationList.declarations) {
        if (ts.isIdentifier(d.name)) {
          spaeter.set(d.name.text, st);
        }
      }
    }
  }

  /** Reports identifiers under `n` that name a declaration after `st`. */
  const pruefe = (n, st, muster) => {
    if (!n || ts.isTypeNode(n) || ts.isFunctionLike(n)) {
      return;
    }
    if (ts.isIdentifier(n)) {
      const p = n.parent;
      const nurName =
        (ts.isPropertyAccessExpression(p) && p.name === n) ||
        (ts.isPropertyAssignment(p) && p.name === n) ||
        (ts.isVariableDeclaration(p) && p.name === n);
      const ziel = spaeter.get(n.text);
      if (!nurName && ziel && ziel !== st && ziel.pos > st.pos) {
        funde.push(
          `${kurz(datei)}:${zeile(n)}  ${muster}: ${n.text} is declared in line ${zeile(ziel)}`,
        );
      }
      return;
    }
    ts.forEachChild(n, (k) => pruefe(k, st, muster));
  };

  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st) || ts.isExportDeclaration(st)) {
      const nurTyp =
        st.importClause?.isTypeOnly ||
        st.isTypeOnly ||
        (st.importClause?.namedBindings &&
          ts.isNamedImports(st.importClause.namedBindings) &&
          !st.importClause.name &&
          st.importClause.namedBindings.elements.every((e) => e.isTypeOnly));
      const pfad = st.moduleSpecifier?.text;
      if (!nurTyp && pfad?.startsWith('.')) {
        const basis = resolve(dirname(datei), pfad);
        const ziel = [`${basis}.ts`, join(basis, 'index.ts')].find((z) => dateien.includes(z));
        if (ziel) {
          importe.set(datei, [...(importe.get(datei) ?? []), ziel]);
        }
      }
    } else if (ts.isClassDeclaration(st)) {
      for (const dek of ts.getDecorators(st) ?? []) {
        pruefe(dek.expression, st, 'decorator metadata');
      }
      for (const erbe of st.heritageClauses ?? []) {
        if (erbe.token === ts.SyntaxKind.ExtendsKeyword) {
          erbe.types.forEach((t) => pruefe(t.expression, st, 'extends'));
        }
      }
      for (const glied of st.members) {
        for (const dek of ts.canHaveDecorators(glied) ? (ts.getDecorators(glied) ?? []) : []) {
          pruefe(dek.expression, st, 'member decorator');
        }
        if (!ts.isPropertyDeclaration(glied) || !glied.initializer) {
          continue;
        }
        if (glied.modifiers?.some((m) => m.kind === ts.SyntaxKind.StaticKeyword)) {
          pruefe(glied.initializer, st, 'static field');
          continue;
        }
        // An instance field runs at runtime, but the compiler lifts the
        // predicate of a signal query into the static definition.
        const ruf = glied.initializer;
        if (ts.isCallExpression(ruf)) {
          const fn = ts.isPropertyAccessExpression(ruf.expression)
            ? ruf.expression.expression
            : ruf.expression;
          if (ts.isIdentifier(fn) && ABFRAGEN.has(fn.text)) {
            pruefe(ruf.arguments[0], st, `${fn.text}() predicate`);
          }
        }
      }
    } else if (!ts.isInterfaceDeclaration(st) && !ts.isTypeAliasDeclaration(st)) {
      pruefe(st, st, 'top-level initialiser');
    }
  }
}

// Cycles of value imports, depth first. Each cycle is reported once.
const zyklen = new Set();
const zustand = new Map();
const besuche = (d, weg) => {
  zustand.set(d, 'offen');
  for (const ziel of importe.get(d) ?? []) {
    if (zustand.get(ziel) === 'offen') {
      const kreis = [...weg.slice(weg.indexOf(ziel)), ziel].map(kurz);
      zyklen.add(kreis.join(' -> '));
    } else if (!zustand.has(ziel)) {
      besuche(ziel, [...weg, ziel]);
    }
  }
  zustand.set(d, 'fertig');
};
for (const d of dateien) {
  if (!zustand.has(d)) {
    besuche(d, [d]);
  }
}

for (const f of funde) {
  console.error(f);
}
for (const z of zyklen) {
  console.error(`circular import: ${z}`);
}
const summe = funde.length + zyklen.size;
console.log(
  `check-declaration-order: ${dateien.length} files, ${funde.length} forward reference(s), ${zyklen.size} import cycle(s).`,
);
process.exit(summe > 0 ? 1 : 0);
