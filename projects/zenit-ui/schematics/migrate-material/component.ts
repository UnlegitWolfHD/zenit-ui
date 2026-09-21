/**
 * The TypeScript half of `migrate-material`: finds the `@Component` classes of a
 * file with their template, and plans the edits to `imports: [...]` and to the
 * ES imports. No type information is used, a symbol is recognised by its name.
 */
import { getDecoratorMetadata } from '@schematics/angular/utility/ast-utils';
import { getEOL } from '@schematics/angular/utility/eol';
import ts from 'typescript';
import { Edit } from '../ng-add/html';
import { MATERIAL_SYMBOLS } from './tables';
import { Finding } from './template';

export interface InlineTemplate {
  /** Offsets of the text between the quotes. */
  start: number;
  end: number;
  delimiter: '`' | '"' | "'";
}

export interface ComponentInfo {
  name: string;
  /** Offset of the decorator's object literal, where findings about the component point. */
  offset: number;
  metadata: ts.ObjectLiteralExpression;
  templateUrl?: string;
  inline?: InlineTemplate;
  /** Why an inline template cannot be edited. */
  inlineProblem?: string;
}

export function findComponents(source: ts.SourceFile): ComponentInfo[] {
  return getDecoratorMetadata(source, 'Component', '@angular/core')
    .filter(ts.isObjectLiteralExpression)
    .map((metadata) => {
      // object literal -> call -> decorator -> class
      const owner = metadata.parent?.parent?.parent;
      const info: ComponentInfo = {
        name: owner && ts.isClassDeclaration(owner) && owner.name ? owner.name.text : '(anonymous)',
        offset: metadata.getStart(),
        metadata,
      };

      const templateUrl = property(metadata, 'templateUrl');
      const template = property(metadata, 'template');
      if (templateUrl && ts.isStringLiteralLike(templateUrl)) {
        info.templateUrl = templateUrl.text;
      } else if (template) {
        const raw = template.getText();
        if (!ts.isStringLiteralLike(template)) {
          info.inlineProblem =
            'The inline template is not a plain string or a template literal without ${...}.';
        } else if (raw.includes('\\')) {
          // An escape makes the text differ from what Angular parses, so spans would not line up.
          info.inlineProblem = 'The inline template contains escape sequences (backslash).';
        } else {
          info.inline = {
            start: template.getStart() + 1,
            end: template.getEnd() - 1,
            delimiter: raw[0] as InlineTemplate['delimiter'],
          };
        }
      }

      return info;
    });
}

function property(literal: ts.ObjectLiteralExpression, name: string): ts.Expression | undefined {
  const found = literal.properties.find(
    (node): node is ts.PropertyAssignment =>
      ts.isPropertyAssignment(node) &&
      (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)) &&
      node.name.text === name,
  );

  return found?.initializer;
}

/** What the template of a component looks like after the edits. */
export interface TemplateUsage {
  remaining: Record<string, number>;
  zenit: string[];
}

/**
 * Plans the edits of one file for all its components: Material symbols whose
 * selectors are gone leave `imports`, the zenit-ui symbols the template needs
 * are added, and the ES imports follow.
 */
