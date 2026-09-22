# zenit-ui

`zenit-ui` is the Angular library of the Zenit design system. It provides 30 building blocks for the public website, the customer area and the server panels of Zenit-Hosting, plus Icon, Spinner and Tooltip. The building blocks are standalone components and directives with `OnPush` and signal inputs. They ship no styles of their own: every class lives in the bundled CSS files and uses only the tokens from `tokens.css`. Angular Material is not used; overlays and focus traps come from `@angular/cdk`, form fields are native elements. Business logic, services and copy stay in your application.

## Requirements

- Angular 22 (`@angular/core`, `@angular/common`, `@angular/forms`)
- `@angular/cdk` 22 for dialog, menu, tooltip and overlays
- `rxjs` 7.8

All five are peer dependencies and are not bundled with the library. Its only own dependency is `tslib`.

## Installation

The library is not published to npm. You build it and install the package locally:

```bash
ng build zenit-ui
cd dist/zenit-ui
npm pack
```

This produces `zenit-ui-0.1.0.tgz`. In your application:

```bash
npm i ./zenit-ui-0.1.0.tgz
```

> **Install from the tarball, never from the public registry.** `zenit-ui` is an unscoped name that
> nobody has claimed on npmjs.com, so `npm i zenit-ui` or `ng add zenit-ui` would fetch whatever
> somebody else publishes under it and, in the case of `ng add`, run its schematics against your
> workspace. Point every command at the local file, as the sections below do, until the name is
> claimed or the package is scoped.

### Working against a linked build

While you develop against the library, `npm link` or a junction is faster than repacking. Three
settings belong to that setup, not to a real install. In `angular.json`, on the build target and on
the test target:

```json
"preserveSymlinks": true,
"runnerConfig": true
```

and in the file the second line makes the builder read, `vitest-base.config.ts` in the project or
workspace root:

```ts
test: {
  server: { deps: { inline: [/zenit-ui/] } },
}
```

Without `preserveSymlinks` the bundler resolves the linked package to its real path and takes
`@angular/core` from the library workspace: two Angular instances, `NG0203: inject() must be called
from an injection context`. `server.deps.inline` is needed because a package in `node_modules` is
external to the test bundle, so Vitest lets Node load it, and Node follows the link regardless of
what Vite is told. And without `runnerConfig` the config file is not read at all: the option
defaults to `false`, so the file sits there and changes nothing. All three are needed together, and
both workspaces should be on the same Angular patch version. A tarball or registry install has none
of this: the package then lives inside your own `node_modules` and resolves `@angular/core` from
there. The measured table and the alternative via `resolve.dedupe` are in
[`docs/ng-add.md`](../../docs/ng-add.md), "Working against a linked build".

## Setup

### 1. Register the styles in `angular.json`

The order is binding: tokens first, then the CDK positioning CSS, then the library styles, then your application.

```json
"styles": [
  "zenit-ui/styles/tokens.css",
  "@angular/cdk/overlay-prebuilt.css",
  "zenit-ui/styles/zenit-ui.css",
  "src/styles.css"
]
```

Both files can be pulled in via `@import` just as well, if you use your own entry stylesheet:

```css
@import "zenit-ui/styles/tokens.css";
@import "@angular/cdk/overlay-prebuilt.css";
@import "zenit-ui/styles/zenit-ui.css";
```

`zenit-ui.css` imports the partials `styles/_*.css`. They sit next to it in the package and need no entry of their own.

Your own stylesheet is last on purpose: that is where the **page width** is set. `--container` defaults to 1120px and is the width of the application, not a fixed value of the design system. `.z-container` is the only rule that reads it, so one declaration moves header, content and footer of every page:

```css
/* src/styles.css */
:root {
  --container: 1440px;
}
```

