/**
 * `ng generate zenit-ui:migrate-material --path src/app/billing`.
 *
 * Rewrites the mechanical Angular Material usages below `--path` to zenit-ui
 * (`mat-icon`, the button attributes, `matTooltip`, `mat-spinner`, static
 * `mat-chip`, and the `imports` of the components) and reports everything it
 * left alone. See `docs/migrate-material.md`.
 *
 * - Templates are parsed with `@angular/compiler`, component files with
 *   TypeScript, each file once. Edits are made by source span against the
 *   original text and applied in one pass per file, so indentation, attribute
 *   order, quotes and line endings stay as they are.
 * - A conversion that is not safe is skipped and reported, the rest of the file
 *   is still converted. A template that does not parse is not touched at all.
 * - Only files below `--path` are written. Stylesheets are counted, never edited.
 * - A second run changes nothing.
 */
import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { readWorkspace } from '@schematics/angular/utility';
import ts from 'typescript';
import { Edit, applyEdits } from '../ng-add/html';
import { ComponentInfo, TemplateUsage, findComponents, planImports } from './component';
import { FileReport, buildReport, renderJson, renderMarkdown } from './report';
import { Schema } from './schema';
import { RULES, RuleName, STYLE_DEBT } from './tables';
import { Finding, TemplateResult, migrateTemplate, sortEdits } from './template';

// The schematics are compiled without @types/node.
declare const process: { argv: string[]; cwd(): string };
declare class TextDecoder {
  constructor(label: string, options: { fatal: boolean; ignoreBOM: boolean });
  decode(input: Uint8Array): string;
}

const SKIPPED_FOLDERS = /^(node_modules|dist|\..*)$/;
const STYLESHEET = /\.(css|scss|sass|less)$/;

export function migrateMaterial(options: Schema): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const rules = parseRules(options.rules);
    const scope = await resolveScope(tree, options);
    const dryRun = isDryRun(context);
    const run = new Run(tree, scope, new Set(rules), dryRun);

    const files = (scope.isFile ? [scope.path] : filesBelow(tree, scope.path)).filter(
      (file) => /\.(ts|html)$/.test(file) || STYLESHEET.test(file),
    );
    for (const path of files.filter((file) => file.endsWith('.ts') && !file.endsWith('.d.ts'))) {
      run.typescript(path);
    }
    for (const path of files.filter((file) => file.endsWith('.html'))) {
      run.orphanTemplate(path);
    }
    for (const path of files.filter((file) => STYLESHEET.test(file))) {
      run.stylesheet(path);
    }

    const report = buildReport(scope.path || '.', rules, dryRun, files.length, run.reports);
    const markdown = renderMarkdown(report);
    const target = normalize(options.report || 'zenit-migration-report.md');
    const twin = target.replace(/(\.md)?$/, '.json');
    // A run that changed nothing must not overwrite the report of the run that did:
    // that one holds the review items, which cannot be found again afterwards.
    const keep = report.totals.filesChanged === 0 && tree.exists(target);
    // In a dry run the CLI discards the tree, and lists what would have been written.
    if (!keep) {
      write(tree, target, markdown);
      write(tree, twin, renderJson(report));
    }

    const { totals, summary } = report;
    const count = (kind: 'manual' | 'review') =>
      Object.values(summary).reduce((sum, entry) => sum + entry[kind], 0);
    context.logger.info(
      `zenit-ui: ${totals.filesScanned} files scanned below ${report.path}, ` +
        `${totals.filesChanged} ${dryRun ? 'would change' : 'changed'}, ` +
        `${totals.converted} spots converted, ${count('manual')} left for manual migration, ` +
        `${count('review')} to review.\n` +
        (dryRun
          ? '  Dry run: nothing is written to disk, so the report follows here.'
          : keep
            ? `  Nothing changed, so the existing report ${target} was kept. Use --print-report or --report <other file> to see the current state.`
            : `  Report: ${target} and ${twin}`),
    );
    if (options.printReport ?? dryRun) {
      context.logger.info(markdown);
    }
  };
}

function parseRules(input: string | undefined): RuleName[] {
  const names = (input || RULES.join(','))
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
  const unknown = names.filter((name) => !(RULES as readonly string[]).includes(name));
  if (unknown.length > 0 || names.length === 0) {
    throw new SchematicsException(
      `Unknown rule(s) in --rules: ${unknown.join(', ') || '(none given)'}. Known rules: ${RULES.join(', ')}.`,
    );
  }

  return RULES.filter((rule) => names.includes(rule));
}

