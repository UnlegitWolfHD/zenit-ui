/**
 * Unit tests of the template rules of `migrate-material`. They run the planner
 * on template text and compare the rewritten text and the findings; nothing here
 * needs the compiled collection.
 */
import { describe, expect, it } from 'vitest';
import { applyEdits } from '../ng-add/html';
import { RULES, RuleName } from './tables';
import { Group, TemplateOptions, acceptGroups, migrateTemplate, sortEdits } from './template';

function run(source: string, options: Partial<TemplateOptions> = {}) {
  const result = migrateTemplate(source, { rules: new Set<RuleName>(RULES), ...options });

  return {
    ...result,
    text: applyEdits(source, result.edits),
    codes: result.findings.map((finding) => `${finding.kind}:${finding.code}`),
  };
}

describe('icon', () => {
  it('turns a ligature into a self-closing z-icon', () => {
    expect(run('<mat-icon>home</mat-icon>').text).toBe('<z-icon name="home" />');
    expect(run('<mat-icon> arrow_back </mat-icon>').text).toBe('<z-icon name="arrow_back" />');
    expect(run('<mat-icon>\n  3d_rotation\n</mat-icon>').text).toBe(
      '<z-icon name="3d_rotation" />',
    );
    expect(run('<mat-icon>home</mat-icon>')).toMatchObject({
      converted: { icon: 1 },
      findings: [],
      remaining: {},
      zenit: ['ZIcon'],
    });
  });

  it('turns a single interpolation into a [name] binding', () => {
    expect(run('<mat-icon>{{ icon }}</mat-icon>').text).toBe('<z-icon [name]="icon" />');
    expect(run("<mat-icon>{{ open ? 'expand_less' : 'expand_more' }}</mat-icon>").text).toBe(
      `<z-icon [name]="open ? 'expand_less' : 'expand_more'" />`,
    );
    expect(run('<mat-icon>{{ item.icon | lowercase }}</mat-icon>').text).toBe(
      '<z-icon [name]="item.icon | lowercase" />',
    );
    // Double quotes in the expression: the attribute takes single quotes.
    expect(run('<mat-icon>{{ open ? "a" : "b" }}</mat-icon>').text).toBe(
      `<z-icon [name]='open ? "a" : "b"' />`,
    );
  });

  it('reports an expression that fits neither quote', () => {
    const source = `<mat-icon>{{ open ? "a" : 'b' }}</mat-icon>`;
    expect(run(source)).toMatchObject({ text: source, codes: ['manual:icon-content'] });
  });

  it.each([
    ['text next to an interpolation', '<mat-icon>a{{ b }}</mat-icon>'],
    ['two interpolations', '<mat-icon>{{ a }}{{ b }}</mat-icon>'],
    ['a child element', '<mat-icon><span>home</span></mat-icon>'],
    ['a comment next to the name', '<mat-icon><!-- c -->home</mat-icon>'],
    ['an entity', '<mat-icon>&nbsp;</mat-icon>'],
    ['words instead of a ligature', '<mat-icon>arrow back</mat-icon>'],
    ['an upper-case name', '<mat-icon>Home</mat-icon>'],
    ['no content at all', '<mat-icon></mat-icon>'],
    ['a self-closing icon without a name', '<mat-icon />'],
    ['a control flow block', '<mat-icon>@if (a) {home}</mat-icon>'],
  ])('reports %s and leaves the icon alone', (_, source) => {
    expect(run(source)).toMatchObject({
      text: source,
      codes: ['manual:icon-content'],
      converted: { icon: 0 },
      remaining: { 'mat-icon': 1 },
    });
  });

  it('keeps classes, class bindings, structural directives and events in place', () => {
    const result = run(
      `<mat-icon class="lead" [class.on]="on" [ngClass]="{ a: b }" *ngIf="shown" id="i" (click)="toggle()">menu</mat-icon>`,
    );
    expect(result.text).toBe(
      `<z-icon name="menu" class="lead" [class.on]="on" [ngClass]="{ a: b }" *ngIf="shown" id="i" (click)="toggle()" />`,
    );
    // A clickable icon is converted, and reported as an accessibility smell.
    expect(result.codes).toEqual(['review:icon-clickable']);
    expect(result.findings[0].fix).toContain('iconOnly');
  });

  it('drops aria-hidden="true", which z-icon sets itself', () => {
    for (const attribute of [
      'aria-hidden="true"',
      '[attr.aria-hidden]="true"',
      `[attr.aria-hidden]="'true'"`,
    ]) {
      expect(run(`<mat-icon ${attribute}>home</mat-icon>`)).toMatchObject({
        text: '<z-icon name="home" />',
        codes: ['info:icon-aria-hidden'],
      });
    }
  });

  it.each([
    ['aria-hidden="false"', 'icon-exposed'],
    ['[attr.aria-hidden]="hidden"', 'icon-exposed'],
    ['aria-label="Start"', 'icon-labelled'],
    ['[attr.aria-label]="label"', 'icon-labelled'],
    ['aria-labelledby="t"', 'icon-labelled'],
    ['role="img"', 'icon-labelled'],
    ['svgIcon="logo"', 'icon-registry'],
    ['[svgIcon]="logo"', 'icon-registry'],
    ['fontSet="material-symbols-outlined"', 'icon-registry'],
    ['matPrefix', 'icon-in-field'],
    ['matSuffix', 'icon-in-field'],
    ['matIconPrefix', 'icon-in-field'],
    ['matListItemIcon', 'icon-slot'],
    ['matChipAvatar', 'icon-slot'],
    ['matChipRemove', 'icon-slot'],
    ['iconPositionEnd', 'icon-slot'],
    ['#ref="matIcon"', 'icon-reference'],
  ])('does not convert an icon with %s', (attribute, code) => {
    const source = `<mat-icon ${attribute}>home</mat-icon>`;
    const result = run(source);
    expect(result.text).toBe(source);
    expect(result.codes).toEqual([`manual:${code}`]);
    expect(result.findings[0].fix).not.toBe('');
  });

  it('names the z-input-group icon for an icon in a field', () => {
    expect(run('<mat-icon matSuffix>search</mat-icon>').findings[0].fix).toContain('z-input-group');
  });

  it('drops color and says that colour comes from the context', () => {
    const accent = run('<mat-icon color="accent">home</mat-icon>');
    expect(accent.text).toBe('<z-icon name="home" />');
    expect(accent.codes).toEqual(['info:icon-colour']);
    expect(accent.findings[0].reason).toContain('colour must come from the context');

    // warn and a bound colour carry meaning, so they are a review item.
    expect(run('<mat-icon color="warn">error</mat-icon>').codes).toEqual(['review:icon-colour']);
    const bound = run(`<mat-icon [color]="bad ? 'warn' : ''">error</mat-icon>`);
    expect(bound.text).toBe('<z-icon name="error" />');
    expect(bound.codes).toEqual(['review:icon-colour']);
    expect(bound.findings[0].reason).toContain(`[color]="bad ? 'warn' : ''"`);
  });

  it('takes the name from fontIcon', () => {
    expect(run('<mat-icon fontIcon="settings"></mat-icon>').text).toBe(
      '<z-icon name="settings" />',
    );
    expect(run('<mat-icon class="a" [fontIcon]="icon" />').text).toBe(
      '<z-icon class="a" [name]="icon" />',
    );
    expect(run('<mat-icon fontIcon="a">b</mat-icon>').codes).toEqual(['manual:icon-content']);
    expect(run('<mat-icon fontIcon="a" fontSet="x"></mat-icon>').codes).toEqual([
      'manual:icon-registry',
    ]);
  });

  it('does not rename a translated attribute, whose i18n-* twin the AST hides', () => {
    const source = '<mat-icon fontIcon="home" i18n-fontIcon="@@icon"></mat-icon>';
    expect(run(source)).toMatchObject({ text: source, codes: ['manual:icon-translated'] });
    // Translated content is not an attribute and moves along with the element.
    expect(run('<mat-chip i18n="@@tag">Neu</mat-chip>').text).toBe(
      '<z-badge i18n="@@tag">Neu</z-badge>',
    );
  });

  it('maps no size: inline is dropped and reported, an inline style is kept and reported', () => {
    expect(run('<mat-icon inline>home</mat-icon>')).toMatchObject({
      text: '<z-icon name="home" />',
      codes: ['review:icon-inline'],
    });
    expect(run('<mat-icon style="font-size: 18px">home</mat-icon>')).toMatchObject({
      text: '<z-icon name="home" style="font-size: 18px" />',
      codes: ['review:icon-style'],
    });
    expect(run('<mat-icon class="material-icons-outlined big">home</mat-icon>')).toMatchObject({
      text: '<z-icon name="home" class="material-icons-outlined big" />',
      codes: ['review:icon-font-class'],
    });
    expect(run('<mat-icon [style.font-size.px]="s">home</mat-icon>').codes).toEqual([
      'review:icon-style',
    ]);
  });

  it('keeps attributes that span several lines, their quotes and their order', () => {
    const source = [
      '<mat-icon',
      "  class='lead'",
      '  color="primary"',
      '  [class.on]="on"',
      '  >home</mat-icon',
      '>',
    ].join('\n');
    expect(run(source).text).toBe(
      ['<z-icon name="home"', "  class='lead'", '  [class.on]="on"', '  />'].join('\n'),
    );
  });

  it('converts icons inside blocks, templates and structural directives', () => {
    const source = `@if (a) {<mat-icon>a</mat-icon>} @else {<mat-icon>b</mat-icon>}
@for (i of items; track i) {<mat-icon>{{ i }}</mat-icon>} @empty {<mat-icon>c</mat-icon>}
@switch (s) { @case (1) {<mat-icon>d</mat-icon>} @default {<mat-icon>e</mat-icon>} }
@defer {<mat-icon>f</mat-icon>} @placeholder {<mat-icon>g</mat-icon>} @loading {<mat-icon>h</mat-icon>}
<ng-template #t><mat-icon>i</mat-icon></ng-template>
<ng-container *ngFor="let x of xs"><mat-icon *ngIf="x">j</mat-icon></ng-container>`;
    const result = run(source);
    expect(result.converted.icon).toBe(11);
    expect(result.text).not.toContain('mat-icon');
    expect(result.text).toContain(
      '@for (i of items; track i) {<z-icon [name]="i" />} @empty {<z-icon name="c" />}',
    );
    expect(result.text).toContain('<z-icon name="j" *ngIf="x" />');
  });

  it('notes that an icon in a mat-menu-item becomes an input later', () => {
    const result = run('<button mat-menu-item><mat-icon>delete</mat-icon>Delete</button>');
    expect(result.text).toBe('<button mat-menu-item><z-icon name="delete" />Delete</button>');
    expect(result.codes).toEqual(['review:icon-in-menu-item']);
  });

  it('does not read a comment', () => {
    const source = '<!-- <mat-icon>home</mat-icon> --><p>x</p>';
    expect(run(source)).toMatchObject({ text: source, findings: [], remaining: {} });
  });
});

