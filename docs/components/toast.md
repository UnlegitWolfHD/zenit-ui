# Toast

Confirms that something happened and disappears by itself.

## When to use

- After a short action that succeeded: "Eigenschaften gespeichert", "Adresse kopiert".
- For an action that can be undone, with "Rückgängig" as the extra action.
- For an error in a background operation that needs no action on the page.

## When not to use

- For an error that requires an action on the page. That is `z-alert`.
- For a permanent state. That is `z-badge`.

## Import

```ts
import { ZToast, ZToastOutlet } from 'zenit-ui';
```

## API

### `z-toast-outlet`

| Input        | Type     | Default       | Description                                                                   |
| ------------ | -------- | ------------- | ----------------------------------------------------------------------------- |
| `closeLabel` | `string` | `'Schließen'` | `aria-label` of the close button on every toast. German default, overridable. |

No outputs, no content projection. The outlet stands exactly once in the root template and renders
the toasts of the `ZToast` service.

### `ZToast` service

Provided in root, so `inject(ZToast)` works anywhere.

| Method                    | Returns                         | Description                                                                                                 |
| ------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `show(text, options?)`    | `number`                        | Shows a toast and returns its id. While three toasts are visible the oldest is closed first.                |
| `success(text, options?)` | `number`                        | Status `success` with the icon `check_circle`, both overridable through `options`.                          |
| `error(text, options?)`   | `number`                        | Status `danger`, the icon `error` and `duration: 0`, so it stays until it is closed. All three overridable. |
| `dismiss(id?)`            | `void`                          | Closes that toast and stops its timer. Without an id all toasts are closed.                                 |
| `toasts`                  | `Signal<readonly ZToastItem[]>` | The visible toasts, oldest first. Read by the outlet.                                                       |

`ZToastOptions`:

| Option        | Type                                 | Default                              | Description                                                  |
| ------------- | ------------------------------------ | ------------------------------------ | ------------------------------------------------------------ |
| `status`      | `'neutral' \| 'success' \| 'danger'` | `'neutral'`                          | Colour and announcement. Only `danger` is `role="alert"`.    |
| `icon`        | `string`                             | none                                 | Material Icons ligature.                                     |
| `actionLabel` | `string`                             | none                                 | Label of the extra action, for example `Rückgängig`.         |
| `action`      | `() => void`                         | none                                 | Called when the action is used. The toast closes afterwards. |
| `duration`    | `number`                             | `5000`, or `8000` with `actionLabel` | Milliseconds visible. `0` keeps it until it is closed.       |

## Examples

The outlet, once in the root template:

```html
<z-toast-outlet />
```

Success and failure of a save:

```ts
import { inject } from '@angular/core';
import { ZToast } from 'zenit-ui';

const toast = inject(ZToast);

toast.success('Eigenschaften gespeichert');
toast.error('Eigenschaften nicht gespeichert. Der Server hat nicht geantwortet.');
```

A toast with an action, which gets 8 seconds instead of 5:

```ts
toast.show('Datei gelöscht', {
  actionLabel: 'Rückgängig',
  action: () => wiederherstellen(),
});
```

A permanent toast and closing it again by id:

```ts
const id = toast.show('Die Installation läuft', { icon: 'hourglass_top', duration: 0 });
// later
toast.dismiss(id);
```

Closing everything, for example when leaving a page:

```ts
toast.dismiss();
```

An outlet whose close button is named in another language:

```html
<z-toast-outlet closeLabel="Close" />
```

## States

| State       | How it looks                                                  | How to trigger it          |
| ----------- | ------------------------------------------------------------- | -------------------------- |
| Neutral     | `surface-raised` with a 1px `border` and `shadow-overlay`     | `show(...)`                |
| Success     | icon in `success`                                             | `success(...)`             |
| Error       | icon in `danger`, `role="alert"`, stays until closed          | `error(...)`               |
| With action | an extra text button in `accent-text` before the close button | `actionLabel` and `action` |
| Permanent   | no timer                                                      | `duration: 0`              |

At most three toasts at a time, the newest at the bottom; a fourth one closes the oldest. There is
no hover, focus or disabled state on the toast itself; the two buttons inside it have theirs.

## Accessibility

- A `danger` toast carries `role="alert"` and is announced at once; every other toast carries
  `role="status"` and is announced politely.
- The close button has an `aria-label` from `closeLabel`, with a German default that can be
  overridden.
- Using the action runs it and closes that toast.
- The outlet itself does not take pointer events; only the toasts inside it do, so the area next to
  them stays clickable.
- The text is one sentence without a full stop, in the past participle
  ("Eigenschaften gespeichert").

## Responsive

Above 640px the outlet sits fixed in the bottom right corner, `space-5` from both edges, with the
toasts capped at 420px wide. Below 640px it stretches across the full width with `space-4` of
margin and the toasts lose their width cap. The action and the close button do not shrink there,
and the action itself becomes 40px tall.

## Rendered classes and tokens

| Class              | Applies when         |
| ------------------ | -------------------- |
| `z-toast-outlet`   | on the outlet host   |
| `z-toast`          | on each toast        |
| `z-toast--success` | status `success`     |
| `z-toast--danger`  | status `danger`      |
| `z-toast__action`  | `actionLabel` is set |
| `z-toast__close`   | on the close button  |

Tokens: `--space-1` to `--space-5` for gaps, padding and the distance from the edge, `--border`,
`--radius-md`, `--surface-raised` for the surface, `--shadow-overlay` as the only shadow in the
system, `--success` and `--danger` for the icons, `--accent-text` for the action, `--z-toast` for
the stacking order, `--control-md` for the mobile action height. The 420px width cap is a literal
value from the reference stylesheet.

## Deviations from the reference

Addition to the reference: below 640px the buttons inside a toast do not shrink and the action
itself becomes 40px tall, because click targets are at least 40px tall on mobile. The height of the
close button already comes from the rule for `z-btn--sm`.

## Do / Don't

- Do put exactly one `z-toast-outlet` in the root template.
- Do write one sentence without a full stop, in the past participle.
- Do let errors stay until they are closed; that is what `error()` already does.
- Don't use a toast for an error the customer has to act on; that is an alert.
- Don't show more than three at a time; the service already caps it.
- Don't animate a toast sliding in; it fades over 150ms.
