# Layout and utility classes

The classes a page sets by hand. Everything else in the bundled CSS is rendered by a component and
is not part of the contract. Every class here lives in
`projects/zenit-ui/src/styles/_grundlage.css`; the table below is what
`tools/generate-llms.mjs` prints into `llms-full.txt`, so a description written here is the one a
model reads.

| Class | What it does |
| --- | --- |
| `z-root` | On `<html>` and on `<body>`. Background, text colour, fonts, `font: inherit` for controls, focus ring. |
| `z-container` | Centres content at `--container` with the page gutter, `--space-4` below 640px and `--space-5` above. The default is 1120px and the page width is an application setting: override `--container` on `:root`, see "Page width". |
| `z-stack` | Grid with `--space-5` between its children. The vertical rhythm of a page. |
| `z-cluster` | Flex row that wraps, `--space-2` gap, items centred. Buttons and badges side by side. |
| `z-section` | A section of a public page: `--space-8` vertical padding, `--space-9` from 900px up, plus the 1px separating line on top. |
| `z-panel-shell` | Sidebar plus content from 900px up (`--sidebar` and the rest), one column below, `--space-5` gap. |
| `z-mono` | JetBrains Mono with `tabular-nums`: prices, figures, IPs, ports, file names, log lines. |
| `z-muted` | Text in `--text-muted`: descriptions and icons. |
| `z-subtle` | Text in `--text-subtle`: timestamps and placeholders. |
| `z-visually-hidden` | Out of sight, still read by a screen reader, and it stays hidden on focus. For live regions and for a label a sighted reader gets from the layout. Not for a skip link: use `a[zSkipLink]`, which is the same technique plus a `:focus` rule that unfolds the link. |
| `z-field__error` | The error sentence next to a control that sits outside a `z-field` (checkbox, toggle). |
| `z-theme-mc` | Minecraft subtheme on a page container: the primary button turns green. |

## The page shell

Header, `<main>` and footer each get the page width from their own `.z-container`. `z-app-header`
and `z-footer` centre nothing themselves: they run the full width of whatever contains them, so
without the container the brand sits at the left edge of the window while the content above it is
centred. The skip link is the first element in the body, before the header, and points at the
`<main>`, which carries `tabindex="-1"` so the focus can land there.

```html
<a zSkipLink href="#inhalt">Zum Hauptinhalt springen</a>

<div class="z-container">
  <z-app-header navLabel="Hauptnavigation">…</z-app-header>
</div>

<main id="inhalt" tabindex="-1" class="z-container">
  <router-outlet />
</main>

<div class="z-container">
  <z-footer>…</z-footer>
</div>

<z-toast-outlet />
```

## Page width

`--container` is the page width of the **application**, not a fixed value of the design system.
1120px is the default that `tokens.css` ships; a product that wants a wider page overrides the
property once and every `.z-container` on every page follows. How to write that override, and why
it is a stylesheet declaration and not an option of `provideZenitTheme`, is in
[`docs/theming.md`](theming.md#page-width).

```css
/* the application's own stylesheet, after zenit-ui.css */
:root {
  --container: 1440px;
}
```

Not everything grows with the page, and that is on purpose. Measured at 1120, 1280, 1440 and
1600px over every demo page: nothing breaks, nothing hits a second `max-width`, and there is no
horizontal scrolling at any of them.

| Grows with `--container` | Keeps a width of its own | Why |
| --- | --- | --- |
| `z-container`, `z-section`, `z-stack` | — | the page frame itself |
| `z-panel`, `z-rows`/`[zRow]`, `table[zTable]`, `z-table-container` | — | data fills the room it gets; a row track is `fr`, a cell ellipsises |
| `z-metrics`, `z-game-grid`, `z-option-group`, `.z-footer__cols` | — | `auto-fit`/`auto-fill` grids: wider page, more columns |
| `z-hero` (7fr/5fr), `z-panel-shell` content, `z-config` content | — | proportional tracks |
| — | `z-sidebar`/`.z-side`: `--sidebar` (240px) | a navigation column is read, not filled |
| — | `[zConfigAside]`: 340px from 900px up | the price column of a configurator is a fixed strip next to the form |
| — | the lead of `z-hero` (52ch), the answer of `z-faq` (`--measure`), the text of `z-empty-state` (40ch) | running text stays readable; `--measure` is the rule, not `--container` |
| — | `z-dialog` (480px), `z-menu` (200px), `z-toast-outlet` (420px), `[zTooltip]` (240px) | overlays are sized to their content, not to the page |
| — | `z-field` and every control in it | a form column is as wide as its caller makes it |

`--container` is an inherited custom property, so a single section can carry a width of its own
(`<section style="--container: 1440px">` around one `.z-container`) without touching the rest of
the page. `--measure` is independent of it and is not scaled along.

## What these classes do not do

- `z-stack` and `z-cluster` set a `gap`; they never set a margin. Siblings that need space go into
  one of them, not into a margin of their own.
- `z-container` sets `max-width` and the gutter, nothing else. It is not a landmark and carries no
  background.
- `z-panel-shell` is the two-column frame of a server panel. The sidebar inside it is `z-sidebar`,
  which brings its own width; the class only decides when the two columns exist.