describe('button', () => {
  it.each([
    ['mat-button', 'zBtn="ghost"'],
    ['mat-stroked-button', 'zBtn'],
    ['mat-flat-button', 'zBtn="primary"'],
    ['mat-raised-button', 'zBtn="primary"'],
  ])('maps %s to %s on button and anchor', (from, to) => {
    expect(run(`<button type="button" ${from} (click)="go()">Go</button>`).text).toBe(
      `<button type="button" ${to} (click)="go()">Go</button>`,
    );
    expect(run(`<a ${from} routerLink="/x">Go</a>`)).toMatchObject({
      text: `<a ${to} routerLink="/x">Go</a>`,
      findings: [],
      converted: { button: 1 },
      zenit: ['ZButton'],
    });
  });

  it('maps mat-icon-button to a ghost iconOnly button', () => {
    expect(
      run(
        '<button mat-icon-button type="button" aria-label="Delete"><mat-icon>delete</mat-icon></button>',
      ),
    ).toMatchObject({
      text: '<button zBtn="ghost" iconOnly type="button" aria-label="Delete"><z-icon name="delete" /></button>',
      findings: [],
    });
  });

  it('converts an icon button without an accessible name and reports it', () => {
    const result = run(
      '<button mat-icon-button type="button" matTooltip="Restart"><mat-icon>restart_alt</mat-icon></button>',
    );
    expect(result.text).toBe(
      '<button zBtn="ghost" iconOnly type="button" zTooltip="Restart"><z-icon name="restart_alt" /></button>',
    );
    expect(result.codes).toEqual(['review:button-no-name']);
    expect(result.findings[0].fix).toContain('aria-label="Restart"');

    for (const name of ['[attr.aria-label]="l"', '[aria-label]="l"', 'aria-labelledby="id"']) {
      expect(run(`<button mat-icon-button type="button" ${name}></button>`).codes).toEqual([]);
    }
  });

  it.each(['mat-fab', 'mat-mini-fab', 'matButton="filled"', 'matIconButton', 'matFab'])(
    'only reports %s',
    (attribute) => {
      const source = `<button type="button" ${attribute}><mat-icon>add</mat-icon></button>`;
      const result = run(source, { rules: new Set<RuleName>(['button']) });
      expect(result.text).toBe(source);
      expect(result.codes).toEqual([
        attribute.includes('ab') ? 'manual:button-fab' : 'manual:button-unmapped',
      ]);
      expect(result.remaining).toHaveProperty(attribute.split('=')[0]);
    },
  );

  it('reports color="warn" as a danger candidate and does not guess', () => {
    const result = run('<button type="button" mat-flat-button color="warn">Delete</button>');
    expect(result.text).toBe('<button type="button" zBtn="primary">Delete</button>');
    expect(result.codes).toEqual(['review:button-warn']);
    expect(result.findings[0].fix).toContain('zBtn="danger"');
  });

  it('drops color="primary|accent", a bound color and disableRipple, and keeps [disabled]', () => {
    expect(
      run(
        '<button type="submit" mat-stroked-button color="primary" disableRipple [disabled]="busy">Save</button>',
      ),
    ).toMatchObject({
      text: '<button type="submit" zBtn [disabled]="busy">Save</button>',
      codes: ['info:button-colour', 'info:button-ripple'],
    });
    expect(
      run('<button type="button" mat-button [color]="c" [disableRipple]="true">x</button>'),
    ).toMatchObject({
      text: '<button type="button" zBtn="ghost">x</button>',
      codes: ['review:button-colour', 'info:button-ripple'],
    });
  });

  it('reports a button without a type and does not add one', () => {
    const result = run('<button mat-button>Cancel</button>');
    expect(result.text).toBe('<button zBtn="ghost">Cancel</button>');
    expect(result.codes).toEqual(['review:button-type']);

    expect(run('<button mat-button [type]="t">x</button>').codes).toEqual([]);
    expect(run('<button mat-button [attr.type]="t">x</button>').codes).toEqual([]);
    expect(run('<a mat-button href="/">x</a>').codes).toEqual([]);
  });

  it('leaves a spinner inside a button alone and names [loading]', () => {
    const source =
      '<button type="submit" mat-flat-button [disabled]="saving"><mat-spinner *ngIf="saving" diameter="18"></mat-spinner>Save</button>';
    const result = run(source);
    expect(result.text).toBe(
      '<button type="submit" zBtn="primary" [disabled]="saving"><mat-spinner *ngIf="saving" diameter="18"></mat-spinner>Save</button>',
    );
    expect(result.codes).toEqual(['manual:spinner-in-button']);
    expect(result.findings[0].fix).toContain('[loading]="saving"');
    expect(result.remaining).toEqual({ 'mat-spinner': 1 });

    const block = run(
      '<button type="button" mat-button>@if (busy()) {<mat-progress-spinner mode="indeterminate" />} Go</button>',
    );
    expect(block.text).toContain('<mat-progress-spinner mode="indeterminate" />');
    expect(block.findings[0].fix).toContain('[loading]="busy()"');

    // Behind an element of its own the condition is not the spinner's.
    const nested = run(
      '<button type="button" mat-button *ngIf="x"><span><mat-spinner></mat-spinner></span></button>',
    );
    expect(nested.findings[0].fix).not.toContain('[loading]="');
  });

  it('reports more than one primary button in a template', () => {
    const result = run(
      '<button type="button" mat-flat-button>A</button>\n<button type="button" zBtn="primary">B</button>\n<button type="button" mat-raised-button>C</button>',
    );
    expect(result.codes).toEqual(['review:several-primaries']);
    expect(result.findings[0].reason).toContain('3 buttons');
    expect(result.findings[0].reason).toContain('at most one primary per screen height');

    expect(run('<button type="button" mat-flat-button>A</button>').codes).toEqual([]);
    // Nothing converted, nothing to report: the rule speaks about what this run wrote.
    expect(
      run(
        '<button type="button" zBtn="primary">A</button><button type="button" zBtn="primary">B</button>',
      ).codes,
    ).toEqual([]);
  });

  it('ignores the attribute on other elements and counts it as left', () => {
    const source = '<div mat-button>x</div>';
    expect(run(source)).toMatchObject({
      text: source,
      findings: [],
      remaining: { 'mat-button': 1 },
    });
  });

  it('reports contradicting attributes', () => {
    for (const source of [
      '<button type="button" mat-button mat-flat-button>x</button>',
      '<button type="button" mat-button zBtn>x</button>',
    ]) {
      expect(run(source)).toMatchObject({ text: source, codes: ['manual:button-unmapped'] });
    }
  });

  it('keeps an attribute list over several lines as it is', () => {
    const source = [
      '<button',
      '  mat-icon-button',
      '  color="primary"',
      "  type='button'",
      '  aria-label="Open"',
      '  (click)="open()"',
      '>',
      '  <mat-icon>open_in_new</mat-icon>',
      '</button>',
    ].join('\r\n');
    expect(run(source).text).toBe(
      [
        '<button',
        '  zBtn="ghost" iconOnly',
        "  type='button'",
        '  aria-label="Open"',
        '  (click)="open()"',
        '>',
        '  <z-icon name="open_in_new" />',
        '</button>',
      ].join('\r\n'),
    );
  });
});

