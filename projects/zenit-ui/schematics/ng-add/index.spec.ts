/**
 * Unit tests of the `ng add zenit-ui` schematic.
 *
 * The runner loads the *compiled* collection from `dist/zenit-ui/schematics`,
 * so `node tools/build-schematics.mjs` has to run first. `node
 * tools/test-schematics.mjs` does both in one step.
 */
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { applyEdits, openingTags, planIndexHtml } from './html';
import { zenitThemeInitScript } from './init-script';

const nodeRequire = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));

/** `@schematics/angular` blocks a deep import of collection.json, so resolve its folder. */
const angularCollection = join(
  dirname(nodeRequire.resolve('@schematics/angular/package.json')),
  'collection.json',
);
const zenitCollection = join(
  here,
  '..',
  '..',
  '..',
  '..',
  'dist',
  'zenit-ui',
  'schematics',
  'collection.json',
);

const angular = new SchematicTestRunner('@schematics/angular', angularCollection);
const zenit = new SchematicTestRunner('zenit-ui', zenitCollection);

const APP = 'probe';
const STYLES = 'projects/probe/src/styles.css';
const INDEX = 'projects/probe/src/index.html';
const APP_TS = 'projects/probe/src/app/app.ts';
const APP_HTML = 'projects/probe/src/app/app.html';

async function workspaceWith(style = 'css'): Promise<UnitTestTree> {
  const base = await angular.runSchematic('workspace', {
    name: 'probe-workspace',
    version: '22.0.0',
    newProjectRoot: 'projects',
  });

  return angular.runSchematic('application', { name: APP, style, skipTests: true }, base);
}

function styles(tree: UnitTestTree, target = 'build'): unknown[] {
  const workspace = JSON.parse(tree.readContent('/angular.json'));

  return workspace.projects[APP].architect[target].options.styles;
}

function snapshot(tree: UnitTestTree): Record<string, string> {
  const out: Record<string, string> = {};
  for (const path of tree.files) {
    out[path] = tree.readContent(path);
  }

  return out;
}

describe('ng-add', () => {
  let tree: UnitTestTree;

  beforeAll(async () => {
    tree = await zenit.runSchematic('ng-add', { project: APP }, await workspaceWith());
  });

  it('registers the stylesheets in front of the application styles', () => {
    expect(styles(tree)).toEqual([
      'zenit-ui/styles/tokens.css',
      '@angular/cdk/overlay-prebuilt.css',
      'zenit-ui/styles/zenit-ui.css',
      STYLES,
    ]);
  });

  it('sets z-root on <html> and <body>', () => {
    const html = tree.readContent(INDEX);
    expect(html).toContain('<html lang="en" class="z-root">');
    expect(html).toContain('<body class="z-root">');
  });

  it('adds @angular/cdk with the installed Angular major', () => {
    const manifest = JSON.parse(tree.readContent('/package.json'));
    const major = /\d+/.exec(manifest.dependencies['@angular/core'])?.[0];
    expect(manifest.dependencies['@angular/cdk']).toBe(`^${major}.0.0`);
  });

  it('adds the font packages and prepends their imports', () => {
    const manifest = JSON.parse(tree.readContent('/package.json'));
    for (const name of [
      'material-icons',
      '@fontsource/inter',
      '@fontsource/space-grotesk',
      '@fontsource/jetbrains-mono',
    ]) {
      expect(manifest.devDependencies[name], name).toBeTruthy();
    }

    const css = tree.readContent(STYLES);
    expect(css).toContain("@import 'material-icons/iconfont/filled.css' layer(schriften);");
    expect(css).toContain("@import '@fontsource/inter/600.css';");
    expect(css).toContain("@import '@fontsource/space-grotesk/700.css';");
    expect(css).toContain("@import '@fontsource/jetbrains-mono/400.css';");
    // CSS requires @import at the top of the file, so the block is prepended.
    expect(css.startsWith('/* Fonts self-hosted')).toBe(true);
  });

  it('mounts the toast outlet in the root component', () => {
    expect(tree.readContent(APP_HTML)).toContain('<z-toast-outlet />');
    const component = tree.readContent(APP_TS);
    expect(component).toContain("import { ZToastOutlet } from 'zenit-ui';");
    expect(component).toMatch(/imports:\s*\[[^\]]*ZToastOutlet/);
  });

  it('changes nothing on a second run', async () => {
    const before = snapshot(tree);
    const again = await zenit.runSchematic('ng-add', { project: APP }, tree);
    expect(snapshot(again)).toEqual(before);
  });
});

