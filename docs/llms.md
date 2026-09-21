# llms.txt and llms-full.txt

Two plain-text files ship in the package root so that a language model can use `zenit-ui`
correctly with nothing but the installed package: no repository, no sources, no network.

| File            | Size    | What is in it                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `llms.txt`      | ~11 kB  | The [llms.txt](https://llmstxt.org/) index: what the library is, the hard rules, the setup in six steps, and every component, directive and service with its selector, its import name and a one-line purpose.                                                                                                                                                                                        |
| `llms-full.txt` | ~207 kB | The complete reference. Setup, then per export: selector, import line, purpose, inputs with type, default and description, two-way models, outputs, content slots, host directives, one usage example and the "do not" notes. Before all of that the page shell and two assembled pages, cut out of the applications of this workspace. After it forms, theming, labels, the dialog/toast/menu services, the CSS classes a page may set, the `mat-*` → `z-*` migration table and every design token with its value. |

## How they are generated

`tools/generate-llms.mjs` reads the sources with the TypeScript compiler API — no new dependency,
no type checker, no timestamps, stable ordering, so two runs of the same tree produce the same
bytes:

- **Selectors, slots and host directives** from the `@Component` and `@Directive` decorators,
  including the `<ng-content select="…">` of each template.
- **Inputs, models and outputs** from the `input()`, `model()` and `output()` members: name (alias
  included), declared type, the real initialiser as the default, `booleanAttribute` and
  `numberAttribute` transforms, and the JSDoc as the description.
- **Services, provider functions, injection tokens, interfaces and type aliases** from their
  declarations, with their public method signatures and `@returns`.
- **The public surface** by following the barrels from `src/public-api.ts`, so nothing that is not
  exported — and nothing marked `@internal` — can leak into the output.
- **Examples and "do not" notes** from the matching guide under `docs/components/`: the first
  `html` fence under `## Examples` and the `Don't` lines of `## Do / Don't`. Where a guide has
  none, the `@example` of the JSDoc is used.
- **Tokens** from `projects/zenit-ui/src/styles/tokens.css`, the **layout and utility classes**
  from the table of `docs/layout.md`, verified against `_grundlage.css`, the **migration table**
  from `docs/migration-from-material.md` and the **forms chapter** from `docs/forms.md`.
- **The assembled pages** from marked regions of `beispiel-app` and `ui-demo`: the whole template
  of `layout/shell/shell.ts`, `#region tabellenseite` of the dashboard, `#region sortierbar` and
  `#region sortierung` of the data page, `#region konfiguratorseite` of the price calculator, and
  the `<head>` of the example application. A region that is gone fails the run.
- **The Angular major** from the `peerDependencies` of the package, never from a constant.

```bash
npm run docs:llms    # write projects/zenit-ui/llms/{llms.txt,llms-full.txt}
npm run check:llms   # write nothing, fail if anything exported is missing
```

The generated files are **not committed** (`projects/zenit-ui/llms/` is git-ignored).
`npm run build:lib` regenerates them before `ng build zenit-ui`, and `ng-package.json` copies them
into the package root as assets, so they can never be stale in a build.

`check:llms` is part of `npm run check`. It asserts that every component, directive, service and
provider function of the public API has a section in `llms-full.txt`, that every `input()`,
`model()` and `output()` member appears there with its default, that every public service method
appears with its signature, and that every selector appears in `llms.txt`. A new member without
documentation therefore fails the check rather than shipping undocumented.

Two further assertions came out of the blind test (`llms-blindtest.md`):

- **No path the reader does not have.** Outside code fences neither file may contain a `docs/` or
  `spec/` path or a "see … .md". A pointer to a file that does not ship is a dead end, so the fact
  belongs in the JSDoc it came from.
- **Every whole-file `ts` fence** (one with an `@Component` and an import from `zenit-ui`) is
  parsed, and every identifier it imports has to exist in the public API. Fragments are counted
  and skipped; the run prints both numbers.

## Pointing an assistant at it

After `npm i ./zenit-ui-<version>.tgz` the file sits at
`node_modules/zenit-ui/llms-full.txt`. Give the assistant that path, or the shorter index:

```
Read node_modules/zenit-ui/llms-full.txt and build the page with zenit-ui only.
Do not use @angular/material and write no colour, spacing or radius value of your own.
```

Both files are also reachable as package subpaths, `zenit-ui/llms.txt` and
`zenit-ui/llms-full.txt`, for a tool that resolves through `exports`. For agents that read a
project file, copy the index into the repository:

```bash
cp node_modules/zenit-ui/llms.txt ./llms.txt
```
