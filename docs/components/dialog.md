# Dialog

Interrupts for a decision that cannot be undone, or for a short form.

## When to use

- For "Hart beenden", deleting, cancelling a contract and removing a payment method.
- For a short form of one or two fields that does not deserve a page of its own.

## When not to use

- For "Stoppen" or "Neustart". Those do not ask.
- For a confirmation that something happened. That is a toast.
- For a note the customer should act on at leisure. That is an alert.

## Import

```ts
import { ZDialog, ZDialogLayout, ZDialogActions } from 'zenit-ui';
```

`ZDialogLayout` carries the selector `z-dialog`; import the class, write the element.

## API

### `ZDialog` service

Provided in root, on top of `Dialog` from `@angular/cdk/dialog`, so `inject(ZDialog)` works
anywhere.

| Method                     | Returns               | Description                                                                                                                                                                    |
| -------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `open(component, config?)` | `DialogRef<R, C>`     | Opens a component of your own, as a rule one whose root element is `<z-dialog title="…">`. `config` is the CDK's `DialogConfig` (`data`, `width`, `disableClose` and the rest) plus `restoreFocusTo`. |
| `confirm(config)`          | `Observable<boolean>` | Confirmation with two buttons. Emits exactly once and then completes.                                                                                                          |

`open()` generates the id of the heading, provides it to the layout and puts the same id on the
container as `aria-labelledby` unless the config already names one. Your own `panelClass` and
`backdropClass` entries are appended after the library's `z-dialog-panel` and `z-backdrop`; every
other CDK option stays untouched.

`confirm()` returns `true` only through the confirming button. "Abbrechen", Escape and a click on
the backdrop all give `false`. The dialog opens as soon as the method is called, not on subscribe.

`restoreFocusTo` names the element focus returns to when the dialog closes, whichever way it
closes. It takes an `HTMLElement`, an `ElementRef<HTMLElement>` or a CSS selector, and is mapped
onto the CDK's `restoreFocus`. Left out, focus goes back to whatever was focused before the dialog
opened, which is the CDK default and right in almost every case. Set it when the trigger is gone by
then, for example a row that the confirmed action deletes.

One case needs nothing: a dialog opened from a menu item. The CDK menu closes with the click and
takes the focused item with it, so `open()` looks for the menu around the focused element and
returns focus to its trigger, found through the `aria-controls` that `CdkMenuTrigger` sets.

`ZConfirmConfig`:

| Field          | Type      | Default | Description                                                                                                                                                                                   |
| -------------- | --------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`        | `string`  | —       | Heading, phrased as a question or a task.                                                                                                                                                     |
| `body`         | `string`  | —       | The concrete consequences: what is lost, what it costs.                                                                                                                                       |
| `confirmLabel` | `string`  | —       | Label of the confirming button. It repeats the verb from `title`.                                                                                                                             |
| `cancelLabel`  | `string`  | —       | Label of the cancelling ghost button.                                                                                                                                                         |
| `danger`       | `boolean` | `false` | Renders the confirming button as `danger` instead of `primary`.                                                                                                                               |
| `requireText`  | `string`  | none    | Text that has to be typed exactly. It is the placeholder, and the confirming button stays disabled until the input matches character for character. Without it the dialog has no input field. |
| `requireLabel` | `string`  | none    | Label of that field. Without it the field takes `requireText` as its `aria-label`, so it is never unlabelled.                                                                                 |
| `restoreFocusTo` | `HTMLElement \| ElementRef<HTMLElement> \| string` | none | Element focus returns to after the dialog closes. Without it focus goes back to what was focused before it opened. |

### `z-dialog` (`ZDialogLayout`)

| Input   | Type     | Default  | Description                                                                                |
| ------- | -------- | -------- | ------------------------------------------------------------------------------------------ |
| `title` | `string` | required | Heading of the dialog, a question or a task. Without it the dialog has no accessible name. |

No outputs. Content projection:

| Slot               | Where it lands                                                 |
| ------------------ | -------------------------------------------------------------- |
| default            | in `div.z-dialog__body`                                        |
| `[zDialogActions]` | in `div.z-dialog__footer`, which is only rendered when present |

### `[zDialogActions]`

Marker directive for the buttons in the footer. It adds no class and no markup. Without it
`z-dialog` renders no footer at all.

## Examples

A destructive confirmation with the name to type:

```ts
import { inject } from '@angular/core';
import { ZDialog } from 'zenit-ui';

