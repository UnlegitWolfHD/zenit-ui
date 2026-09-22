# Button

Triggers an action, on a native `<button>` or on an `<a>`.

## When to use

- `primary` for the one main action of a screen: "Server erstellen", "Ticket senden". At most one
  per screen height.
- `secondary` for every further action: "Aufladen", "Neustart", "Stoppen".
- `ghost` for cancelling and for icon actions in toolbars.
- `danger` only for irreversible actions: "Server löschen", "Hart beenden".

## When not to use

- Next to a `primary` button, if the action is destructive. A `danger` button belongs in the menu or
  in the confirmation dialog, never beside the primary action.
- For navigation that has a URL. Use `a[zBtn]` so the link keeps its `href` and its routing.

## Import

```ts
import { ZButton } from 'zenit-ui';
```

## API

Selectors: `button[zBtn]`, `a[zBtn]`

| Input      | Type                                                    | Default       | Description                                                                                                  |
| ---------- | ------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------ |
| `zBtn`     | `'primary' \| 'secondary' \| 'ghost' \| 'danger' \| ''` | `'secondary'` | Variant. The bare attribute carries the empty string, which counts as `secondary`.                           |
| `size`     | `'sm' \| 'md' \| 'lg'`                                  | `'md'`        | `sm` in toolbars, `md` everywhere, `lg` only in the hero and the closing call to action. `md` adds no class. |
| `block`    | `boolean`                                               | `false`       | Stretches the button to the full width of its container. Boolean attribute.                                  |
| `iconOnly` | `boolean`                                               | `false`       | Square button holding an icon and no text. Boolean attribute.                                                |
| `loading`  | `boolean`                                               | `false`       | Shows a spinner in front of the content, sets `aria-busy="true"` and locks the button. Boolean attribute.    |
| `disabled` | `boolean`                                               | `false`       | Locks the button. Boolean attribute.                                                                         |

No outputs. The content is projected as is; while `loading` is set a `z-spinner` sits in front of
it. No forms support: use the native `(click)` event.

The component never touches `type`. A `<button zBtn>` inside a form therefore submits it, so a
button that only triggers an action carries `type="button"` from the caller.

## Examples

The one main action, with an icon and a loading state:

```html
<button zBtn="primary" type="button" [loading]="laeuft()">
  <z-icon name="add" />Server erstellen
</button>
```

An icon-only ghost button in a toolbar, with its accessible name and a tooltip:

```html
<button zBtn="ghost" iconOnly size="sm" type="button" aria-label="Mehr" zTooltip="Weitere Aktionen">
  <z-icon name="more_vert" />
</button>
```

A link that looks like a button, and a locked one:

```html
<a zBtn routerLink="/user/server">Alle anzeigen</a>
<a zBtn routerLink="/user/neu" [disabled]="true">Server erstellen</a>
```

A full-width button in a form on a phone, and a destructive one:

```html
<button zBtn="primary" block type="submit">Bestellung abschließen</button>
<button zBtn="danger" type="button"><z-icon name="delete" />Server löschen</button>
```

## States

| State    | How it looks                                                                                                                                              | How to trigger it                                                   |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Rest     | as in the reference                                                                                                                                       | default                                                             |
| Hover    | `primary` moves to `accent-hover`, `secondary` gets `surface-hover`, `ghost` gets `surface-raised` and `text`, `danger` gets `danger-subtle`              | pointer over the button                                             |
| Focus    | 2px ring in `focus` with 2px offset                                                                                                                       | Tab, `:focus-visible` only                                          |
| Active   | same as hover, no style of its own                                                                                                                        | pressing                                                            |
| Disabled | 45 percent opacity, `cursor: not-allowed`, native `disabled`, out of the tab order                                                                        | `disabled`, alone or together with `loading`                        |
| Loading  | spinner in front of the content, 45 percent opacity, `aria-busy="true"` and `aria-disabled="true"`; keeps the focus, click, Enter and Space are swallowed | `[loading]="true"`; the label follows the action ("Wird gestartet") |

There is no error or empty state; the field or the page around the button carries those.

## Accessibility

