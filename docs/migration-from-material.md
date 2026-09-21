# Migrating an Angular Material frontend to zenit-ui

This guide is for the **later, separate job**: phases 4 to 6 of `spec/guidelines/00-auftrag.md`, moving the existing Zenit-Hosting frontend from Angular Material onto `zenit-ui`. That job starts only when a human asks for it.

It was written from the design system and from the built library alone. The existing frontend was deliberately not opened, searched or read — `00-auftrag.md` forbids it for this project. Everything about the current code is therefore either quoted from the specification or written from general Angular Material knowledge, and is marked as such. The `zenit-ui` side is verified against the real selectors, inputs and templates on this branch.

## 1. Scope and hard constraints

From `00-auftrag.md`, "Harte Vorgaben":

- **Templates, styles and imports only.** No change to business logic, services, API calls, routes or prices.
- No `@angular/material`, not even temporarily. The only thing that stays from Material is the Material Icons webfont.
- Values come from `tokens.css` only. No hex, no `rgb()`, no spacing or radius outside the tokens.
- Nothing from the prohibition list in `CLAUDE.md`, section "Verboten".
- Texts from the component READMEs and the page patterns are taken over word for word. Example texts (FAQ answers, prices in PriceSummary) keep coming from the existing content and services.
- The logo comes from the repository. It is not redrawn.
- No tests against the live account, no login, no passwords.
- No push and no deploy without explicit approval.

What this means in practice: a route is migrated by rewriting its template and deleting its component styles. If a route cannot be migrated without touching a service or a route definition, that is a finding for the master, not a change to make.

## 2. Order of work

Phases 4 to 6 of `00-auftrag.md` and "Einbau in die App" in `40-bibliothek.md` agree on this order:

1. **Install and wire up the library.** `ng build zenit-ui`, `npm pack` in `dist/zenit-ui`, `npm i ./zenit-ui-0.1.0.tgz` in the application. Then the four styles in `angular.json` in exactly this order: `zenit-ui/styles/tokens.css`, `@angular/cdk/overlay-prebuilt.css`, `zenit-ui/styles/zenit-ui.css`, `src/styles.css`.
2. **`z-root` on `<html>` and on `<body>`.** This is what makes Arial disappear: the class sets `font: inherit` for `button`, `input`, `select` and `textarea`. `20-bestandsaufnahme.md` counts 72 elements on the start page and 51 in the panel that fall back to Arial today.
3. **Self-host the fonts.** Material Icons, Inter, Space Grotesk, JetBrains Mono, with `layer(schriften)` on the Material Icons import — see `projects/zenit-ui/README.md`, step 3. Press Start 2P and Fira Code are dropped.
4. **Shell.** AppHeader, page frame, Footer. Mount `<z-toast-outlet />` once at the end of the layout.
5. **Route by route**, public pages first, following `10-seitenmuster.md`. Old and new components may stand side by side for as long as this takes.
6. **Stylelint for `src/` from warning to error**, once the last route is migrated.
7. **Remove Material**: the package, the theme, every `Mat*` import, and `provideAnimations` if it was only there for Material.

Phase 4 is done when the application builds and Arial is gone. Phase 6 is done when `grep -r "@angular/material" src` finds nothing and `npm ls @angular/material` is empty.

## 3. Mapping table

One row per row of the table "Material ablösen" in `spec/guidelines/30-angular.md`. The "before" column is ordinary Angular Material usage written from general knowledge — the real templates were not read. The "after" column uses the selectors and inputs that exist in `projects/zenit-ui/src/lib`.

### 3.1 `mat-toolbar` → AppHeader

```html
<!-- before -->
<mat-toolbar color="primary">
  <a routerLink="/">Zenit</a>
  <a mat-button routerLink="/gameserver">Gameserver</a>
  <a mat-flat-button color="accent" routerLink="/neu">Server erstellen</a>
</mat-toolbar>
```

```html
<!-- after -->
<z-app-header navLabel="Hauptnavigation">
  <a zBrand href="/">Zenit</a>
  <a zHeaderLink routerLink="/gameserver" [active]="true">Gameserver</a>
  <a zHeaderLink routerLink="/abrechnung">Abrechnung</a>
  <a zBtn="primary" size="sm" zHeaderEnd routerLink="/neu">Server erstellen</a>
</z-app-header>
```

`z-app-header` brings its own burger button below 900px (`aria-label` from `menuLabel`, `aria-expanded`, `aria-controls`). There is no `color` input: the header is always `bg` with a 1px bottom border.

### 3.2 `mat-icon` → `z-icon`

```html
<!-- before -->
<mat-icon>delete</mat-icon>
<mat-icon fontIcon="settings"></mat-icon>
```

```html
<!-- after -->
<z-icon name="delete" />
<z-icon name="settings" size="sm" />
```

`name` is required. The component renders the ligature with `aria-hidden="true"`, so an icon-only control needs its own `aria-label`. `size="sm"` is the 16px variant for badges; the default is 20px. `MatIconModule` and `MatIconRegistry` go away; the webfont stays.

### 3.3 `mat-button` and friends → `button[zBtn]`

