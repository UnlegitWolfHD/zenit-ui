# Input

Styles a native `<input>` or `<textarea>` and wires it to its field.

## When to use

- For one line of text or a number in a form, a toolbar or a settings row.
- With `mono` for numbers, ports, IP addresses, file names and configuration values.
- Through `z-input-group` when the field needs a leading icon, as a search box does.

## When not to use

- For a choice out of a short fixed list. That is `z-select`, or a `z-segment` for up to four
  options that are meant to be compared.
- For an amount on a fixed scale. That is `z-slider`.

## Import

```ts
import { ZInput, ZInputGroup } from 'zenit-ui';
```

## API

### `input[zInput]`, `textarea[zInput]`

| Input     | Type           | Default | Description                                                                    |
| --------- | -------------- | ------- | ------------------------------------------------------------------------------ |
| `size`    | `'sm' \| 'md'` | `'md'`  | `md` for forms, `sm` for toolbars and filter rows. Adds `z-input--sm`.         |
| `mono`    | `boolean`      | `false` | Monospace face with tabular figures. Boolean attribute.                        |
| `invalid` | `boolean`      | `false` | Sets `aria-invalid="true"` and with it the `danger` border. Boolean attribute. |

No outputs. The element stays native, so `value`, `placeholder`, `readonly`, `disabled`, `ngModel`
and `formControl` all work as usual.

The native `size` attribute is removed from the host: `size` carries `sm`/`md` here, and that value
would be invalid HTML on an `<input>`.

### `z-input-group`

| Input  | Type     | Default  | Description                                                          |
| ------ | -------- | -------- | -------------------------------------------------------------------- |
| `icon` | `string` | required | Material Icons ligature in front of the field, for example `search`. |

The field is the projected content. The icon is decorative and `aria-hidden`, so the field still
needs its own label from the surrounding `z-field`.

## Examples

A plain field and a monospace read-only one:

```html
<z-field label="Servername" for="in-name" hint="Nur für dich sichtbar.">
  <input zInput id="in-name" value="Beispiel-Server 1" />
</z-field>

<z-field label="Adresse" for="in-addr" hint="IP und Port deines Servers.">
  <input zInput mono id="in-addr" value="203.0.113.10:25565" readonly />
</z-field>
```

The error state, paired with `error` on the field:

```html
<z-field label="Maximale Spieler" for="in-max" error="Dein Tarif erlaubt höchstens 100 Spieler.">
  <input zInput mono invalid id="in-max" value="200" />
</z-field>
```

A textarea and a small field in a toolbar:

```html
<z-field label="Notiz" for="in-note">
  <textarea zInput id="in-note" placeholder="Was hast du zuletzt geändert?"></textarea>
</z-field>

<input zInput size="sm" placeholder="Filtern" aria-label="Liste filtern" />
```

The search box through the input group:

```html
<z-field label="Suche" for="in-search">
  <z-input-group icon="search">
    <input zInput id="in-search" placeholder="Name, Spiel oder Adresse" />
  </z-input-group>
</z-field>
```

## Native input types

`zInput` styles the element, not one `type`. Every text-like type keeps the field height
(`control-md`, `control-sm`), the border, the hover and focus states, the `danger` frame from
`invalid` and the 45 percent of `disabled`. What the browser adds on top is its own: the calendar
and clock popups, the spin buttons of a number field and the clear button of a search field.

| `type`                                 | Verdict            | What the browser adds                                            |
| -------------------------------------- | ------------------ | ---------------------------------------------------------------- |
| `text`, `email`, `url`, `password`      | use freely         | nothing                                                          |
| `search`                                | use freely         | a clear button, drawn under the pointer only                     |
| `number`                                | use with `mono`    | spin buttons, drawn under the pointer only                       |
| `date`, `time`, `datetime-local`, `month` | use freely       | the segmented editor, the indicator and the platform's own picker |
| `file`                                  | not covered        | a button with a label the browser writes, in English on an English browser |

`file` is deliberately outside the design system: the button is drawn and labelled by the browser,
which breaks both the German copy and the token colours. Build an upload as a `button[zBtn]` next to
a visually hidden `<input type="file">`.

The dark colour scheme reaches these controls because the base styles declare `color-scheme: dark`
on the root; see [theming](../theming.md). Without it the calendar indicator is drawn black on the
dark field (measured 1.09:1) instead of white (19.27:1).

### The value of a date field is a string

