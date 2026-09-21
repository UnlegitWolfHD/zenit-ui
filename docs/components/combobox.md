# Combobox

Picks one value out of a long list by typing and filtering.

## When to use

- Minecraft version, modpack, Java version, a game from about fifteen on.
- Wherever a select would hold more entries than fit on a screen.

## When not to use

- Up to six options that are meant to be compared. That is `z-option-group`.
- A short fixed list without filtering. That is `z-select`.

## Import

```ts
import { ZCombobox, ZComboOption } from 'zenit-ui';
```

## API

Selector: `z-combobox`

| Input            | Type                      | Default | Description                                                                   |
| ---------------- | ------------------------- | ------- | ----------------------------------------------------------------------------- |
| `options`        | `readonly ZComboOption[]` | `[]`    | The entries in display order. Tracked by `value`, which has to be unique.     |
| `value`          | `string`                  | `''`    | The chosen `value`, two-way bindable through `[(value)]`.                     |
| `placeholder`    | `string`                  | `''`    | Placeholder of the empty field. Never the label.                              |
| `emptyText`      | `string`                  | `''`    | The one line shown when nothing matches. Empty falls back to `comboboxEmpty`. |
| `inputId`        | `string`                  | `''`    | `id` of the input; what a surrounding `z-field` points its `for` at.          |
| `ariaLabel`      | `string`                  | `''`    | Accessible name where there is no `z-field` around it.                        |
| `ariaLabelledby` | `string`                  | `''`    | `id` of the element that names the field, instead of `ariaLabel`.             |
| `disabled`       | `boolean`                 | `false` | Locks the field. Independent of the form's disabled state. Boolean attribute. |

| Output        | Payload  | Fires when                                  |
| ------------- | -------- | ------------------------------------------- |
| `valueChange` | `string` | an entry is taken (the `model()` companion) |

`ZComboOption` is `{ value, label, note?, group? }`: `label` is what the entry reads as and what
stands in the field once it is chosen, `note` a consequence such as the minimum RAM, shown in a
`<small>` and searched along with the label, `group` a heading such as "Aktuell" or "Snapshots".

No content projection. Forms: implements `ControlValueAccessor` and has the shape of a Signal Forms
`FormValueControl<string>`. See [Forms](../forms.md).

## Examples

In a `z-field`, which is where the label and the hint come from:

```html
<z-field label="Minecraft-Version" for="cb-version" hint="Tippen filtert die Liste.">
  <z-combobox
    inputId="cb-version"
    [options]="versionen"
    [(value)]="version"
    emptyText="Keine Version gefunden"
  />
</z-field>
```

The entries, with headings and the consequence of each:

```ts
import { ZComboOption } from 'zenit-ui';

const versionen: ZComboOption[] = [
  { value: 'neueste', label: 'Neueste', note: 'mindestens 4 GB', group: 'Aktuell' },
  { value: '1.20.1', label: '1.20.1', note: 'mindestens 2 GB', group: 'Ältere' },
  { value: '25w14a', label: '25w14a', note: 'mindestens 6 GB', group: 'Snapshots' },
];
```

Standing alone with a name of its own, and in a reactive form. Signal Forms take
`[formField]="formular.java"` in the same place; see [Forms](../forms.md).

```html
<z-combobox ariaLabel="Java-Version" [options]="javaVersionen" [(value)]="java" />
<z-combobox inputId="cb-java" [options]="javaVersionen" [formControl]="java" />
```

## States

| State    | How it looks                                           | How to trigger it              |
| -------- | ------------------------------------------------------ | ------------------------------ |
| Rest     | a `z-input` with the chevron of `.z-combo::after`      | default                        |
| Focus    | 2px ring in `focus` with 2px offset on the field       | Tab                            |
| Open     | panel in `surface-raised` with `shadow-overlay`        | arrow keys, typing, or a click |
| Active   | the walked entry gets `surface-hover`                  | arrow keys, Home, End, hover   |
| Selected | the chosen entry is bold and carries a check           | `[(value)]`                    |
| Empty    | one `.z-listbox__empty` row instead of an empty panel  | a filter that matches nothing  |
| Disabled | field and chevron at 45 percent, `cursor: not-allowed` | `disabled`, or the form        |

