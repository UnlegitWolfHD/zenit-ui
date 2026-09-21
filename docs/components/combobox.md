# Combobox

Picks one value out of a long list by typing and filtering.

## When to use

- Minecraft version, modpack, Java version, a game from about fifteen on.
- Wherever a select would hold more entries than fit on a screen.

## When not to use

- Up to six options that are meant to be compared. That is `z-option-group`.
- A short fixed list without filtering. That is `z-select`.

## Import

```ts
import { ZCombobox, ZComboOption } from 'zenit-ui';
```

## API

Selector: `z-combobox`

| Input            | Type                      | Default | Description                                                                          |
| ---------------- | ------------------------- | ------- | ------------------------------------------------------------------------------------ |
| `options`        | `readonly ZComboOption[]` | `[]`    | The entries in display order. Tracked by `value`, which has to be unique.            |
| `value`          | `string`                  | `''`    | The chosen `value`, two-way bindable through `[(value)]`.                            |
| `placeholder`    | `string`                  | `''`    | Placeholder of the empty field. Never the label.                                     |
| `emptyText`      | `string`                  | `''`    | The one line shown when nothing matches. Empty falls back to `comboboxEmpty`.        |
| `inputId`        | `string`                  | `''`    | `id` of the input; what a surrounding `z-field` points its `for` at.                 |
| `ariaLabel`      | `string`                  | `''`    | Accessible name where there is no `z-field` around it.                               |
| `ariaLabelledby` | `string`                  | `''`    | `id` of the element that names the field, instead of `ariaLabel`.                    |
| `disabled`       | `boolean`                 | `false` | Locks the field. Independent of the form's disabled state. Boolean attribute.        |
| `filterLocally`  | `boolean`                 | `true`  | `false` shows exactly the `options` given, because the caller filtered them already. |
| `loading`        | `boolean`                 | `false` | Draws the waiting row and sets `aria-busy` while the caller is fetching.             |
| `allowCustom`    | `boolean`                 | `false` | Lets text that matches no entry become the value.                                    |
| `minQueryLength` | `number`                  | `0`     | Characters before the panel shows entries; below it, one hint row instead.           |
| `selectedLabel`  | `string`                  | `''`    | Names the current value while no entry carries it. An entry still wins.              |

| Output        | Payload  | Fires when                                                  |
| ------------- | -------- | ----------------------------------------------------------- |
| `valueChange` | `string` | an entry is taken (the `model()` companion)                 |
| `queryChange` | `string` | the visitor changes the typed text, `''` when it is cleared |

`queryChange` fires on user input only: not when the component writes the label of the value back
into the field, and not on a write to `value`, so it never answers itself. It carries no debounce —
the timing belongs to whoever runs the search, and both recipes are below.

`ZComboOption` is `{ value, label, note?, group? }`: `label` is what the entry reads as and what
stands in the field once it is chosen, `note` a consequence such as the minimum RAM, shown in a
`<small>` and searched along with the label, `group` a heading such as "Aktuell" or "Snapshots".

No content projection. Forms: implements `ControlValueAccessor` and has the shape of a Signal Forms
`FormValueControl<string>`. See [Forms](../forms.md).

## Examples

In a `z-field`, which is where the label and the hint come from:

```html
<z-field label="Minecraft-Version" for="cb-version" hint="Tippen filtert die Liste.">
  <z-combobox
    inputId="cb-version"
    [options]="versionen"
    [(value)]="version"
    emptyText="Keine Version gefunden"
  />
</z-field>
```

The entries, with headings and the consequence of each:

```ts
import { ZComboOption } from 'zenit-ui';

const versionen: ZComboOption[] = [
  { value: 'neueste', label: 'Neueste', note: 'mindestens 4 GB', group: 'Aktuell' },
  { value: '1.20.1', label: '1.20.1', note: 'mindestens 2 GB', group: 'Ältere' },
  { value: '25w14a', label: '25w14a', note: 'mindestens 6 GB', group: 'Snapshots' },
];
```

Standing alone with a name of its own, and in a reactive form. Signal Forms take
`[formField]="formular.java"` in the same place; see [Forms](../forms.md).

```html
<z-combobox ariaLabel="Java-Version" [options]="javaVersionen" [(value)]="java" />
<z-combobox inputId="cb-java" [options]="javaVersionen" [formControl]="java" />
```

## Three modes

