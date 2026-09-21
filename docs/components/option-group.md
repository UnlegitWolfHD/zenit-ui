# OptionCard

Picks exactly one of a few options that are meant to be compared.

## When to use

- Server type, performance class, RAM step, term with a discount, payment method, monthly price
  versus flex. It is the most important control of every configurator.
- Whenever the options carry a sentence, a price or a badge that the visitor is supposed to weigh.

## When not to use

- From seven options on. Versions go into a `z-combobox`, RAM in fine steps into a `z-slider`.
- For a view switch over the same data. That is `z-segment`.
- For a yes-or-no setting. That is `z-toggle` in a `z-setting`.

## Import

```ts
import { ZOption, ZOptionGroup } from 'zenit-ui';
```

## API

Selector: `z-option-group`

| Input     | Type                  | Default | Description                                                                     |
| --------- | --------------------- | ------- | ------------------------------------------------------------------------------- |
| `legend`  | `string`              | `''`    | The question or term above the cards, rendered as the `<legend>`.               |
| `hint`    | `string`              | `''`    | Addition after the legend, in a `<small>`. Empty renders nothing.               |
| `options` | `readonly ZOption<T>[]` | `[]`  | The cards in display order, at most six. Tracked by `value`, which is unique.   |
| `value`   | `T`                   | `undefined` | The chosen `value`, two-way bindable through `[(value)]`.                   |
| `compact` | `boolean`             | `false` | Narrow cards with the title in mono, for "4 GB" or "90 Tage". Boolean attribute. |
| `disabled` | `boolean`            | `false` | Locks every card. Independent of the form's disabled state. Boolean attribute. |

| Output        | Payload  | Fires when                                                 |
| ------------- | -------- | ---------------------------------------------------------- |
| `valueChange` | `string` | another card is checked (the `model()` companion)          |

The component is generic in the type of its value: `ZOptionGroup<T extends string | number>`,
inferred from `options`, so RAM steps stay numbers and nothing is converted on the way in or out.
A radio group has no neutral member of `T`, so an unbound group starts out `undefined` and leaves
every card unchecked.

`ZOption<T>` is `{ value: T, title, description?, price?, badge?, badgeStatus?, disabled?,
disabledReason? }`. `value` is what the group reports and the tracking key, `title` the name,
`description` one sentence, `price` an amount the caller has already formatted, `badge` a short
word with `badgeStatus` (`info` by default), `disabled` locks this one card and `disabledReason`
says why.

No content projection. Forms: implements `ControlValueAccessor`, so `ngModel` and `formControl`
work alongside `[(value)]`, and it has the shape of a Signal Forms `FormValueControl<T>`, so
`[formField]` works. The group as a whole is locked through `disabled` or from the form side, a
single card through `disabled` on its option. See [Forms](../forms.md).

## Examples

Server type with a sentence per card:

```html
<z-option-group
  legend="Server-Typ"
  [options]="[
    { value: 'vanilla', title: 'Vanilla', description: 'Pures Minecraft ohne Plugins oder Mods.' },
    { value: 'plugins', title: 'Plugins', description: 'Paper oder Purpur mit Plugins.' }
  ]"
  [(value)]="typ"
/>
```

RAM as compact cards, with a recommendation and a locked step that names its reason:

```html
<z-option-group
  legend="Arbeitsspeicher"
  hint="Spielerzahlen sind Richtwerte"
  compact
  [options]="[
    { value: '2', title: '2 GB', disabled: true, disabledReason: 'zu wenig für 1.21' },
    { value: '4', title: '4 GB', description: 'etwa 10 Spieler', badge: 'Empfohlen' },
    { value: '6', title: '6 GB', description: 'etwa 15 Spieler' }
  ]"
  [(value)]="ram"
/>
```

Terms with a discount badge and the price of the term:

```html
<z-option-group
  legend="Laufzeit"
  compact
  [options]="[
    { value: '30', title: '30 Tage', price: '7,74 €' },
    { value: '90', title: '90 Tage', price: '21,83 €', badge: '−6 %', badgeStatus: 'success' }
  ]"
  [(value)]="laufzeit"
/>
```

