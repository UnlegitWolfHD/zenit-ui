# Signals

State in this workspace is signals: in the library, in the demo application and
in the example application. This page holds the conventions, the result of the
audit that moved the last remaining patterns over, and the list of things that
stay as they are on purpose.

Angular 22.1 is the baseline. `resource()`, `linkedSignal()`, signal queries and
Signal Forms (`@angular/forms/signals`) are all `@publicApi 22.0`, so none of
this is experimental.

## Conventions

### Inputs, models, outputs

| Need                                | Use                                                                                                   |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Value from the parent               | `input()`, `input.required()`, with `transform: booleanAttribute` or `numberAttribute` for attributes |
| Value the component changes as well | `model()`, bound with `[(value)]` or `[(checked)]`                                                    |
| Event                               | `output()`                                                                                            |
| Dependency                          | `inject()` in a field initialiser, never a constructor parameter                                      |
| Query parameter or route parameter  | `withComponentInputBinding()` plus `input()`                                                          |

No `@Input`, `@Output`, `EventEmitter`, `@HostBinding` or `@HostListener`. Host
bindings and listeners stand in the `host` object of the decorator.

### Queries

`viewChild()`, `viewChild.required()`, `contentChild()` and `contentChildren()`.
A query is a signal, so whatever depends on it is a `computed()` or an
`afterRenderEffect()`, not `ngAfterViewInit`. Examples: `ZConsole` (`viewChild`),
`ZSidebar` (`contentChildren`), `ZTableContainer` (`contentChild`).

### Derived state

- **`computed()`** for everything that follows from other signals. This is the
  default; a lifecycle hook that copies an input into a field does not exist
  here.
- **`linkedSignal()`** when the value follows a source but the component may
  overwrite it until the source changes again. `ServerList` puts the page back
  to 1 when a new list arrives; the Gameserver page derives the simulation from
  `?zustand=` and lets "Erneut laden" overwrite it.
- **`resource()`** for anything asynchronous. Loading, error and value are its
  signals, a change of `params` aborts the running load, and `update()` writes
  local changes. The library loads nothing and has no resource; the example
  application has two (the list, and the 300ms delay before skeleton rows).
  `value()` throws in the error state: read it behind `hasValue()`.

### Effects

`computed()` answers "what is this value". An effect is for the other question:
"something outside the signal graph has to hear about this". An effect is
legitimate when its body does one of these and nothing else:

1. **Writes to the DOM or to a browser API** that no template binding reaches:
   scroll position (`ZConsole`, as `afterRenderEffect` with `earlyRead` and
   `write` so layout is never read in the write phase), measuring overflow
   (`ZTableContainer`).
2. **Talks to an object that was created imperatively**, for example the
   tooltip panel inside a CDK overlay (`ZTooltip`).
3. **Writes a `model()` back to its owner.** `ZPagination` clamps `page` when
   `total` shrinks. The shown page is a `computed()`; only the write back to
   the parent is an effect, because a `computed()` cannot write.

An effect is not legitimate when it sets a signal from other signals (that is a
`computed()` or a `linkedSignal()`), when it starts a load (that is a
`resource()`), or when it copies a form value around (that is Signal Forms).

`afterNextRender()` is the place for one-time DOM setup such as a
`MutationObserver` or a `ResizeObserver`; its teardown goes to
`inject(DestroyRef).onDestroy(...)`. No class of the library or of the two
applications implements `ngOnDestroy`.

Fields that no template and no `computed()` reads stay plain fields: timer
handles, the history pointer of the console, the id counter of the toasts.
Wrapping them in signals would add change notifications nobody listens to.

### Forms

Signal Forms are the default.

```ts
import { form, FormField, max, min } from '@angular/forms/signals';

protected readonly werte = signal({ suche: '', maxSpieler: 20 });
protected readonly formular = form(this.werte, (pfad) => {
  min(pfad.maxSpieler, 1);
  max(pfad.maxSpieler, 20);
});
```

```html
<input zInput type="search" [formField]="formular.suche" />
<input zInput type="number" [formField]="formular.maxSpieler" />
<z-select>
  <select [formField]="formular.status">
    …
  </select>
</z-select>
<z-toggle [formField]="formular.pvp" ariaLabelledby="…" />
```

- The model is one `signal()`. Everything derived from the form is a
  `computed()` over that signal; nothing subscribes to `valueChanges`.