describe('tooltip', () => {
  it('renames the static, the bound and the interpolated form', () => {
    expect(run('<span matTooltip="Copy">x</span>').text).toBe('<span zTooltip="Copy">x</span>');
    expect(run(`<span [matTooltip]="'Copy ' + name">x</span>`).text).toBe(
      `<span [zTooltip]="'Copy ' + name">x</span>`,
    );
    expect(run('<span matTooltip="Copy {{ name }}">x</span>').text).toBe(
      '<span zTooltip="Copy {{ name }}">x</span>',
    );
    expect(run("<span matTooltip='Copy'>x</span>")).toMatchObject({
      text: "<span zTooltip='Copy'>x</span>",
      converted: { tooltip: 1 },
      findings: [],
      remaining: {},
      zenit: ['ZTooltip'],
    });
  });

  it('drops the options zTooltip does not have', () => {
    const result = run(
      '<span matTooltip="Copy" matTooltipPosition="above" [matTooltipShowDelay]="500" matTooltipHideDelay="0" matTooltipClass="wide" matTooltipTouchGestures="off">x</span>',
    );
    expect(result.text).toBe('<span zTooltip="Copy">x</span>');
    expect(result.codes).toEqual(Array(5).fill('info:tooltip-option'));
    expect(result.findings[0].reason).toContain('matTooltipPosition="above"');
  });

  it('merges [matTooltipDisabled] into the text', () => {
    expect(run('<span [matTooltip]="hint" [matTooltipDisabled]="!locked">x</span>')).toMatchObject({
      text: `<span [zTooltip]="!locked ? '' : (hint)">x</span>`,
      codes: ['review:tooltip-disabled-merged'],
    });
    // A static text becomes a quoted literal; apostrophe and backslash are escaped.
    expect(
      run(`<span matTooltip="Don't \\ stop" [matTooltipDisabled]="form.valid">x</span>`).text,
    ).toBe(`<span [zTooltip]="form.valid ? '' : 'Don\\'t \\\\ stop'">x</span>`);
    expect(run(`<span matTooltip='Say "hi"' [matTooltipDisabled]="ok()">x</span>`).text).toBe(
      `<span [zTooltip]="ok() ? '' : 'Say &quot;hi&quot;'">x</span>`,
    );
    // Anything but a plain path is put in parentheses.
    expect(run(`<span [matTooltip]="a || b" [matTooltipDisabled]="x && !y">x</span>`).text).toBe(
      `<span [zTooltip]="(x && !y) ? '' : (a || b)">x</span>`,
    );
    // The attribute order of the source does not matter.
    expect(run('<span [matTooltipDisabled]="off" class="c" matTooltip="T">x</span>').text).toBe(
      `<span class="c" [zTooltip]="off ? '' : 'T'">x</span>`,
    );
  });

  it.each([
    [
      'a pipe in the condition',
      '<span [matTooltip]="t" [matTooltipDisabled]="off$ | async" matTooltipPosition="left">x</span>',
    ],
    ['an interpolated text', '<span matTooltip="Hi {{ n }}" [matTooltipDisabled]="off">x</span>'],
    ['a static matTooltipDisabled', '<span matTooltip="Hi" matTooltipDisabled>x</span>'],
    ['an encoded apostrophe', '<span matTooltip="Don&#39;t" [matTooltipDisabled]="off">x</span>'],
    [
      'double quotes in the condition',
      `<span matTooltip="Hi" [matTooltipDisabled]='mode === "x"'>x</span>`,
    ],
  ])('reports %s and changes nothing of the tooltip', (_, source) => {
    expect(run(source)).toMatchObject({
      text: source,
      codes: ['manual:tooltip-disabled'],
      converted: { tooltip: 0 },
    });
  });

  it('shares an element with another rule, also where their edits touch', () => {
    // The dropped option starts where the icon rule inserts the name.
    expect(
      run('<mat-icon matTooltipPosition="above" matTooltip="Start">home</mat-icon>').text,
    ).toBe('<z-icon name="home" zTooltip="Start" />');
    expect(
      run(
        '<a mat-icon-button color="accent" matTooltip="Start" matTooltipPosition="above" href="/" aria-label="Start"><mat-icon>home</mat-icon></a>',
      ).text,
    ).toBe(
      '<a zBtn="ghost" iconOnly zTooltip="Start" href="/" aria-label="Start"><z-icon name="home" /></a>',
    );
  });

  it('reports what the AST cannot show', () => {
    for (const source of [
      '<span matTooltip="Copy" i18n-matTooltip="@@copy">x</span>',
      '<span matTooltip="Copy" #tip="matTooltip" (click)="tip.toggle()">x</span>',
      '<span matTooltip="Copy" zTooltip="Copy">x</span>',
    ]) {
      expect(run(source)).toMatchObject({ text: source, codes: ['manual:tooltip-unmapped'] });
    }
  });
});

