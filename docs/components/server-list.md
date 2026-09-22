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
import { ZRows, ZRowsHead, ZRow, ZRowMain, ZRowNum, ZRowTitle, ZRowThumb, ZRowLink, ZRowAction } from 'zenit-ui';
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

| Input       | Type      | Default | Description                                                                                                                       |
| ----------- | --------- | ------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `title`     | `string`  | `''`    | Name of the entry. Without an image and without `thumbText` its first character, uppercased, fills the thumbnail.                 |
| `meta`      | `string`  | `''`    | One line under the title with game, version and address. Empty leaves it out.                                                     |
| `image`     | `string`  | `''`    | URL of the thumbnail. Empty falls back to the initial, and so does a URL that fails to load.                                      |
| `thumbText` | `string`  | `''`    | Text whose first character, uppercased, fills the thumbnail without an image, for example the game of a server. Empty takes `title`. |
| `thumb`     | `boolean` | `true`  | Shows the thumbnail. `false` leaves `.z-row__thumb` out and the row starts with its title.                                         |

Content projection:

| Slot          | Where it lands                                                     |
| ------------- | ------------------------------------------------------------------ |
| `[zRowTitle]` | in `.z-row__title`, in place of the text of the `title` input      |
| `[zRowMeta]`  | under the title, in place of the line the `meta` input would render |
| `[zRowThumb]` | in `.z-row__thumb`, in place of the image and the initial          |

`title` keeps feeding the initial of the thumbnail unless `thumbText` is set, so it stays set even
when `[zRowTitle]` renders the visible title.

An `image` that fails to load needs no handling: the thumbnail drops into the initial of a missing
image, so no broken-image icon is ever shown, and a new URL is tried again.

### `[zRowTitle]`

Pure slot marker for the title of a row. It adds no class and no markup, and exists so a link can
sit in the title. Without it the row falls back to the `title` input.

### `[zRowMeta]`

No inputs, no outputs. Adds `z-row__meta` and takes the place of the `meta` input, for a meta line
that is more than plain text: an address, a port or a file name inside it carries `z-mono` while the
rest of the line stays in the body face, as CLAUDE.md asks. Use a block element, because the meta
line clips with an ellipsis, which an inline element cannot do. Setting both `meta` and `[zRowMeta]`
renders two lines, so pick one.

### `[zRowThumb]`

Pure slot marker for an own medium in the thumbnail, an icon or an image the caller renders itself.
It adds no class and no markup and replaces both `image` and the initial. The thumbnail keeps its
32px box, its `radius-sm` and its `surface-hover` fill; an `<img>` in the slot fills it the same way
the `image` does. With `thumb` set to `false` the slot is not rendered either. The thumbnail is
`aria-hidden`, so whatever the slot holds is decoration and its information has to stand as text in
`[zRowMeta]` as well. Nothing focusable goes into the slot, no link, button or input: it would stay
a tab stop inside `aria-hidden` (axe `aria-hidden-focus`). A slot element inside an `@if` is fine;
while the condition is false the row shows image or initial.

### `a[zRowLink]`

No inputs, no outputs. The stretched link of a row: it sits on the title, carries the class
`z-row__link`, and its `::after` covers the whole row, so the row is one link with one tab stop
while staying a `<div>` that may hold buttons. Everything else in the row lies under that overlay
and needs `[zRowAction]` to stay clickable.

### `[zRowAction]`

No inputs, no outputs. Adds `z-row__action`, which lifts an action above the stretched link overlay
so it stays clickable and keeps its own tab stop. An icon-only action needs its own `aria-label`.

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

A row that is both a link and holds its own action. A `<button>` inside an `<a>` is invalid markup,
so the row stays a `<div>`, the link sits on the title and stretches over the row, and the action
lies above that overlay. The meta line comes from `[zRowMeta]` here, so the address can take the
mono face:

