# Toggle

Switches a setting that takes effect without a save button.

## When to use

- For a server property that applies at once: PvP, whitelist, automatic backups.
- Always inside a `z-setting` row, which carries the title, the configuration key and the sentence
  on the effect.

## When not to use

- For a choice that only takes effect on submit. That is `z-checkbox`.
- For more than two options. That is `z-segment` or `z-select`.

## Import

```ts
import { ZToggle } from 'zenit-ui';
```

## API

Selector: `z-toggle`

| Input             | Type      | Default | Description                                                                                                                            |
| ----------------- | --------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `checked`         | `boolean` | `false` | Switch state, two-way bindable through `[(checked)]`. `true` is on. Also the value seen by forms.                                      |
| `disabled`        | `boolean` | `false` | Locks the toggle. Independent of the disabled state from forms; either one is enough. Boolean attribute.                               |
| `ariaLabel`       | `string`  | `''`    | `aria-label` of the switch, for a toggle without a row title. Empty writes no attribute.                                               |
| `ariaLabelledby`  | `string`  | `''`    | `aria-labelledby` of the switch, normally the `titleId` of the surrounding `z-setting`. Takes precedence over `ariaLabel`.             |
| `ariaDescribedby` | `string`  | `''`    | `aria-describedby` of the switch: the `id`s of the error or hint sentence, separated by spaces. Empty writes no attribute.             |
| `invalid`         | `boolean` | `false` | Writes `aria-invalid="true"` while `touched` holds too; no error colour. Set by `[formField]` from the field state. Boolean attribute. |
| `touched`         | `boolean` | `true`  | Gates `invalid`. Set by `[formField]`; outside Signal Forms it stays `true`. Boolean attribute.                                        |

| Output          | Payload   | Fires when                                  |
| --------------- | --------- | ------------------------------------------- |
| `checkedChange` | `boolean` | the state changes (the `model()` companion) |

No content projection: the component renders one native `<input type="checkbox" role="switch">` and
nothing else. The label belongs to the `z-setting` row around it.

Forms: has the shape of a Signal Forms `FormCheckboxControl`, so `[formField]` works and feeds
`disabled`, `invalid` and `touched`. See [Forms](../forms.md) for the three ways to bind it. It
implements `ControlValueAccessor`, so `ngModel` and `formControl` work. A `null` or
`undefined` value counts as off.

## Examples

The normal case, named by the title of its settings row:

```html
<z-setting
  title="PvP"
  key="pvp"
  description="Spieler können sich gegenseitig angreifen."
  titleId="pvp-titel"
>
  <z-toggle [(checked)]="pvp" ariaLabelledby="pvp-titel" />
</z-setting>
```

Standing alone, with its own name:

```html
<z-toggle [(checked)]="autoBackup" ariaLabel="Automatische Backups" />
```

With reactive forms and locked from the form side:

```html
<z-setting title="Whitelist" key="white-list" titleId="wl-titel">
  <z-toggle [formControl]="whitelist" ariaLabelledby="wl-titel" />
</z-setting>
```

A setting that only applies after a restart, with the alert the design system asks for:

```html
<z-alert status="warning" title="2 Änderungen greifen erst nach einem Neustart">
  PvP und maximale Spieler.
  <button zAlertAction zBtn="secondary" size="sm" type="button">Jetzt neu starten</button>
</z-alert>

<z-setting title="PvP" key="pvp" description="Wirkt erst nach einem Neustart." titleId="pvp2-titel">
  <z-toggle [(ngModel)]="pvp" ariaLabelledby="pvp2-titel" />
</z-setting>
```

## States

| State    | How it looks                                                   | How to trigger it                            |
| -------- | -------------------------------------------------------------- | -------------------------------------------- |
| Off      | `surface` with a `border-control` border, knob in `text-muted` | default                                      |
| On       | `success` fill with a dark knob                                | click, Space, or `[(checked)]="true"`        |
| Hover    | no fill change; the row around it carries the hover            | pointer over the switch                      |
| Focus    | 2px ring in `focus` with 2px offset                            | Tab, `:focus-visible`                        |
| Disabled | 45 percent opacity, `cursor: not-allowed`                      | `disabled`, or the form disables the control |

The switch is green when on, because "on" is a state and not an action; `accent` stays reserved for
buttons.

## Accessibility

- `role="switch"` makes the state readable as on or off, not as checked.
- Inside a `z-setting` row point `ariaLabelledby` at that row's `titleId`. Standing alone, pass
  `ariaLabel`. Either attribute is only written when it is not empty.
- The switch state lives directly on the native element, written in an effect, so a control that
  rejects a switch keeps element and model in sync.
- If the change only takes effect after a restart, say so in the `description` of the row and show
  an alert with "Jetzt neu starten" above the content.

## Responsive

Below 640px an invisible 40px tall strip is added around the switch, so the click target meets the
minimum while the 36 by 20px switch keeps its size.

## Rendered classes and tokens

| Class      | Applies when                |
| ---------- | --------------------------- |
| `z-toggle` | on the native input, always |

Tokens: `--border-control` for the border, `--radius-full` for the track and the knob, `--surface`
for the off state, `--success` for the on state, `--text-muted` for the knob, `--on-mc` for the knob
while on, `--focus` for the ring, `--control-md` for the mobile click target. The 36 by 20px track
and the 14px knob are literal values from the reference stylesheet.

## Deviations from the reference

Addition to the reference: below 640px a `::before` pseudo element gives the switch a 40px tall hit
area, because click targets are at least 40px tall on mobile.

## Do / Don't

- Do put the toggle in a `z-setting` row and name it through `ariaLabelledby`.
- Do write the effect of the setting as one sentence in the row.
- Do use green for on; it is a state, not an action.
- Don't use a toggle for something that needs a save button.
- Don't colour the off state; it is `surface` with `border-control`.
