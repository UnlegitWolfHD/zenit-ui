# Bundle report

What `zenit-ui` costs a consumer, measured on this branch.

Reproduce with:

```bash
npx ng build zenit-ui
node tools/bundle-report.mjs
```

The script prints the three tables below and then deletes its scratch directory `.tmp-bundle/`. It uses the `esbuild` that comes with the Angular build (`require.resolve('esbuild')`) and adds no dependency of its own.

**Short version:** the package is 228.6 kB of JavaScript (42.7 kB gzipped) and 41.8 kB of CSS (12.6 kB gzipped). A consumer who imports one component gets essentially all of it, and `@angular/cdk/dialog`, `/menu`, `/overlay` and `/portal` are static top-level imports of the single shipped file, so they are reachable from every consumer whether or not a dialog or menu is ever used. Whether a real Angular production build shakes that away could not be proven here; see "Limits".

## 1. What the package ships

| File                       | raw         | gzip        |
| -------------------------- | ----------- | ----------- |
| `fesm2022/zenit-ui.mjs`    | 228.6 kB    | 42.7 kB     |
| `styles/_daten.css`        | 4.3 kB      | 1.3 kB      |
| `styles/_formulare.css`    | 4.7 kB      | 1.4 kB      |
| `styles/_grundlage.css`    | 8.3 kB      | 2.3 kB      |
| `styles/_navigation.css`   | 7.9 kB      | 2.2 kB      |
| `styles/_overlays.css`     | 3.1 kB      | 1.1 kB      |
| `styles/_rueckmeldung.css` | 3.7 kB      | 1.2 kB      |
| `styles/_werkzeuge.css`    | 6.4 kB      | 1.9 kB      |
| `styles/tokens.css`        | 3.0 kB      | 0.9 kB      |
| `styles/zenit-ui.css`      | 0.4 kB      | 0.2 kB      |
| **CSS total**              | **41.8 kB** | **12.6 kB** |

Gzip is level 9, so the numbers do not drift with the zlib default.

The CSS is not tree-shakable at all, by design: `40-bibliothek.md` requires that components carry no styles of their own and that the application registers `tokens.css` and `zenit-ui.css` globally. Every consumer pays the full 12.6 kB gzipped regardless of which components they use. That is a deliberate trade and a small number; it is not worth optimising.

The 228.6 kB of JavaScript is uncompiled, partially-compiled Angular output, not what ends up in an application bundle. A real build links and compiles it; the probes below are an attempt to bound what survives.

## 2. Tree-shaking probes

Each probe writes an entry file containing one re-export line, bundles it with esbuild (`bundle: true`, `minify: true`, `format: 'esm'`, `treeShaking: true`), and marks `@angular/*`, `rxjs` and `tslib` as external. What is left is the library's own code. The package name is resolved to `dist/zenit-ui/fesm2022/zenit-ui.mjs` with `sideEffects: false`, mirroring `dist/zenit-ui/package.json`.

A re-export (`export { ZButton } from 'zenit-ui'`) rather than a bare import, because a bare import of an unused symbol would be shaken away entirely and every probe would measure zero.

| Probe                             | minified | gzip    | share of "everything" |
| --------------------------------- | -------- | ------- | --------------------- |
| `import { ZButton }`              | 107.9 kB | 13.8 kB | 99 %                  |
| `import { ZBadge }`               | 107.9 kB | 13.8 kB | 99 %                  |
| `import { ZDialog }`              | 107.9 kB | 13.8 kB | 99 %                  |
| `import { ZToast, ZToastOutlet }` | 107.9 kB | 13.8 kB | 99 %                  |
| `import { ZMenu, ZMenuItem }`     | 107.9 kB | 13.8 kB | 99 %                  |
| everything (`export *`)           | 108.8 kB | 14.2 kB | 100 %                 |

