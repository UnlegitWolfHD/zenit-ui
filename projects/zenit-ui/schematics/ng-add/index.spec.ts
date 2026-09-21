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

  it('falls back to the first application when no project is given', async () => {
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
