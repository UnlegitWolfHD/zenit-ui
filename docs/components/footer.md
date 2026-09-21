# Footer

Closes every page: public with link columns, the customer area with the bottom row only.

## When to use

- Once at the bottom of every page, including the server panels. The legal links are mandatory
  everywhere.

## When not to use

- As a place for the slogan or a logo block. The footer holds links and the copyright.

## Import

```ts
import { ZFooter, ZFooterCol, ZFooterBase } from 'zenit-ui';
```

## API

### `z-footer`

| Input      | Type      | Default | Description                                                                                          |
| ---------- | --------- | ------- | ---------------------------------------------------------------------------------------------------- |
| `landmark` | `boolean` | `true`  | Whether the host is the `contentinfo` landmark. Pass `[landmark]="false"` for a preview inside `<main>`. |

No outputs. Content projection:

| Slot            | Where it lands                                        |
| --------------- | ----------------------------------------------------- |
| `z-footer-col`  | inside `<div class="z-footer__cols">`, the columns    |
| `[zFooterBase]` | inside `<div class="z-footer__base">`, the bottom row |

Content that matches neither slot is not rendered. Without columns the grid stays empty and
collapses, so the same element serves the public pages and the customer area.

### `z-footer-col`

| Input     | Type     | Default | Description                                                                                                         |
| --------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------- |
| `heading` | `string` | `''`    | Heading of the column, one word. Empty leaves the `<h2>` out, which keeps the heading outline free of empty levels. |

The content is the `<li>` elements; the component wraps them in a `<ul class="z-footer__list">`.

### `[zFooterBase]`

Pure slot marker for the bottom row: copyright on the left, the legal links on the right. It adds no
class and no markup.

## Examples

The public footer with three columns:

```html
<z-footer>
  <z-footer-col heading="Hosting">
    <li><a href="/minecraft">Minecraft</a></li>
    <li><a href="/gameserver">Alle Spiele</a></li>
    <li><a href="/preise">Preise</a></li>
  </z-footer-col>
  <z-footer-col heading="Unternehmen">
    <li><a href="/hardware">Hardware</a></li>
    <li><a href="/ueber-uns">Über uns</a></li>
  </z-footer-col>
  <z-footer-col heading="Hilfe">
    <li><a href="/wiki">Wiki</a></li>
    <li><a href="/discord">Discord</a></li>
  </z-footer-col>
  <div zFooterBase>
    <span>© 2026 Zenit-Hosting</span>
    <span>
      <a href="/impressum">Impressum</a>
      <a href="/datenschutz">Datenschutz</a>
      <a href="/agb">AGB</a>
      <a href="/widerruf">Widerruf</a>
    </span>
  </div>
</z-footer>
```

The customer area, with the bottom row only:

```html
<z-footer>
  <div zFooterBase>
    <span>© 2026 Zenit-Hosting</span>
    <span>
      <a href="/impressum">Impressum</a>
      <a href="/datenschutz">Datenschutz</a>
    </span>
  </div>
</z-footer>
```

## Width

`z-footer` brings no page width of its own. The reference markup is a bare `<footer class="z-footer">`
(`spec/components/Footer/preview.html`), and the width comes from the `.z-container` around it, the
same wrapper the header and `<main>` sit in:

```html
<div class="z-container">
  <z-footer>
    <span zFooterBase>© 2026 Zenit-Hosting</span>
  </z-footer>
</div>
```

That is how the example application builds its shell, and it is what makes the line above the footer
and the link columns start and end where the content of the page does.

`class="z-container"` directly on `<z-footer>` is not the same element. Measured in Chromium at 1440
and at 375: the content box lands in the same place both ways, but the border box of the footer is
then the full container width, so its `border-top` runs 24px (16px below 640px) further out on each
side and no longer aligns with the content above it. Use the wrapper.

`z-app-header` is deliberately different: it carries its own inline padding and works as a full-width
bar without a wrapper. Putting it in a `.z-container` as well is a decision about the page, not about
the component: the example application does it so that brand, page title and copyright stand on one
line at every width.

## States

| State | How it looks                        | How to trigger it     |
| ----- | ----------------------------------- | --------------------- |
| Rest  | links in `text-muted` on `bg`       | default               |
| Hover | link moves to `text`, no underline  | pointer over a link   |
| Focus | 2px ring in `focus` with 2px offset | Tab, `:focus-visible` |

There is no active, disabled, loading, error or empty state. Red is not used in the footer at all.

## Accessibility

- The host carries `role="contentinfo"`, so the footer is the contentinfo landmark of the page. A
  page has one of them, and it sits outside `<main>`: a preview of the footer inside the content
  passes `[landmark]="false"`.
- Each column heading is an `<h2>`, so the footer takes part in the heading outline. Leave `heading`
  empty rather than rendering an empty level.
- The links sit in a real `<ul>`, so their number is announced.
- The legal links are on every page, including the panels.

## Responsive

The columns are an `auto-fit` grid from 160px, so they reflow by themselves and end up stacked on a
phone. The bottom row is a flex line that wraps. Below 640px every footer link gets a 40px minimum
height.

## Rendered classes and tokens

| Class            | Applies when                            |
| ---------------- | --------------------------------------- |
| `z-footer`       | on the host, always                     |
| `z-footer__cols` | always, empty when there are no columns |
| `z-footer__head` | `heading` of a column is not empty      |
| `z-footer__list` | on each column's `<ul>`                 |
| `z-footer__base` | always                                  |

Tokens: `--border` for the line above and above the bottom row, `--space-3` to `--space-7` for the
gaps and the padding, `--text-subtle` for the column headings and the bottom row, `--text-muted`
and `--text` for the links, `--control-md` for the mobile click target.

## Deviations from the reference

New, because the reference stylesheet does not cover it: in the customer area the footer has no
columns. The empty grid collapses, and the gap above the bottom row falls away with it, so the same
element serves both layouts.

Addition to the reference: below 640px the links in the columns and in the bottom row get a 40px
minimum height, because click targets are at least 40px tall on mobile. The bottom row stays a
wrapping flex line.

## Do / Don't

- Do keep the legal links on every page, panels included.
- Do use one word per column heading, at most four columns.
- Do write Discord as a text link.
- Don't repeat the slogan or add a logo block.
- Don't use red in the footer.
- Don't write "Alle Rechte vorbehalten"; the copyright line is enough.