const dialog = inject(ZDialog);

dialog
  .confirm({
    title: 'Server "Test" löschen?',
    body: 'Welt, Konfiguration und alle 3 Backups werden sofort gelöscht. Das lässt sich nicht rückgängig machen.',
    confirmLabel: 'Server löschen',
    cancelLabel: 'Abbrechen',
    danger: true,
    requireText: 'Test',
    requireLabel: 'Gib zur Bestätigung den Servernamen ein',
  })
  .subscribe((bestaetigt) => {
    if (bestaetigt) {
      entferne('Test');
    }
  });
```

A short confirmation without a field:

```ts
dialog
  .confirm({
    title: 'Beispiel-Server 1 hart beenden?',
    body: 'Der Prozess wird sofort gestoppt. Nicht gespeicherte Daten der Welt gehen verloren.',
    confirmLabel: 'Hart beenden',
    cancelLabel: 'Abbrechen',
    danger: true,
  })
  .subscribe((ja) => (ja ? hartBeenden() : undefined));
```

Your own dialog, whose root element is `z-dialog`:

```html
<z-dialog title="Notiz zu Beispiel-Server 1">
  <z-field label="Notiz" for="dlg-notiz" hint="Nur für dich sichtbar.">
    <textarea zInput id="dlg-notiz" placeholder="Was hast du zuletzt geändert?"></textarea>
  </z-field>
  <ng-container zDialogActions>
    <button zBtn="ghost" type="button" (click)="ref.close()">Abbrechen</button>
    <button zBtn="primary" type="button" (click)="ref.close(true)">Notiz speichern</button>
  </ng-container>
</z-dialog>
```

Opening it and reading the result:

```ts
import { inject } from '@angular/core';
import { ZDialog } from 'zenit-ui';

const dialog = inject(ZDialog);

dialog
  .open<string, unknown, NotizDialog>(NotizDialog)
  .closed.subscribe((notiz) => (notiz ? speichere(notiz) : undefined));
```

Opened from a row whose delete removes the row itself, so focus goes to the toolbar above it.
Opened from a menu item nothing has to be passed at all:

```ts
import { ElementRef, inject, viewChild } from '@angular/core';
import { ZDialog } from 'zenit-ui';

const dialog = inject(ZDialog);
const werkzeuge = viewChild.required<ElementRef<HTMLElement>>('werkzeuge');

function loeschen(): void {
  dialog
    .confirm({
      title: 'Beispiel-Server 1 löschen?',
      body: 'Welt, Konfiguration und alle 3 Backups werden sofort gelöscht.',
      confirmLabel: 'Server löschen',
      cancelLabel: 'Abbrechen',
      danger: true,
      restoreFocusTo: werkzeuge(),
    })
    .subscribe((ja) => (ja ? entferne() : undefined));
}
```

```html
<div #werkzeuge class="z-cluster">
  <button zBtn="secondary" type="button">Hochladen</button>