In a reactive form, and locked through a control that is disabled. Signal Forms take
`[formField]="formular.bezahlung"` in the same place; see [Forms](../forms.md).

```html
<z-option-group legend="Bezahlmethode" [options]="methoden" [formControl]="bezahlung" />
<z-option-group legend="Bezahlmethode" [options]="methoden" [formControl]="gesperrt" />
```

## States

| State    | How it looks                                                              | How to trigger it                     |
| -------- | ------------------------------------------------------------------------- | ------------------------------------- |
| Rest     | 1px `border-control` on `surface`                                         | default                               |
| Hover    | border moves to `text-muted`                                              | pointer over a card                   |
| Focus    | 2px ring in `focus` with 2px offset on the card                           | Tab into the group                    |
| Selected | border and 1px inner outline in `accent-text`, fill `surface-raised`      | click, arrow keys, or `[(value)]`     |
| Disabled | 45 percent opacity, `cursor: not-allowed`, the reason in the card         | `disabled` on the option, or the form |

There is no loading or error state; the price of a card is a string the caller controls. An empty
`options` array renders an empty fieldset with its legend.

## Accessibility

- It is a real radio group: a `<fieldset>` with a `<legend>`, and one visually hidden
  `<input type="radio">` of the same `name` per card.
- The arrow keys move the selection, Tab enters the group once and leaves it again. None of that is
  scripted; it is what the native radios do.
- The focus ring hangs on the card through `:has(input:focus-visible)`, because the input itself is
  transparent.
- A locked card shows its reason in the card and points at it with `aria-describedby`, so the
  reason is never only a colour.
- The browser checks a radio before the caller is asked. If the caller refuses the new value, the
  group writes the model back into every radio, so the selection on screen is always the selection
  in the model. That guarantee holds where the caller owns the value: `[(value)]`, `formControl`,
  `ngModel` and `[formField]`. With a one-way `[value]` whose parent keeps its own value unchanged,
  the child's model and the DOM move anyway, because that is what `model()` does with a one-way
  binding. Bind both ways or use a form when the selection has to be refused.
- "Empfohlen" appears at most once per group, as `z-badge--info`. A discount is `z-badge--success`
  with the real minus sign U+2212.

## Responsive

The grid is `repeat(auto-fill, minmax(176px, 1fr))`, compact `minmax(104px, 1fr)`, so the cards
reflow by themselves. Below 640px a compact card is raised to 40px, because click targets are at
least 40px tall on mobile.

## Rendered classes and tokens

| Class                | Applies when                    |
| -------------------- | ------------------------------- |
| `z-options`          | on the `<fieldset>`             |
| `z-options--compact` | with `compact`                  |
| `z-options__legend`  | on the `<legend>`               |
| `z-option`           | on every card `<label>`         |
| `z-option__title`    | the name of the option          |
| `z-option__desc`     | the sentence, or the reason     |
| `z-option__price`    | the amount, in mono             |
| `z-option__badge`    | on the projected `z-badge`      |

Tokens: `--border-control` and `--text-muted` for the frame, `--accent-text` (in the Minecraft
subtheme `--mc-accent`) for the chosen card, `--surface` and `--surface-raised` for the fills,
`--focus` for the ring, `--radius-md`, `--space-2` to `--space-4`, `--font-mono` for price and
compact title. 176px, 104px and the 2px gap are literal values from the reference stylesheet.

## Deviations from the reference

- Addition to the reference: below 640px a compact card is at least `--control-md` tall and centres
  its content, because click targets are at least 40px tall on mobile.
- Addition to the reference: a group that carries badges gives its legend `--space-3` of room, so
  the badge, which sits `space-3` above its card, does not cover the legend hint at narrow widths.
- Addition to the API table: a `disabled` input, for the same reason `z-combobox` and
  `z-input-action` have one: `15-zustaende.md` asks every control for a designed disabled state, and
  forms are not the only caller.

## Do / Don't

- Do start with a default that is valid and orderable.
- Do lock what does not work and write the reason into the card, not into the summary.
- Do keep "Empfohlen" to once per group.
- Don't put icons in coloured tiles on the cards; the title is enough.
- Don