/**
 * ponytail: the dry-run flag is a CLI option that never reaches a schematic, so
 * this reads the private `_dryRun` of the workflow and falls back to the command
 * line. If a future devkit hides both, `--print-report` still prints the report.
 */
function isDryRun(context: SchematicContext): boolean {
  const workflow = context.engine.workflow as { _dryRun?: boolean } | null;

  return (
    workflow?._dryRun === true ||
    process.argv.some((argument) => /^(--dry-run|--dryRun|-d)(=true)?$/.test(argument))
  );
}

/** Workspace-relative, forward slashes, no leading or trailing slash; `''` is the workspace root. */
function normalize(input: string): string {
  let path = input.trim().replace(/\\/g, '/');
  const root = process.cwd().replace(/\\/g, '/').replace(/\/$/, '');
  // An absolute path, as a shell completes it: with a drive letter on Windows, or below the
  // working directory on Linux and macOS. A leading slash alone stays workspace-relative.
  const absolute = /^[a-zA-Z]:\//.test(path) || path === root || path.startsWith(`${root}/`);
  if (absolute) {
    if (
      !path.toLowerCase().startsWith(`${root.toLowerCase()}/`) &&
      path.toLowerCase() !== root.toLowerCase()
    ) {
      throw new SchematicsException(`"${input}" lies outside the workspace ${root}.`);
    }
    path = path.slice(root.length);
  }
  const parts: string[] = [];
  for (const part of path.split('/')) {
    if (part === '..') {
      if (parts.length === 0) {
        throw new SchematicsException(`"${input}" lies outside the workspace.`);
      }
      parts.pop();
    } else if (part !== '' && part !== '.') {
      parts.push(part);
    }
  }

  return parts.join('/');
}

interface Scope {
  path: string;
  isFile: boolean;
}

async function resolveScope(tree: Tree, options: Schema): Promise<Scope> {
  if (!options.path?.trim()) {
    throw new SchematicsException('--path is required: the folder or file to migrate.');
  }

  const candidates = [normalize(options.path)];
  let projectRoot: string | undefined;
  if (options.project) {
    const workspace = await readWorkspace(tree);
    const project = workspace.projects.get(options.project);
    if (!project) {
      throw new SchematicsException(
        `Project "${options.project}" was not found in the workspace. Known projects: ` +
          `${[...workspace.projects.keys()].join(', ') || '(none)'}.`,
      );
    }
    projectRoot = normalize(project.root);
    const sourceRoot = normalize(project.sourceRoot ?? `${project.root}/src`);
    candidates.push(normalize(`${sourceRoot}/${options.path}`));
  }

  for (const path of candidates) {
    const isFile = tree.exists(`/${path}`);
    if (!isFile) {
      // getDir() throws for a file, and an empty directory is what a missing one looks like.
      const directory = tree.getDir(`/${path}`);
      if (directory.subfiles.length === 0 && directory.subdirs.length === 0) {
        continue;
      }
    }
    if (path.split('/').some((part) => SKIPPED_FOLDERS.test(part))) {
      throw new SchematicsException(`"${path}" is not source code of the workspace.`);
    }
    if (projectRoot && path !== projectRoot && !path.startsWith(`${projectRoot}/`)) {
      // (a project at the workspace root has the root '' and contains everything)
      throw new SchematicsException(
        `"${path}" lies outside the project "${options.project}" (${projectRoot || '.'}).`,
      );
    }

    return { path, isFile };
  }

  throw new SchematicsException(
    `--path "${options.path}" was not found (looked for ${candidates.map((path) => `"${path}"`).join(' and ')}).`,
  );
}

/** All files below a folder, sorted, without `node_modules`, `dist` and dot folders. */
function filesBelow(tree: Tree, folder: string): string[] {
  const out: string[] = [];
  const walk = (path: string): void => {
    const directory = tree.getDir(`/${path}`);
    for (const file of directory.subfiles) {
      out.push(path ? `${path}/${file}` : file);
    }
    for (const sub of directory.subdirs) {
      if (!SKIPPED_FOLDERS.test(sub)) {
        walk(path ? `${path}/${sub}` : sub);
      }
    }
  };
  walk(folder);

  return out.sort();
}

function write(tree: Tree, path: string, content: string): void {
  if (tree.exists(path)) {
    tree.overwrite(path, content);
  } else {
    tree.create(path, content);
  }
}

/** One run over the scope. Every file is read, parsed and written at most once. */
class Run {
  readonly reports: FileReport[] = [];
  private readonly templates = new Map<string, TemplateResult>();

  constructor(
    private readonly tree: Tree,
    private readonly scope: Scope,
    private readonly rules: ReadonlySet<RuleName>,
    private readonly dryRun: boolean,
  ) {}

