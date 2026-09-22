# FileTable

The table for file managers, invoices, backups and databases: everything with several equal columns
and bulk actions.

## When to use

- Wherever the columns are of equal weight and rows are selected for a bulk action.
- Wherever real table semantics help: header cells, sorting, column relationships.

## When not to use

- For a list of objects where each row leads to a detail page. That is `z-rows` with `a[zRow]`.
- For two or three facts about one object. That is `z-spec-list`.

## Import

```ts
import { ZTableContainer, ZTable, ZNum, ZTableName, ZSortHeader, ZSort } from 'zenit-ui';
```

## API

### `z-table-container`

| Input       | Type     | Default                         | Description                                                                                                     |
| ----------- | -------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `ariaLabel` | `string` | `'Tabelle, seitlich scrollbar'` | Accessible name of the scrollable region. German default, meant to be overridden with the content of the table. |

No outputs. The content is the table. The host is a `role="region"` with `tabindex="0"`, so the
scrollable area is reachable and scrollable by keyboard alone.

### `table[zTable]`

Adds the class `z-table` to a native `<table>` and renders nothing itself, so semantics, header
cells and keyboard behaviour stay the browser's.

| Input  | Type              | Default | Description                                                                                         |
| ------ | ----------------- | ------- | ----------------------------------------------------------------------------------------------------- |
| `sort` | `ZSort \| null`   | `null`  | Column the table is sorted by, two-way bindable through `[(sort)]`. `null` is unsorted.             |

| Output       | Payload         | Fires when                                              |
| ------------ | --------------- | ------------------------------------------------------- |
| `sortChange` | `ZSort \| null` | a `th[zSortHeader]` is clicked (the `model()` companion) |

```ts
interface ZSort {
  key: string; // the value of zSortHeader on the sorted column
  direction: 'asc' | 'desc';
}
```

The table holds the state, so exactly one column is sorted at a time. It does **not** sort the rows:
no data logic lives in the library. The caller orders its own data, usually in a `computed()`.

### `th[zSortHeader]`

Header cell that sorts its column. Renders a `<button type="button" class="z-table__sort">` around
the projected header text plus a `z-icon` in size `sm` (`arrow_upward` / `arrow_downward`) that shows
only while this column is the sorted one. A click cycles through `sortStart`, the opposite direction
and unsorted.

| Input          | Type              | Default | Description                                                                            |
| -------------- | ----------------- | ------- | -------------------------------------------------------------------------------------- |
| `zSortHeader`  | `string`          | —       | Key of this column, the value that ends up in `ZSort.key`. Required.                   |
| `sortStart`    | `'asc' \| 'desc'` | `'asc'` | Direction of the first click. `desc` suits sizes and amounts, where the largest value is the interesting one. |
| `disabled`     | `boolean`         | `false` | The column takes no part in sorting: the button is disabled and the cell carries no `aria-sort`. |

No outputs; the state goes to the `sort` model of the table. The content is the header text, which is
also the accessible name of the button, so no `aria-label` and no `title` are needed.

### `[zNum]`

No inputs. Right-aligned cell in the mono face: size, date, amount. On a `<th>` it only borrows the
right alignment; the header keeps its caption style, and a sort button inside follows the right edge
with the arrow in front of the text.

### `[zTableName]`

No inputs. Name cell: icon and name in the mono face. The icon comes from the caller and is `folder`
or `description`.

## Examples

A file manager inside a flush panel:

```html
<z-panel title="Dateien" flush>
  <z-table-container ariaLabel="Dateien, seitlich scrollbar">
    <table zTable>
      <thead>
        <tr>
          <th class="z-table__check"><z-checkbox ariaLabel="Alle auswählen" /></th>
          <th>Name</th>
          <th style="text-align: right">Größe</th>
          <th style="text-align: right">Geändert</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><z-checkbox ariaLabel="plugins auswählen" /></td>
          <td>
            <span zTableName><z-icon name="folder" size="sm" />plugins</span>
          </td>
          <td zNum>–</td>
          <td zNum>18.09.2026, 15:55</td>
        </tr>
        <tr>
          <td><z-checkbox ariaLabel="server.jar auswählen" [(checked)]="jarGewaehlt" /></td>
          <td>
            <span zTableName><z-icon name="description" size="sm" />server.jar</span>
          </td>
          <td zNum>61,25 MB</td>
          <td zNum>17.09.2026, 09:12</td>
        </tr>
      </tbody>
    </table>
  </z-table-container>
</z-panel>
```

