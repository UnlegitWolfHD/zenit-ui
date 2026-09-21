# zenit-ui-workspace

Angular workspace for the Zenit design system. It holds the library `zenit-ui` with every building block of the website, the customer area and the server panels, plus a demo application that shows each building block in all of its states. The workspace is independent of the existing Zenit-Hosting frontend and contains no business logic, no API calls and no real customer data.

## Folders

| Folder | Contents |
| --- | --- |
| `projects/zenit-ui` | the library: building blocks in `src/lib`, tokens and styles in `src/styles` |
| `projects/ui-demo` | demo application, one page per package, each building block in all states |
| `projects/beispiel-app` | example application: one complete page, built against the package in `dist/zenit-ui` |
| `e2e/` | Playwright: screenshots at 1440px and 375px, axe checks per demo page |
| `spec/` | the design system as the specification: tokens, component READMEs, previews, guidelines |
| `docs/pakete.md` | cut of the work packages, decisions and acceptance points |
| `docs/theming.md` | colour schemes, accents, `provideZenitTheme`, the contrast gate |
| `docs/labels.md` | the label registry and how to switch the library's own texts |
| `docs/ng-add.md` | what `ng add zenit-ui` does, its options and its tests |
| `docs/signals.md` | the signal conventions of this workspace, the audit table and its exceptions |
| `docs/forms.md` | the three ways to bind a form control, Signal Forms first |
| `docs/components/` | one usage guide per building block, checked by `node tools/check-docs-examples.mjs` |
| `docs/migration-from-material.md` | how a page moves off Angular Material |
| `docs/legacy.md` | `.z-legacy`: keeping the library out of the pages that are not migrated yet |
| `docs/bundle-report.md` | size of the package per entry point |
| `docs/api/` | generated TypeDoc reference, not committed |
| `tools/` | schematics build, schematics tests, contrast gate, example snippets |

`CLAUDE.md` in the root is the overview of the system: principles, language, color, typography, form, motion and the list of banned constructs. It applies to every change. The design system under `spec/`, `CLAUDE.md` and `docs/pakete.md` are written in German; everything else, including the generated API documentation and the JSDoc in the source, is English. UI copy inside code examples stays German, because German is the product's language.

## Commands

```bash
npm run build:lib      # library into dist/zenit-ui plus the compiled schematics
npm run build          # build:lib and ng build ui-demo
ng test zenit-ui       # unit tests of the library
npm run test:schematics # the ng add schematic against generated fixtures
npm run check:themes   # contrast gate over every scheme and accent
npm run check:snippets # the example app still shows its own sources
npm run lint           # ESLint over library, demo and example app
npm run lint:css       # Stylelint over projects/**/*.css
npm run e2e            # Playwright with axe over the demo pages
npm run e2e:beispiel   # the same checks over the example app, in all three schemes
npm run docs:api       # TypeDoc reference into docs/api
npm run check          # everything above except the Playwright runs
ng serve ui-demo       # demo app at http://localhost:4200/
npm run start:beispiel # example app, library build included
```

## Example application

`projects/beispiel-app` is the page to copy from: the Gameserver list of the customer area with every state it can have, consuming `zenit-ui` from the built package in `dist/zenit-ui` exactly as the package README describes. It is at the same time the proof that the shipped package works, and it shows its own wiring: every region of the page has a disclosure with its real source, and the page "Einbindung" walks through the setup file by file. Those blocks are generated from the sources by `tools/generate-example-snippets.mjs`, so they cannot drift; `npm run check:snippets` fails when they do. How to run it, how each region maps to a rule of the design system and what to replace in a real application is in `projects/beispiel-app/README.md`.

## Package zenit-ui

How to pull the library into an application is described in `projects/zenit-ui/README.md`: requirements, installation from the locally built `.tgz`, style order, `z-root`, fonts, toast outlet, Minecraft subtheme, the full component API and the documented deviations from the reference styles. That README ships with the package.

## Further reading

- `projects/zenit-ui/README.md` — using the library
- `projects/beispiel-app/README.md` — the example page and how it consumes the package
- `docs/theming.md` — colour schemes, accents, `provideZenitTheme`, the contrast gate
- `docs/labels.md` — the label registry, `provideZenitLabels`, `Z_LABELS_EN`
- `docs/ng-add.md` — `ng add zenit-ui`: what it changes, options, tests
- `docs/signals.md` — signals, `resource()`, `linkedSignal()`, and what is deliberately not a signal
- `docs/forms.md` — Signal Forms, reactive forms and `ngModel` against the library's fields
- `docs/components/` — one guide per building block: API, examples, states, accessibility
- `CHANGELOG.md` — what changed per version
- `CONTRIBUTING.md` — commands, rules, how to add a building block, review checklist

## Release

No push, no publish and no deploy without the owner's approval. `npm pack` in `dist/zenit-ui` is a local dry run only; the library is not published to npm.
