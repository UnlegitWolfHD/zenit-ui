# Theming

Zenit UI ships one colour scheme in `tokens.css`: `dark`. This document
describes the opt-in stylesheets that add two more schemes and three more
accents, and the service that switches between them.

> **These values are not part of the Zenit design system yet; they were derived
> by the rules below and need the design owner's approval before being added to
> `tokens.json`.** `tokens.css` is compiled from `spec/tokens.json` and is
> unchanged; every value in this document lives in `styles/themes/` next to it.

## Concept

Four layers, in this order:

| Layer         | Where it lives                    | What it sets                                                         |
| ------------- | --------------------------------- | -------------------------------------------------------------------- |
| **Tokens**    | `styles/tokens.css`               | Every value of the system. The `dark` scheme is the `:root` default.   |
| **Scheme**    | `styles/themes/light.css`, `contrast.css` | All colour tokens plus `color-scheme`, under `[data-theme="<id>"]`. |
| **Accent**    | `styles/themes/accents.css`       | The five accent tokens, under `[data-accent="<id>"]`.                  |
| **Subtheme**  | `styles/_grundlage.css`           | `.z-theme-mc` swaps the primary button to `mc-accent`/`on-mc`.         |

A scheme changes everything, an accent changes only what carries "you can click
this", and the Minecraft subtheme sits on top of both and keeps working in
every scheme. Components never learn about any of this: they read custom
properties and nothing else.

The default accent `rot` has no block. It comes from `tokens.css` for `dark`
and from the scheme block for the others, and the service therefore removes
`data-accent` instead of writing `data-accent="rot"`.

## How to include

```css
@import "zenit-ui/styles/tokens.css";
@import "@angular/cdk/overlay-prebuilt.css";
@import "zenit-ui/styles/themes.css";
@import "zenit-ui/styles/zenit-ui.css";
```

Or, in `angular.json`:

```json
"styles": [
  "zenit-ui/styles/tokens.css",
  "@angular/cdk/overlay-prebuilt.css",
  "zenit-ui/styles/themes.css",
  "zenit-ui/styles/zenit-ui.css"
]
```

Write the package specifier, not `node_modules/zenit-ui/styles/…`: the specifier is resolved through
Node and therefore also works where the folder is somewhere else, in a git worktree without its own
`node_modules`, in a monorepo that hoists, and under pnpm. The `ng-add` schematic writes this form
and recognises the `node_modules/` spelling only to normalise an entry that is already there.

Single files work as well, as long as the order inside `themes.css` is kept:

```css
@import "zenit-ui/styles/themes/base.css";   /* color-scheme for dark   */
@import "zenit-ui/styles/themes/light.css";
@import "zenit-ui/styles/themes/contrast.css";
@import "zenit-ui/styles/themes/accents.css";
```

**Order matters, specificity does not settle it.** `:root` and
`[data-theme="light"]` both weigh (0,1,0), so the later rule wins. `themes.css`
has to come after `tokens.css`, and `accents.css` after the scheme files. Only
`[data-theme="light"][data-accent="blau"]` (0,2,0) wins on specificity alone.
Nothing checks the order inside a built CSS bundle. A wrong order shows up as
the dark values under `data-theme="light"`, which the screenshot tests of
`/themes` in `e2e/themes.spec.ts` catch; the contrast gate reads `themes.css`
to learn the order and measures the cascade that order produces.

`base.css` exists because `tokens.css` is compiled from `tokens.json` and stays
byte identical to `spec/tokens.css`; `color-scheme: dark` for the default
scheme therefore cannot live in it. Without `color-scheme`, a dark page opens a
white `<select>` drop-down and draws light scrollbars.

**The default no longer depends on `themes.css`.** `_grundlage.css` carries
`:where(:root) { color-scheme: dark; }`, so the documented minimum
(`tokens.css` plus `zenit-ui.css`) already gets dark native UI. `:where()`
keeps it at specificity (0,0,0), below every `[data-theme=…]` block, so the
scheme files win in either include order. `base.css` keeps the declaration for
`[data-theme="dark"]`, which puts a dark subtree back into the dark palette
inside a light page.

## `provideZenitTheme`

