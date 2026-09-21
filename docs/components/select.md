# Select

Wraps a native `<select>` so it looks like an input.

## When to use

- For a value out of a short, fixed list: status filters, regions, versions, loaders.
- In a filter row, at `size="sm"`, next to the search box.

## When not to use

- For up to four options that are meant to be compared side by side. That is `z-segment`.
- From about 15 options on. Then the list needs a search field instead.
- For a yes or no that takes effect at once. That is `z-toggle`.

## Import

```ts
import { ZSelect } from 'zenit-ui';
```

## API

Selector: `z-select`

| Input  | Type           | Default | Description                                                |
| ------ | -------------- | ------- | ---------------------------------------------------------- |
| `size` | `'sm' \| 'md'` | `'md'`  | `md` for forms, `sm` for filter rows. Adds `z-select--sm`. |

No outputs, no forms support of its own. The content is a native `<select>`, which keeps its own
`(change)`, `ngModel` and `formControl`.

The select stays native because of keyboard handling, screen readers and the system wheel on mobile
devices. The component only draws the surface and the arrow.

## Examples

A status filter, with the normal case as the first option:

```html
<z-field label="Status" for="sel-status">
  <z-select>
    <select id="sel-status">
      <option>Alle Status</option>
      <option>Online</option>
      <option>Gestoppt</option>
      <option>Fehlgeschlagen</option>
    </select>
  </z-select>
</z-field>
```

A small select in a filter row, next to the search box:

```html
<z-select size="sm">
  <select aria-label="Sortierung">
    <option>Zuletzt geändert</option>
    <option>Name</option>
  </select>
</z-select>
```

Bound to a form control:

```html
<z-select>
  <select id="sel-loader" [formControl]="loader">
    <option value="paper">PaperMC</option>
    <option value="fabric">Fabric</option>
  </select>
</z-select>
```

A select in error: the caller sets `aria-invalid` on the native `<select>`, the same way
`input[zInput]` takes `invalid`. `z-field` adds the sentence and wires `aria-describedby`:

```html
<z-field label="Zahlungsmittel" for="sel-pay" error="Wähle ein Zahlungsmittel, sonst lässt sich das Guthaben nicht aufladen.">
  <z-select>
    <select id="sel-pay" aria-invalid="true">
      <option>Bitte wählen</option>
      <option>PayPal</option>
    </select>
  </z-select>
</z-field>
```

A disabled select, with the reason next to it:

```html
<z-field
  label="Region"
  for="sel-region"
  hint="Der Standort lässt sich nach der Bestellung nicht ändern."
>
  <z-select>
    <select id="sel-region" disabled>
      <option>Nürnberg</option>
    </select>
  </z-select>
</z-field>
```

## States

| State    | How it looks                                                        | How to trigger it            |
| -------- | ------------------------------------------------------------------- | ---------------------------- |
| Rest     | `surface` with a 1px `border-control` border, arrow in `text-muted` | default                      |
| Hover    | border moves to `text-muted`                                        | pointer over the control     |
| Focus    | 2px ring in `focus` with 2px offset                                 | Tab, `:focus-visible`        |
| Open     | the browser's own option list                                       | click or Space               |
| Error    | 1px border in `danger`, sentence below it from `z-field`            | `aria-invalid="true"` on the `<select>` |
| Disabled | 45 percent opacity, `cursor: not-allowed`                           | `disabled` on the `<select>` |

The error state is set by the caller, not by the component: `aria-invalid="true"` goes on the native
`<select>`, exactly as `invalid` goes on `input[zInput]`. `z-field` owns the sentence below it and
the `aria-describedby` that points at it.

## Accessibility

- The visible label comes from `z-field`, tied through `for` and the `id` of the `<select>`.
- Inside a `z-field` the projected `<select>` receives that field's `aria-describedby`, pointing at
  the hint or the error, and it is kept in sync after every content check, so a `<select>` that
  appears later behind an `@if` is wired too.
- A select without a visible label, for example in a filter row, needs an `aria-label`.
- `aria-invalid="true"` announces the error and draws the border; the sentence in `z-field` names
  the cause and the next step, so colour is never the only carrier.
- The first option names the normal case ("Alle Status"), not "Bitte wählen".

## Responsive

Below 640px `z-select--sm` grows from `control-sm` to `control-md` (40px). Filter rows break into
two columns below 640px. The sidebar uses the same surface for its select below 900px.

## Rendered classes and tokens

| Class          | Applies when  |
| -------------- | ------------- |
| `z-select`     | always (host) |
| `z-select--sm` | `size="sm"`   |

The `<select>` in error carries no class of its own; the rule hangs off its `aria-invalid`.

The inner `<select>` shares its rules with `.z-input`. Tokens: `--control-md`, `--control-sm`,
`--space-3`, `--border-control`, `--radius-sm`, `--surface`, `--text`, `--text-muted` for the arrow
and the hover border, `--focus` for the ring. The arrow itself is a 7px box with 1.5px borders, a
literal value from the reference stylesheet.

## Deviations from the reference

- Addition to the reference: below 640px `z-select--sm select` is raised to `control-md`, because
  click targets are at least 40px tall on mobile.
- Addition to the reference: `.z-select select[aria-invalid="true"]` takes a `danger` border.
  `bundle.css` styles `.z-input[aria-invalid="true"]` only, while `15-zustaende.md` asks every field
  in error for a `danger` border plus the sentence below it, the select included. Same single
  declaration as the input, so both fields read alike. `--danger` on `--surface` is guarded at 4.5:1
  in every scheme by `tools/check-theme-contrast.mjs`, well over the 3:1 a border needs.

## Do / Don't

- Do keep the `<select>` native and let the browser render the option list.
- Do name the normal case in the first option.
- Do use `size="sm"` in filter rows and `md` in forms.
- Do set `aria-invalid="true"` on the `<select>` itself when the field is in error.
- Don't reach for a select when four comparable options would read better as a segment.
- Don't build a custom dropdown; the native control carries keyboard, screen reader and mobile
  behaviour for free.
