# Contributing

## Commands

The workspace holds three projects: the library `zenit-ui` (with the `ng add` schematics under `projects/zenit-ui/schematics`), the demo `ui-demo` with one page per package, and the example application `beispiel-app`, which consumes the built package from `dist/zenit-ui`.

```bash
npm ci                 # install exactly what package-lock.json pins
npm run check          # everything below except the Playwright runs
npm run lint           # ESLint over library, demo and example app
npm run lint:css       # Stylelint over projects/**/*.css
npm run format         # Prettier over projects/**/*.{ts,css,html}
npm run format:check   # the same as a check, part of npm run check
npm run build:lib      # library into dist/zenit-ui plus the compiled schematics
npm run check:order    # source scan: no load-time reference to a class declared further down, no import cycles
npm run check:bundle   # the built bundle loads in plain Node with the JIT compiler, run after build:lib
npm run check:ssr      # both applications prerender in plain Node, run after build:lib
npm run check:ssr beispiel-app # only that one
ng build ui-demo       # build the demo application
npm run build:beispiel # library, snippets and the example application
ng test zenit-ui       # unit tests of the library
npm run test:beispiel:jit # example app specs against the unlinked package, as an installed consumer runs them
npm run test:schematics # the ng add schematic against generated fixtures
npm run check:themes   # contrast gate over every scheme and accent
npm run check:snippets # the example app still shows its own sources
npm run e2e            # Playwright with axe over the demo pages
npm run e2e:beispiel   # the same checks over the example application
npm run e2e:update     # accept new reference screenshots
npm run docs:api       # TypeDoc reference into docs/api (git-ignored)
ng serve ui-demo       # demo app at http://localhost:4200/
npm run start:beispiel # example app, library build included
```

`npm run check` runs `lint`, `lint:css`, `check:themes`, `check:snippets`, `check:order`, `build:lib`, `check:llms`, `check:bundle`, both application builds, `check:ssr`, the unit tests of `zenit-ui` and of `beispiel-app`, `test:beispiel:jit`, `test:schematics` and `format:check`. It has to be green before anything is handed over, and so do the two Playwright runs. Node 24 is what CI uses; newer odd-numbered releases print engine warnings but work.

CI runs on `windows-latest`. The reference screenshots in `e2e/screenshots` were recorded on Windows and their path carries no platform, while the comparison runs with zero tolerance, so a Linux runner would fail every screenshot test. Re-record with `npm run e2e:update` on Windows, and look at the new images before committing them.

## Rules