```ts
import { provideZenitTheme } from 'zenit-ui';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideZenitTheme()],
};
```

| Option          | Default                              | Meaning                                                                  |
| --------------- | ------------------------------------ | ------------------------------------------------------------------------ |
| `schemes`       | `['dark', 'light', 'contrast']`      | Ids written as `data-theme`. Own ids allowed; validation uses this list.   |
| `accents`       | `['rot', 'blau', 'gruen', 'violett']`| Ids written as `data-accent`. Own ids allowed.                             |
| `defaultScheme` | `'dark'`                             | One of `schemes`, or `'system'` to follow the operating system.            |
| `defaultAccent` | `'rot'`                              | One of `accents`. Carries no attribute.                                    |
| `storageKey`    | `'zenit-theme'`                      | `localStorage` key. `null`: no storage, start from the attributes present. |
| `target`        | `() => document.documentElement`     | Getter for the element that carries both attributes. Keep it stable.       |

The provider applies the stored or default choice when the application starts,
without anyone injecting the service. That is not the first frame: Angular
starts several frames after the first paint (measured below: about 110 frames
under a throttled network), and until then the page shows the default scheme.
The next section closes that gap.

**Application root only.** `ZTheme` is a root service and reads one config. A
second `provideZenitTheme()` in the `providers` of a route, or a second one at
the root, is ignored; dev mode prints a `console.warn`. Dev mode also warns
about a `defaultScheme` or `defaultAccent` that is not registered.

**`target`** has to return a stable element. If the getter starts returning
another element, the attributes are removed from the previous one with the next
change (not before, the service does not poll). `zenitThemeInitScript` and the
server only know `<html>`; both are skipped for a custom target.

## No flash of the wrong theme

Without further steps a user who chose `light` sees the dark default on every
load until Angular has started. Two things are needed, and only together do
they work:

1. **An inline script at the top of `<head>`** that sets `data-theme` and
   `data-accent` before the first paint. `zenitThemeInitScript(config?)`
   returns its source: same storage key, same validation, same defaults and the
   same resolution of `'system'` as `ZTheme`, from shared constants. A unit
   test runs the script and the service against the same stored values and
   system settings and compares what they write.
2. **A render-blocking stylesheet.** The Angular CLI inlines "critical" CSS and
   loads the full stylesheet late (`media="print"`, swapped on load).
   `[data-theme="light"]` is never critical, because nothing in `index.html`
   matches it at build time. So with the script alone the attribute is right
   and the page is still dark until the full stylesheet arrives. Set
   `optimization.styles.inlineCritical` to `false` for the production build.

`ng add zenit-ui --themes` does all of it: script after `<meta charset>` (or as
the first child of `<head>`), `inlineCritical: false`, `provideZenitTheme()` in
the application config. By hand:

```bash
# Prints the script body. @angular/compiler has to be loaded FIRST: the package
# ships unlinked partial declarations, and without the JIT compiler the import
# fails with "JIT compilation failed for injectable [class PlatformLocation]".
node -e "import('@angular/compiler').then(() => import('zenit-ui')).then((m) => console.log(m.zenitThemeInitScript()))"
```

A plain `import { zenitThemeInitScript } from 'zenit-ui'` in a Node script without that first
import does not work. The function itself has no dependency on Angular; what fails is loading the
module that carries it. Pass the same config as to `provideZenitTheme()`, for example
`m.zenitThemeInitScript({ defaultScheme: 'system' })`.

Paste the output into `<head>`, in front of every stylesheet. With the default config this is
verbatim what `ng add zenit-ui --themes` writes, and what the two applications of this workspace
carry:

```html
<head>
  <meta charset="utf-8" />
  <!-- prettier-ignore -->
  <script>(function(k,S,A,ds,da){var s=ds,a=da,d=document.documentElement,m=function(q,f){try{return matchMedia(q).matches}catch(e){return f}};try{var v=JSON.parse((k&&localStorage.getItem(k))||'null');if(v&&typeof v==='object'){if(v.scheme==='system'||S.indexOf(v.scheme)>-1)s=v.scheme;if(A.indexOf(v.accent)>-1)a=v.accent}}catch(e){}if(s==='system')s=S.indexOf('contrast')>-1&&m('(prefers-contrast: more)',false)?'contrast':m('(prefers-color-scheme: dark)',true)?'dark':'light';d.setAttribute('data-theme',s);if(a!==da)d.setAttribute('data-accent',a)})("zenit-theme",["dark","light","contrast"],["rot","blau","gruen","violett"],"dark","rot")</script>
  <title>…</title>
  <link rel="stylesheet" href="styles.css" />
</head>
```