```html
<!-- before -->
<button mat-flat-button color="primary">Speichern</button>
<button mat-stroked-button>Abbrechen</button>
<button mat-button>Zurücksetzen</button>
<button mat-icon-button aria-label="Löschen"><mat-icon>delete</mat-icon></button>
```

```html
<!-- after -->
<button zBtn="primary">Speichern</button>
<button zBtn="secondary">Abbrechen</button>
<button zBtn="ghost">Zurücksetzen</button>
<button zBtn="ghost" iconOnly type="button" aria-label="Löschen"><z-icon name="delete" /></button>
```

`mat-flat-button` → `primary`, `mat-stroked-button` → `secondary` (the default, so bare `zBtn` is secondary), `mat-button` → `ghost`, `mat-icon-button` → `iconOnly`. Extra inputs: `size: 'sm' | 'md' | 'lg'`, `block`, `loading`, `disabled`. `loading` puts a spinner in front of the label and disables the button, which replaces the usual "disable it and swap the label" pattern.

Watch the acceptance rule: at most one primary button per screen height. A Material page with three `color="primary"` buttons becomes one primary plus secondaries.

### 3.4 `mat-form-field` with `matInput` → `z-field` with `input[zInput]`

```html
<!-- before -->
<mat-form-field appearance="outline">
  <mat-label>Name</mat-label>
  <input matInput [formControl]="name" />
  <mat-hint>Erscheint in der Serverliste.</mat-hint>
  <mat-error *ngIf="name.hasError('required')">Gib einen Namen ein.</mat-error>
</mat-form-field>
```

```html
<!-- after -->
<z-field
  label="Name"
  for="name"
  hint="Erscheint in der Serverliste."
  [error]="name.touched && name.hasError('required') ? 'Gib einen Namen ein.' : ''"
>
  <input zInput id="name" [formControl]="name" [invalid]="name.touched && name.invalid" />
</z-field>
```

`z-field` has no floating label and no `appearance`. The label is a real `<label for="…">`, so `for` on the field and `id` on the control have to match. `error` is a plain string: non-empty means the error is shown instead of the hint. There is no `*ngIf` list of `mat-error` elements — the caller reduces the control's errors to one sentence, and per `CLAUDE.md` that sentence names cause and next step.

`textarea[zInput]` works the same way. `mono` renders the value in JetBrains Mono, for IP addresses, ports and config keys.

### 3.5 `mat-select` → `z-select` with a native `<select>`

```html
<!-- before -->
<mat-form-field>
  <mat-label>Status</mat-label>
  <mat-select [(value)]="status">
    <mat-option value="alle">Alle Status</mat-option>
    <mat-option value="online">Online</mat-option>
  </mat-select>
</mat-form-field>
```

```html
<!-- after -->
<z-field label="Status" for="sel-status">
  <z-select>
    <select id="sel-status" [(ngModel)]="status">
      <option value="alle">Alle Status</option>
      <option value="online">Online</option>
    </select>
  </z-select>
</z-field>
```

This is the biggest behavioural change in the list; see section 4.1.

### 3.6 `mat-checkbox`, `mat-slide-toggle` → Checkbox, Toggle

```html
<!-- before -->
<mat-checkbox [(ngModel)]="backups">Backups aktiv</mat-checkbox>
<mat-slide-toggle [checked]="whitelist" (change)="setze($event.checked)"
  >Whitelist</mat-slide-toggle
>
```

```html
<!-- after -->
<z-checkbox [(checked)]="backups" ariaLabel="Backups aktiv" />
<z-setting title="Whitelist" description="Nur eingetragene Namen dürfen verbinden.">
  <z-toggle [(checked)]="whitelist" ariaLabel="Whitelist" />
</z-setting>
```

Both implement `ControlValueAccessor`, so `[(ngModel)]` and `[formControl]` keep working unchanged. Neither projects a label of its own: the text comes from `ariaLabel`, or from the surrounding `z-setting` (`title`, `key`, `description`, `titleId`) for a settings row.

### 3.7 `mat-slider` → `z-slider`

```html
<!-- before -->
<mat-slider min="1" max="16" step="1" discrete>
  <input matSliderThumb [(ngModel)]="ram" />
</mat-slider>
```

```html
<!-- after -->
<z-slider
  label="Arbeitsspeicher"
  [min]="1"
  [max]="16"
  [step]="1"
  unit="GB"
  [ticks]="[1, 4, 8, 16]"
  hint="4 GB reichen für etwa 10 Spieler."
  [(value)]="ram"
/>
```

`z-slider` is a native `<input type="range">` with its own label, value readout, unit and tick marks. `ticks` is a list of strings or numbers printed under the track, not a Material-style value bubble.

### 3.8 `mat-tab-group`, `mat-tab-nav-bar` → Tabs

```html
<!-- before -->
<mat-tab-group>
  <mat-tab label="Übersicht"><app-overview /></mat-tab>
  <mat-tab label="Speicher"><app-storage /></mat-tab>
</mat-tab-group>
```