`:root`, not `html`: both blocks weigh (0,1,0) and the later one wins, while a bare `html` selector weighs (0,0,1) and would lose. Running text stays at `--measure` (65ch) whatever the page width is. Which blocks grow with `--container` and which keep a width of their own is in [`docs/layout.md`](../../docs/layout.md), and why it is a stylesheet declaration and not an option of `provideZenitTheme` is in [`docs/theming.md`](../../docs/theming.md).

### 2. Set `z-root`

The class `z-root` belongs on `<html>` and on `<body>`. It sets background, text color, font, `font: inherit` for controls and the focus ring. Overlays attach to `body` and inherit the same variables. On `<html>` it sets no `font-size` and no `line-height` at all, so the rem base stays yours — your own `html { font-size: … }` wins at any specificity and in any include order — and its link rules no longer beat your own classes, so legacy styles keep working while you migrate page by page. **Both elements are required**: the page size comes from `body.z-root` alone, and a setup that sets the class on `<html>` only renders at 16px/normal instead of 14px/20px.

```html
<!doctype html>
<html lang="de" class="z-root">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body class="z-root">
    <app-root></app-root>
  </body>
</html>
```

### 3. Self-host the fonts

The library loads no font. Your application brings four, all self-hosted, so that no request to Google is needed:

- Material Icons (the ligature font for `z-icon`)
- Inter in 400, 500 and 600 (`body`)
- Space Grotesk in 600 and 700 (`display`)
- JetBrains Mono in 400 and 600 (`mono`)

```css
@import "material-icons/iconfont/filled.css" layer(schriften);
@import "@fontsource/inter/400.css";
@import "@fontsource/inter/500.css";
@import "@fontsource/inter/600.css";
@import "@fontsource/space-grotesk/600.css";
@import "@fontsource/space-grotesk/700.css";
@import "@fontsource/jetbrains-mono/400.css";
@import "@fontsource/jetbrains-mono/600.css";
```

The `layer(schriften)` is required: `material-icons` sets its own `font-size` on `.material-icons` and is loaded after `zenit-ui.css`. The layer makes sure `.z-icon` from the library wins. Without it the icon would be 24px inside a 20px box. A complete example is in `projects/ui-demo/src/styles.css` in the repository of the design system.

### 4. Mount the toast outlet

`<z-toast-outlet />` goes once into your application shell, best at the end of the layout. The service `ZToast` writes to it.

```html
<app-header />
<router-outlet />
<app-footer />
<z-toast-outlet />
```

### 5. Minecraft subtheme

On `/minecraft` and in the Minecraft panel you put `z-theme-mc` on the page container. The primary button then becomes `mc-accent` with `on-mc`, and active icons turn green. Everything else stays the same: surfaces, radii, typography, spacing, status colors.

```html
<div class="z-theme-mc">
  <button zBtn="primary">Server erstellen</button>
</div>
```

## Example

```ts
import { Component } from '@angular/core';
import { ZButton, ZField, ZInput, ZPanel, ZPanelActions } from 'zenit-ui';

@Component({
  selector: 'app-server-name',
  imports: [ZPanel, ZPanelActions, ZField, ZInput, ZButton],
  template: `
    <z-panel title="Servername">
      <button zBtn="ghost" size="sm" zPanelActions>Zurücksetzen</button>
      <z-field label="Name" for="name" hint="Erscheint in der Serverliste.">
        <input zInput id="name" name="name" value="Beispiel-Server" />
      </z-field>
      <button zBtn="primary">Speichern</button>
    </z-panel>
  `,
})
export class ServerName {}
```

## Component API

Selectors and inputs are binding, so that pages and building blocks can be built in parallel. Inputs are signals. Two-way binding via `model()`.

Entries marked "(addition)" are not part of the reference table (`spec/guidelines/40-bibliothek.md` in the repository of the design system). They exist in the code today, mostly to keep ARIA labels overridable from the application.

