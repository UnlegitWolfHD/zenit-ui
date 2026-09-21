# Icon

Renders one Material Icons ligature at the system icon size.

## When to use

- Where an icon helps to find something again: sidebar entries, toolbars, buttons that carry an
  action, the leading mark of an alert or a toast.
- Inside a badge or a small button, at `size="sm"`.

## When not to use

- In front of headings, panel titles or facts. The word carries the meaning there.
- As the only carrier of meaning. The icon is always `aria-hidden`, so the name has to come from the
  visible text or from an `aria-label` on the surrounding control.
- With a tinted square behind it. Icons stand on the surface without a background shape.

## Import

```ts
import { ZIcon } from 'zenit-ui';
```

## API

Selector: `z-icon`

| Input  | Type           | Default  | Description                                                           |
| ------ | -------------- | -------- | --------------------------------------------------------------------- |
| `name` | `string`       | required | Material Icons ligature, for example `dns` or `restart_alt`.          |
| `size` | `'sm' \| 'md'` | `'md'`   | `md` is the 20px icon, `sm` the 16px variant. `sm` adds `z-icon--sm`. |

No outputs, no content projection, no forms support. The host renders the ligature as its own text
content, so the element stays empty in your template.

## Examples

An icon in front of the label of an action:

```html
<button zBtn="primary" type="button"><z-icon name="add" />Server erstellen</button>
```

The small size inside a badge and in a toolbar button:

```html
<z-badge status="success" dot>Online</z-badge>
<button zBtn="ghost" iconOnly size="sm" type="button" aria-label="Aktualisieren">
  <z-icon name="refresh" size="sm" />
</button>
```

Standing alone as a decoration next to a value:

```html
<span><z-icon name="dns" size="sm" />203.0.113.10:25565</span>
```

## States

The icon has no states of its own. It inherits its colour from the control around it: `text-muted`
by default, `on-accent` inside a primary button, `danger` inside a danger button, `accent-text` in
the active sidebar entry (`mc-accent` under the Minecraft subtheme) and the status colour inside an
alert or a toast.

## Accessibility

- The host always carries `aria-hidden="true"`; the icon is never announced.
- An icon-only button needs an `aria-label` from the caller.
- Never replace a word with an icon in a status: the state stays written out.

## Responsive

Size does not change with the viewport: 20px at `md`, 16px at `sm`. What grows on a phone is the
button around it, to at least 40px.

## Rendered classes and tokens

| Class            | Applies when |
| ---------------- | ------------ |
| `material-icons` | always       |
| `z-icon`         | always       |
| `z-icon--sm`     | `size="sm"`  |

Tokens: `--icon` for the box and the font size, `--text-muted` for the default colour. The `sm`
variant is a literal 16px taken verbatim from the reference stylesheet.

## Do / Don't

- Do use icons in the sidebar, in toolbars and on buttons with an action.
- Do give every icon-only control an `aria-label`.
- Don't put an icon in front of a heading, a panel title or a fact.
- Don't draw a background square behind an icon.
- Don't colour an icon outside the active sidebar entry and an alert.
