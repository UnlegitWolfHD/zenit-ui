/**
 * `ng add zenit-ui`.
 *
 * Performs the setup that `projects/zenit-ui/README.md` documents by hand:
 * style entries in `angular.json`, `z-root` in `index.html`, `@angular/cdk`,
 * the four self-hosted fonts and `<z-toast-outlet />` in the root component.
 * With `--themes` it also wires the theme so that the stored scheme is on the
 * page before the first paint: init script in `index.html`, render-blocking
 * stylesheet, `provideZenitTheme()` in the application config.
 *
 * Every step is idempotent. Running the schematic twice leaves the workspace
 * unchanged, existing entries are never duplicated, and a wrong style order is
 * corrected.
 *
 * Every source file is atomic: all changes to it are computed against its
 * original text and applied in one pass, or the file stays untouched and the
 * final log names the manual step. Inserted text uses the file's own line ending.
 */
import {
  Rule,
  SchematicContext,
  SchematicsException,
  Tree,
  chain,
} from '@angular-devkit/schematics';
import {
  DependencyType,
  ExistingBehavior,
  ProjectDefinition,
  TargetDefinition,
  addDependency,
  addRootProvider,
  readWorkspace,
  updateWorkspace,
} from '@schematics/angular/utility';
import {
  getDecoratorMetadata,
  getMetadataField,
  insertImport,
  isImported,
} from '@schematics/angular/utility/ast-utils';
import { Change, InsertChange, NoopChange } from '@schematics/angular/utility/change';
import { getEOL } from '@schematics/angular/utility/eol';
import { latestVersions } from '@schematics/angular/utility/latest-versions';
import { resolveBootstrappedComponentData } from '@schematics/angular/utility/standalone/app_component';
import { findAppConfig } from '@schematics/angular/utility/standalone/app_config';
import {
  applyChangesToFile,
  findBootstrapApplicationCall,
  getMainFilePath,
  getSourceFile,
} from '@schematics/angular/utility/standalone/util';
import { JsonObject, Path, dirname, join, normalize } from '@angular-devkit/core';
import ts from 'typescript';
import { applyEdits, planIndexHtml } from './html';
import { zenitThemeInitScript } from './init-script';
import { Schema } from './schema';

/** Style entries the schematic owns, in the order the README prescribes. */
const TOKENS = 'zenit-ui/styles/tokens.css';
const THEMES = 'zenit-ui/styles/themes.css';
const CDK_OVERLAY = '@angular/cdk/overlay-prebuilt.css';
const LIBRARY = 'zenit-ui/styles/zenit-ui.css';
const MANAGED = [TOKENS, THEMES, CDK_OVERLAY, LIBRARY];

/** Font packages, self-hosted so that no request reaches Google. */
const FONT_PACKAGES: Record<string, string> = {
  'material-icons': '^1.13.14',
  '@fontsource/inter': '^5.3.0',
  '@fontsource/space-grotesk': '^5.3.0',
  '@fontsource/jetbrains-mono': '^5.3.0',
};

/**
 * The `layer(schriften)` is required: `material-icons` sets its own `font-size`
 * on `.material-icons` and is loaded after `zenit-ui.css`. The layer makes sure
 * `.z-icon` from the library wins. Valid in CSS and in SCSS (Sass >= 1.71),
 * because every URL ends in `.css` and is therefore a plain CSS import.
 */
const FONT_IMPORTS = `/* Fonts self-hosted, no request to Google. The layer keeps .z-icon from
   zenit-ui.css ahead of the font-size that material-icons sets itself. */
@import 'material-icons/iconfont/filled.css' layer(schriften);
@import '@fontsource/inter/400.css';
@import '@fontsource/inter/500.css';
@import '@fontsource/inter/600.css';
@import '@fontsource/space-grotesk/600.css';
@import '@fontsource/space-grotesk/700.css';
@import '@fontsource/jetbrains-mono/400.css';
@import '@fontsource/jetbrains-mono/600.css';
`;

const TOAST_OUTLET = 'ZToastOutlet';
const TOAST_TAG = '<z-toast-outlet />';

/** What the final log reports: the steps that were done and the ones left to the user. */
interface Report {
  done: string[];
  manual: string[];
}