describe('ng-add options', () => {
  it('adds themes.css right after tokens.css with themes: true', async () => {
    const tree = await zenit.runSchematic(
      'ng-add',
      { project: APP, themes: true },
      await workspaceWith(),
    );
    expect(styles(tree)).toEqual([
      'zenit-ui/styles/tokens.css',
      'zenit-ui/styles/themes.css',
      '@angular/cdk/overlay-prebuilt.css',
      'zenit-ui/styles/zenit-ui.css',
      STYLES,
    ]);
  });

  it('leaves the stylesheet and the font packages alone with fonts: false', async () => {
    const tree = await zenit.runSchematic(
      'ng-add',
      { project: APP, fonts: false },
      await workspaceWith(),
    );
    expect(tree.readContent(STYLES)).not.toContain('@fontsource');
    expect(
      JSON.parse(tree.readContent('/package.json')).devDependencies['material-icons'],
    ).toBeUndefined();
  });

  it('leaves the root component alone with toastOutlet: false', async () => {
    const tree = await zenit.runSchematic(
      'ng-add',
      { project: APP, toastOutlet: false },
      await workspaceWith(),
    );
    expect(tree.readContent(APP_HTML)).not.toContain('z-toast-outlet');
    expect(tree.readContent(APP_TS)).not.toContain('ZToastOutlet');
  });

  it('writes the font imports into an SCSS stylesheet', async () => {
    const tree = await zenit.runSchematic('ng-add', { project: APP }, await workspaceWith('scss'));
    const scss = tree.readContent('projects/probe/src/styles.scss');
    // Every URL ends in .css, so Sass passes the rules through as plain CSS imports.
    expect(scss.startsWith('/* Fonts self-hosted')).toBe(true);
    expect(scss).toContain("@import 'material-icons/iconfont/filled.css' layer(schriften);");
    expect(styles(tree)).toContain('projects/probe/src/styles.scss');
  });

  it('corrects an existing wrong order without duplicating entries', async () => {
    const base = await workspaceWith();
    const workspace = JSON.parse(base.readContent('/angular.json'));
    workspace.projects[APP].architect.build.options.styles = [
      STYLES,
      'zenit-ui/styles/zenit-ui.css',
      'zenit-ui/styles/tokens.css',
    ];
    base.overwrite('/angular.json', JSON.stringify(workspace, null, 2));

    const tree = await zenit.runSchematic('ng-add', { project: APP }, base);
    expect(styles(tree)).toEqual([
      'zenit-ui/styles/tokens.css',
      '@angular/cdk/overlay-prebuilt.css',
      'zenit-ui/styles/zenit-ui.css',
      STYLES,
    ]);
  });

  it('also updates a test target that has a styles option', async () => {
    const base = await workspaceWith();
    const workspace = JSON.parse(base.readContent('/angular.json'));
    workspace.projects[APP].architect.test ??= { builder: '@angular/build:unit-test', options: {} };
    workspace.projects[APP].architect.test.options.styles = [STYLES];
    base.overwrite('/angular.json', JSON.stringify(workspace, null, 2));

    const tree = await zenit.runSchematic('ng-add', { project: APP }, base);
    expect(styles(tree, 'test')).toEqual([
      'zenit-ui/styles/tokens.css',
      '@angular/cdk/overlay-prebuilt.css',
      'zenit-ui/styles/zenit-ui.css',
      STYLES,
    ]);
  });

  it('uses the only application when no project is given', async () => {
    const tree = await zenit.runSchematic('ng-add', {}, await workspaceWith());
    expect(styles(tree)[0]).toBe('zenit-ui/styles/tokens.css');
  });

  it('fails with a clear message for an unknown project', async () => {
    await expect(
      zenit.runSchematic('ng-add', { project: 'nope' }, await workspaceWith()),
    ).rejects.toThrow(/Project "nope" was not found in the workspace\. Known projects: probe\./);
  });
});

