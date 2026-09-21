/**
 * `ng add zenit-ui`.
 *
 * Performs the setup that `projects/zenit-ui/README.md` documents by hand:
 * style entries in `angular.json`, `z-root` in `index.html`, `@angular/cdk`,
 * the four self-hosted fonts and `<z-toast-outlet />` in the root component.
 *
 * Every step is idempotent. Running the schematic twice leaves the workspace
 * unchanged, existing entries are never duplicated, and a wrong style order is
 * corrected.
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
  readWorkspace,
  updateWorkspace,
} from '@schematics/angular/utility';
import {
  getDecoratorMetadata,
  getMetadataField,
  insertImport,
} from '@schematics/angular/utility/ast-utils';
import { Change, InsertChange } from '@schematics/angular/utility/change';
import { latestVersions } from '@schematics/angular/utility/latest-versions';
import { resolveBootstrappedComponentData } from '@schematics/angular/utility/standalone/app_component';
import {
  applyChangesToFile,
  getMainFilePath,
  getSourceFile,
} from '@schematics/angular/utility/standalone/util';
import { Path, dirname, join, normalize } from '@angular-devkit/core';
import ts from 'typescript';
import { Schema } from './schema';

/** Style entries the schematic owns, in the order the README prescribes. */
const TOKENS = 'zenit-ui/styles/tokens.css';
const THEMES = 'zenit-ui/styles/themes.css';
const CDK_OVERLAY = '@angular/cdk/overlay-prebuilt.css';
const LIBRARY = 'zenit-ui/styles/zenit-ui.css';

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

export function ngAdd(options: Schema): Rule {
  return async (tree: Tree) => {
    const workspace = await readWorkspace(tree);
    const name = options.project ?? defaultProject(workspace.projects);
    const project = name ? workspace.projects.get(name) : undefined;

    if (!name || !project) {
      const known = [...workspace.projects.keys()].join(', ') || '(none)';
      throw new SchematicsException(
        `Project "${name ?? ''}" was not found in the workspace. Known projects: ${known}.`,
      );
    }

    return chain([
      styleRule(name, options.themes === true),
      indexHtmlRule(project),
      addDependency('@angular/cdk', cdkRange(tree), {
        type: DependencyType.Default,
        existing: ExistingBehavior.Skip,
      }),
      options.fonts === false ? noop : fontRule(project),
      options.toastOutlet === false ? noop : toastOutletRule(name),
      nextSteps(options),
    ]);
  };
}

/** A rule that changes nothing. */
const noop: Rule = (tree) => tree;

/** First application of the workspace, used when no project was named. */
function defaultProject(projects: Iterable<[string, ProjectDefinition]>): string | undefined {
  const names: string[] = [];
  for (const [name, project] of projects) {
    if (project.extensions['projectType'] === 'application') {
      return name;
    }
    names.push(name);
  }

  return names[0];
}

// --------------------------------------------------------------------------
// 1. angular.json styles
// --------------------------------------------------------------------------

/**
 * Puts the library stylesheets in front of the application's own styles, in the
 * order the README prescribes. Entries already present are moved rather than
 * duplicated, so a wrong order is corrected.
 */
function styleRule(projectName: string, themes: boolean): Rule {
  const managed = themes ? [TOKENS, THEMES, CDK_OVERLAY, LIBRARY] : [TOKENS, CDK_OVERLAY, LIBRARY];

  return updateWorkspace((workspace) => {
    const project = workspace.projects.get(projectName);
    const build = project?.targets.get('build');
    if (build) {
      setStyles(build, managed);
    }

    // The test target only gets the styles when it has such an option at all.
    const test = project?.targets.get('test');
    if (test?.options && 'styles' in test.options) {
      setStyles(test, managed);
    }
  });
}