```html
<!-- after -->
<nav zTabs aria-label="Serverbereiche">
  <a zTab routerLink="uebersicht" [active]="bereich() === 'uebersicht'">Übersicht</a>
  <a zTab routerLink="speicher" [active]="bereich() === 'speicher'">Speicher</a>
</nav>
<router-outlet />
```

See section 4.7: these are links, not tab panels.

### 3.9 `mat-button-toggle-group` → `z-segment`

```html
<!-- before -->
<mat-button-toggle-group [(value)]="zeitraum" aria-label="Zeitraum">
  <mat-button-toggle value="3">3 Monate</mat-button-toggle>
  <mat-button-toggle value="6">6 Monate</mat-button-toggle>
</mat-button-toggle-group>
```

```html
<!-- after -->
<z-segment
  [options]="[
    { value: '3', label: '3 Monate' },
    { value: '6', label: '6 Monate' },
  ]"
  [(value)]="zeitraum"
  ariaLabel="Zeitraum"
/>
```

The options are data, not projected content. At most four options; more than that is a select. Single selection only — there is no multiple mode.

### 3.10 `mat-card` → `z-panel`

```html
<!-- before -->
<mat-card>
  <mat-card-header><mat-card-title>Meine Server</mat-card-title></mat-card-header>
  <mat-card-content>…</mat-card-content>
  <mat-card-actions><button mat-button>Alle anzeigen</button></mat-card-actions>
</mat-card>
```

```html
<!-- after -->
<z-panel title="Meine Server">
  <a zBtn="ghost" size="sm" zPanelActions routerLink="/server">Alle anzeigen</a>
  …
</z-panel>
```

`[zPanelActions]` is the slot in the panel head, on the right of the title. `flush` removes the inner padding for a table or a row list that should touch the border; `busy` sets `aria-busy`. A `z-pagination` inside the panel is moved to the end automatically.

The bigger change is where panels are used at all: per `CLAUDE.md`, "Rahmen nur um Werkzeuge". `20-bestandsaufnahme.md` lists "Karte mit 16px Radius um jeden Inhalt" on the public pages as a pattern to remove — that text becomes free-standing text with spacing and 1px rules, not a panel.

### 3.11 `mat-chip` → `z-badge`

```html
<!-- before -->
<mat-chip color="primary" selected>Online</mat-chip>
```

```html
<!-- after -->
<z-badge status="success" dot>Online</z-badge>
```

`status` is one of `neutral | success | warning | danger | info`, `dot` adds the leading dot. A badge is not interactive and has no remove button; a removable `mat-chip` has no counterpart and needs a different pattern. Per the acceptance list a status is always also a word, so the label stays.

### 3.12 `mat-table`, `mat-sort` → FileTable

```html
<!-- before -->
<table mat-table [dataSource]="dateien" matSort>
  <ng-container matColumnDef="name">
    <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
    <td mat-cell *matCellDef="let d">{{ d.name }}</td>
  </ng-container>
  <tr mat-header-row *matHeaderRowDef="spalten"></tr>
  <tr mat-row *matRowDef="let row; columns: spalten"></tr>
</table>
```

```html
<!-- after -->
<z-table-container ariaLabel="Dateien im Serververzeichnis">
  <table zTable>
    <thead>
      <tr>
        <th>Name</th>
        <th zNum>Größe</th>
        <th zNum>Geändert</th>
      </tr>
    </thead>
    <tbody>
      @for (d of dateien(); track d.name) {
      <tr>
        <td>
          <span zTableName
            ><z-icon [name]="d.ordner ? 'folder' : 'description'" />{{ d.name }}</span
          >
        </td>
        <td zNum>{{ d.groesse }}</td>
        <td zNum>{{ d.geaendert }}</td>
      </tr>
      }
    </tbody>
  </table>
</z-table-container>
```

`table[zTable]` is a plain HTML table with classes; the semantics, the header cells and the keyboard behaviour stay the browser's. `zNum` right-aligns a column and sets the mono font, `zTableName` is the name cell with its icon. There is no `DataSource` and no sorting built in. `30-angular.md` allows `@angular/cdk/table` where a data source and sorting are genuinely needed, but that is a decision per route, not a default.

`z-table-container` is the horizontally scrolling region. It carries `role="region"`, `tabindex="0"` and `aria-label`, so the scroll area is reachable by keyboard — pass a real `ariaLabel` instead of leaving the German default.

### 3.13 `mat-paginator` → `z-pagination`

```html
<!-- before -->
<mat-paginator
  [length]="total"
  [pageSize]="25"
  [pageIndex]="index"
  (page)="lade($event.pageIndex, $event.pageSize)"
>
</mat-paginator>
```

```html
<!-- after -->
<z-pagination [total]="total()" [pageSize]="25" itemLabel="Rechnungen" [(page)]="seite" />
```

See section 4.5: 1-based, two-way bound, no event object.

### 3.14 `MatDialog` → `ZDialog`

```ts
// before
const ref = this.dialog.open(DeleteDialog, { data: { name }, width: '480px' });
ref.afterClosed().subscribe((ok) => {
  if (ok) this.entferne(name);
});
```

