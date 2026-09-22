# `.z-legacy`: pages that are not migrated yet

An application that moves to `zenit-ui` route by route has old and new pages inside the same shell
for a while. `z-root` sits on `<html>` and `<body>`, because the shell is migrated first and the CDK
overlay container hangs on `<body>`. From that moment `body.z-root` hands `14px/20px` down to every
old page, and the library's base rules for bare `a`, `button`, `input`, `select`, `textarea` and
`:focus-visible` reach into them.

The absolute line height is what breaks old pages: a legacy `h2` of 27.2px that carries no line
height of its own inherits 20px and overlaps itself as soon as it wraps.

`.z-legacy` marks the subtree that is not migrated yet and keeps the library out of it.

## Structure

```html
<html class="z-root">
  <body class="z-root">
    <app-shell>
      <!-- header, footer, toast outlet: migrated, styled by the library -->
      <main id="main-content" class="z-legacy">
        <router-outlet />
      </main>
    </app-shell>
  </body>
</html>
```

A migrated page puts `z-root` on its own container again, which switches everything back on:

```html
<!-- template of a migrated route -->
<div class="z-root">
  <z-page-header title="Rechnungen" />
  …
</div>
```

When the last route is migrated, remove `.z-legacy` from the content host and the `z-root` classes
from the page containers. Nothing else refers to them.