This is the one thing that breaks a migration from `mat-datepicker`. `MatDatepicker` binds a
`Date`; `input[type="date"]` binds an **ISO string**, `yyyy-MM-dd` (`time` gives `HH:mm`,
`datetime-local` gives `yyyy-MM-ddTHH:mm`, `month` gives `yyyy-MM`). Assigning a `Date` to `value`
leaves the field empty, without an error.

A form model that holds a `Date` does not have to change. Adapt at the binding, with `DatePipe` in
and `valueAsDate` out:

```html
<z-field label="Gültig bis" for="valid-to" hint="Bis zu diesem Tag läuft der Server.">
  <input
    zInput
    type="date"
    id="valid-to"
    min="2026-09-22"
    [value]="validTo() | date: 'yyyy-MM-dd'"
    (change)="onDate($event)"
  />
</z-field>
```

```ts
protected readonly validTo = signal(new Date(2026, 11, 31));

protected onDate(event: Event): void {
  // valueAsDate is null while the value is incomplete or out of range.
  const gewaehlt = (event.target as HTMLInputElement).valueAsDate;
  if (gewaehlt) this.validTo.set(gewaehlt);
}
```

`DatePipe` has to be imported in the component (`imports: [DatePipe]`). `valueAsDate` returns a
`Date` at UTC midnight, so a model that stores local midnight needs the same conversion it needed
under `MatNativeDateModule`.

With `[(ngModel)]` or `[formControl]` the control value is the string. Keep the string in the form
model and convert at the API boundary, or use a `ControlValueAccessor`-free adapter as above.

`min` and `max` take the same ISO format and are what the picker greys out; they also feed the
native `rangeUnderflow`/`rangeOverflow` validity. They do not replace the `error` sentence on the
field: set `invalid` and `error` as with every other field.

The picker itself replaces `MatDatepicker`, `MatDatepickerToggle` and `MatNativeDateModule`. There
is no toggle element to place, no `dateFilter`, no range picker and no locale option: the browser
formats after the user's locale, and the popup is not styleable. The empty field shows the
browser's own placeholder (`dd.mm.yyyy`) in `text`, not in `text-subtle` as a real placeholder
would be; Chromium offers no hook for that colour.

## States

| State    | How it looks                                      | How to trigger it                   |
| -------- | ------------------------------------------------- | ----------------------------------- |
| Rest     | `surface` with a 1px `border-control` border      | default                             |
| Hover    | border moves to `text-muted`                      | pointer over the field              |
| Focus    | 2px ring in `focus` with 2px offset               | Tab or click, `:focus-visible`      |
| Disabled | 45 percent opacity, `cursor: not-allowed`         | native `disabled`                   |
| Readonly | looks like rest, the value cannot be edited       | native `readonly`                   |
| Error    | border in `danger`, sentence below from the field | `invalid` plus `error` on the field |

There is no loading or empty state; the placeholder in `text-subtle` covers the empty field.

## Accessibility

- The visible label comes from `z-field`; a placeholder is never a label.
- `invalid` sets `aria-invalid="true"`, which is also what the danger border hooks onto.
- Inside a `z-field` the `aria-describedby` attribute points at that field's hint or error, and
  switches to the error as soon as one is set.
- A field without a visible label, for example a filter in a toolbar, needs an `aria-label` from the
  caller.

## Responsive

Below 640px `z-input--sm` grows from `control-sm` to `control-md` (40px), so a small field in a
toolbar still meets the minimum click target. A textarea keeps its 96px minimum height and stays
resizable vertically.

## Rendered classes and tokens

| Class           | Applies when            |
| --------------- | ----------------------- |
| `z-input`       | always                  |
| `z-input--sm`   | `size="sm"`             |
| `z-input--mono` | `mono`                  |
| `z-input-wrap`  | host of `z-input-group` |

Tokens: `--control-md` and `--control-sm` for the height, `--space-3` for the padding,
`--border-control` for the border, `--radius-sm`, `--surface` and `--text` for the surface,
`--text-subtle` for the placeholder, `--text-muted` for the hover border, `--danger` for the invalid
border, `--font-mono` for `mono`, `--focus` for the ring.

## Deviations from the reference

Addition to the reference: below 640px `z-input--sm` is raised to `control-md`, because click
targets are at least 40px tall on mobile.

## Do / Don't

- Do wrap the field in a `z-field` with a visible label and give it an `id`.
- Do set `mono` on numbers, ports, addresses, file names and configuration values.
- Do pair `invalid` with an `error` sentence on the field.
- Don't rely on the placeholder as the label.
- Don't use a floating label or mark the focus with a red line; focus is the white ring.