| Component | Selector | Inputs, outputs, slots |
| --- | --- | --- |
| Icon | `z-icon` | `name`, `size: 'sm' \| 'md'` |
| Spinner | `z-spinner` | `label` |
| Button | `button[zBtn]`, `a[zBtn]` | `zBtn: 'primary' \| 'secondary' \| 'ghost' \| 'danger'` (default secondary), `size: 'sm' \| 'md' \| 'lg'`, `block`, `iconOnly`, `loading`, `disabled` |
| Badge | `z-badge` | `status: 'neutral' \| 'success' \| 'warning' \| 'danger' \| 'info'`, `dot` |
| Field | `z-field` | `label`, `for`, `hint`, `error` |
| Input | `input[zInput]`, `textarea[zInput]` | `size`, `mono`, `invalid`; search via `z-input-group` with `icon` |
| Select | `z-select` | `size`; content is a native `<select>` |
| Checkbox | `z-checkbox` | `[(checked)]`, `disabled`, `ariaLabel`; Forms |
| Toggle | `z-toggle` | `[(checked)]`, `disabled`, `ariaLabel`, `ariaLabelledby`; Forms |
| Setting | `z-setting` | `title`, `key`, `description`, `titleId`; content is the control |
| Slider | `z-slider` | `label`, `min`, `max`, `step`, `unit`, `ticks`, `hint`, `[(value)]`, `disabled`; Forms; `ariaLabel` (addition) |
| SkipLink (addition) | `a[zSkipLink]` | none; the caller writes the text and the `href`, the target needs `tabindex="-1"` |
| Tabs | `nav[zTabs]`, `a[zTab]` | `active` |
| Segment | `z-segment` | `options: {value, label}[]`, `[(value)]`, `ariaLabel`; Forms; `disabled` (addition) |
| Stepper | `z-stepper` | `steps: string[]`, `current` |
| Panel | `z-panel` | `title`, `flush`, `busy`; slot `[zPanelActions]`, `z-pagination` is moved to the end |
| Metric | `z-metrics`, `z-metric` | `label`, `value`, `unit`, `sub`, `percent` (warning from 80, error from 95) |
| ServerList | `z-rows`, `z-rows-head`, `a[zRow]`, `div[zRow]`, `z-row-main`, `[zRowNum]` | `columns` (grid columns) on `z-rows`; `title`, `meta`, `image` on `z-row-main`; `thumbText`, `thumb` and slot `[zRowThumb]` (additions) |
| FileTable | `z-table-container`, `table[zTable]`, `[zNum]`, `[zTableName]`, `th[zSortHeader]` | none; `ariaLabel` on `z-table-container`, `[(sort)]` on `table[zTable]` and the sort header with `zSortHeader`, `sortStart`, `disabled` (additions) |
| Pagination | `z-pagination` | `[(page)]`, `[(pageSize)]` (25), `total`, `itemLabel`; `pageSizeOptions`, `pageSizeLabel`, `rangeLabel`, `ariaLabelPrev`, `ariaLabelNext` (additions) |
| Alert | `z-alert` | `status`, `title`, `icon`; content is the text; slot `[zAlertAction]` |
| EmptyState | `z-empty-state` | `title`; content is the text; slot `[zEmptyAction]` |
| Skeleton | `z-skeleton` | `width`, `thumb`, `tile` |
| Sidebar | `z-sidebar`, `z-sidebar-group`, `[zSidebarItem]` | `ariaLabel`; `label`; `icon`, `active`, `count` |
| AppHeader | `z-app-header`, `a[zHeaderLink]`, `[zBrand]` | `navLabel`; `active`; slot `[zHeaderEnd]`; `menuLabel` (addition); `[(open)]` (addition) |
| PageHeader | `z-page-header` | `title`, `sub`; content are the actions |
| Footer | `z-footer`, `z-footer-col` | `heading`; slot `[zFooterBase]` |
| Dialog | service `ZDialog`, layout `z-dialog` | `open(component, config)`, `confirm({title, body, confirmLabel, cancelLabel, danger, requireText})` returns `Observable<boolean>`; slot `[zDialogActions]`; `requireLabel` and `cancelLabel` as a required field of the config (additions) |
| Menu | `z-menu`, `button[zMenuItem]`, `z-menu-separator` | `icon`, `danger`, `disabled`, `(triggered)`; trigger `[cdkMenuTriggerFor]` |
| Toast | service `ZToast`, `z-toast-outlet` | `show`, `success`, `error`, `dismiss`; options `status`, `icon`, `actionLabel`, `action`, `duration`; `closeLabel` on `z-toast-outlet` (addition); option `live` and `provideZenitToast({ maxVisible, overflow })` (additions) |
| Tooltip | `[zTooltip]` | text as the value |
| Console | `z-console` | `lines: {time, text, level}[]`, `disabled`, `placeholder`; `(command)`; `logLabel`, `inputLabel`, `endLabel` (additions) |
| Hero | `z-hero` | `title`, `lead`, `note`; slots `[zHeroActions]`, `[zHeroAside]`; `size` (addition) |
| GameTile | `z-game-grid`, `button[zGameTile]` | `title`, `price`, `cover`, `selected`; `(coverError)` (addition) |
| PriceSummary | `z-price-summary` | `label`, `price`, `period`, `lines: {label, value}[]`, `note`; content is the button |
| SpecList | `z-spec-list` | `items: {term, value, note, mono}[]` |
| Faq | `z-faq` | `question`, `open`; content is the answer |
| Theme | service `ZTheme`, `provideZenitTheme(config)` | `scheme()`, `resolvedScheme()`, `accent()`, `setScheme(id)`, `setAccent(id)`, `reset()`; config `schemes`, `accents`, `defaultScheme`, `defaultAccent`, `storageKey`, `target` |
| Labels | `provideZenitLabels(partial)`, `Z_LABELS`, `Z_LABELS_DE`, `Z_LABELS_EN` | one key per built-in text; the inputs of the components still win |

