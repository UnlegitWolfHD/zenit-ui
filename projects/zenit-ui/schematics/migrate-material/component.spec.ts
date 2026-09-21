/**
 * Unit tests of the TypeScript half of `migrate-material`: locating the template
 * of a component and editing `imports` together with the ES imports.
 */
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { applyEdits } from '../ng-add/html';
import { TemplateUsage, findComponents, planImports } from './component';
import { sortEdits } from './template';

const parse = (text: string) => ts.createSourceFile('x.ts', text, ts.ScriptTarget.Latest, true);

/** Plans the imports of every component of the file against the same template usage. */
function plan(text: string, usage: Partial<TemplateUsage>) {
  const source = parse(text);
  const full: TemplateUsage = { remaining: {}, zenit: [], ...usage };
  const planned = planImports(
    source,
    findComponents(source).map((component) => [component, full]),
  );

  return {
    text: applyEdits(text, sortEdits(planned.edits)),
    codes: planned.findings.map((finding) => `${finding.kind}:${finding.code}`),
    findings: planned.findings,
    changed: planned.changed,
  };
}

const component = (
  imports: string,
  head = '',
  body = '',
) => `import { Component } from '@angular/core';
${head}
@Component({
  selector: 'app-x',
  imports: ${imports},
  templateUrl: './x.html',
})
export class X {${body}}
`;

describe('findComponents', () => {
  it('finds templateUrl, a template literal and a plain string', () => {
    const source = parse(`import { Component } from '@angular/core';
@Component({ selector: 'a', templateUrl: './a.html' }) export class A {}
@Component({ selector: 'b', template: \`<p>b</p>\` }) export class B {}
@Component({ selector: 'c', template: '<p>c</p>' }) export class C {}
@Component({ selector: 'd', template: "<p>d</p>" }) export class D {}
`);
    const found = findComponents(source);
    expect(found.map(({ name, templateUrl }) => [name, templateUrl])).toEqual([
      ['A', './a.html'],
      ['B', undefined],
      ['C', undefined],
      ['D', undefined],
    ]);
    expect(
      found.slice(1).map(({ inline }) => source.text.slice(inline!.start, inline!.end)),
    ).toEqual(['<p>b</p>', '<p>c</p>', '<p>d</p>']);
    expect(found.slice(1).map(({ inline }) => inline!.delimiter)).toEqual(['`', "'", '"']);
  });

  it('does not read a template with ${}, a concatenation, a constant or an escape', () => {
    const source = parse(`import { Component } from '@angular/core';
const T = '<p></p>';
@Component({ template: \`<p>\${T}</p>\` }) export class A {}
@Component({ template: '<p>' + '</p>' }) export class B {}
@Component({ template: T }) export class C {}
@Component({ template: '<p title="it\\'s"></p>' }) export class D {}
`);
    for (const found of findComponents(source)) {
      expect(found.inline, found.name).toBeUndefined();
      expect(found.inlineProblem, found.name).toBeTruthy();
    }
  });

  it('ignores a decorator that is not the one of @angular/core', () => {
    expect(
      findComponents(
        parse(`import { Component } from './mine';\n@Component({ template: '' }) class A {}`),
      ),
    ).toEqual([]);
  });
});

