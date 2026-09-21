# Bundle report

What `zenit-ui` costs a consumer, measured on this branch with the real Angular application builder.

Reproduce with:

```bash
npx ng build zenit-ui
node tools/bundle-report.mjs
```

The script prints the tables below, asserts the headline claims (exit code 1 if one fails) and deletes its scratch directory `.tmp-bundle/`. It runs about 40 production builds and takes two to three minutes. It adds no dependency and does not touch `angular.json`, `package.json` or `tsconfig.json`: the probes live in a throwaway workspace of their own.

**Short version**

- **Tree-shaking works, per statement.** An application that uses only `ZButton` gets `ZButton` and `ZSpinner` and nothing else: 1 978 bytes of library code, no `@angular/cdk`, no other component, no label table. The bundle is 3 bytes larger than the same button written as application code. Secondary entry points are **not** needed for tree-shaking, and no library source had to change.
- **Code splitting works per file, and that is where the single entry point costs.** Everything an application uses from one file lands in one chunk shared by all importers of that file. As soon as the shell uses any zenit-ui component, the dialog, menu and tooltip code of every lazy route, and the CDK behind it, is loaded up front. Measured with a really split package: a shell with `ZButton` and a lazy route with dialog, menu and tooltip loads 327.6 kB of initial JS today and 226.1 kB with three secondary entry points (−101.5 kB raw, −25.3 kB gzip).
- **Decision:** no restructuring now. Section 4 is the migration plan for `zenit-ui/dialog`, `zenit-ui/menu` and `zenit-ui/tooltip`. The other packages gain at most 2.3 kB gzip each and stay in the primary entry.

An earlier version of this report measured with plain esbuild and found that every import costs 99 % of the package. That number described plain esbuild, which cannot drop a class with a static initialiser, not the library. It is withdrawn.

## 1. What the package ships

| File                         | raw         | gzip        |
| ---------------------------- | ----------- | ----------- |
| `fesm2022/zenit-ui.mjs`      | 256.6 kB    | 50.6 kB     |
| `styles/_daten.css`          | 4.3 kB      | 1.3 kB      |
| `styles/_formulare.css`      | 4.7 kB      | 1.4 kB      |
| `styles/_grundlage.css`      | 10.0 kB     | 3.1 kB      |
| `styles/_navigation.css`     | 8.7 kB      | 2.5 kB      |
| `styles/_overlays.css`       | 3.1 kB      | 1.1 kB      |
| `styles/_rueckmeldung.css`   | 4.6 kB      | 1.6 kB      |
| `styles/_werkzeuge.css`      | 6.4 kB      | 1.9 kB      |
| `styles/themes.css`          | 1.0 kB      | 0.5 kB      |
| `styles/themes/accents.css`  | 3.3 kB      | 1.3 kB      |
| `styles/themes/base.css`     | 1.0 kB      | 0.5 kB      |
| `styles/themes/contrast.css` | 2.6 kB      | 1.2 kB      |
| `styles/themes/light.css`    | 3.0 kB      | 1.4 kB      |
| `styles/tokens.css`          | 3.0 kB      | 0.9 kB      |
| `styles/zenit-ui.css`        | 0.4 kB      | 0.2 kB      |
| **CSS total**                | **56.2 kB** | **18.9 kB** |

kB is 1 024 bytes, gzip is level 9 and Brotli quality 11, so the numbers do not drift with defaults.

The CSS is not tree-shakable, by design: components carry no styles of their own and the application registers the stylesheets globally. The 256.6 kB of JavaScript is partially compiled source with JSDoc; what reaches a bundle is in section 2.

## 2. Tree-shaking with the real builder

Each probe is a zoneless standalone application with one root component, built with `@angular/build:application`: `optimization: true`, no source maps, `outputHashing: none`, `statsJson: true`. The built package is **copied into the probe workspace's `node_modules/zenit-ui`**, so it is resolved through its own `package.json` like after `npm install`. "Initial JS" is every script `index.html` loads, including `modulepreload` links.