</div>
```

## States

| State     | How it looks                                                                                    | How to trigger it                                    |
| --------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Open      | `surface-raised` panel with a 1px `border`, `radius-md` and `shadow-overlay`, `scrim` behind it | `open()` or `confirm()`                              |
| Locked    | the confirming button is `disabled` at 45 percent                                               | `requireText` set and the input does not match yet   |
| Confirmed | the dialog closes with `true`                                                                   | the confirming button                                |
| Cancelled | the dialog closes with `false`                                                                  | the ghost button, Escape, or a click on the backdrop |

There is no loading or error state inside the dialog itself; a form in it uses `loading` on its
submit button and `error` on its fields.

## Accessibility

- `role="dialog"`, `aria-modal`, the focus trap, Escape and returning focus to the trigger all come
  from the container of `@angular/cdk/dialog`.
- Focus never lands on the document body: when the trigger is gone by the time the dialog closes,
  `restoreFocusTo` names where it goes instead, for confirm, cancel and Escape alike.
- The heading of `z-dialog` supplies the id that the container's `aria-labelledby` points at, which
  is what gives the dialog its accessible name. `title` is required for exactly that reason.
- Focus lands on the first tabbable element when the dialog opens: the first field, or otherwise the
  cancel button.
- A body that scrolls stays operable by keyboard (SC 2.1.1): its controls are reached by Tab and
  scrolled into view, and a body that scrolls without holding a single tabbable element, a long
  confirmation for example, becomes a tab stop of its own so it can be scrolled with the arrow keys.
  That stop is a `role="group"` named by the dialog heading, and a locked control does not count as
  a tab stop. Both halves are watched while the dialog stands, so a body that only fills up later
  gets its stop as well.
- The scrolling body carries `scroll-padding`, so the focus ring of a control at its edge is not cut
  off when the browser scrolls that control into view, and its own ring lies inside its edge, which
  `overflow: auto` would otherwise clip against header and footer.
- With `requireText` the field is always labelled, through `requireLabel` or, failing that, through
  `requireText` as its `aria-label`.
- The confirming button repeats the verb from the title, so the decision reads the same in both
  places.

## Responsive

The panel is `min(480px, 100vw - 2 × space-4)` wide and at most `100vh - 2 × space-5` tall, `100dvh`
where the browser knows the unit, so the URL bar of a phone does not cut the footer off. Below 640px
it takes the full viewport width and docks to the bottom edge, keeping its rounded corners on top
only; there the footer also carries `env(safe-area-inset-bottom)` below its padding, so the actions
clear the home bar.

A dialog longer than the screen scrolls in its body: heading and actions stay in place and only
`.z-dialog__body` moves. Nothing has to be set for that, and no dialog component needs styles of its
own, because the chain from the overlay pane down to `z-dialog` carries the height limit.

## Overlays inside the body

A tooltip or a menu opened inside the scrolling body answers that scroll: the tooltip goes, the menu
closes (see the Tooltip and Menu pages). Both listen on the document in the capture phase, so they
also hear a scroll container of your own around the dialog, which `cdkScrollable` would be needed
for otherwise, and both ignore a scroller the trigger does not sit in.

Escape inside the dialog goes to the overlay above it first: a tooltip that stands or a menu that is
open takes it, and only the second Escape closes the dialog. A dialog with a long form is not lost
to the key that was meant for the menu.

## Rendered classes and tokens

| Class              | Applies when                            |
| ------------------ | --------------------------------------- |
| `z-dialog-panel`   | on the CDK overlay pane                 |
| `z-backdrop`       | on the CDK backdrop                     |
| `z-dialog`         | on the `z-dialog` host                  |
| `z-dialog__header` | always                                  |
| `z-dialog__title`  | on the `<h2>`                           |
| `z-dialog__body`   | always                                  |
| `z-dialog__footer` | a `[zDialogActions]` element is present |
| `z-scrim`          | on the static preview markup            |

Tokens: `--space-2` to `--space-5` for padding and gaps, `--border`, `--radius-md`,
`--surface-raised` for the panel, `--shadow-overlay` as the only shadow, `--scrim` behind it,
`--font-display` for the heading, `--text-muted` for the body, `--bg` for a field inside the body.
The 480px width is a literal value from the reference stylesheet.

## Deviations from the reference

- Addition to the reference: the CDK backdrop gets `transition: none`, because the design system
  allows no fade in.
- Addition to the library: the body of a dialog colours its text `text-muted`, so the label of a
  field inside it is set back to `text`; the reference preview did that with an inline style.
- Addition to the library: `.z-dialog` gets `display: block`, and the overlay pane caps the dialog
  at the viewport height so a long dialog scrolls inside itself instead of past the edge.
- Addition to the reference: the limit of the reference never reached the dialog. The CDK loads the
  styles of `.cdk-overlay-pane` at runtime, so its `max-height: 100%` stood after this stylesheet
  and beat the rule of the same specificity; and `max-height: inherit` of `.z-dialog` inherited from
  the host element of the opened component, which sits between the CDK container and the dialog. The
  limit is therefore repeated as `.cdk-overlay-pane.z-dialog-panel`, container and host become flex
  columns, and inside the dialog only `.z-dialog__body` scrolls.

## Do / Don't

- Do phrase the title as a question or a task and repeat its verb on the confirming button.
- Do name the concrete consequences in `body`: what is lost, what it costs.
- Do use `requireText` for deleting servers, domains and backups.
- Do pass `restoreFocusTo` when the element that opened the dialog is gone by the time it closes, a
  deleted row for example. A menu item needs nothing, that case is taken care of.
- Don't ask for confirmation for "Stoppen" or "Neustart".
- Don't put a blur behind the dialog; it is `scrim`.
- Don't make the dialog wider than 480px.