```ts
// after
this.dialog
  .confirm({
    title: `Server "${name}" löschen?`,
    body: 'Alle Welten und Backups gehen verloren. Das lässt sich nicht rückgängig machen.',
    confirmLabel: 'Löschen',
    cancelLabel: 'Abbrechen',
    danger: true,
    requireText: name,
  })
  .subscribe((bestaetigt) => {
    if (bestaetigt) this.entferne(name);
  });
```

For a dialog with its own content, `ZDialog.open(component, config)` takes a `DialogConfig` of `@angular/cdk/dialog` and returns its `DialogRef`. The component's root element is `<z-dialog title="…">` with the buttons in `[zDialogActions]`:

```html
<z-dialog title="Server umbenennen">
  <z-field label="Neuer Name" for="neu"><input zInput id="neu" [formControl]="name" /></z-field>
  <button zBtn="ghost" zDialogActions (click)="ref.close()">Abbrechen</button>
  <button zBtn="primary" zDialogActions (click)="ref.close(name.value)">Umbenennen</button>
</z-dialog>
```

See section 4.3 for what changes at the call sites.

### 3.15 `mat-menu` → `z-menu`

```html
<!-- before -->
<button mat-icon-button [matMenuTriggerFor]="menu" aria-label="Aktionen">
  <mat-icon>more_vert</mat-icon>
</button>
<mat-menu #menu="matMenu">
  <button mat-menu-item (click)="kopiere()">
    <mat-icon>content_copy</mat-icon><span>Adresse kopieren</span>
  </button>
  <mat-divider></mat-divider>
  <button mat-menu-item [disabled]="laeuft()" (click)="loesche()">
    <mat-icon>delete</mat-icon><span>Server löschen</span>
  </button>
</mat-menu>
```

```html
<!-- after -->
<button zBtn="ghost" iconOnly type="button" [cdkMenuTriggerFor]="menu" aria-label="Aktionen">
  <z-icon name="more_vert" />
</button>
<ng-template #menu>
  <z-menu>
    <button zMenuItem icon="content_copy" (triggered)="kopiere()">Adresse kopieren</button>
    <z-menu-separator />
    <button zMenuItem icon="delete" danger [disabled]="laeuft()" (triggered)="loesche()">
      Server löschen
    </button>
  </z-menu>
</ng-template>
```

The trigger is `[cdkMenuTriggerFor]` from `@angular/cdk/menu` on an `ng-template`, not a `#menu="matMenu"` reference. The item's event is `(triggered)`, not `(click)`, because the CDK also fires it on Enter and Space. `icon` is an input, not projected content, and `danger` marks a destructive entry, which belongs below a `z-menu-separator` and always opens a dialog.

### 3.16 `MatSnackBar` → `ZToast`

```ts
// before
this.snackBar.open('Server gestartet', 'Rückgängig', { duration: 4000 });
```

```ts
// after
this.toast.success('Server gestartet', {
  actionLabel: 'Rückgängig',
  action: () => this.stoppe(),
  duration: 4000,
});
```

See section 4.4.

### 3.17 `matTooltip` → `zTooltip`

```html
<!-- before -->
<button mat-icon-button matTooltip="Neu starten" matTooltipPosition="above">…</button>
```

```html
<!-- after -->
<button zBtn="ghost" iconOnly type="button" zTooltip="Neu starten" aria-label="Neu starten">
  …
</button>
```

The directive takes the text as its own value and has no position, delay or class inputs. See section 4.8.

### 3.18 `mat-progress-spinner`, `mat-progress-bar` → Spinner, Meter, Skeleton

```html
<!-- before -->
<mat-spinner diameter="20"></mat-spinner>
<mat-progress-bar mode="determinate" [value]="89"></mat-progress-bar>
<mat-progress-bar mode="indeterminate"></mat-progress-bar>
```

```html
<!-- after -->
<z-spinner label="Wird geladen" />
<button zBtn="primary" loading>Wird gestartet</button>

<z-metric label="Speicher" value="21,4" unit="/ 24 GB" [percent]="89" sub="89 % belegt" />

<z-skeleton />
<z-skeleton width="60%" />
<z-skeleton thumb />
```

Three different replacements for two Material components:

- A **determinate** bar is a `z-metric` with `percent`. The meter turns `warning` from 80 % and `danger` from 95 %, and the same information is repeated as a word in `sub`.
- An **indeterminate** bar while a list loads is `z-skeleton` rows in the same grid as the real rows.
- A spinner **inside a button** is the `loading` input, not a separate `z-spinner`.

`z-spinner` without a `label` is decorative and `aria-hidden`; with a label it becomes a `role="status"`.

### 3.19 `mat-expansion-panel` → `z-faq`

```html
<!-- before -->
<mat-expansion-panel>
  <mat-expansion-panel-header>Wie lange dauert die Einrichtung?</mat-expansion-panel-header>
  <p>In etwa 60 Sekunden.</p>
</mat-expansion-panel>
```

```html
<!-- after -->
<z-faq question="Wie lange dauert die Einrichtung?" open>
  <p>In etwa 60 Sekunden.</p>
</z-faq>
```