describe('ng-add --themes', () => {
  const APP_CONFIG = 'projects/probe/src/app/app.config.ts';
  let tree: UnitTestTree;

  function production(from: UnitTestTree): Record<string, unknown> {
    const workspace = JSON.parse(from.readContent('/angular.json'));

    return workspace.projects[APP].architect.build.configurations.production;
  }

  beforeAll(async () => {
    tree = await zenit.runSchematic(
      'ng-add',
      { project: APP, themes: true },
      await workspaceWith(),
    );
  });

  it('puts the init script in front of everything that loads, right after the charset', () => {
    const html = tree.readContent(INDEX);
    const script = `<script>${zenitThemeInitScript()}</script>`;

    expect(html).toContain(script);
    expect(html.match(/zenit-theme-init/g)).toHaveLength(1);
    expect(html.indexOf('<meta charset')).toBeLessThan(html.indexOf(script));
    expect(html.indexOf(script)).toBeLessThan(html.indexOf('<title>'));
    expect(html.indexOf(script)).toBeLessThan(html.indexOf('<link'));
    // The charset declaration has to stay within the first 1024 bytes.
    expect(html.indexOf('<meta charset')).toBeLessThan(1024);
  });

  it('makes the script the first child of <head> when there is no charset', async () => {
    const base = await workspaceWith();
    base.overwrite(INDEX, '<html>\n<head>\n  <title>x</title>\n</head>\n<body></body>\n</html>\n');
    const result = await zenit.runSchematic('ng-add', { project: APP, themes: true }, base);

    expect(result.readContent(INDEX)).toMatch(/<head>\n {2}<!-- zenit-theme-init/);
  });

  it('switches inlineCritical off for production and keeps the rest optimised', () => {
    expect(production(tree)['optimization']).toEqual({
      scripts: true,
      fonts: true,
      styles: { minify: true, removeSpecialComments: true, inlineCritical: false },
    });
  });

  it('keeps an existing optimization object and an explicit false', async () => {
    const withSetting = async (optimization: unknown) => {
      const base = await workspaceWith();
      const workspace = JSON.parse(base.readContent('/angular.json'));
      workspace.projects[APP].architect.build.configurations.production.optimization = optimization;
      base.overwrite('/angular.json', JSON.stringify(workspace, null, 2));

      return production(await zenit.runSchematic('ng-add', { project: APP, themes: true }, base))[
        'optimization'
      ];
    };

    expect(await withSetting({ scripts: false, styles: { minify: false } })).toEqual({
      scripts: false,
      styles: { minify: false, removeSpecialComments: true, inlineCritical: false },
    });
    expect(await withSetting(false)).toBe(false);
    expect(await withSetting({ styles: false })).toEqual({ styles: false });
  });

  it('adds provideZenitTheme() to the application config', () => {
    const config = tree.readContent(APP_CONFIG);

    expect(config).toMatch(/import \{[^}]*provideZenitTheme[^}]*\} from 'zenit-ui'/);
    expect(config).toMatch(/providers:\s*\[[^\]]*provideZenitTheme\(\)/s);
  });

  it('changes nothing on a second run', async () => {
    const before = snapshot(tree);
    const again = await zenit.runSchematic('ng-add', { project: APP, themes: true }, tree);

    expect(snapshot(again)).toEqual(before);
  });

  it('leaves a provider with a config alone', async () => {
    const base = await workspaceWith();
    const config = base
      .readContent(APP_CONFIG)
      .replace('providers: [', "providers: [provideZenitTheme({ defaultScheme: 'system' }), ");
    base.overwrite(APP_CONFIG, `import { provideZenitTheme } from 'zenit-ui';\n${config}`);
    const result = await zenit.runSchematic('ng-add', { project: APP, themes: true }, base);

    expect(result.readContent(APP_CONFIG).match(/provideZenitTheme\(/g)).toHaveLength(1);
  });

  it('touches neither index.html nor the config without --themes', async () => {
    const result = await zenit.runSchematic('ng-add', { project: APP }, await workspaceWith());

    expect(result.readContent(INDEX)).not.toContain('zenit-theme-init');
    expect(result.readContent(APP_CONFIG)).not.toContain('provideZenitTheme');
    expect(production(result)['optimization']).toBeUndefined();
  });
});

