# Checkbox

Selects entries for a bulk action or confirms a statement.

## When to use

- To pick rows in a list or a table for a bulk action.
- To confirm a statement in a form, for example the terms of service.

## When not to use

- For a setting that takes effect at once, without a save button. That is `z-toggle`.
- For a choice between two views on the same data. That is `z-segment`.

## Import

```ts
import { ZCheckbox } from 'zenit-ui';
```

## API

Selector: `z-checkbox`

| Input             | Type      | Default | Description                                                                                                                                      |
| ----------------- | --------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `checked`         | `boolean` | `false` | Checked state, two-way bindable through `[(checked)]`. Also the value seen by forms.                                                             |
| `disabled`        | `boolean` | `false` | Locks the checkbox. Independent of the disabled state from forms; either one is enough. Boolean attribute.                                       |
| `ariaLabel`       | `string`  | `''`    | `aria-label` of the native input, for a checkbox without visible text. Empty writes no attribute.                                                |
| `ariaDescribedby` | `string`  | `''`    | `aria-describedby` of the native input: the `id`s of the error or hint sentence, separated by spaces. Empty writes no attribute.                 |
| `indeterminate`   | `boolean` | `false` | Mixed state of a "select all" box, two-way bindable through `[(indeterminate)]`. No value: forms never see it, and a user interaction clears it. |
| `required`        | `boolean` | `false` | Marks the native input as `required`. Set by `[formField]` from a `required()` rule. Boolean attribute.                                          |
| `invalid`         | `boolean` | `false` | Writes `aria-invalid="true"` while `touched` holds too. Set by `[formField]` from the field state. Boolean attribute.                            |
| `touched`         | `boolean` | `true`  | Gates `invalid`. Set by `[formField]`; outside Signal Forms it stays `true`. Boolean attribute.                                                  |

| Output                | Payload   | Fires when                                                          |
| --------------------- | --------- | ------------------------------------------------------------------- |
| `checkedChange`       | `boolean` | the state changes (the `model()` companion)                         |
| `indeterminateChange` | `boolean` | a user interaction clears the mixed state (the `model()` companion) |

Content projection: the default slot is the text to the right of the box.

Forms: implements `ControlValueAccessor`, so `ngModel` and `formControl` work, and has the shape of
a Signal Forms `FormCheckboxControl`, so `[formField]` works and feeds `disabled`, `required`,
`invalid` and `touched`. A `null` or `undefined` value counts as unchecked. See [Forms](../forms.md) for the three ways to bind it.

## Examples

Two-way bound, with visible text:

```html
<z-checkbox [(checked)]="alleGewaehlt">Alle auswählen</z-checkbox>
```

With reactive forms, including a link inside the text:

```html
<z-checkbox [formControl]="agb"> Ich stimme den <a href="/agb">Bedingungen</a> zu </z-checkbox>
```

In a table row, without visible text:

```html
<td>
  <z-checkbox ariaLabel="server.jar auswählen" />
</td>
```

"Select all" above a list, mixed while only some rows are selected:

```html
<z-checkbox
  [checked]="alleGewaehlt()"
  [indeterminate]="einigeGewaehlt()"
  (checkedChange)="waehleAlle($event)"
  >Alle auswählen</z-checkbox
>
```

With an error sentence, tied in through `ariaDescribedby`:

```html
<z-checkbox [formControl]="agb" [invalid]="agb.invalid && agb.touched" ariaDescribedby="agb-fehler">
  Ich stimme den Bedingungen zu
</z-checkbox>
<span class="z-field__error" id="agb-fehler">Bestätige die AGB, um fortzufahren.</span>
```

Locked, with the reason next to it:

```html
<z-checkbox disabled>Rechnung per Post</z-checkbox>
<span class="z-muted">Nur für Geschäftskunden verfügbar.</span>
```

With template-driven forms:

```html
<z-checkbox [(ngModel)]="newsletter">Neuigkeiten per E-Mail</z-checkbox>
```

## States

| State    | How it looks                                       | How to trigger it                            |
| -------- | -------------------------------------------------- | -------------------------------------------- |
| Rest     | `surface` with a 1.5px `border-control` border     | default                                      |
| Hover    | border moves to `text-muted`                       | pointer over box or text                     |
| Focus    | 2px ring in `focus` with 2px offset                | Tab, `:focus-visible`                        |
| Checked  | `accent` fill with the check mark in `on-accent`   | click, Space, or `[(checked)]="true"`        |
| Mixed    | `accent` fill with a 9px by 2px bar in `on-accent` | `[indeterminate]="true"`; a click clears it  |
| Disabled | 45 percent opacity, `cursor: not-allowed`          | `disabled`, or the form disables the control |

There is no loading or empty state. An error has no colour of its own, because the reference has no
error style for the checkbox: `invalid` only writes `aria-invalid="true"`, and the sentence next to
the box carries the message. The whole control is a `<label>`, so clicking the text toggles the box.

## Accessibility

- With visible text the `<label>` names the control; without it the caller passes `ariaLabel`, which
  is only written when it is not empty.
- The checked state lives directly on the native element, written in an effect, so a control that
  rejects an input keeps element and model in sync.
- `indeterminate` is the native property, so a screen reader reads the box as mixed; no
  `aria-checked` is written.
- An error or hint sentence is referenced through `ariaDescribedby`. `aria-invalid="true"` appears
  only once the field is both invalid and touched.
- Once at least one row is selected, a bar above the list shows the count and the bulk actions. That
  bar is the caller's; the checkbox does not build it.

## Responsive

Below 640px the label gets a 40px minimum height, so the click target meets the minimum while the
18px box keeps its size.

## Rendered classes and tokens

| Class     | Applies when                      |
| --------- | --------------------------------- |
| `z-check` | the `<label>` around box and text |

The native `<input type="checkbox">` inside it is styled through `.z-check input`. Tokens:
`--space-2` for the gap, `--border-control` for the border, `--radius-sm`, `--surface` for the box,
`--accent` with `--on-accent` for the checked state, `--text-muted` for the hover border, `--focus`
for the ring, `--control-md` for the mobile click target. The 18px box and the 1.5px border are
literal values from the reference stylesheet.

## Deviations from the reference

- Addition to the library: a checkbox without visible text has an empty `<span>`, so
  `.z-check span:empty` is hidden; otherwise the gap would remain next to the box.
- Addition to the reference: below 640px `.z-check` gets a 40px minimum height, because click
  targets are at least 40px tall on mobile.
- Addition to the reference: `bundle.css` has no mixed state. `.z-check input:indeterminate` takes
  the `accent` fill and a bar in `on-accent` with the stroke (2px) and the length (9px) of the check
  mark. Focus ring, disabled opacity and the mobile click target are untouched.

## Do / Don't

- Do give a checkbox in a table row an `ariaLabel` naming that row.
- Do keep the text short and positive ("Alle auswählen").
- Do show a bulk action bar once a row is selected.
- Don't let a checkbox switch something immediately; that is a toggle.
- Don't rely on the checked colour alone; the label carries the meaning.
