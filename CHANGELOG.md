# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Theming.** The opt-in stylesheet `styles/themes.css` adds the colour schemes `light` and `contrast` next to the `dark` of `tokens.css`, plus the accents `blau`, `gruen` and `violett`. `provideZenitTheme()` applies the stored or the default choice before the first frame, `'system'` follows `prefers-color-scheme` live, and the service `ZTheme` switches scheme and accent, rejects unknown ids instead of throwing and writes nothing outside the browser. The values are derived by the contrast rules in `docs/theming.md` and checked by `node tools/check-theme-contrast.mjs` (3 schemes × 4 accents, 456 pairs, wired in as `npm run check:themes`); they still need the design owner's approval before they move into `tokens.json`.
- **Labels.** Every built-in text of the library lives in one registry: `Z_LABELS_DE` as the default, `Z_LABELS_EN` complete, `provideZenitLabels(partial)` to merge an override at bootstrap or on a lazy route, `Z_LABELS` for one subtree. The per-usage inputs still win. See `docs/labels.md`.
- **`ng add zenit-ui`.** A schematics collection that does the manual setup: style entries in `angular.json` (with `--themes` including `themes.css`), `z-root` on `<html>` and `<body>`, `@angular/cdk` and the four font packages with their `@import` rules, and `<z-toast-outlet />` in the root component. Idempotent, 14 tests via `npm run test:schematics`, built by `npm run build:lib`. See `docs/ng-add.md`.
- **Example application `beispiel-app`.** One complete page, "Gameserver" of the customer area, as the template for real pages: shell with skip link, AppHeader, Footer and toast outlet; PageHeader with one fact and one primary; filter row; panel "Meine Server" with ServerList, row menu and Pagination; every state from `spec/guidelines/15-zustaende.md` reachable through `?zustand=laden|leer|fehler`, plus the filtered-to-nothing case; toast after a restart and a confirmation with the server name before deleting. It consumes the library from the built package in `dist/zenit-ui` through a `paths` override in its tsconfigs, following the setup steps of the package README, and thereby proves that the package works. Scripts `build:beispiel`, `start:beispiel` and `e2e:beispiel`; `check` and the CI workflow build and test it as well. Documentation in `projects/beispiel-app/README.md`.
- **The example application shows its own wiring.** Every region of the Gameserver page carries a disclosure ("So ist es eingebunden") with the source that produces it, and the new page "Einbindung" (`/einbindung`) walks through the seven setup steps with the real files: `tsconfig` paths, the `styles` of `angular.json`, `index.html`, the font imports, the providers, the toast outlet and an own theme, plus the `ng add` shortcut. The blocks come from `tools/generate-example-snippets.mjs`, which copies the files verbatim into `quelltexte.generated.ts`; the regions are cut out at runtime by a tested pure function, and `npm run check:snippets` fails the build when the copy no longer matches the sources. New components `app-code-block` (mono, own scroll region, copy button with toast) and `app-theme-control` (scheme and accent from the header, stored by `ZTheme`).
- **Shared Playwright checks.** The page checks (axe, no horizontal scrolling, computed-style rules, focus ring, touch targets) moved from `e2e/demo.spec.ts` into `e2e/pruefungen.ts`, unchanged, and are used by `e2e/beispiel.spec.ts` as well, which now runs them in `dark`, `light` and `contrast` and over both pages: 50 tests.
- **Scripts and CI.** `build:lib` (library plus schematics) is used wherever the library is built, `snippets`, `check:snippets`, `check:themes` and `test:schematics` are new, and `check` as well as the CI workflow run all of them plus `e2e:beispiel`.

### Fixed

- Nothing in the library. Two findings from building against the package are documented instead: `Z_MENU` loses its element types in the emitted `.d.ts` (`(typeof ZMenu)[]`), so consumers have to import `ZMenu`, `ZMenuItem` and `ZMenuSeparator` one by one, and `ZDialog.confirm()` offers no way to say which element should get the focus back.

## [0.1.0] - 2026-09-21

First version of the library. Built and packed locally only; not published to npm and not pushed to a remote.

### Added

- **Foundation.** `tokens.css` as the single place with hex and pixel values, compiled from `spec/tokens.json`. `zenit-ui.css` with the partials `_grundlage.css`, `_formulare.css`, `_navigation.css`, `_daten.css`, `_rueckmeldung.css`, `_overlays.css`, `_werkzeuge.css`. The class `z-root` for `<html>` and `<body>` sets background, text color, typography, `font: inherit` for controls and the focus ring. Minecraft subtheme via `z-theme-mc`.
- **Icon, Spinner, Tooltip.** `z-icon` renders a Material Icons ligature with `aria-hidden="true"`. `z-spinner` with a `label`. `[zTooltip]` on `@angular/cdk/overlay`, opens on hover and focus, closes on Escape, wired through `aria-describedby`.
- **The 30 building blocks of the API table**, as standalone components and directives with `ChangeDetectionStrategy.OnPush` and signal inputs:
  - Base: Button, Badge, Field, Input, Select, Panel.
  - Forms: Checkbox, Toggle, Setting, Slider, Segment. Checkbox, Toggle, Slider and Segment implement `ControlValueAccessor`, so `ngModel` and reactive forms work.
  - Navigation: Tabs, Stepper, Sidebar, AppHeader, PageHeader, Footer.
  - Data: Metric, ServerList, FileTable, Pagination.
  - Feedback: Alert, EmptyState, Skeleton, Toast.
  - Overlays: Dialog with `ZDialog.open()` and `ZDialog.confirm()`, Menu. Both on the CDK, with focus trap, Escape and focus return.
  - Tools and public pages: Console, Hero, GameTile, PriceSummary, SpecList, Faq.
- **Form fields stay native.** `<input>`, `<textarea>`, `<select>`, `<input type="checkbox">`, `<input type="range">` and `<details>`/`<summary>` carry the library classes instead of being rebuilt.
- **Lint guards.** Stylelint rules from `spec/guidelines/30-angular.md` (no hex, no named colors, no gradients, no `backdrop-filter`, no `text-shadow`, no `filter`, `box-shadow` only `var(--shadow-overlay)`, transitions without `transform`/`all`, font families only from the three tokens, no `::ng-deep`, no `!important`), with `tokens.css` exempted. ESLint `no-restricted-imports` bans `@angular/material*`.
- **Tests.** 139 unit tests across 15 files for Field, Input, Select, Checkbox, Toggle, Slider, Segment, Pagination and Toast. Playwright with `@axe-core/playwright` over the demo pages: screenshots at 1440px and 375px, no axe violations, no horizontal scrolling at 360px, and computed-style checks for gradients, `backdrop-filter`, `text-shadow`, font families, font sizes and the focus ring.
- **Demo application `ui-demo`** with one page per package, each building block in the states idle, hover, focus, active, disabled, loading, error, empty and success.
- **Documentation.** English README for the workspace and for the package, this changelog, `CONTRIBUTING.md`, a TypeDoc reference via `npm run docs:api`, and a GitHub Actions workflow that is inert until the repository is pushed somewhere.

### Deviations from the reference styles

Five deliberate differences from `spec/components/bundle.css`, listed with their reasons in `projects/zenit-ui/README.md`: the `:where()` base rule for controls, 40px touch targets below 640px, the wrapping alert button on mobile, `cursor: auto` on `div[zRow]`, and the CDK backdrop without a fade.

Version links are omitted: the repository has no remote yet.
