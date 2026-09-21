# Blind test: can a model use zenit-ui from `llms-full.txt` alone?

Run on 2026-09-22 against the `llms.txt` / `llms-full.txt` generated at commit `775a69d`
(before G6, G13, skip link and link menu entries reached the file).

## Method

Four models (Fable 5.1, Opus 5, Sonnet 5, Haiku 4.5) got only the two generated files, in a
neutral folder outside the repository, and wrote eight tasks each: (a) sortable, paginated
table with empty and skeleton state, (b) confirm dialog with toast and focus return,
(c) toasts, (d) configurator page, (e) theming without flash, (f) reactive form and Signal
Forms, (g) app shell, (h) English labels with one override.

A grader then copied every file **unchanged** into a scratch application that consumes the
built package, ran `ng build`, fixed compile errors minimally (each fix is counted), and ran a
Playwright smoke over 35 routes (console errors, axe, probes for focus return, slot
projection, applied sort, literal `&nbsp;`).

## Result

Score per task, 0 to 100 (compiles unchanged, fixes needed, semantic defects).

| Model  | a   | b   | c   | d   | e   | f   | g   | h   | Mean |
| ------ | --- | --- | --- | --- | --- | --- | --- | --- | ---- |
| Fable  | 97  | 100 | 100 | 97  | 98  | 98  | 72  | 100 | 95   |
| Opus   | 96  | 55  | 100 | 90  | 95  | 97  | 84  | 100 | 89   |
| Sonnet | 92  | 55  | 70  | 80  | 93  | 95  | 72  | 97  | 82   |
| Haiku  | 30  | 35  | 85  | 35  | 45  | 40  | 40  | 75  | 48   |

- 32 files, **2 compile fixes in total** (one in Sonnet, one in Haiku).
- 0 console errors and 0 axe violations on all 26 routes of Fable, Opus and Sonnet.
- Verdict: Fable yes, Opus yes with one fix, Sonnet with fixes, Haiku no (about half of its
  defects are its own errors against clear documentation).

The reference sections are accurate. Every defect appeared where two or three building
blocks had to be assembled: the integration is what the file does not carry.

## Documentation defects, ranked by models hit

| #   | Defect                                                                                                                                                                                                               | Hit               | Fix belongs in                                                                                     |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------- |
| 1   | `restoreFocusTo: this.trigger()` without a declaration; nothing says `zBtn` is a **component**, so `viewChild` needs `{ read: ElementRef }`. Without it the CDK silently does nothing and focus lands on `body`.     | 3 of 4            | JSDoc `@example` of `restoreFocusTo` in `dialog/confirm-dialog.ts` and `dialog/dialog.ts`          |
| 2   | No page shell example. `z-app-header` and `z-footer` centre nothing themselves; `.z-container` is the only thing that does. All four shipped a full-bleed footer.                                                    | 4 of 4            | Generator: "Page shell" section taken from `beispiel-app` `shell.ts`; one sentence in both JSDocs  |
| 3   | `z-visually-hidden` is described as the class "for skip links", but it never reveals on focus.                                                                                                                       | 3 of 4            | Solved by `a[zSkipLink]`; correct the utility-class row in the generator                           |
| 4   | `&nbsp;` inside TypeScript object literals of examples (`[total]="{ value: '7,74&nbsp;€' }"`); the no-break-space escape for TypeScript (backslash `u00a0`) is never mentioned. Renders literally.                   | 1, latent for all | JSDoc of `marketing/price-summary.ts`, `configurator/config.ts`; money rule in the generator       |
| 5   | A named slot inside `@if` / `@for` only projects while the block has exactly one root node (NG8011, a warning). Seven silent misprojections in one model.                                                            | 1, latent for all | Generator: sentence on every "Content slots" line                                                  |
| 6   | Two `provideZenitLabels()` calls in one providers array do not stack (`skipSelf`).                                                                                                                                   | 3 of 4 unsure     | JSDoc of `provideZenitLabels`                                                                      |
| 7   | How `zenitThemeInitScript()` reaches a static `index.html`, and what `ng add --themes` writes.                                                                                                                       | 3 of 4            | `docs/ng-add.md`, `docs/theming.md`; generator prints the resulting `<head>`                       |
| 8   | The Signal Forms example does not compile (`formular.standort` missing from the model, unused imports, undeclared `sende`). It is a hand-maintained copy in the generator; the original in `docs/forms.md` is right. | latent            | Generator: read `docs/forms.md`; compile-check the snippet constants                               |
| 9   | `llms.txt` line 3: "Angular 0.1.0 component library".                                                                                                                                                                | all               | Generator                                                                                          |
| 10  | `ZThemeConfig` table lists only `target?`; inherited fields sit in the next section; no `@default` printed for interface fields.                                                                                     | 3 of 4            | Generator: follow heritage clauses, print `@default`                                               |
| 11  | Generics dropped: `ZOption<T>`, `ZOptionGroup<T>`, `ZDialogConfig<D, R>`.                                                                                                                                            | 2 of 4            | Generator: carry `typeParameters`                                                                  |
| 12  | Pointers to files the reader does not have (`docs/theming.md`, `docs/components/tabs.md`, `spec/…`).                                                                                                                 | 2 of 4            | JSDoc in `navigation/tab-group.ts`, `navigation/tabs.ts`, `theme/theme.ts`, `theme/init-script.ts` |
| 13  | Table cells broken by an unescaped pipe inside a transform (`2 \| 3 \| 4`).                                                                                                                                          | 1 of 4            | Generator: escape `transform` and `standard` cells                                                 |
| 14  | `Z_MENU`, `Z_LABELS_DE`, `Z_LABELS_EN` filed under "Exported types".                                                                                                                                                 | 1 of 4            | Generator: own bucket for constants                                                                |
| 15  | Migration table names a non-existent "Meter" and guide names where selectors belong.                                                                                                                                 | 1 of 4            | `docs/migration-from-material.md` section 3 headings                                               |
| 16  | "Write no pixel value of your own" contradicts `columns="… 128px 40px"` and `<z-skeleton width="64px">`.                                                                                                             | 1 of 4            | Generator: carve out grid tracks and placeholder lengths                                           |
| 17  | `ZToastOutlet`: "German `aria-label` default" although the default comes from the label registry.                                                                                                                    | 1 of 4            | JSDoc in `toast/toast-outlet.ts`                                                                   |

Verified as correct, no action: toast duration (`0` is sticky), pagination clamps and the
caller slices, the library never sorts, price summary versus sticky bar (`mobileOnly`).
