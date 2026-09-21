# PageHeader

Opens every page of the customer area: title on the left, actions on the right.

## When to use

- As the first element of a page in the customer area, above the panels.

## When not to use

- On a public page. That is `z-hero`.
- As a panel header. That is the `title` input of `z-panel`.

## Import

```ts
import { ZPageHeader } from 'zenit-ui';
```

## API

Selector: `z-page-header`

| Input   | Type     | Default | Description                                                                                           |
| ------- | -------- | ------- | ----------------------------------------------------------------------------------------------------- |
| `title` | `string` | `''`    | Page title, rendered as the page `<h1>`. Use the same wording as the navigation link that leads here. |
| `sub`   | `string` | `''`    | One line with the most important fact of the page. Empty leaves the line out.                         |

No outputs. Content projection: the actions, at most two buttons, one of them primary.

## Examples

Title, the fact of the page, and two actions:

```html
<z-page-header title="Gameserver" sub="3 Server, 2 online">
  <button zBtn="secondary" type="button">Bestellungen</button>
  <button zBtn="primary" type="button"><z-icon name="add" />Server erstellen</button>
</z-page-header>
```

Only a title, which is the usual case for a detail page:

```html
<z-page-header title="Abrechnung" />
```

With one action and no second line:

```html
<z-page-header title="Support">
  <button zBtn="primary" type="button">Ticket erstellen</button>
</z-page-header>
```

The usual page layout: header, `space-6`, then the panels:

```html
<z-page-header title="Dashboard" sub="Guthaben 25,00 €" />
<div class="z-stack">
  <z-panel title="Meine Server" flush>
    <z-rows></z-rows>
  </z-panel>
</div>
```

## States

The header is static. What has states are the buttons inside it. There is no loading, error or
empty state: a page that is still loading keeps its header and shows the loading state in the panels
below.

## Accessibility

- `title` is the page `<h1>`. There is exactly one per page, and the panel titles below it are
  `<h3>`.
- `sub` is a `<p>` under the title, so it is read right after it.
- The native `title` attribute is cleared on the host, so the `title` input never turns into a
  browser tooltip over the whole header.
- Page title and navigation link say the same thing, so a visitor can tell they arrived.

## Responsive

The row is a flex line that wraps. Below 640px the actions move under the title. The action buttons
are already `control-md` tall, so no mobile height adjustment is needed.

## Rendered classes and tokens

| Class                 | Applies when            |
| --------------------- | ----------------------- |
| `z-pagehead`          | on the host, always     |
| `z-pagehead__title`   | on the `<h1>`, always   |
| `z-pagehead__sub`     | `sub` is not empty      |
| `z-pagehead__actions` | on the action container |

Tokens: `--space-1`, `--space-2` and `--space-4` for the gaps, `--font-display` for the title,
`--text-muted` for the second line. The 28px/34px title is the `heading-1` style, a literal value
from the reference stylesheet. The distance to the content below is `space-6` and comes from the
page layout, not from the component.

## Do / Don't

- Do name the page exactly as the navigation link that leads to it.
- Do put the most important fact of the page in `sub`, as a number with its unit.
- Do keep to at most two buttons, one of them primary.
- Don't add a small overline above the title; the navigation already says where you are.
- Don't greet the visitor in the title; "Dashboard" is the title, the name sits on the avatar.