describe('spinner', () => {
  it('converts a standalone mat-spinner and drops its options', () => {
    const result = run(
      '<mat-spinner diameter="40" strokeWidth="3" color="accent" mode="indeterminate"></mat-spinner>',
    );
    expect(result.text).toBe('<z-spinner />');
    expect(result.codes.sort()).toEqual([
      'info:spinner-colour',
      'info:spinner-option',
      'info:spinner-option',
      'info:spinner-option',
      'review:spinner-no-label',
    ]);
    expect(result.zenit).toEqual(['ZSpinner']);
    expect(run('<mat-spinner [diameter]="size" />').text).toBe('<z-spinner />');
  });

  it('keeps structural directives and classes', () => {
    expect(
      run('<mat-spinner *ngIf="loading" class="center" [class.big]="b">\n</mat-spinner>').text,
    ).toBe('<z-spinner *ngIf="loading" class="center" [class.big]="b" />');
    expect(run('@if (loading()) {\n  <mat-spinner />\n}').text).toBe(
      '@if (loading()) {\n  <z-spinner />\n}',
    );
  });

  it('turns an aria-label into the label input', () => {
    expect(run('<mat-spinner aria-label="Wird geladen"></mat-spinner>')).toMatchObject({
      text: '<z-spinner label="Wird geladen" />',
      findings: [],
    });
    expect(run('<mat-spinner [attr.aria-label]="text" />').text).toBe(
      '<z-spinner [label]="text" />',
    );
  });

  it('converts mat-progress-spinner only when it is indeterminate', () => {
    expect(run('<mat-progress-spinner mode="indeterminate"></mat-progress-spinner>').text).toBe(
      '<z-spinner />',
    );
    for (const source of [
      '<mat-progress-spinner mode="determinate" [value]="p"></mat-progress-spinner>',
      '<mat-progress-spinner [value]="p"></mat-progress-spinner>',
      '<mat-progress-spinner></mat-progress-spinner>',
      '<mat-progress-spinner [mode]="m"></mat-progress-spinner>',
    ]) {
      const result = run(source);
      expect(result).toMatchObject({ text: source, codes: ['manual:spinner-determinate'] });
      expect(result.findings[0].fix).toContain('z-metric');
    }
  });

  it('reports what z-spinner cannot take', () => {
    for (const source of [
      '<mat-spinner aria-label="Loading" i18n-aria-label="@@loading"></mat-spinner>',
      '<mat-spinner aria-labelledby="t"></mat-spinner>',
      '<mat-spinner #s="matProgressSpinner"></mat-spinner>',
      '<mat-spinner>text</mat-spinner>',
    ]) {
      expect(run(source)).toMatchObject({ text: source, codes: ['manual:spinner-unmapped'] });
    }
  });
});