The bulk action bar that replaces the toolbar once rows are selected:

```html
<z-panel title="Dateien" flush>
  <span zPanelActions>
    <button zBtn="secondary" size="sm" type="button">
      <z-icon name="upload" size="sm" />Hochladen
    </button>
  </span>
  <z-table-container ariaLabel="Dateien">
    <table zTable>
      <tbody>
        <tr>
          <td><z-checkbox ariaLabel="server.jar auswählen" /></td>
        </tr>
      </tbody>
    </table>
  </z-table-container>
</z-panel>
```

Sortable columns. The header reports what the user wants, the page orders the rows, and its own rule
("folders first") survives both directions:

```html
<z-table-container ariaLabel="Dateien, seitlich scrollbar">
  <table zTable [(sort)]="sortierung">
    <thead>
      <tr>
        <th zSortHeader="name">Name</th>
        <th zNum zSortHeader="groesse" sortStart="desc">Größe</th>
        <th zNum zSortHeader="geaendert" sortStart="desc">Geändert</th>
      </tr>
    </thead>
    <tbody>
      @for (datei of sortiert(); track datei.name) {
        <tr>
          <td>
            <span zTableName><z-icon [name]="datei.icon" />{{ datei.name }}</span>
          </td>
          <td zNum>{{ datei.groesse }}</td>
          <td zNum>{{ datei.geaendert }}</td>
        </tr>
      }
    </tbody>
  </table>
</z-table-container>
```

```ts
import { computed, signal } from '@angular/core';
import { ZSort } from 'zenit-ui';

const sortierung = signal<ZSort | null>({ key: 'name', direction: 'asc' });
const dateien = signal<Datei[]>([]);

const sortiert = computed(() => {
  const s = sortierung();
  const zeilen = [...dateien()];
  if (!s) return zeilen;
  const richtung = s.direction === 'asc' ? 1 : -1;
  return zeilen.sort((a, b) => {
    const ordnerZuerst = Number(b.ordner) - Number(a.ordner);
    if (ordnerZuerst !== 0) return ordnerZuerst;
    if (s.key === 'groesse') return richtung * (a.bytes - b.bytes);
    const feld = s.key === 'geaendert' ? 'zeitpunkt' : 'name';
    return richtung * a[feld].localeCompare(b[feld], 'de');
  });
});
```

Sort by the value, not by the rendered text: "61,25 MB" and "04.09.2026, 05:53" do not sort as
strings. That is exactly why the comparison stays with the caller.

A list of invoices, where the amount and the date are the mono columns:

```html
<z-table-container ariaLabel="Rechnungen, seitlich scrollbar">
  <table zTable>
    <thead>
      <tr>
        <th>Nummer</th>
        <th>Status</th>
        <th style="text-align: right">Betrag</th>
        <th style="text-align: right">Datum</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span zTableName>RE-2026-0118</span></td>
        <td><z-badge status="success" dot>Bezahlt</z-badge></td>
        <td zNum>5,40&nbsp;€</td>
        <td zNum>18.09.2026</td>
      </tr>
    </tbody>
  </table>
</z-table-container>
```

## States

| State    | How it looks                                                                            | How to trigger it      |
| -------- | --------------------------------------------------------------------------------------- | ---------------------- |
| Rest     | 1px `border` lines between the rows                                                     | default                |
| Hover    | the cells of that row turn `surface-raised`                                             | pointer over a row     |
| Focus    | 2px ring in `focus` around the container or a control in a cell                         | Tab, `:focus-visible`  |
| Selected | the row checkbox is checked; a bar above the table shows the count and the bulk actions | check a row checkbox   |
| Loading  | skeleton rows, `aria-busy` on the panel                                                 | `busy` on the panel    |
| Empty    | `z-empty-state` in the panel instead of the table                                       | render the empty state |
| Sortable | header text as a button, unchanged until it is used                                     | `zSortHeader` on the `<th>` |
| Sorted   | header text in `text` with the arrow in `text-muted`, `aria-sort` on the cell           | click that header      |

