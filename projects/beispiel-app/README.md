# beispiel-app

Two pages, built the way a real application would build them: "Gameserver", the
list of the customer area with every state it can be in, and "Einbindung",
which walks through the setup with the real files of this project. It consumes
`zenit-ui` from the **built package** in `dist/zenit-ui`, following the setup
steps of `projects/zenit-ui/README.md` one by one. So it is a template to copy
from, a description of its own wiring and the proof that the shipped package
works.

Copy is German (du-form), code, comments and this file are English.

## Run it

```bash
npm run start:beispiel   # builds the library, then serves the app
npm run build:beispiel   # builds library and application
npx ng test beispiel-app --watch=false
npm run e2e:beispiel     # Playwright: screenshots, axe, style rules, interactions
```

`start:beispiel` builds the library first on purpose: the application resolves
`zenit-ui` to `dist/zenit-ui`, so without that build there is nothing to import.

## How it consumes the built package

| Step of the package README  | Where it is done here                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Install the package         | `projects/beispiel-app/tsconfig.app.json` and `tsconfig.spec.json` override `compilerOptions.paths` so that `zenit-ui` points at `../../dist/zenit-ui`. In a real application `npm i ./zenit-ui-0.1.0.tgz` puts the same package into `node_modules` and no override is needed. The workspace root maps `zenit-ui` to the library sources instead, which is what library development needs; this project deliberately does not use that. |
| 1. Styles in `angular.json` | `styles` of the build target, in this order: `dist/zenit-ui/styles/tokens.css`, `@angular/cdk/overlay-prebuilt.css`, `dist/zenit-ui/styles/themes.css`, `dist/zenit-ui/styles/zenit-ui.css`, `projects/beispiel-app/src/styles.css`.                                                                                                                                                                                              |
| 2. `z-root`                 | `src/index.html` carries `class="z-root"` on `<html>` and on `<body>`, plus `lang="de"` and the page title.                                                                                                                                                                                                                                                                                                                              |
| 3. Self-hosted fonts        | Top of `src/styles.css`: Material Icons in the cascade layer `schriften`, Inter 400/500/600, Space Grotesk 600/700, JetBrains Mono 400/600. No request to Google.                                                                                                                                                                                                                                                                        |
| 4. Toast outlet             | `<z-toast-outlet />` once, at the end of `layout/shell`.                                                                                                                                                                                                                                                                                                                                                                                 |
| 5. Minecraft subtheme       | Not used on these pages.                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Themes                      | `provideZenitTheme({ defaultScheme: 'system' })` in `app.config.ts`, the switch in `layout/theme-control`. Scheme and accent land in `localStorage`, so the choice survives a reload.                                                                                                                                                                                                                                                                                                                                                                                                                   |

To check that the application really compiles against `dist` and not against
the library sources, rename `dist/zenit-ui` and build: the build fails with
`TS2307: Cannot find module 'zenit-ui'`.

## Folder map

```
src/
  index.html                     html.z-root, body.z-root, title, lang="de"
  styles.css                     fonts plus the layout rules of the app, tokens only
  app/
    app.ts                       root component, renders the shell
    app.config.ts                router with withComponentInputBinding()
    app.routes.ts                "" -> /gameserver, the page is lazy
    layout/shell/shell.ts        skip link, AppHeader, main, Footer, toast outlet
    layout/theme-control/        scheme and accent, two menus in the header
    pages/gameserver/gameserver.ts   the page: PageHeader, filters, actions, feedback
    pages/einbindung/einbindung.ts   the setup, step by step, with the real files
    gameserver/
      beispieldaten.ts           the sample data, the only file to throw away
      gameserver-data.ts         service: simulated loading, filter function
      server-list/server-list.ts the list in all of its states
      server-list/server-list.spec.ts
    shared/code-block/           one block of code with caption and copy button
    shared/quelltexte.ts         region extraction over the generated sources
    shared/quelltexte.generated.ts   written by tools/generate-example-snippets.mjs
```

## Generated with the Angular CLI

Every file of this project was created by a schematic and then edited, no
component was written by hand:

```bash
npx ng generate application beispiel-app --style css --routing --ssr false --prefix app \
  --test-runner vitest --skip-install --defaults
npx ng generate component layout/shell --project beispiel-app --inline-template --inline-style --skip-tests
npx ng generate component pages/gameserver --project beispiel-app --inline-template --inline-style --skip-tests
npx ng generate component gameserver/server-list --project beispiel-app --inline-template --inline-style
npx ng generate service gameserver/gameserver-data --project beispiel-app --skip-tests
npx ng generate component layout/theme-control --project beispiel-app --inline-template --inline-style
npx ng generate component shared/code-block --project beispiel-app --inline-template --inline-style
npx ng generate component pages/einbindung --project beispiel-app --inline-template --inline-style --skip-tests
```