`z-faq` is `<details>`/`<summary>`, so open and close work without JavaScript and without an animation. There is no accordion mode: several `z-faq` elements open independently, and a Material accordion with `[multi]="false"` loses its single-open behaviour. It is meant for FAQ content, not as a general collapsible container.

### 3.20 `mat-stepper` → `z-stepper`

```html
<!-- before -->
<mat-stepper [selectedIndex]="schritt">
  <mat-step label="Spiel"><app-game-step /></mat-step>
  <mat-step label="Leistung"><app-plan-step /></mat-step>
  <mat-step label="Bezahlung"><app-pay-step /></mat-step>
</mat-stepper>
```

```html
<!-- after -->
<z-stepper [steps]="['Spiel', 'Leistung', 'Bezahlung']" [current]="schritt()" />
<!-- the step's own content follows, rendered by the page -->
```

`z-stepper` is a display only: it shows where you are, it does not hold the step content and it does not manage navigation. The page keeps its own state and renders the current step itself. Two to four steps, per the Stepper README. `/preise` loses its three-step display entirely — the calculator there becomes one form with everything visible at once.

### 3.21 `mat.theme`, `--mat-sys-*`, `--mat-app-*` → `tokens.css`

```scss
// before, in styles.scss
@use '@angular/material' as mat;

html {
  @include mat.theme(
    (
      color: (
        primary: mat.$rose-palette,
      ),
      typography: Roboto,
    )
  );
}
```

```json
// after, in angular.json
"styles": [
  "zenit-ui/styles/tokens.css",
  "@angular/cdk/overlay-prebuilt.css",
  "zenit-ui/styles/zenit-ui.css",
  "src/styles.css"
]
```

Everything Material generated — `--mat-sys-*`, `--mat-app-*`, the reddish-brown default palette noted in `30-angular.md` — is replaced by the tokens. `styles.scss` can become `styles.css`: nothing in the design system needs Sass. Any application rule still reading a `--mat-*` variable has to be rewritten against a token; there is no compatibility shim.

## 4. Behaviour differences to watch

These are the places where a one-to-one template swap changes what the page actually does. Each one needs a deliberate decision, not a find-and-replace.

### 4.1 Native `<select>` instead of the `mat-select` overlay

`mat-select` renders a CDK overlay panel with `mat-option` children. `z-select` wraps a real `<select>`.

- **Two-way binding.** `mat-select` offers `[(value)]`. `z-select` has no value input at all — `size` is its only input. The value lives on the native `<select>`: `[(ngModel)]`, `[formControl]` or `(change)`. A `[(value)]` left on the wrapper binds to nothing and fails silently.
- **No multi-select, no option groups with custom markup, no search.** `mat-select` with `multiple` has no counterpart. `<optgroup>` works, but anything richer than text in an option does not.
- **Mobile.** The native select opens the system wheel. That is the point, but it looks nothing like the old overlay, and any screenshot test of that route will differ.
- **Styling.** The option list is drawn by the operating system and cannot be themed. Do not try; `appearance: none` is applied to the closed control only.
- **When it does not fit.** The Select README puts the boundary at about fifteen options: beyond that a search field is needed, and up to four options meant to be compared are a `z-segment`.

### 4.2 `z-field` `error` instead of `mat-error`

`mat-form-field` watches the `NgControl` and decides on its own when to show errors (`ErrorStateMatcher`, usually touched or submitted). `z-field` does none of that.

- `error` is a string the caller computes. Empty means no error; non-empty replaces the hint.
- The library never reads the form control, so the "when" is yours. Reproduce the old behaviour with the `touched` check shown in section 3.4, otherwise every field shows red on first paint.
- Only one message at a time. A control with three validators needs the caller to pick the sentence.
- `[invalid]` on the input is separate from `error` on the field: the first draws the red border, the second prints the text. Set both.
- `hint` and `error` are wired to the control through `aria-describedby` by the field; do not add your own.

### 4.3 `ZDialog` instead of `MatDialog`

- **`confirm()` returns `Observable<boolean>`, not a ref.** It emits exactly once and completes. `true` only through the confirming button; `false` through cancel, Escape and a backdrop click. Replacing `afterClosed()` with this means the `undefined` case disappears — but so does the ability to distinguish "cancelled" from "dismissed".
- **It opens on call, not on subscribe.** Calling `confirm()` and never subscribing still shows the dialog.
- **`cancelLabel` is required** in `ZConfirmConfig`, along with `title`, `body` and `confirmLabel`. `MatDialog` had no such shape; every call site has to supply four texts.
- **`requireText`** adds a field that must be typed exactly before the confirming button enables. `MatDialog` has no equivalent, so this is new behaviour to add where the specification asks for it (deleting a server), not something to port.
- **`open()` returns the CDK `DialogRef`**, whose observable is `closed`, not `afterClosed()`. `data` still arrives through `DIALOG_DATA`, but imported from `@angular/cdk/dialog`, not `@angular/material/dialog`.
- **`autoFocus`, `restoreFocus` and Escape** are the CDK defaults and are not overridden. `panelClass` and `backdropClass` you pass are appended after the library's `z-dialog-panel` and `z-backdrop`, not replaced.
- **Use it for less.** The Dialog README limits dialogs to decisions that cannot be undone and to short forms. "Stop" and "restart" are not dialogs.

