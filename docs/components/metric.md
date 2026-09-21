# Metric

Shows a figure with its unit, optionally with a usage bar.

## When to use

- For live figures of a server: CPU, RAM, storage, uptime, ping.
- Several figures at once, as columns of one `z-metrics` row inside one panel.

## When not to use

- As single tiles. Several figures belong in one `z-metrics`, separated by 1px lines.
- For marketing numbers on public pages. That is `z-spec-list`.

## Import

```ts
import { ZMetrics, ZMetric } from 'zenit-ui';
```

## API

### `z-metrics`

No inputs, no outputs. The row of figures; the content is the `z-metric` elements. Usually placed
inside `<z-panel flush>`.

### `z-metric`

| Input     | Type                                    | Default | Description                                                                                                                                                |
| --------- | --------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`   | `string`                                | `''`    | Name of the figure, for example "CPU". Also the `aria-label` of the bar.                                                                                   |
| `value`   | `string`                                | `''`    | The figure itself, already formatted by the caller: comma as the decimal mark.                                                                             |
| `unit`    | `string`                                | `''`    | Unit or upper bound after the value. Empty leaves the `<small>` out.                                                                                       |
| `sub`     | `string`                                | `''`    | Second line under the figure. Carries the percentage in words whenever the bar warns.                                                                      |
| `percent` | `number \| string \| null \| undefined` | `null`  | Usage in percent, 0 to 100. Values outside are clamped, a value that is not a number renders no bar. `null`, `undefined` and the empty string mean no bar. |

No outputs, no content projection, no forms support.

The bar turns `warning` from 80 percent and `danger` from 95 percent. Colour never carries the
meaning alone, so repeat the value in `sub`.

## Examples

Three figures in one panel:

```html
<z-panel flush>
  <z-metrics>
    <z-metric label="CPU" value="0,2" unit="%" [percent]="0.2" />
    <z-metric label="Speicher" value="21,4" unit="/ 24 GB" [percent]="89" sub="89 % belegt" />
    <z-metric label="Laufzeit" value="2d 21h" sub="TPS 20 · Ping 91 ms" />
  </z-metrics>
</z-panel>
```

The warning and the error step, each with the value written out:

```html
<z-metric label="Speicher" value="21,4" unit="/ 24 GB" [percent]="89" sub="89 % belegt, Warnung" />
<z-metric label="Speicher" value="23,4" unit="/ 24 GB" [percent]="97" sub="97 % belegt, kritisch" />
```

Without a bar, which is the usual case for a duration or a count:

```html
<z-metric label="Spieler" value="7" unit="/ 20" sub="Rekord 18" />
```

Bound to live values:

```html
<z-metrics>
  <z-metric label="CPU" [value]="cpuText()" unit="%" [percent]="cpu()" [sub]="cpuSatz()" />
</z-metrics>
```

## States

| State   | How it looks              | How to trigger it         |
| ------- | ------------------------- | ------------------------- |
| Rest    | bar filled `text-muted`   | `percent` below 80        |
| Warning | bar filled `warning`      | `percent` 80 to below 95  |
| Error   | bar filled `danger`       | `percent` 95 and above    |
| No bar  | label, value and sub only | `percent` `null` or empty |

There is no hover, focus, disabled or loading state; a metric is not operable. While the data is
loading, the panel around it sets `busy` and shows skeleton lines.

## Accessibility

- The bar is a `role="meter"` with `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-valuenow` set
  to the clamped percentage and `aria-label` taken from `label`.
- Colour never carries the meaning alone: from 80 percent the value belongs in `sub` as a sentence,
  so it is readable without seeing the bar.
- The unit sits in a `<small>` preceded by a non-breaking space, so value and unit are not separated
  at a line break.

## Responsive

`z-metrics` is an `auto-fit` grid from 160px per column, so the figures reflow by themselves and end
up stacked on a phone. The 1px separator moves with the columns; the first column in a row never
shows one.

## Rendered classes and tokens

| Class              | Applies when            |
| ------------------ | ----------------------- |
| `z-metrics`        | on the row host         |
| `z-metric`         | on each figure host     |
| `z-metric__label`  | always                  |
| `z-metric__value`  | always                  |
| `z-metric__sub`    | `sub` is not empty      |
| `z-meter`          | `percent` renders a bar |
| `z-meter--warning` | from 80 percent         |
| `z-meter--danger`  | from 95 percent         |
| `z-meter__fill`    | inside the bar          |

Tokens: `--space-1` and `--space-4` for gaps and padding, `--border` for the column separator,
`--font-mono` for the value, `--text-muted` for the label and the neutral bar fill,
`--text-subtle` for the unit and the second line, `--surface-hover` for the bar track, `--warning`
and `--danger` for the two steps, `--radius-full` for the bar. The 20px/28px value type and the 4px
bar are literal values from the reference stylesheet.

## Do / Don't

- Do put several figures into one `z-metrics` inside one panel.
- Do format the value in German: comma as the decimal mark, non-breaking space before the unit.
- Do repeat the percentage in `sub` as soon as the bar warns.
- Don't build single tiles per figure.
- Don't put a coloured icon area next to a figure.
- Don't use metrics for marketing numbers on public pages.