describe('chip', () => {
  it('turns static chips into badges and their set into a cluster', () => {
    const result = run(
      '<mat-chip-set>\n  @for (tag of tags; track tag) {\n    <mat-chip>{{ tag }}</mat-chip>\n  }\n</mat-chip-set>',
    );
    expect(result.text).toBe(
      '<span class="z-cluster">\n  @for (tag of tags; track tag) {\n    <z-badge>{{ tag }}</z-badge>\n  }\n</span>',
    );
    expect(result.converted.chip).toBe(1);
    expect(result.codes).toEqual(['review:chip-status']);
    expect(result.remaining).toEqual({});
    expect(result.zenit).toEqual(['ZBadge']);
  });

  it('merges z-cluster into a class of the wrapper and drops the chip colour', () => {
    expect(
      run(
        '<mat-chip-listbox class="tags"><mat-chip color="primary" class="t">A</mat-chip><z-badge>B</z-badge></mat-chip-listbox>',
      ).text,
    ).toBe(
      '<span class="tags z-cluster"><z-badge class="t">A</z-badge><z-badge>B</z-badge></span>',
    );
    expect(run('<mat-chip *ngFor="let t of tags" disableRipple>{{ t }}</mat-chip>').text).toBe(
      '<z-badge *ngFor="let t of tags">{{ t }}</z-badge>',
    );
  });

  it.each([
    ['a click handler', '<mat-chip (click)="pick(t)">A</mat-chip>'],
    ['a removed handler', '<mat-chip (removed)="drop(t)">A</mat-chip>'],
    ['removable', '<mat-chip [removable]="true">A</mat-chip>'],
    ['selected', '<mat-chip selected>A</mat-chip>'],
    ['a value', '<mat-chip [value]="t">A</mat-chip>'],
    [
      'a remove button',
      '<mat-chip>A<button matChipRemove><mat-icon>cancel</mat-icon></button></mat-chip>',
    ],
    ['a chip grid', '<mat-chip-grid #grid><mat-chip>A</mat-chip></mat-chip-grid>'],
  ])('reports a chip with %s', (_, source) => {
    const result = run(source, { rules: new Set<RuleName>(['chip']) });
    expect(result.text).toBe(source);
    expect(result.codes).toContain('manual:chip-interactive');
    expect(result.converted.chip).toBe(0);
  });

  it('leaves option and row chips to the human', () => {
    const source =
      '<mat-chip-listbox [(ngModel)]="v"><mat-chip-option>A</mat-chip-option></mat-chip-listbox>';
    expect(run(source)).toMatchObject({
      text: source,
      codes: ['manual:chip-wrapper'],
      remaining: { 'mat-chip-listbox': 1, 'mat-chip-option': 1 },
    });
  });

  it('keeps a wrapper that has ARIA or bindings of its own', () => {
    // In a set the chips still become badges, the set is reported.
    expect(
      run('<mat-chip-set aria-label="Tags"><mat-chip>A</mat-chip></mat-chip-set>'),
    ).toMatchObject({
      text: '<mat-chip-set aria-label="Tags"><z-badge>A</z-badge></mat-chip-set>',
      codes: ['manual:chip-wrapper', 'review:chip-status'],
    });
    // A listbox without options would be broken, so there the chips stay too.
    const listbox = '<mat-chip-listbox [multiple]="true"><mat-chip>A</mat-chip></mat-chip-listbox>';
    expect(run(listbox)).toMatchObject({
      text: listbox,
      codes: ['manual:chip-wrapper', 'manual:chip-interactive'],
    });
    // One interactive chip keeps the set.
    expect(
      run('<mat-chip-set><mat-chip>A</mat-chip><mat-chip (click)="x()">B</mat-chip></mat-chip-set>')
        .text,
    ).toBe('<mat-chip-set><z-badge>A</z-badge><mat-chip (click)="x()">B</mat-chip></mat-chip-set>');
  });
});