### 4.4 `ZToast` instead of `MatSnackBar`

- **The outlet is mounted by you.** `<z-toast-outlet />` goes once into the shell. Without it `ZToast` writes into nothing and no toast appears — there is no global container injected for you.
- **Five statuses**: `neutral`, `info`, `success`, `warning`, `danger`, via `show`, `info`, `success`, `warning` and `error`. Only `danger` interrupts with `role="alert"` and stays until it is closed; `info` and `warning` behave like a neutral toast. There is no `panelClass` and no positioning config; the outlet decides where toasts sit.
- **A title is optional.** A service of your own that carries a title, a message and a type maps onto one call: `title` to `title`, the message to `text`, the type to `status`. Without a title the toast stays the single line it always was.
- **The action is a callback, not a ref.** `MatSnackBar` gives you `onAction()` on the returned ref. Here you pass `actionLabel` and `action: () => …` in the options. `show`/`success`/`error` return a numeric id, which is what `dismiss(id)` takes; `dismiss()` without an id clears all.
- **No `openFromComponent`.** A snackbar with custom content has no counterpart. Per the Alert README, anything that is not a short transient message is a `z-alert` in the page flow anyway.
- **`duration`** is in milliseconds as before.

### 4.5 `z-pagination` is 1-based and two-way bound

- `mat-paginator` is 0-based (`pageIndex`) and pushes a `PageEvent`. `z-pagination` uses `[(page)]`, **1-based**, with `page` defaulting to 1. An off-by-one here shows the wrong page silently.
- There is no `(page)` event object. React to the model: `[(page)]="seite"` plus an `effect`, or `[page]="seite()" (pageChange)="lade($event)"`.
- The component clamps: a page below 1 or beyond the last is written back corrected, which also happens when `total` or `pageSize` change. Your handler can therefore be called with a value it did not ask for.
- No page-size selector. `pageSize` is an input, 25 by default, and the user cannot change it.
- It renders nothing at all when there is only one page.
- `itemLabel` names the things being counted ("Rechnungen") for the range text.

### 4.6 `z-toggle` has no `change` event

`mat-slide-toggle` emits `(change)` with a `MatSlideToggleChange`. `z-toggle` and `z-checkbox` expose `[(checked)]` and `ControlValueAccessor`.

- `(change)="f($event.checked)"` becomes `[(checked)]="wert"` plus an `effect`, or `(checkedChange)="f($event)"` where `$event` is the plain boolean.
- With `ngModel` or a `FormControl` nothing changes; `valueChanges` keeps working.
- There is no `labelPosition`. The toggle projects no text: use `ariaLabel`, or `ariaLabelledby` pointing at the `titleId` of the surrounding `z-setting`.
- The Toggle is `role="switch"`, not `checkbox`, so screen-reader output changes wording.

### 4.7 Tabs are links, not tab panels

This is the one row of the mapping table where the specification contradicts itself, so read it carefully.

- `30-angular.md` ("Was nativ bleibt") says: tabs are **links in a `<nav>` with `aria-current="page"`**. The API table in `40-bibliothek.md` agrees: `nav[zTabs]`, `a[zTab]`, `active`. The library implements exactly that — `active` sets `aria-current="page"`, and that attribute is also what draws the 2px underline.
- `spec/components/Tabs/README.md` and `Tabs/preview.html` say the opposite: `role="tablist"` with `<button role="tab" aria-selected="true">`. That is a real defect in the specification and is listed in `docs/design-system-feedback.md`.
- **Follow the library.** Each tab is its own URL with its own route, as the Tabs README itself says in its last line. A `mat-tab-group` that switches content without changing the URL therefore needs child routes added — and adding routes is outside the scope of this job. Where that happens, stop and report it to the master rather than inventing a route.
- Consequences: no lazy `ng-template matTabContent`, no `selectedIndexChange`, no animation between panels. The browser's normal navigation does the work, and the back button now works on these tabs, which it did not before.

### 4.8 `zTooltip` has no options

`matTooltip` carries `matTooltipPosition`, `matTooltipShowDelay`, `matTooltipHideDelay`, `matTooltipClass` and `matTooltipDisabled`. `zTooltip` takes the text and nothing else.

- Position is chosen by the overlay; there is no `position` input to port.
- It opens on hover **and on focus**, closes on Escape, and is wired through `aria-describedby`.
- A tooltip is not a label. An icon-only button still needs its own `aria-label` — the two texts are usually the same, as in section 3.17.
- `30-angular.md` lists tooltips among the things "not yet specified" (`20-bestandsaufnahme.md`, "Komponenten-Inventar"): the contents are your decision, and the general rules from `CLAUDE.md` apply.

### 4.9 `z-icon` instead of `mat-icon`