Two independent instruments decide what is in a bundle: esbuild's metafile (`stats.json`, bytes per input file) and strings that survive minification (CDK class names such as `cdk-overlay-container`, and the BEM block of every zenit-ui component, which sits in `hostAttrs`, class bindings and templates).

| Probe | imports                                                                      | raw      | gzip    | brotli  | Δ raw     | Δ gzip   | zenit-ui bytes | `@angular/cdk` bytes | CDK markers | zenit-ui blocks in the output                                                                                                          |
| ----- | ---------------------------------------------------------------------------- | -------- | ------- | ------- | --------- | -------- | -------------- | -------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| P0    | no zenit-ui import (baseline)                                                | 93.4 kB  | 31.0 kB | 28.0 kB |           |          | 0              | 0                    | no          | none                                                                                                                                   |
| P1    | `ZButton`                                                                    | 112.1 kB | 37.6 kB | 33.9 kB | +18.7 kB  | +6.6 kB  | 1 978          | 0                    | no          | `z-btn` `z-spinner`                                                                                                                    |
| P1c   | control: the same button as application code                                 | 112.1 kB | 37.6 kB | 33.8 kB | +18.7 kB  | +6.6 kB  | 0              | 0                    | no          | `z-btn` `z-spinner`                                                                                                                    |
| P2    | `ZButton`, `ZBadge`, `ZPanel`                                                | 125.4 kB | 41.6 kB | 37.4 kB | +32.0 kB  | +10.5 kB | 3 839          | 0                    | no          | `z-badge` `z-btn` `z-pagination` `z-panel` `z-spinner`                                                                                 |
| P3    | `ZField`, `ZInput`, `ZSelect`, `ZCheckbox`, `ZToggle`, `ZSlider`, `ZSegment` | 142.4 kB | 46.5 kB | 41.6 kB | +49.0 kB  | +15.4 kB | 8 945          | 0                    | no          | `z-check` `z-checkbox` `z-field` `z-input` `z-range` `z-segment` `z-select` `z-slider` `z-toggle`                                      |
| P4    | `ZDialog` (service, `confirm`)                                               | 201.7 kB | 62.4 kB | 55.8 kB | +108.3 kB | +31.4 kB | 6 804          | 53 643               | yes         | `z-backdrop` `z-btn` `z-confirm-dialog` `z-confirm-input` `z-dialog` `z-dialog-panel` `z-dialog-title` `z-field` `z-input` `z-spinner` |
| P5    | `ZMenu`, `ZMenuItem`, `ZMenuSeparator` with `CdkMenuTrigger`                 | 219.2 kB | 66.6 kB | 59.3 kB | +125.9 kB | +35.6 kB | 2 080          | 71 866               | yes         | `z-icon` `z-menu` `z-menu-separator`                                                                                                   |
| P6    | `ZToast` and `ZToastOutlet`                                                  | 122.9 kB | 41.3 kB | 37.1 kB | +29.5 kB  | +10.2 kB | 5 817          | 0                    | no          | `z-btn` `z-icon` `z-spinner` `z-toast` `z-toast-outlet`                                                                                |
| P7    | `ZTooltip`                                                                   | 165.2 kB | 50.5 kB | 45.5 kB | +71.8 kB  | +19.5 kB | 2 617          | 45 867               | yes         | `z-tooltip` `z-tooltip-pane`                                                                                                           |
| P8    | `provideZenitTheme()` and `provideZenitLabels({})` only                      | 99.1 kB  | 33.0 kB | 29.8 kB | +5.8 kB   | +1.9 kB  | 3 141          | 0                    | no          | none                                                                                                                                   |
| P9    | everything (`import * as Z`, pinned to a global)                             | 307.5 kB | 88.9 kB | 78.3 kB | +214.1 kB | +57.9 kB | 54 314         | 96 950               | yes         | 74 blocks                                                                                                                              |

