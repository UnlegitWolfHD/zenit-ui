# Pagination

Pages through lists with more than 25 entries, as the last row of a panel.

## When to use

- Below a list or a table whose total exceeds one page: invoices, transactions, tickets.

## When not to use

- For activities and logs. Those load more through a "Mehr laden" button.
- For a list that fits on one page. The component then renders nothing at all, so an empty list
  shows no pager.

## Import

```ts
import { ZPagination } from 'zenit-ui';
```

## API

Selector: `z-pagination`

| Input           | Type                                                                     | Default             | Description                                                                                                   |
| --------------- | ------------------------------------------------------------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------- |
| `page`          | `number`                                                                 | `1`                 | Current page, 1-based and two-way bindable through `[(page)]`. The component keeps it inside the valid range. |
| `pageSize`      | `number`                                                                 | `25`                | Entries per page, two-way bindable through `[(pageSize)]`. Values below 1 are treated as 1.                  |
| `pageSizeOptions` | `number[]`                                                             | `[]`                | Sizes the user may pick from. Empty means no picker, and the pager renders exactly as it did before.          |
| `pageSizeLabel` | `string`                                                                 | `'Einträge pro Seite'` | Visible label in front of the size select. German default from the registry, overridable.                 |
| `total`         | `number`                                                                 | `0`                 | Number of entries in the whole list, not just on the current page.                                            |
| `itemLabel`     | `string`                                                                 | `''`                | What the list contains, for example "Rechnungen".                                                             |
| `rangeLabel`    | `(von: number, bis: number, total: number, itemLabel: string) => string` | German default      | Builds the sentence in front of the buttons. Override it so the wording comes from the caller.                |
| `ariaLabel`     | `string`                                                                 | `'Seitennavigation'` | Accessible name of the `<nav>` around the pager. Name what is paged ("Seiten der Transaktionen") wherever a page has more than one pager. |
| `ariaLabelPrev` | `string`                                                                 | `'Vorherige Seite'` | `aria-label` of the back button. German default, overridable.                                                 |
| `ariaLabelNext` | `string`                                                                 | `'Nächste Seite'`   | `aria-label` of the forward button. German default, overridable.                                              |

| Output           | Payload  | Fires when                                      |
| ---------------- | -------- | ----------------------------------------------- |
| `pageChange`     | `number` | the page changes (the `model()` companion)      |
| `pageSizeChange` | `number` | the user picks another size (`model()` as well) |

No content projection, no forms support.

The component does not slice the data. It reports the wanted page through `page`; the caller cuts
the list.

### The size selector

`pageSizeOptions` renders a native `<select>` in the `z-select` shell, size `sm`, in front of the
range sentence. The rendered list is the options plus the current `pageSize`, de-duplicated and
sorted, so the select never shows a size the pager is not using.

Picking a size keeps the first entry of the current page in view: the new page is the one that entry
falls on, `Math.floor(firstIndex / newSize) + 1`. Page 3 of 25 starts at entry 51, so 10 per page
lands on page 6, not back on page 1. `page` and `pageSize` are written together, once.

The selector follows a visibility rule of its own. The arrows and the range sentence appear while
`total` is greater than `pageSize`, as before; the selector appears while `total` is greater than the
**smallest** rendered option, that is while at least one of the offered sizes would split the list
into pages. Tying it to the arrows would strand the reader: switching to 50 on a list of 30 hides the
arrows, the selector would go with them and there would be no way back to 10. Where even the smallest
option fits on one page the component renders nothing at all, exactly as without options.

## Examples

As the last row of a panel:

```html
<z-panel title="Transaktionen" flush>
  <z-rows>
    <div zRow>
      <z-row-main title="Beispiel-Server 1" meta="18.09.2026, 15:55" />
      <span zRowNum>0,90&nbsp;€</span>
    </div>
  </z-rows>
  <z-pagination [(page)]="seite" [total]="118" itemLabel="Transaktionen" />
</z-panel>
```

Slicing the data in the component:

```ts
import { signal, computed } from '@angular/core';

const seite = signal(1);
const alle = signal<string[]>([]);
const sichtbar = computed(() => alle().slice((seite() - 1) * 25, seite() * 25));
```

With a size picker, both values bound:

```html
<z-panel title="Transaktionen" flush>
  <z-pagination
    [(page)]="seite"
    [(pageSize)]="proSeite"
    [pageSizeOptions]="[10, 25, 50]"
    [total]="118"
    itemLabel="Transaktionen"
  />
</z-panel>
```

```ts
import { computed, signal } from '@angular/core';

const seite = signal(1);
const proSeite = signal(25);
const alle = signal<string[]>([]);
const sichtbar = computed(() =>
  alle().slice((seite() - 1) * proSeite(), seite() * proSeite()),
);
```

Coming from `MatPaginator`, whose `PageEvent` is 0-based, the adapter is a binding, not a new
handler signature:

```html
<z-pagination
  [page]="pageIndex() + 1"
  (pageChange)="onPage($event - 1)"
  [pageSize]="pageSize()"
  (pageSizeChange)="onPageSize($event)"
  [pageSizeOptions]="[10, 25, 50]"
  [total]="total()"
  itemLabel="Rechnungen"
/>
```

Your own range sentence and your own button names:

```html
<z-pagination
  [(page)]="seite"
  [total]="112"
  itemLabel="Rechnungen"
  [rangeLabel]="bereichstext"
  ariaLabelPrev="Eine Seite zurück"
  ariaLabelNext="Eine Seite weiter"
/>
```

```ts
const bereichstext = (von: number, bis: number, total: number, label: string) =>
  `${von}–${bis} von ${total} ${label}`;
```

A list that fits on one page renders nothing, so no branch is needed around it:

```html
<z-panel title="Tickets" flush>
  <z-pagination [(page)]="seite" [total]="4" itemLabel="Tickets" />
</z-panel>
```

## States

| State      | How it looks                               | How to trigger it                                       |
| ---------- | ------------------------------------------ | ------------------------------------------------------- |
| Middle     | both buttons active                        | a page between the first and the last                   |
| First page | back button `disabled` at 45 percent       | `page` is 1                                             |
| Last page  | forward button `disabled` at 45 percent    | `page` equals the last page                             |
| Hidden     | nothing rendered                           | `total` is 0, or `total` is not greater than `pageSize` and not greater than the smallest option |
| Size only  | the selector without arrows and range      | `total` is not greater than `pageSize` but greater than the smallest option |
| Hover      | the ghost buttons pick up `surface-raised` | pointer over a button                                   |
| Focus      | 2px ring in `focus` with 2px offset        | Tab, `:focus-visible`                                   |

There is no loading or error state; the list above the pager carries those.

## Accessibility

- The pager sits in a `<nav>` named by `ariaLabel`, so it is a navigation landmark. Two landmarks of
  one role must not share a name: on a page with several pagers, name each one after its list.
- Both buttons are icon-only ghost buttons in size `sm` with an `aria-label` from `ariaLabelPrev`
  and `ariaLabelNext`. Override the German defaults if the rest of the page is in another language.
- The buttons are natively `disabled` on the first and the last page, so they leave the tab order
  rather than being clickable no-ops.
- The range sentence is plain text in front of the buttons, so it is read before them.
- The page number sits between the buttons in the mono face.
- The size selector is a native `<select>` with a visible `<label>` tied to it by `for`/`id`; the id
  is unique per instance, so several pagers on one page stay correctly labelled. The list keeps the
  system wheel on mobile and the native keyboard handling.

## Responsive

The row is a flex line that wraps, so at 360px the sentence moves above the buttons. Below 640px the
two `sm` buttons grow to 40px square and the `sm` select does the same, so the click targets meet the
minimum; the size group takes the full width there and therefore a row of its own.

## Rendered classes and tokens

| Class           | Applies when                          |
| --------------- | ------------------------------------- |
| `z-pager`       | while the pager is shown              |
| `z-pager__nav`  | around the two buttons                |
| `z-pager__size` | around the label and the size select  |
| `z-mono`        | on the page number                    |

Tokens: `--space-1` to `--space-4` for the gaps and the padding, `--border` for the 1px line above
the row, `--text-muted` for the sentence, `--font-mono` for the page number. The 12px type is a
literal value from the reference stylesheet; the buttons follow `z-btn--ghost.z-btn--sm.z-btn--icon`.

## Coming from Angular Material

| Material                                | Here                                                                   |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `[length]="total"`                      | `[total]="total()"`                                                    |
| `[pageIndex]`, 0-based                  | `[page]`, **1-based**: `[page]="pageIndex() + 1"`                      |
| `(page)="f($event)"` with a `PageEvent` | `(pageChange)="f($event - 1)"` and `(pageSizeChange)="g($event)"`, plain numbers |
| `[pageSizeOptions]="[10, 25, 50]"`      | the same input, same meaning                                           |
| `[hidePageSize]="true"`                 | leave `pageSizeOptions` out                                            |
| `[showFirstLastButtons]`                | nothing; two arrows are enough                                         |
| `MatPaginatorIntl`                      | the label registry, see `docs/labels.md`                               |

An existing 0-based handler needs no new signature, only the adapter binding:

```html
<z-pagination
  [page]="pageIndex() + 1"
  (pageChange)="lade($event - 1, pageSize())"
  [pageSize]="pageSize()"
  (pageSizeChange)="lade(0, $event)"
  [pageSizeOptions]="[10, 25, 50]"
  [total]="total()"
  itemLabel="Rechnungen"
/>
```

## Do / Don't

- Do place the pager as the last row inside the panel, after the list.
- Do keep `pageSize` at 25 where the list has one natural length; the picker is for lists a user
  really wants to read at another size.
- Do slice the data yourself in response to `page` and `pageSize`.
- Don't add "first" and "last" buttons; two arrows are enough.
- Don't render a pager under an empty list; the component already hides itself.
- Don't show filters or a pager next to an empty state.