- **Tokens only.** Color, spacing, radius, typography and shadow come from `var(--…)`. `projects/zenit-ui/src/styles/tokens.css` is the single place with hex and pixel values. Literal values copied verbatim from `spec/components/bundle.css` are accepted; any new one is a finding unless it is written down as a deviation.
- **Banned.** `linear-gradient`, `radial-gradient`, `conic-gradient`, `backdrop-filter`, `text-shadow`, `filter`, colored `box-shadow`, grid backgrounds, pill badges above headings, all-caps labels, icon backplates, cards with a colored border, metric tiles for marketing numbers, `::ng-deep`, `!important`. The full list is the section "Verboten" in `CLAUDE.md`.
- **No `@angular/material`,** not even temporarily. The only exception is the Material Icons webfont. Dependencies of the library are `@angular/core`, `common`, `forms`, `cdk` and `rxjs`, nothing else.
- **The API table is binding.** Selector, inputs, outputs and slots follow `projects/zenit-ui/README.md`, which mirrors `spec/guidelines/40-bibliothek.md`. Changing a selector or an input name is a breaking change and needs the owner's decision.
- **Form fields are native elements.** `<input>`, `<textarea>`, `<select>`, `<input type="checkbox">`, `<input type="range">`, `<details>`/`<summary>`, carrying the library classes. Controls that hold a value implement `ControlValueAccessor`.
- **Overlays come from the CDK.** `@angular/cdk/dialog`, `/menu`, `/overlay`, `/a11y`. Focus trap, Escape and focus return are not rebuilt.
- **Components have no styles of their own.** No `styles` or `styleUrls`. Every class lives in a partial under `projects/zenit-ui/src/styles/`.
- **Documentation, JSDoc and comments are English.** That includes the Playwright configs and the specs under `e2e/`: `playwright.beispiel.config.ts` and `e2e/beispiel.spec.ts` are English, the older suites next to them are still German and get translated when they are next touched. UI copy inside code examples stays German, because German is the product's language, for example `Server erstellen`. The design system under `spec/`, `CLAUDE.md` and `docs/pakete.md` stay German and are not translated.
- **Declare a class before anything in the same file references it in decorator metadata or in a signal query.** `contentChild(ZTable)` in a class above `ZTable`, a later class in `hostDirectives`, `imports` or `providers`, a static field: all of that is evaluated while the file loads. An AOT build never notices, because the linker moves the reference into a function. A consumer's Vitest run loads the package unlinked and compiles it with the JIT compiler, so the reference hits the temporal dead zone and every spec that imports anything from `zenit-ui` fails with `Cannot access 'X' before initialization`. Order the classes; `forwardRef(() => X)` is for a true cycle only. `inject(X)` in a field initialiser is fine, it runs later. Three checks enforce it: `check:order` scans the sources and names file and line, `check:bundle` imports `dist/zenit-ui/fesm2022/zenit-ui.mjs` in plain Node with `@angular/compiler` loaded and touches every `ɵcmp`, `ɵdir`, `ɵfac` and `ɵprov`, and `test:beispiel:jit` runs the example application's specs with `aot: false` against the package kept outside the test bundle.
- **Copy comes from the caller.** The library holds no German strings except default `aria-label` values, and those are overridable via inputs.
- **Host bindings and caller attributes.** `'[attr.x]': 'y() ? "…" : null'` does not leave the attribute alone when the expression is `null`: it **removes** it, on every change detection run, and thereby deletes what the caller wrote there, a static attribute as well as a binding of its own. So a host binding may own only an attribute no caller would write. For everything a caller plausibly writes (`role`, `aria-*`, `tabindex`, `title`, `id`, `name`, `type`) pick one of three. A value the library alone decides is **borrowed**: `leiheAttribut('role', () => …)` from `lib/a11y/host-attribute.ts` writes only while the library has a value and gives back the caller's **latest** value, which is the rule "the input wins while it is set, the caller's attribute stands while it is not" (`z-segment`, `z-spinner`, `z-table-container`). Latest, not the value at borrow time: a binding of the caller keeps writing while the library holds the attribute, so a `MutationObserver` runs for as long as it is borrowed, notes each new value as the one to give back and asserts the library value again. Do not decide such a thing from `HostAttributeToken` alone — that reads the static attribute at construction, when a binding of the caller has written nothing yet. An attribute that is a **list of tokens**, `aria-describedby` above all, gets `ZTokenAttribut` from the same file: it adds and removes exactly one token, keeps a fixed end of the list so two writers on the same element settle, and watches the attribute with a `MutationObserver` while its token stands, because a binding of the caller rewrites the whole attribute (`z-field` through `input[zInput]` and `z-select`, `zTooltip`). At most one writer per attribute **and end** on one element: two of them on the same end move the token past each other forever, which is a frozen tab, and a second claim therefore throws in development. Writing is skipped when nothing changes and the record of an own write is dropped with `takeRecords()` — Chromium queues a mutation record for a `setAttribute` with an unchanged value too, and answering that record with another write freezes the tab. And a **static** attribute that only has to be read once is `inject(new HostAttributeToken('type'), { optional: true })` (`button[zGameTile]`, `aria-disabled` on `button[zBtn]`). Both writers create their observer lazily and only where there is one, because a component that writes such an attribute during the first change detection run would otherwise throw `MutationObserver is not defined` on the server. New blocks state in their guide which of the three applies, and the case gets two unit tests: one with the attribute written statically in the host template, one with `[attr.…]` bound to a signal that changes while the library holds the attribute.

## Server rendering

`npm run check:ssr` prerenders every route of `beispiel-app` and of `ui-demo` in
plain Node (`ng build <app> --configuration ssr`, `outputMode: 'static'`). It
exists because **nothing else in this workspace renders on a server**: the unit
tests run in jsdom, which has `MutationObserver`, `ResizeObserver` and a layout;
`e2e` and `e2e:beispiel` run in a real browser; `check:bundle` only loads the
package. A component that touches a browser global while it is constructed
therefore passes every other check and still takes down the build of a consumer
who renders on the server.

**Both the exit code and the output are checked.** The CLI fails the build when
a route throws while rendering, but an error that Angular's error handler
catches — inside a signal computation, an effect, a control binding — is only
printed as `ERROR <Something>Error: …`, the route still counts as prerendered
and the build reports success. `tools/check-ssr.mjs` scans for `ERROR`,
`ReferenceError` and `is not defined` and fails on any of them. Do not
"fix" a finding by making it quieter.

**What it covers.** One render per route with no user interaction: construction,
the first change detection run and teardown of every component the prerendered
pages instantiate. `beispiel-app` reaches 27 of the 84 selectors, `ui-demo` adds
49 more, so 76 are rendered at least once. The eight that are not:
`z-menu`, `z-menu-separator` and `[zMenuItem]`, `z-confirm-dialog` and
`[zDialogActions]`, and `z-tooltip` live in an `ng-template` that the CDK only
instantiates when a trigger opens the overlay, so no gate of this shape can
reach them; `z-config` and `[zConfigAside]` are used only on two demo pages that
redirect to a URL with query parameters, which a prerender by path never
reaches. The triggers of all of them do render.

**No hydration, on purpose.** The schematic offers `provideClientHydration()`
and it is in neither `app.config.ts`, so no application source file changed for
this gate at all. The browser builds both applications ship are plain
client-side renders that never receive server markup, so the provider would do
nothing there except warn (NG0505) on every dev start. The gate wants the server
render, and the server renders with or without it. An application that really is
served with SSR adds the provider itself.

