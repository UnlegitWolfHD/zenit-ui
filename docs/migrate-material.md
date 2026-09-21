# `ng generate zenit-ui:migrate-material`

Moving an application from Angular Material to `zenit-ui` is mostly manual work: `docs/migration-from-material.md` lists twenty-one mappings, and most of them change behaviour. A few do not. An icon, a button attribute, a tooltip text, a loading spinner, a static chip and the `imports` that go with them are rewritten the same way every time, and in an application of some size they are half of all the spots.

This schematic does that half and nothing else. For everything it does not convert it writes a report with file, line, column, rule, reason and a suggested fix, because the people and agents who do the rest work from that list.

```bash
ng generate zenit-ui:migrate-material --path src/app/billing --dry-run
```

## What it does and does not do

It does:

- rewrite `mat-icon`, `mat-button` and its siblings, `matTooltip`, `mat-spinner`, static `mat-chip` in templates, in `.html` files and in inline templates,
- update `imports: [...]` of the components whose template it processed, together with the ES imports,
- count everything Material it leaves behind, per template and per stylesheet,
- write a Markdown and a JSON report.

It does not:

- touch `mat-form-field`, `mat-select`, dialogs, tables, menus, tabs, toggles, sliders, paginators or anything else with state. These are manual by design: each of them changes behaviour (sections 4.1 to 4.9 of `migration-from-material.md`),
- edit a stylesheet, ever. Element selectors, `.mat-*`/`.mdc-*`, `--mat-*`, `::ng-deep` and `@use '@angular/material'` are counted so the remaining debt is visible,
- edit `mat-divider`,
- edit a spec file, an NgModule, a shared `imports` constant or a file outside `--path`,
- add anything that changes meaning: no `type="button"`, no guessed `aria-label`, no guessed `zBtn="danger"`, no guessed badge status,
- decide design questions. It converts all 372 filled buttons of a code base to `zBtn="primary"` and then tells you, per template, that the design system allows one.

## Options

| Option | Default | |
| --- | --- | --- |
| `--path` | required | Workspace-relative folder or file. Only files below it are written. Backslashes, `./`, a trailing slash and an absolute path below the working directory are accepted. `node_modules`, `dist` and dot folders are skipped. |
| `--project` | none | Project the path belongs to. The path may then also be relative to the project's `sourceRoot` (`--project shop --path app/billing`), and a path outside the project root is refused. |
| `--report` | `zenit-migration-report.md` | Workspace-relative path of the Markdown report. The JSON twin has the same name with `.json`. The default is the workspace root and not a file inside `--path`: a report inside `src/` would be linted, formatted and committed with the sources. |
| `--rules` | all | Comma-separated subset of `icon,button,tooltip,spinner,chip,imports`. |
| `--print-report` | only in a dry run | Print the full Markdown report to the console. |
| `--dry-run` | | The CLI's own flag. The CLI lists the files that would change and writes nothing; the schematic prints the report to the console, with the line numbers of the files as they are. |

## Workflow per route

1. **Dry run.** `ng generate zenit-ui:migrate-material --path src/app/<route> --dry-run`. Read the summary: how much converts, how much stays.
2. **Read the report.** `manual` rows are spots you will do by hand. Look for `template-unparsable`, `imports-not-literal` and `template-outside-path` first, they mean a whole file was skipped.
3. **Run it** without `--dry-run`. Commit the result on its own, so the mechanical diff stays reviewable.
4. **Do the manual rest** from the report: first the `manual` rows of the converted rules (a spinner in a button becomes `[loading]`, an icon in a field waits for `z-field`), then the `review` rows (missing `aria-label`, missing `type`, `color="warn"`, several primaries), then everything under "Left for manual migration" with `migration-from-material.md` open.
5. **Build**, then check the route against the acceptance checklist in section 8 of `migration-from-material.md`.

Keep the report of step 3. A second run changes nothing and therefore keeps the existing report instead of overwriting it: the `review` rows describe what the first run dropped, and that cannot be found again afterwards. To see the current state, run with `--print-report` or another `--report` path.

## Rules

The "after" column is what is written. "Reported" is never edited.