export function ngAdd(options: Schema): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const workspace = await readWorkspace(tree);
    const [name, project] = selectProject(workspace.projects, options.project);
    if (!options.project) {
      context.logger.info(`zenit-ui: no --project given, using the only application "${name}".`);
    }
    const themes = options.themes === true;
    const report: Report = { done: [], manual: [] };

    return chain([
      styleRule(name, themes, report),
      indexHtmlRule(project, themes, report),
      keepingCrlf(
        '/package.json',
        addDependency('@angular/cdk', cdkRange(tree), {
          type: DependencyType.Default,
          existing: ExistingBehavior.Skip,
        }),
      ),
      options.fonts === false ? noop : fontRule(project, report),
      options.toastOutlet === false ? noop : toastOutletRule(name, report),
      themes ? chain([inlineCriticalRule(name, report), themeProviderRule(name, report)]) : noop,
      nextSteps(report),
    ]);
  };
}

/** A rule that changes nothing. */
const noop: Rule = (tree) => tree;

const LONE_LF = /(^|[^\r])\n/;

/**
 * Wraps a devkit rule that writes LF whatever the file uses (`addDependency`
 * re-serialises `package.json`, `addRootProvider` creates `providers`): a file
 * that was purely CRLF before is purely CRLF afterwards.
 */
function keepingCrlf(path: string, rule: Rule): Rule {
  return (tree) => {
    const before = tree.exists(path) ? tree.readText(path) : '';
    if (!before.includes('\r\n') || LONE_LF.test(before)) {
      return rule;
    }

    return chain([
      rule,
      (after) => {
        const text = after.readText(path);
        if (LONE_LF.test(text)) {
          after.overwrite(path, text.replace(/\r?\n/g, '\r\n'));
        }
      },
    ]);
  };
}

/** Builders whose `build` target takes `styles`, `index` and a main entry point. */
const APPLICATION_BUILDER = /:(application|browser|browser-esbuild)$/;

/**
 * The project to wire up. Only an application with an application build target
 * qualifies: a library's `build` target belongs to ng-packagr, which knows no
 * `styles`. Without `--project` the workspace must have exactly one application.
 */
function selectProject(
  projects: Iterable<[string, ProjectDefinition]>,
  requested: string | undefined,
): [string, ProjectDefinition] {
  const all = new Map(projects);
  const applications = [...all]
    .filter(([, project]) => project.extensions['projectType'] === 'application')
    .map(([name]) => name);
  const listed = applications.join(', ') || '(none)';

  if (!requested && applications.length !== 1) {
    throw new SchematicsException(
      applications.length === 0
        ? 'The workspace has no application to wire zenit-ui into. Create one with "ng generate application" first.'
        : `The workspace has several applications: ${listed}. Name one with --project.`,
    );
  }

  const name = requested ?? applications[0];
  const project = all.get(name);
  if (!project) {
    const known = [...all.keys()].join(', ') || '(none)';
    throw new SchematicsException(
      `Project "${name}" was not found in the workspace. Known projects: ${known}.`,
    );
  }
  if (project.extensions['projectType'] !== 'application') {
    throw new SchematicsException(
      `Project "${name}" is not an application (projectType: ` +
        `${JSON.stringify(project.extensions['projectType'])}). zenit-ui is wired into the ` +
        `application that renders it. Applications of this workspace: ${listed}.`,
    );
  }
  const builder = project.targets.get('build')?.builder;
  if (!builder || !APPLICATION_BUILDER.test(builder)) {
    throw new SchematicsException(
      `Project "${name}" has no application build target (builder of "build": ` +
        `${builder ?? 'none'}). Expected a builder ending in :application, :browser or ` +
        ':browser-esbuild. Follow the manual setup in the README of zenit-ui instead.',
    );
  }

  return [name, project];
}

// --------------------------------------------------------------------------
// 1. angular.json styles
// --------------------------------------------------------------------------

/**
 * Puts the library stylesheets in front of the application's own styles, in the
 * order the README prescribes. Entries already present are moved rather than
 * duplicated, so a wrong order is corrected.
 */
