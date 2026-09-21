# PriceSummary

The result of the price calculator, carrying the only primary button of the calculator.

## When to use

- Next to the calculator on the start page, under `/preise` and in the order assistant.

## When not to use

- As a generic card. It is the result of the calculator and nothing else.
- Empty. On load the cheapest game is preselected, so the summary always shows a price.

## Import

```ts
import { ZPriceLine, ZPriceSummary, ZPriceTotal } from 'zenit-ui';
```

## API

Selector: `z-price-summary`

| Input    | Type           | Default | Description                                                                                                         |
| -------- | -------------- | ------- | ------------------------------------------------------------------------------------------------------------------- |
| `label`  | `string`       | `''`    | Game and period, for example "Valheim, monatlich". Also the accessible name of the landmark. Empty leaves both out. |
| `price`  | `string`       | `''`    | The price, already formatted by the caller: comma as the decimal mark, non-breaking space before the currency.      |
| `period` | `string`       | `''`    | Period shown after the price, for example "/ Monat". Rendered in a `<small>`.                                       |
| `lines`  | `ZPriceLine[]` | `[]`    | The line items in display order. Not tracked by `label`, so duplicate labels are allowed.                           |
| `note`   | `string`       | `''`    | One sentence on how billing works, shown under the button. Empty leaves it out.                                     |
| `total`  | `ZPriceTotal \| null` | `null` | The sum under the items, set off by a line in `border-control`. Leave it out where there is only one amount.    |
| `loading` | `boolean`     | `false` | The last number stays and turns `text-muted`, with a spinner beside it. Never a dash. Boolean attribute.            |
| `error`  | `string`       | `''`    | Why the price could not be computed. Shows a `danger` alert with the retry button.                                  |
| `retryLabel` | `string`   | `''`    | Caption of that button. Empty falls back to the `summaryRetry` label.                                               |
| `legalNote` | `string`    | `''`    | The tax note, as the last line of the summary.                                                                      |

| Output  | Payload | Fires when                          |
| ------- | ------- | ----------------------------------- |
| `retry` | `void`  | the retry button in the alert is pressed |

No outputs. Content projection: the default slot is the button, which sits between the line items
and the note.

`ZPriceLine` is `{ label: string; value: string; discount?: boolean }`. The amount is already
formatted by the caller; discounts carry a minus sign and stay a line of their own, they never
become a badge. `discount` puts `z-summary__discount` on the line, which colours the amount in
`success`; the real minus sign U+2212 comes from the caller, along with the rest of the formatting.
`ZPriceTotal` is `{ label: string; value: string }` and renders as the last pair inside the same
`<dl>`.

"Incomplete" is no state of its own: the caller disables its own button and writes into `note` what
is still missing ("Wähle noch eine Bezahlmethode"). Validation errors of the selection belong at
the field, never here; see the guideline "Konfigurator".

## Examples

The summary of the price calculator:

```html
<z-price-summary
  label="Valheim, monatlich"
  price="5,40&nbsp;€"
  period="/ Monat"
  [lines]="posten"
  note="Nach Stunden abgerechnet, nach oben gedeckelt."
>
  <button zBtn="primary" block type="button">Server erstellen</button>
</z-price-summary>
```

```ts
import { ZPriceLine } from 'zenit-ui';

const posten: ZPriceLine[] = [
  { label: '8 GB Arbeitsspeicher', value: '4,40 €' },
  { label: '20 Steckplätze', value: '1,49 €' },
  { label: 'Laufzeitrabatt', value: '−0,49 €' },
];
```

Without line items and without a note, which is the short form on a sub-page:

```html
<z-price-summary label="Minecraft, monatlich" price="1,98&nbsp;€" period="/ Monat">
  <button zBtn="primary" block type="button">Server erstellen</button>
</z-price-summary>
```

As the right column of a hero:

```html
<z-hero title="Preis berechnen" lead="Spiel, Arbeitsspeicher und Laufzeit bestimmen den Preis.">
  <z-price-summary
    zHeroAside
    label="Minecraft, monatlich"
    price="5,40&nbsp;€"
    period="/ Monat"
    [lines]="posten"
  >
    <button zBtn="primary" block type="button">Server erstellen</button>
  </z-price-summary>
</z-hero>
```