- `name` is required and is a Material Icons ligature. A `mat-icon` using an SVG icon from `MatIconRegistry` has no counterpart and needs a different solution per case.
- The icon is always `aria-hidden="true"`. Every place where a `mat-icon` was the only content of a control needs an `aria-label` now.
- Two sizes, `md` (20px) and `sm` (16px, badges). No `inline` mode.
- Colour is `text-muted` and is not an input. Per `CLAUDE.md` an icon is coloured only in the active sidebar entry and in an alert — both handled by the stylesheet. `color="warn"` has nothing to map to.
- Icons disappear in a lot of places: not before headings, not before panel titles, not before facts, and never on a tinted backplate (`20-bestandsaufnahme.md` lists "Icon in rot getöntem Quadrat" for the start page, `/hardware`, `/wiki` and the dashboard).

## 5. Global setup to remove

In this order, after the last route is migrated:

1. **The theme.** Delete the `@use "@angular/material"` and the `mat.theme(...)` / `mat.core()` include from `styles.scss`. If nothing else in the file uses Sass, rename it to `styles.css` and update `angular.json`.
2. **`--mat-sys-*` and `--mat-app-*`.** Every application rule reading one of these has to name a token instead. There is no shim.
3. **`provideAnimations()`.** Remove it from the application config **only if it was there for Material**. `zenit-ui` needs no animation provider: transitions are plain CSS, limited to `color`, `background-color` and `border-color` at 150 ms, behind `prefers-reduced-motion: no-preference`. If any of the remaining application code uses Angular animations directly, it stays.
4. **The `Mat*` imports.** Standalone components list them in `imports`; NgModules in `imports` and sometimes in `exports`. Both have to go.
5. **The package.** `npm rm @angular/material`. `@angular/cdk` stays: `zenit-ui` needs it as a peer dependency.
6. **The guards.** Add the Stylelint config from `30-angular.md` and the ESLint `no-restricted-imports` rule for `@angular/material*` from `projects/zenit-ui/README.md`, so it cannot come back.

Do not remove `@angular/cdk/overlay-prebuilt.css`. Dialog, menu and tooltip need it for positioning. Note that, contrary to what `30-angular.md` says, it is not purely positioning: it also carries a 400 ms opacity transition on the backdrop. The library neutralises that with `transition: none` on `.z-backdrop`, which is one of its documented deviations.

## 6. Keeping old and new side by side

`40-bibliothek.md` explicitly allows old and new components to coexist route by route. What makes that work:

- **The styles do not collide.** Every library class is prefixed `z-`, and nothing in `zenit-ui.css` targets a bare `mat-*` selector. Material's own theme keeps styling Material components until it is removed.
- **One exception to watch: `z-root` is global.** It sets `font: inherit` and `color: inherit` on `button`, `input`, `select` and `textarea`, and a background and text colour on the page. Material components on a not-yet-migrated route will change appearance the moment `z-root` goes on `<body>` — mostly for the better (Arial disappears), but it will be visible. Expect a round of screenshot churn on day one and migrate the shell first so that the churn is deliberate.
- **Both theme systems can be loaded at once.** `tokens.css` defines `--…` names, Material defines `--mat-sys-*`; they do not overlap. Keeping both until the end is fine and costs a few kilobytes.
- **Per route, not per component.** Migrating half a template leaves a `mat-form-field` next to a `z-field` on the same screen, where the differing heights and label positions look like a bug. Finish a route before moving on.
- **Order.** Public pages first, per phase 5. They are the ones with the worst measurements in `20-bestandsaufnahme.md` (`/minecraft`: 32 gradients, 35 `backdrop-filter`, 35 font sizes) and they have the least logic behind them, so the templates-only constraint bites least there.
- **A route is done when it passes the acceptance checklist below**, not when it merely compiles.

## 7. Stylelint from warning to error

Per `40-bibliothek.md`, step 4: Stylelint runs over `src/` as a **warning** during the migration and is flipped to **error** once the last route is migrated.

The reason for the delay is that the rules — no hex, no `rgb()`, no gradients, no `backdrop-filter`, no `text-shadow`, no `filter`, `box-shadow` only `var(--shadow-overlay)` — will fire on every not-yet-migrated stylesheet from the first day. As errors they would block the build for the whole migration.

Practical setup:

- Use the config from `30-angular.md` verbatim, with the `tokens.css` override.
- While migrating, run it with `--quiet-deprecation-warnings` off and treat the warning count as the burn-down number: it should fall to zero route by route.
- Flip to error in the same commit that deletes the last `mat-*` usage, and add `npm run lint:css` to the build.
- The `selector-pseudo-element-disallowed-list: ["ng-deep"]` rule matters more than it looks. `::ng-deep` is the usual way Material gets restyled from the outside; every occurrence is a place where application CSS is reaching into a component, and all of them have to go.

## 8. Acceptance checklist per route

Straight from `00-auftrag.md`, "Abnahme je Route". Check every one of these before calling a route done:

- 0 elements with a gradient, `backdrop-filter` or `text-shadow` in the computed style.
- At most 3 font families and 7 font sizes, nothing below 12px.
- Radii only 4px and 8px, plus `radius-full` for dot, avatar, toggle and meter.
- At most one primary button per screen height. Red otherwise only on links and active states.
- Page title equals the navigation link. No all-caps label, no pill badge above a heading.
- Every status is also written as a word. Every control has a visible focus ring.
- Empty, loading and error states exist.
- At 360px no horizontal scrolling, click targets at least 40px high.