describe('theme init script', () => {
  const root = join(here, '..', '..', '..', '..');
  const read = (path: string) => readFileSync(join(root, path), 'utf8');

  it('is a byte copy of the library source', () => {
    expect(read('projects/zenit-ui/schematics/ng-add/init-script.ts')).toBe(
      read('projects/zenit-ui/src/lib/theme/init-script.ts'),
    );
  });

  it('is what the index.html of both applications carries, with their config', () => {
    // The configs are the ones passed to provideZenitTheme() in each app.config.ts.
    expect(read('projects/ui-demo/src/index.html')).toContain(
      `<script>${zenitThemeInitScript()}</script>`,
    );
    expect(read('projects/beispiel-app/src/index.html')).toContain(
      `<script>${zenitThemeInitScript({ defaultScheme: 'system' })}</script>`,
    );
    expect(read('projects/ui-demo/src/app/app.config.ts')).toContain('provideZenitTheme()');
    expect(read('projects/beispiel-app/src/app/app.config.ts')).toContain(
      "provideZenitTheme({ defaultScheme: 'system' })",
    );
  });
});

// ----------------------------------------------------------------------------
// Regressions from the consumer review. One block per finding.
// ----------------------------------------------------------------------------

const APP_CONFIG = 'projects/probe/src/app/app.config.ts';

interface TargetJson {
  builder: string;
  options: Record<string, unknown>;
  configurations: Record<string, Record<string, unknown>>;
}

/** Runs `ng-add` and returns the tree together with everything it logged. */
async function run(
  options: Record<string, unknown>,
  base: UnitTestTree,
): Promise<{ tree: UnitTestTree; log: string }> {
  const messages: string[] = [];
  const subscription = zenit.logger.subscribe((entry) => messages.push(entry.message));
  try {
    const tree = await zenit.runSchematic('ng-add', { project: APP, ...options }, base);

    return { tree, log: messages.join('\n') };
  } finally {
    subscription.unsubscribe();
  }
}

/** Edits a target of the fixture application in `angular.json`. */
function editTarget(tree: UnitTestTree, edit: (target: TargetJson) => void, target = 'build') {
  const workspace = JSON.parse(tree.readContent('/angular.json'));
  edit(workspace.projects[APP].architect[target]);
  tree.overwrite('/angular.json', JSON.stringify(workspace, null, 2));
}

/** A root component with the given metadata lines, in the given order. */
function rootComponent(...metadata: string[]): string {
  return [
    "import { Component } from '@angular/core';",
    "import { RouterOutlet } from '@angular/router';",
    '',
    '@Component({',
    ...metadata.map((line) => `  ${line}`),
    '})',
    'export class App {}',
    '',
  ].join('\n');
}

const SELECTOR = "selector: 'app-root',";
const TEMPLATE = 'template: `<router-outlet />`,';
const IMPORTS = 'imports: [RouterOutlet],';
const PATCHED_TEMPLATE = 'template: `<router-outlet />\n    <z-toast-outlet />\n  `,';

