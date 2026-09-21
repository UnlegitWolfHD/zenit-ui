# Slider

Sets an amount on a fixed scale: RAM, slots, storage.

## When to use

- In the price calculator and the order assistant, where the amount changes the price at once.
- Wherever only a handful of bookable steps exist and the visitor should see the whole range.

## When not to use

- For a free number a customer types, such as the maximum player count. That is an
  `input zInput mono`.
- For more than about twelve steps or on devices without a mouse, unless you add plus and minus
  buttons next to it.

## Import

```ts
import { ZSlider } from 'zenit-ui';
```

## API

Selector: `z-slider`

| Input       | Type                            | Default | Description                                                                                                                            |
| ----------- | ------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `label`     | `string`                        | `''`    | Visible label above the track, tied to the input through a generated `id`.                                                             |
| `ariaLabel` | `string`                        | `''`    | `aria-label` of the input, used only while `label` stays empty.                                                                        |
| `min`       | `number`                        | `0`     | Lower end of the scale. With `[formField]` it comes from the `min()` rule of the schema.                                               |
| `max`       | `number`                        | `100`   | Upper end of the scale. With `[formField]` it comes from the `max()` rule of the schema.                                               |
| `step`      | `number`                        | `1`     | Distance between two bookable steps.                                                                                                   |
| `unit`      | `string`                        | `''`    | Unit behind the value, for example `GB`. Joined with a non-breaking space.                                                             |
| `ticks`     | `readonly (string \| number)[]` | `[]`    | Scale values printed below the track. Purely visual and `aria-hidden`.                                                                 |
| `hint`      | `string`                        | `''`    | One sentence below the track, referenced through `aria-describedby`.                                                                   |
| `value`     | `number`                        | `0`     | Current value, two-way bindable through `[(value)]`. Also the value seen by forms.                                                     |
| `disabled`  | `boolean`                       | `false` | Locks the slider. Independent of the disabled state from forms. Boolean attribute.                                                     |
| `invalid`   | `boolean`                       | `false` | Writes `aria-invalid="true"` while `touched` holds too; no error colour. Set by `[formField]` from the field state. Boolean attribute. |
| `touched`   | `boolean`                       | `true`  | Gates `invalid`. Set by `[formField]`; outside Signal Forms it stays `true`. Boolean attribute.                                        |

| Output        | Payload  | Fires when                                                 |
| ------------- | -------- | ---------------------------------------------------------- |
| `valueChange` | `number` | the value changes while dragging (the `model()` companion) |

Forms: `[formField]` works and takes `min`, `max` and `disabled` from the schema; Angular rejects
`[min]`, `[max]` and `[disabled]` next to it. See [Forms](../forms.md) for the three ways to bind it.

No content projection. Forms: implements `ControlValueAccessor`, so `ngModel` and `formControl`
work; `registerOnChange` fires on every `input` of the track, so while dragging. A `null` or
`undefined` value falls back to `min`.

Scale and value are written straight onto the native element, `min`, `max` and `step` included,
because the browser would otherwise clamp the value to the default scale 0 to 100.

## Examples

The RAM slider from the price calculator:

```html
<z-slider
  label="Arbeitsspeicher"
  unit="GB"
  [min]="2"
  [max]="16"
  [step]="2"
  [ticks]="[2, 4, 8, 16]"
  hint="Für Minecraft mit Mods sind 8 GB empfohlen."
  [(value)]="ram"
/>
```

Slots, without ticks, with reactive forms:

```html
<z-slider
  label="Steckplätze"
  unit="Slots"
  [min]="10"
  [max]="100"
  [step]="10"
  [formControl]="slots"
/>
```

Without a visible label, named through `ariaLabel`:

```html
<z-slider
  ariaLabel="Speicher"
  unit="GB"
  [min]="10"
  [max]="200"
  [step]="10"
  [(ngModel)]="speicher"
/>
```

Locked, with the reason in the hint:

```html
<z-slider
  label="Arbeitsspeicher"
  unit="GB"
  [min]="2"
  [max]="16"
  [step]="2"
  [value]="8"
  disabled
  hint="Der Arbeitsspeicher lässt sich während der Installation nicht ändern."
/>
```

## States

| State    | How it looks                                                      | How to trigger it                            |
| -------- | ----------------------------------------------------------------- | -------------------------------------------- |
| Rest     | track in `border-control`, knob in `text`                         | default                                      |
| Hover    | no colour change; the cursor becomes a pointer                    | pointer over the track                       |
| Focus    | 2px ring in `focus` with 2px offset                               | Tab, `:focus-visible`                        |
| Active   | the value follows the pointer, the number next to it updates live | drag, or arrow keys                          |
| Disabled | 45 percent opacity, `cursor: not-allowed`                         | `disabled`, or the form disables the control |

There is no error, loading or empty state. The value is always visible as a number next to the
track, so the slider is never the only place the amount appears.

## Accessibility

- The visible `label` is tied to the input through a generated `id`. With no visible label the input
  takes `ariaLabel`, and only then.
- `aria-valuetext` carries the value with its unit, so a screen reader reads "8 GB" and not just
  "8".
- `hint` is referenced through `aria-describedby`.
- The tick row is `aria-hidden="true"`; it only repeats the scale the input already reports.
- Arrow keys move by `step`, Home and End jump to `min` and `max`. That is the native range
  behaviour and the component adds nothing to it.

## Responsive

Below 640px the track grows to 40px tall, so the click target meets the minimum. The head with
label and value, the ticks and the hint keep their sizes.

## Rendered classes and tokens

| Class            | Applies when         |
| ---------------- | -------------------- |
| `z-range`        | always (host)        |
| `z-range__head`  | always               |
| `z-field__label` | `label` is not empty |
| `z-range__value` | always               |
| `z-range__ticks` | `ticks` is not empty |
| `z-field__hint`  | `hint` is not empty  |

Tokens: `--space-2` and `--space-3` for the gaps, `--font-mono` for the value and the ticks,
`--border-control` for the track, `--text` for the knob, `--text-subtle` for the ticks, `--focus`
for the ring, `--radius-full` for track and knob, `--control-md` for the mobile hit area. The 4px
track, the 18px knob and the 20px/28px value type are literal values from the reference stylesheet.

## Deviations from the reference

- Addition to the library: the disabled track follows checkbox, toggle and button with 45 percent
  opacity and `cursor: not-allowed`.
- Addition to the reference: below 640px the range input is raised to 40px, because click targets
  are at least 40px tall on mobile.

## Do / Don't

- Do put only bookable steps on the scale, through `step` and matching `ticks`.
- Do show the value as a number with its unit; the slider is never the only place it appears.
- Do write the recommendation for the chosen game into `hint`.
- Don't fill the track red or put a glow on the knob.
- Don't use a slider for more than twelve steps without plus and minus buttons beside it.