function styleRule(projectName: string, themes: boolean, report: Report): Rule {
  return updateWorkspace((workspace) => {
    const project = workspace.projects.get(projectName);
    const targets: [string, TargetDefinition | undefined][] = [
      ['build', project?.targets.get('build')],
      // The test target only gets the styles when it has such an option at all.
      ['test', project?.targets.get('test')],
    ];

    for (const [name, target] of targets) {
      if (!target || (name === 'test' && !(target.options && 'styles' in target.options))) {
        continue;
      }
      setStyles(target, themes);
      report.done.push(`Stylesheets registered in the "options" of the "${name}" target.`);

      // `styles` of a configuration replace the ones from `options`, they are not merged.
      const overriding = Object.entries(target.configurations ?? {})
        .filter(([, configuration]) => configuration && 'styles' in configuration)
        .map(([configuration]) => `"${configuration}"`);
      if (overriding.length > 0) {
        report.manual.push(
          `angular.json: the configuration(s) ${overriding.join(', ')} of the "${name}" target ` +
            'set their own "styles", which replace the ones from "options". They were left ' +
            `alone: put ${TOKENS}, ${themes ? `${THEMES}, ` : ''}${CDK_OVERLAY} and ${LIBRARY} ` +
            'in front of their entries yourself, in this order.',
        );
      }
    }
  });
}