describe('ng-add, root component in one pass (finding 1)', () => {
  async function patched(...metadata: string[]) {
    const base = await workspaceWith();
    base.overwrite(APP_TS, rootComponent(...metadata));

    return run({}, base);
  }

  it('patches a component whose inline template comes before its imports', async () => {
    const { tree } = await patched(SELECTOR, TEMPLATE, IMPORTS);

    expect(tree.readContent(APP_TS)).toBe(
      [
        "import { Component } from '@angular/core';",
        "import { RouterOutlet } from '@angular/router';",
        "import { ZToastOutlet } from 'zenit-ui';",
        '',
        '@Component({',
        "  selector: 'app-root',",
        `  ${PATCHED_TEMPLATE}`,
        '  imports: [RouterOutlet, ZToastOutlet],',
        '})',
        'export class App {}',
        '',
      ].join('\n'),
    );

    const again = await run({}, tree);
    expect(again.tree.readContent(APP_TS)).toBe(tree.readContent(APP_TS));
  });

  it('patches a component whose imports come before its inline template', async () => {
    const { tree } = await patched(SELECTOR, IMPORTS, TEMPLATE);
    const component = tree.readContent(APP_TS);

    expect(component).toContain('imports: [RouterOutlet, ZToastOutlet],');
    expect(component).toContain(PATCHED_TEMPLATE);
    expect(component.match(/ZToastOutlet/g)).toHaveLength(2);
  });

  it('adds the imports property to a component that has a template only', async () => {
    const { tree } = await patched(SELECTOR, TEMPLATE);
    const component = tree.readContent(APP_TS);

    expect(component).toContain('@Component({\n  imports: [ZToastOutlet],\n  selector:');
    expect(component).toContain(PATCHED_TEMPLATE);
    expect(component.match(/ZToastOutlet/g)).toHaveLength(2);
  });

  it('leaves a component with neither template nor templateUrl untouched', async () => {
    const { tree, log } = await patched(SELECTOR, IMPORTS);

    expect(tree.readContent(APP_TS)).toBe(rootComponent(SELECTOR, IMPORTS));
    expect(log).toMatch(/Toast outlet: .*neither a "templateUrl" nor a "template"/);
    expect(log).not.toContain('mounted in the root component');
  });

  it('puts the tag after the last line of a multi-line template, without trailing spaces', async () => {
    const { tree } = await patched(
      'template: `\n    <h1>x</h1>\n    <router-outlet />\n  `,',
      IMPORTS,
    );

    expect(tree.readContent(APP_TS)).toContain(
      'template: `\n    <h1>x</h1>\n    <router-outlet />\n    <z-toast-outlet />\n  `,\n' +
        '  imports: [RouterOutlet, ZToastOutlet],',
    );
  });

  it('patches the component that is bootstrapped, not the first one in the file', async () => {
    const base = await workspaceWith();
    const helper =
      "@Component({ selector: 'app-helper', template: `<p>x</p>` })\nclass Helper {}\n";
    base.overwrite(
      APP_TS,
      rootComponent(SELECTOR, TEMPLATE, IMPORTS).replace('@Component', `${helper}\n@Component`),
    );
    const { tree } = await run({}, base);

    expect(tree.readContent(APP_TS)).toContain(helper);
    expect(tree.readContent(APP_TS)).toContain('imports: [RouterOutlet, ZToastOutlet],');
  });
});

describe('ng-add, imports that are not an array literal (finding 2)', () => {
  it.each([
    ['an identifier', 'imports: SHARED,'],
    ['a spread only', 'imports: [...SHARED],'],
    ['a call expression', 'imports: shared(),'],
    ['a shorthand property', 'imports,'],
  ])('changes nothing when imports are %s', async (_label, imports) => {
    const original = rootComponent(SELECTOR, TEMPLATE, imports);
    const base = await workspaceWith();
    base.overwrite(APP_TS, original);
    const { tree, log } = await run({}, base);

    expect(tree.readContent(APP_TS)).toBe(original);
    expect(log).toMatch(/Toast outlet: the "imports" of .*app\.ts are not a plain array literal/);
    expect(log).toContain("import { ZToastOutlet } from 'zenit-ui'");
  });

  it('leaves the external template alone as well', async () => {
    const base = await workspaceWith();
    const html = base.readContent(APP_HTML);
    base.overwrite(
      APP_TS,
      base.readContent(APP_TS).replace(/imports: \[[^\]]*\]/, 'imports: SHARED'),
    );
    const { tree } = await run({}, base);

    expect(tree.readContent(APP_HTML)).toBe(html);
    expect(tree.readContent(APP_TS)).not.toContain('ZToastOutlet');
  });
});

