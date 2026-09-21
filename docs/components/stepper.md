# Stepper

Shows where you are in a flow whose steps really do follow one another.

## When to use

- In the order assistant, where the steps come in order and you can jump back.

## When not to use

- On the price page. The calculator there is one single form with every input visible at once.
- As a decorative "in three steps" section on a public page. That is marketing copy, not a stepper.
- For sub-pages of an area. That is `nav[zTabs]`.

## Import

```ts
import { ZStepper } from 'zenit-ui';
```

## API

Selector: `z-stepper`

| Input     | Type       | Default | Description                                                                                                                                            |
| --------- | ---------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `steps`   | `string[]` | `[]`    | Labels of the steps in order, one short noun each. Two to four steps. An empty array renders an empty list.                                            |
| `current` | `number`   | `0`     | Zero-based index of the current step; every step with a lower index counts as done. An index past the last step marks all steps done and none current. |

No outputs, no content projection, no forms support. The component is static text: it adds no focus
and no keyboard handling of its own.

## Examples

The three steps of the order assistant, on the second one:

```html
<z-stepper [steps]="['Spiel', 'Leistung', 'Bezahlen']" [current]="1" />
```

On the first step, and after the last one:

```html
<z-stepper [steps]="['Spiel', 'Leistung', 'Bezahlen']" [current]="0" />
<z-stepper [steps]="['Spiel', 'Leistung', 'Bezahlen']" [current]="3" />
```

Above the form it belongs to:

```html
<z-stepper [steps]="schritte" [current]="schritt()" />
<z-panel title="Leistung">
  <z-slider label="Arbeitsspeicher" unit="GB" [min]="2" [max]="16" [step]="2" [(value)]="ram" />
</z-panel>
```

## States

| State   | How it looks                                                                 | How to trigger it            |
| ------- | ---------------------------------------------------------------------------- | ---------------------------- |
| Open    | number in a `border-control` circle, label in `text-muted`                   | index greater than `current` |
| Current | number filled `text` on `bg`, label in `text` and 600, `aria-current="step"` | index equals `current`       |
| Done    | number on `surface-hover` without a border, label in `text-muted`            | index lower than `current`   |

There is no hover, focus or disabled state, because the stepper itself is not operable. If you make
the done steps links back, those links bring their own states.

## Accessibility

- The markup is an `<ol>` with one `<li>` per step, so the sequence reaches assistive technology
  through the list itself.
- The current step carries `aria-current="step"`.
- The step number is visible text in front of the label, so it is read along with it.
- The component adds no keyboard handling. Done steps that should be links back are the caller's
  own `<a>` elements around the labels.

## Responsive

The row is a flex list with `space-5` between the steps and wraps onto a second line when the
labels do not fit. Nothing shrinks, so at 360px a four-step flow wraps rather than truncating.

## Rendered classes and tokens

| Class          | Applies when               |
| -------------- | -------------------------- |
| `z-steps`      | on the `<ol>`, always      |
| `z-step`       | on each `<li>`, always     |
| `z-step--done` | index lower than `current` |
| `z-step__num`  | on the number, always      |

Tokens: `--space-2` and `--space-5` for the gaps, `--border-control` for the open circle,
`--radius-full`, `--font-mono` for the number, `--text-muted` and `--text` for the labels, `--bg`
for the number inside the current step, `--surface-hover` for a done step. The 24px circle and the
12px number are literal values from the reference stylesheet.

## Do / Don't

- Do use two to four steps, one short noun each.
- Do make done steps links back, so the flow can be corrected.
- Do keep the stepper to the order assistant.
- Don't fill the current step red; it is `text` on `bg`. Red stays on the "Weiter" button.
- Don't use a stepper for a form whose inputs are all visible at once.