  private inScope(path: string): boolean {
    return this.scope.isFile
      ? path === this.scope.path
      : this.scope.path === '' || path.startsWith(`${this.scope.path}/`);
  }

  /** The text with its BOM, `undefined` for a file that is not valid UTF-8. */
  private read(path: string): string | undefined {
    const buffer = this.tree.read(`/${path}`);
    try {
      return buffer
        ? new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(buffer)
        : undefined;
    } catch {
      return undefined;
    }
  }

  /** Applies the edits of one file in one pass and files the report entry. */
  private finish(
    path: string,
    text: string,
    edits: Edit[],
    findings: Finding[],
    entry: Pick<FileReport, 'converted' | 'remaining'> & { unparsed?: boolean },
  ): void {
    let sorted = sortEdits(edits);
    if (sorted.some((edit, index) => index > 0 && edit.start < sorted[index - 1].end)) {
      // Cannot happen with the planners as they are; if it does, the file stays as it is.
      sorted = [];
      findings = [
        ...findings.filter((finding) => finding.kind === 'manual'),
        {
          offset: 0,
          rule: 'imports',
          kind: 'manual',
          code: 'unsafe-edit',
          reason: 'The planned edits of this file overlap, so none of them was applied.',
          fix: 'Migrate this file by hand.',
        },
      ];
      entry = { ...entry, converted: {} };
    }

    const output = applyEdits(text, sorted);
    if (output !== text) {
      this.tree.overwrite(`/${path}`, output);
    }

    // Lines refer to what is on disk after the run: the new text, or the old one in a dry run.
    const shown = this.dryRun ? text : output;
    const starts = lineStarts(shown);
    this.reports.push({
      path,
      status: entry.unparsed ? 'unparsed' : output !== text ? 'changed' : 'unchanged',
      converted: entry.converted,
      remaining: entry.remaining,
      findings: findings.map(({ offset, rule, kind, code, reason, fix }) => ({
        ...position(starts, this.dryRun ? offset : mapOffset(offset, sorted)),
        rule,
        kind,
        code,
        reason,
        fix,
      })),
    });
  }

  private unparsable(what: string, error: string, offset = 0): Finding {
    return {
      offset,
      rule: 'parse',
      kind: 'manual',
      code: 'template-unparsable',
      reason: `${what} does not parse (${error}), so nothing in it was touched.`,
      fix: 'Fix the template, then run the schematic again.',
    };
  }

  /** An external template: migrated once, whoever asks first. */
  private template(path: string): TemplateResult | undefined {
    if (this.templates.has(path)) {
      return this.templates.get(path);
    }
    const text = this.read(path);
    if (text === undefined) {
      return undefined;
    }

    const result = migrateTemplate(text, { rules: this.rules });
    this.templates.set(path, result);
    this.finish(
      path,
      text,
      result.edits,
      result.error ? [this.unparsable('The template', result.error)] : result.findings,
      { converted: result.converted, remaining: result.remaining, unparsed: !!result.error },
    );

    return result;
  }

  /** A template below `--path` that no component below `--path` names. */
  orphanTemplate(path: string): void {
    if (this.templates.has(path)) {
      return;
    }
    const result = this.template(path);
    if (result && !result.error && this.rules.has('imports') && result.zenit.length > 0) {
      this.reports.at(-1)?.findings.push({
        line: 1,
        column: 1,
        rule: 'imports',
        kind: 'manual',
        code: 'imports-owner-outside-path',
        reason:
          'No component below --path names this template in templateUrl, so no "imports" were updated for it.',
        fix: `In the component that owns this template: add ${result.zenit.join(', ')} from 'zenit-ui' and remove the Material modules whose selectors are gone.`,
      });
    }
  }