### `icon`

| Before | After |
| --- | --- |
| `<mat-icon>home</mat-icon>` | `<z-icon name="home" />` |
| `<mat-icon>{{ open ? 'a' : 'b' }}</mat-icon>` | `<z-icon [name]="open ? 'a' : 'b'" />` |
| `<mat-icon fontIcon="home"></mat-icon>`, `[fontIcon]="x"` | `<z-icon name="home" />`, `[name]="x"` |
| `class`, `[class.x]`, `[ngClass]`, `*ngIf`, `id`, events, `matTooltip` | kept, in place |
| `aria-hidden="true"` | dropped (`z-icon` sets it), `info` |
| `color` | dropped; `info` for `primary`/`accent`, `review` for `warn` and a binding: colour must come from the context |
| `inline` | dropped, `review`: the icon took its size from the text, `z-icon` is 20px |
| `style`, `[style.x]`, `[ngStyle]`, a `material-icons-*` class | kept, `review`. No size is mapped |
| `(click)` | kept, `review`: a clickable icon has no role and no keyboard handling |
| inside `mat-menu-item` | converted, `review`: becomes the `icon` input of `zMenuItem` later |

Reported: text next to an interpolation, several interpolations, child elements, comments or entities in the content, a name that is not a ligature (`[a-z0-9_]+`), an expression that contains both kinds of quotes; `aria-label`, `aria-labelledby`, `role`, `aria-hidden` other than true (`z-icon` is decorative by design); `svgIcon`, `fontSet`; `matPrefix`/`matSuffix` and their variants ("use the icon of z-input-group"); every other `mat*` attribute and `iconPositionEnd` (a slot of a Material parent); `#ref="matIcon"`; `i18n-fontIcon`.

### `button`

On `<button>` and `<a>` only.

| Before | After |
| --- | --- |
| `mat-button` | `zBtn="ghost"` |
| `mat-stroked-button` | `zBtn` (secondary is the default) |
| `mat-flat-button`, `mat-raised-button` | `zBtn="primary"` |
| `mat-icon-button` | `zBtn="ghost" iconOnly` |
| `color="primary"`, `color="accent"` | dropped, `info` |
| `color="warn"` | dropped, `review`: candidate for `zBtn="danger"`, not guessed |
| `[color]="…"` | dropped, `review` with the expression |
| `disableRipple` | dropped, `info` |
| `disabledInteractive` | dropped, `review` |
| `[disabled]`, `type`, everything else | kept |

Reviewed after conversion: a `<button>` without `type` (not added, that would change what the button does); an icon button without `aria-label`, `[attr.aria-label]` or `aria-labelledby` (the fix names the tooltip text when there is one); more than one `zBtn="primary"` in a template, counting the ones that were there before.

Reported: `mat-fab`, `mat-mini-fab` (no counterpart), `matButton`, `matIconButton`, `matFab`, `matMiniFab` (the attribute API of Angular Material 20, not mapped), several button attributes on one element, an element that already has `zBtn`. The attribute on any other element than `button` and `a` is only counted.

### `tooltip`

| Before | After |
| --- | --- |
| `matTooltip="Text"`, `matTooltip="Hi {{ n }}"` | `zTooltip="Text"`, `zTooltip="Hi {{ n }}"` |
| `[matTooltip]="expr"` | `[zTooltip]="expr"` |
| `matTooltipPosition`, `…PositionAtOrigin`, `…ShowDelay`, `…HideDelay`, `…Class`, `…TouchGestures` | dropped, `info` |
| `[matTooltip]="expr" [matTooltipDisabled]="cond"` | `[zTooltip]="cond ? '' : (expr)"`, `review` |
| `matTooltip="It's" [matTooltipDisabled]="a && b"` | `[zTooltip]="(a && b) ? '' : 'It\'s'"`, `review` |

An empty `zTooltip` shows nothing, which is what the merge relies on. It is only done when the condition is a property binding without a pipe and without a double quote, the text is a plain binding or a static string without an encoded apostrophe or a line break, and the new expression survives the real parser. Otherwise the whole tooltip stays, options included. Also reported: `i18n-matTooltip` (the parser hides `i18n-*` attributes, so a rename would lose the translation), `#ref="matTooltip"`, an element that already has `zTooltip`.