- `formular.feld` is the field, `formular.feld()` its state: `value` (a
  `WritableSignal`), `invalid()`, `touched()`, `errors()`, `reset(value?)`.
- The directive is `FormField`, selector `[formField]`. It works on native
  controls, on components with a `value = model()` or `checked = model()`
  (`FormValueControl`, `FormCheckboxControl`) and, for old code, on a
  `ControlValueAccessor`.
- `[formField]` owns `name`, `disabled`, `required`, `readonly`, `min`, `max`,
  `minLength` and `maxLength` of its element. They come from the schema. A
  binding such as `[min]` next to `[formField]` is the compile error NG8022,
  also on `z-slider`.
- It also sets an `invalid` input if a directive on the element has one, so
  `input[zInput]` gets `aria-invalid` from the form without any wiring.
- On native controls it listens to `input`, not to `change`. A browser fires
  both on a `select`; a unit test has to dispatch `input`.
- A single control is a form as well: `form(signal(''))`, bound as
  `[formField]="notiz"`.

**Reactive Forms interop.** `z-checkbox`, `z-toggle`, `z-slider` and
`z-segment` keep their `ControlValueAccessor`, so `formControl`,
`formControlName` and `ngModel` continue to work in applications that have
them. New code in this workspace does not use them. `[(value)]` or
`[(checked)]` on a plain signal is fine for a lone switch that is not part of a
form, such as the state switch of the dashboard pattern.

### RxJS

No RxJS in components, with one exception: an API that returns an Observable.
When it emits exactly once, await it:

```ts
const bestaetigt = await firstValueFrom(this.dialog.confirm({ … }));
```

When it emits over time and the template needs the value, `toSignal()`. A
manual `subscribe()` needs a reason in a comment and `takeUntilDestroyed()`.
After the audit no code in the library or in the two applications calls
`subscribe(`; the one remaining hit is the JSDoc example of `ZDialog.confirm()`
in `lib/dialog/`, which belongs to another package.

## Audit: what was found and what replaced it

The library and both applications were written against Angular 22 from the
start, so the classic targets (`ngOnInit`, `ngOnChanges`, `@Input`, `@Output`,
`@ViewChild`, `EventEmitter`, `BehaviorSubject`, `ngModel`, `FormGroup`) had no
hit. What was left:

| Pattern found                                                                                                                                   | Replaced by                                                                                                                        | Where                                                                                          |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `implements OnDestroy` plus `ngOnDestroy()`                                                                                                     | `inject(DestroyRef).onDestroy(...)` next to the setup it undoes                                                                    | `lib/toast/toast.ts`, `lib/tooltip/tooltip.ts`                                                 |
| Service with two private signals, a timer array, a hand-written state machine (`start`, `skelett`, `liste`, `leer`, `fehler`) and `ngOnDestroy` | `resource({ params, loader })` on the page; the service is one stateless `laden(simulation, abortSignal): Promise`                 | `beispiel-app/gameserver/gameserver-data.ts`, `pages/gameserver/gameserver.ts`                 |
| `setTimeout(..., 300)` that flips the state to `skelett`, cleared by hand                                                                       | a second `resource()` with `params: () => liste.isLoading() \|\| undefined` and a 300ms loader; the `AbortSignal` clears the timer | `pages/gameserver/gameserver.ts`                                                               |
| `effect(() => daten.laden(simulation()))` that pushed an input into a service                                                                   | `linkedSignal()` from the input, read by the `params` of the resource                                                              | `pages/gameserver/gameserver.ts`                                                               |
| Retry by calling the service again                                                                                                              | `simulation.set('normal')`; a real page calls `liste.reload()`                                                                     | `pages/gameserver/gameserver.ts`                                                               |
| `daten.entfernen(id)` mutating the service                                                                                                      | `liste.update(...)`, the `'local'` state of the resource                                                                           | `pages/gameserver/gameserver.ts`                                                               |
| Two signals plus `(input)="sucheSetzen($event)"`, `(change)="statusSetzen($event)"`, `[value]`, `[selected]` and casts of `$event.target`       | `form(signal({ suche, status }))`, `[formField]` on `input[zInput]` and on the native `select`, `filter().reset(KEIN_FILTER)`      | `pages/gameserver/gameserver.ts`                                                               |
| `confirm(...).subscribe(...)`                                                                                                                   | `await firstValueFrom(confirm(...))`                                                                                               | `beispiel-app/pages/gameserver`, `ui-demo/pages/overlays`, `ui-demo/pages/muster/server-panel` |
| `open(...).closed.subscribe(...)`                                                                                                               | `await firstValueFrom(open(...).closed)`                                                                                           | `ui-demo/pages/overlays`                                                                       |
| Template reference `#notiz` and `notiz.value` in a dialog form                                                                                  | `form(signal(''))` and `[formField]`                                                                                               | `ui-demo/pages/overlays` (NotizDialog)                                                         |
| `(change)="setzeStatus($event)"` plus `[selected]` on the demo switch                                                                           | `form(this.status)`, `[formField]` on the `select`; the buttons of the page keep writing `status`                                  | `ui-demo/pages/muster/server-panel.page.ts`                                                    |
| Four loose signals for toggles, a `select` and a number input without any model                                                                 | one Signal Form with `min`/`max` in the schema; the values now survive a tab change                                                | `ui-demo/pages/muster/server-panel.page.ts`                                                    |
| Four loose signals, `[(value)]`, `[min]`, `[max]` on the calculator                                                                             | one Signal Form, limits in the schema, price as `computed()` over the model                                                        | `ui-demo/pages/muster/startseite.page.ts`                                                      |

