# Badge

Shows a status or a characteristic in one word.

## When to use

- As a **status** with dot and colour: `success` for Online or Aktiv, `warning` for a running change
  such as "Neustart läuft", `danger` for Fehlgeschlagen or Offline, `info` for something planned or
  being installed, `neutral` for Gestoppt.
- As a **tag** without a dot, always neutral: Tarif, Loader, Version, Rechte, Kategorie.

## When not to use

- As a control. A badge is never clickable.
- Above a heading as a decorative pill.
- For a state the colour alone would carry. The word is always there.

## Import

```ts
import { ZBadge } from 'zenit-ui';
```

## API

Selector: `z-badge`

| Input    | Type                                                        | Default     | Description                                                      |
| -------- | ----------------------------------------------------------- | ----------- | ---------------------------------------------------------------- |
| `status` | `'neutral' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'neutral'` | Colour of the badge. `neutral` renders without a modifier class. |
| `dot`    | `boolean`                                                   | `false`     | Shows the leading dot. Boolean attribute.                        |

No outputs, no forms support. The content is the one to three words of the badge, projected as is.

The exported type `ZBadgeStatus` is available for typing your own state field.

## Examples

The server states from the design system:

```html
<z-badge status="success" dot>Online</z-badge>
<z-badge status="warning" dot>Startet</z-badge>
<z-badge dot>Gestoppt</z-badge>
<z-badge status="info" dot>Wird installiert</z-badge>
<z-badge status="danger" dot>Fehlgeschlagen</z-badge>
```

Neutral tags without a dot, at most three per row:

```html
<z-badge>PaperMC</z-badge>
<z-badge>26.3</z-badge>
<z-badge>Tarif M</z-badge>
```

Bound to a state field:

```html
<z-badge [status]="badgeStatus()" dot>{{ statusWort() }}</z-badge>
```

```ts
import { computed, signal } from '@angular/core';
import { ZBadgeStatus } from 'zenit-ui';

const status = signal<'online' | 'gestoppt'>('online');
const badgeStatus = computed<ZBadgeStatus>(() => (status() === 'online' ? 'success' : 'neutral'));
const statusWort = computed(() => (status() === 'online' ? 'Online' : 'Gestoppt'));
```

## States

A badge is static: rest only. It has no hover, no focus and no disabled state, because it is not a
control. The state it shows changes without an animation, and the pulsing dot next to "Online" does
not exist in this system.

## Accessibility

- The badge is plain text in a coloured box. It gets no role and no live region.
- The state is written out, so a screen reader and a visitor who cannot tell the colours apart read
  the same thing.
- In a list the status always stays in the same column, so it can be scanned.

## Responsive

The badge keeps its 20px height at every width and never wraps. Below 640px the server list keeps
title and status and drops the remaining columns, so the badge stays visible.

## Rendered classes and tokens

| Class              | Applies when         |
| ------------------ | -------------------- |
| `z-badge`          | always               |
| `z-badge__dot`     | `dot` (leading span) |
| `z-badge--success` | `status="success"`   |
| `z-badge--warning` | `status="warning"`   |
| `z-badge--danger`  | `status="danger"`    |
| `z-badge--info`    | `status="info"`      |

Tokens: `--radius-sm` for the corner, `--radius-full` for the dot, `--space-1` and `--space-2` for
gap and padding, `--surface-raised` with `--text-muted` for the neutral badge, and
`--success-subtle`/`--success`, `--warning-subtle`/`--warning`, `--danger-subtle`/`--danger`,
`--info-subtle`/`--info` for the four states. The 20px height, the 6px dot and the 12px type are
literal values from the reference stylesheet.

## Do / Don't

- Do write the state as a word in normal capitalization.
- Do keep the status in the same column throughout a list.
- Do limit a row to three tags; the rest belongs on the detail page.
- Don't make a badge clickable or give it a border or a glow.
- Don't use capital letters ("ONLINE" is "Online").
- Don't use colour for a tag; colour is for a status.
