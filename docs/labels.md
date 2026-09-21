# Labels

The library ships no copy. The only texts it holds are the accessible names and
the one visible sentence that a component cannot leave empty without breaking
screen readers, and they all live in a single registry instead of being spread
over the components.

An application in another language sets them once at bootstrap. A single usage
that needs different wording still overrides the matching input, as before.

## The registry

| Symbol | What it is |
| --- | --- |
| `ZLabels` | The interface, one key per default text. |
| `Z_LABELS_DE` | The German defaults, used when nothing is provided. |
| `Z_LABELS_EN` | The English equivalents, complete. |
| `Z_LABELS` | The injection token the components read. |
| `provideZenitLabels(partial)` | Merges an override over `Z_LABELS_DE`. |

A key is a plain `string` when the text is fixed and a function when it takes
parameters.

## Keys

| Key | Where it shows up | German (`Z_LABELS_DE`) | English (`Z_LABELS_EN`) |
| --- | --- | --- | --- |
| `paginationPrev` | `z-pagination`, `aria-label` of the back button | `Vorherige Seite` | `Previous page` |
| `paginationNext` | `z-pagination`, `aria-label` of the forward button | `Nächste Seite` | `Next page` |
| `paginationNav` | `z-pagination`, accessible name of the `<nav>` around the pager | `Seitennavigation` | `Pagination` |
| `paginationRange` | `z-pagination`, the sentence in front of the buttons | `` `${from} bis ${to} von ${total} ${itemLabel}` `` | `` `${from} to ${to} of ${total} ${itemLabel}` `` |
| `consoleLog` | `z-console`, `aria-label` of the log region | `Serverlog` | `Server log` |
| `consoleInput` | `z-console`, `aria-label` of the command input | `Befehl` | `Command` |
| `consoleJumpToEnd` | `z-console`, caption of the jump-to-end button | `Zum Ende` | `Jump to end` |
| `headerMenu` | `z-app-header`, `aria-label` of the menu button below 900px | `Menü` | `Menu` |
| `toastClose` | `z-toast-outlet`, `aria-label` of the close button | `Schließen` | `Close` |
| `tableRegion` | `z-table-container`, accessible name of the scrollable region | `Tabelle, seitlich scrollbar` | `Table, scrolls sideways` |

`paginationRange` is the only function. Its signature is
`(from: number, to: number, total: number, itemLabel: string) => string`, where
`from` and `to` are the entry numbers of the current page, 1-based.

## Application-wide

`provideZenitLabels` merges over the German defaults, so a partial override
stays valid: keys that are left out keep their German text.

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZenitLabels, Z_LABELS_EN } from 'zenit-ui';

bootstrapApplication(App, {
  providers: [provideZenitLabels(Z_LABELS_EN)],
});
```

A single key, the rest German:

```ts
providers: [provideZenitLabels({ tableRegion: 'Rechnungen, seitlich scrollbar' })];
```

It returns `EnvironmentProviders`, so it also belongs on a lazy route:

```ts
export const routes: Routes = [
  {
    path: 'en',
    providers: [provideZenitLabels(Z_LABELS_EN)],
    loadComponent: () => import('./en.page').then((m) => m.EnPage),
  },
];
```

## Per usage

Every input that used to carry a German default is still there and still wins
over the registry. Unset, it falls back to the registry value.

```html
<z-table-container ariaLabel="Rechnungen, seitlich scrollbar">…</z-table-container>
<z-pagination [(page)]="seite" [total]="118" itemLabel="Rechnungen" ariaLabelNext="Eine Seite weiter" />
```

The inputs per component: `ariaLabelPrev`, `ariaLabelNext` and `rangeLabel` on
`z-pagination`, `logLabel`, `inputLabel` and `endLabel` on `z-console`,
`menuLabel` on `z-app-header`, `closeLabel` on `z-toast-outlet` and `ariaLabel`
on `z-table-container`.

## One subtree

`Z_LABELS` is a normal injection token, so a component can provide it for its
own subtree. That is what the demo page `Daten` does in its Pagination section:

```ts
@Component({
  selector: 'demo-englische-pagination',
  imports: [ZPagination],
  template: `<z-pagination [(page)]="seite" [total]="118" itemLabel="transactions" />`,
  providers: [{ provide: Z_LABELS, useValue: Z_LABELS_EN }],
})
class EnglischePagination {
  protected readonly seite = signal(1);
}
```

`useValue` takes a complete `ZLabels`, not a partial one. To change single keys
for a subtree, spread the defaults yourself:

```ts
providers: [{ provide: Z_LABELS, useValue: { ...Z_LABELS_DE, headerMenu: 'Menu' } }];
```