The generated reference with every signature, type and default is produced inside the repository of the design system by `npm run docs:api`; it is not part of this package.

One thing is worth knowing before you build a page from this table. It turned up while building `projects/beispiel-app` against the packed library:

- **Slots and control flow.** `z-panel` picks `z-pagination` out of the projected content, and Alert, EmptyState, AppHeader and Footer have slots of their own. A node inside `@if`, `@for` or `@switch` only reaches its slot while it is the single root node of that block; otherwise it stays in the default content. Give such a node an `@if` of its own.

## Themes

`tokens.css` carries one colour scheme, `dark`. The opt-in stylesheet `zenit-ui/styles/themes.css` adds `light` and `contrast` plus the accents `blau`, `gruen` and `violett`, and `provideZenitTheme()` switches between them and stores the choice:

```json
"styles": [
  "zenit-ui/styles/tokens.css",
  "@angular/cdk/overlay-prebuilt.css",
  "zenit-ui/styles/themes.css",
  "zenit-ui/styles/zenit-ui.css",
  "src/styles.css"
]
```

```ts
providers: [provideZenitTheme({ defaultScheme: 'system' })];
```

The order is binding, because `:root` and `[data-theme="light"]` weigh the same and the later rule wins. A scheme is a block of token overrides, so an own scheme is CSS plus its id in `schemes`. Components never learn about any of this.

**These values are not part of the design system yet.** They were derived by the contrast rules in `docs/theming.md` and checked by `node tools/check-theme-contrast.mjs` (3 schemes × 4 accents, 456 pairs), but they still need the design owner's approval before they move into `tokens.json`. Everything about schemes, accents, the service, SSR and the gate is in [`docs/theming.md`](../../docs/theming.md).

## Server rendering

Every building block can be constructed and rendered on a server: no component
touches `window`, `document.body`, `matchMedia`, `localStorage`,
`MutationObserver`, `ResizeObserver` or a layout measurement while it is being
constructed or during its first change detection run. Where a block needs one of
those to do its work, it creates it lazily and only in a browser, and the
missing behaviour is behaviour there is nothing to do about on a server anyway:
no box changes size, nothing scrolls, and no caller rewrites an attribute.

