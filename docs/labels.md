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
| `Z_LABELS` | The injection token that holds the registry. |
| `provideZenitLabels(partial)` | Merges an override over the enclosing injector's labels, or over `Z_LABELS_DE` at the root. |
| `injectZLabels()` | Reads the registry, complete. The components call this, and so should your own. |

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
| `tableRegion` | `z-table-container`, accessible name of the scrollable region | `Tabelle, seitlich scrollbar` | `Table, scrollable horizontally` |

`paginationRange` is the only function. Its signature is
`(from: number, to: number, total: number, itemLabel: string) => string`, where
`from` and `to` are the entry numbers of the current page, 1-based.

## Application-wide

`provideZenitLabels` at the root merges over the German defaults, so a partial
override stays valid: keys that are left out keep their German text.

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

It returns `EnvironmentProviders`, so it also belongs on a route. There it
merges over the labels of the enclosing injector, not over German: a route
that overrides one key inside an English application stays English otherwise.

```ts
// root: provideZenitLabels(Z_LABELS_EN)
{ path: 'billing', providers: [provideZenitLabels({ tableRegion: 'Invoices, scrollable horizontally' })] }
// inside /billing: toastClose is still 'Close', not 'Schließen'
```

A whole language for one lazy route:

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

The inputs per component: `ariaLabel`, `ariaLabelPrev`, `ariaLabelNext` and
`rangeLabel` on `z-pagination`, `logLabel`, `inputLabel` and `endLabel` on `z-console`,
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

`useValue` is typed as a complete `ZLabels`. To change single keys for a
subtree, spread the defaults yourself:

```ts
providers: [{ provide: Z_LABELS, useValue: { ...Z_LABELS_DE, headerMenu: 'Menu' } }];
```

A value that is incomplete anyway (a cast, a JSON file) does not break the
components: they read the registry through `injectZLabels()`, which lays the
provided value over `Z_LABELS_DE`, so a missing key falls back to German
instead of leaving an icon-only button without `aria-label`. Use the same
function in your own components instead of `inject(Z_LABELS)`:

```ts
private readonly labels = injectZLabels();
```