  typescript(path: string): void {
    const text = this.read(path);
    if (text === undefined) {
      return;
    }
    if (path.endsWith('.spec.ts')) {
      const named = [...new Set(text.match(/\bMat[A-Z]\w*(Module|Harness)\b/g) ?? [])].sort();
      if (named.length > 0 && this.rules.has('imports')) {
        this.finish(
          path,
          text,
          [],
          [
            {
              offset: text.search(/\bMat[A-Z]\w*(Module|Harness)\b/),
              rule: 'imports',
              kind: 'manual',
              code: 'imports-spec',
              reason: `The spec names ${named.join(', ')}. Spec files are never edited.`,
              fix: 'Update the TestBed imports and the harnesses once the component is migrated.',
            },
          ],
          { converted: {}, remaining: {} },
        );
      }

      return;
    }
    if (!/@Component\s*\(/.test(text)) {
      return;
    }

    const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
    const edits: Edit[] = [];
    const findings: Finding[] = [];
    const converted: FileReport['converted'] = {};
    const remaining: Record<string, number> = {};
    const usages: [ComponentInfo, TemplateUsage][] = [];

    for (const component of findComponents(source)) {
      const manual = (code: string, reason: string, fix: string) =>
        findings.push({
          offset: component.offset,
          rule: 'parse',
          kind: 'manual',
          code,
          reason,
          fix,
        });

      if (component.inline) {
        const { start, end, delimiter } = component.inline;
        const result = migrateTemplate(text.slice(start, end), {
          rules: this.rules,
          quote: delimiter === '"' ? "'" : '"',
          plainString: delimiter !== '`',
        });
        if (result.error) {
          findings.push(
            this.unparsable(`The inline template of ${component.name}`, result.error, start),
          );
          continue;
        }
        edits.push(
          ...result.edits.map((edit) => ({
            ...edit,
            start: edit.start + start,
            end: edit.end + start,
          })),
        );
        findings.push(
          ...result.findings.map((finding) => ({ ...finding, offset: finding.offset + start })),
        );
        for (const [rule, count] of Object.entries(result.converted)) {
          converted[rule as RuleName] = (converted[rule as RuleName] ?? 0) + count;
        }
        for (const [name, count] of Object.entries(result.remaining)) {
          remaining[name] = (remaining[name] ?? 0) + count;
        }
        usages.push([component, result]);
      } else if (component.inlineProblem) {
        manual(
          'template-not-literal',
          `${component.name}: ${component.inlineProblem} It was not read, and the "imports" of the component were left alone.`,
          'Migrate this template by hand, or move it into an .html file and run the schematic again.',
        );
      } else if (component.templateUrl !== undefined) {
        const folder = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
        let url: string | undefined;
        try {
          url = normalize(`${folder}/${component.templateUrl}`);
        } catch {
          url = undefined;
        }
        if (url === undefined || !this.tree.exists(`/${url}`)) {
          manual(
            'template-missing',
            `${component.name}: the template ${component.templateUrl} was not found.`,
            'Check the templateUrl.',
          );
        } else if (!this.inScope(url)) {
          manual(
            'template-outside-path',
            `${component.name}: the template ${url} lies outside --path and was not touched, nor were the "imports" of the component.`,
            'Run the schematic with a --path that contains both files.',
          );
        } else {
          const result = this.template(url);
          if (result && !result.error) {
            usages.push([component, result]);
          }
        }
      }
    }

    if (this.rules.has('imports') && usages.length > 0) {
      const planned = planImports(source, usages);
      edits.push(...planned.edits);
      findings.push(...planned.findings);
      if (planned.changed > 0) {
        converted.imports = planned.changed;
      }
    }

    this.finish(path, text, edits, findings, { converted, remaining });
  }

  stylesheet(path: string): void {
    const text = this.read(path);
    if (text === undefined) {
      return;
    }
    // ponytail: plain pattern counts, comments included. The number is a burn-down, not a lint.
    const styleDebt: Record<string, number> = {};
    for (const [label, pattern] of Object.entries(STYLE_DEBT)) {
      styleDebt[label] = text.match(pattern)?.length ?? 0;
    }
    if (Object.values(styleDebt).some((count) => count > 0)) {
      this.reports.push({
        path,
        status: 'unchanged',
        converted: {},
        findings: [],
        remaining: {},
        styleDebt,
      });
    }
  }
}

function lineStarts(text: string): number[] {
  const starts = [0];
  for (let index = text.indexOf('\n'); index !== -1; index = text.indexOf('\n', index + 1)) {
    starts.push(index + 1);
  }

  return starts;
}

/** 1-based line and column of an offset. */
function position(starts: number[], offset: number): { line: number; column: number } {
  let low = 0;
  let high = starts.length - 1;
  while (low < high) {
    const middle = (low + high + 1) >> 1;
    if (starts[middle] <= offset) {
      low = middle;
    } else {
      high = middle - 1;
    }
  }

  return { line: low + 1, column: offset - starts[low] + 1 };
}

/** Where an offset of the original text ends up after the (sorted) edits. */
export function mapOffset(offset: number, edits: Edit[]): number {
  let delta = 0;
  for (const edit of edits) {
    if (edit.end <= offset && edit.start < offset) {
      delta += edit.text.length - (edit.end - edit.start);
    } else if (edit.start < offset) {
      return edit.start + delta; // inside a replaced span
    } else {
      break;
    }
  }

  return offset + delta;
}