The last five arguments are the config: storage key, schemes, accents, default scheme, default
accent. `zenitThemeInitScript({ defaultScheme: 'system' })` changes the fourth of them to
`"system"` and nothing else.

```json
"configurations": {
  "production": {
    "optimization": {
      "scripts": true,
      "styles": { "minify": true, "inlineCritical": false, "removeSpecialComments": true },
      "fonts": true
    }
  }
}
```

The script is generated, so regenerate it when the config changes (own
`schemes`, `defaultScheme: 'system'`, another `storageKey`). The two
applications of this workspace carry it in their `index.html`, and a test in
`projects/zenit-ui/schematics/ng-add/index.spec.ts` fails when that text is not
exactly the current output of the function.

**Content Security Policy.** The function returns the script body, without the
`<script>` tags, and the body contains no `eval`. Hash exactly that string
(`script-src 'sha256-…'`), or render it into `<script nonce="…">` on the
server. Keep formatters away from it (`<!-- prettier-ignore -->`): a reformatted
script is a different hash.

**Measured** on the production build of `ui-demo`, served statically,
Chromium with 1.6 Mbit/s and 150 ms latency, `light` stored, one sample per
animation frame from the first frame until the application is up:

| Build                                         | Dark frames        | First paint |
| --------------------------------------------- | ------------------ | ----------- |
| before (no script, critical CSS inlined)      | 110 of 156 (until 2.07 s) | 0.27 s |
| script only, critical CSS still inlined       | 68 of 158 (until 1.37 s)  | 0.27 s |
| script and `inlineCritical: false`            | 0 of 97                   | 2.03 s |

The price is visible in the last column: the first paint waits for the
stylesheet. What was painted earlier was an empty shell in the wrong scheme;
the moment the application shows content is the same in all three (about 2 s
here).

To repeat it: `npx ng build ui-demo`, serve `dist/ui-demo/browser` on a free
port with a fallback to `index.html`, then run the same test the dev server
gets, against that URL:

```
THEME_FLASH_URL=http://localhost:4510 E2E_PORT=4511 npx playwright test e2e/themes.spec.ts -g "No flash"
```

Against the dev server (no `THEME_FLASH_URL`) the test checks the script only;
critical CSS inlining exists only in an optimised build.

If neither step is an option, a static `<html data-theme="light">` in
`index.html` fixes the scheme for everyone until the service starts; that fits
an application with a fixed scheme and no switch.

## Keeping your own preference storage

An application that already stores the visitor's colour scheme keeps its storage and hands the
result to the library. Three parts:

```ts
// 1. no storage of the library's own
provideZenitTheme({ storageKey: null, schemes: ['dark', 'light'], accents: ['rot', 'blau'] });
```

```html
<!-- 2. your own inline script, before the first paint: your storage, your key -->
<script>
  var t = localStorage.getItem('app-theme');
  if (t) document.documentElement.setAttribute('data-theme', t);
</script>
```

```ts
// 3. once at start-up, and whenever the visitor changes the setting
inject(ZTheme).setScheme(stored); // 'dark', 'light', … or 'system'
```

With `storageKey: null` `ZTheme` never touches `localStorage`, and it starts from the attributes
that are already on `<html>` (or on the `target`): a registered `data-theme` becomes `scheme()`, a
registered `data-accent` becomes `accent()`, and nothing is rewritten to the defaults in between.
Before this the service wrote `data-theme="dark"` and removed `data-accent` at bootstrap, which
flashed the default scheme. An id that is not registered is replaced by the default. With a storage
key set nothing changes: the stored choice and the defaults win over a pre-set attribute. On the
server a fixed `defaultScheme` is still written into the document, and the browser keeps it unless
your script replaced it.

