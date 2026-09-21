# Tooltip

A short addition to a control, shown above it on hover and on focus.

## When to use

- On an icon-only button, repeating the label that is already its `aria-label`.
- To explain why a control is locked, on the element around a disabled button.

## When not to use

- For text that carries the only copy of a fact. A tooltip is not reachable on a touch device, so
  the fact also has to stand as a sentence.
- For an error, a confirmation or an explanation longer than one line. Those are the field error,
  the toast and the hint of a `z-field`.

## Import

```ts
import { ZTooltip } from 'zenit-ui';
```

## API

Selector: `[zTooltip]`

| Input      | Type     | Default | Description                                                                                                                                                                         |
| ---------- | -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `zTooltip` | `string` | `''`    | The tooltip text, given as the value of the attribute. A change while the panel is open reaches the panel. Empty means no tooltip: the panel is not opened, and an open one closes. |

No outputs, no content projection. The panel is opened in a CDK overlay, centred above the trigger
with an 8px gap and below it as the fallback position, and it is repositioned on scroll.

## Examples

On an icon-only button, next to its accessible name:

```html
<button zBtn="ghost" iconOnly type="button" aria-label="Aktualisieren" zTooltip="Aktualisieren">
  <z-icon name="refresh" />
</button>
```

On the element around a disabled button, because a disabled button fires no events:

```html
<span zTooltip="Beispiel-Server 1 ist bereits gestoppt">
  <button zBtn="secondary" type="button" disabled>Stoppen</button>
</span>
<p class="z-muted">Beispiel-Server 1 ist bereits gestoppt.</p>
```

On a button that stays focusable through `aria-disabled`, so the reason is reachable by keyboard:

```html
<button zBtn="secondary" type="button" aria-disabled="true" zTooltip="Der Server startet gerade">
  Stoppen
</button>
```

With a text that changes at runtime:

```html
<button zBtn="ghost" iconOnly type="button" aria-label="Status" [zTooltip]="grund()">
  <z-icon name="info" />
</button>
```

## States

| State  | How it looks                                                                       | How to trigger it                             |
| ------ | ---------------------------------------------------------------------------------- | --------------------------------------------- |
| Hidden | nothing in the DOM                                                                 | default, and after every close                |
| Shown  | `surface-raised` panel with a 1px `border` and `shadow-overlay`, above the trigger | pointer enters, or the trigger receives focus |
| Below  | the same panel under the trigger                                                   | there is no room above                        |

The panel closes on mouse leave, on focus loss and on Escape. An empty `zTooltip` opens no panel and
closes an open one.

## Accessibility

- The trigger carries `aria-describedby` only while the panel hangs in the DOM. A permanent
  reference would point at a missing id most of the time.
- The panel appears on pointer **and** on focus, so it is reachable with the keyboard.
- Escape closes it, as it closes every overlay in this system.
- A disabled button fires no events, so put the tooltip on the surrounding element. Repeat the same
  reason as a visible sentence: a tooltip alone is not reachable on a touch device.
- A tooltip never replaces the `aria-label` of an icon-only button. Set both.

## Responsive

The panel is capped at 240px wide and wraps its text. It flips below the trigger when there is no
room above, and the CDK repositions it on scroll, so it stays attached at every width. There is no
touch trigger: on a phone the reason has to be readable without it.

## Rendered classes and tokens

| Class       | Applies when                     |
| ----------- | -------------------------------- |
| `z-tooltip` | on the overlay panel while shown |

Tokens: `--space-1` and `--space-2` for the padding, `--border`, `--radius-sm`,
`--surface-raised` for the surface, `--shadow-overlay` as the only shadow in the system, `--text`
for the text. The 240px cap, the 12px type and the 8px gap to the trigger are literal values from
the reference stylesheet.

## Do / Don't

- Do put the tooltip on the wrapper when the control itself is `disabled`.
- Do repeat the reason as a visible sentence for touch and for screen readers.
- Do keep the text to one short line.
- Don't put a fact only in a tooltip.
- Don't use a tooltip instead of an `aria-label` on an icon-only button.
- Don't nest interactive content in the panel; it closes as soon as focus leaves the trigger.