Behaviour is unchanged with one exception that is on purpose: on the Gameserver
page, leaving `?zustand=fehler` through "Erneut laden" and then following a link
to `/gameserver` no longer loads a second time, because the simulation is
already `normal`. Before, the effect ran again for an equal value.

## Deliberately not converted

| What                                                                                                                       | Why it stays                                                                                                                                                                               |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ControlValueAccessor` on `z-checkbox`, `z-toggle`, `z-slider`, `z-segment`                                                | Reactive Forms and `ngModel` interop for applications that have them. `[formField]` does not need it: it binds the `value` or `checked` model.                                             |
| `ZDialog.confirm(): Observable<boolean>` and `DialogRef.closed`                                                            | Prescribed by the API table ("Als eigene Library") respectively by the CDK. Callers await them with `firstValueFrom()`.                                                                    |
| Observable-based CDK APIs (`Dialog`, `Overlay`, `DialogRef.closed`)                                                        | They are the CDK's public surface. The library bridges them at one place each and hands signals or outputs to the application.                                                             |
| `effect()` in `ZPagination`                                                                                                | It writes the clamped page back into a `model()` owned by the parent. See "Effects", case 3.                                                                                               |
| `effect()` in `ZTooltip`                                                                                                   | It pushes the text into a component that lives in an overlay and was created with a `ComponentPortal`. See "Effects", case 2.                                                              |
| `afterRenderEffect()` in `ZConsole` and `ZTableContainer`                                                                  | They are the signal API for DOM reads and writes. Nothing to convert.                                                                                                                      |
| `MutationObserver` in `ZSidebar` and `ZMenuItem`, `ResizeObserver` in `ZTableContainer`, `matchMedia` listener in `ZTheme` | Browser APIs with callbacks. Each one is bridged into a signal at exactly one place and torn down through `DestroyRef`. `toSignal(fromEvent(...))` would pull RxJS in for the same result. |
| Plain private fields: timer handles in `ZToast` and `ZTooltip`, `bisher`/`zeiger` in `ZConsole`, id counters               | No template and no `computed()` reads them.                                                                                                                                                |
| `queueMicrotask()` before the delete dialog opens                                                                          | It orders two focus moves of the CDK (menu closes, dialog opens). That is timing, not state.                                                                                               |
| `resource()` in the library                                                                                                | Nothing in the library loads data.                                                                                                                                                         |
| `[(value)]="zustand"` on the `z-segment` of the dashboard pattern, static inputs on the Themes page                        | A lone demo switch bound to a signal is signal-based already; the Themes inputs have no state at all.                                                                                      |
| `ZSelect.ngAfterContentChecked` (`lib/field/select.ts`)                                                                    | The only lifecycle hook left in the workspace. It mirrors `aria-describedby` onto a projected `select`. The file belongs to the forms package and was out of scope for this audit.         |
| Explicit `changeDetection: ChangeDetectionStrategy.OnPush`                                                                 | OnPush is the default in Angular 22 and the line could go, in 85 files. It is unrelated to signals and was left for its own change.                                                        |