How to read it:

- **Every probe contains its own components, their declared template dependencies, and nothing else.** `ZConfirmDialog` really uses `ZButton`, `ZField` and `ZInput`; `ZToastOutlet` really uses `ZButton` and `ZIcon`. The `z-pagination` in P2 is the `<ng-content select="z-pagination">` selector inside `ZPanel`, not the pagination component.
- **The CDK appears exactly where it is used:** P4, P5, P7 and P9. `ZToast` does not use it and P6 is free of it.
- **The delta of P1 is the framework, not the library.** Of the 18.7 kB, 1 978 bytes are zenit-ui. The rest is `@angular/core` growing from 73 286 to 90 379 bytes, because P0 is so empty that it uses neither signal inputs nor host bindings nor content projection. P1c proves it: the same two classes compiled as application code give 114 775 bytes against 114 778 for the library. **The packaging costs 3 bytes.** Any real application has paid that framework share long before its first zenit-ui import.
- **The whole library is 54.3 kB minified** (P9), a quarter of the shipped file, and that is the ceiling for an application that uses every export.
- **The CDK is the expensive part, not zenit-ui.** A tooltip costs 2.6 kB of library code and 45.9 kB of `@angular/cdk/overlay`. That is the price of the CDK overlay and no packaging changes it.

### What retains code

Nothing beyond what is used. The top-level statements of the fesm that could pin code were checked one by one: the module-level counters (`laufendeNummer`, `zaehler`), the constants of the toast and tooltip, `Z_DIALOG_TITLE_ID`, `Z_THEME_CONFIG`, `Z_MENU` and both label tables are absent from P1. The only shared payload is `Z_LABELS_DE`: 327 bytes raw, about 190 bytes gzip, present in P6, P8 and P9, that is, only where a component reads `Z_LABELS` or the application calls `provideZenitLabels`. `Z_LABELS_EN` is present in P9 only. A toast pays for the pagination and console labels it never shows; at 190 bytes that is not worth a change.

### Controls

- **Positive control.** P9 contains every CDK marker and 74 blocks, so the marker search can see what it looks for.
- **Leak control.** Adding the statement `globalThis.__leak = ZConsole;` to a copy of the fesm grows P1 by 24.7 kB and makes `z-console` and `z-console__log` appear. Retention by a top-level side effect would have been detected.
- **`sideEffects`.** esbuild reports `sideEffects: false` for `node_modules/zenit-ui/fesm2022/zenit-ui.mjs`, asked the way Angular's compiler plugin asks (`build.resolve` with the absolute path), and `true` once the flag is removed from the copied `package.json`. So it is read from the right manifest. It does not decide the result, though: with the flag removed or set to `true`, P1 and P7 are byte-identical. For a package that is one file there is no whole module to drop; what removes unused classes is the builder's optimisation pass, which wraps classes with static members into pure IIFEs and elides `setClassMetadata`. Keep `sideEffects: false`; it becomes load-bearing the moment the package has more than one file.
- **Resolution.** Consuming `dist/zenit-ui` through a `paths` mapping, as `projects/beispiel-app/tsconfig.app.json` does, gives the same 114 778 bytes for P1 and the same 206 514 bytes for P4.
- **Repeatability.** Two complete runs were byte-identical. The build cache is disabled in the probe workspace.

## 3. Lazy routes: the cost of one file

esbuild drops unused statements, but it assigns code to chunks **per file**. All code an application uses from `zenit-ui.mjs` goes into the one chunk that every importer of that file shares, and the files that file imports follow it. If the shell uses a single zenit-ui component, that shared chunk is part of the initial load, together with the dialog of a settings page three routes away and the CDK overlay behind it.

`projects/beispiel-app` shows it: dialog and menu are used only in the lazy `gameserver` route, and the initial chunk still holds 95 042 bytes of `@angular/cdk` and all 24 607 bytes of zenit-ui. In that application the lazy route is the redirect target of `/`, so nothing is lost in practice. In an application with a landing page it would be.