Two things to get right:

- **The attribute only prevents the flash; `setScheme(stored)` states the choice. Always call it
  once at start-up.** An attribute carries a resolved scheme, never `'system'`, so one that equals
  what `defaultScheme` resolves to cannot be told from the default and is not taken as a choice.
  That keeps `'system'` alive when it was only resolved. It also means: with
  `defaultScheme: 'system'`, a dark operating system and a visitor who explicitly stored `dark`,
  `scheme()` reports `'system'`, and the page turns light when the operating system does, until
  your code has called `setScheme('dark')`. The call resolves to the value that is already on the
  page, so it changes nothing visible.
- **Do not run `zenitThemeInitScript` after your own script.** `ng add zenit-ui --themes` installs
  it, and it does not look at what is on `<html>`: it writes the default `data-theme` over yours, so
  a pre-set `light` ends as `dark`. Remove the library's script, or put yours behind it. (It leaves
  a pre-set `data-accent` alone while the accent is the default one. Do not build on that.)

All of it is pinned by unit tests in `lib/theme/theme.spec.ts`, "with storageKey null and attributes
set before bootstrap".

## The `ZTheme` API

```ts
const theme = inject(ZTheme);
```

| Member                    | Type                      | Meaning                                                             |
| ------------------------- | ------------------------- | ------------------------------------------------------------------- |
| `scheme()`                | `Signal<string>`          | The chosen value, including `'system'`.                              |
| `resolvedScheme()`        | `Signal<string>`          | What is applied; `'system'` resolves to `'contrast'`, `'dark'` or `'light'`. |
| `accent()`                | `Signal<string>`          | The chosen accent.                                                   |
| `setScheme(id)`           | `(string) => boolean`     | Switches and stores. `false` for an unknown id, nothing changes.     |
| `setAccent(id)`           | `(string) => boolean`     | Same for the accent.                                                 |
| `reset()`                 | `() => void`              | Back to the defaults and drops the stored choice.                    |

**Unknown ids are rejected, not thrown.** The usual caller is a `<select>` whose
value can come from outside the application (a stored value, a query parameter,
a hand-edited `localStorage`), and a bad value there must not take the page
down. A stored unknown id is ignored the same way and the default stays. In dev
mode `setScheme` and `setAccent` name the rejected id in a `console.warn`; do
not drop the return value silently either (the demo resets its `<select>`).

**SSR.** `window`, `matchMedia` and `localStorage` are never touched outside
the browser, and a custom `target` is never called there. The service reports
the defaults. One thing it does write, through the injected `DOCUMENT`: a
`defaultScheme` other than `'system'` goes onto `<html>` of the server document
as `data-theme`, so the delivered HTML already carries it. The stored choice
and `'system'` can only be resolved in the browser; that is the job of the init
script above. Without SSR and without the script, a static
`<html data-theme="…">` in `index.html` does the same as the server.

**System mode** resolves to `contrast` while `prefers-contrast: more` matches
and `contrast` is one of `schemes`; otherwise to `dark` or `light` after
`prefers-color-scheme`. Both are followed live, without a reload, and the init
script resolves them the same way. Choosing any other scheme ends that.

**Other tabs.** The service listens to the `storage` event for its own key: a
scheme chosen in one tab is applied in the others, and a `reset()` there
resets them. The listeners (media queries and `storage`) are removed when the
injector is destroyed.

## Writing your own theme

A scheme is a CSS block that overrides tokens. Names and roles stay, values
change. Colours are not the only thing a scheme may touch: radii, fonts,
spacing and the control heights are tokens too.

```css
[data-theme="sepia"] {
  color-scheme: light;
  --bg: #f7f1e6;
  --surface: #efe7d8;
  --surface-raised: #e6dccb;
  --surface-hover: #dcd0bc;
  --text: #2a2419;
  /* ... every token of the table below ... */

  /* not only colours: */
  --radius-sm: 0;
  --radius-md: 2px;
  --control-md: 44px;
  --font-body: "IBM Plex Sans", system-ui, sans-serif;
}
```

Register the id, otherwise the service rejects it:

```ts
provideZenitTheme({ schemes: ['dark', 'light', 'contrast', 'sepia'] });
```

An accent is the same with five tokens:

```css
[data-accent="tuerkis"] {
  --accent: #0f766e;
  --accent-hover: #115e59;
  --on-accent: #ffffff;
  --accent-text: #5eead4;
  --accent-subtle: rgba(94, 234, 212, 0.12);
}
```

If the accent has to work on a light ground as well, add a second block
`[data-theme="light"][data-accent="tuerkis"]`, because `accent-text` has to
reach 4.5:1 against that scheme's `bg` and `surface`.

## The contrast rules and the gate

There is no specification for these values, so they are derived by fixed rules
and the derivation is checked, not trusted. Every rule is measured as WCAG 2.1
contrast, with `rgba()` fills composited over the surface they are stated on.

| Rule                                                          | Required |
| ------------------------------------------------------------- | -------- |
| `text` on `bg`, `surface`, `surface-raised`, `surface-hover`    | ≥ 12:1   |
| `text-muted` on `bg`, `surface`, `surface-raised`               | ≥ 7:1    |
| `text-subtle` on `bg`, `surface`, `surface-raised`              | ≥ 4.5:1  |
| `text-muted` on `surface-hover`                                 | ≥ 4.5:1  |
| `border-control` on `surface`                                   | ≥ 3:1    |
| `on-accent` on `accent` and on `accent-hover`                   | ≥ 4.5:1  |
| `accent-text` on `bg`, `surface` and `surface-raised`           | ≥ 4.5:1  |
| `on-mc` on `mc-accent` and on `mc-accent-hover`                 | ≥ 4.5:1  |
| `on-mc` on `success` (the knob of the checked toggle, a graphic) | ≥ 3:1    |
| `success`/`warning`/`danger`/`info` on `bg` and `surface`        | ≥ 4.5:1  |
| … and on their own `-subtle` over `surface-raised` and `surface` | ≥ 4.5:1  |
| `danger` on `surface-raised` and `surface-hover` (menu item)     | ≥ 4.5:1  |
| `text` on every status `-subtle` over `bg` and `surface` (alert title) | ≥ 12:1 |
| `text-muted` on every status `-subtle` over `bg` and `surface` (alert body, and the control border inside an alert) | ≥ 4.5:1 |
| `accent-text` on every status `-subtle` over `bg` and `surface` (link in an alert) | ≥ 4.5:1 |
| `focus` against all four surfaces and against `accent`           | ≥ 3:1    |
| `danger` apart from `accent-text`                                | ≥ 1.25:1 **or** ≥ 30° hue |

`focus` is not measured against `accent-hover`. On the light ground it cannot
pass (2.41:1 with `rot`, 2.97:1 with `blau` and `gruen`, 2.54:1 with
`violett`): a fill that keeps white at 4.5:1 and near black at 3:1 sits in a
band so narrow that hover would look like rest. It does not have to: the ring
is drawn with a 2px offset and lies on the surface around the button, never on
the fill.

The last rule has two ways of passing on purpose. In the red accents `danger`
is the lighter and more orange red, which the luminance rule catches. With a
blue, green or violet accent the two colours differ by hue instead, and
demanding a luminance difference there would be meaningless.

Run the gate:

```
node tools/check-theme-contrast.mjs        # table and verdict
node tools/check-theme-contrast.mjs --md   # same table as Markdown
```

It reads `tokens.css` and the files `themes.css` imports, rebuilds the cascade
for every scheme × accent combination, resolves `var()` aliases, composites
`rgba()` and measures every pair above. It measures all combinations, lists
every failure and then exits with 1 if there was at least one.
It also fails when a scheme leaves a colour token undefined or an accent leaves
one of its five undefined, so a new scheme cannot be half finished. Schemes and
accents are discovered from the stylesheets, so adding one automatically adds
it to the gate. Today: 3 schemes × 4 accents, 816 pairs.

The parser knows flat rules only. A block at-rule (`@media`, `@supports`,
`@layer`, `@container`) in one of the files stops the run with exit code 2
instead of being flattened into rules that seem to apply unconditionally.