```html
<z-rows columns="minmax(0, 2fr) 128px 40px">
  <div zRow>
    <z-row-main title="Beispiel-Server 1">
      <a zRowTitle zRowLink routerLink="/user/server/1">Beispiel-Server 1</a>
      <div zRowMeta>Minecraft · <span class="z-mono">203.0.113.10:25565</span></div>
    </z-row-main>
    <span><z-badge status="success" dot>Online</z-badge></span>
    <button
      zRowAction
      zBtn="ghost"
      iconOnly
      type="button"
      aria-label="Aktionen für Beispiel-Server 1"
      [cdkMenuTriggerFor]="zeilenAktionen"
    >
      <z-icon name="more_vert" />
    </button>
  </div>
</z-rows>
```

The loading state, with skeleton rows in the same grid. `busy` sets `aria-busy` on the panel, which
is silent by itself, and the host of `z-panel` carries no role, so an `aria-label` on it is ignored.
The sentence that gets announced belongs in a live region that already stands there before the
load, so put a `role="status"` next to the panel and fill it while loading:

```html
<p class="z-visually-hidden" role="status">Server werden geladen</p>
<z-panel title="Meine Server" busy flush>
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

A server list whose thumbnail shows the game, not the server. The title is the server's own name,
so `thumbText` names the game for the initial, and the image may be missing or dead: both end in
the "V" of Valheim, never in the initial of the server name and never in a broken image. The image
is decorative, so the game also stands as text in the meta line:

```html
<a zRow routerLink="/user/server/4">
  <z-row-main title="survival-01" [image]="server.game.iconUrl ?? ''" [thumbText]="server.game.name">
    <div zRowMeta>{{ server.game.name }} · <span class="z-mono">203.0.113.13:2456</span></div>
  </z-row-main>
</a>
```

An own medium in the thumbnail, and a row without one:

```html
<z-rows columns="minmax(0, 2fr) 128px">
  <div zRow>
    <z-row-main title="beispiel.de" meta="Domain · läuft bis 18.09.2027">
      <z-icon zRowThumb name="language" />
    </z-row-main>
    <span><z-badge status="success" dot>Aktiv</z-badge></span>
  </div>
  <div zRow>
    <z-row-main title="Ticket 4711" meta="Letzte Antwort 18.09.2026, 15:55" [thumb]="false" />
    <span><z-badge status="info" dot>Offen</z-badge></span>
  </div>