| Probe                  | surviving static imports                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `ZButton`              | `@angular/cdk/dialog`, `@angular/cdk/menu`, `@angular/cdk/overlay`, `@angular/cdk/portal`, `@angular/core`, `@angular/forms`, `rxjs` |
| `ZBadge`               | identical                                                                                                                            |
| `ZDialog`              | identical                                                                                                                            |
| `ZToast, ZToastOutlet` | identical                                                                                                                            |
| `ZMenu, ZMenuItem`     | identical                                                                                                                            |
| everything             | identical                                                                                                                            |

The probes are flat. Importing the single smallest component in the library keeps 99 % of the code that importing all 66 classes keeps.

## 3. Limits of this measurement

**Plain esbuild does not tree-shake Angular component classes.** This is the headline caveat and it is larger than expected, so it is worth being precise about what was and was not established.

The `ng-packagr` output is in _partial compilation mode_: each class carries `static ɵfac = i0.ɵɵngDeclareFactory({…})` and `static ɵcmp = i0.ɵɵngDeclareComponent({…})`, and each is followed by a bare top-level statement `i0.ɵɵngDeclareClassMetadata({…})`. There are 66 of those in the fesm file. A real Angular production build runs the **Angular linker** over this, which turns the declarations into their compiled form and drops the metadata calls. Plain esbuild has no linker, so the measurement above is not what a consumer's build actually produces.

Three attempts were made to remove that confound, and none of them changed the result:

1. **`sideEffects: false`** from the package manifest, applied through the resolve plugin. No change — the flag lets esbuild drop a whole unused module, not individual statements of a module that is partly used.
2. **`pure: ['i0.ɵɵngDeclareClassMetadata', …]`**, annotating the metadata calls as removable. Output shrank by 27 bytes.
3. **Stripping all 66 `ɵɵngDeclareClassMetadata` statements from the source** before bundling, which is the closest plain esbuild gets to the linker. The absolute size fell from 107.9 kB to 70.7 kB, but the share stayed at 99 % and the CDK imports still survived:

| Probe, metadata stripped | minified | gzip    | share | CDK imports |
| ------------------------ | -------- | ------- | ----- | ----------- |
| `ZButton`                | 70.7 kB  | 11.0 kB | 99 %  | survive     |
| `ZBadge`                 | 70.7 kB  | 11.0 kB | 99 %  | survive     |
| `ZDialog`                | 70.7 kB  | 11.0 kB | 99 %  | survive     |
| `ZToast, ZToastOutlet`   | 70.7 kB  | 11.0 kB | 99 %  | survive     |
| `ZMenu, ZMenuItem`       | 70.7 kB  | 11.0 kB | 99 %  | survive     |
| everything               | 71.7 kB  | 11.4 kB | 100 % | survive     |

The remaining blocker was isolated with a minimal test case, independent of Angular:

```js
import * as i0 from '@angular/core';
var A = class _A {
  static x = i0.decl({ type: _A });
};
var B = class _B {
  static x = i0.decl({ type: _B });
};
export { A, B };
```

Bundling `export { A } from './lib.mjs'` with `treeShaking: true`, `sideEffects: false` and external `@angular/*` keeps `B` in the output. So does the downlevelled form `B.x = /* @__PURE__ */ i0.decl({…})`. **esbuild cannot drop a class whose static field initialiser is a function call**, which is the shape every Angular component compiles to.

What follows from that:

- **The absolute per-probe numbers are meaningless as "what a consumer pays".** Treat 107.9 kB and 70.7 kB as upper bounds of the library's own code, not as a cost.
- **The relative comparison is also uninformative here**, because it is flat for a reason that has nothing to do with the library's design. A flat result would be the outcome for _any_ Angular library measured this way, including one with perfect entry points.
- **The one thing the probes genuinely show** is the static import graph of the shipped file, which is a property of the file itself and not of the bundler. That is section 4.
- Measuring this properly needs a real Angular application build (`ng build` of a consumer with and without the components in question) and a comparison of the resulting chunk sizes. That was out of scope here: no application consumes the package yet, and `npm install` was not allowed.

## 4. The CDK question

> Does the single-entry-point design pull `@angular/cdk/dialog`, `/menu` and `/overlay` into every consumer at module-evaluation level?

**At the level of the shipped file: yes, unconditionally.** The first nine lines of `dist/zenit-ui/fesm2022/zenit-ui.mjs`:

```js
import * as i0 from '@angular/core';
import { input, ChangeDetectionStrategy, Component /* … */ } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { DIALOG_DATA, DialogRef, Dialog } from '@angular/cdk/dialog';
import { map } from 'rxjs';
import * as i1 from '@angular/cdk/menu';
import { CdkMenu, CdkMenuItem } from '@angular/cdk/menu';
```

There is exactly one entry point and exactly one file behind it. An application that uses only `ZBadge` still resolves `@angular/cdk/dialog`, `/menu`, `/overlay` and `/portal` through this file. Whether those modules are then _evaluated_ at runtime depends on the consumer's bundler: all four are marked `sideEffects: false` by `@angular/cdk`, so a bundler that can prove the imported bindings unused may drop them. Plain esbuild cannot, for the reason in section 3. Whether the Angular CLI's production build can was **not** established here and should not be assumed either way.

The cost if it cannot: `@angular/cdk/dialog` pulls in the overlay, the portal and the a11y focus-trap machinery, which is the single largest dependency the library has. `@angular/cdk/menu` adds its own keyboard and pointer handling.

### What a split would save

Bytes of the fesm attributed to each area, from each `class Z…` line to the next, so a class's JSDoc and its metadata block count towards it:

| Area                 | classes | raw bytes    | share of the fesm |
| -------------------- | ------- | ------------ | ----------------- |
| `lib/navigation`     | 14      | 35.0 kB      | 15 %              |
| `lib/marketing`      | 8       | 24.9 kB      | 11 %              |
| `lib/field`          | 4       | 14.4 kB      | 6 %               |
| `lib/dialog`         | 4       | 14.1 kB      | 6 %               |
| `lib/feedback`       | 5       | 12.9 kB      | 6 %               |
| `lib/toggle`         | 2       | 12.5 kB      | 5 %               |
| `lib/slider`         | 1       | 11.5 kB      | 5 %               |
| `lib/rows`           | 5       | 9.4 kB       | 4 %               |
| `lib/console`        | 1       | 9.3 kB       | 4 %               |
| `lib/pagination`     | 1       | 8.6 kB       | 4 %               |
| `lib/menu`           | 3       | 8.5 kB       | 4 %               |
| `lib/toast`          | 2       | 8.1 kB       | 4 %               |
| `lib/tooltip`        | 2       | 8.0 kB       | 3 %               |
| `lib/button`         | 1       | 7.8 kB       | 3 %               |
| `lib/metric`         | 2       | 7.7 kB       | 3 %               |
| `lib/checkbox`       | 1       | 6.8 kB       | 3 %               |
| `lib/panel`          | 2       | 6.3 kB       | 3 %               |
| `lib/segment`        | 1       | 6.2 kB       | 3 %               |
| `lib/table`          | 4       | 5.5 kB       | 2 %               |
| `lib/badge`          | 1       | 3.6 kB       | 2 %               |
| `lib/spinner`        | 1       | 3.4 kB       | 1 %               |
| `lib/icon`           | 1       | 2.7 kB       | 1 %               |
| **attributed total** | **66**  | **227.1 kB** | **99 %**          |

The four CDK-dependent areas together — `dialog` 14.1 kB, `menu` 8.5 kB, `tooltip` 8.0 kB, `toast` 8.1 kB — are **38.7 kB, 17 % of the fesm**, and they are the only reason `@angular/cdk/dialog`, `/menu`, `/overlay` and `/portal` appear in the import list at all. That 17 % is the ceiling of what a split could keep out of a consumer that uses no overlay, before minification and before the CDK packages themselves are counted. The CDK packages are the larger prize and are not measured here.

Note that `lib/marketing` (24.9 kB, 11 %) is Hero, GameTile, PriceSummary, SpecList and Faq — public-page components that the customer area and the server panels never use, and vice versa for `lib/console` and `lib/rows`. The public bundle and the panel bundle are almost disjoint.

## 5. Recommendation

**Add secondary entry points, at least for the overlay group. Do not implement it now.**

