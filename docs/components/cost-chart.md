# CostChart

Shows how flex costs grow with the hours played and where the cap takes over.

## When to use

- The flex calculator on a price page, usage in the panel, a balance over time: one series with an
  upper limit.

## When not to use

- For several series. Those take `chart-1` to `chart-4` in a fixed order, with a legend and 2px
  between bars, and the same axis and tooltip rules.
- For a single number. That is `z-metric`.

## Import

```ts
import {
  Z_CHART_AREA,
  ZChartGeometry,
  ZCostChart,
  zCostAt,
  zCostCapHour,
  zCostGeometry,
} from 'zenit-ui';
```

## API

Selector: `z-cost-chart`

| Input      | Type     | Default | Description                                                              |
| ---------- | -------- | ------- | ------------------------------------------------------------------------ |
| `base`     | `number` | `0`     | Base amount per month, where the line starts.                            |
| `rate`     | `number` | `0`     | Price per hour, **unrounded**.                                           |
| `cap`      | `number` | `0`     | Upper limit per month. From there the line runs flat.                    |
| `maxHours` | `number` | `0`     | Hours the time axis runs to. Anything at or below 0 becomes 1.           |
| `caption`  | `string` | `''`    | One sentence that says the chart in words, below it.                     |

No outputs, no content projection. Every visible default text and number format comes from the
label registry (`chartTitle`, `chartDesc`, `chartMoney`, `chartPlayed`, …), so an application in
another language sets them once; see [Labels](../labels.md).

The arithmetic is exported as pure functions: `zCostAt`, `zCostCapHour`, `zCostStep`, `zCostTicks`,
`zCostGeometry`, `zCostTableHours`, `zCostHourAt`, `zCostX`, `zCostY` and the drawing area
`Z_CHART_AREA`.

## Examples

The flex calculator:

```html
<z-cost-chart
  [base]="1.5"
  [rate]="0.088"
  [cap]="10.3"
  [maxHours]="150"
  caption="Normal mit 4 GB: 1,50 € Grundbetrag plus 0,09 € je Stunde, nie mehr als 10,30 € im Monat."
/>
```

The rate is the unrounded one, and the figure above the chart shows it rounded to the cent. That
distinction is the point: with the printed 0,09 € the cap would land on 98 hours instead of 100.

Values derived from the selection:

```ts
protected readonly stundenpreis = computed(() => 0.022 * this.ramGb());
protected readonly deckel = computed(() => (this.monatspreis() * 4) / 3);
```

```html
<z-cost-chart
  [base]="1.5"
  [rate]="stundenpreis()"
  [cap]="deckel()"
  [maxHours]="150"
  [caption]="diagrammSatz()"
/>
```

The cap hour on its own, for a sentence elsewhere:

```ts
import { zCostCapHour } from 'zenit-ui';

const knick = Math.round(zCostCapHour(1.5, 0.088, 10.3) ?? 0); // 100
```

## States

| State  | How it looks                                                              | How to trigger it            |
| ------ | ------------------------------------------------------------------------- | ---------------------------- |
| Rest   | line, dashed cap, grid, two direct labels, two figures above              | default                      |
| Hover  | vertical line, dot and tooltip at the hour under the pointer              | pointer over the plot        |
| Focus  | the same cursor, at the hour the keyboard is on                           | Tab onto the plot            |
| Table  | the same numbers as a real `<table>`                                      | opening "Als Tabelle"        |

Edge cases are handled in the arithmetic, not in the template: a rate of 0 draws a flat line and no
cap point, a cap at or below the base caps from hour 0, a cap past the axis draws no cap point, and
`maxHours` at or below 0 becomes 1. Nothing ever renders `NaN`.

## Accessibility

- The SVG carries `<title>` and `<desc>` with unique ids and is a `role="img"` named by them, with
  `focusable="false"` so it is no tab stop of its own.
- **The plot around it is the interactive part and therefore not an image.** It is a
  `role="slider"` over the hours, which is exactly the keyboard contract the chart offers: left and
  right move the hour by about a thirtieth of the axis, Home and End jump to the ends, and
  `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and `aria-valuetext` carry the reading
  ("50 h gespielt: 5,90 €"). A `role="img"` on an element that answers arrow keys would announce a
  picture and hand over a control.
- The hit area is the whole plot, pointer and focus show the same cursor, and the tooltip stays
  inside the plot.
- Below the chart the caption says the chart in words, and "Als Tabelle" opens the same numbers as
  a real table with the cap hour among the support points.
- Nothing animates, at any setting.

## Responsive

The SVG has a `viewBox` and fills its container, so it scales instead of reflowing. Below 480px
every second hour tick steps aside, so the axis stays readable at 360px.

## Rendered classes and tokens

| Class                | Applies when                         |
| -------------------- | ------------------------------------ |
| `z-chart`            | always (host)                        |
| `z-chart__figures`   | the two lead numbers above the chart |
| `z-chart__plot`      | the focusable plot                   |
| `z-chart__grid`      | the grid lines                       |
| `z-chart__axis`      | the axis labels                      |
| `z-chart__line`      | the cost line                        |
| `z-chart__cap`       | the dashed cap                       |
| `z-chart__marker`    | cap point and cursor dot             |
| `z-chart__label`     | the two direct labels                |
| `z-chart__cross`     | the vertical cursor line             |
| `z-chart__tip`       | the tooltip                          |
| `z-chart__caption`   | the sentence below                   |

Tokens: `--text` for the 2px line, `--border-control` for the dashed cap and the cursor line,
`--border` for the grid, `--text-subtle` and `--font-mono` for the axis, `--text-muted` for the two
direct labels, `--surface-raised` and `--shadow-overlay` for the tooltip. No fill, no gradient, no
chart colour and no legend: one series is neutral. The 520 by 240 viewBox, the plot from 48 to 508
and the 5px marker radius are literal values from the reference stylesheet.

## Deviations from the reference

- Addition to the reference: `.z-chart .z-faq > summary` carries the 14px/20px type and the 12px
  padding that the preview writes as an inline style; a library component carries no inline styles.
- Addition to the reference: `.z-chart__plot:focus-visible` gets the 2px ring, because the plot is
  a tab stop.
- Addition to the reference: `.z-chart__tip` and `.z-chart__tip--flip` carry the offset next to the
  cursor that the reference script writes as an inline transform, so the tooltip stays inside the
  plot on the right half.
- Addition to the reference: below 480px `.z-chart__axis--half` hides every second hour tick.

## Do / Don't

- Do compute the cap hour, and compute it with the unrounded rate.
- Do keep the caption a sentence a visitor could say out loud.
- Don't fill the area under the line or give it a gradient.
- Don't add a legend or a second scale.
- Don't label every point; two direct labels are enough.