export function planImports(
  source: ts.SourceFile,
  components: [ComponentInfo, TemplateUsage][],
): { edits: Edit[]; findings: Finding[]; changed: number } {
  const text = source.text;
  const eol = getEOL(text);
  const edits: Edit[] = [];
  const findings: Finding[] = [];
  const removed = new Set<ts.Node>();
  const added = new Set<string>();
  let changed = 0;

  for (const [component, usage] of components) {
    const unused = Object.keys(MATERIAL_SYMBOLS).filter(
      (symbol) => !Object.keys(usage.remaining).some((name) => MATERIAL_SYMBOLS[symbol].test(name)),
    );
    const manual = (code: string, reason: string) => {
      if (usage.zenit.length === 0) {
        return; // nothing of zenit-ui in the template, so nothing to tell
      }
      const wanted = usage.zenit.length ? `add ${usage.zenit.join(', ')} from 'zenit-ui'` : '';
      findings.push({
        offset: component.offset,
        rule: 'imports',
        kind: 'manual',
        code,
        reason: `${component.name}: ${reason} The file was not changed.`,
        fix:
          [wanted, 'remove the Material modules whose selectors are gone from the template']
            .filter(Boolean)
            .join('; ') + '.',
      });
    };

    const standalone = property(component.metadata, 'standalone');
    if (standalone?.kind === ts.SyntaxKind.FalseKeyword) {
      manual(
        'imports-ngmodule',
        'the component is declared in an NgModule (standalone: false), so its imports live in that module.',
      );
      continue;
    }

    const imports = property(component.metadata, 'imports');
    const list = imports && ts.isArrayLiteralExpression(imports) ? imports.elements : undefined;
    if (imports && (!list || list.some((element) => !ts.isIdentifier(element)))) {
      manual(
        'imports-not-literal',
        `"imports" is not a plain array of identifiers (${imports.getText().replace(/\s+/g, ' ').slice(0, 60)}), a shared array is not followed.`,
      );
      continue;
    }

    const names = new Set((list ?? []).map((element) => element.getText()));
    const drop = (list ?? []).filter((element) => unused.includes(element.getText()));
    const add = usage.zenit.filter((symbol) => !names.has(symbol));
    if (drop.length === 0 && add.length === 0) {
      continue;
    }

    changed += 1;
    drop.forEach((element) => removed.add(element));
    add.forEach((symbol) => added.add(symbol));
    if (!list) {
      // No `imports` yet: a new first property, like `ng add` writes it.
      const at = component.metadata.getStart() + 1;
      edits.push({ start: at, end: at, text: `${eol}  imports: [${add.join(', ')}],` });
      continue;
    }
    edits.push(...listEdits(text, list, drop, add, eol));
  }

  if (removed.size === 0 && added.size === 0) {
    return { edits, findings, changed };
  }

  // ES imports: a Material symbol goes when nothing in the file names it any more.
  const declarations = source.statements.filter(ts.isImportDeclaration);
  // Every remaining mention keeps the ES import; one outside an "imports" array is worth a look.
  const references = new Map<string, number>();
  const outside = new Map<string, number>();
  const count = (node: ts.Node): void => {
    if (ts.isIdentifier(node) && !removed.has(node) && !ts.isImportSpecifier(node.parent)) {
      references.set(node.text, (references.get(node.text) ?? 0) + 1);
      const array = node.parent;
      const owner = ts.isArrayLiteralExpression(array) ? array.parent : undefined;
      if (!(owner && ts.isPropertyAssignment(owner) && owner.name.getText() === 'imports')) {
        outside.set(node.text, outside.get(node.text) ?? node.getStart());
      }
    }
    ts.forEachChild(node, count);
  };
  count(source);

  const gone = new Set([...removed].map((node) => node.getText()));
  const deleted = new Set<ts.ImportDeclaration>();
  for (const declaration of declarations) {
    const bindings = declaration.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) {
      continue;
    }
    const drop = bindings.elements.filter(
      (specifier) => gone.has(specifier.name.text) && !references.get(specifier.name.text),
    );
    if (drop.length === bindings.elements.length && !declaration.importClause?.name) {
      deleted.add(declaration);
      const end = declaration.getEnd();
      const lineEnd = text.startsWith(eol, end) ? end + eol.length : end;
      edits.push({ start: declaration.getStart(), end: lineEnd, text: '' });
    } else if (drop.length > 0) {
      edits.push(...listEdits(text, bindings.elements, drop, [], eol));
    }
  }
  for (const name of [...gone].sort()) {
    const at = outside.get(name);
    if (at !== undefined) {
      findings.push({
        offset: at,
        rule: 'imports',
        kind: 'review',
        code: 'imports-still-referenced',
        reason: `${name} left "imports" but is still named elsewhere in the file (a query, an injection or a type).`,
        fix: `Check what reads ${name}: its selector is gone from the template, so a query finds nothing.`,
      });
    }
  }

  const wanted = [...added].sort();
  if (wanted.length > 0) {
    const zenit = declarations.find(
      (declaration) =>
        ts.isStringLiteral(declaration.moduleSpecifier) &&
        declaration.moduleSpecifier.text === 'zenit-ui',
    );
    const bindings = zenit?.importClause?.namedBindings;
    if (zenit && !(bindings && ts.isNamedImports(bindings) && !zenit.importClause?.isTypeOnly)) {
      findings.push({
        offset: zenit.getStart(),
        rule: 'imports',
        kind: 'manual',
        code: 'imports-namespace',
        reason:
          '"zenit-ui" is not imported through a plain named import, so the new symbols were not added to it.',
        fix: `Import ${wanted.join(', ')} from 'zenit-ui' by hand.`,
      });
    } else if (bindings && ts.isNamedImports(bindings)) {
      const present = new Set(bindings.elements.map((specifier) => specifier.name.text));
      edits.push(
        ...listEdits(
          text,
          bindings.elements,
          [],
          wanted.filter((symbol) => !present.has(symbol)),
          eol,
        ),
      );
    } else {
      // Behind the last import that stays: an offset inside a deleted line would collide with it.
      const last = declarations.filter((declaration) => !deleted.has(declaration)).at(-1);
      const quote = last?.moduleSpecifier.getText()[0] === '"' ? '"' : "'";
      const line = `import { ${wanted.join(', ')} } from ${quote}zenit-ui${quote};`;
      const at = last ? last.getEnd() : 0;
      edits.push({ start: at, end: at, text: last ? `${eol}${line}` : `${line}${eol}` });
    }
  }

  return { edits, findings, changed };
}

