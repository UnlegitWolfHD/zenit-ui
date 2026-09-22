# Slider

Sets an amount on a fixed scale: RAM, slots, storage.

## When to use

- In the price calculator and the order assistant, where the amount changes the price at once.
- Wherever only a handful of bookable steps exist and the visitor should see the whole range.

## When not to use

- For a free number a customer types, such as the maximum player count. That is an
  `input zInput mono`.
- For more than twelve steps or on devices without a mouse without `steppers`. The design system
  requires the plus and minus buttons there
  (`spec/components/Slider/README.md`: "Bei mehr als 12 Stufen oder auf Geräten ohne Maus
  zusätzlich Plus- und Minus-Buttons anbieten."), and a development build warns once per slider
  when `(max - min) / step` is above twelve and `steppers` is off.

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
| `steppers`  | `boolean`                       | `false` | Adds a minus and a plus button left and right of the track, each moving the value by one `step`. Boolean attribute.                    |
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

**`steppers`.** Two icon-only ghost buttons in size `sm` sit left and right of the track, with the
icons `remove` and `add` and their `aria-label` from the label registry (`sliderDecrease` and
`sliderIncrease`, "Verringern" and "Erhöhen" in German). Each click moves the value by one `step`,
clamped to `min` and `max`, and writes through the same path as the track: model, `ControlValueAccessor`,
Signal Forms and `valueChange` see exactly one change per click. It is explicit on purpose and never
switches itself on above twelve steps: a slider that grows a pair of buttons the moment a `max`
changes is a layout moving without anyone asking for it. What the component does instead is warn:
a development build prints one `console.warn` per slider quoting the rule of
`spec/components/Slider/README.md` when `(max - min) / step` is above twelve and `steppers` is off.

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

Twenty-seven steps, so the buttons are required:

```html
<z-slider
  label="Tickrate"
  unit="Hz"
  [min]="20"
  [max]="128"
  [step]="4"
  [ticks]="[20, 48, 76, 100, 128]"
  steppers
  hint="Mehr Tickrate kostet CPU-Zeit. 64 Hz reichen für die meisten Spiele."
  [(value)]="tickrate"
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

| State            | How it looks                                                                                        | How to trigger it                            |
| ---------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Rest             | track in `border-control`, knob in `text`                                                           | default                                      |
| Hover            | no colour change; the cursor becomes a pointer                                                      | pointer over the track                       |
| Focus            | 2px ring in `focus` with 2px offset                                                                 | Tab, `:focus-visible`                        |
| Active           | the value follows the pointer, the number next to it updates live                                   | drag, or arrow keys                          |
| Disabled         | 45 percent opacity, `cursor: not-allowed`; with `steppers` both buttons carry the native `disabled` | `disabled`, or the form disables the control |
| End of the scale | with `steppers`, the button on that side carries `aria-disabled="true"` and its click does nothing  | the value reaches `min` or `max`             |

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
- With `steppers` the two buttons are ordinary tab stops before and after the track, each with an
  `aria-label` from the registry. At the end of the scale the button on that side is marked
  `aria-disabled="true"` instead of being disabled natively, so it keeps the focus it has just been
  given and the state is still announced; its click is swallowed. A `disabled` slider is the one
  case where both buttons really are disabled, because there is nothing to focus for.

## Responsive

Below 640px the track grows to 40px tall, so the click target meets the minimum. The two stepper
buttons are `z-btn--icon z-btn--sm`, which the same breakpoint raises from 32px to 40px square. The
head with label and value, the ticks and the hint keep their sizes.

## Rendered classes and tokens

| Class            | Applies when         |
| ---------------- | -------------------- |
| `z-range`        | always (host)        |
| `z-range__head`  | always               |
| `z-range__row`   | `steppers` is set    |
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
- Addition to the reference: `.z-range__row`, one flex row that holds minus button, track and plus
  button. `bundle.css` has no markup for the buttons the Slider README asks for beyond twelve
  steps, so the row is the only new class; the buttons themselves are the reference's own
  `.z-btn--ghost.z-btn--icon.z-btn--sm`. A slider without `steppers` does not carry the class and
  renders exactly as before.

## Do / Don't

- Do put only bookable steps on the scale, through `step` and matching `ticks`.
- Do show the value as a number with its unit; the slider is never the only place it appears.
- Do write the recommendation for the chosen game into `hint`.
- Do set `steppers` above twelve steps and wherever the visitor has no mouse.
- Don't fill the track red or put a glow on the knob.
- Don't use a slider for more than twelve steps without `steppers`.