Plus, from `40-bibliothek.md`, "Prüfung": Playwright screenshots at 1440px and 375px, and `@axe-core/playwright` with no violations.

Two of these deserve a warning. **Click targets at least 40px** is not satisfied by the reference styles alone — `bundle.css` gives several controls 32px, 36px or less, and the library corrects this below 640px for small buttons, small inputs, small selects and menu items only. Header links, sidebar entries, segment buttons, footer links and the toast action are still below 40px. See item 2 in `docs/design-system-feedback.md`; do not report a route as accepted on the assumption that the library handles it.

**Empty, loading and error states** are the caller's job for most components. `z-skeleton` draws a placeholder row but does not know about the 300 ms delay or the 10 s timeout that the Skeleton README asks for; that logic lives in the page.

## 9. Finding leftovers

```bash
# the two hard gates from phase 6
grep -r "@angular/material" src
npm ls @angular/material

# every mat-* element and attribute still in a template
grep -rnE "<mat-|</mat-|mat-[a-z-]+=|\[mat[A-Z]" src --include=*.html

# the directive-style attributes that have no dash
grep -rnE "\b(matInput|matTooltip|matBadge|matRipple|matSort|matSortHeader|matMenuTriggerFor|matStepperNext|matStepperPrevious|matPrefix|matSuffix|matLine|matListItem)\b" src

# TypeScript side
grep -rnE "\bMat[A-Z][A-Za-z]*\b" src --include=*.ts
grep -rn "from '@angular/material" src --include=*.ts

# theme leftovers in styles
grep -rnE "\-\-mat-(sys|app)-|mat\.(theme|core|define|get-theme)" src
grep -rn "ng-deep" src

# the prohibition list, for the routes already migrated
grep -rnE "linear-gradient|radial-gradient|conic-gradient|backdrop-filter|text-shadow" src
grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(" src --include=*.css

# animations provider, to decide whether it can go
grep -rn "provideAnimations\|BrowserAnimationsModule\|@angular/animations" src
```

On Windows without Git Bash the same searches work with `Select-String -Path src -Pattern … -Recurse`, or with `rg` if ripgrep is installed.

A clean run means: the first two commands find nothing, and every hit from the last block is either inside `tokens.css` or an explained, documented exception.

## 10. What could not be verified

The existing frontend was deliberately not inspected — `00-auftrag.md` forbids reading it, and this document was written from the design system and the built library only. The following therefore rest on the specification's own observations or on general Angular Material knowledge, and all of them need to be checked against the real code when the job starts:

- **Which Material components are actually in use.** `00-auftrag.md` ("Offene Punkte") lists what was seen in the DOM: `mat-toolbar`, `mat-icon`, form fields, select, slide-toggle, paginator. The mapping table in section 3 covers the whole "Material ablösen" table regardless, so it may contain rows for components that do not exist in the application at all — and it may be missing a component that is in use but was never seen (a `mat-autocomplete`, `mat-datepicker`, `mat-tree` or `mat-list` would each need a decision of its own, and none has a counterpart in `zenit-ui`).
- **The real file and folder structure.** `30-angular.md` states plainly that the source is not known and that its filenames are suggestions. The component names in `00-auftrag.md` (`app-public-header`, `app-public-footer`, `app-pricing`, `app-flex-calculator`, `app-minecraft-landing`, `app-hardware-page`, `app-toast-container`, `app-cookie-banner`, `app-tutorial-overlay`) come from the DOM, not from the repository.
- **The exact Material version and API shape.** The "before" snippets are written for a recent Angular Material. If the application is on an older version, the details differ — `mat-raised-button` instead of `mat-flat-button`, `MatDialogRef.afterClosed()` versus `closed`, the pre-M3 theming API.
- **Whether `provideAnimations` is only there for Material.** Section 5 makes the removal conditional for exactly this reason.
- **Whether every `mat-tab-group` can become routed tabs.** Section 4.7 flags this as the one change that may require new routes, which this job is not allowed to add.
- **How custom the existing styling is.** Every `::ng-deep` into a Material component, every `--mat-sys-*` override and every custom `panelClass` is work that this guide cannot size.
- **The not-yet-specified areas.** `00-auftrag.md` lists tooltip contents, the billing chart, cookie banner, tutorial overlay, wiki articles, the voting row, the order assistant, login and the admin area as unspecified, and `20-bestandsaufnahme.md` adds the broadcast banner and the loader picker on `/minecraft`. For each of those, the overview plus the nearest component applies, and a short proposal goes to the human before anything is built.
- **The defects in `20-bestandsaufnahme.md`.** The overlapping text at 375px on `/user/games`, the clipped badges, the duplicated address in the panel head, the naming mismatches ("Gameserver" versus "Game-Server", "Abrechnung" versus "Finanzen") and the e-mail addresses visible on `/vorschlaege` were observed from outside. Whether they are template bugs — fixable here — or come from services and data has to be determined in the code, and if they come from the data they are outside this job's scope.
