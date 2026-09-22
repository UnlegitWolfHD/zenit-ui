# EmptyState

Fills a list that has no entries yet.

## When to use

- Inside a panel whose list is empty: no servers, no tickets, no backups, an empty log.

## When not to use

- When the data is missing because of an error. That is `z-alert` with the cause and the next step.
- When the list is still loading. That is `z-skeleton` after 300ms.

## Import

```ts
import { ZEmptyState, ZEmptyAction } from 'zenit-ui';
```

## API

### `z-empty-state`

| Input   | Type     | Default | Description                                                                                 |
| ------- | -------- | ------- | ------------------------------------------------------------------------------------------- |
| `title` | `string` | `''`    | Title that names the state, for example `Keine offenen Tickets`. Empty means no title line. |
| `headingLevel` | `1 \| 2 \| 3 \| 4` | none | Makes the title an `h1` to `h4`. Unset, it stays a `span`. Set it where the empty state is a section or a page of its own; `1` for a page such as a 404. The size never changes with it. |

No outputs. Content projection:

| Slot             | Where it lands                                |
| ---------------- | --------------------------------------------- |
| default          | in `span.z-empty__body`, the helpful sentence |
| `[zEmptyAction]` | after the text, the single button             |

### `[zEmptyAction]`

Marker directive for the one action: a secondary button for the first entry. It stays secondary even
when the page header already shows a primary button for the same action. It adds no markup and no
classes of its own.

## Examples

An empty ticket list:

```html
<z-panel title="Tickets" flush>
  <z-empty-state title="Keine offenen Tickets">
    Wir antworten in der Regel innerhalb von 24 Stunden, auf Discord oft schneller.
    <button zEmptyAction zBtn="secondary" type="button">Ticket erstellen</button>
  </z-empty-state>
</z-panel>
```

An empty server list, next to a page header that already carries the primary button:

```html
<z-page-header title="Gameserver" sub="0 Server">
  <button zBtn="primary" type="button">Server erstellen</button>
</z-page-header>
<z-panel title="Meine Server" flush>
  <z-empty-state title="Noch kein Server">
    Ein Server ist in etwa 60 Sekunden startklar. Ab 1,98&nbsp;€ im Monat.
    <button zEmptyAction zBtn="secondary" type="button">Server erstellen</button>
  </z-empty-state>
</z-panel>
```

Without an action, when there is nothing to do:

```html
<z-empty-state title="Keine Abstürze"> Der Server läuft seit 2 Tagen ohne Absturz. </z-empty-state>
```

Inside a stopped console, where the log itself is the empty area:

```html
<z-console [lines]="[]" disabled placeholder="Der Server ist gestoppt">
  <z-empty-state title="Der Server ist gestoppt">
    Starte ihn, um das Log zu sehen.
    <button zEmptyAction zBtn="secondary" type="button">Server starten</button>
  </z-empty-state>
</z-console>
```

A page that is nothing but this state, the 404, with the title as its `<h1>`:

```html
<z-empty-state title="Seite nicht gefunden" headingLevel="1">
  Die Adresse gibt es nicht. Prüfe den Link oder geh zur Startseite.
  <a zEmptyAction zBtn="secondary" routerLink="/">Zur Startseite</a>
</z-empty-state>
```

## States

The empty state is itself a state: it is what a panel shows instead of its rows. It has no hover,
focus or disabled state; the button inside it does.

What it is not: a list that is loading shows skeleton rows, and data that is missing because of an
error shows an alert. Below an empty or short list the page stays useful, for example by showing the
load of the running servers.

## Accessibility

- The title and the sentence are plain text, read in document order. The component adds no role and
  no live region.
- Inside a panel the title stays a `span`: the panel title is the heading of that block. Where the
  empty state stands on its own, `headingLevel` makes its title a real heading, so the page keeps a
  heading outline without a hidden `<h1>`. Pick the level that follows the heading above it.
- There is no large grey icon, so nothing has to be hidden from assistive technology.
- The native `title` attribute is suppressed on the host, so the browser shows no tooltip of its own
  because of the `title` input.

## Responsive

The block is a centred grid with `space-7` above and below, so it keeps the panel from collapsing at
every width. The body text is capped at 40 characters per line, which keeps it readable on a wide
screen.

## Rendered classes and tokens

| Class            | Applies when         |
| ---------------- | -------------------- |
| `z-empty`        | on the host, always  |
| `z-empty__title` | `title` is not empty (`span`, or `h1` to `h4` with `headingLevel`) |
| `z-empty__body`  | always               |

Tokens: `--space-2`, `--space-4` and `--space-7` for gaps and padding, `--text-muted` for the body
text. The 40 character measure of the body is a literal value from the reference stylesheet.

## Do / Don't

- Do name the state in the title ("Keine offenen Tickets").
- Do add one sentence that helps the visitor on, with a concrete number where there is one.
- Do keep the action secondary, even when the page header shows the same action as primary.
- Don't show a large grey icon; the text carries the state.
- Don't show pagination or filters next to an empty list.
- Don't use an empty state for data that failed to load; that is an alert.
