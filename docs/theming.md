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
  "node_modules/zenit-ui/styles/tokens.css",
  "node_modules/@angular/cdk/overlay-prebuilt.css",
  "node_modules/zenit-ui/styles/themes.css",
  "node_modules/zenit-ui/styles/zenit-ui.css"
]
```

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
The demo checks this in the built bundle, not only in the sources.

`base.css` exists because `tokens.css` is compiled from `tokens.json` and stays
byte identical to `spec/tokens.css`; `color-scheme: dark` for the default
scheme therefore cannot live in it. Without `color-scheme`, a dark page opens a
white `<select>` drop-down and draws light scrollbars.

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
| `defaultScheme` | `'dark'`                             | One of `schemes`, or `'system'` to follow `prefers-color-scheme`.          |
| `defaultAccent` | `'rot'`                              | One of `accents`. Carries no attribute.                                    |
| `storageKey`    | `'zenit-theme'`                      | `localStorage` key. `null` turns persistence off.                          |
| `target`        | `() => document.documentElement`     | Getter for the element that carries both attributes.                       |

The provider also applies the stored or default choice at startup, so the first
frame is already in the right scheme without anyone injecting the service.

## The `ZTheme` API

```ts
const theme = inject(ZTheme);
```

| Member                    | Type                      | Meaning                                                             |
| ------------------------- | ------------------------- | ------------------------------------------------------------------- |
| `scheme()`                | `Signal<string>`          | The chosen value, including `'system'`.                              |
| `resolvedScheme()`        | `Signal<string>`          | What is applied; `'system'` resolves to `'dark'` or `'light'`.        |
| `accent()`                | `Signal<string>`          | The chosen accent.                                                   |
| `setScheme(id)`           | `(string) => boolean`     | Switches and stores. `false` for an unknown id, nothing changes.     |
| `setAccent(id)`           | `(string) => boolean`     | Same for the accent.                                                 |
| `reset()`                 | `() => void`              | Back to the defaults and drops the stored choice.                    |

**Unknown ids are rejected, not thrown.** The usual caller is a `<select>` whose
value can come from outside the application (a stored value, a query parameter,
a hand-edited `localStorage`), and a bad value there must not take the page
down. A stored unknown id is ignored the same way and the default stays.

**SSR.** `document`, `window`, `matchMedia` and `localStorage` are never touched
outside the browser. On the server the service reports the defaults and writes
nothing; the attributes are applied on the client.

**System mode** follows `prefers-color-scheme` live, without a reload. Choosing
any other scheme ends that.

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
| `text` on `bg`, `surface`, `surface-raised`                     | ≥ 12:1   |
| `text-muted` on `bg`, `surface`, `surface-raised`               | ≥ 7:1    |
| `text-subtle` on `bg`, `surface`, `surface-raised`              | ≥ 4.5:1  |
| `border-control` on `surface`                                   | ≥ 3:1    |
| `on-accent` on `accent` and on `accent-hover`                   | ≥ 4.5:1  |
| `accent-text` on `bg` and on `surface`                          | ≥ 4.5:1  |
| `on-mc` on `mc-accent` and on `mc-accent-hover`                 | ≥ 4.5:1  |
| `success`/`warning`/`danger`/`info` on `bg` and `surface`        | ≥ 4.5:1  |
| … and on their own `-subtle` over `surface-raised` and `surface` | ≥ 4.5:1  |
| `focus` against all four surfaces and against `accent`           | ≥ 3:1    |
| `danger` apart from `accent-text`                                | ≥ 1.25:1 **or** ≥ 30° hue |

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
`rgba()`, measures every pair above, and exits non-zero on the first failure.
It also fails when a scheme leaves a colour token undefined or an accent leaves
one of its five undefined, so a new scheme cannot be half finished. Schemes and
accents are discovered from the stylesheets, so adding one automatically adds
it to the gate. Today: 3 schemes × 4 accents, 456 pairs.

This command is not wired into `package.json` yet; add it to `check` and to CI.

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
| `--border`        | `#26262c`        | `#dcdce2` | `#4a4a56` | decorative; in `contrast` ≈ 3:1 on `surface` |
| `--border-control`| `#62626d`        | `#85858f` | `#a9a9b5` | 3.20 / 3.33 / 8.45 (≥ 3)           |
| `--text`          | `#f2f2f3`        | `#18181b` | `#ffffff` | 16.26 / 14.77 / 17.85 (≥ 12)       |
| `--text-muted`    | `#9ca3af`        | `#4a4a54` | `#d5d9e1` | 7.17 / 7.30 / 12.61 (≥ 7)          |
| `--text-subtle`   | `#7d838f`        | `#66666f` | `#b0b6c2` | 4.78 / 4.74 / 8.77 (≥ 4.5)         |
| `--focus`         | `#ffffff`        | `#09090b` | `#ffffff` | 4.70 / 3.27 / 5.39 vs `accent` (≥ 3) |
| `--scrim`         | `rgba(0,0,0,.6)` | `rgba(9,9,11,.5)` | `rgba(0,0,0,.8)` | – |
| `--shadow-overlay`| `0 8px 24px rgba(0,0,0,.5)` | `0 8px 24px rgba(9,9,11,.18)` | `0 8px 24px rgba(0,0,0,.8)` | – |