A split along the existing `lib/pakete/*` grouping is the obvious shape, since the packages already have disjoint files and their own style partials:

```
zenit-ui            → icon, spinner, button, badge, field, panel
zenit-ui/formulare  → checkbox, toggle, setting, slider, segment
zenit-ui/navigation → tabs, stepper, sidebar, app-header, page-header, footer
zenit-ui/daten      → metric, rows, table, pagination
zenit-ui/overlays   → dialog, menu     ← the only ones needing @angular/cdk/dialog and /menu
zenit-ui/rueckmeldung → alert, empty-state, skeleton, toast, tooltip
zenit-ui/werkzeuge  → console, hero, game-tile, price-summary, spec-list, faq
```

Mechanically this is small: `ng-packagr` creates a secondary entry point from a folder containing its own `ng-package.json` and `public-api.ts`. The seven barrels in `projects/zenit-ui/src/lib/pakete/` already define the boundaries, and no component imports across a package boundary except into the base group (`lib/button`, `lib/icon`, `lib/field`), which stays in the primary entry point.

**Effort estimate: half a day to a day**, roughly

- 2 h: seven folders with `ng-package.json` and `public-api.ts`, move the barrels, rewrite the relative imports.
- 1 h: the demo app and the tests, which import from the `zenit-ui` path alias today and would import from the sub-paths instead.
- 1 h: verify `ng build zenit-ui`, `npm pack` and the resulting `exports` map in `dist/zenit-ui/package.json`.
- 2 h: docs — `projects/zenit-ui/README.md`, the Setup section, `CHANGELOG.md`, and the import lines in every JSDoc `@example`.

**But it is not worth doing yet, and here is the honest reason.** This report could not show that the single entry point actually costs a consumer anything, because the measuring instrument cannot tree-shake Angular classes at all. The right next step is not the split; it is one real measurement: build a throwaway Angular application twice, once importing `ZBadge` and once importing `ZBadge` plus `ZDialog`, and compare the production chunk sizes. If the difference is near zero, the single entry point is costing every consumer the CDK overlay stack and the split pays for itself. If the CLI already shakes it, the split buys build hygiene and clearer dependencies, and can wait.

Two smaller things are worth doing regardless, and neither needs the measurement first:

- **The CSS could be split the same way** and is easier: `zenit-ui.css` already `@import`s seven partials, and an application that never shows a dialog could register six of them. It saves about 1.1 kB gzipped for the overlay partial, which is not enough to bother with today.
- **`lib/marketing` and `lib/console` are the clearest candidates** even before the overlay question is settled: 34.2 kB combined, and the public pages and the server panels genuinely never load each other's code.

## 6. Method, in full

1. `npx ng build zenit-ui` produces `dist/zenit-ui`.
2. `node tools/bundle-report.mjs` reads `dist/zenit-ui/fesm2022/zenit-ui.mjs` and every file in `dist/zenit-ui/styles/`, and reports raw bytes and gzip level 9.
3. For each of six probes it writes an entry file into `.tmp-bundle/` and bundles it with esbuild: `bundle: true`, `minify: true`, `format: 'esm'`, `treeShaking: true`, `external: ['@angular/*', 'rxjs', 'rxjs/*', 'tslib']`, and a resolve plugin mapping `zenit-ui` to the fesm file with `sideEffects: false`.
4. It reports minified and gzipped bytes per probe, and the `from"…"` targets that survive in each output.
5. It repeats all six probes against a copy of the source with the `ɵɵngDeclareClassMetadata` statements removed. That removal is line-based: from a line starting with the call to the first line ending in `});`. A miscount would produce invalid JavaScript and esbuild would fail, so the successful parse is the check.
6. It attributes fesm bytes to areas by scanning for `class Z…` lines and mapping each class name to its `lib/` folder, read from the sources rather than a hand-kept list.
7. It deletes `.tmp-bundle/` and prints a one-line assertion of both headline claims to stderr, so a change in the library or in esbuild shows up instead of letting this report go stale silently.

Measured on this branch with Angular 22.1.7 and the `esbuild` resolved from the workspace `node_modules`.