describe('planImports', () => {
  it('replaces the modules whose selectors are gone and merges the ES imports', () => {
    const result = plan(
      component(
        '[CommonModule, MatIconModule, MatButtonModule, RouterLink]',
        `import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';`,
      ),
      { zenit: ['ZButton', 'ZIcon'] },
    );
    expect(result.text).toBe(
      component(
        '[CommonModule, RouterLink, ZButton, ZIcon]',
        `import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ZButton, ZIcon } from 'zenit-ui';`,
      ),
    );
    expect(result.codes).toEqual([]);
    expect(result.changed).toBe(1);
  });

  it('keeps a module while one of its selectors is left in the template', () => {
    const head = `import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';`;
    const result = plan(
      component(
        '[MatIconModule, MatButtonModule, MatTooltipModule, MatProgressSpinnerModule]',
        head,
      ),
      // An icon in a field, a fab and a spinner in a button stayed; the tooltips are gone.
      {
        remaining: { 'mat-icon': 1, matSuffix: 1, 'mat-fab': 1, 'mat-spinner': 2 },
        zenit: ['ZTooltip'],
      },
    );
    expect(result.text).toBe(
      component(
        '[MatIconModule, MatButtonModule, MatProgressSpinnerModule, ZTooltip]',
        `import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ZTooltip } from 'zenit-ui';`,
      ),
    );
  });

  it('knows the single-component forms', () => {
    const head = `import { MatAnchor, MatButton, MatIconButton } from '@angular/material/button';
import { MatChip, MatChipSet } from '@angular/material/chips';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';`;
    const result = plan(
      component(
        '[MatIcon, MatButton, MatAnchor, MatIconButton, MatTooltip, MatProgressSpinner, MatChip, MatChipSet]',
        head,
      ),
      { remaining: { 'mat-icon-button': 1 }, zenit: ['ZIcon'] },
    );
    expect(result.text).toBe(
      component(
        '[MatIconButton, ZIcon]',
        `import { MatIconButton } from '@angular/material/button';
import { ZIcon } from 'zenit-ui';`,
      ),
    );
  });

  it('never touches MatDividerModule or a module it does not know', () => {
    const text = component(
      '[MatDividerModule, MatFormFieldModule]',
      `import { MatDividerModule } from '@angular/material/divider';\nimport { MatFormFieldModule } from '@angular/material/form-field';`,
    );
    expect(plan(text, {})).toMatchObject({ text, changed: 0 });
  });

  it('keeps one entry per line, the trailing comma and CRLF', () => {
    const text = `import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  ZPanel,
  ZField,
} from 'zenit-ui';

@Component({
  imports: [
    ZPanel,
    MatIconModule,
    ZField,
  ],
  template: '',
})
export class X {}
`.replace(/\n/g, '\r\n');
    expect(plan(text, { zenit: ['ZIcon', 'ZSpinner'] }).text).toBe(
      `import { Component } from '@angular/core';
import {
  ZPanel,
  ZField,
  ZIcon,
  ZSpinner,
} from 'zenit-ui';

@Component({
  imports: [
    ZPanel,
    ZField,
    ZIcon,
    ZSpinner,
  ],
  template: '',
})
export class X {}
`.replace(/\n/g, '\r\n'),
    );
  });

  it('handles a list that loses every entry, with and without replacements', () => {
    const head = `import { MatIconModule } from '@angular/material/icon';\nimport { MatTooltipModule } from '@angular/material/tooltip';`;
    expect(
      plan(component('[MatIconModule, MatTooltipModule]', head), { zenit: ['ZIcon'] }).text,
    ).toBe(component('[ZIcon]', `import { ZIcon } from 'zenit-ui';`));
    expect(
      plan(component('[\n    MatIconModule,\n    MatTooltipModule,\n  ]', head), {
        zenit: ['ZIcon', 'ZTooltip'],
      }).text,
    ).toBe(
      component('[\n    ZIcon,\n    ZTooltip,\n  ]', `import { ZIcon, ZTooltip } from 'zenit-ui';`),
    );
    // Nothing of zenit-ui is needed, for example after the human removed the last icon.
    expect(
      plan(component('[\n    MatIconModule,\n    MatTooltipModule,\n  ]', head), {}).text,
    ).toBe(component('[]', '').replace("core';\n\n", "core';\n"));
  });

  it('merges into an existing import of zenit-ui and follows the quote style of the file', () => {
    expect(
      plan(component('[ZPanel]', `import { ZPanel } from 'zenit-ui';`), {
        zenit: ['ZIcon', 'ZPanel'],
      }).text,
    ).toBe(component('[ZPanel, ZIcon]', `import { ZPanel, ZIcon } from 'zenit-ui';`));

    const double = `import { Component } from "@angular/core";\n@Component({ imports: [], template: "" })\nexport class X {}\n`;
    expect(plan(double, { zenit: ['ZIcon'] }).text).toBe(
      `import { Component } from "@angular/core";\nimport { ZIcon } from "zenit-ui";\n@Component({ imports: [ZIcon], template: "" })\nexport class X {}\n`,
    );
  });

  it('adds the imports property when the component has none', () => {
    const text = `import { Component } from '@angular/core';\n@Component({\n  selector: 'app-x',\n  template: '',\n})\nexport class X {}\n`;
    expect(plan(text, { zenit: ['ZIcon'] }).text).toBe(
      `import { Component } from '@angular/core';\nimport { ZIcon } from 'zenit-ui';\n@Component({\n  imports: [ZIcon],\n  selector: 'app-x',\n  template: '',\n})\nexport class X {}\n`,
    );
  });

  it('keeps the ES import of a symbol the file still names, and says so', () => {
    const result = plan(
      component(
        '[MatTooltipModule, MatIconModule]',
        `import { MatIconModule } from '@angular/material/icon';\nimport { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';`,
        '\n  tip = viewChild(MatTooltip);\n  mod = MatTooltipModule;\n',
      ),
      { zenit: ['ZTooltip'], remaining: { 'mat-icon': 1 } },
    );
    expect(result.text).toContain(
      `import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';`,
    );
    expect(result.text).toContain('imports: [MatIconModule, ZTooltip],');
    expect(result.codes).toEqual(['review:imports-still-referenced']);
    expect(result.findings[0].reason).toContain('MatTooltipModule');
  });

  it('removes one specifier of a shared declaration', () => {
    const result = plan(
      component(
        '[MatIcon, MatIconModule]',
        `import { MatIcon, MatIconModule, MatIconRegistry } from '@angular/material/icon';`,
        '\n  r = inject(MatIconRegistry);\n',
      ),
      { zenit: ['ZIcon'] },
    );
    expect(result.text).toContain(`import { MatIconRegistry } from '@angular/material/icon';`);
    expect(result.text).toContain('imports: [ZIcon],');
  });

  it('shares the ES imports between the components of one file', () => {
    const text = `import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
@Component({ imports: [MatIconModule], template: '' }) export class A {}
@Component({ imports: [MatIconModule], template: '' }) export class B {}
`;
    const source = parse(text);
    const [a, b] = findComponents(source);
    const planned = planImports(source, [
      [a, { remaining: {}, zenit: ['ZIcon'] }],
      [b, { remaining: { 'mat-icon': 1 }, zenit: [] }],
    ]);
    expect(applyEdits(text, sortEdits(planned.edits)))
      .toBe(`import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ZIcon } from 'zenit-ui';
@Component({ imports: [ZIcon], template: '' }) export class A {}
@Component({ imports: [MatIconModule], template: '' }) export class B {}
`);
    // B still lists the module, which is no reason for a review item.
    expect(planned.findings).toEqual([]);
  });

  it.each([
    ['a shared constant', 'SHARED_IMPORTS', 'imports-not-literal'],
    ['a spread', '[CommonModule, ...MATERIAL]', 'imports-not-literal'],
    ['a call', '[CommonModule, forwardRef(() => Y)]', 'imports-not-literal'],
  ])('does not edit imports that are %s', (_, imports, code) => {
    const text = component(imports, `import { MatIconModule } from '@angular/material/icon';`);
    const result = plan(text, { zenit: ['ZIcon'] });
    expect(result.text).toBe(text);
    expect(result.codes).toEqual([`manual:${code}`]);
    expect(result.findings[0].fix).toContain("add ZIcon from 'zenit-ui'");
  });

  it('does not edit a component of an NgModule', () => {
    const text = `import { Component } from '@angular/core';\n@Component({ selector: 'a', standalone: false, template: '' })\nexport class A {}\n`;
    expect(plan(text, { zenit: ['ZIcon'] })).toMatchObject({
      text,
      codes: ['manual:imports-ngmodule'],
    });
    // Without anything of zenit-ui in the template there is nothing to tell.
    expect(plan(text, {})).toMatchObject({ text, codes: [] });
  });

  it('does not extend a namespace import of zenit-ui', () => {
    const text = component(
      '[MatIconModule]',
      `import { MatIconModule } from '@angular/material/icon';\nimport * as z from 'zenit-ui';`,
    );
    const result = plan(text, { zenit: ['ZIcon'] });
    expect(result.codes).toEqual(['manual:imports-namespace']);
    expect(result.text).toContain('imports: [ZIcon],');
    expect(result.text).toContain(`import * as z from 'zenit-ui';`);
  });

  it('changes nothing when everything is in place', () => {
    const text = component(
      '[ZIcon, MatIconModule]',
      `import { MatIconModule } from '@angular/material/icon';\nimport { ZIcon } from 'zenit-ui';`,
    );
    expect(plan(text, { zenit: ['ZIcon'], remaining: { 'mat-icon': 2 } })).toMatchObject({
      text,
      codes: [],
      changed: 0,
    });
  });
});