That is a guarantee about **one render with no user interaction**, which is what
a prerender or an SSR response is. Everything an overlay does — menu, dialog,
tooltip, toast — happens after a click and therefore only ever in a browser; the
triggers themselves render on the server.

`ZTheme` is safe to inject during SSR and reports the defaults. It writes
exactly one thing into the server document: a `defaultScheme` other than
`'system'` becomes `data-theme` on `<html>`, so the delivered HTML already
carries the scheme. With `defaultScheme: 'system'` it writes nothing, because
the server knows neither the stored choice nor the operating system — the init
script from `zenitThemeInitScript()` in `<head>` resolves that in the browser
before the first paint. Both halves are checked against the real prerendered
HTML by `npm run check:ssr`.

The gate itself is described in [`CONTRIBUTING.md`](../../CONTRIBUTING.md).

## Labels and languages

The library holds no copy except the accessible names and the one sentence a component cannot leave empty. They live in one registry, so an application in another language sets them once at bootstrap:

```ts
providers: [provideZenitLabels(Z_LABELS_EN)];
```

`provideZenitLabels` merges over the German defaults, which keeps a partial override valid, and every input that used to carry a German default still wins over the registry. The keys, the per-usage inputs and how to set them for one subtree only are in [`docs/labels.md`](../../docs/labels.md).

## `ng add`

The setup above is a schematic as well. Name the tarball, not the package: `ng add zenit-ui` would resolve the unclaimed name on the public registry and run a stranger's schematics.

```bash
ng add ./zenit-ui-0.1.0.tgz --themes
```

It registers the stylesheets in `angular.json` in the prescribed order, merges `z-root` into `<html>` and `<body>`, adds `@angular/cdk` and the four font packages with their `@import` rules, and mounts `<z-toast-outlet />` in the root component. With `--themes` it also registers `themes.css`, puts the theme init script into `index.html`, adds `provideZenitTheme()` and sets `inlineCritical: false` for production. Every step is idempotent, and a source file is either fully patched or left untouched with the manual step in the log (NgModule applications, `imports` that are not an array literal). An existing `lang` on `<html>` is kept. To run it again after the package is installed: `ng generate zenit-ui:ng-add --project my-app`. What it changes exactly, which options it takes and its limits are in [`docs/ng-add.md`](../../docs/ng-add.md).

### Coming from Angular Material

`ng generate zenit-ui:migrate-material --path src/app/billing --dry-run` rewrites what can be rewritten mechanically (`mat-icon`, `mat-*-button`, `matTooltip`, standalone `mat-spinner`, static `mat-chip` and the `imports` of the components) by source span, leaves form fields, selects, dialogs, tables, menus and all styles alone, and writes a Markdown and a JSON report with file, line, rule, reason and suggested fix for every spot it did not convert. Run it per route, without `--dry-run` once the report looks right; a second run changes nothing. Details: [`docs/migrate-material.md`](../../docs/migrate-material.md).

## Documented deviations from the reference styles

`spec/components/bundle.css` in the repository of the design system is the reference for all styles. These deviations are deliberate:

- The base rule for `font` and `color` on controls uses `:where(button, input, select, textarea)`. The reference selector has a specificity that beats component classes; `:where()` lowers it to the class level, the values are unchanged.
- The link base rules are `.z-root :where(a)` and `.z-root :where(a):hover`, for the same reason. At the reference specificity (0,1,1) they beat every class an application can put on a link (0,1,0): an application's own skip link came out red on red (1.29:1), and every link on a page that is not migrated yet changed colour and underline the moment `z-root` was set. The values are unchanged, and none of the library's own link rules moves: they all weigh (0,2,1) or more. Three things follow for your own stylesheet:
  - **Your stylesheet has to load after `zenit-ui.css`.** At (0,1,0) your class now *ties* with the base rule, and a tie is decided by source order, not by specificity. The `styles` order above does that. Measured: a rule `.lg { color: … }` before `zenit-ui.css` still loses, after it wins. The hover rule weighs (0,2,0), so changing the hover needs `.lg:hover`, not `.lg`.
  - **A rule of yours at (0,1,1), such as `.app a`, now also reaches plain links inside library components**: panel, alert, row, table, empty state, the sub line of the page header, header, tabs, sidebar, stepper, toast, the body of a dialog, tooltip and menu. It does not reach the footer lists, nor any link carrying a library class (`a.z-btn`, `a.z-tab`, `a.z-side__item`, `a.z-header__link`, `a.z-row`, `a.z-skip-link`), which all have a counter-rule at (0,2,1) or more.
  - **The underline for links in running text stays at (0,2,1)** and cannot be switched off from your stylesheet. Its selector ends in `a:not([class*="z-"])`, so any class whose name contains `z-` takes a link out of it, by accident too (`quiz-link`). Do not build on that: `.z-legacy` below is the documented way to keep the library out of a subtree.
- The page size lives in `.z-root:where(:not(html))`, not in `.z-root`. The reference writes `font-size: 14px` and `line-height: 20px` into the rule for the page, and the documented setup puts `z-root` on `<html>` as well: there those 14px would move `1rem` from 16px to 14px for the whole document and override the size the visitor set in the browser. Split off like this, the library sets **nothing** on `<html>`, so your own `html { font-size: … }` is the only author rule there and wins at every specificity and in either include order — `html { font-size: var(--base-font-size) }` for a user setting included. `:where()` weighs (0,0,0), so the rule is still (0,1,0), exactly what `.z-root` weighed: `body.z-root` and every page container keep the same weight against a class of yours on the same element, and the tie is decided by source order as above. `body.z-root` carries the class itself and keeps 14px/20px, which is what every component and every overlay inherits. The components of the library compute in px; the one `rem` in its stylesheets is the `1rem` of `.z-legacy`, which hands the visitor's size back to a page that is not migrated.
- `.z-legacy` is an addition: the class for a subtree that is not migrated yet. It resets the inherited `font-size` to `1rem`, `line-height` to `normal` and `-webkit-font-smoothing` to `auto`, and the base rules that style bare elements (`.z-root *`, `:where(button, input, select, textarea)`, `:where(a)` and its hover, the underline in running text, `:focus-visible`) are each written as two selectors, `.z-root X:not(:where(.z-legacy, .z-legacy *))` and `:where(.z-legacy) .z-root X`. Both `:where()` weigh (0,0,0), so every specificity above still holds; the first leaves out the host and everything in it, the second lets a `z-root` container inside the subtree switch the rule on again. The exclusion on the universal rule costs +14 to +18 % on a forced full style recalculation (4.2 to 4.9 ms on a page of 4130 elements). Family, colour, background and `color-scheme` are left to the application. `@scope` would say the same more directly, but Firefox before 146 and Safari before 17.4 lack it and are inside the range Angular 22 builds for; `revert` rolls back to the browser's stylesheet instead of the application's rule. See [`docs/legacy.md`](../../docs/legacy.md).
- Below 900px the header is one row of brand, end slot and menu button (`gap: space-3`, `order: 1` on the button, an end slot that wraps its own items), and an image inside `[zBrand]` is a block. The reference has no mobile header at all. See [`docs/components/app-header.md`](../../docs/components/app-header.md).
- Below 640px small controls are 40px high (`.z-btn--sm`, `.z-input--sm`, `.z-select--sm select`, `.z-menu__item`), because touch targets on mobile are at least 40px.
- Below 640px the alert wraps its action button onto its own line, so that title, text and button stay readable at 360px.
- `div[zRow]` resets `cursor` to `auto`. A row is only clickable as `a[zRow]`; the non-interactive variant must not look clickable.
- The CDK backdrop runs without a fade (`transition: none`). Transitions are limited to `color`, `background-color` and `border-color`.
- Below 640px a `[zRowAction]` keeps its cell and its row gets a third column. The reference hides every cell of a row from the third on, which also hid the menu button of a row, so its entries were unreachable on a phone.
- `z-footer` carries `background: var(--bg)`, like `z-app-header`. The reference has none, because its page ground already is `--bg`; the addition keeps the footer readable above a legacy surface while an application migrates route by route, and changes nothing on a migrated page, since the colour is the same as the page. Measured on a light `.z-legacy` island (`e2e/legacy.spec.ts`): `.z-footer__base` and its links already carry their own `color` (`text-subtle`, `text-muted`), so nothing inherits from the legacy surface and no `color` was added.