</z-rows>
```

## States

| State   | How it looks                                                   | How to trigger it                          |
| ------- | -------------------------------------------------------------- | ------------------------------------------ |
| Rest    | 1px `border` between the rows                                  | default                                    |
| Hover   | the whole row turns `surface-raised`                           | pointer over the row                       |
| Focus   | 2px ring in `focus` with 2px offset around the link row        | Tab, `:focus-visible`                      |
| Link row | hover and focus ring cover the whole row, the action stays on top | `a[zRowLink]` in the title, `[zRowAction]` on the buttons |
| Loading | skeleton rows in the same grid, `aria-busy` on the panel       | `busy` on the panel plus `z-skeleton` rows |
| Empty   | `z-empty-state` instead of the rows, no pagination, no filters | render the empty state                     |
| Error   | `z-alert` with the cause and the next step                     | render the alert                           |
| Image failed | the initial of `thumbText` or `title` in the thumbnail, no `<img>` | the `image` URL fails to load        |

A `div[zRow]` has no hover cursor; it is not clickable. There is no disabled state for a row: a row
the customer cannot open is left out.

## Accessibility

- A row as an `<a>` is one link, so the title and the meta line are read as its accessible text,
  and nothing else: `.z-row__thumb` carries `aria-hidden="true"` and its image an empty `alt`.
- Actions inside a row are separate tab stops with their own `aria-label`. That is why a row with
  actions is a `<div>` with `a[zRowLink]` and never an `<a>` around a `<button>`, which is invalid
  markup and gives the two controls one tab stop.
- The thumbnail is decoration, whatever it shows: image, initial or the content of `[zRowThumb]`.
  The whole `.z-row__thumb` is `aria-hidden`, so a screen reader hears neither the initial nor an
  icon or image put into the slot. Whatever it shows, the game of a server for example, has to
  stand as text in the row as well, usually in `meta` or `[zRowMeta]`. For the same reason nothing
  focusable, no link, button or input, goes into `[zRowThumb]`: it would remain a tab stop inside
  `aria-hidden`.
- The hit area of `a[zRowLink]` is the whole row, so that is where its focus ring is drawn: on the
  stretched `::after`, not around the title text. There is exactly one ring, 2px in `focus` with a
  2px offset.
- The tab order inside such a row is the DOM order: the link in the title first, then every
  `[zRowAction]`.
- The column head disappears below 640px, so it must never hold the only copy of a fact. Repeat the
  fact in the row or in the meta line.
- The status always stands as a word inside its badge, never as colour alone.

## Responsive

Below 640px the head is hidden and the grid collapses to two columns: title and status. Every
column from the third on is hidden, so the rest of the facts move to the detail page. The page
itself never scrolls sideways.

A `[zRowAction]` is the exception: it keeps its cell and the row gets a third column for it, so the
row menu and everything in it stay reachable on a phone. Put the actions of a row on
`[zRowAction]` even in a row without `a[zRowLink]`, otherwise they disappear below 640px.

## Rendered classes and tokens

| Class          | Applies when        |
| -------------- | ------------------- |
| `z-rows`       | on the list host    |
| `z-rows__head` | on the column head  |
| `z-row`        | on each row         |
| `z-row__main`  | on `z-row-main`     |
| `z-row__thumb` | inside `z-row-main`, unless `thumb` is `false`; `aria-hidden` |
| `z-row__text`  | inside `z-row-main` |
| `z-row__title` | inside `z-row-main` |
| `z-row__meta`  | `meta` is not empty, or on `[zRowMeta]` |
| `z-row__num`   | on `[zRowNum]`      |
| `z-row__link`  | on `a[zRowLink]`    |
| `z-row__action` | on `[zRowAction]`  |

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
- Addition to the library: `thumbText`, `thumb`, `[zRowThumb]` and the fallback of a failed
  `image`. The reference knows only image and initial of the title. None of the four adds a class
  or a CSS rule; the fallback follows `button[zGameTile]`, whose cover drops into its text on
  `error` the same way.
- Addition to the reference: the stretched link. `40-bibliothek.md` asks both for rows that are
  links and for actions inside a row as their own tab stops, which a `<button>` inside an `<a>`
  cannot give. A row with `a[zRowLink]` becomes `position: relative`, the link's `::after` is
  `position: absolute; inset: 0`, and `.z-row__action` takes `position: relative; z-index: 1`. No
  `transform`, no new value outside the tokens. The overlay escapes the `overflow: hidden` of
  `.z-row__title` because its containing block is the row.
- Addition to the reference: below 640px `.z-row__action` keeps its `display` and a row that holds
  one gets a third grid column. The reference hides every cell from the third on, which also hides
  the menu button of a row: on a phone its entries were unreachable, and the touch-target check
  passed only because a hidden button is never measured.
- Addition to the reference: `.z-row__link:focus-visible` sets `outline-color: transparent` and the
  2px/2px ring in `focus` is drawn on its `::after` instead, so the one ring matches the hit area
  of the link. `transparent` is not a colour of the palette; it only switches off the duplicate
  ring the global `:focus-visible` rule would draw around the title text.

## Do / Don't

- Do set `columns` on `z-rows`; head and rows then share one grid.
- Do keep the status in the second column throughout.
- Do right-align amounts with `zRowNum`.
- Don't put a fact only in the column head; it disappears below 640px.
- Do put an address, a port or a file name into `[zRowMeta]` with `z-mono` around it; the `meta`
  input renders one face for the whole line.
- Do mark every action of a row with `[zRowAction]`, so it survives below 640px.
- Do reach for `a[zRowLink]` when a row needs both a target and its own actions; `a[zRow]` cannot
  hold a button.
- Don't nest a clickable control inside an `a[zRow]` without making it a tab stop of its own.
- Don't expect to select the text of a row with `a[zRowLink]` by dragging; the overlay swallows it,
  exactly as the link of an `a[zRow]` does. Facts that have to be copied belong in a detail page or
  in a `table[zTable]`.
- Don't change the border or move the row on hover; hover colours the whole row.