/** The managed entry an existing `styles` entry stands for, in either spelling. */
function managedKey(entry: unknown): string | undefined {
  const input = styleInput(entry)
    ?.replace(/^\.\//, '')
    .replace(/^node_modules\//, '');

  return input && MANAGED.includes(input) ? input : undefined;
}

/**
 * Takes every managed entry out of the array and puts the set back in front, in
 * canonical order. An existing entry is reused as it is, so the object form
 * (`{ input, bundleName, inject }`) and the `node_modules/` spelling survive.
 * `themes.css` stays when it was there, also without `--themes`.
 */
function setStyles(target: TargetDefinition, themes: boolean): void {
  const options = (target.options ??= {});
  const current = Array.isArray(options['styles']) ? options['styles'] : [];
  const existing = new Map<string, (typeof current)[number]>();
  for (const entry of current) {
    const key = managedKey(entry);
    if (key && !existing.has(key)) {
      existing.set(key, entry);
    }
  }

  const wanted = MANAGED.filter((key) => key !== THEMES || themes || existing.has(THEMES));
  options['styles'] = [
    ...wanted.map((key) => existing.get(key) ?? key),
    ...current.filter((entry) => !managedKey(entry)),
  ];
}

/** A style entry is either a path or `{ input, bundleName }`. */
function styleInput(entry: unknown): string | undefined {
  if (typeof entry === 'string') {
    return entry;
  }
  if (entry && typeof entry === 'object') {
    const input = (entry as { input?: unknown }).input;
    if (typeof input === 'string') {
      return input;
    }
  }

  return undefined;
}

// --------------------------------------------------------------------------
// 2. index.html
// --------------------------------------------------------------------------

/**
 * Adds `z-root` to `<html>` and `<body>`, a `lang` when none is set and, with
 * `--themes`, the init script. One plan against the original text, one write;
 * when a tag the plan needs is missing, the file stays as it is.
 */
function indexHtmlRule(project: ProjectDefinition, themes: boolean, report: Report): Rule {
  return (tree) => {
    const path = indexPath(project);
    const wanted =
      'class="z-root" on <html> and <body>' +
      (themes
        ? ', and the output of zenitThemeInitScript() in a <script> at the top of <head> (docs/theming.md)'
        : '');
    if (!tree.exists(path)) {
      report.manual.push(`${path} was not found. Add ${wanted} yourself.`);

      return;
    }

    const content = tree.readText(path);
    const withScript = themes && !content.includes(THEME_MARKER);
    const plan = planIndexHtml(content, withScript ? initScriptLines() : undefined);
    if (plan.missing.length > 0) {
      report.manual.push(
        `${path} has no ${plan.missing.join(', ')} tag and was left alone. Add ${wanted} yourself.`,
      );

      return;
    }

    if (plan.edits.length > 0) {
      tree.overwrite(path, applyEdits(content, plan.edits));
    }
    report.done.push(
      `z-root set on <html> and <body>${themes ? ', theme init script at the top of <head>' : ''} in ${path}.`,
    );
    // An existing `lang` is the application's decision, `ng new` writes "en".
    if (plan.lang !== undefined && !/^de(-|$)/i.test(plan.lang)) {
      report.manual.push(
        `${path}: lang left as "${plan.lang}": set it to your UI language ` +
          '(the built-in labels of zenit-ui are German).',
      );
    }
  };
}

function indexPath(project: ProjectDefinition): Path {
  const fromOptions = styleInput(project.targets.get('build')?.options?.['index']);

  return fromOptions ? normalize(fromOptions) : join(sourceRoot(project), 'index.html');
}

function sourceRoot(project: ProjectDefinition): Path {
  return project.sourceRoot ? normalize(project.sourceRoot) : join(normalize(project.root), 'src');
}

// --------------------------------------------------------------------------
// 3. @angular/cdk
// --------------------------------------------------------------------------

/** The CDK follows the major of the Angular version already installed. */
function cdkRange(tree: Tree): string {
  const manifest = tree.readJson('/package.json') as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const core =
    manifest.dependencies?.['@angular/core'] ?? manifest.devDependencies?.['@angular/core'];
  const major = core ? /\d+/.exec(core)?.[0] : undefined;

  return major ? `^${major}.0.0` : latestVersions['Angular'];
}

// --------------------------------------------------------------------------
// 4. Fonts
// --------------------------------------------------------------------------

/** Adds the four font packages and prepends their imports to the global stylesheet. */
function fontRule(project: ProjectDefinition, report: Report): Rule {
  const dependencies = Object.entries(FONT_PACKAGES).map(([name, version]) =>
    addDependency(name, version, { type: DependencyType.Dev, existing: ExistingBehavior.Skip }),
  );

  return chain([
    keepingCrlf('/package.json', chain(dependencies)),
    (tree) => {
      const path = globalStylesheet(tree, project);
      if (!path) {
        report.manual.push(
          'Fonts: no .css, .scss or .less file inside the project is registered in the "styles" ' +
            'of the build target (files in node_modules or outside the project are never ' +
            'written to). Put the font imports from the README section "Self-host the fonts" ' +
            'at the top of your global stylesheet yourself.',
        );

        return;
      }

      const content = tree.readText(path);
      if (!content.includes('material-icons/iconfont/filled.css')) {
        const eol = getEOL(content);
        tree.overwrite(path, (FONT_IMPORTS + '\n').replace(/\n/g, eol) + content);
      }
      report.done.push(`Font imports at the top of ${path}.`);
    },
  ]);
}

/**
 * The application's own stylesheet: the first `styles` entry of the build target
 * that is a stylesheet inside the project. A file of a package
 * (`node_modules/material-icons/...`) or outside the project is not ours to edit.
 * `.sass` is left out, the import block is not valid in the indented syntax.
 */
function globalStylesheet(tree: Tree, project: ProjectDefinition): Path | undefined {
  const styles = project.targets.get('build')?.options?.['styles'];
  const root = normalize(project.root);

  for (const entry of Array.isArray(styles) ? styles : []) {
    const input = styleInput(entry);
    if (!input || managedKey(entry) || /^([/\\]|[a-zA-Z]:)/.test(input)) {
      continue;
    }

    const path = normalize(input);
    const inside = root === '' ? !path.startsWith('..') : path.startsWith(`${root}/`);
    if (
      inside &&
      !/(^|\/)node_modules\//.test(path) &&
      /\.(css|scss|less)$/.test(path) &&
      tree.exists(path)
    ) {
      return path;
    }
  }

  return undefined;
}

// --------------------------------------------------------------------------
// 5. Toast outlet
// --------------------------------------------------------------------------

/** `<z-toast-outlet` as an element; a comment that mentions it does not count. */
function hasToastOutlet(template: string): boolean {
  return /<z-toast-outlet[\s/>]/.test(template.replace(/<!--[\s\S]*?-->/g, ''));
}

/**
 * Mounts `<z-toast-outlet />` in the root component and adds `ZToastOutlet` to
 * its `imports`. Everything is checked first and every change to the component
 * file is computed against its original source and applied in one pass, so the
 * component is either fully patched or untouched. When it cannot be patched
 * safely the schematic reports what to do by hand instead of guessing.
 */
function toastOutletRule(projectName: string, report: Report): Rule {
  return async (tree) => {
    const manual = (reason: string) =>
      report.manual.push(
        `Toast outlet: ${reason} Nothing was changed. Add ${TOAST_TAG} at the end of the root ` +
          `component's template and ${TOAST_OUTLET} (import { ${TOAST_OUTLET} } from ` +
          `'zenit-ui') to the "imports" array of that component yourself.`,
      );

    const mainPath = await mainFile(tree, projectName);
    if (!mainPath) {
      manual('the main entry point of the project could not be resolved.');

      return;
    }

    let bootstrapped: ReturnType<typeof resolveBootstrappedComponentData> = null;
    try {
      bootstrapped = resolveBootstrappedComponentData(tree, mainPath);
    } catch {
      // Neither bootstrapApplication() nor a resolvable bootstrapModule().
    }
    if (bootstrapped?.moduleName || isNgModuleApp(tree, mainPath)) {
      // A non-standalone root component has no `imports`, its NgModule has them.
      report.manual.push(
        `Toast outlet: ${mainPath} bootstraps an NgModule. Nothing was changed. Add ` +
          `${TOAST_OUTLET} (import { ${TOAST_OUTLET} } from 'zenit-ui') to the "imports" of the ` +
          `NgModule that declares your root component, and ${TOAST_TAG} at the end of that ` +
          "component's template.",
      );

      return;
    }
    if (!bootstrapped) {
      manual(`no bootstrapApplication(Component, ...) call was found in ${mainPath}.`);

      return;
    }

    const { componentName, componentImportPathInSameFile } = bootstrapped;
    const componentPath = join(dirname(normalize(mainPath)), `${componentImportPathInSameFile}.ts`);
    if (!tree.exists(componentPath)) {
      manual(`the root component file ${componentPath} was not found.`);

      return;
    }

    const source = getSourceFile(tree, componentPath);
    const eol = getEOL(source.text);
    const metadata = getDecoratorMetadata(source, 'Component', '@angular/core')
      .filter(ts.isObjectLiteralExpression)
      .find((node) => {
        // object literal -> call -> decorator -> class
        const owner = node.parent?.parent?.parent;

        return owner && ts.isClassDeclaration(owner) && owner.name?.text === componentName;
      });
    if (!metadata) {
      manual(`${componentPath} has no @Component({...}) on a class ${componentName}.`);

      return;
    }

    const changes: Change[] = [];

    // 1. `imports`: extend an array literal or add the property, nothing else.
    const named = metadata.properties.filter(
      ({ name }) =>
        name && (ts.isIdentifier(name) || ts.isStringLiteral(name)) && name.text === 'imports',
    );
    const imports = named[0];
    const list =
      imports &&
      ts.isPropertyAssignment(imports) &&
      ts.isArrayLiteralExpression(imports.initializer)
        ? imports.initializer.elements
        : undefined;
    const spreadOnly = list !== undefined && list.length > 0 && list.every(ts.isSpreadElement);
    if (imports && (named.length > 1 || !list || spreadOnly)) {
      manual(
        `the "imports" of ${componentPath} are not a plain array literal ` +
          `(${imports.getText().slice(0, 60)}).`,
      );

      return;
    }
    if (!list) {
      const at = metadata.getStart() + 1;
      changes.push(new InsertChange(componentPath, at, `${eol}  imports: [${TOAST_OUTLET}],`));
    } else if (!list.some((element) => element.getText() === TOAST_OUTLET)) {
      changes.push(
        list.length === 0
          ? new InsertChange(componentPath, list.pos, TOAST_OUTLET)
          : new InsertChange(componentPath, list[list.length - 1].getEnd(), `, ${TOAST_OUTLET}`),
      );
    }
    if (changes.length > 0) {
      const importChange = insertImport(source, componentPath, TOAST_OUTLET, 'zenit-ui');
      if (importChange instanceof NoopChange && !isImported(source, TOAST_OUTLET, 'zenit-ui')) {
        manual(`${componentPath} imports "zenit-ui" as a namespace.`);

        return;
      }
      changes.push(importChange);
    }

    // 2. Template: external file or inline template literal.
    let external: { path: Path; content: string } | undefined;
    const templateUrl = getMetadataField(metadata, 'templateUrl')[0];
    const template = getMetadataField(metadata, 'template')[0];
    if (templateUrl && ts.isStringLiteralLike(templateUrl.initializer)) {
      const path = join(dirname(componentPath), templateUrl.initializer.text);
      if (!tree.exists(path)) {
        manual(`the template ${path} of ${componentPath} was not found.`);

        return;
      }
      const content = tree.readText(path);
      if (!hasToastOutlet(content)) {
        const nl = getEOL(content);
        external = { path, content: `${content.replace(/\s*$/, '')}${nl}${nl}${TOAST_TAG}${nl}` };
      }
    } else if (template && ts.isNoSubstitutionTemplateLiteral(template.initializer)) {
      if (!hasToastOutlet(template.initializer.text)) {
        // A multi-line template gets the tag after its last content line, at that
        // indentation; a one-line template is opened up.
        const inner = template.initializer.getText().slice(1, -1);
        const content = inner.trimEnd();
        const trailing = inner.slice(content.length);
        const at = template.initializer.getStart() + 1 + content.length;
        const indent = `${trailing.slice(trailing.lastIndexOf('\n') + 1)}  `;
        changes.push(
          new InsertChange(
            componentPath,
            at,
            trailing.includes('\n')
              ? `${eol}${indent}${TOAST_TAG}`
              : `${eol}    ${TOAST_TAG}${eol}  `,
          ),
        );
      }
    } else {
      manual(
        `${componentPath} has neither a "templateUrl" nor a "template" written as a plain ` +
          'template literal (backticks without ${...}).',
      );

      return;
    }

    // Everything is decided: one recorder for the component, one write for the template.
    applyChangesToFile(tree, componentPath, changes);
    if (external) {
      tree.overwrite(external.path, external.content);
    }
    report.done.push(`${TOAST_TAG} mounted in the root component ${componentPath}.`);
  };
}

/** The main entry point of the project, `undefined` when it cannot be resolved. */
async function mainFile(tree: Tree, projectName: string): Promise<string | undefined> {
  try {
    const path = await getMainFilePath(tree, projectName);

    return path && tree.exists(path) ? path : undefined;
  } catch {
    return undefined;
  }
}

/** `platformBrowser().bootstrapModule(AppModule)` in the main file. */
function isNgModuleApp(tree: Tree, mainPath: string): boolean {
  return /\bbootstrapModule\s*\(/.test(tree.readText(mainPath));
}

// --------------------------------------------------------------------------
// 6. Theme without a flash (--themes)
// --------------------------------------------------------------------------

/** Marker comment of the init script; its presence makes the step idempotent. */
const THEME_MARKER = 'zenit-theme-init';
const THEME_PROVIDER = 'provideZenitTheme';

/**
 * Three steps that only work together. `ZTheme` applies the stored scheme after
 * bootstrap, which is several frames after the first paint, so:
 *
 * 1. the init script sets `data-theme` and `data-accent` in `<head>`
 *    (`indexHtmlRule`, together with `z-root`, so `index.html` is written once),
 * 2. `inlineCritical` is switched off for the production build. The CLI would
 *    otherwise inline only the CSS that matches `index.html` and load the full
 *    stylesheet without blocking; `[data-theme="light"]` matches nothing there,
 *    so the page would still paint in the default scheme until the full
 *    stylesheet arrives,
 * 3. `provideZenitTheme()` goes into the application config, so the service
 *    takes over from the script with the same defaults.
 *
 * The block goes in front of every stylesheet: right after `<meta charset>`,
 * which has to stay within the first 1024 bytes of the document, or as the
 * first child of `<head>` when there is none.
 */
function initScriptLines(): string[] {
  return [
    `<!-- ${THEME_MARKER}: output of zenitThemeInitScript() from zenit-ui. It applies the stored`,
    '     theme before the first paint. Regenerate it when you pass a config to',
    '     provideZenitTheme(); with a CSP, hash or nonce it (docs/theming.md). -->',
    '<!-- prettier-ignore -->',
    `<script>${zenitThemeInitScript()}</script>`,
  ];
}

/** Switches critical CSS inlining off for the production build, keeping every other setting. */
function inlineCriticalRule(projectName: string, report: Report): Rule {
  return updateWorkspace((workspace) => {
    const build = workspace.projects.get(projectName)?.targets.get('build');
    if (!build) {
      return;
    }

    const configurations = (build.configurations ??= {});
    const production = (configurations['production'] ??= {});
    const current = production['optimization'];
    const styles = isJsonObject(current) ? current['styles'] : undefined;
    // `false` means nothing is optimised and nothing is inlined either.
    if (current === false || styles === false) {
      return;
    }

    production['optimization'] = {
      ...(isJsonObject(current) ? current : { scripts: true, fonts: true }),
      styles: {
        minify: true,
        removeSpecialComments: true,
        ...(isJsonObject(styles) ? styles : {}),
        inlineCritical: false,
      },
    };
    report.done.push(
      'optimization.styles.inlineCritical is false for production: the CLI would otherwise ' +
        'inline only the CSS that matches index.html and load the rest late, and ' +
        '[data-theme="light"] matches nothing there, so a stored light scheme would paint dark first.',
    );
  });
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Adds `provideZenitTheme()` to the application config. Only where that is
 * safe: a `bootstrapApplication()` call whose config can be resolved. Anything
 * else gets the instruction instead of a guess.
 */
function themeProviderRule(projectName: string, report: Report): Rule {
  return async (tree) => {
    const manual = (reason: string, where = 'the "providers" of your application config') =>
      report.manual.push(
        `Theme: ${reason} Add ${THEME_PROVIDER}() (import { ${THEME_PROVIDER} } from ` +
          `'zenit-ui') to ${where} yourself.`,
      );

    const mainPath = await mainFile(tree, projectName);
    if (!mainPath) {
      manual('the main entry point of the project could not be resolved.');

      return;
    }
    if (isNgModuleApp(tree, mainPath)) {
      manual(`${mainPath} bootstraps an NgModule.`, 'the "providers" of your root NgModule');

      return;
    }

    let configPath: string;
    try {
      const bootstrap = findBootstrapApplicationCall(tree, mainPath);
      const appConfig = findAppConfig(bootstrap, tree, mainPath);
      if (!appConfig && bootstrap.arguments.length !== 1) {
        manual(`the config passed to bootstrapApplication() in ${mainPath} could not be resolved.`);

        return;
      }
      // findAppConfig() joins with the platform separator.
      configPath = (appConfig?.filePath ?? mainPath).replace(/\\/g, '/');
    } catch {
      manual('no bootstrapApplication() call could be located.');

      return;
    }

    const before = tree.readText(configPath);
    report.done.push(`${THEME_PROVIDER}() in the providers of ${configPath}.`);
    if (before.includes(`${THEME_PROVIDER}(`)) {
      return;
    }

    return keepingCrlf(
      configPath,
      addRootProvider(
        projectName,
        ({ code, external }) => code`${external(THEME_PROVIDER, 'zenit-ui')}()`,
      ),
    );
  };
}

// --------------------------------------------------------------------------
// 7. Final log
// --------------------------------------------------------------------------

/** Says what was done and, separately and as a warning, what is left to the user. */
function nextSteps(report: Report): Rule {
  return (_tree: Tree, context: SchematicContext) => {
    const list = (items: string[]) => items.map((item) => `  - ${item}`).join('\n');

    context.logger.info(
      `zenit-ui: done\n${list(report.done)}\n` +
        '  Next: import the building blocks you need from "zenit-ui", and copy the Stylelint\n' +
        '  rules from the package README so your own styles stay on tokens. With a config for\n' +
        '  provideZenitTheme(), regenerate the init script with zenitThemeInitScript(config).',
    );
    if (report.manual.length > 0) {
      context.logger.warn(`zenit-ui: left for you\n${list(report.manual)}`);
    }
  };
}
