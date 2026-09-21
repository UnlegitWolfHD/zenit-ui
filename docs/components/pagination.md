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
| `pageSize`      | `number`                                                                 | `25`                | Entries per page. The spec fixes this at 25 and offers no per-page picker; values below 1 are treated as 1.   |
| `total`         | `number`                                                                 | `0`                 | Number of entries in the whole list, not just on the current page.                                            |
| `itemLabel`     | `string`                                                                 | `''`                | What the list contains, for example "Rechnungen".                                                             |
| `rangeLabel`    | `(von: number, bis: number, total: number, itemLabel: string) => string` | German default      | Builds the sentence in front of the buttons. Override it so the wording comes from the caller.                |
| `ariaLabelPrev` | `string`                                                                 | `'Vorherige Seite'` | `aria-label` of the back button. German default, overridable.                                                 |
| `ariaLabelNext` | `string`                                                                 | `'Nächste Seite'`   | `aria-label` of the forward button. German default, overridable.                                              |

| Output       | Payload  | Fires when                                 |
| ------------ | -------- | ------------------------------------------ |
| `pageChange` | `number` | the page changes (the `model()` companion) |

No content projection, no forms support.

The component does not slice the data. It reports the wanted page through `page`; the caller cuts
the list.

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
| Hidden     | nothing rendered                           | `total` is 0, or `total` is not greater than `pageSize` |
| Hover      | the ghost buttons pick up `surface-raised` | pointer over a button                                   |
| Focus      | 2px ring in `focus` with 2px offset        | Tab, `:focus-visible`                                   |

There is no loading or error state; the list above the pager carries those.

## Accessibility

- Both buttons are icon-only ghost buttons in size `sm` with an `aria-label` from `ariaLabelPrev`
  and `ariaLabelNext`. Override the German defaults if the rest of the page is in another language.
- The buttons are natively `disabled` on the first and the last page, so they leave the tab order
  rather than being clickable no-ops.
- The range sentence is plain text in front of the buttons, so it is read before them.
- The page number sits between the buttons in the mono face.

## Responsive

The row is a flex line that wraps, so at 360px the sentence moves above the buttons. Below 640px the
two `sm` buttons grow to 40px square, so the click targets meet the minimum.

## Rendered classes and tokens

| Class          | Applies when             |
| -------------- | ------------------------ |
| `z-pager`      | while the pager is shown |
| `z-pager__nav` | around the two buttons   |
| `z-mono`       | on the page number       |

Tokens: `--space-1` to `--space-4` for the gaps and the padding, `--border` for the 1px line above
the row, `--text-muted` for the sentence, `--font-mono` for the page number. The 12px type is a
literal value from the reference stylesheet; the buttons follow `z-btn--ghost.z-btn--sm.z-btn--icon`.

## Do / Don't

- Do place the pager as the last row inside the panel, after the list.
- Do keep `pageSize` at 25; the spec offers no per-page picker.
- Do slice the data yourself in response to `page`.
- Don't add "first" and "last" buttons; two arrows are enough.
- Don't render a pager under an empty list; the component already hides itself.
- Don't show filters or a pager next to an empty state.