**What it does not cover.** Anything that needs an interaction. An observer
created in an event handler, in an overlay, or on a later change detection run
is never constructed here, so this gate would not see it. The unit test
`projects/zenit-ui/src/lib/**/ssr.spec.ts` covers construction outside a
browser; between the two, a new block that reaches for a browser global has to
be caught. It is also not a hydration check: the prerendered markup is compared
with nothing.

**The rule this enforces.** A browser global is read lazily and only where there
is one — `typeof MutationObserver === 'undefined'` before `new`, the same for
`ResizeObserver`, `matchMedia`, `localStorage` and every layout measurement
(`getBoundingClientRect`). That applies to `DestroyRef.onDestroy` as well: SSR
destroys the application after rendering, so a teardown that measures runs on
the server too.

Adding a page to either application widens the gate for free, and the demo
section that `Adding a building block` already asks for is what keeps the
coverage above current.

**Open findings at the time the gate was introduced.** It is red, and every one
of these is a real defect, not a false positive:

1. `ZButton` creates its `MutationObserver` in the constructor without a guard,
   so every page of both applications fails with
   `ReferenceError: MutationObserver is not defined`. Being fixed separately.
2. `ZStickyBar` measures in its `DestroyRef.onDestroy`: `miss()` calls
   `getBoundingClientRect` on every bar that is still alive, which fails on
   `/konfigurator` (`TypeError: bar.getBoundingClientRect is not a function`)
   because the page has more than one bar. Only visible once 1 is fixed.
3. `TypeError: this.field(...) is not a function` from `FormField` of
   `@angular/forms/signals` on `/formulare` and `/muster/startseite`, three
   times. Server only, in both dev and production mode, and swallowed by the
   error handler — the build reports success, which is what the output scan is
   for. Needs an owner; it is not in `projects/zenit-ui/src/lib`.

Until 2 and 3 are fixed, `npm run check:ssr beispiel-app` is the part that can
be green; narrowing the default list in `tools/check-ssr.mjs` would hide the
other two, so it stays as it is.

## Adding a building block

1. Create the folder `projects/zenit-ui/src/lib/<name>/` with the component or directive and its `index.ts`.
2. Export it from the package barrel `projects/zenit-ui/src/lib/pakete/<paket>.ts`, which `src/public-api.ts` re-exports.
3. Put the styles into the matching partial `projects/zenit-ui/src/styles/_<paket>.css`, taken verbatim from the section in `spec/components/bundle.css`. New partials are imported from `zenit-ui.css`.
4. Add a section to the demo page `projects/ui-demo/src/app/pages/<paket>/` showing the block in every state from `spec/guidelines/15-zustaende.md`: idle, hover, focus, active, disabled, loading, error, empty, success.
5. Write the unit test next to the source as `<name>.spec.ts` if the block holds state, a value or a calculation. The e2e suite picks up the new demo section automatically; run `npm run e2e:update` once to record its screenshots.
6. Add the row to the API table in `projects/zenit-ui/README.md`, a guide under `docs/components/` and an entry to `CHANGELOG.md`. `node tools/check-docs-examples.mjs` checks every example in those guides against the real selectors and inputs.

## Review checklist

Taken from the acceptance points in `spec/guidelines/00-auftrag.md` and `docs/pakete.md`.

- No `@angular/material` import and no `mat-*` in any template.
- No gradient, `backdrop-filter` or `text-shadow` in the computed style; no colored `box-shadow`.
- No hex, `rgb()` or pixel value for color, spacing or radius outside `tokens.css`; no `font-family` outside the three token fonts.
- At most 3 font families and 7 font sizes, nothing below 12px. Radii only 4px and 8px, plus `radius-full` for dot, avatar, toggle and meter.
- `accent` and `accent-text` only on interactive or active elements. At most one primary button per screen height.
- Every control has a visible `:focus-visible` ring. Every status is also spelled out as a word.
- Empty, loading, error and disabled states exist and are designed.
- No horizontal scrolling at 360px; touch targets at least 40px high on mobile. Breakpoints 640px and 900px.
- Transitions only `color`, `background-color`, `border-color`, 150ms, behind `prefers-reduced-motion: no-preference`. No `transform` on hover.
- Page title and navigation link carry the same name. No all-caps label, no pill badge above a heading.
- Selector, inputs and slots match the API table.
- No change to business logic, services or routes: check `git diff --stat`.
- No browser global read while a component is constructed, on its first change detection run or in its teardown; `npm run check:ssr` renders both applications in plain Node.
- `npm run check` green, `npm run e2e` and `npm run e2e:beispiel` green, `npm run docs:api` without warnings, `node tools/check-docs-examples.mjs` without mismatches.

## Release

No push, no publish and no deploy without the owner's approval. `npm pack` inside `dist/zenit-ui` is a local dry run only; the library is not on npm.