describe('ng-add, global stylesheet (finding 3)', () => {
  const PACKAGE_CSS = 'node_modules/material-icons/iconfont/material-icons.css';

  it('never writes the font imports into a file under node_modules', async () => {
    const base = await workspaceWith();
    base.create(PACKAGE_CSS, '/* package */\n');
    editTarget(base, (build) => (build.options['styles'] = [PACKAGE_CSS, STYLES]));
    const { tree } = await run({}, base);

    expect(tree.readContent(PACKAGE_CSS)).toBe('/* package */\n');
    expect(tree.readContent(STYLES).startsWith('/* Fonts self-hosted')).toBe(true);
  });

  it('logs the manual step when no stylesheet of the project is registered', async () => {
    const base = await workspaceWith();
    const own = base.readContent(STYLES);
    base.create(PACKAGE_CSS, '/* package */\n');
    editTarget(base, (build) => (build.options['styles'] = [PACKAGE_CSS]));
    const { tree, log } = await run({}, base);

    expect(tree.readContent(PACKAGE_CSS)).toBe('/* package */\n');
    expect(tree.readContent(STYLES)).toBe(own);
    expect(log).toMatch(/Fonts: no \.css, \.scss or \.less file inside the project/);
    expect(log).not.toContain('Font imports at the top');
  });
});

describe('ng-add, style entries (finding 4)', () => {
  it('recognises the node_modules/ spelling instead of duplicating it', async () => {
    const base = await workspaceWith();
    editTarget(
      base,
      (build) =>
        (build.options['styles'] = [
          STYLES,
          'node_modules/zenit-ui/styles/zenit-ui.css',
          'node_modules/zenit-ui/styles/tokens.css',
        ]),
    );
    const { tree } = await run({}, base);

    expect(styles(tree)).toEqual([
      'node_modules/zenit-ui/styles/tokens.css',
      '@angular/cdk/overlay-prebuilt.css',
      'node_modules/zenit-ui/styles/zenit-ui.css',
      STYLES,
    ]);
  });

  it('keeps the extra keys of a managed entry in object form', async () => {
    const entry = { input: 'zenit-ui/styles/zenit-ui.css', bundleName: 'zenit', inject: false };
    const base = await workspaceWith();
    editTarget(base, (build) => (build.options['styles'] = [STYLES, entry]));
    const { tree } = await run({}, base);

    expect(styles(tree)).toEqual([
      'zenit-ui/styles/tokens.css',
      '@angular/cdk/overlay-prebuilt.css',
      entry,
      STYLES,
    ]);
  });

  it('keeps themes.css in its place when run again without --themes', async () => {
    const first = await run({ themes: true }, await workspaceWith());
    const second = await run({}, first.tree);

    expect(styles(second.tree)).toEqual([
      'zenit-ui/styles/tokens.css',
      'zenit-ui/styles/themes.css',
      '@angular/cdk/overlay-prebuilt.css',
      'zenit-ui/styles/zenit-ui.css',
      STYLES,
    ]);
  });

  it('warns about a configuration that overrides styles and leaves it alone', async () => {
    const base = await workspaceWith();
    editTarget(base, (build) => (build.configurations['production']['styles'] = [STYLES]));
    const { tree, log } = await run({}, base);
    const workspace = JSON.parse(tree.readContent('/angular.json'));

    expect(workspace.projects[APP].architect.build.configurations.production.styles).toEqual([
      STYLES,
    ]);
    expect(log).toMatch(
      /configuration\(s\) "production" of the "build" target set their own "styles"/,
    );
  });
});