### `spinner`

| Before | After |
| --- | --- |
| `<mat-spinner></mat-spinner>`, `<mat-spinner />` | `<z-spinner />` |
| `<mat-progress-spinner mode="indeterminate">` | `<z-spinner />` |
| `diameter`, `strokeWidth`, `mode`, `color` | dropped, `info` (`color` as for icons) |
| `aria-label="…"`, `[attr.aria-label]="…"` | `label="…"`, `[label]="…"`. Left as `aria-label` the host binding of `z-spinner` would remove it |
| `class`, `[class.x]`, structural directives | kept |

Reviewed: no label ("add label for a standalone loading state"; a list that loads shows `z-skeleton` rows instead). Reported: a spinner **inside a `<button>` or `<a>`** is left untouched, the fix is `[loading]` on the button and names the `*ngIf`/`@if` condition when the spinner has one of its own; `mat-progress-spinner` that is determinate (no `mode="indeterminate"`, a bound `mode`, a `value`): that is a `z-metric`; `aria-labelledby`, `#ref="…"`, content, other `mat*` attributes.

### `chip`

| Before | After |
| --- | --- |
| `<mat-chip>{{ tag }}</mat-chip>` | `<z-badge>{{ tag }}</z-badge>`, `review`: set `status` and `dot` where it shows a state |
| `<mat-chip-set>` / `<mat-chip-listbox>` that then holds only badges, with no attribute or only a static `class` | `<span class="z-cluster">`, the class merged into an existing one |
| `color`, `disableRipple` | dropped |

A chip converts only with attributes from a fixed list (`class`, class and style bindings, `id`, `title`, `data-*`, the tooltip family) and no output at all. Reported: `(click)`, `(removed)`, `[removable]`, `selected`, `[value]`, `[disabled]` and everything else; a chip that contains `matChipRemove`, `matChipAvatar` or `matChipTrailingIcon`; a chip in a `mat-chip-grid`; a wrapper with bindings or ARIA of its own. In a `mat-chip-set` that stays the chips still become badges; in a `mat-chip-listbox` that stays they do not, because a listbox without options is broken. `mat-chip-option` and `mat-chip-row` are never touched.

### `imports`

For every `@Component` whose template was processed, that is, read without a parse error and inside `--path`:

- `MatIconModule`, `MatButtonModule`, `MatTooltipModule`, `MatProgressSpinnerModule`, `MatChipsModule` and the single forms (`MatIcon`, `MatButton`, `MatAnchor`, `MatIconButton`, `MatIconAnchor`, `MatFabButton`, `MatMiniFabButton`, `MatTooltip`, `MatProgressSpinner`, `MatSpinner`, `MatChip`, `MatChipSet`, `MatChipListbox`) leave `imports` **only when no selector of theirs is left in that template** after the edits. One spinner in a button keeps `MatProgressSpinnerModule`, one `mat-fab` keeps `MatButtonModule`.
- `ZIcon`, `ZButton`, `ZTooltip`, `ZSpinner`, `ZBadge` are added for what the template uses after the edits. The rule looks at the state of the template, not at what this run converted, so `--rules imports` can run on its own later.
- The ES import of a Material symbol goes when nothing in the file names it any more; a declaration that loses all specifiers goes as a whole. A symbol that is still named elsewhere (a `viewChild(MatTooltip)`, an injection) keeps its ES import and gets a `review` row. The zenit-ui symbols are merged into an existing `import { … } from 'zenit-ui'`, or a new line goes behind the last import, in the quote style of the file.
- The layout stays: one entry per line stays one entry per line, a trailing comma stays, CRLF stays.

Reported, file untouched: `imports` that is not a plain array of identifiers (a constant, a spread, a call), `standalone: false`, a namespace import of `zenit-ui`, a spec file that names `Mat…Module` or `Mat…Harness`, a template below `--path` whose component is not.

## Guarantees

