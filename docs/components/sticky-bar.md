# StickyBar

Keeps price and next step in view at the bottom edge of small screens.

## When to use

- Under 900px in a configurator, where the summary has moved below the form.
- For a bulk action in a list ("2 ausgewählt"), at every width.

## When not to use

- Above 900px in a configurator. There `z-price-summary` sticks next to the form; set `mobileOnly`
  and the bar steps aside by itself.
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

The bar covers the bottom of the viewport, so a control focused behind it would be invisible
(WCAG 2.4.11). It measures itself into the custom property `--z-stickybar` on the document, and the
stylesheet turns that into `scroll-padding-bottom` and into room below the content, so the browser
scrolls a focused element clear of the bar instead of behind it. The height is therefore nowhere a
literal.

Otherwise the bar is a plain container; the button inside is an ordinary tab stop and the last
element of the page in reading order. It casts no shadow and no blur, so nothing about it is only a visual layer.
Since it overlaps the page while scrolling, it stays one row tall.

## Responsive

`mobileOnly` hides it from 900px on, which is where `z-price-summary` sticks next to the form. The
bottom padding grows by `env(safe-area-inset-bottom)` on a device that reports an inset.

## Rendered classes and tokens

| Class                  | Applies when          |
| ---------------------- | --------------------- |
| `z-stickybar`          | always (host)         |
| `z-stickybar--mobile`  | with `mobileOnly`     |
| `z-stickybar__price`   | price and summary     |

Tokens: `--surface-raised` for the fill, `--border` for the 1px line, `--text-muted` for the
summary, `--font-mono` for the amount, `--z-header` for the stacking, `--space-3` and `--space-4`
for the padding. The 20px price type is a literal value from the reference stylesheet.

## Deviations from the reference

- Addition to the reference: the bottom padding grows by `env(safe-area-inset-bottom, 0px)`, which
  the StickyBar README asks for and `bundle.css` does not carry.
- Addition to the reference: below 900px a page that holds a `z-stickybar--mobile` gets
  `scroll-padding-bottom` and the `z-config` above the bar gets a matching bottom padding, both
  from the measured `--z-stickybar`, so no tab stop ends up behind the bar.

## Do / Don't

- Do let the bar and the summary trigger the same action when both are visible.
- Do keep the summary to a few words; it is one line and does not wrap.
- Do set `mobileOnly` in a configurator.
- Don't give the bar a shadow, a blur or a second button.
- Don't make it the only place the price appears.