/**
 * Removes and appends entries of a comma-separated list (array elements, import
 * specifiers) and keeps its layout: one entry per line stays one entry per line,
 * a trailing comma stays.
 */
export function listEdits(
  text: string,
  list: ts.NodeArray<ts.Node>,
  drop: ts.Node[],
  add: string[],
  eol: string,
): Edit[] {
  const edits: Edit[] = [];
  const kept = list.filter((node) => !drop.includes(node));
  const lastKept = kept.at(-1);
  const last = list.at(-1);

  if (last && !lastKept && add.length === 0) {
    // Nothing stays: empty the brackets instead of leaving a blank line or a lone comma.
    return [{ start: list.pos, end: last.parent.getEnd() - 1, text: '' }];
  }

  list.forEach((node, index) => {
    // Entries behind the last kept one form the trailing run, removed in one piece below.
    if (drop.includes(node) && lastKept && node.getStart() < lastKept.getStart()) {
      // Up to the next entry, so the separator and the line break go with it.
      edits.push({ start: node.getStart(), end: list[index + 1].getStart(), text: '' });
    }
  });
  if (last && last !== lastKept) {
    const start = lastKept ? lastKept.getEnd() : list[0].getStart();
    edits.push({ start, end: last.getEnd(), text: '' });
  }

  if (add.length > 0) {
    const first = list.at(0);
    const multiline = first !== undefined && /[\r\n]/.test(text.slice(list.pos, first.getStart()));
    const indent = first
      ? text.slice(text.lastIndexOf('\n', first.getStart()) + 1, first.getStart())
      : '';
    const separator = multiline && /^\s*$/.test(indent) ? `,${eol}${indent}` : ', ';
    const at = lastKept ? lastKept.getEnd() : (first?.getStart() ?? list.pos);
    edits.push({
      start: at,
      end: at,
      text: (lastKept ? separator : '') + add.join(separator),
    });
  }

  return edits;
}
