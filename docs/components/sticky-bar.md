# StickyBar

Keeps price and next step in view at the bottom edge of small screens.

## When to use

- Under 900px in a configurator, where the summary has moved below the form.
- For a bulk action in a list ("2 ausgewählt"), at every width.

## When not to use

- Above 900px in a configurator. There `z-price-summary` sticks next to the form in the
  `[zConfigAside]` column ([Config](config.md)); set `mobileOnly` and the bar steps aside by itself.
- For more than one action. The bar carries exactly one button.

## Import

```ts
import { ZStickyBar } from 'zenit-ui';
```

## API

Selector: `z-sticky-bar`

| Input        | Type      | Default | Description                                                         |
| ------------ | --------- | ------- | ------------------------------------------------------------------- |
| `price`      | `string`  | `''`    | The amount, already formatted by the caller. Shown in `mono-lg`.    |
| `summary`    | `string`  | `''`    | The selection in a few words, in a `<small>`. Empty renders nothing. |
| `mobileOnly` | `boolean` | `false` | Hides the bar from 900px on. Boolean attribute.                     |

Slot: the content is the one button.

## Examples

In the configurator, with the button of the current step:

```html
<z-sticky-bar price="7,74 €" summary="Minecraft, 4 GB, alle 30 Tage" mobileOnly>
  <button zBtn="secondary" type="button" (click)="geheZu(schritt() + 1)">Weiter</button>
</z-sticky-bar>
```

In the last step the same bar carries the order button, and both trigger the same thing:

```html
<z-sticky-bar [price]="preisText()" [summary]="kurzAlles()" mobileOnly>
  <button zBtn="secondary" type="button" [disabled]="!bestellbar()" (click)="bestellen()">
    Kostenpflichtig bestellen
  </button>
</z-sticky-bar>
```

As a bulk action bar in a list, at every width:

```html
<z-sticky-bar price="2 ausgewählt" summary="world.zip, plugins.zip">
  <button zBtn="secondary" type="button">Herunterladen</button>
</z-sticky-bar>
```

## States

| State  | How it looks                                                        | How to trigger it  |
| ------ | ------------------------------------------------------------------- | ------------------ |
| Rest   | `surface-raised`, 1px `border` above, sticks at `bottom: 0`         | default            |
| Hidden | `display: none` from 900px on                                       | `mobileOnly`       |

The bar itself has no loading, error or disabled state. The button inside carries those.

## Accessibility

A bar that lies at the bottom edge of the viewport covers what is behind it, so a control focused
there would be invisible (WCAG 2.4.11). Each bar measures itself: while it really sticks to that
edge and is displayed, it carries the attribute `data-stuck`, and the tallest stuck bar writes its
height into the custom property `--z-stickybar` on the document. The stylesheet turns that into
`scroll-padding-bottom` for a page that holds a stuck bar, so the browser scrolls a focused element
clear of the bar instead of behind it. The height is therefore nowhere a literal.

Sticking is measured, not assumed: `getBoundingClientRect().bottom` has to meet the height of the
viewport, and a hidden bar measures 0 everywhere. One passive `scroll` and `resize` listener per
document and a `ResizeObserver` on the bar and on the document keep the measurement current; on the
server, where there is no layout to keep clear, none of it runs. A bar that stands in the page
instead of at its edge covers nothing and costs the page no padding: a framed bar in a gallery, a
bar above the fold, and a `mobileOnly` bar from 900px on, which is `display: none` there.

Otherwise the bar is a plain container; the button inside is an ordinary tab stop and the last
element of the page in reading order. It casts no shadow and no blur, so nothing about it is only a visual layer.
Since it overlaps the page while scrolling, it stays one row tall.

## Responsive

`mobileOnly` hides it from 900px on, which is where `z-price-summary` sticks next to the form in
the `[zConfigAside]` column of [Config](config.md). The bottom padding grows by
`env(safe-area-inset-bottom)` on a device that reports an inset.

## Rendered classes and tokens

| Class                  | Applies when          |
| ---------------------- | --------------------- |
| `z-stickybar`          | always (host)         |
| `z-stickybar--mobile`  | with `mobileOnly`     |
| `z-stickybar__price`   | price and summary     |
| `[data-stuck]`         | while it lies at the bottom edge of the viewport (host attribute) |

Tokens: `--surface-raised` for the fill, `--border` for the 1px line, `--text-muted` for the
summary, `--font-mono` for the amount, `--z-header` for the stacking, `--space-3` and `--space-4`
for the padding. The 20px price type is a literal value from the reference stylesheet.

## Deviations from the reference

- Addition to the reference: the bottom padding grows by `env(safe-area-inset-bottom, 0px)`, which
  the StickyBar README asks for and `bundle.css` does not carry.
- Addition to the reference: a page that holds a bar with `data-stuck` gets
  `scroll-padding-bottom` from the measured `--z-stickybar`, so no tab stop ends up behind the bar.
  It needs no extra room at the end of the page: the bar is sticky inside the flow and already
  occupies its own height there.

## Do / Don't

- Do let the bar and the summary trigger the same action when both are visible.
- Do keep the summary to a few words; it is one line and does not wrap.
- Do set `mobileOnly` in a configurator.
- Don't give the bar a shadow, a blur or a second button.
- Don't make it the only place the price appears.