## Accessibility

- The container is a `role="region"` with `tabindex="0"` and an `aria-label`, so a keyboard user can
  reach and scroll it. Override the German default with what the table holds.
- All three are borrowed only while there is something to scroll: a `role`, an `aria-label` or a
  `tabindex` you wrote on `<z-table-container>` yourself comes back as soon as the table fits again.
- Each row checkbox needs an `ariaLabel` naming that row; the header checkbox is named "Alle
  auswählen".
- The table stays native, so `<th>`, `<thead>` and the column relationships reach assistive
  technology unchanged.
- A sortable header is a real `<button>` inside the `<th>`, so it is a tab stop, answers Enter and
  Space natively and draws the global focus ring. The header text is its accessible name.
- The `<th>` carries `aria-sort`: `ascending` or `descending` on the sorted column, `none` on every
  other sortable one, which is the WAI-ARIA pattern for a sortable table. Only one column carries a
  direction, because the state lives on the table. A `disabled` column carries no `aria-sort` at all,
  so it reads as the plain header it is.
- The arrow is a decorative `z-icon`; the direction is announced through `aria-sort`, not through the
  icon.
- Icons in the name cell are decorative and `aria-hidden`; the file name next to them carries the
  meaning.

## Responsive

Below 640px the table scrolls sideways inside `z-table-container`. The page itself never scrolls
sideways. The cells keep `white-space: nowrap`, so the columns stay readable rather than wrapping.

## Rendered classes and tokens

| Class            | Applies when                                       |
| ---------------- | -------------------------------------------------- |
| `z-table-wrap`   | on `z-table-container`                             |
| `z-table`        | on the `<table>`                                   |
| `z-table__num`   | on `[zNum]` cells                                  |
| `z-table__name`  | on `[zTableName]` cells                            |
| `z-table__check` | on the checkbox column, set by the caller          |
| `z-table__sort`  | on the button inside a `th[zSortHeader]`           |

Tokens: `--space-2` to `--space-4` for the cell padding, `--border` for the lines,
`--surface-raised` for the row hover, `--text-subtle` for the header cells, `--text-muted` and
`--font-mono` for the number cells, `--focus` for the ring. The 12px header type and the 18px
checkbox column are literal values from the reference stylesheet.

## Coming from Angular Material

| Material                              | Here                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------- |
| `matSort` on the table                | `[(sort)]` on `table[zTable]`                                             |
| `(matSortChange)="sortiere($event)"`  | `(sortChange)="sortiere($event)"`, or just read the bound signal          |
| `mat-sort-header` on the `<th>`       | `zSortHeader="<key>"` on the `<th>`                                       |
| `matSortStart="desc"`                 | `sortStart="desc"`, per column                                            |
| `Sort { active, direction }`          | `ZSort { key, direction }`; `direction` is `'asc' \| 'desc'`, never `''`  |
| `direction: ''` for "unsorted"        | `sort` is `null`                                                          |
| `matSortDisabled`                     | `disabled`                                                                |
| `MatTableDataSource` sorting the rows | your own `computed()`; the library sorts nothing                          |

`Sort.direction` has three values in Material, the empty string standing for unsorted. Here the third
state is `null` for the whole object, so a handler tests `if (!sort)` instead of `if (!sort.direction)`.

## Do / Don't

- Do put the table in a `z-table-container` and give it a real `ariaLabel`.
- Do sort folders first, then files, both alphabetically, and keep that rule in both directions.
- Do sort by the underlying value, not by the text in the cell.
- Do keep size and date as separate right-aligned mono columns.
- Don't use coloured file-type icons; only `folder` and `description` in `text-muted`.
- Don't let the page scroll sideways; the container scrolls instead.
- Don't fill the upload button green; it is secondary in `control-sm`.