The package is not split, so the effect of a split is measured with stand-ins: `zenit-ui-x` is a byte-identical copy of the package (the candidate entry, in a file of its own) and `zenit-ui-p` is the same file without its `@angular/cdk` import lines (the primary entry after a split). The shell imports `ZButton`; one lazy route pins every runtime export of the candidate entry, which is the upper bound for that entry.

| Lazy route uses              | exports | today raw | today gzip | split raw | split gzip | Δ raw     | Δ gzip   | `@angular/cdk` bytes in the initial JS |
| ---------------------------- | ------- | --------- | ---------- | --------- | ---------- | --------- | -------- | -------------------------------------- |
| (nothing)                    | 0       | 201.1 kB  | 63.1 kB    | 201.1 kB  | 63.1 kB    | 0         | 0        | 0 → 0                                  |
| formulare                    | 5       | 227.0 kB  | 70.6 kB    | 219.9 kB  | 69.2 kB    | −7.1 kB   | −1.4 kB  | 0 → 0                                  |
| navigation                   | 14      | 226.8 kB  | 70.7 kB    | 217.4 kB  | 68.5 kB    | −9.4 kB   | −2.3 kB  | 0 → 0                                  |
| daten                        | 12      | 226.1 kB  | 70.7 kB    | 218.1 kB  | 68.7 kB    | −8.0 kB   | −2.0 kB  | 0 → 0                                  |
| rueckmeldung without tooltip | 7       | 214.2 kB  | 67.3 kB    | 208.4 kB  | 65.6 kB    | −5.8 kB   | −1.7 kB  | 0 → 0                                  |
| werkzeuge                    | 9       | 228.7 kB  | 71.8 kB    | 220.8 kB  | 69.7 kB    | −7.9 kB   | −2.1 kB  | 0 → 0                                  |
| tooltip                      | 1       | 255.6 kB  | 77.4 kB    | 208.4 kB  | 65.5 kB    | −47.1 kB  | −11.9 kB | 45 873 → 0                             |
| dialog                       | 3       | 275.2 kB  | 83.2 kB    | 218.6 kB  | 68.5 kB    | −56.6 kB  | −14.7 kB | 53 646 → 0                             |
| menu                         | 4       | 293.7 kB  | 87.8 kB    | 221.9 kB  | 69.9 kB    | −71.9 kB  | −18.0 kB | 71 866 → 0                             |
| overlays (dialog + menu)     | 7       | 323.2 kB  | 95.3 kB    | 224.1 kB  | 70.4 kB    | −99.1 kB  | −24.9 kB | 95 026 → 0                             |
| overlays + tooltip           | 8       | 327.6 kB  | 96.3 kB    | 224.1 kB  | 70.4 kB    | −103.5 kB | −25.9 kB | 96 928 → 0                             |

The split column does not return to 201.1 kB because the lazy code makes `@angular/core`, `rxjs` and `@angular/common` grow, and those are single files shared with the shell too. That share is the same for an application's own lazy code.

The gain depends on what the shell already needs. With a user menu in the application header, the overlay is in the initial load anyway:

| Shell has `ZButton` and `ZMenu`; lazy route uses | today raw | today gzip | split raw | split gzip | Δ raw    | Δ gzip  | `@angular/cdk` bytes in the initial JS |
| ------------------------------------------------ | --------- | ---------- | --------- | ---------- | -------- | ------- | -------------------------------------- |
| dialog                                           | 323.3 kB  | 95.6 kB    | 302.7 kB  | 90.3 kB    | −20.7 kB | −5.3 kB | 95 026 → 78 093                        |
| tooltip                                          | 302.7 kB  | 90.0 kB    | 300.4 kB  | 89.6 kB    | −2.3 kB  | −0.5 kB | 77 860 → 77 860                        |
| dialog + tooltip                                 | 327.8 kB  | 96.6 kB    | 304.6 kB  | 90.6 kB    | −23.2 kB | −6.0 kB | 96 931 → 80 003                        |