function setStyles(target: TargetDefinition, managed: string[]): void {
  const options = (target.options ??= {});
  const current = Array.isArray(options['styles']) ? options['styles'] : [];
  const rest = current.filter((entry) => !managed.includes(styleInput(entry) ?? ''));
  options['styles'] = [...managed, ...rest];
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

/** Adds `z-root` to `<html>` and `<body>` and a `lang` when none is set. */
function indexHtmlRule(project: ProjectDefinition): Rule {
  return (tree, context) => {
    const path = indexPath(project);
    if (!tree.exists(path)) {
      context.logger.warn(
        `zenit-ui: ${path} not found, add class="z-root" to <html> and <body> yourself.`,
      );

      return;
    }

    const content = tree.readText(path);
    const updated = patchTag(patchTag(content, 'html', true), 'body', false);
    if (updated !== content) {
      tree.overwrite(path, updated);
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

/**
 * Merges `z-root` into the class list of an opening tag and, for `<html>`, adds
 * `lang="de"` when the tag carries no `lang` yet.
 */
function patchTag(html: string, tag: string, withLang: boolean): string {
  const match = new RegExp(`<${tag}(?=[\\s>])([^>]*)>`, 'i').exec(html);
  if (!match) {
    return html;
  }

  let attributes = match[1];
  const classAttribute = /\sclass\s*=\s*"([^"]*)"|\sclass\s*=\s*'([^']*)'/i.exec(attributes);
  if (classAttribute) {
    const classes = (classAttribute[1] ?? classAttribute[2] ?? '').split(/\s+/).filter(Boolean);
    if (!classes.includes('z-root')) {
      classes.push('z-root');
    }
    attributes =
      attributes.slice(0, classAttribute.index) +
      ` class="${classes.join(' ')}"` +
      attributes.slice(classAttribute.index + classAttribute[0].length);
  } else {
    attributes += ' class="z-root"';
  }

  if (withLang && !/\slang\s*=/i.test(attributes)) {
    attributes = ` lang="de"${attributes}`;
  }

  return (
    html.slice(0, match.index) + `<${tag}${attributes}>` + html.slice(match.index + match[0].length)
  );
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
function fontRule(project: ProjectDefinition): Rule {
  const dependencies = Object.entries(FONT_PACKAGES).map(([name, version]) =>
    addDependency(name, version, { type: DependencyType.Dev, existing: ExistingBehavior.Skip }),
  );

  return chain([
    ...dependencies,
    (tree, context) => {
      const path = globalStylesheet(tree, project);
      if (!path) {
        context.logger.warn(
          'zenit-ui: no global stylesheet found, add the font imports from the README yourself.',
        );

        return;
      }

      const content = tree.readText(path);
      if (content.includes('material-icons/iconfont/filled.css')) {
        return;
      }

      tree.overwrite(path, FONT_IMPORTS + '\n' + content);
    },
  ]);
}

/**
 * The application's own stylesheet: the first `styles` entry of the build target
 * that is a file inside the workspace rather than a package specifier.
 */
function globalStylesheet(tree: Tree, project: ProjectDefinition): Path | undefined {
  const styles = project.targets.get('build')?.options?.['styles'];
  if (Array.isArray(styles)) {
    for (const entry of styles) {
      const input = styleInput(entry);
      if (input && tree.exists(normalize(input))) {
        return normalize(input);
      }
    }
  }

  for (const candidate of ['styles.css', 'styles.scss', 'styles.sass', 'styles.less']) {
    const path = join(sourceRoot(project), candidate);
    if (tree.exists(path)) {
      return path;
    }
  }

  return undefined;
}

// --------------------------------------------------------------------------
// 5. Toast outlet
// --------------------------------------------------------------------------

/**
 * Mounts `<z-toast-outlet />` in the root component and adds `ZToastOutlet` to
 * its `imports`. When the root component cannot be located safely the schematic
 * logs what to do by hand instead of guessing.
 */
function toastOutletRule(projectName: string): Rule {
  return async (tree, context) => {
    const manual = (reason: string) =>
      context.logger.warn(
        `zenit-ui: ${reason} Add ${TOAST_TAG} to your application shell and ` +
          `${TOAST_OUTLET} to the imports of that component yourself.`,
      );

    let mainPath: string;
    try {
      mainPath = await getMainFilePath(tree, projectName);
    } catch {
      manual('the main entry point of the project could not be resolved.');

      return;
    }

    const bootstrapped = tree.exists(mainPath)
      ? resolveBootstrappedComponentData(tree, mainPath)
      : null;
    if (!bootstrapped) {
      manual(`no bootstrapApplication() call was found in ${mainPath}.`);

      return;
    }

    const componentPath = join(
      dirname(normalize(mainPath)),
      `${bootstrapped.componentImportPathInSameFile}.ts`,
    );
    if (!tree.exists(componentPath)) {
      manual(`the root component file ${componentPath} was not found.`);

      return;
    }

    const source = getSourceFile(tree, componentPath);
    const metadata = getDecoratorMetadata(source, 'Component', '@angular/core')[0];
    if (!metadata || !ts.isObjectLiteralExpression(metadata)) {
      manual(`${componentPath} carries no @Component metadata.`);

      return;
    }

    if (!addTemplateOutlet(tree, componentPath, metadata)) {
      manual(`the template of ${componentPath} could not be changed.`);

      return;
    }

    const changes = addImportsEntry(source, componentPath, metadata);
    applyChangesToFile(tree, componentPath, changes);
  };
}

/** Appends the outlet to the component template, external file or inline literal. */
function addTemplateOutlet(
  tree: Tree,
  componentPath: Path,
  metadata: ts.ObjectLiteralExpression,
): boolean {
  const templateUrl = getMetadataField(metadata, 'templateUrl')[0];
  if (templateUrl && ts.isStringLiteralLike(templateUrl.initializer)) {
    const path = join(dirname(componentPath), templateUrl.initializer.text);
    if (!tree.exists(path)) {
      return false;
    }
    const content = tree.readText(path);
    if (!content.includes('z-toast-outlet')) {
      tree.overwrite(path, `${content.replace(/\s*$/, '')}\n\n${TOAST_TAG}\n`);
    }

    return true;
  }

  const template = getMetadataField(metadata, 'template')[0];
  if (template && ts.isNoSubstitutionTemplateLiteral(template.initializer)) {
    if (!template.initializer.text.includes('z-toast-outlet')) {
      const position = template.initializer.getEnd() - 1;
      applyChangesToFile(tree, componentPath, [
        new InsertChange(componentPath, position, `\n    ${TOAST_TAG}\n  `),
      ]);
    }

    return true;
  }

  return false;
}

/** Adds `ZToastOutlet` to the `imports` of the component metadata. */
function addImportsEntry(
  source: ts.SourceFile,
  path: string,
  metadata: ts.ObjectLiteralExpression,
): Change[] {
  const imports = getMetadataField(metadata, 'imports')[0];

  if (imports && ts.isArrayLiteralExpression(imports.initializer)) {
    const elements = imports.initializer.elements;
    if (elements.some((element) => element.getText() === TOAST_OUTLET)) {
      return [];
    }

    const change =
      elements.length === 0
        ? new InsertChange(path, imports.initializer.getStart() + 1, TOAST_OUTLET)
        : new InsertChange(path, elements[elements.length - 1].getEnd(), `, ${TOAST_OUTLET}`);

    return [change, insertImport(source, path, TOAST_OUTLET, 'zenit-ui')];
  }

  return [
    new InsertChange(path, metadata.getStart() + 1, `\n  imports: [${TOAST_OUTLET}],`),
    insertImport(source, path, TOAST_OUTLET, 'zenit-ui'),
  ];
}

// --------------------------------------------------------------------------
// 6. Next steps
// --------------------------------------------------------------------------

function nextSteps(options: Schema): Rule {
  return (_tree: Tree, context: SchematicContext) => {
    const lines = [
      'zenit-ui is wired up.',
      '  - Styles registered in angular.json, z-root set in index.html.',
    ];
    if (options.fonts !== false) {
      lines.push('  - Font imports prepended to the global stylesheet.');
    }
    if (options.toastOutlet !== false) {
      lines.push('  - <z-toast-outlet /> mounted in the root component.');
    }
    lines.push(
      '  - Next: import the building blocks you need from "zenit-ui", and copy the',
      '    Stylelint rules from the package README so your own styles stay on tokens.',
    );
    context.logger.info(lines.join('\n'));
  };
}
