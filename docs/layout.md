# Layout and utility classes

The classes a page sets by hand. Everything else in the bundled CSS is rendered by a component and
is not part of the contract. Every class here lives in
`projects/zenit-ui/src/styles/_grundlage.css`; the table below is what
`tools/generate-llms.mjs` prints into `llms-full.txt`, so a description written here is the one a
model reads.

| Class | What it does |
| --- | --- |
| `z-root` | On `<html>` and on `<body>`. Background, text colour, fonts, `font: inherit` for controls, focus ring. |
| `z-container` | Centres content at `--container` (1120px) with the page gutter, `--space-4` below 640px and `--space-5` above. |
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

## What these classes do not do

- `z-stack` and `z-cluster` set a `gap`; they never set a margin. Siblings that need space go into
  one of them, not into a margin of their own.
- `z-container` sets `max-width` and the gutter, nothing else. It is not a landmark and carries no
  background.
- `z-panel-shell` is the two-column frame of a server panel. The sidebar inside it is `z-sidebar`,
  which brings its own width; the class only decides when the two columns exist.