The same element does all three. Everything past "local" is opt-in, and the defaults are exactly
what the component always did.

| Mode          | What the caller does                                      | Inputs                                                                |
| ------------- | --------------------------------------------------------- | --------------------------------------------------------------------- |
| **Local**     | hands over the whole list once                            | `options`                                                             |
| **Server**    | searches on every `queryChange` and hands over the answer | `filterLocally="false"`, `loading`, `minQueryLength`, `selectedLabel` |
| **Free text** | takes a value that is in no entry                         | `allowCustom`                                                         |

Server search and free text combine: the wiki tag field below searches and still takes a new tag.

### Local

The component filters `options` itself, case-insensitively over `label` and `note`. Nothing to wire
up; this is the default and the example at the top of this page.

### On the server

The list is the caller's answer, so the component stops filtering and only shows, reports and
waits.

```html
<z-field label="Nutzer" for="cb-nutzer" hint="Ab zwei Zeichen wird gesucht.">
  <z-combobox
    inputId="cb-nutzer"
    placeholder="Name oder E-Mail"
    [options]="gezeigt()"
    [filterLocally]="false"
    [loading]="ergebnis.isLoading()"
    [minQueryLength]="2"
    [value]="gewaehlt()?.value ?? ''"
    [selectedLabel]="gewaehlt()?.label ?? ''"
    (valueChange)="merke($event)"
    (queryChange)="anfrage.set($event)"
    emptyText="Kein Nutzer gefunden"
  />
</z-field>
```

**`resource()`, no debounce.** The query signal is the `params` of the resource. A new query aborts
the running request through its `abortSignal`, which is what a debounce was standing in for: the
answer that arrives is the answer to the last thing typed, and nothing else is ever shown.

```ts
import { linkedSignal, resource, signal } from '@angular/core';

export class NutzerFeld {
  protected readonly anfrage = signal('');
  protected readonly gewaehlt = signal<ZComboOption | null>(null);

  protected readonly ergebnis = resource({
    params: () => {
      const text = this.anfrage().trim();
      return text.length >= 2 ? text : undefined;
    },
    loader: ({ params, abortSignal }) =>
      fetch(`/api/nutzer?q=${encodeURIComponent(params)}`, { signal: abortSignal }).then(
        (a) => a.json() as Promise<ZComboOption[]>,
      ),
    defaultValue: [] as ZComboOption[],
  });

  // A loading resource has no value: `value()` falls back to `defaultValue`.
  // Binding it straight to `options` would empty the panel on every keystroke,
  // and the waiting row would have nothing to stand under.
  protected readonly gezeigt = linkedSignal<ZComboOption[], ZComboOption[]>({
    source: () => this.ergebnis.value(),
    computation: (neu, vorher) => (this.ergebnis.isLoading() ? (vorher?.value ?? []) : neu),
  });

  protected merke(wert: string): void {
    this.gewaehlt.set(this.gezeigt().find((n) => n.value === wert) ?? null);
  }
}
```