**A compatibility re-export undoes all of it.** If the primary stand-in re-exports three symbols from the split-off file, the initial JS is back at 329.7 kB (split without re-export: 224.1 kB, today: 327.6 kB). A file that is imported is placed with its importer whether or not a binding is used.

### Verified against a really split package

The stand-ins were checked once by hand against the real thing: a throwaway copy of `projects/zenit-ui` with `dialog/`, `menu/` and `tooltip/` as secondary entry points, built with `ng-packagr` (it built on the first attempt; the primary fesm then has no `@angular/cdk` import at all).

| Scenario                                    | real split raw / gzip | stand-in raw / gzip |
| ------------------------------------------- | --------------------- | ------------------- |
| shell `ZButton`; lazy dialog, menu, tooltip | 226.1 kB / 71.0 kB    | 224.1 kB / 70.4 kB  |
| shell `ZButton`; lazy dialog                | 220.1 kB / 69.0 kB    | 218.6 kB / 68.5 kB  |
| shell `ZButton`; lazy menu                  | 222.2 kB / 69.9 kB    | 221.9 kB / 69.9 kB  |
| shell `ZButton`; lazy tooltip               | 208.4 kB / 65.5 kB    | 208.4 kB / 65.5 kB  |
| shell `ZButton` + `ZMenu`; lazy dialog      | 304.7 kB / 91.2 kB    | 302.7 kB / 90.3 kB  |

The stand-ins overstate the gain by at most 2.0 kB raw and 0.9 kB gzip. The difference is `ZField`, `ZInput` and `ZIcon`: the dialog and the menu import them from the primary entry, so with a real split they sit in the shared chunk. In the real build the initial files contain no CDK marker and no `z-dialog`; both are in the lazy chunk.

## 4. Decision and migration plan

**Do not restructure the package now.** Other work on the library is in flight, the change breaks import paths, and the gain exists only for applications with lazy routes whose shell stays free of overlays. It is large enough (up to 25.3 kB gzip of initial JS) that the split should happen before 1.0, while the import paths may still change.

**Split off exactly three entries, one per CDK consumer.** One combined `zenit-ui/overlays` entry would be the wrong cut: it is a single file again, and a user menu in the header would drag the dialog and its focus trap back into the initial load (the second table above, 20.7 kB raw). The remaining packages gain 1.4 to 2.3 kB gzip each as an upper bound and stay where they are.

| Entry              | moves from    | exports                                                        | imports                                                                   | expected gain in the initial JS (shell without overlays) |
| ------------------ | ------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------- |
| `zenit-ui/dialog`  | `lib/dialog`  | `ZDialog`, `ZDialogLayout`, `ZDialogActions`, `ZConfirmConfig` | `@angular/cdk/dialog`, `rxjs`, `zenit-ui` (`ZButton`, `ZField`, `ZInput`) | −55.1 kB raw, −14.2 kB gzip                              |
| `zenit-ui/menu`    | `lib/menu`    | `ZMenu`, `ZMenuItem`, `ZMenuSeparator`, `Z_MENU`               | `@angular/cdk/menu`, `zenit-ui` (`ZIcon`)                                 | −71.5 kB raw, −17.9 kB gzip                              |
| `zenit-ui/tooltip` | `lib/tooltip` | `ZTooltip`                                                     | `@angular/cdk/overlay`, `@angular/cdk/portal`                             | −47.1 kB raw, −11.9 kB gzip                              |
| all three          |               |                                                                |                                                                           | −101.5 kB raw, −25.3 kB gzip                             |

The gains are from the real split; they overlap, because all three share `@angular/cdk/overlay`.

Steps, as carried out in the throwaway copy:

1. Create `projects/zenit-ui/dialog/`, `menu/` and `tooltip/`, each with `ng-package.json` (`{ "lib": { "entryFile": "public-api.ts" } }`) and a `public-api.ts`. Move the three `src/lib/*` folders there, specs included.
2. In the moved files, replace the relative imports `'../button'`, `'../field'` and `'../icon'` by `'zenit-ui'`. There are three such lines (`confirm-dialog.ts` twice, `menu.ts` once). Nothing in the primary entry imports from the three folders except the barrels.
3. Remove `lib/pakete/overlays.ts` and its line in `src/public-api.ts`; remove the tooltip line from `lib/pakete/rueckmeldung.ts`. `_overlays.css` and `_rueckmeldung.css` stay as they are, CSS is global.
4. Add `zenit-ui/dialog`, `zenit-ui/menu` and `zenit-ui/tooltip` to `paths` in the root `tsconfig.json`, pointing at the three `public-api.ts`. In `projects/beispiel-app/tsconfig.app.json` add `"zenit-ui/*": ["../../dist/zenit-ui/*"]` next to the existing mapping; `ng-packagr` writes `dist/zenit-ui/dialog/package.json` with `module` and `typings`, and a probe built through that mapping. Add the three `public-api.ts` to the TypeDoc `entryPoints`. `tsconfig.lib.json` and the lint patterns need no change. Not verified: test discovery. `tsconfig.spec.json` includes `src/**/*.spec.ts` only, so its `include`, and possibly the `include` option of the `unit-test` target, have to cover the three new folders.
5. Update the import lines: 4 files in `projects/ui-demo`, 2 in `projects/beispiel-app`, 6 files under `docs/`, `projects/zenit-ui/README.md`, the JSDoc `@example` blocks of the moved classes, and `CHANGELOG.md` with a breaking-change note.

**No compatibility re-exports from `zenit-ui`.** They are impossible (`ng-packagr` stops with "Entry point zenit-ui has a circular dependency on zenit-ui/dialog", because the dialog and the menu import `ZButton`, `ZField` and `ZIcon` from the primary entry) and they would be useless (the measurement above: a re-export puts the CDK back into the initial JS for every consumer, including those who already migrated). The import path of 8 runtime symbols and their types changes in one release; that is the whole cost.

`ng add` is not affected: the schematic inserts `ZToastOutlet` from `zenit-ui`, and the toast stays in the primary entry. The stylesheet registration, including `@angular/cdk/overlay-prebuilt.css`, does not change.

After the split, replace the stand-ins in `tools/bundle-report.mjs` by imports from the three entries and keep the assertions.

## 5. Limits of this proof

- **One builder, one version.** `@angular/build:application` 22.1.8 with esbuild 0.28.2, production settings. The webpack-based builder, Vite or Rollup without Angular's plugins, and other versions were not measured. Plain esbuild without the Angular plugins cannot shake Angular classes at all, which is what the withdrawn report had measured.
- **Production only.** A development build (`optimization: false`) does not tree-shake; it was not measured.
- **Probes are minimal applications.** Deltas against P0 include the framework share a real application has already paid. The bytes attributed to zenit-ui and `@angular/cdk` come from the metafile and do not have that problem.
- **Pinning is an upper bound.** The lazy-route tables keep every export of an entry alive through a global. A route that uses two of fourteen navigation components moves less.
- **No runtime test.** The probes were built, not run in a browser. The stand-in packages are for measuring only: `zenit-ui-p` lacks imports that unreachable code refers to.
- **The real split was built once, by hand, in a throwaway copy.** Its tests, lint, TypeDoc and the two applications were not run against it. The script reproduces the stand-in numbers, not the real-split table.
- **Transfer sizes are computed** with gzip level 9 and Brotli quality 11 per file. A server with other settings gives other numbers; the raw sizes and the differences do not depend on it.

## 6. Method, in full