- On a `<button>`, `disabled` sets the native `disabled` attribute, so a deliberately locked
  button leaves the tab order; the reason stands as a sentence next to it.
- `loading` locks without the native `disabled`: the button gets `aria-busy="true"` and
  `aria-disabled="true"`, stays in the tab order and keeps the focus while it spins, which is what
  the triggering button of an action needs (a native `disabled` would drop the focus to `body`).
  Click, Enter and Space are caught in the capture phase on the button, before a `(click)` of the
  caller: nothing fires and a `type="submit"` button does not submit its form. That includes the
  implicit submission from Enter in a text field, which the browser runs as a click on the default
  button. With `disabled` and `loading` both set, `disabled` wins and the lock is native.
- An `<a>` cannot be disabled natively. It gets `aria-disabled="true"` and `tabindex="-1"` instead,
  and the click is swallowed before `routerLink` sees it. A `tabindex` of the caller's own, static
  or bound, is only borrowed for that: the lock holds even while the binding writes new values, and
  the last value the caller wanted is back on the element as soon as the lock goes.
- A caller may write `aria-disabled="true"` on a `<button>` instead of `disabled`, statically or
  through `[attr.aria-disabled]`. The button then stays focusable so a tooltip can explain the
  reason, and its click, Enter and Space are swallowed as well. Repeat the reason as a sentence for
  keyboard users. The library only borrows the attribute while it locks (`loading`, a locked link):
  its `"true"` wins then, also against a binding that keeps writing, and the caller's latest value,
  or no attribute, is back when the lock goes.
- An icon-only button has no text, so the caller supplies the `aria-label`.
- The label is a verb plus its object ("Server erstellen"), not "Los" or "Zum Dashboard".

## Responsive

Below 640px a `sm` button grows from `control-sm` to `control-md` (40px), and an icon-only `sm`
button grows to 40px square, so every click target meets the minimum. The visible text size stays
the same.

## Rendered classes and tokens

| Class              | Applies when                                     |
| ------------------ | ------------------------------------------------ |
| `z-btn`            | always                                           |
| `z-btn--primary`   | `zBtn="primary"`                                 |
| `z-btn--secondary` | `zBtn="secondary"`, including the bare attribute |
| `z-btn--ghost`     | `zBtn="ghost"`                                   |
| `z-btn--danger`    | `zBtn="danger"`                                  |
| `z-btn--sm`        | `size="sm"`                                      |
| `z-btn--lg`        | `size="lg"`                                      |
| `z-btn--icon`      | `iconOnly`                                       |
| `z-btn--block`     | `block`                                          |

Tokens: `--control-sm`, `--control-md`, `--control-lg` for the height, `--space-2` to `--space-5`
for gap and padding, `--radius-md`, `--accent` with `--accent-hover` and `--on-accent` for
`primary`, `--border-control` and `--surface-hover` for `secondary`, `--text-muted` and
`--surface-raised` for `ghost`, `--danger` with `--danger-subtle` for `danger`, `--focus` for the
ring. Under `z-theme-mc` the primary button switches to `--mc-accent` with `--on-mc`.

## Deviations from the reference

- Addition to the reference: below 640px `z-btn--sm` and `z-btn--icon.z-btn--sm` are raised to
  `control-md`, because click targets are at least 40px tall on mobile.
- Deviation from the reference: the base rule that gives `button`, `input`, `select` and `textarea`
  their font and colour is written with `:where()`. The reference lists the four elements one by one
  and thereby outranks `.z-btn--primary`, `--ghost` and `--danger`; `:where()` lowers the
  specificity while the values stay the same.
- Gap in the reference, closed here: `.z-root a` outranks `.z-btn--ghost` and `.z-btn--danger`, so
  the library adds the matching rules for `a.z-btn--ghost` and `a.z-btn--danger`.

## Do / Don't

- Do write the label as a verb plus its object.
- Do set `type="button"` on every button inside a form that does not submit it.
- Do keep the loading label in the progressive form ("Wird gestartet").
- Don't put more than one `primary` button on a screen height.
- Don't place a `danger` button next to the `primary` one; move it into the menu or the dialog.
- Don't add a glow, a gradient, a `transform` on hover or capital letters.
