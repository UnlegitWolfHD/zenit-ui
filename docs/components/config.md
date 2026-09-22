# Config

The two-column frame of a configurator: the form on the left, the summary on the right.

## When to use

- On a page where a visitor puts something together and the price follows along: the price
  calculator, the order assistant.
- Wherever the summary has to stay in view while the form is scrolled.

## When not to use

- For a page that only reads. Two columns of running text are not a configurator; use
  `z-container` and `z-stack`.
- For the customer area, where a page is `z-page-header` plus panels.
- As a general grid. `z-config` has one shape on purpose: content, then a 340px strip.

## Import

```ts
import { ZConfig, ZConfigAside } from 'zenit-ui';
```

## API

Selectors: `z-config`, `[zConfigAside]`

Neither takes an input and neither has an output. The whole component is the layout.

| Slot             | Where it lands                                                     |
| ---------------- | ------------------------------------------------------------------ |
| default content  | the left column, in the order it is written                        |
| `[zConfigAside]` | the right column, sticky from 900px on                              |

`z-config` projects everything; the element carrying `zConfigAside` is the one the grid puts into
the second track, and it takes the class `z-config__aside`. One aside per configurator: a second
one would land in the same track and scroll away with the first.

The aside is normally a `div` with `z-stack` holding `z-price-summary` and, below it,
`z-included-list`. The one primary button of the page is the projected content of
`z-price-summary`, not a button of its own next to it.

## Examples

The price calculator, the way `/muster/preisrechner` builds it: game tiles and option groups on
the left, price summary and the list of what is included on the right, and a `z-sticky-bar` that
repeats price and action below 900px, where the aside has moved under the form.

```html
<z-config>
  <div class="z-stack">
    <z-game-grid>
      <button zGameTile type="button" title="Minecraft" price="ab 1,98 € / Monat"></button>
    </z-game-grid>

    <z-option-group legend="Leistungsklasse" [options]="klassen" [(value)]="klasse" />
    <z-option-group legend="Arbeitsspeicher" compact [options]="ramOptionen" [(value)]="ramGb" />
    <z-option-group legend="Abrechnung" [options]="abrechnungen" [(value)]="abrechnung" />
  </div>

  <div zConfigAside class="z-stack">
    <z-price-summary
      label="Minecraft, alle 30 Tage"
      price="7,74 €"
      period="/ 30 Tage"
      [lines]="posten"
      note="Grundbetrag des Spiels plus Leistungsklasse je GB."
    >
      <button zBtn="primary" block type="button">Server erstellen</button>
    </z-price-summary>
    <z-included-list [items]="enthalten" />
  </div>
</z-config>

<z-sticky-bar price="7,74 €" summary="Minecraft, 4 GB, alle 30 Tage" mobileOnly>
  <button zBtn="secondary" type="button">Server erstellen</button>
</z-sticky-bar>
```

The order assistant uses the same frame with a `z-wizard` in the left column, so the summary stands
next to the steps instead of under them:

```html
<z-config>
  <z-wizard>
    <z-wizard-step title="Inhalt" summary="Vanilla, neueste Version" state="done">
      <z-option-group legend="Server-Typ" [options]="typen" [(value)]="typ" />
    </z-wizard-step>
    <z-wizard-step title="Größe" state="current">
      <z-option-group legend="Arbeitsspeicher" compact [options]="stufen" [(value)]="ramGb" />
    </z-wizard-step>
  </z-wizard>

  <div zConfigAside>
    <z-price-summary label="Minecraft, alle 30 Tage" price="7,74 €" [lines]="posten">
      <button zBtn="primary" block type="button">Kostenpflichtig bestellen</button>
    </z-price-summary>
  </div>
</z-config>
```

The aside is an element of your own, so it can carry anything the page needs, for example the
loading state of the summary while the price service answers:

```html
<z-config>
  <z-wizard>…</z-wizard>
  <div zConfigAside class="z-stack">
    <z-price-summary label="Minecraft, alle 30 Tage" loading />
    <z-included-list [items]="enthalten" />
  </div>
</z-config>
```

## States

`z-config` and `[zConfigAside]` are pure layout: rest only, at two widths. They have no hover,
focus, disabled, loading, error or empty state. Everything that can be in a state sits inside them:
the option groups, `z-price-summary` with its loading and error states, and the buttons.

| State        | How it looks                                                                | How to trigger it |
| ------------ | --------------------------------------------------------------------------- | ----------------- |
| One column   | form first, aside below it, `space-5` between them                          | below 900px       |
| Two columns  | `minmax(0, 1fr) 340px`, aside sticky at `header + space-5`, tracks top-aligned | from 900px on   |

## Accessibility

- Neither element is a landmark and neither carries a role. The page keeps its own `<main>`, and
  the form inside the left column is what a screen reader navigates.
- The DOM order is the reading order: the form comes before the aside in the markup, in both
  layouts. Below 900px that is also the visual order, so nothing has to be reordered visually and
  no tab order is reversed.
- The aside sticks; it never becomes `position: fixed`, so it is part of the page flow and does not
  cover a focused control. A control that would be covered at the bottom edge belongs on
  `z-sticky-bar`, which measures itself and keeps the page's scroll padding clear.
- The one primary button of the page lives in the aside, as the projected content of
  `z-price-summary`. The `z-sticky-bar` below 900px repeats that action as a `secondary`, so a
  screen height never holds two primaries.

## Responsive

One column below 900px with `space-5` between form and aside; `minmax(0, 1fr) 340px` from 900px on,
where the aside gets `position: sticky` at `top: calc(var(--header) + var(--space-5))`. The tracks
are `align-items: start`, so the aside is as tall as its content and can stick inside a much taller
form. The 340px strip does not grow with `--container`: a wider page gives its room to the form,
because the price column is read, not filled.

## Rendered classes and tokens

| Class             | Applies when                        |
| ----------------- | ----------------------------------- |
| `z-config`        | always (host of `z-config`)         |
| `z-config__aside` | on the `[zConfigAside]` element     |

Tokens: `--space-5` for the gap and for the sticky offset, `--header` for the offset the header
takes. The 340px track and the 900px breakpoint are literal values from the reference stylesheet.

## Deviations from the reference

None. Both rules are taken verbatim from `bundle.css`; the library only adds the two selectors that
carry them.

## Do / Don't

- Do put the one primary button of the page into `z-price-summary` inside the aside.
- Do add a `z-sticky-bar mobileOnly` when the aside holds the next step, so the action stays
  reachable below 900px.
- Do keep the form in the default slot and give the aside its own element, so the DOM order stays
  form first.
- Don't use a second `[zConfigAside]`; the grid has one strip.
- Don't put the whole form into a panel. `z-config` groups; the panel is for data and tools.
- Don't make the aside `position: fixed` or give it a width of its own; the 340px belong to the
  reference layout.