1. `npx ng build zenit-ui` produces `dist/zenit-ui`.
2. `node tools/bundle-report.mjs` reports raw and gzip bytes of the fesm file and of every stylesheet.
3. It creates `.tmp-bundle/proben/` with its own `angular.json`, `tsconfig.json` (the compiler options of the real workspace without the `paths` mapping, `strict` and `strictTemplates` on), `package.json` and one application per probe, and copies `dist/zenit-ui` to `.tmp-bundle/proben/node_modules/zenit-ui`. Every other package is found by Node's upward walk in the real `node_modules`. The CLI cache is off.
4. It runs `ng build <probe>` with the workspace's own CLI for P0 to P9 and P1c, reads the initial files from `index.html`, measures them, sums `bytesInOutput` per npm package from `stats.json`, and searches the code for the CDK markers and for `z-…` blocks.
5. It creates `.tmp-bundle/lazy/` the same way with five copies of the package (`zenit-ui`, `zenit-ui-x`, `zenit-ui-p` without CDK imports, `zenit-ui-m` with only the `@angular/cdk/menu` imports, `zenit-ui-r` with the compatibility re-export) and builds "today" and "split" for every candidate entry. The exports of an entry are read from the library sources and filtered by the export list of the fesm.
6. It attributes fesm bytes to `lib/` areas (appendix) and deletes `.tmp-bundle/`.
7. It asserts: P9 shows CDK markers and more than 40 blocks; P1 has no CDK bytes, no CDK markers and only `z-btn` and `z-spinner`; P1 is within 200 bytes of P1c; a lazy dialog puts CDK bytes into the initial JS today, not with a split entry, and again with a compatibility re-export.

The controls in section 2 (leak, `sideEffects`, `paths` mapping) and the real split in section 3 were run by hand in the same kind of throwaway workspace and are not part of the script.

## Appendix: source bytes of the fesm per area

From each `class Z…` line to the next, so JSDoc and the metadata block count towards the class. These are bytes of the shipped file, not of a bundle; minified, the whole library is 54.3 kB (P9).

| Area                 | classes | raw bytes    | share of the fesm |
| -------------------- | ------- | ------------ | ----------------- |
| `lib/navigation`     | 14      | 38.3 kB      | 15 %              |
| `lib/marketing`      | 8       | 27.1 kB      | 11 %              |
| `lib/field`          | 4       | 14.4 kB      | 6 %               |
| `lib/dialog`         | 4       | 14.0 kB      | 5 %               |
| `lib/slider`         | 1       | 13.1 kB      | 5 %               |
| `lib/toggle`         | 2       | 13.0 kB      | 5 %               |
| `lib/feedback`       | 5       | 12.9 kB      | 5 %               |
| `lib/console`        | 1       | 11.4 kB      | 4 %               |
| `lib/toast`          | 2       | 10.8 kB      | 4 %               |
| `lib/pagination`     | 1       | 10.7 kB      | 4 %               |
| `lib/tooltip`        | 2       | 10.6 kB      | 4 %               |
| `lib/rows`           | 5       | 9.6 kB       | 4 %               |
| `lib/menu`           | 3       | 9.3 kB       | 4 %               |
| `lib/table`          | 4       | 8.1 kB       | 3 %               |
| `lib/button`         | 1       | 7.8 kB       | 3 %               |
| `lib/metric`         | 2       | 7.7 kB       | 3 %               |
| `lib/theme`          | 1       | 7.3 kB       | 3 %               |
| `lib/checkbox`       | 1       | 6.8 kB       | 3 %               |
| `lib/panel`          | 2       | 6.3 kB       | 2 %               |
| `lib/segment`        | 1       | 6.2 kB       | 2 %               |
| `lib/badge`          | 1       | 3.6 kB       | 1 %               |
| `lib/spinner`        | 1       | 3.4 kB       | 1 %               |
| `lib/icon`           | 1       | 2.7 kB       | 1 %               |
| **attributed total** | **67**  | **255.0 kB** | **99 %**          |