Bound to the live values of the calculator:

```html
<z-price-summary
  [label]="spielLabel()"
  [price]="preisText()"
  period="/ Monat"
  [lines]="posten()"
  [note]="abrechnungssatz()"
>
  <button zBtn="primary" block type="button">Server erstellen</button>
</z-price-summary>
```

## States

| State        | How it looks                                                                  | How to trigger it            |
| ------------ | ----------------------------------------------------------------------------- | ---------------------------- |
| Rest         | label, price, items, button, notes                                            | default                      |
| Loading      | the last number in `text-muted` with a `z-spinner`, `aria-busy` on the price  | `loading`                    |
| Error        | a `danger` alert above the button, with a secondary sm retry button           | `error`                      |
| Incomplete   | the caller's button disabled, `note` says what is missing                     | the caller                   |
| With discount | the deduction in `success` on its own line, `z-summary__total` under it       | `discount` on a line, `total` |

There is never a dash in place of a price: while it loads, the last number stays. What changes is
the number, and only the number, because the system allows no counting animation. The summary is
never shown empty.

```html
<z-price-summary
  label="Minecraft, alle 180 Tage"
  price="41,49 €"
  [lines]="posten"
  [total]="{ label: 'Summe', value: '41,49 €' }"
  [loading]="preisLaedt()"
  [error]="preisFehler() ? 'Der Preis konnte nicht berechnet werden. Versuche es erneut.' : ''"
  note="Wähle noch eine Bezahlmethode"
  legalNote="Gemäß § 19 UStG wird keine Umsatzsteuer berechnet."
  (retry)="berechneNeu()"
>
  <button zBtn="primary" block type="button" [disabled]="!bestellbar()">
    Kostenpflichtig bestellen
  </button>
</z-price-summary>
```

## Accessibility

- The `<aside>` is a complementary landmark named by `label`; without a label it carries no
  `aria-label`.
- The line items are a `<dl>` of `<dt>`/`<dd>` pairs, which ties every item to its amount.
- The period is in a `<small>` after the price, so price and period are read together.
- The button inside is the only primary button of the calculator.
- The price is a polite live region (`aria-live="polite"`, `aria-atomic="true"`) that is always in
  the markup, so a changed amount is announced instead of only redrawn. While it is recomputed it
  also carries `aria-busy="true"`, and the caller keeps the last confirmed number there, so nothing
  unconfirmed is ever read out.

## Responsive

From 900px on the summary sticks to the right of the calculator, `header` plus `space-5` from the
top. Below that it sits under the calculator, and the price additionally sticks as a bar at the
bottom edge. Both are the caller's layout; the component itself is a plain block.

## Rendered classes and tokens

| Class              | Applies when         |
| ------------------ | -------------------- |
| `z-summary`        | on the `<aside>`     |
| `z-summary__label` | `label` is not empty |
| `z-summary__price` | always               |
| `z-summary__lines` | on the `<dl>`        |
| `z-summary__line`  | on each item         |
| `z-summary__note`  | `note` and `legalNote` |
| `z-summary__price--pending` | `loading` |
| `z-summary__discount` | a line with `discount` |
| `z-summary__total` | `total` is set        |

Tokens: `--space-2` to `--space-5` for padding and gaps, `--border` for the 1px frame and the item
lines, `--radius-md`, `--surface`, `--text-muted` for the label and the item names, `--text` with
`--font-mono` for the amounts, `--text-subtle` for the period and the note. The 28px/34px price is
the `mono-xl` style, a literal value from the reference stylesheet.

## Do / Don't

- Do preselect the cheapest game, so the summary is never empty.
- Do take every value from the price service; never hard-code a price.
- Do show a discount as its own line with a minus sign.
- Don't turn a discount into a badge.
- Don't animate the price when it changes; only the number swaps.
- Don't give the summary a red border or a glow.
- Don't show a dash while the price is being recomputed.
- Don't put a validation error of the selection in here.