There is no loading state. An error belongs on the surrounding `z-field`.

## Accessibility

- The editable combobox pattern of the ARIA practices: the input carries `role="combobox"`,
  `aria-expanded`, `aria-controls`, `aria-autocomplete="list"` and `aria-activedescendant`; the
  panel is the `role="listbox"`, a heading a `role="group"` with its name.
- **The focus never leaves the input.** Arrow keys, Home and End move the active entry, Enter takes
  it, Escape closes without clearing the field, Tab closes and moves on. A click on an entry keeps
  the focus because the component cancels the `mousedown`.
- Leaving the field with text that matches nothing puts the chosen label back, so the field never
  shows a value that is not the value.
- The component has no visible label of its own. Give it `inputId` inside a `z-field`, or
  `ariaLabel`/`ariaLabelledby` outside one; inside a `z-field` it also picks up that field's
  `aria-describedby` for hint and error.
- No match renders one row instead of an empty panel, as a locked `role="option"`, so the listbox
  keeps a valid child and the sentence is announced.
- A visually hidden `role="status"` beside the field carries the number of matches, or the empty
  sentence. It is always in the markup and only its text changes, which is the one way a screen
  reader hears the size of a list it cannot see.
- `aria-controls` is only present while the panel is: a reference to a missing id is worse than
  none.
- While the panel is open Escape belongs to the panel and stops there, so a dialog around the
  field does not close along with it.
- Entries of the same `group` land under one heading whatever their order in `options`, so a name
  never appears twice.
- The panel belongs to its field: scrolling the page or an inner container such as a dialog body
  moves it along, and it closes once the field is out of that container, so the list never points
  at something that is no longer there. Scrolling inside the list itself changes nothing.

## Responsive

The panel is as wide as the field, opens below it and above it when there is no room, is at most
248px tall and scrolls. Below 640px an entry is raised from 36px to 40px.

## Rendered classes and tokens

| Class                       | Applies when                 |
| --------------------------- | ---------------------------- |
| `z-combo`                   | the wrapper around the input |
| `z-listbox`                 | the panel in the overlay     |
| `z-listbox__group`          | a heading row                |
| `z-listbox__option`         | every entry                  |
| `z-listbox__option--active` | the entry the keyboard is on |
| `z-listbox__empty`          | the no-match row             |

Tokens: `--surface-raised` and `--shadow-overlay` for the panel like `z-menu`, `--surface-hover`
for the active entry, `--border` for the frame, `--text-muted` for headings and notes,
`--radius-md` and `--radius-sm`, `--font-mono` for the values. 248px, 36px, the 7px chevron and its
1.5px stroke are literal values from the reference stylesheet.

## Deviations from the reference

- Addition to the reference: `.z-combo-pane .z-listbox` takes the width the component measures off
  the field, because a CDK overlay pane has no width of its own.
- Addition to the reference: `.z-combo:has(.z-input:disabled)::after` dims the chevron, which would
  otherwise stand at full strength next to a field at 45 percent.
- Addition to the reference: below 640px `.z-listbox__option` is at least `--control-md` tall.
- The whole panel cancels its `mousedown`, not only an entry: the scrollbar, a heading and the
  empty row are part of it too, and each of them would otherwise take the focus out of the field.
- Addition to the reference: while the panel is open the component listens for `scroll` on the
  document in the capture phase. The panel follows the field whenever anything around it scrolls,
  and closes once the field has left the container that moved. The CDK scroll strategies all run
  on `ScrollDispatcher`, which hears the page and containers marked `cdkScrollable` and nothing
  else, so a field inside a scrolling dialog body kept a panel hanging where the field no longer
  was. Capture hears every scroller without asking a caller to annotate its container. The panel
  also follows the width of the field on a window resize.

## Do / Don't

- Do preselect a real value ("Neueste"), never an empty field.
- Do put the consequence of an entry in its `note`, so it does not surface first in the summary.
- Do group pre-releases and snapshots instead of adding switches for them.
- Don't build a tile grid in a scroll box for a hundred versions.
- Don't clear the field on Escape.
- Don't move the focus into the panel.
