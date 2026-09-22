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
with an 8px gap and below it as the fallback position.

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

The panel closes on mouse leave, on focus loss, on Escape and on a scroll under it. An empty
`zTooltip` opens no panel and closes an open one.

## Scrolling

A scroll of a container the trigger sits in takes the panel back, the way the native `title` tooltip
goes: a panel that lags behind its trigger is worse than none. That holds for the page as well as
for an inner container, the body of a scrolling dialog or a scroll container of your own. Another
scroller on the same screen does not: a console that follows its own log scrolls on every line, and
the tooltip in the panel header above it has to stay.

While the trigger holds the focus the panel stays instead and follows the scroll, because WCAG 2.1
SC 1.4.13 asks the content to stand as long as hover or focus is on the trigger. It steps aside
while the scroller covers the trigger and comes back once the trigger can be seen again, which is
what a keyboard user needs: the browser scrolls a control into view as it is focused, and with
smooth scrolling that takes about a second.

The directive listens for `scroll` on the document in the capture phase. `ScrollDispatcher` of the
CDK, which the `reposition` strategy builds on, only hears the window and containers marked
`cdkScrollable`, so a tooltip inside an unannotated container used to stand still while its trigger
moved away under it. The capture listener runs only while the panel stands and needs no annotation
on any container; an event that leaves the trigger box exactly where it was, the late report of the
scroll that brought the trigger into view for example, changes nothing.

## Accessibility

- The id of the panel is one token in `aria-describedby` of the trigger while the panel hangs in the
  DOM, and it is taken out again afterwards: a permanent reference would point at a missing id most
  of the time. Whatever the trigger already carries there stays, the hint and the error that a
  `z-field` links to its control for example, and it stays even when the field rewrites the
  attribute while the panel stands.
- The panel appears on pointer **and** on focus, so it is reachable with the keyboard.
- Escape closes it, and only it: the key stops at the tooltip, so a dialog behind it takes a second
  Escape (WAI-ARIA Practices). Without an open panel the key belongs to whatever is below. One
  layer per key: a trigger that carries a tooltip and a menu inside a dialog takes four Escapes,
  because the tooltip shows itself again as soon as the focus is back on the trigger.
- A disabled button fires no events, so put the tooltip on the surrounding element. Repeat the same
  reason as a visible sentence: a tooltip alone is not reachable on a touch device.
- A tooltip never replaces the `aria-label` of an icon-only button. Set both.
- A scroll takes the panel back, but not while the trigger holds the focus (SC 1.4.13 "Persistent"):
  there it follows the trigger and comes back after it, because the browser itself scrolls a focused
  control into view.

## Responsive

The panel is capped at 240px wide and wraps its text. It flips below the trigger when there is no
room above, so it stays attached at every width. There is no
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