### Status and Minecraft

| Token              | dark (reference)          | light     | contrast                  | measured on its own `-subtle` |
| ------------------ | ------------------------- | --------- | ------------------------- | ----------------------------- |
| `--success`        | `#4caf50`                 | `#166534` | `#7ce38b`                 | 5.53 / 6.20 / 7.84 (≥ 4.5)    |
| `--success-subtle` | `rgba(76,175,80,.12)`     | `#e4f3e7` | `rgba(124,227,139,.16)`   |                               |
| `--warning`        | `#f5a524`                 | `#8a5300` | `#ffc75c`                 | 7.24 / 5.63 / 7.99 (≥ 4.5)    |
| `--warning-subtle` | `rgba(245,165,36,.12)`    | `#fdf0dc` | `rgba(255,199,92,.16)`    |                               |
| `--danger`         | `#ff6b6b`                 | `#b8340f` | `#ffa08c`                 | 5.58 / 5.18 / 6.63 (≥ 4.5)    |
| `--danger-subtle`  | `rgba(255,107,107,.12)`   | `#fdece7` | `rgba(255,160,140,.16)`   |                               |
| `--info`           | `#6cb6ff`                 | `#17548f` | `#9ccdff`                 | 6.88 / 6.63 / 7.50 (≥ 4.5)    |
| `--info-subtle`    | `rgba(108,182,255,.12)`   | `#e4eefa` | `rgba(156,205,255,.16)`   |                               |
| `--mc-accent`      | `#5fb84e`                 | `#2f7d32` | `#78d964`                 | `on-mc` 6.42 / 5.12 / 9.99    |
| `--mc-accent-hover`| `#4ea03f`                 | `#276b2a` | `#63bd51`                 | `on-mc` 4.88 / 6.52 / 7.49    |
| `--on-mc`          | `#06280a`                 | `#ffffff` | `#031e06`                 |                               |
| `danger` vs `accent-text` |                    |           |                           | 1.32 / 1.34 / 1.39 (≥ 1.25)   |

In `light` the `-subtle` fills are opaque light tints, not the status colour at
10 % opacity: on a light ground a translucent tint darkens the badge and eats
exactly the contrast the word inside it needs.

### Accents

| Accent    | Scheme   | `--accent` | `--accent-hover` | `--on-accent` | `--accent-text` | `--accent-subtle`         | `on-accent` | `accent-text` on `surface` | `focus` vs `accent` |
| --------- | -------- | ---------- | ---------------- | ------------- | --------------- | ------------------------- | ----------- | -------------------------- | ------------------- |
| `rot`     | dark     | `#e11d48`  | `#be123c`        | `#ffffff`     | `#ff2d4f`       | `rgba(255,45,79,.1)`      | 4.70 / 6.29 | 5.27                       | 4.70                |
| `rot`     | light    | `#c2123f`  | `#9d0e33`        | `#ffffff`     | `#a11039`       | `#fbe7ec`                 | 6.08 / 8.25 | 7.22                       | 3.27                |
| `rot`     | contrast | `#d1163f`  | `#ab1033`        | `#ffffff`     | `#ff6b85`       | `rgba(255,107,133,.16)`   | 5.39 / 7.36 | 7.20                       | 5.39                |
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
status is always written out as a word as well.

## What is not covered

- The scheme is a per-document choice. Two schemes side by side on one page
  would need the tokens on a container instead of the root; the CSS already
  allows it (`[data-theme]` matches any element), the service writes to one
  target only.
- `prefers-contrast: more` is not wired to the `contrast` scheme. Do that in
  the application if you want it; the service only knows `prefers-color-scheme`.
- The values still need the design owner's approval, see the note at the top.