describe('ng-add, index.html (finding 5)', () => {
  const NASTY = [
    '<!doctype html>',
    '<!-- <html lang="x"> and <body> of the old shell -->',
    '<HTML',
    '  data-note="a > b"',
    '  class=app>',
    '<head>',
    '  <script>const tag = "<body>";</script>',
    '  <meta charset="utf-8">',
    '  <title>x</title>',
    '</head>',
    "<BODY class='shell'>",
    '</BODY>',
    '</HTML>',
    '',
  ].join('\n');

  it('patches the real tags: comment, raw text, ">" in a value, unquoted and single-quoted', async () => {
    const base = await workspaceWith();
    base.overwrite(INDEX, NASTY);
    const { tree } = await run({ themes: true }, base);
    const html = tree.readContent(INDEX);

    expect(html).toContain('<!-- <html lang="x"> and <body> of the old shell -->');
    expect(html).toContain('<HTML lang="de"\n  data-note="a > b"\n  class="app z-root">');
    expect(html).toContain('<script>const tag = "<body>";</script>');
    expect(html).toContain('<BODY class="shell z-root">');
    expect(html.match(/z-root/g)).toHaveLength(2);
    expect(html).toMatch(/<meta charset="utf-8">\n {2}<!-- zenit-theme-init/);

    const again = await run({ themes: true }, tree);
    expect(again.tree.readContent(INDEX)).toBe(html);
  });

  it('keeps an existing lang and a class list that already has z-root', async () => {
    const base = await workspaceWith();
    const original =
      '<html class="z-root a" lang=fr>\n<head></head>\n<body class="z-root"></body>\n</html>\n';
    base.overwrite(INDEX, original);
    const { tree } = await run({}, base);

    expect(tree.readContent(INDEX)).toBe(original);
  });

  it('leaves index.html untouched when a tag it needs is missing', async () => {
    const base = await workspaceWith();
    const original = '<html>\n<body></body>\n</html>\n';
    base.overwrite(INDEX, original);
    const { tree, log } = await run({ themes: true }, base);

    expect(tree.readContent(INDEX)).toBe(original);
    expect(log).toMatch(/index\.html has no <head> tag and was left alone/);
  });

  it('scans tags without being fooled by comments, raw text and quoting', () => {
    const tags = openingTags('<!-- <a> --><style>b > <i></style><p title="x>y" hidden data-a=1/>');

    expect(tags.map((tag) => tag.name)).toEqual(['style', 'p']);
    expect(tags[1].attributes.map(({ name, value }) => [name, value])).toEqual([
      ['title', 'x>y'],
      ['hidden', undefined],
      ['data-a', '1/'],
    ]);
    expect(openingTags('<html <!-- never closed')).toEqual([]);
  });

  it('plans the script after an http-equiv charset and applies edits in one pass', () => {
    const html =
      '<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body></body></html>\n';
    const plan = planIndexHtml(html, ['<!-- marker -->']);

    expect(plan.missing).toEqual([]);
    expect(applyEdits(html, plan.edits)).toContain('charset=utf-8">\n<!-- marker --></head>');
    expect(applyEdits(html, plan.edits)).toContain('<html lang="de" class="z-root">');
  });
});

describe('ng-add, project selection (finding 6)', () => {
  it('refuses a library instead of writing styles into ng-packagr options', async () => {
    const base = await angular.runSchematic('library', { name: 'lib' }, await workspaceWith());
    const before = base.readContent('/angular.json');

    await expect(zenit.runSchematic('ng-add', { project: 'lib' }, base)).rejects.toThrow(
      /Project "lib" is not an application .*Applications of this workspace: probe\./,
    );
    expect(base.readContent('/angular.json')).toBe(before);
  });

  it('fails without --project when the workspace has no application', async () => {
    const base = await angular.runSchematic('workspace', {
      name: 'probe-workspace',
      version: '22.0.0',
      newProjectRoot: 'projects',
    });
    const withLibrary = await angular.runSchematic('library', { name: 'lib' }, base);

    await expect(zenit.runSchematic('ng-add', {}, withLibrary)).rejects.toThrow(
      /The workspace has no application/,
    );
  });

  it('fails without --project when there are several applications, and lists them', async () => {
    const base = await angular.runSchematic(
      'application',
      { name: 'second', skipTests: true },
      await workspaceWith(),
    );

    await expect(zenit.runSchematic('ng-add', {}, base)).rejects.toThrow(
      /several applications: probe, second\. Name one with --project\./,
    );
  });

  it('logs the name of the only application when --project is omitted', async () => {
    const { log } = await run({ project: undefined }, await workspaceWith());

    expect(log).toContain('using the only application "probe"');
    expect(log).not.toContain('undefined');
  });

  it('refuses an application whose build target is not an application builder', async () => {
    const base = await workspaceWith();
    editTarget(base, (build) => (build.builder = '@angular/build:ng-packagr'));

    await expect(zenit.runSchematic('ng-add', { project: APP }, base)).rejects.toThrow(
      /Project "probe" has no application build target \(builder of "build": @angular\/build:ng-packagr\)/,
    );
  });
});