describe('template as a whole', () => {
  it('keeps CRLF line endings and everything it does not own', () => {
    const source = '<div>\r\n\t<mat-icon>home</mat-icon>\r\n\t<p>  text  </p>\r\n</div>\r\n';
    expect(run(source).text).toBe(
      '<div>\r\n\t<z-icon name="home" />\r\n\t<p>  text  </p>\r\n</div>\r\n',
    );
  });

  it('touches nothing when the template does not parse', () => {
    for (const source of [
      '<div><mat-icon>home</div>',
      '@if (x { <mat-icon>home</mat-icon> }',
      '<mat-icon>{{ a b }}</mat-icon>',
    ]) {
      const result = run(source);
      expect(result.error, source).toBeTruthy();
      expect(result.edits).toEqual([]);
      expect(result.text).toBe(source);
    }
  });

  it('is idempotent', () => {
    const source = `<button mat-icon-button matTooltip="Go" matTooltipPosition="above"><mat-icon color="warn">home</mat-icon></button>
<mat-spinner diameter="20"></mat-spinner><mat-chip-set><mat-chip>A</mat-chip></mat-chip-set>
<button mat-fab><mat-icon svgIcon="x"></mat-icon></button>`;
    const first = run(source);
    const second = run(first.text);
    expect(first.edits.length).toBeGreaterThan(0);
    expect(second.edits).toEqual([]);
    expect(second.text).toBe(first.text);
    expect(second.converted).toEqual({ icon: 0, button: 0, tooltip: 0, spinner: 0, chip: 0 });
    // What was left to the human is found again, with the same codes.
    const manual = (codes: string[]) => codes.filter((code) => code.startsWith('manual:'));
    expect(manual(second.codes)).toEqual(manual(first.codes));
    expect(second.remaining).toEqual(first.remaining);
    expect(second.zenit).toEqual(first.zenit);
  });

  it('runs only the rules it is given', () => {
    const source =
      '<button type="button" mat-button matTooltip="Go"><mat-icon>home</mat-icon></button>';
    const result = run(source, { rules: new Set<RuleName>(['icon']) });
    expect(result.text).toBe(
      '<button type="button" mat-button matTooltip="Go"><z-icon name="home" /></button>',
    );
    expect(result.remaining).toEqual({ 'mat-button': 1, matTooltip: 1 });
    expect(run(source, { rules: new Set<RuleName>(['imports']) }).text).toBe(source);
  });

  it('counts what is left, once per element, and the zenit-ui symbols in use', () => {
    const result =
      run(`<mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput [matAutocomplete]="auto"></mat-form-field>
<table mat-table [dataSource]="rows" matSort><ng-container matColumnDef="a"><td mat-cell *matCellDef="let row">{{ row }}</td></ng-container>
<tr mat-row *matRowDef="let row; columns: cols"></tr></table>
<ng-template matTabContent></ng-template><mat-divider></mat-divider>
<div class="card mat-elevation-z4 mat-typography" [class.mat-app-background]="x"></div>
<z-icon name="a" /><button zBtn zTooltip="x" type="button">b</button><z-spinner /><z-badge>c</z-badge>`);
    expect(result.remaining).toEqual({
      'mat-form-field': 1,
      'mat-label': 1,
      matInput: 1,
      matAutocomplete: 1,
      'mat-table': 1,
      matSort: 1,
      matColumnDef: 1,
      'mat-cell': 1,
      matCellDef: 1,
      'mat-row': 1,
      matRowDef: 1,
      matTabContent: 1,
      'mat-divider': 1,
      // Static Material classes count as well; a class binding is not looked at.
      '.mat-elevation-z4': 1,
      '.mat-typography': 1,
    });
    expect(result.zenit).toEqual(['ZBadge', 'ZButton', 'ZIcon', 'ZSpinner', 'ZTooltip']);
    expect(result.edits).toEqual([]);
  });

  it('writes the other quote inside a "..." string and refuses what needs both', () => {
    const options = { quote: "'", plainString: true } as const;
    expect(
      run('<button type=button mat-flat-button><mat-icon>add</mat-icon></button>', options).text,
    ).toBe("<button type=button zBtn='primary'><z-icon name='add' /></button>");
    expect(run('<mat-chip-set><mat-chip>A</mat-chip></mat-chip-set>', options).text).toBe(
      "<span class='z-cluster'><z-badge>A</z-badge></span>",
    );
    expect(run("<mat-icon>{{ a ? 'x' : 'y' }}</mat-icon>", options).codes).toEqual([
      'manual:icon-content',
    ]);
    expect(run("<i [matTooltip]='t' [matTooltipDisabled]='off'></i>", options).codes).toEqual([
      'manual:tooltip-disabled',
    ]);
  });
});

