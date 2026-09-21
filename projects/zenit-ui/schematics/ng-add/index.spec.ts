/**
 * Unit tests of the `ng add zenit-ui` schematic.
 *
 * The runner loads the *compiled* collection from `dist/zenit-ui/schematics`,
 * so `node tools/build-schematics.mjs` has to run first. `node
 * tools/test-schematics.mjs` does both in one step.
 */
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

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
