/**
 * Tests of `ng generate zenit-ui:migrate-material` through the schematics
 * engine: which files are read and written, the report, idempotency.
 *
 * The runner loads the *compiled* collection from `dist/zenit-ui/schematics`;
 * `node tools/test-schematics.mjs` builds it first. The rules themselves are
 * covered in `template.spec.ts` and `component.spec.ts`.
 */
import { HostTree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import type { Report } from './report';

const nodeRequire = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const zenit = new SchematicTestRunner(
  'zenit-ui',
  join(here, '..', '..', '..', '..', 'dist', 'zenit-ui', 'schematics', 'collection.json'),
);

const REPORT = '/zenit-migration-report.md';
const JSON_REPORT = '/zenit-migration-report.json';

function treeWith(files: Record<string, string>): UnitTestTree {
  const tree = new UnitTestTree(new HostTree());
  for (const [path, content] of Object.entries(files)) {
    tree.create(path, content);
  }

  return tree;
}

async function migrate(tree: UnitTestTree, options: Record<string, unknown>) {
  const logs: string[] = [];
  const subscription = zenit.logger.subscribe((entry) => logs.push(entry.message));
  try {
    const out = await zenit.runSchematic('migrate-material', options, tree);

    return { tree: out, logs: logs.join('\n') };
  } finally {
    subscription.unsubscribe();
  }
}

function snapshot(tree: UnitTestTree): Record<string, string> {
  return Object.fromEntries(tree.files.map((path) => [path, tree.readContent(path)]));
}

const report = (tree: UnitTestTree, path = JSON_REPORT): Report =>
  JSON.parse(tree.readContent(path));

/** `kind:code` of every finding of a file, in report order. */
function codes(tree: UnitTestTree, file: string, path = JSON_REPORT): string[] {
  return (
    report(tree, path)
      .files.find((entry) => entry.path === file)
      ?.findings.map((finding) => `${finding.kind}:${finding.code}`) ?? []
  );
}

const componentTs = (name: string, extra = '') => `import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-${name}',
  imports: [MatButtonModule, MatIconModule],
  ${extra || `templateUrl: './${name}.html'`},
})
export class Page {}
`;
const MIGRATED_TS = (name: string, extra = '') => `import { Component } from '@angular/core';
import { ZButton, ZIcon } from 'zenit-ui';

@Component({
  selector: 'app-${name}',
  imports: [ZButton, ZIcon],
  ${extra || `templateUrl: './${name}.html'`},
})
export class Page {}
`;
const HTML = '<button type="button" mat-button><mat-icon>add</mat-icon>Neu</button>\n';
const MIGRATED_HTML = '<button type="button" zBtn="ghost"><z-icon name="add" />Neu</button>\n';

describe('scope', () => {
  const files = {
    '/src/app/a/a.ts': componentTs('a'),
    '/src/app/a/a.html': HTML,
    '/src/app/b/b.ts': componentTs('b'),
    '/src/app/b/b.html': HTML,
  };

  it('migrates the templates and components below a folder, and nothing else', async () => {
    const { tree } = await migrate(treeWith(files), { path: 'src/app/a' });
    expect(tree.readContent('/src/app/a/a.html')).toBe(MIGRATED_HTML);
    expect(tree.readContent('/src/app/a/a.ts')).toBe(MIGRATED_TS('a'));
    expect(tree.readContent('/src/app/b/b.html')).toBe(HTML);
    expect(tree.readContent('/src/app/b/b.ts')).toBe(componentTs('b'));
    expect(tree.files.sort()).toEqual([...Object.keys(files), JSON_REPORT, REPORT].sort());
  });

  it.each(['src\\app\\a', './src/app/a/', '/src/app/a', 'src/app/x/../a'])(
    'takes the path as %s',
    async (path) => {
      const { tree } = await migrate(treeWith(files), { path });
      expect(tree.readContent('/src/app/a/a.html')).toBe(MIGRATED_HTML);
      expect(tree.readContent('/src/app/b/b.html')).toBe(HTML);
      expect(report(tree).path).toBe('src/app/a');
    },
  );

  it('takes an absolute Windows path below the working directory', async () => {
    const { tree } = await migrate(treeWith(files), { path: `${process.cwd()}\\src\\app\\a` });
    expect(tree.readContent('/src/app/a/a.html')).toBe(MIGRATED_HTML);
    await expect(migrate(treeWith(files), { path: 'Q:\\elsewhere\\src' })).rejects.toThrow(
      /outside the workspace/,
    );
  });

  it('migrates a single template and names the imports it could not reach', async () => {
    const { tree } = await migrate(treeWith(files), { path: 'src/app/a/a.html' });
    expect(tree.readContent('/src/app/a/a.html')).toBe(MIGRATED_HTML);
    expect(tree.readContent('/src/app/a/a.ts')).toBe(componentTs('a'));
    expect(codes(tree, 'src/app/a/a.html')).toEqual(['manual:imports-owner-outside-path']);
    expect(report(tree).files[0].findings[0].fix).toContain('ZButton, ZIcon');
  });

  it('does not touch a template outside the path, even when a component inside names it', async () => {
    const { tree } = await migrate(treeWith(files), { path: 'src/app/a/a.ts' });
    expect(tree.readContent('/src/app/a/a.html')).toBe(HTML);
    expect(tree.readContent('/src/app/a/a.ts')).toBe(componentTs('a'));
    expect(codes(tree, 'src/app/a/a.ts')).toEqual(['manual:template-outside-path']);

    const shared = treeWith({
      '/src/app/a/a.ts': componentTs('a', `templateUrl: '../shared/list.html'`),
      '/src/app/shared/list.html': HTML,
    });
    const before = snapshot(shared);
    const out = (await migrate(shared, { path: 'src/app/a' })).tree;
    expect(snapshot(out)).toMatchObject(before);
    expect(codes(out, 'src/app/a/a.ts')).toEqual(['manual:template-outside-path']);
  });

  it('reports a templateUrl that leads nowhere', async () => {
    const tree = treeWith({ '/src/a.ts': componentTs('a', `templateUrl: './gone.html'`) });
    expect(codes((await migrate(tree, { path: 'src' })).tree, 'src/a.ts')).toEqual([
      'manual:template-missing',
    ]);
  });

  it('skips node_modules, dist and dot folders below the path', async () => {
    const tree = treeWith({
      '/src/a.html': HTML,
      '/node_modules/lib/a.html': HTML,
      '/dist/a.html': HTML,
      '/.angular/cache/a.html': HTML,
    });
    const out = (await migrate(tree, { path: '.' })).tree;
    expect(out.readContent('/src/a.html')).toBe(MIGRATED_HTML);
    for (const path of ['/node_modules/lib/a.html', '/dist/a.html', '/.angular/cache/a.html']) {
      expect(out.readContent(path)).toBe(HTML);
    }
    expect(report(out).totals.filesScanned).toBe(1);
  });

  it('refuses a path that does not exist, leaves the workspace or is not source code', async () => {
    await expect(migrate(treeWith(files), { path: 'src/app/nope' })).rejects.toThrow(
      /was not found/,
    );
    await expect(migrate(treeWith(files), { path: '../other' })).rejects.toThrow(
      /outside the workspace/,
    );
    await expect(
      migrate(treeWith({ '/node_modules/x/a.html': HTML }), { path: 'node_modules/x' }),
    ).rejects.toThrow(/not source code/);
    await expect(migrate(treeWith(files), { path: ' ' })).rejects.toThrow(/--path is required/);
  });

  it('resolves --project: sourceRoot-relative paths work, other projects are refused', async () => {
    const angular = new SchematicTestRunner(
      '@schematics/angular',
      join(dirname(nodeRequire.resolve('@schematics/angular/package.json')), 'collection.json'),
    );
    let tree = await angular.runSchematic('workspace', {
      name: 'ws',
      version: '22.0.0',
      newProjectRoot: 'projects',
    });
    tree = await angular.runSchematic('application', { name: 'one', skipTests: true }, tree);
    tree = await angular.runSchematic('application', { name: 'two', skipTests: true }, tree);
    tree.create('/projects/one/src/app/billing/b.html', HTML);
    tree.create('/projects/two/src/app/billing/b.html', HTML);

    await expect(migrate(tree, { path: 'projects/two/src/app', project: 'one' })).rejects.toThrow(
      /outside the project "one"/,
    );
    await expect(migrate(tree, { path: 'app', project: 'three' })).rejects.toThrow(
      /Known projects: one, two/,
    );

    const out = (await migrate(tree, { path: 'app/billing', project: 'one' })).tree;
    expect(out.readContent('/projects/one/src/app/billing/b.html')).toBe(MIGRATED_HTML);
    expect(out.readContent('/projects/two/src/app/billing/b.html')).toBe(HTML);
    expect(report(out).path).toBe('projects/one/src/app/billing');
  });
});

describe('inline templates', () => {
  it('edits a template literal in place', async () => {
    const template =
      'template: `\n    <button type="button" mat-button><mat-icon>add</mat-icon>Neu</button>\n  `';
    const tree = treeWith({ '/src/a.ts': componentTs('a', template) });
    const out = (await migrate(tree, { path: 'src' })).tree;
    expect(out.readContent('/src/a.ts')).toBe(
      MIGRATED_TS(
        'a',
        'template: `\n    <button type="button" zBtn="ghost"><z-icon name="add" />Neu</button>\n  `',
      ),
    );
    expect(report(out).files[0]).toMatchObject({
      path: 'src/a.ts',
      status: 'changed',
      converted: { icon: 1, button: 1, imports: 1 },
    });
  });

  it('edits a plain string with the quote the string allows', async () => {
    const single = (
      await migrate(
        treeWith({
          '/src/a.ts': componentTs(
            'a',
            `template: '<button type="button" mat-button><mat-icon>add</mat-icon></button>'`,
          ),
        }),
        { path: 'src' },
      )
    ).tree;
    expect(single.readContent('/src/a.ts')).toBe(
      MIGRATED_TS(
        'a',
        `template: '<button type="button" zBtn="ghost"><z-icon name="add" /></button>'`,
      ),
    );
    const double = (
      await migrate(
        treeWith({
          '/src/a.ts': componentTs(
            'a',
            `template: "<button type='button' mat-button><mat-icon>add</mat-icon></button>"`,
          ),
        }),
        { path: 'src' },
      )
    ).tree;
    expect(double.readContent('/src/a.ts')).toBe(
      MIGRATED_TS(
        'a',
        `template: "<button type='button' zBtn='ghost'><z-icon name='add' /></button>"`,
      ),
    );
  });

  it('only reports a template with ${}, and leaves the imports alone', async () => {
    const text = componentTs('a', 'template: `<mat-icon>${ICON}</mat-icon>`');
    const out = (await migrate(treeWith({ '/src/a.ts': text }), { path: 'src' })).tree;
    expect(out.readContent('/src/a.ts')).toBe(text);
    expect(codes(out, 'src/a.ts')).toEqual(['manual:template-not-literal']);
  });

  it('reports findings of an inline template at their line in the component file', async () => {
    const text = componentTs('a', 'template: `\n    <mat-icon svgIcon="logo"></mat-icon>\n  `');
    const out = (await migrate(treeWith({ '/src/a.ts': text }), { path: 'src' })).tree;
    const [finding] = report(out).files[0].findings;
    // MatButtonModule has no selector left and goes, which moves the icon up by one line.
    expect(finding).toMatchObject({ code: 'icon-registry', line: 8, column: 5 });
    expect(out.readContent('/src/a.ts').split('\n')[7]).toBe(
      '    <mat-icon svgIcon="logo"></mat-icon>',
    );
  });
});

describe('guarantees', () => {
  const files = {
    '/src/page.ts': componentTs('page'),
    '/src/page.html': `<button mat-icon-button matTooltip="Neu"\n  matTooltipPosition="above"><mat-icon>add</mat-icon></button>\n<button mat-fab type="button"><mat-icon svgIcon="logo"></mat-icon></button>\n<mat-form-field><input matInput></mat-form-field>\n`,
  };

  it('changes nothing in a second run and keeps the report of the first', async () => {
    const first = (await migrate(treeWith(files), { path: 'src' })).tree;
    const afterFirst = snapshot(first);
    const second = await migrate(first, { path: 'src' });
    expect(snapshot(second.tree)).toEqual(afterFirst);
    expect(second.logs).toContain('0 changed, 0 spots converted');
    expect(second.logs).toContain('existing report zenit-migration-report.md was kept');

    // Written elsewhere, the second report shows zero conversions and the same manual spots.
    const again = (await migrate(second.tree, { path: 'src', report: 'second.md' })).tree;
    const one = report(again);
    const two = report(again, '/second.json');
    // icon button, tooltip, icon and the imports of the component
    expect(one.totals).toMatchObject({ filesChanged: 2, converted: 4 });
    expect(two.totals).toMatchObject({ filesChanged: 0, converted: 0 });
    const manual = (r: Report) =>
      r.files.flatMap((file) =>
        file.findings
          .filter((f) => f.kind === 'manual')
          .map((f) => `${file.path}:${f.rule}:${f.code}`),
      );
    expect(manual(two)).toEqual(manual(one));
    expect(manual(two)).toEqual([
      'src/page.html:button:button-fab',
      'src/page.html:icon:icon-registry',
    ]);
    expect(two.remaining).toEqual(one.remaining);

    // And a third run reproduces the second byte for byte.
    const third = (await migrate(again, { path: 'src', report: 'third.md' })).tree;
    expect(third.readContent('/third.md')).toBe(third.readContent('/second.md'));
    expect(third.readContent('/third.json')).toBe(third.readContent('/second.json'));
  });

  it('keeps a module whose selectors are still in the template', async () => {
    const out = (await migrate(treeWith(files), { path: 'src' })).tree;
    // The fab and the svg icon stayed, so both modules stay; the new symbols are added.
    expect(out.readContent('/src/page.ts')).toContain(
      'imports: [MatButtonModule, MatIconModule, ZButton, ZIcon, ZTooltip],',
    );
    expect(out.readContent('/src/page.ts')).toContain(
      `import { ZButton, ZIcon, ZTooltip } from 'zenit-ui';`,
    );
    expect(out.readContent('/src/page.ts')).toContain(`from '@angular/material/button';`);
  });

  it('is deterministic', async () => {
    const one = (await migrate(treeWith(files), { path: 'src' })).tree;
    const two = (await migrate(treeWith(files), { path: 'src' })).tree;
    expect(one.readContent(REPORT)).toBe(two.readContent(REPORT));
    expect(one.readContent(JSON_REPORT)).toBe(two.readContent(JSON_REPORT));
    expect(one.readContent(JSON_REPORT)).not.toMatch(/\\\\|\d{4}-\d{2}-\d{2}/);
  });

  it('runs a subset of the rules', async () => {
    const icons = (await migrate(treeWith(files), { path: 'src', rules: 'icon' })).tree;
    expect(icons.readContent('/src/page.html')).toContain(
      '<button mat-icon-button matTooltip="Neu"\n  matTooltipPosition="above"><z-icon name="add" /></button>',
    );
    expect(icons.readContent('/src/page.ts')).toBe(files['/src/page.ts']);
    expect(report(icons).rules).toEqual(['icon']);

    // The imports rule looks at the template as it is, so it can run later on its own.
    const imports = (await migrate(icons, { path: 'src', rules: ' imports ', report: 'r2.md' }))
      .tree;
    expect(imports.readContent('/src/page.html')).toBe(icons.readContent('/src/page.html'));
    expect(imports.readContent('/src/page.ts')).toContain(
      'imports: [MatButtonModule, MatIconModule, ZIcon],',
    );

    await expect(migrate(treeWith(files), { path: 'src', rules: 'icon,tabs' })).rejects.toThrow(
      /Unknown rule\(s\) in --rules: tabs\. Known rules: icon, button, tooltip, spinner, chip, imports/,
    );
  });

  it('does not touch a template that does not parse, nor its component', async () => {
    const broken = '<div><mat-icon>add</mat-icon>\n</span>\n';
    const tree = treeWith({
      '/src/bad.ts': componentTs('bad'),
      '/src/bad.html': broken,
      '/src/inline.ts': componentTs('inline', 'template: `<div><mat-icon>add</mat-icon></span>`'),
      '/src/good.ts': componentTs('good'),
      '/src/good.html': HTML,
    });
    const out = (await migrate(tree, { path: 'src' })).tree;
    expect(out.readContent('/src/bad.html')).toBe(broken);
    expect(out.readContent('/src/bad.ts')).toBe(componentTs('bad'));
    expect(out.readContent('/src/inline.ts')).toBe(
      componentTs('inline', 'template: `<div><mat-icon>add</mat-icon></span>`'),
    );
    expect(out.readContent('/src/good.html')).toBe(MIGRATED_HTML);
    expect(out.readContent('/src/good.ts')).toBe(MIGRATED_TS('good'));

    const entry = report(out).files.find((file) => file.path === 'src/bad.html');
    expect(entry).toMatchObject({
      status: 'unparsed',
      findings: [{ kind: 'manual', code: 'template-unparsable', rule: 'parse' }],
    });
    expect(entry?.findings[0].reason).toContain('line 2');
    expect(codes(out, 'src/inline.ts')).toEqual(['manual:template-unparsable']);
  });

  it('keeps CRLF and a byte order mark', async () => {
    const crlf = (text: string) => text.replace(/\n/g, '\r\n');
    const tree = treeWith({
      '/src/a.ts': crlf(componentTs('a')),
      '/src/a.html': `\uFEFF${crlf(HTML)}`,
    });
    const out = (await migrate(tree, { path: 'src' })).tree;
    expect(out.readContent('/src/a.html')).toBe(`\uFEFF${crlf(MIGRATED_HTML)}`);
    expect(out.readContent('/src/a.ts')).toBe(crlf(MIGRATED_TS('a')));
    expect(out.read('/src/a.html')?.subarray(0, 3)).toEqual(Buffer.from([0xef, 0xbb, 0xbf]));
  });

  it('updates every component that shares a template, and migrates the template once', async () => {
    const tree = treeWith({
      '/src/a.ts': componentTs('a', `templateUrl: './shared.html'`),
      '/src/b.ts': componentTs('b', `templateUrl: './shared.html'`),
      '/src/shared.html': HTML,
    });
    const out = (await migrate(tree, { path: 'src' })).tree;
    expect(out.readContent('/src/a.ts')).toBe(MIGRATED_TS('a', `templateUrl: './shared.html'`));
    expect(out.readContent('/src/b.ts')).toBe(MIGRATED_TS('b', `templateUrl: './shared.html'`));
    expect(report(out).summary).toMatchObject({
      icon: { converted: 1 },
      button: { converted: 1 },
      imports: { converted: 2 },
    });
  });

  it('never edits a spec file or a stylesheet, and counts what they hold', async () => {
    const spec = `import { MatIconModule } from '@angular/material/icon';\nimport { MatButtonHarness } from '@angular/material/button/testing';\nTestBed.configureTestingModule({ imports: [MatIconModule] });\n`;
    const scss = readFileSync(
      join(here, 'fixtures', 'server-page', 'server-page.scss.txt'),
      'utf8',
    );
    const tree = treeWith({
      '/src/a.spec.ts': spec,
      '/src/a.scss': scss,
      '/src/plain.css': 'p { margin: 0 }\n',
    });
    const out = (await migrate(tree, { path: 'src' })).tree;
    expect(out.readContent('/src/a.spec.ts')).toBe(spec);
    expect(out.readContent('/src/a.scss')).toBe(scss);
    expect(codes(out, 'src/a.spec.ts')).toEqual(['manual:imports-spec']);
    expect(
      report(out).files.find((file) => file.path === 'src/a.spec.ts')?.findings[0].reason,
    ).toContain('MatButtonHarness, MatIconModule');
    expect(report(out).files.map((file) => file.path)).toEqual(['src/a.scss', 'src/a.spec.ts']);
    expect(report(out).files[0].styleDebt).toEqual({
      'mat-* element selectors': 2,
      '.mat-* / .mdc-* classes': 2,
      '--mat-* / --mdc-* properties': 2,
      '::ng-deep': 2,
      "@use '@angular/material'": 1,
    });
  });
});

describe('report', () => {
  const html = `<button mat-icon-button\n  matTooltip="Neu"\n  matTooltipPosition="above"\n  color="primary"><mat-icon>add</mat-icon></button>\n<mat-icon svgIcon="logo"></mat-icon>\n`;

  afterEach(() => {
    process.argv = process.argv.filter((argument) => argument !== '--dry-run');
  });

  it('refers to the lines after the run, because dropped attributes move them', async () => {
    const out = (await migrate(treeWith({ '/src/a.html': html }), { path: 'src' })).tree;
    expect(out.readContent('/src/a.html')).toBe(
      `<button zBtn="ghost" iconOnly\n  zTooltip="Neu"><z-icon name="add" /></button>\n<mat-icon svgIcon="logo"></mat-icon>\n`,
    );
    const file = report(out).files[0];
    expect(report(out).dryRun).toBe(false);
    expect(file.findings.map((f) => [f.line, f.column, f.code])).toEqual([
      [1, 1, 'button-colour'],
      [1, 1, 'button-no-name'],
      [1, 1, 'button-type'],
      [1, 1, 'imports-owner-outside-path'],
      [1, 1, 'tooltip-option'],
      [3, 1, 'icon-registry'],
    ]);
    expect(out.readContent(REPORT)).toContain('| 3:1 | icon | manual | icon-registry |');
    expect(out.readContent(REPORT)).toContain('- info `tooltip-option` x1, lines 1');
  });

  it('writes nothing in a dry run and prints the report, with the lines of the untouched files', async () => {
    process.argv.push('--dry-run');
    const tree = treeWith({ '/src/a.html': html, '/src/a.ts': componentTs('a') });
    const before = snapshot(tree);
    const { tree: out, logs } = await migrate(tree, { path: 'src' });
    expect(snapshot(out)).toEqual(before);
    expect(logs).toContain('2 would change');
    expect(logs).toContain('# zenit-ui migration report');
    expect(logs).toContain('Dry run: nothing was written');
    expect(logs).toContain('| 5:1 | icon | manual | icon-registry |');
  });

  it('is written where --report says, and printed on request', async () => {
    const { tree, logs } = await migrate(treeWith({ '/src/a.html': html }), {
      path: 'src',
      report: 'reports\\billing.md',
      printReport: true,
    });
    expect(tree.exists('/reports/billing.md')).toBe(true);
    expect(tree.exists('/reports/billing.json')).toBe(true);
    expect(tree.exists(REPORT)).toBe(false);
    expect(logs).toContain('## Summary');
    expect(logs).toContain('Report: reports/billing.md and reports/billing.json');
  });

  it('names the replacement for everything that stays', async () => {
    const tree = treeWith({
      '/src/a.html':
        '<mat-form-field><mat-select></mat-select></mat-form-field><mat-tab-group></mat-tab-group><mat-divider></mat-divider><mat-tree></mat-tree>\n',
    });
    const out = (await migrate(tree, { path: 'src' })).tree;
    expect(report(out).remaining).toEqual([
      { name: 'mat-divider', count: 1, replacement: expect.stringContaining('never edited') },
      { name: 'mat-form-field', count: 1, replacement: expect.stringContaining('z-field') },
      { name: 'mat-select', count: 1, replacement: expect.stringContaining('z-select') },
      { name: 'mat-tab-group', count: 1, replacement: expect.stringContaining('nav[zTabs]') },
      { name: 'mat-tree', count: 1, replacement: expect.stringContaining('no counterpart') },
    ]);
    expect(out.readContent(REPORT)).toContain('## Left for manual migration');
    expect(out.readContent('/src/a.html')).toContain('<mat-divider></mat-divider>');
  });
});

describe('a realistic page', () => {
  const fixture = (name: string) =>
    readFileSync(join(here, 'fixtures', 'server-page', `${name}.txt`), 'utf8').replace(
      /\r\n/g,
      '\n',
    );

  it('produces exactly the expected files and report', async () => {
    const tree = treeWith({
      '/src/app/server/server-page.ts': fixture('server-page.ts'),
      '/src/app/server/server-page.html': fixture('server-page.html'),
      '/src/app/server/server-page.scss': fixture('server-page.scss'),
    });
    const out = (await migrate(tree, { path: 'src/app/server' })).tree;
    if (process.env['UPDATE_FIXTURES']) {
      // After a deliberate rule change: UPDATE_FIXTURES=1 npm run test:schematics, then review the diff.
      for (const [name, path] of [
        ['expected.server-page.html', '/src/app/server/server-page.html'],
        ['expected.server-page.ts', '/src/app/server/server-page.ts'],
        ['expected.report.md', REPORT],
        ['expected.report.json', JSON_REPORT],
      ]) {
        writeFileSync(join(here, 'fixtures', 'server-page', `${name}.txt`), out.readContent(path));
      }
    }
    expect(out.readContent('/src/app/server/server-page.html')).toBe(
      fixture('expected.server-page.html'),
    );
    expect(out.readContent('/src/app/server/server-page.ts')).toBe(
      fixture('expected.server-page.ts'),
    );
    expect(out.readContent('/src/app/server/server-page.scss')).toBe(fixture('server-page.scss'));
    expect(out.readContent(REPORT)).toBe(fixture('expected.report.md'));
    expect(out.readContent(JSON_REPORT)).toBe(fixture('expected.report.json'));
  });
});

describe('performance', () => {
  it('migrates 500 files well within a minute', async () => {
    const page = readFileSync(
      join(here, 'fixtures', 'server-page', 'server-page.html.txt'),
      'utf8',
    );
    const files: Record<string, string> = {};
    for (let index = 0; index < 250; index += 1) {
      files[`/src/app/f${index % 10}/page-${index}.ts`] = componentTs(`page-${index}`);
      files[`/src/app/f${index % 10}/page-${index}.html`] = page;
    }
    const tree = treeWith(files);
    const start = performance.now();
    const out = (await migrate(tree, { path: 'src/app' })).tree;
    const elapsed = performance.now() - start;
    console.info(
      `migrate-material: 500 files (250 templates of ${page.split('\n').length} lines) in ${Math.round(elapsed)} ms`,
    );
    expect(report(out).totals).toMatchObject({ filesScanned: 500, filesChanged: 500 });
    expect(elapsed).toBeLessThan(20_000);
  }, 60_000);
});
