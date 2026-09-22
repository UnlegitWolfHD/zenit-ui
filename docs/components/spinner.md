# Spinner

Shows that something short is running, as a 16px ring.

## When to use

- Inside a button that is working. `zBtn` puts one there by itself through `loading`.
- Next to a short status line while a small piece of the page is being fetched.

## When not to use

- For a list or a table that is loading. Those use `z-skeleton`, so the layout does not jump.
- As a page-wide loading screen. Panels keep their frame and set `busy`.

## Import

```ts
import { ZSpinner } from 'zenit-ui';
```

## API

Selector: `z-spinner`

| Input   | Type     | Default | Description                                                                  |
| ------- | -------- | ------- | ---------------------------------------------------------------------------- |
| `label` | `string` | `''`    | Text announced while loading. Empty keeps the spinner decorative and hidden. |

No outputs, no content projection, no forms support. The ring is drawn entirely by the stylesheet;
the element itself stays empty.

## Examples

As a status message with its own name:

```html
<z-panel title="Auslastung" busy>
  <z-spinner label="Wird geladen" />
</z-panel>
```

Decorative, without a label, because the surrounding text already says what is happening:

```html
<p><z-spinner />Die Installation läuft.</p>
```

In a button, where `zBtn` renders the spinner for you and locks the control:

```html
<button zBtn="primary" type="button" [loading]="startet()">Wird gestartet</button>
```

## States

The spinner has one state: it spins. The rotation sits behind
`prefers-reduced-motion: no-preference`, so it stands still when the visitor asked for reduced
motion. It is the only rotating element in the system.

## Accessibility

- With a `label` the host becomes `role="status"` and carries that label as `aria-label`, so the
  message is announced politely.
- Without a label the host is `aria-hidden="true"` and purely decorative. Use that only when the
  surrounding text already reports the state.
- A `role` or an `aria-label` you write on `<z-spinner>` yourself survives, static as well as bound:
  `label` wins while it holds a value and gives the attributes back when it is empty, including a
  value your binding wrote in between. Whether the spinner is decorative is asked of the element,
  not of the static attributes, so `[attr.aria-label]="name()"` is never hidden behind
  `aria-hidden="true"`; take the name away again and the spinner is decorative as before.
- Inside a loading button the surrounding `zBtn` sets `aria-busy="true"` and disables the control.

## Responsive

Fixed 16px at every width. The button around it grows to at least 40px on a phone.

## Rendered classes and tokens

| Class       | Applies when |
| ----------- | ------------ |
| `z-spinner` | always       |

Tokens: `--radius-full` for the ring. The 16px box, the 2px border and the 0.7s rotation are literal
values taken verbatim from the reference stylesheet; the colour is `currentColor` at 80 percent
opacity, so the spinner always matches the text around it.

## Do / Don't

- Do give the spinner a `label` when it is the only sign that something is happening.
- Do let `zBtn` place the spinner inside a button instead of nesting one by hand.
- Don't use a spinner for a list; use `z-skeleton` after 300ms.
- Don't leave a spinner running with no timeout. After 10 seconds without an answer an alert with a
  retry takes its place.