`dark` with the default accent is `tokens.css` and normative, so the gate may
not demand other values there. Two pairs of it miss a rule that was added
later: `accent-text` on `warning-subtle` and on `info-subtle` over `surface`
(4.37:1 and 4.38:1, rule 4.5:1), a link inside a tinted alert inside a panel.
They are printed as `Referenz`, listed at the end of every run and do not fail
it; a listed pair that passes again is an error, so the list cannot go stale.
See "Open design questions".

It runs as `npm run check:themes` and is part of `npm run check`. It guards the
schemes this package ships and reads only the library's own files; it is not
part of the published package. Check your own scheme with your own contrast
tooling against the table above.

## The values

`dark` is unchanged and listed as the reference the other two were derived
from. Measured values are the tightest of the pairs the rule names, with the
default accent `rot`.

### Surfaces, text and borders

| Token             | dark (reference) | light     | contrast  | measured (dark / light / contrast) |
| ----------------- | ---------------- | --------- | --------- | ---------------------------------- |
| `--bg`            | `#060608`        | `#ffffff` | `#000000` | –                                  |
| `--surface`       | `#0e0e11`        | `#f4f4f6` | `#0b0b0e` | –                                  |
| `--surface-raised`| `#15151a`        | `#eaeaee` | `#17171d` | –                                  |
| `--surface-hover` | `#1b1b21`        | `#dfdfe5` | `#24242c` | –                                  |
| `--border`        | `#26262c`        | `#dcdce2` | `#5e5e6a` | decorative; in `contrast` 3.07 on `surface`, 3.29 on `bg`, 2.79 on `surface-raised` |
| `--border-control`| `#62626d`        | `#85858f` | `#a9a9b5` | 3.20 / 3.33 / 8.45 (≥ 3)           |
| `--text`          | `#f2f2f3`        | `#18181b` | `#ffffff` | 16.26 / 14.77 / 17.85 (≥ 12)       |
| `--text-muted`    | `#9ca3af`        | `#4a4a54` | `#d5d9e1` | 7.17 / 7.30 / 12.61 (≥ 7)          |
| `--text-subtle`   | `#7d838f`        | `#66666f` | `#b0b6c2` | 4.78 / 4.74 / 8.77 (≥ 4.5)         |
| `--focus`         | `#ffffff`        | `#09090b` | `#ffffff` | 4.70 / 3.27 / 4.70 vs `accent` (≥ 3) |
| `--scrim`         | `rgba(0,0,0,.6)` | `rgba(9,9,11,.5)` | `rgba(0,0,0,.8)` | – |
| `--shadow-overlay`| `0 8px 24px rgba(0,0,0,.5)` | `0 8px 24px rgba(9,9,11,.18)` | `0 8px 24px rgba(0,0,0,.8)` | – |

### Status and Minecraft

| Token              | dark (reference)          | light     | contrast                  | measured on its own `-subtle` |
| ------------------ | ------------------------- | --------- | ------------------------- | ----------------------------- |
| `--success`        | `#4caf50`                 | `#166534` | `#7ce38b`                 | 5.53 / 6.20 / 7.84 (≥ 4.5)    |
| `--success-subtle` | `rgba(76,175,80,.12)`     | `#e4f3e7` | `rgba(124,227,139,.16)`   |                               |
| `--warning`        | `#f5a524`                 | `#8a5300` | `#ffc75c`                 | 7.24 / 5.63 / 7.99 (≥ 4.5)    |
| `--warning-subtle` | `rgba(245,165,36,.12)`    | `#fdf0dc` | `rgba(255,199,92,.16)`    |                               |
| `--danger`         | `#ff6b6b`                 | `#b5330f` | `#ff9661`                 | 5.58 / 5.32 / 6.22 (≥ 4.5)    |
| `--danger-subtle`  | `rgba(255,107,107,.12)`   | `#fdece7` | `rgba(255,150,97,.16)`    |                               |
| `--info`           | `#6cb6ff`                 | `#17548f` | `#9ccdff`                 | 6.88 / 6.63 / 7.50 (≥ 4.5)    |
| `--info-subtle`    | `rgba(108,182,255,.12)`   | `#e4eefa` | `rgba(156,205,255,.16)`   |                               |
| `--mc-accent`      | `#5fb84e`                 | `#2f7d32` | `#78d964`                 | `on-mc` 6.42 / 5.12 / 9.99    |
| `--mc-accent-hover`| `#4ea03f`                 | `#276b2a` | `#63bd51`                 | `on-mc` 4.88 / 6.52 / 7.49    |
| `--on-mc`          | `#06280a`                 | `#ffffff` | `#031e06`                 |                               |
| `danger` vs `accent-text` |                    |           |                           | 1.32 / 1.30 / 1.27 (≥ 1.25)   |

