# ServerList

The row pattern for everything the customer owns: servers, domains, tickets, payment methods,
files.

## When to use

- For a list of objects where each row leads to a detail page.
- Wherever status, plan and cost have to line up in fixed columns.

## When not to use

- For several equal columns with bulk actions, such as a file manager or a list of invoices. That is
  `z-table-container` with `table[zTable]`.
- For a settings list. That is `z-setting`.

## Import

```ts
import { ZRows, ZRowsHead, ZRow, ZRowMain, ZRowNum } from 'zenit-ui';
```

## API

### `z-rows`

| Input     | Type     | Default | Description                                                                                                                      |
| --------- | -------- | ------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `columns` | `string` | `''`    | Value for `grid-template-columns`, shared by head and rows through the custom property `--z-cols`. Empty keeps the default grid. |

### `z-rows-head`

No inputs, no outputs. The column head; the content is one element per column.

### `a[zRow]`, `div[zRow]`

No inputs, no outputs. As an `<a>` the whole row is the link to the detail page and brings its own
focus ring and keyboard handling. As a `<div>` the row is not clickable and holds its own actions,
each of which is a tab stop of its own.

### `z-row-main`

| Input   | Type     | Default | Description                                                                               |
| ------- | -------- | ------- | ----------------------------------------------------------------------------------------- |
| `title` | `string` | `''`    | Name of the entry. Without an image its first character, uppercased, fills the thumbnail. |
| `meta`  | `string` | `''`    | One line under the title with game, version and address. Empty leaves it out.             |
| `image` | `string` | `''`    | URL of the thumbnail. Empty falls back to the initial of the title.                       |

### `[zRowNum]`

No inputs. Amount or number inside a row: right-aligned in the mono face.

## Examples

The server list of the dashboard, with a shared column grid:

```html
<z-rows columns="minmax(0, 2fr) 128px minmax(0, 1fr) 96px 20px">
  <z-rows-head>
    <span>Server</span>
    <span>Status</span>
    <span>Tarif</span>
    <span style="text-align: right">Bisher</span>
    <span></span>
  </z-rows-head>
  <a zRow routerLink="/user/server/1">
    <z-row-main title="Beispiel-Server 1" meta="Minecraft · PaperMC 26.3 · 203.0.113.10" />
    <span><z-badge status="success" dot>Online</z-badge></span>
    <span>Tarif M</span>
    <span zRowNum>0,90&nbsp;€</span>
    <z-icon name="chevron_right" />
  </a>
  <a zRow routerLink="/user/server/2">
    <z-row-main title="Test" meta="Valheim · 203.0.113.11" />
    <span><z-badge dot>Gestoppt</z-badge></span>
    <span>Tarif S</span>
    <span zRowNum>0,12&nbsp;€</span>
    <z-icon name="chevron_right" />
  </a>
</z-rows>
```

A row that is not a link, with its own actions as separate tab stops:

```html
<z-rows columns="minmax(0, 2fr) 128px 80px">
  <div zRow>
    <z-row-main title="Visa, endet auf 4242" meta="Läuft ab 09/2028" />
    <span><z-badge status="success" dot>Standard</z-badge></span>
    <button zBtn="ghost" iconOnly size="sm" type="button" aria-label="Zahlungsmittel entfernen">
      <z-icon name="delete" />
    </button>
  </div>
</z-rows>
```

The loading state, with skeleton rows in the same grid:

```html
<z-panel title="Meine Server" busy aria-label="Server werden geladen" flush>
  <z-rows columns="minmax(0, 2fr) 128px 40px">
    <div zRow>
      <z-skeleton thumb />
      <z-skeleton width="40%" />
      <z-skeleton width="64px" />
    </div>
  </z-rows>
</z-panel>
```

The empty state and the error state:

```html
<z-panel title="Meine Server" flush>
  <z-empty-state title="Noch kein Server">
    Ein Server ist in etwa 60 Sekunden startklar.
    <button zEmptyAction zBtn="secondary" type="button">Server erstellen</button>
  </z-empty-state>
</z-panel>

<z-panel title="Meine Server" flush>
  <z-alert status="danger" title="Liste konnte nicht geladen werden" icon="error">
    Die Verbindung zum Panel ist abgebrochen. Lade die Seite neu.
    <button zAlertAction zBtn="secondary" size="sm" type="button">Erneut versuchen</button>
  </z-alert>
</z-panel>
```

With a thumbnail image instead of the initial:

```html
<a zRow routerLink="/user/server/3">
  <z-row-main title="Rust" meta="Rust · 203.0.113.12" image="/covers/rust.jpg" />
</a>
```

## States

| State   | How it looks                                                   | How to trigger it                          |
| ------- | -------------------------------------------------------------- | ------------------------------------------ |
| Rest    | 1px `border` between the rows                                  | default                                    |
| Hover   | the whole row turns `surface-raised`                           | pointer over the row                       |
| Focus   | 2px ring in `focus` with 2px offset around the link row        | Tab, `:focus-visible`                      |
| Loading | skeleton rows in the same grid, `aria-busy` on the panel       | `busy` on the panel plus `z-skeleton` rows |
| Empty   | `z-empty-state` instead of the rows, no pagination, no filters | render the empty state                     |
| Error   | `z-alert` with the cause and the next step                     | render the alert                           |

A `div[zRow]` has no hover cursor; it is not clickable. There is no disabled state for a row: a row
the customer cannot open is left out.

## Accessibility

- A row as an `<a>` is one link, so the title and the meta line are read as its accessible text. The
  thumbnail image carries an empty `alt`.
- Actions inside a row are separate tab stops with their own `aria-label`.
- The column head disappears below 640px, so it must never hold the only copy of a fact. Repeat the
  fact in the row or in the meta line.
- The status always stands as a word inside its badge, never as colour alone.

## Responsive

Below 640px the head is hidden and the grid collapses to two columns: title and status. Every
column from the third on is hidden, so the rest of the facts move to the detail page. The page
itself never scrolls sideways.

## Rendered classes and tokens

| Class          | Applies when        |
| -------------- | ------------------- |
| `z-rows`       | on the list host    |
| `z-rows__head` | on the column head  |
| `z-row`        | on each row         |
| `z-row__main`  | on `z-row-main`     |
| `z-row__thumb` | inside `z-row-main` |
| `z-row__text`  | inside `z-row-main` |
| `z-row__title` | inside `z-row-main` |
| `z-row__meta`  | `meta` is not empty |
| `z-row__num`   | on `[zRowNum]`      |

Tokens: `--space-2` to `--space-4` for padding and gaps, `--border` for the lines,
`--surface-raised` for hover, `--surface-hover` and `--font-display` for the thumbnail fallback,
`--text-subtle` for head and meta, `--font-mono` for the numbers, `--radius-sm` for the thumbnail,
`--focus` for the ring. The 32px thumbnail, the 12px head type and the default grid
`minmax(0, 2fr) 128px minmax(0, 1fr) 96px 20px` are literal values from the reference stylesheet.

## Deviations from the reference

- Addition to the reference: `div.z-row` gets `cursor: auto`, because a row that is not a link is
  not clickable.
- Addition to the library: `.z-row__text` carries `min-width: 0`, which replaces the inline style
  the reference preview put on the text block of the row, and `.z-row__thumb img` fills the
  thumbnail the same way `.z-game__cover img` does.

## Do / Don't

- Do set `columns` on `z-rows`; head and rows then share one grid.
- Do keep the status in the second column throughout.
- Do right-align amounts with `zRowNum`.
- Don't put a fact only in the column head; it disappears below 640px.
- Don't nest a clickable control inside an `a[zRow]` without making it a tab stop of its own.
- Don't change the border or move the row on hover; hover colours the whole row.