describe('ng-add, line endings and the outlet check (finding 7)', () => {
  const LONE_LF = /(^|[^\r])\n/;
  const crlf = (text: string) => text.replace(/\r?\n/g, '\r\n');

  it('inserts CRLF into CRLF files', async () => {
    const base = await workspaceWith();
    const files = ['/angular.json', '/package.json', INDEX, STYLES, APP_TS, APP_HTML, APP_CONFIG];
    for (const path of files) {
      base.overwrite(path, crlf(base.readContent(path)));
    }
    const { tree } = await run({ themes: true }, base);

    for (const path of files) {
      expect(tree.readContent(path), path).not.toMatch(LONE_LF);
    }
    expect(tree.readContent(APP_HTML)).toContain('\r\n\r\n<z-toast-outlet />\r\n');
    expect(tree.readContent(STYLES)).toContain("@import '@fontsource/inter/400.css';\r\n");
  });

  it('inserts CRLF into an inline template and a config without providers', async () => {
    const base = await workspaceWith();
    base.overwrite(APP_TS, crlf(rootComponent(SELECTOR, TEMPLATE)));
    base.overwrite(
      APP_CONFIG,
      crlf(
        "import { ApplicationConfig } from '@angular/core';\n\nexport const appConfig: ApplicationConfig = {};\n",
      ),
    );
    const { tree } = await run({ themes: true }, base);

    expect(tree.readContent(APP_TS)).not.toMatch(LONE_LF);
    expect(tree.readContent(APP_TS)).toContain('<z-toast-outlet />');
    expect(tree.readContent(APP_CONFIG)).not.toMatch(LONE_LF);
    expect(tree.readContent(APP_CONFIG)).toContain('providers: [provideZenitTheme()]');
  });

  it('mounts the outlet although a comment mentions z-toast-outlet', async () => {
    const base = await workspaceWith();
    base.overwrite(APP_HTML, '<!-- TODO: add <z-toast-outlet /> here -->\n<router-outlet />\n');
    const { tree } = await run({}, base);

    expect(tree.readContent(APP_HTML)).toMatch(/<router-outlet \/>\n\n<z-toast-outlet \/>\n$/);
    expect(tree.readContent(APP_TS)).toMatch(/imports:\s*\[[^\]]*ZToastOutlet/);
  });
});

describe('ng-add, NgModule application (finding 8)', () => {
  it('leaves the files alone and names the steps for a module', async () => {
    const base = await angular.runSchematic(
      'application',
      { name: APP, standalone: false, skipTests: true },
      await angular.runSchematic('workspace', {
        name: 'probe-workspace',
        version: '22.0.0',
        newProjectRoot: 'projects',
      }),
    );
    const sources = base.files.filter((path) => path.includes('/src/app/'));
    const before = sources.map((path) => base.readContent(path));
    const { tree, log } = await run({ themes: true }, base);

    expect(sources.map((path) => tree.readContent(path))).toEqual(before);
    expect(log).toMatch(/Toast outlet: .*main\.ts bootstraps an NgModule/);
    expect(log).toContain('to the "imports" of the NgModule that declares your root component');
    expect(log).toContain('to the "providers" of your root NgModule');
    expect(log).not.toContain('was not found');
    expect(log).not.toContain('mounted in the root component');
  });
});

describe('ng-add, lang (finding 10)', () => {
  it('leaves lang="en" of a fresh application and says so', async () => {
    const { tree, log } = await run({}, await workspaceWith());

    expect(tree.readContent(INDEX)).toContain('<html lang="en" class="z-root">');
    expect(log).toContain('lang left as "en": set it to your UI language');
  });

  it('sets lang="de" only when <html> has none, without a note', async () => {
    const base = await workspaceWith();
    base.overwrite(INDEX, base.readContent(INDEX).replace(' lang="en"', ''));
    const { tree, log } = await run({}, base);

    expect(tree.readContent(INDEX)).toContain('<html lang="de" class="z-root">');
    expect(log).not.toContain('lang left as');
  });
});