In `light` the `-subtle` fills are opaque light tints, not the status colour at
10 % opacity: on a light ground a translucent tint darkens the badge and eats
exactly the contrast the word inside it needs.

### Accents

| Accent    | Scheme   | `--accent` | `--accent-hover` | `--on-accent` | `--accent-text` | `--accent-subtle`         | `on-accent` | `accent-text` on `surface` | `focus` vs `accent` |
| --------- | -------- | ---------- | ---------------- | ------------- | --------------- | ------------------------- | ----------- | -------------------------- | ------------------- |
| `rot`     | dark     | `#e11d48`  | `#be123c`        | `#ffffff`     | `#ff2d4f`       | `rgba(255,45,79,.1)`      | 4.70 / 6.29 | 5.27                       | 4.70                |
| `rot`     | light    | `#c2123f`  | `#9d0e33`        | `#ffffff`     | `#a11039`       | `#fbe7ec`                 | 6.08 / 8.25 | 7.22                       | 3.27                |
| `rot`     | contrast | `#e11d48`  | `#be123c`        | `#ffffff`     | `#ff6b85`       | `rgba(255,107,133,.16)`   | 4.70 / 6.29 | 7.20                       | 4.70                |
| `blau`    | dark     | `#1d4ed8`  | `#1a44ba`        | `#ffffff`     | `#7ab0ff`       | `rgba(122,176,255,.12)`   | 6.70 / 8.14 | 8.70                       | 6.70                |
| `blau`    | light    | `#2563eb`  | `#1d4ed8`        | `#ffffff`     | `#1d4ed8`       | `#e6edfd`                 | 5.17 / 6.70 | 6.10                       | 3.85                |
| `blau`    | contrast | `#1d4ed8`  | `#1a44ba`        | `#ffffff`     | `#7ab0ff`       | `rgba(122,176,255,.12)`   | 6.70 / 8.14 | 8.87                       | 6.70                |
| `gruen`   | dark     | `#15803d`  | `#116a32`        | `#ffffff`     | `#5fd07a`       | `rgba(95,208,122,.12)`    | 5.02 / 6.71 | 9.90                       | 5.02                |
| `gruen`   | light    | `#15803d`  | `#116a32`        | `#ffffff`     | `#116a32`       | `#e3f3e9`                 | 5.02 / 6.71 | 6.10                       | 3.97                |
| `gruen`   | contrast | `#15803d`  | `#116a32`        | `#ffffff`     | `#5fd07a`       | `rgba(95,208,122,.12)`    | 5.02 / 6.71 | 10.10                      | 5.02                |
| `violett` | dark     | `#7e22ce`  | `#6b1fae`        | `#ffffff`     | `#c795f5`       | `rgba(199,149,245,.12)`   | 6.98 / 8.63 | 8.30                       | 6.98                |
| `violett` | light    | `#8b2ade`  | `#7420bd`        | `#ffffff`     | `#6b1fae`       | `#f0e4fb`                 | 6.03 / 7.82 | 7.86                       | 3.30                |
| `violett` | contrast | `#7e22ce`  | `#6b1fae`        | `#ffffff`     | `#c795f5`       | `rgba(199,149,245,.12)`   | 6.98 / 8.63 | 8.47                       | 6.98                |

`dark` and `contrast` share one accent block; only `light` needs its own,
because there `accent-text` has to be a deep colour instead of a light tint.

Known overlap: with `gruen`, `accent-text` sits close to `--success`, and with
`blau` close to `--info`. The design system answers that itself, because a
status is always written out as a word as well. See "Open design questions".

