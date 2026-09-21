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

| Input       | Type      | Default | Description                                                                                                |
| ----------- | --------- | ------- | ---------------------------------------------------------------------------------------------------------- |
| `checked`   | `boolean` | `false` | Checked state, two-way bindable through `[(checked)]`. Also the value seen by forms.                       |
| `disabled`  | `boolean` | `false` | Locks the checkbox. Independent of the disabled state from forms; either one is enough. Boolean attribute. |
| `ariaLabel` | `string`  | `''`    | `aria-label` of the native input, for a checkbox without visible text. Empty writes no attribute.          |

| Output          | Payload   | Fires when                                  |
| --------------- | --------- | ------------------------------------------- |
| `checkedChange` | `boolean` | the state changes (the `model()` companion) |

Content projection: the default slot is the text to the right of the box.

Forms: implements `ControlValueAccessor`, so `ngModel` and `formControl` work. A `null` or
`undefined` value counts as unchecked.

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

| State    | How it looks                                     | How to trigger it                            |
| -------- | ------------------------------------------------ | -------------------------------------------- |
| Rest     | `surface` with a 1.5px `border-control` border   | default                                      |
| Hover    | border moves to `text-muted`                     | pointer over box or text                     |
| Focus    | 2px ring in `focus` with 2px offset              | Tab, `:focus-visible`                        |
| Checked  | `accent` fill with the check mark in `on-accent` | click, Space, or `[(checked)]="true"`        |
| Disabled | 45 percent opacity, `cursor: not-allowed`        | `disabled`, or the form disables the control |

There is no loading, error or empty state. The whole control is a `<label>`, so clicking the text
toggles the box.

## Accessibility

- With visible text the `<label>` names the control; without it the caller passes `ariaLabel`, which
  is only written when it is not empty.
- The checked state lives directly on the native element, written in an effect, so a control that
  rejects an input keeps element and model in sync.
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

## Do / Don't

- Do give a checkbox in a table row an `ariaLabel` naming that row.
- Do keep the text short and positive ("Alle auswählen").
- Do show a bulk action bar once a row is selected.
- Don't let a checkbox switch something immediately; that is a toggle.
- Don't rely on the checked colour alone; the label carries the meaning.
