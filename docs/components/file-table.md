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
import { ZTableContainer, ZTable, ZNum, ZTableName } from 'zenit-ui';
```

## API

### `z-table-container`

| Input       | Type     | Default                         | Description                                                                                                     |
| ----------- | -------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `ariaLabel` | `string` | `'Tabelle, seitlich scrollbar'` | Accessible name of the scrollable region. German default, meant to be overridden with the content of the table. |

No outputs. The content is the table. The host is a `role="region"` with `tabindex="0"`, so the
scrollable area is reachable and scrollable by keyboard alone.

### `table[zTable]`

No inputs, no outputs. Adds the class `z-table` to a native `<table>` and renders nothing itself, so
semantics, header cells and keyboard behaviour stay the browser's.

### `[zNum]`

No inputs. Right-aligned cell in the mono face: size, date, amount.

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

## Accessibility

- The container is a `role="region"` with `tabindex="0"` and an `aria-label`, so a keyboard user can
  reach and scroll it. Override the German default with what the table holds.
- Each row checkbox needs an `ariaLabel` naming that row; the header checkbox is named "Alle
  auswählen".
- The table stays native, so `<th>`, `<thead>` and the column relationships reach assistive
  technology unchanged. Sort by making the header cell a button.
- Icons in the name cell are decorative and `aria-hidden`; the file name next to them carries the
  meaning.

## Responsive

Below 640px the table scrolls sideways inside `z-table-container`. The page itself never scrolls
sideways. The cells keep `white-space: nowrap`, so the columns stay readable rather than wrapping.

## Rendered classes and tokens

| Class            | Applies when                              |
| ---------------- | ----------------------------------------- |
| `z-table-wrap`   | on `z-table-container`                    |
| `z-table`        | on the `<table>`                          |
| `z-table__num`   | on `[zNum]` cells                         |
| `z-table__name`  | on `[zTableName]` cells                   |
| `z-table__check` | on the checkbox column, set by the caller |

Tokens: `--space-2` to `--space-4` for the cell padding, `--border` for the lines,
`--surface-raised` for the row hover, `--text-subtle` for the header cells, `--text-muted` and
`--font-mono` for the number cells, `--focus` for the ring. The 12px header type and the 18px
checkbox column are literal values from the reference stylesheet.

## Do / Don't

- Do put the table in a `z-table-container` and give it a real `ariaLabel`.
- Do sort folders first, then files, both alphabetically.
- Do keep size and date as separate right-aligned mono columns.
- Don't use coloured file-type icons; only `folder` and `description` in `text-muted`.
- Don't let the page scroll sideways; the container scrolls instead.
- Don't fill the upload button green; it is secondary in `control-sm`.
