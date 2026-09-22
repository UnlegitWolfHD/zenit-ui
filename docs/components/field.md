# Field

Wraps a form control: label above, hint or error below.

## When to use

- Around every `input zInput`, `textarea zInput` and `z-select` that carries a visible label.
- Wherever a control needs a helper sentence or an error message tied to it.

## When not to use

- Around `z-checkbox`, `z-toggle`, `z-segment` and `z-slider`. Those bring their own label: the
  checkbox has its text, the toggle takes the title of a `z-setting` row, the segment has
  `ariaLabel` and the slider has `label`.
- As a layout box. It is a grid of label, control and one line of text, nothing more.

## Import

```ts
import { ZField } from 'zenit-ui';
```

## API

Selector: `z-field`

| Input   | Type     | Default | Description                                                                             |
| ------- | -------- | ------- | --------------------------------------------------------------------------------------- |
| `label` | `string` | `''`    | Visible label above the control. Empty renders no label element.                        |
| `for`   | `string` | `''`    | `id` of the control. Ties the label to it and is the prefix for the hint and error ids. |
| `hint`  | `string` | `''`    | Helper text below the control. Only shown while `error` is empty.                       |
| `error` | `string` | `''`    | Error message below the control. A non-empty value replaces the hint.                   |

No outputs, no forms support of its own. The control is the projected content.

`for` is also the root of the generated ids: the hint becomes `<for>-hint`, the error `<for>-error`.
A projected `input zInput`, `textarea zInput` or `z-select` picks the right id up on its own and
writes it into `aria-describedby`. Without `for` there are no ids and no wiring.

## Examples

Label and hint:

```html
<z-field label="Servername" for="in-name" hint="Nur für dich sichtbar.">
  <input zInput id="in-name" value="Beispiel-Server 1" />
</z-field>
```

The error state: the message on the field, `invalid` on the control:

```html
<z-field label="Maximale Spieler" for="in-max" error="Dein Tarif erlaubt höchstens 100 Spieler.">
  <input zInput mono invalid id="in-max" value="200" />
</z-field>
```

Around a select and around a search box:

```html
<z-field label="Status" for="sel-status">
  <z-select>
    <select id="sel-status">
      <option>Alle Status</option>
      <option>Online</option>
    </select>
  </z-select>
</z-field>

<z-field label="Suche" for="in-search">
  <z-input-group icon="search">
    <input zInput id="in-search" placeholder="Name, Spiel oder Adresse" />
  </z-input-group>
</z-field>
```

## States

| State | How it looks                                                                         | How to trigger it                                     |
| ----- | ------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| Rest  | label, control, hint in `text-subtle`                                                | default                                               |
| Error | `error` sentence in `danger` replaces the hint, border of the control turns `danger` | set `error` on the field and `invalid` on the control |

Hover, focus, active and disabled live on the projected control, not on the field. There is no
loading or empty state.

## Accessibility

- `for` makes the `<label>` point at the control, so clicking the label focuses it.
- Hint and error are referenced through `aria-describedby`; the error wins while it is set, so a
  screen reader never reads a stale hint.
- That reference is added to the `aria-describedby` of the control as a single token and taken out
  again, so an `aria-describedby` you wrote on the control yourself keeps every id it names.
- The error sentence names the cause and the next step, as every error message in this system does.
- Setting `error` does not mark the control invalid by itself: add `invalid` on the `input zInput`,
  which is what sets `aria-invalid="true"`.

## Responsive

The field is a full-width grid and needs no breakpoint of its own. In settings lists the control
sits on the right and stays at least 200px wide. Below 640px filter rows of selects break into two
columns.

## Rendered classes and tokens

| Class            | Applies when                 |
| ---------------- | ---------------------------- |
| `z-field`        | always (host)                |
| `z-field__label` | `label` is not empty         |
| `z-field__hint`  | `hint` set and `error` empty |
| `z-field__error` | `error` is not empty         |

Tokens: `--space-1` for the gap, `--text-subtle` for the hint, `--danger` for the error. The label
is 14px/600, hint and error are 12px/16px, all literal values from the reference stylesheet.

## Do / Don't

- Do put the label above the control, never only in the placeholder.
- Do give the control an `id` and pass it as `for`.
- Do write errors that name what went wrong and how to get it right.
- Don't show a hint and an error at the same time; the error replaces the hint.
- Don't use floating labels.