describe('edit groups', () => {
  const source = '0123456789';
  const group = (edits: [number, number, string, string?][]) => {
    const made = new Group('icon', edits[0][0], source);
    edits.forEach(([start, end, text, expect]) => made.replace(start, end, text, expect));

    return made;
  };

  it('skips an unsafe group, keeps the safe ones and reports the skipped spot', () => {
    const groups = [
      group([[0, 2, 'a']]),
      group([[1, 3, 'b']]), // overlaps the first
      group([[4, 5, 'c', '9']]), // the text is not what the planner expected
      group([[8, 12, 'd']]), // out of bounds
      group([
        [2, 2, 'e'],
        [5, 6, 'f', '5'],
      ]), // touches the first, which is fine
    ];
    const { accepted, rejected } = acceptGroups(groups, source.length);
    expect(accepted).toEqual([groups[0], groups[4]]);
    expect(rejected.map((finding) => [finding.offset, finding.kind, finding.code])).toEqual([
      [1, 'manual', 'unsafe-edit'],
      [4, 'manual', 'unsafe-edit'],
      [8, 'manual', 'unsafe-edit'],
    ]);
    expect(applyEdits(source, sortEdits(accepted.flatMap((entry) => entry.edits)))).toBe(
      'ae234f6789',
    );
  });

  it('sorts an insertion in front of a replacement at the same offset', () => {
    const edits = sortEdits([
      { start: 3, end: 5, text: '' },
      { start: 3, end: 3, text: 'X' },
    ]);
    expect(applyEdits(source, edits)).toBe('012X56789');
  });
});