### Changes after the review

| Token, scheme              | Old       | New       | Why, with the measured ratio                                                       |
| -------------------------- | --------- | --------- | ---------------------------------------------------------------------------------- |
| `--danger`, light          | `#b8340f` | `#b5330f` | Danger item of a menu on `surface-hover`: 4.47 → 4.59 (≥ 4.5). On `surface-raised` 5.08, on its tint 5.32, vs `accent-text` 1.34 → 1.30. |
| `--danger`, contrast       | `#ffa08c` | `#ff9661` | Red-green deficiency: colour difference to `success` under deuteranopia about 3.5 → 18. On its tint 6.63 → 6.22, vs `accent-text` 1.39 → 1.27 (≥ 1.25). |
| `--danger-subtle`, contrast | `rgba(255,160,140,.16)` | `rgba(255,150,97,.16)` | Follows `--danger`.                                           |
| `--border`, contrast       | `#4a4a56` | `#5e5e6a` | The comment promised "about 3:1 on surface", measured 2.25. Now 3.07 on `surface`, 3.29 on `bg`, 2.79 on `surface-raised`; 2.75 between `border` and `border-control`. |
| `--accent`, contrast / rot | `#d1163f` | `#e11d48` | The fill of the dark scheme. Against `bg` 3.90 → 4.47; `on-accent` 5.39 → 4.70 (≥ 4.5). |
| `--accent-hover`, contrast / rot | `#ab1033` | `#be123c` | Against `bg` 2.85 → 3.34; `on-accent` 7.36 → 6.29.                          |

The dark scheme is normative and was not touched.

## What is not covered

- The scheme is a per-document choice. Two schemes side by side on one page
  would need the tokens on a container instead of the root; the CSS already
  allows it (`[data-theme]` matches any element), the service writes to one
  target only.
- A choice of `dark` or `light` wins over `prefers-contrast: more`; only
  `'system'` follows it.
- The values still need the design owner's approval, see the note at the top.

## Open design questions

Proposals of the review that were not taken, and what was measured. They need
the design owner.

- **Accent hues, `blau` → indigo and `gruen` → teal.** With `gruen`,
  `accent-text` and `success` are nearly one colour: 1.43:1 and 12° of hue
  apart in `dark`, 1.06:1 and 1° in `light`, 1.22:1 and 6° in `contrast`. With
  `blau` the same holds for `info`: 1.03:1 and 6°, 1.16:1 and 15°, 1.33:1 and
  5°. "Clickable" and "status" are then told apart by the written word only.
  Moving the two accents away from the status hues would fix that; it changes
  the look of two accents, so it was not done here.
- **A token for the disabled opacity.** `opacity: 0.45` is a literal in 8
  places of the library stylesheets. Text at 45 % on `surface` reaches 4.17:1 in
  `dark`, 2.86:1 in `light` and 4.51:1 in `contrast`; `border-control` at 45 %
  1.56:1, 1.61:1 and 2.54:1. WCAG exempts disabled controls, but a token
  (`--opacity-disabled`) would let `light` and `contrast` choose their own
  value. It belongs in `tokens.json`, which this package does not own.
- **Links inside a tinted alert in `dark`.** `accent-text` on `warning-subtle`
  and `info-subtle` over `surface` measures 4.37:1 and 4.38:1, below 4.5:1, in
  the normative scheme (on `bg` it passes with 4.72:1 and 4.74:1). Options: a
  link in an alert takes `text` and keeps the underline it now always has, or
  lighter tints in `dark`, which is a change to `tokens.json`. Until then the gate lists both pairs as
  `Referenz`.
- **Fills of `blau`, `gruen` and `violett` on the black ground of `contrast`.**
  `rot` was lightened to the fill of the dark scheme. The other three share one
  block with `dark`; against `#000000` their fills measure 3.13 / 4.19 / 3.01
  and their hover fills 2.58 / 3.13 / 2.43, while `on-accent` has room (6.70 /
  5.02 / 6.98 on the fill). Lightening them needs a third block per accent
  (`[data-theme="contrast"][data-accent="…"]`) and a decision on the values.