## Rules

Color, spacing, radius, typography and shadow come only from `tokens.css`. `tokens.css` is the single place with hex and pixel values. Your own styles reference `var(--…)` and set no literal values of their own.

Not allowed are `@angular/material`, `linear-gradient`, `radial-gradient`, `backdrop-filter`, `text-shadow`, colored `box-shadow`, grid backgrounds, pill badges above headings, all-caps labels, icon backplates, cards with a colored border, metric tiles for marketing numbers, and hex or pixel values outside the tokens. The complete list is in the section "Verboten" of the system overview, `CLAUDE.md` in the repository of the design system.

Stylelint enforces the rules automatically. Without that layer, generated code drifts again. Copy the configuration into your application:

```json
{
  "rules": {
    "color-no-hex": true,
    "color-named": "never",
    "function-disallowed-list": ["linear-gradient", "radial-gradient", "conic-gradient", "rgb", "rgba", "hsl", "hsla"],
    "property-disallowed-list": ["backdrop-filter", "text-shadow", "filter"],
    "declaration-property-value-disallowed-list": {
      "box-shadow": ["/^(?!var\\(--shadow-overlay\\)|none|inset 0 -2px 0 var\\().*/"],
      "transition": ["/transform|all/"],
      "font-family": ["/^(?!var\\(--font-(display|body|mono)\\)|inherit).*/"]
    },
    "selector-pseudo-element-disallowed-list": ["ng-deep"],
    "declaration-no-important": true
  },
  "overrides": [{ "files": ["**/tokens.css"], "rules": { "color-no-hex": null, "function-disallowed-list": null, "declaration-property-value-disallowed-list": null } }]
}
```

Plus an ESLint entry `no-restricted-imports` for the pattern `@angular/material*`, so that Material cannot come back in:

```js
'no-restricted-imports': [
  'error',
  {
    patterns: [
      {
        group: ['@angular/material', '@angular/material/*', '@angular/material*'],
        message: 'zenit-ui does not use Angular Material. Only @angular/cdk.',
      },
    ],
  },
],
```

## Development

Inside the workspace `zenit-ui-workspace`:

```bash
npm run build:lib      # library into dist/zenit-ui plus the compiled schematics
ng test zenit-ui       # unit tests of the library
npm run test:schematics # the schematics (ng add, migrate-material) against fixtures
npm run check:themes   # contrast gate over every scheme and accent
npm run lint           # ESLint over library, demo and example app
npm run lint:css       # Stylelint over projects/**/*.css
npm run e2e            # Playwright with axe over the demo pages
npm run e2e:beispiel   # the same checks over the example app, in all three schemes
npm run docs:api       # TypeDoc reference into docs/api, not committed
npm run check          # everything above except the Playwright runs
ng serve ui-demo       # demo app with every building block in all states
npm run start:beispiel # example app: one complete page against dist/zenit-ui
```

The demo app `ui-demo` shows every building block in the states idle, hover, focus, active, disabled, loading, error, empty and success. It is the reference for markup and classes.

The example app `beispiel-app` shows one complete page of the customer area, built the way an application builds it: it imports from the package in `dist/zenit-ui` and follows the setup steps above one by one. Its page "Einbindung" and the disclosures on the Gameserver page show the real files of that setup, generated from the sources themselves. Copy it as the starting point for a real page; `projects/beispiel-app/README.md` maps every region of the page to the rule it follows.