- **Parsed, not matched.** Templates go through `parseTemplate` of `@angular/compiler` (`preserveWhitespaces`, `preserveLineEndings`, no leading trivia, no ICU normalisation), component files through the TypeScript parser. Each file is parsed once. A comment that contains `<mat-icon>` is not a `mat-icon`.
- **Edits by source span.** All edits of a file are computed against its original text and applied in one pass. Indentation, attribute order, quotes, a byte order mark and the line endings stay. New attributes take double quotes; in an inline template that is a `"…"` string they take single quotes, and what would need both is reported.
- **A conversion is whole or not there.** The edits of one element form a group. A group whose edits do not match the text they expect, leave the file or overlap another group is skipped and reported as `unsafe-edit`, the rest of the file is still converted. A template that does not parse is not touched at all, nor are the `imports` of its component.
- **Only below `--path`.** A template outside of it is not read even when a component inside names it.
- **Idempotent.** A second run changes nothing, converts nothing and reports the same `manual` rows.
- **Deterministic.** No timestamps, files and rows sorted, paths workspace-relative with forward slashes.

Inline templates: a template literal without `${}` and a plain string are edited in place. A template with `${}`, a concatenation, a constant or an escape sequence is only reported.

The Angular CLI formats every file a schematic touched with Prettier when the workspace has Prettier installed. That wraps long lines and may drop parentheses in the merged tooltip expression; it is the CLI's doing and applies to the report files as well.

## Report

`zenit-migration-report.md` has a summary table per rule (converted, manual, review, info), the table "Left for manual migration" with the zenit-ui replacement for every Material tag, attribute and CSS class still in the templates (mirroring section 3 of `migration-from-material.md`), the style debt per stylesheet, and one section per file. `info` rows are many and alike, so the Markdown folds them into one line per code; the JSON has every row.

- **manual**: not converted, a human has to do it.
- **review**: converted, but something changed that needs a look.
- **info**: converted, what was dropped has no effect in zenit-ui.

Line and column refer to the file as it is on disk after the run: the rewritten file after a real run, the untouched file after a dry run. Dropping an attribute that had a line of its own moves everything below it, so the two differ.

```json
{
  "schema": 1,
  "path": "src/app/billing",
  "rules": ["icon", "button", "tooltip", "spinner", "chip", "imports"],
  "dryRun": false,
  "totals": { "filesScanned": 3, "filesChanged": 2, "converted": 19, "findings": 17 },
  "summary": { "icon": { "converted": 6, "manual": 1, "review": 1, "info": 1 } },
  "remaining": [{ "name": "mat-form-field", "count": 2, "replacement": "z-field with input[zInput]; …" }],
  "files": [
    {
      "path": "src/app/billing/invoices.html",
      "status": "changed",
      "converted": { "icon": 6, "button": 7, "tooltip": 3, "spinner": 1, "chip": 1 },
      "remaining": { "mat-form-field": 2 },
      "findings": [
        {
          "line": 7,
          "column": 7,
          "rule": "icon",
          "kind": "manual",
          "code": "icon-in-field",
          "reason": "The icon is projected into a mat-form-field through matPrefix.",
          "fix": "Migrate the field to z-field and use the icon of z-input-group."
        }
      ]
    }
  ]
}
```

`status` is `changed`, `unchanged` or `unparsed`. A stylesheet entry carries `styleDebt` instead of findings. `code` is stable and meant for filtering; a full example is `projects/zenit-ui/schematics/migrate-material/fixtures/server-page/expected.report.json.txt`.

## Where the design system and a mechanical conversion disagree

The schematic maps syntax. These are the places where the result is valid zenit-ui and still not what the design system wants, and each of them is a `review` or `info` row rather than a decision:

- **Every `mat-flat-button` and `mat-raised-button` becomes `primary`.** The acceptance checklist allows one primary per screen height. The report says so once per template with the count; which one stays is a human decision.
- **`mat-stroked-button color="primary"` becomes a plain secondary**, and `color="warn"` is dropped: red is an action in zenit-ui, not a decoration, and `danger` is reserved for destructive actions with a confirming dialog.
- **All icons survive.** `CLAUDE.md` wants an icon only where it helps to find something again, not before headings, panel titles or facts, and never coloured outside the active sidebar entry and an alert. The schematic cannot tell a toolbar from a heading.
- **Every standalone spinner becomes a `z-spinner`**, although a loading list is `z-skeleton` rows.
- **Every static chip becomes a neutral badge.** Whether it is a status (with `status`, `dot` and the state as a word) is not visible in the template.
- **Tooltips keep their text** but lose position and delays, and a tooltip on a disabled button never opens: the surrounding element has to carry it (Tooltip README).
- **No sizes are mapped.** Material's button and icon sizes do not correspond to `sm`/`md`/`lg`.

## Limits

- **No type information.** Everything is decided by selector names in the template. A custom wrapper component that renders a Material button inside is not followed, and a directive that happens to be called `matTooltip` is taken for Material's.
- **Names, not modules.** `MatIconModule` is recognised by its name wherever it is imported from, a re-export under another name is not.
- **NgModules, shared arrays, specs** are reported, not edited. A component of an NgModule gets its template converted and the NgModule has to be updated by hand, so the build fails until that is done.
- **`i18n-*` attributes** are invisible in the template AST. The three renamed attributes (`matTooltip`, `fontIcon`, `aria-label` of a spinner) are checked in the start tag text and reported instead of renamed.
- **Inline `styles`** of a component are not counted, only stylesheet files. The stylesheet counts are plain pattern counts and include comments.
- **Class bindings** like `[class.mat-elevation-z4]` are not counted, static classes are.
- **The dry-run flag** never reaches a schematic. It is read from the workflow's private `_dryRun` field with the command line as fallback; if a future devkit hides both, the only effect is that the report is not printed by default and line numbers refer to the rewritten files. `--print-report` still works.
- `@angular/compiler` and `typescript` are resolved from where the package is installed, which in an Angular application are the application's own.

## How it was tested

`npm run test:schematics` (Vitest, see `docs/ng-add.md` for the setup) runs three suites next to the one of `ng add`:

- `template.spec.ts`: every rule with its positive cases and every "reported only" case, structural directives and `@if`/`@for`/`@switch`/`@defer` blocks, attributes over several lines, single and double quotes, self-closing and explicit end tags, comments, CRLF, unparsable templates, idempotency, `--rules` subsets, inline-string quoting, and the edit groups (overlap, out of bounds, unexpected text).
- `component.spec.ts`: locating `templateUrl`, template literals and plain strings, refusing `${}`, concatenations and escapes; removing, keeping and adding `imports` with the layout intact, merged and newly written ES imports, symbols that are still referenced, several components in one file, non-literal `imports`, NgModule components.
- `index.spec.ts`, through the schematics engine: `--path` to a folder and to a single file, Windows paths, files outside `--path` untouched even when referenced, `--project`, inline templates, a second and a third run, determinism, an unparsable template next to good ones, CRLF and a byte order mark, shared templates, spec files and stylesheets, the dry run, the line numbers after a run, and one realistic page (a dialog with a form, a table, a menu, chips, buttons with spinners and tooltips) whose output and report are compared byte for byte with `fixtures/server-page/expected.*`. After a deliberate rule change: `UPDATE_FIXTURES=1 npm run test:schematics`, then review the diff.
- Performance: 500 files (250 copies of the 114-line page plus their components) run in about 0.5 s inside the engine on the development machine; the test fails above 20 s.

End to end, without network: a fresh Angular 22 application generated with the `ng-new` schematic, three components written in Material syntax (an external template with icons, buttons, a merged tooltip, chips and a labelled spinner; an inline template; one with two deliberately manual spots), `dist/zenit-ui` copied to `node_modules/zenit-ui`. `ng generate zenit-ui:migrate-material --path src/app --dry-run` listed five files and printed the report and left the sources untouched; the real run changed the same five files (16 spots, 2 manual, 3 to review); a second run printed "Nothing to be done." and kept the report; after the two manual spots from the report were done by hand (`[loading]` instead of the spinner in the button, a decorative `z-icon` with the label as visible text) `ng build` succeeded with strict templates. Angular Material was never installed: the schematic only rewrites text.