**Bind `gezeigt()`, not `ergebnis.value()`.** This is the one line that is easy to get wrong.
A resource whose `params` changed is in status `loading`, and in that status `value()` is the
`defaultValue`, not the last answer. Without the `linkedSignal` the list is blank for the length of
every request, the waiting row stands alone, and "the options stay while it loads" is not true of
your page however true it is of the component. The Angular guide has the same shape as a reusable
helper, `withPreviousValue` over `resource.snapshot` and `resourceFromSnapshots`
([Async reactivity with resources](https://angular.dev/guide/signals/resource)); the four lines
above are that helper for one list.

`params` returning `undefined` keeps the resource idle, so a query below the threshold sends
nothing while `minQueryLength` explains the empty panel.

**RxJS, with a debounce.** Where the request is not free — a search that costs money, a rate limit,
a slow endpoint — put the debounce here, in the caller, not in the component.

```ts
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs';

export class NutzerFeld {
  private readonly anfragen = new Subject<string>();
  protected readonly treffer = toSignal(
    this.anfragen.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      filter((q) => q.trim().length >= 2),
      switchMap((q) => this.http.get<ZComboOption[]>('/api/nutzer', { params: { q } })),
    ),
    { initialValue: [] },
  );
}
```

`switchMap` is what makes this correct: it drops the answer to a query that is no longer the one in
the field. `mergeMap` would let an older, slower answer land last.

**`selectedLabel` is not optional here.** The answer to the third query does not hold the entry
chosen during the first, so `options` cannot name the value any more. Keep the chosen entry, not
only its id, and hand its label back. An entry that is in `options` still wins over it, so a list
that has the entry again shows the fresher label.

**While it loads, the options stay** — as long as you keep handing them over. The waiting row is
appended under whatever `options` holds instead of replacing it: emptying the list for the length
of a request and filling it again is a flicker under the hand that is typing, and the stale rows
are still the best answer known. There is no "no match" row while `loading` is set, because nothing
is known yet. The component cannot keep rows it is no longer given, which is why the recipe above
binds `gezeigt()`.

### Free text

`allowCustom` lets what was typed become the value: Enter with no active row, Tab, Shift+Tab and
leaving the field with the pointer all commit it, trimmed. Text that is only space commits nothing
— it trims to the empty string, so the panel holds the whole list and Enter takes the active row,
exactly as it does without `allowCustom`.

```html
<z-field label="Wiki-Tag" for="cb-tag" hint="Ein vorhandener Tag oder ein neuer.">
  <z-combobox
    inputId="cb-tag"
    placeholder="Tag suchen oder anlegen"
    [options]="tags"
    [(value)]="tag"
    allowCustom
    emptyText="Kein Tag gefunden"
  />
</z-field>
```

- A row `„<text>“ übernehmen` stands at the top of the panel, above the matches, so the affordance
  is visible and reachable with the pointer and the arrow keys. It is gone as soon as the text is
  exactly the **label or the value** of an entry, ignoring case and surrounding space: one row, one
  value. A list keyed by ids is searched by id as often as by name, so typing `u-1` selects the
  entry `{ value: 'u-1', label: 'Beispiel-Nutzer 1' }` instead of offering to make a second one.
- Typing the exact label of an entry and leaving the field takes **that entry's value**, not the
  label. Label and value are not the same thing, and the two ways to the same row must not end in
  two different values.
- The value may therefore be a string that is in no entry. `writeValue` and `[(value)]` with such a
  string show it as it is — this is the one case where the field shows the raw value, and it needs
  no `selectedLabel`.
- **A value the field itself committed is its own label.** It beats `selectedLabel`, which still
  names the entry chosen before it, until you change `selectedLabel` or the value. This matters in
  the combination above: search on the server, pick a user, then type a name that is not in the
  directory — the field shows what was typed, not the user picked a moment ago.
- The action row is not counted as a match. One match plus the action row is announced as
  `1 Treffer`, and the action row standing alone is announced as itself.
- Escape still gives the typed text up. It is the one key that does not commit.
- `minQueryLength` applies: below it nothing is committed either.

## States

| State     | How it looks                                                                               | How to trigger it                       |
| --------- | ------------------------------------------------------------------------------------------ | --------------------------------------- |
| Rest      | a `z-input` with the chevron of `.z-combo::after`                                          | default                                 |
| Focus     | 2px ring in `focus` with 2px offset on the field                                           | Tab                                     |
| Open      | panel in `surface-raised` with `shadow-overlay`                                            | arrow keys, typing, or a click          |
| Active    | the walked entry gets `surface-hover`                                                      | arrow keys, Home, End, hover            |
| Selected  | the chosen entry is bold and carries a check                                               | `[(value)]`                             |
| Empty     | one `.z-listbox__empty` row instead of an empty panel                                      | a filter that matches nothing           |
| Loading   | one `.z-listbox__loading` row with a `z-spinner`, under the options that are already there | `loading`                               |
| Too short | one row `Mindestens 2 Zeichen eingeben` instead of the list                                | `minQueryLength` above the typed length |

Reopening a field that already holds a value shows the "too short" row, not the entry behind that
value: nothing has been typed yet, so there is no query and nothing has been fetched for it. The
field keeps showing its label the whole time, and the first two characters replace the row with a
list. That is deliberate — the alternative is a panel that shows one stale entry and calls it a
result.
| Custom | a row `„<text>“ übernehmen` above the matches | `allowCustom` and text that no entry carries |
| Disabled | field and chevron at 45 percent, `cursor: not-allowed` | `disabled`, or the form |

An error belongs on the surrounding `z-field`.

## Accessibility

- The editable combobox pattern of the ARIA practices: the input carries `role="combobox"`,
  `aria-expanded`, `aria-controls`, `aria-autocomplete="list"` and `aria-activedescendant`; the
  panel is the `role="listbox"`, a heading a `role="group"` with its name.
- **The focus never leaves the input.** Arrow keys, Home and End move the active entry, Enter takes
  it, Escape closes without clearing the field, Tab and Shift+Tab close and move on. A click on an
  entry keeps the focus because the component cancels the `mousedown`.
- Leaving the field with text that matches nothing puts the chosen label back, so the field never
  shows a value that is not the value.
- The component has no visible label of its own. Give it `inputId` inside a `z-field`, or
  `ariaLabel`/`ariaLabelledby` outside one; inside a `z-field` it also picks up that field's
  `aria-describedby` for hint and error.
- No match renders one row instead of an empty panel, as a locked `role="option"`, so the listbox
  keeps a valid child and the sentence is announced.
- A visually hidden `role="status"` beside the field carries the number of matches, or the empty
  sentence. It is always in the markup and only its text changes, which is the one way a screen
  reader hears the size of a list it cannot see. It also carries the waiting text and the
  minimum-length hint, each announced once when the state is entered.
- While `loading` is set the listbox carries `aria-busy="true"`, and the waiting row is a locked
  `role="option"` that is not an entry: the keyboard cannot land on it and Enter cannot take it.
- The row of `allowCustom` is a normal `role="option"` whose name is the whole sentence
  `„<text>“ übernehmen`, so it reads as what it does rather than as a bare repetition of the text.
- `aria-activedescendant` is bounded by the list, not only by the index. Options replaced under an
  open panel keep the active entry if it is still there and fall back to the first one if it is
  not, so the attribute never names a row that has been removed.
- `aria-controls` is only present while the panel is: a reference to a missing id is worse than
  none.
- While the panel is open Escape belongs to the panel and stops there, so a dialog around the
  field does not close along with it.
- Entries of the same `group` land under one heading whatever their order in `options`, so a name
  never appears twice.
- The panel belongs to its field: scrolling the page or an inner container such as a dialog body
  moves it along, and it closes once the field is out of that container, so the list never points
  at something that is no longer there. Scrolling inside the list itself changes nothing.

## Responsive

The panel is as wide as the field, opens below it and above it when there is no room, is at most
248px tall and scrolls. Below 640px an entry is raised from 36px to 40px.

## Rendered classes and tokens

| Class                       | Applies when                                  |
| --------------------------- | --------------------------------------------- |
| `z-combo`                   | the wrapper around the input                  |
| `z-listbox`                 | the panel in the overlay                      |
| `z-listbox__group`          | a heading row                                 |
| `z-listbox__option`         | every entry                                   |
| `z-listbox__option--active` | the entry the keyboard is on                  |
| `z-listbox__empty`          | the no-match, waiting and minimum-length rows |
| `z-listbox__loading`        | the waiting row, next to `z-listbox__empty`   |

Tokens: `--surface-raised` and `--shadow-overlay` for the panel like `z-menu`, `--surface-hover`
for the active entry, `--border` for the frame, `--text-muted` for headings and notes,
`--radius-md` and `--radius-sm`, `--font-mono` for the values. 248px, 36px, the 7px chevron and its
1.5px stroke are literal values from the reference stylesheet.

## Deviations from the reference

- Addition to the reference: `.z-combo-pane .z-listbox` takes the width the component measures off
  the field, because a CDK overlay pane has no width of its own.
- Addition to the reference: `.z-combo:has(.z-input:disabled)::after` dims the chevron, which would
  otherwise stand at full strength next to a field at 45 percent.
- Addition to the reference: below 640px `.z-listbox__option` is at least `--control-md` tall.
- The whole panel cancels its `mousedown`, not only an entry: the scrollbar, a heading and the
  empty row are part of it too, and each of them would otherwise take the focus out of the field.
- Addition to the reference: `.z-listbox__loading` puts the spinner and its word in one flex row.
  It is a modifier beside `.z-listbox__empty` and not a change to that rule, so the no-match row
  keeps wrapping the way it always did.
- **Deviation from `CLAUDE.md`, "Bewegung".** That rule puts a spinner in a button and skeleton
  rows in a list, and this is a spinner in a list row. A `role="listbox"` takes options, and a
  skeleton row is a decorative placeholder with no accessible name: it would be either an option
  that says nothing or a node that breaks the listbox. There is also no honest row count to draw —
  the answer is exactly what nobody knows yet. One locked option with a spinner and the word
  `Lädt`, announced once through the status region, is the only shape that stays announceable.
  Noted in `_konfigurator.css` and in the JSDoc of `z-spinner` as well.
- Addition to the reference: while the panel is open the component listens for `scroll` on the
  document in the capture phase. The panel follows the field whenever anything around it scrolls,
  and closes once the field has left the container that moved. The CDK scroll strategies all run
  on `ScrollDispatcher`, which hears the page and containers marked `cdkScrollable` and nothing
  else, so a field inside a scrolling dialog body kept a panel hanging where the field no longer
  was. Capture hears every scroller without asking a caller to annotate its container. The panel
  also follows the width of the field on a window resize.

## Coming from `mat-autocomplete`

`mat-autocomplete` is an overlay of `mat-option` elements attached to an input through
`[matAutocomplete]`. `z-combobox` is one element that owns both, so the input, the trigger and the
panel collapse into it.

```html
<!-- before -->
<mat-form-field>
  <mat-label>Nutzer</mat-label>
  <input matInput [formControl]="suche" [matAutocomplete]="auto" />
  <mat-autocomplete
    #auto="matAutocomplete"
    [displayWith]="zeigeName"
    (optionSelected)="waehle($event.option.value)"
  >
    @for (n of treffer(); track n.id) {
    <mat-option [value]="n">{{ n.name }}</mat-option>
    }
  </mat-autocomplete>
</mat-form-field>
```

```html
<!-- after -->
<z-field label="Nutzer" for="cb-nutzer">
  <z-combobox
    inputId="cb-nutzer"
    [options]="treffer()"
    [filterLocally]="false"
    [loading]="laedt()"
    [value]="gewaehlt()?.value ?? ''"
    [selectedLabel]="gewaehlt()?.label ?? ''"
    (valueChange)="waehle($event)"
    (queryChange)="anfrage.set($event)"
  />
</z-field>
```

| `mat-autocomplete`               | `z-combobox`                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------- |
| `mat-option` children            | the `options` array; `{ value, label, note?, group? }`, no projected content |
| `mat-optgroup`                   | `group` on the entry                                                         |
| `[displayWith]`                  | `label` of the entry, plus `selectedLabel` for a value no entry carries      |
| `(optionSelected)`               | `(valueChange)`, which carries the plain `value`, not an event object        |
| the control's own `valueChanges` | `(queryChange)`, which is the typed text and only the typed text             |
| `[matAutocomplete]` on the input | nothing: the component is the input                                          |
| `autoActiveFirstOption`          | always on; the chosen entry is active, otherwise the first                   |
| `requireSelection`               | the default; `allowCustom` is how you turn it off                            |
| `panelWidth`                     | nothing: the panel is as wide as the field                                   |

Four differences that change what a page does:

- **The value is a `string`, not an object.** `mat-option` takes any object as its `[value]`;
  `ZComboOption.value` is the id. A form model holding the whole object keeps it in the component,
  as `gewaehlt` above, and binds the id.
- **`displayWith` has no counterpart, and does not need one.** The entry names itself through
  `label`. The one case `displayWith` covered that `label` does not is a value whose entry is not
  in the list — that is `selectedLabel`.
- **The old value stream was the control's.** `mat-autocomplete` left the input to you, so the
  search ran off `suche.valueChanges`. Here the field owns its text: `queryChange` is the search
  input, `valueChange` is the result. Wiring the search to `valueChange` is the usual mistake.
- **Filtering is off by default here.** A `mat-autocomplete` filtered in the caller's pipe already;
  keep that pipe and set `[filterLocally]="false"`, or drop the pipe and let the component filter.
  Doing both filters twice.

## Do / Don't

- Do preselect a real value ("Neueste"), never an empty field.
- Do put the consequence of an entry in its `note`, so it does not surface first in the summary.
- Do group pre-releases and snapshots instead of adding switches for them.
- Do keep the chosen entry, not only its id, wherever the list comes from a server, and hand its
  label back through `selectedLabel`.
- Do put the debounce in the caller, where the cost of a request is known.
- Don't build a tile grid in a scroll box for a hundred versions.
- Don't clear the field on Escape.
- Don't move the focus into the panel.
- Don't run the search off `valueChange`: that is the chosen entry, not what was typed.
- Don't filter `options` and leave `filterLocally` on. One of the two.
