# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Example application `beispiel-app`.** One complete page, "Gameserver" of the customer area, as the template for real pages: shell with skip link, AppHeader, Footer and toast outlet; PageHeader with one fact and one primary; filter row; panel "Meine Server" with ServerList, row menu and Pagination; every state from `spec/guidelines/15-zustaende.md` reachable through `?zustand=laden|leer|fehler`, plus the filtered-to-nothing case; toast after a restart and a confirmation with the server name before deleting. It consumes the library from the built package in `dist/zenit-ui` through a `paths` override in its tsconfigs, following the setup steps of the package README, and thereby proves that the package works. Scripts `build:beispiel`, `start:beispiel` and `e2e:beispiel`; `check` and the CI workflow build and test it as well. Documentation in `projects/beispiel-app/README.md`.
- **Shared Playwright checks.** The page checks (axe, no horizontal scrolling, computed-style rules, focus ring, touch targets) moved from `e2e/demo.spec.ts` into `e2e/pruefungen.ts`, unchanged, and are used by `e2e/beispiel.spec.ts` as well.

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
