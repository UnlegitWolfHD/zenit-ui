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
which is what a page has without the library. `1rem` is the size the visitor chose, because
`html.z-root` leaves the rem base alone.

**Family, colour, background and `color-scheme` are not reset.** The library cannot know what your
old `body` rule said, and text in the shell's family and colour on the shell's ground is the
readable fallback when you restate nothing. `body.z-root` (0,1,1) beats your old `body { … }`
(0,0,1), so say it again on the content host:

```css
/* what the old body rule said */
#main-content {
  font-family: Roboto, 'Helvetica Neue', sans-serif;
  color: #1f2328;
  background: #fafafa;
  color-scheme: normal; /* the library sets dark on :root; native controls follow it */
}
```

Leave out what your old pages never set. There are no custom properties for this: they would be a
second way to write the same declarations.

**Base rules stop at `.z-legacy`.** Every rule of the library that styles an element without a
library class is exempt inside the subtree:

| Rule in `_grundlage.css`                                         | Sets                       | Inside `.z-legacy` |
| ---------------------------------------------------------------- | -------------------------- | ------------------ |
| `.z-root *`                                                      | `box-sizing: border-box`   | exempt             |
| `.z-root :where(button, input, select, textarea)`                | `font`, `color` inherit    | exempt             |
| `.z-root :where(a)`, `.z-root :where(a):hover`                   | link colour, underline     | exempt             |
| `.z-root :where(p, li, dd, label, …) a:not([class*="z-"])`       | underline in running text  | exempt             |
| `.z-root :focus-visible`                                         | 2px ring in `focus`        | exempt, see below  |
| `.z-root`, `html.z-root`, `body.z-root`                          | match the class, not a tag | unchanged          |
| `:where(:root) { color-scheme: dark }`, `.z-root:has(.z-stickybar[data-stuck])` | document level | unchanged |
| every class rule (`.z-btn`, `.z-alert`, …)                       |                            | unchanged          |

The other partials contain class rules only. The library has no base rules for headings, lists,
`::selection` or scrollbars.

The exclusion is `:not(:where(.z-legacy :not(.z-legacy .z-root, .z-legacy .z-root *)))` on each of
those selectors. It weighs (0,0,0), so every specificity documented in the README still holds.

Measured on `/muster/legacy` of the demo (`e2e/legacy.spec.ts`): an old page with its own `h1`, `h2`,
`h3`, `p`, `a`, `button` and `input` rules at (0,0,1) computes to exactly the same 33 properties per
element, at rest, hovered and focused, as the same stylesheet and markup in a document without
`zenit-ui`, in `dark`, `light` and `contrast`. A `z-root` container inside the subtree computes to
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
  is Arial 13.33px instead of Inter 14px.
- `button[zBtn]` renders in Arial. `a[zBtn]` is 42px tall instead of 40px.
- A panel is 2px wider and taller. Text inside panel, alert, field and checkbox label is 16px with a
  normal line height instead of 14px/20px.
- A plain link inside a component takes your old link colour, not `accent-text`.
- The focus ring is the browser's.
- The tokens are still the shell's. On an old page with its own surface they do not fit: the body of
  a warning alert in the dark scheme is `text-muted` on a tint over your light ground and fails
  4.5:1. The `z-root` wrapper brings `bg` and `text` along.

Badge, icon and spinner showed no visible difference. That is an observation, not a promise.

## Overlays and toasts

Dialog, menu and tooltip render in the CDK overlay container under `body.z-root`, outside
`.z-legacy`, whatever opened them. Measured: each of the three computes to the same styles when
opened from an old `<button>` inside the subtree as when opened from a migrated page. Keep
`<z-toast-outlet />` in the shell, outside the content host; a toast raised from an old page then
looks the same as well.

## Limits

- One level of re-entry. A `.z-legacy` inside a `z-root` inside a `.z-legacy` counts as migrated.
  Matching the nearest ancestor needs `@scope`, which Firefox before 146 and Safari before 17.4 do
  not have; both are inside the browser range Angular 22 builds for, and they would drop the base
  rules altogether.
- Your old global rules still reach migrated pages. `button { background: #fff }` at (0,0,1) loses
  against `.z-btn`, but it does style a `<button>` without a library class inside a `z-root`
  container.
- `.z-legacy` on the same element as `z-root` is not supported.

## Keeping an existing theme setting

An application that already stores the visitor's colour scheme can keep doing so and only hand the
result to the library. Run the theme without a storage of its own, write the attributes with your own
inline script before the first paint, and call the service from your preference code:

```ts
provideZenitTheme({ storageKey: null, schemes: ['dark', 'light'], accents: ['rot', 'blau'] });
```

```html
<script>
  // your own storage, your own key
  var t = localStorage.getItem('app-theme');
  if (t) document.documentElement.setAttribute('data-theme', t);
</script>
```

With `storageKey: null` `ZTheme` never touches `localStorage`, and it starts from the attributes
that are already on `<html>` (or on the `target`): a registered `data-theme` becomes `scheme()`, a
registered `data-accent` becomes `accent()`, and nothing is rewritten to the defaults in between, so
there is no flash. An id that is not registered is replaced by the default. An attribute only ever
carries a resolved scheme, so one that equals what `defaultScheme` resolves to is not taken as a
choice: with `defaultScheme: 'system'` and `data-theme="light"` on a light system, `scheme()` stays
`'system'` and keeps following the operating system. If your stored preference is "system", call
`setScheme('system')` from your service; it resolves to the same value. With a storage key set, the
stored choice and the defaults win over a pre-set attribute, as before. On the server nothing
changes: a fixed `defaultScheme` is written into the document, and the browser keeps it unless your
script replaced it.