`--inline-template --inline-style` keeps one file per component, as in
`projects/ui-demo`; the application itself needs almost no CSS, so no component
carries a stylesheet. `--skip-tests` everywhere except the list, which is the
component with the states worth testing. `--skip-install` because the workspace
already has every dependency. The generated `app.html`, `app.css` and
`app.spec.ts` of the root component were deleted: the root only renders the
shell.

## Looking at the states

The query parameter `zustand` simulates what the server answers. The default,
without a parameter, is the normal list.

| URL                                       | What you see                                                   |
| ----------------------------------------- | -------------------------------------------------------------- |
| `/gameserver`                             | Skeleton rows after 300ms, then eight servers, six per page    |
| `/gameserver?zustand=laden`               | The loading state, kept standing                               |
| `/gameserver?zustand=leer`                | Empty state with a secondary action, no filters, no pagination |
| `/gameserver?zustand=fehler`              | One alert with cause, next step and "Erneut laden"             |
| Search for something that matches nothing | Own sentence plus "Filter zurücksetzen"                        |

The row menu shows the rest: "Neustart" answers with a toast, "Server löschen"
opens a confirmation that stays disabled until the server name is typed, and
deleting the last server leads to the empty state.

The two icon buttons in the header switch the colour scheme (Dunkel, Hell,
Kontrast, System) and the accent (Rot, Blau, Grün, Violett). Both are stored,
so a reload keeps them; "System" follows the operating system live.

## The code on the page

Every region of the Gameserver page has a disclosure "So ist es eingebunden"
with the source that produces it, and `/einbindung` shows the seven setup steps
file by file. **None of that code is written twice.**

1. `tools/generate-example-snippets.mjs` copies the real files verbatim into
   `src/app/shared/quelltexte.generated.ts` and derives the `styles` excerpt
   from `angular.json`. `npm run build:beispiel` and `npm run start:beispiel`
   run it; `npm run check:snippets` (part of `npm run check` and of CI) fails
   when the copy is stale.
2. The files mark the interesting parts with `#region <name>` and `#endregion`
   in whatever comment syntax they use. `shared/quelltexte.ts` cuts them out at
   runtime, drops the marker lines and the common indentation, and keeps nested
   regions; that function has its own unit test.

Importing the sources as text at build time was the first idea. The application
builder would do it, but the TypeScript compiler resolves
`import quelle from './gameserver.ts' with { loader: 'text' }` as a module and
fails with TS1192 and TS5097 before esbuild ever sees the attribute. That was
tried, not assumed.

## Copy this page

| Region                   | Rule it follows                                                                                                                   |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `index.html`             | `z-root` on `<html>` and `<body>`, `lang="de"`, title equal to the page                                                           |
| Skip link                | First tab stop, visible on focus, 40px high (15-zustaende.md)                                                                     |
| `z-app-header`           | Brand, up to seven links, credit in mono as a link, avatar; active link carries `aria-current="page"`                             |
| `main.z-container`       | Content at most `container` wide, left aligned, `tabindex="-1"` for the skip link                                                 |
| `z-page-header`          | Title equals the navigation link, one fact, exactly one primary per screen height                                                 |
| Filter row               | Search with icon plus `z-select--sm` in one line, two rows below 640px, gone while the list is empty                              |
| `z-panel` "Meine Server" | The one container with a border, `flush` for lists, `aria-busy` while loading                                                     |
| `z-rows`                 | Shared grid, status always the second column and always a word, tariff as a neutral tag, amounts right aligned in mono            |
| Row actions              | Own tab stop next to the row, not inside a link; destructive entries below a separator and always with a dialog                   |
| `z-pagination`           | Last row of the panel, appears only from the second page on                                                                       |
| States                   | Skeleton only after 300ms, empty state with one secondary action, at most one alert, own sentence when the filter matches nothing |
| Feedback                 | Toast for what happened, dialog for what cannot be undone, focus returns to the trigger                                           |
| `z-footer`               | Customer area: only the bottom row, copyright left, legal links right                                                             |
| `styles.css`             | Only `var(--…)`, no hex, no pixel or radius literals of its own                                                                   |
| Theme control            | Library components only, 40px targets, current value in the `aria-label`, choice stored by `ZTheme`                               |
| Code blocks              | Mono in `mono-sm`, own scroll region with a name, height capped, copy with toast, never widens the page                           |

## What to replace in a real application

`gameserver/beispieldaten.ts` and the timer in `gameserver/gameserver-data.ts`:
put your HTTP calls there and keep the signals. The code display
(`shared/code-block`, `shared/quelltexte*`, the page "Einbindung" and the
disclosures) exists to explain this example and comes out with it. Everything
else stays. The row of the list would then link to the detail page of a server,
which this example does not have (see the comment in `server-list.ts`).

In a real application the `paths` override in the two tsconfigs also goes away,
because `npm i ./zenit-ui-0.1.0.tgz` or `ng add zenit-ui --themes` puts the
package into `node_modules`.
