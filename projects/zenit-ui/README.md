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

### 2. Set `z-root`

The class `z-root` belongs on `<html>` and on `<body>`. It sets background, text color, font, `font: inherit` for controls and the focus ring. Overlays attach to `body` and inherit the same variables.

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

The `layer(schriften)` is required: `material-icons` sets its own `font-size` on `.material-icons` and is loaded after `zenit-ui.css`. The layer makes sure `.z-icon` from the library wins. Without it the icon would be 24px inside a 20px box. A complete example is in `projects/ui-demo/src/styles.css`.

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

Entries marked "(addition)" are not part of the reference table in `spec/guidelines/40-bibliothek.md`. They exist in the code today, mostly to keep ARIA labels overridable from the application.

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
| Tabs | `nav[zTabs]`, `a[zTab]` | `active` |
| Segment | `z-segment` | `options: {value, label}[]`, `[(value)]`, `ariaLabel`; Forms; `disabled` (addition) |
| Stepper | `z-stepper` | `steps: string[]`, `current` |
| Panel | `z-panel` | `title`, `flush`, `busy`; slot `[zPanelActions]`, `z-pagination` is moved to the end |
| Metric | `z-metrics`, `z-metric` | `label`, `value`, `unit`, `sub`, `percent` (warning from 80, error from 95) |
| ServerList | `z-rows`, `z-rows-head`, `a[zRow]`, `div[zRow]`, `z-row-main`, `[zRowNum]` | `columns` (grid columns) on `z-rows`; `title`, `meta`, `image` on `z-row-main` |
| FileTable | `z-table-container`, `table[zTable]`, `[zNum]`, `[zTableName]` | none; `ariaLabel` on `z-table-container` (addition) |
| Pagination | `z-pagination` | `[(page)]`, `pageSize` (25), `total`, `itemLabel`; `rangeLabel`, `ariaLabelPrev`, `ariaLabelNext` (additions) |
| Alert | `z-alert` | `status`, `title`, `icon`; content is the text; slot `[zAlertAction]` |
| EmptyState | `z-empty-state` | `title`; content is the text; slot `[zEmptyAction]` |
| Skeleton | `z-skeleton` | `width`, `thumb` |
| Sidebar | `z-sidebar`, `z-sidebar-group`, `[zSidebarItem]` | `ariaLabel`; `label`; `icon`, `active`, `count` |
| AppHeader | `z-app-header`, `a[zHeaderLink]`, `[zBrand]` | `navLabel`; `active`; slot `[zHeaderEnd]`; `menuLabel` (addition) |
| PageHeader | `z-page-header` | `title`, `sub`; content are the actions |
| Footer | `z-footer`, `z-footer-col` | `heading`; slot `[zFooterBase]` |
| Dialog | service `ZDialog`, layout `z-dialog` | `open(component, config)`, `confirm({title, body, confirmLabel, cancelLabel, danger, requireText})` returns `Observable<boolean>`; slot `[zDialogActions]`; `requireLabel` and `cancelLabel` as a required field of the config (additions) |
| Menu | `z-menu`, `button[zMenuItem]`, `z-menu-separator` | `icon`, `danger`, `disabled`, `(triggered)`; trigger `[cdkMenuTriggerFor]` |
| Toast | service `ZToast`, `z-toast-outlet` | `show`, `success`, `error`, `dismiss`; options `status`, `icon`, `actionLabel`, `action`, `duration`; `closeLabel` on `z-toast-outlet` (addition) |
| Tooltip | `[zTooltip]` | text as the value |
| Console | `z-console` | `lines: {time, text, level}[]`, `disabled`, `placeholder`; `(command)`; `logLabel`, `inputLabel`, `endLabel` (additions) |
| Hero | `z-hero` | `title`, `lead`, `note`; slots `[zHeroActions]`, `[zHeroAside]` |
| GameTile | `z-game-grid`, `button[zGameTile]` | `title`, `price`, `cover`, `selected` |
| PriceSummary | `z-price-summary` | `label`, `price`, `period`, `lines: {label, value}[]`, `note`; content is the button |
| SpecList | `z-spec-list` | `items: {term, value, note, mono}[]` |
| Faq | `z-faq` | `question`, `open`; content is the answer |

The generated reference with every signature, type and default is produced by `npm run docs:api` into `docs/api/`.

## Documented deviations from the reference styles

`spec/components/bundle.css` is the reference for all styles. Five deviations are deliberate:

- The base rule for `font` and `color` on controls uses `:where(button, input, select, textarea)`. The reference selector has a specificity that beats component classes; `:where()` lowers it to the class level, the values are unchanged.
- Below 640px small controls are 40px high (`.z-btn--sm`, `.z-input--sm`, `.z-select--sm select`, `.z-menu__item`), because touch targets on mobile are at least 40px.
- Below 640px the alert wraps its action button onto its own line, so that title, text and button stay readable at 360px.
- `div[zRow]` resets `cursor` to `auto`. A row is only clickable as `a[zRow]`; the non-interactive variant must not look clickable.
- The CDK backdrop runs without a fade (`transition: none`). Transitions are limited to `color`, `background-color` and `border-color`.

## Rules

Color, spacing, radius, typography and shadow come only from `tokens.css`. `tokens.css` is the single place with hex and pixel values. Your own styles reference `var(--…)` and set no literal values of their own.

Not allowed are `@angular/material`, `linear-gradient`, `radial-gradient`, `backdrop-filter`, `text-shadow`, colored `box-shadow`, grid backgrounds, pill badges above headings, all-caps labels, icon backplates, cards with a colored border, metric tiles for marketing numbers, and hex or pixel values outside the tokens. The complete list is in the section "Verboten" of the system overview (`CLAUDE.md`).

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
        message: 'Angular Material wird in zenit-ui nicht verwendet. Nur @angular/cdk.',
      },
    ],
  },
],
```

## Development

Inside the workspace `zenit-ui-workspace`:

```bash
ng build zenit-ui     # build the library, output in dist/zenit-ui
ng test zenit-ui      # unit tests of the library
npm run lint          # ESLint over library and demo
npm run lint:css      # Stylelint over projects/**/*.css
npm run e2e           # Playwright with axe over the demo pages
npm run docs:api      # TypeDoc reference into docs/api
npm run check         # lint, lint:css, both builds and the unit tests in one run
ng serve ui-demo      # demo app with every building block in all states
```

The demo app `ui-demo` shows every building block in the states idle, hover, focus, active, disabled, loading, error, empty and success. It is the reference for markup and classes.