Stylesheet order stays as documented in the package README: `tokens.css`, the CDK overlay
stylesheet, `zenit-ui.css`, then your own stylesheet. What rules of yours such as `.app a` do inside
library components is described there as well, under
["Documented deviations from the reference styles"](../projects/zenit-ui/README.md#documented-deviations-from-the-reference-styles);
`.z-legacy` does not change that, it only concerns the other direction.

## What the class does

**Inherited values.** `font-size: 1rem`, `line-height: normal` and `-webkit-font-smoothing: auto`,
which is what a page has without the library. `1rem` is the size the visitor chose, because the
library sets no `font-size` on `<html>` at all, and the size your own `html { font-size: … }` names
when you have one.

**Family, colour, background and `color-scheme` are not reset.** The library cannot know what your
old `body` rule said, and text in the shell's family and colour on the shell's ground is the
readable fallback when you restate nothing. The page rule of the library is `.z-root` (0,1,0). It
beats an old `body { … }` (0,0,1), so say that again on the content host:

```css
/* what the old body rule said */
#main-content {
  font-family: Roboto, 'Helvetica Neue', sans-serif;
  color: #1f2328;
  background: #fafafa;
  color-scheme: normal; /* the library sets dark on :root; native controls follow it */
}
```

Leave out family, colour and background where your old pages never set them. **`color-scheme` is
the one declaration a light old page always restates**, whether it ever set one or not: the library
puts `dark` on `:root`, and everything the old page leaves to the browser follows it. Measured on a
light host (`#fafafa`) without the line: an unstyled link is `rgb(158, 158, 255)`, 2.29:1, and
`input` and `select` are white text on `rgb(59, 59, 59)`. With `color-scheme: normal` they are
the blue link and the black-on-white fields the page had before. A dark old page that sits on the
shell's ground leaves the line out.

There are no custom properties for any of this: they would be a second way to write the same
declarations.

**A class on `<body>` is a different case.** `.z-root` does not beat it, it ties with it at (0,1,0),
and your stylesheet is loaded after `zenit-ui.css`, so your class wins for every property it sets.
Material's `mat-typography` on `<body>` is the usual one. Measured with a stand-in class that sets
`font`, `letter-spacing` and `color`: on `<body>` it turned the text of the shell and the face of
every `button[zBtn]` into the old typography, and the old page still lost its size and line height
to the `.z-legacy` reset. **Move that class from `<body>` to the content host.** There it does the
restating for you: the shell computed to the library's Inter 14px/20px again, and the old page to
exactly the old 15px/22px, because on the host your class ties with `.z-legacy` and comes later.

**Base rules stop at `.z-legacy`.** Every rule of the library that styles an element without a
library class is exempt for the host element and for everything inside it. The host counts as part
of the old page: an old `main { width: 600px; padding: 0 24px }` is 648px wide without the library
and stays 648px.

| Rule in `_grundlage.css`                                         | Sets                       | Inside `.z-legacy` |
| ---------------------------------------------------------------- | -------------------------- | ------------------ |
| `.z-root *`                                                      | `box-sizing: border-box`   | exempt             |
| `.z-root :where(button, input, select, textarea)`                | `font`, `color` inherit    | exempt             |
| `.z-root :where(a)`, `.z-root :where(a):hover`                   | link colour, underline     | exempt             |
| `.z-root :where(p, li, dd, label, …) a:not([class*="z-"])`       | underline in running text  | exempt             |
| `.z-root :where(.z-alert__body a)`                               | link colour `text` in an alert | exempt         |
| `.z-root :focus-visible`                                         | 2px ring in `focus`        | exempt, see below  |
| `.z-root`, `.z-root:where(:not(html))`, `html.z-root`, `body.z-root` | match the class, not a tag | unchanged      |
| `:where(:root) { color-scheme: dark }`, `.z-root:has(.z-stickybar[data-stuck])` | document level | unchanged |
| every class rule (`.z-btn`, `.z-alert`, …)                       |                            | unchanged          |

The other partials contain class rules only. The library has no base rules for headings, lists,
`::selection` or scrollbars.

Each of those rules is written as two selectors, `.z-root X:not(:where(.z-legacy, .z-legacy *))` and
`:where(.z-legacy) .z-root X`. Both `:where()` weigh (0,0,0), so every specificity documented in the
README still holds. The price is on the universal rule: a forced full style recalculation of a page
with 4130 elements takes 4.9ms instead of 4.2ms (+14 to +18 %, production build, median of 40
rounds); the numbers are in the comment above `.z-legacy` in `_grundlage.css`.

Measured on `/muster/legacy` of the demo (`e2e/legacy.spec.ts`): an old page with its own `h1`, `h2`,
`h3`, `p`, `a`, `button` and `input` rules at (0,0,1) computes to exactly the same 33 properties per
element, at rest, hovered and focused, as the same stylesheet and markup in a document without
`zenit-ui`, in `dark`, `light` and `contrast`. The host, 18rem wide with 1rem of padding, is the
same 320px `content-box` in both. A `z-root` container inside the subtree computes to
the same values as a normally embedded migrated page, element by element, focus ring included.

### The focus ring

`--focus` is white in the dark scheme, and `outline` from the library **replaces** the two-tone ring
the browser draws by default. On the light surface of the old page in the demo that is 1.04:1 where
the browser's own ring was visible. Inside `.z-legacy` an old page therefore keeps whatever focus
indication it had. If your old pages sit on the shell's ground and you want the ring there, it is
one line:

```css
.z-legacy :focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}
```

The other way round would not be possible: `outline: revert` rolls back to the browser's
stylesheet, not to your own rule.

## A library component inside `.z-legacy`

Put a `z-root` around it:

```html
<div class="z-root">
  <z-alert status="warning" title="Wartung am 28.09.2026" icon="warning">
    Von 02:00 bis 02:15 Uhr ist der Kundenbereich nicht erreichbar.
  </z-alert>
</div>
```

Without it the component keeps its class rules (layout, surfaces, radii, its own colours, the icon
size) and loses the base rules. Measured against the same markup on a migrated page:

- `input[zInput]` is `content-box`: 326×42px inside a 300px field instead of 300×40px, and its text
  is in the browser's control font at the size the old page gives an `input`, Arial 13.33px by
  default, instead of Inter 14px.
- `button[zBtn]` renders in Arial. `a[zBtn]` is 42px tall instead of 40px.
- A panel is 2px wider and taller. Text inside panel, alert, field and checkbox label is 16px with a
  normal line height instead of 14px/20px.
- A plain link inside a component takes your old link colour, not `accent-text`.
- `z-spinner` is 20×20px instead of 16×16px: its 2px border is added to the 16px under
  `content-box`.
- The focus ring is the browser's.
- The tokens are still the shell's. On an old page with its own surface they do not fit: the body of
  a warning alert in the dark scheme is `text-muted` on a tint over your light ground and fails
  4.5:1. The `z-root` wrapper brings `bg` and `text` along.

Badge and icon showed no visible difference. That is an observation, not a promise.

## Overlays and toasts

Dialog, menu and tooltip render in the CDK overlay container under `body.z-root`, outside
`.z-legacy`, whatever opened them. Measured: each of the three computes to the same styles when
opened from an old `<button>` inside the subtree as when opened from a migrated page. Keep
`<z-toast-outlet />` in the shell, outside the content host; a toast raised from an old page then
looks the same as well.

## Limits

- **Never on `<body>`.** The CDK overlay container hangs on `<body>`; with `.z-legacy` there every
  dialog, menu and tooltip would be part of the old page. The class belongs on the content host.
- One level of re-entry. A `.z-legacy` inside a `z-root` inside a `.z-legacy` counts as migrated:
  the base rules apply there (`border-box`, controls inherit the font), but the inherited values are
  those of the inner `.z-legacy`, 16px and a normal line height, not the 14px/20px of a page.
  Matching the nearest ancestor needs `@scope`, which Firefox before 146 and Safari before 17.4 do
  not have; both are inside the browser range Angular 22 builds for, and they would drop the base
  rules altogether.
- Your old global rules still reach migrated pages. `button { background: #fff }` at (0,0,1) loses
  against `.z-btn`, but it does style a `<button>` without a library class inside a `z-root`
  container.
- `.z-legacy` on the same element as `z-root` is not supported. What it does, measured: inside an
  island such an element behaves like the second level above, base rules on and 16px/normal
  inherited; outside any island it is a plain `.z-legacy` host in the shell's colours.

## Keeping an existing theme setting

An application that already stores the visitor's colour scheme keeps its storage and hands the
result to the library: see ["Keeping your own preference storage"](theming.md#keeping-your-own-preference-storage)
in `docs/theming.md`.
