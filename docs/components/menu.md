# Menu

Collects the rarer actions of an object behind a button.

## When to use

- In a panel header, so only two buttons stay visible: "Adresse kopieren", "FTP-Zugang", "Zugriff
  teilen", and below a separator "Hart beenden" and "Server löschen".
- For the avatar menu and the three-dot menus on payment methods.
- Three to seven entries.

## When not to use

- For the one or two main actions of a screen. Those stay visible as buttons.
- For a choice that changes the view. That is `z-segment` or `z-select`.

## Import

```ts
import { Z_MENU, ZMenu, ZMenuItem, ZMenuSeparator } from 'zenit-ui';
```

`Z_MENU` is the three building blocks as one array for a component's `imports`. The trigger is not
part of it and comes from `@angular/cdk/menu`:

```ts
import { CdkMenuTrigger } from '@angular/cdk/menu';
import { Z_MENU } from 'zenit-ui';

const imports = [Z_MENU, CdkMenuTrigger];
```

## API

### `z-menu`

No inputs, no outputs. The surface of the menu; the content is the entries. Keyboard handling, roles
and closing come from `CdkMenu` in `@angular/cdk/menu`, which runs as a host directive.

### `button[zMenuItem]`

| Input      | Type      | Default | Description                                                    |
| ---------- | --------- | ------- | -------------------------------------------------------------- |
| `icon`     | `string`  | `''`    | Material Icon in front of the text. Empty renders no icon.     |
| `danger`   | `boolean` | `false` | Marks the entry as destructive. Boolean attribute.             |
| `disabled` | `boolean` | `false` | Locks the entry. Comes from `CdkMenuItem` as a host directive. |

| Output      | Payload | Fires when                                                      |
| ----------- | ------- | --------------------------------------------------------------- |
| `triggered` | `void`  | the entry is used by click, Enter or Space. From `CdkMenuItem`. |

The content is the text of the entry: a verb plus its object ("Adresse kopieren").

### `z-menu-separator`

No inputs, no outputs. Renders an empty host with `role="separator"`, so it is announced as a
divider and never receives focus.

## Examples

A more-menu in a panel header:

```html
<button
  zBtn="ghost"
  iconOnly
  type="button"
  aria-label="Weitere Aktionen"
  [cdkMenuTriggerFor]="mehr"
>
  <z-icon name="more_vert" />
</button>

<ng-template #mehr>
  <z-menu>
    <button zMenuItem icon="content_copy" (triggered)="kopiere()">Adresse kopieren</button>
    <button zMenuItem icon="folder" (triggered)="ftp()">FTP-Zugang</button>
    <button zMenuItem icon="group_add" (triggered)="teilen()">Zugriff teilen</button>
    <z-menu-separator />
    <button zMenuItem icon="power_settings_new" danger (triggered)="hartBeenden()">
      Hart beenden
    </button>
    <button zMenuItem icon="delete" danger (triggered)="loeschen()">Server löschen</button>
  </z-menu>
</ng-template>
```

An entry that is locked while an installation runs:

```html
<button zMenuItem icon="group_add" [disabled]="wirdInstalliert()" (triggered)="teilen()">
  Zugriff teilen
</button>
```

A destructive entry that opens a dialog, which is the rule for every `danger` entry:

```ts
import { inject } from '@angular/core';
import { ZDialog } from 'zenit-ui';

const dialog = inject(ZDialog);

function loeschen(): void {
  dialog
    .confirm({
      title: 'Server "Test" löschen?',
      body: 'Welt, Konfiguration und alle 3 Backups werden sofort gelöscht.',
      confirmLabel: 'Server löschen',
      cancelLabel: 'Abbrechen',
      danger: true,
      requireText: 'Test',
    })
    .subscribe((ja) => (ja ? entferne('Test') : undefined));
}
```

## States

| State    | How it looks                                 | How to trigger it                       |
| -------- | -------------------------------------------- | --------------------------------------- |
| Rest     | entry in `text` on the `surface-raised` menu | default                                 |
| Hover    | `surface-hover` behind the entry             | pointer over the entry                  |
| Focus    | `surface-hover` behind the entry             | arrow keys, or typing its first letters |
| Danger   | text and icon in `danger`                    | `danger` on that entry                  |
| Disabled | 45 percent opacity, `cursor: not-allowed`    | `disabled` on that entry                |

The menu itself opens and closes without an animation. There is no loading, error or empty state: a
menu with nothing in it is not rendered.

## Accessibility

- Role, focus management and the `disabled` input come from `CdkMenuItem` as a host directive, which
  also provides the `(triggered)` output.
- Arrow keys move through the entries, Home and End jump to the ends, a click outside and Escape
  close the menu, and focus returns to the trigger.
- The CDK typeahead label is set to the text without the icon ligature after every render. Without
  that the raw `textContent` would start with the ligature ("content_copyAdresse kopieren") and
  typing the first letter would not find the entry.
- The separator carries `role="separator"` and is never focusable.
- The trigger is an icon-only button and needs its own `aria-label`.

## Responsive

The menu is at least 200px wide and sits on `surface-raised` with `shadow-overlay` and no scrim.
Below 640px every entry grows from 36px to 40px tall, so the click targets meet the minimum.

## Rendered classes and tokens

| Class                  | Applies when                          |
| ---------------------- | ------------------------------------- |
| `z-menu`               | on the menu host                      |
| `z-menu__item`         | on each entry                         |
| `z-menu__item--danger` | `danger` on that entry                |
| `z-menu__sep`          | on `z-menu-separator`                 |
| `z-menu__key`          | on a shortcut hint, set by the caller |

Tokens: `--space-1` and `--space-3` for padding and gaps, `--border`, `--radius-md` for the menu and
`--radius-sm` for an entry, `--surface-raised` for the surface, `--surface-hover` for hover and
focus, `--shadow-overlay` as the only shadow, `--text` for the entries, `--danger` for a destructive
one, `--font-mono` and `--text-muted` for a shortcut hint, `--control-md` for the mobile height. The
200px minimum width and the 36px entry height are literal values from the reference stylesheet.

## Deviations from the reference

- Addition to the library: the separator is an element of its own and would otherwise be inline, so
  it gets `display: block`.
- Addition to the reference: below 640px an entry is raised to 40px, because click targets are at
  least 40px tall on mobile.

## Do / Don't

- Do keep to three to seven entries, each a verb plus its object.
- Do put destructive entries at the bottom, behind a separator, and open a dialog from them.
- Do give the trigger an `aria-label`.
- Don't put the main actions of a screen in a menu.
- Don't put a scrim behind the menu; only a dialog has one.
- Don't rely on `textContent` order; the icon comes first in the DOM but not in the typeahead label.
