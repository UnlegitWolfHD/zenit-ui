# InputAction

A field with a button that checks or applies the value right away.

## When to use

- Voucher code in the order and in billing, checking a subdomain, adding a player to the whitelist.
- Wherever one value is checked on its own, before and independently of a submit.

## When not to use

- For a field whose value only matters on submit. That is `z-field` with `input zInput`.
- For a copy button next to a read-only value; there the field is `readonly` and the action is an
  icon button.

## Import

```ts
import { ZInputAction } from 'zenit-ui';
```

## API

Selector: `z-input-action`

| Input         | Type      | Default | Description                                                          |
| ------------- | --------- | ------- | -------------------------------------------------------------------- |
| `label`       | `string`  | `''`    | Visible label above the field. "(optional)" belongs in here.         |
| `actionLabel` | `string`  | `''`    | Caption of the button, a verb: "Einlösen", "Prüfen", "Hinzufügen".   |
| `value`       | `string`  | `''`    | What stands in the field, two-way bindable through `[(value)]`.      |
| `success`     | `string`  | `''`    | The effect of a successful check, in `success`.                      |
| `error`       | `string`  | `''`    | Why it failed, in `danger`. Also sets `aria-invalid` on the field.   |
| `loading`     | `boolean` | `false` | Spinner in the button, button locked, Enter does nothing.            |
| `disabled`    | `boolean` | `false` | Locks field and button.                                              |

| Output        | Payload  | Fires when                                                               |
| ------------- | -------- | ------------------------------------------------------------------------ |
| `action`      | `string` | the button is pressed or Enter is hit, with the current value            |
| `valueChange` | `string` | the field is typed in (the `model()` companion)                          |

No content projection.

## Examples

A voucher code with all three answers:

```html
<z-input-action
  label="Gutscheincode (optional)"
  actionLabel="Einlösen"
  [(value)]="code"
  [loading]="pruefe()"
  [success]="erfolg()"
  [error]="fehler()"
  (action)="loeseEin($event)"
/>
```

```ts
protected loeseEin(code: string): void {
  this.pruefe.set(true);
  this.erfolg.set('');
  this.fehler.set('');
  // The answer names the concrete effect, not just "erfolgreich".
  this.dienst.einloesen(code).subscribe({
    next: (betrag) => {
      this.pruefe.set(false);
      this.erfolg.set(`Gutschein ${code} eingelöst: −${betrag}`);
    },
    error: () => {
      this.pruefe.set(false);
      this.fehler.set('Dieser Code ist am 31.08.2026 abgelaufen.');
    },
  });
}
```

Checking a subdomain:

```html
<z-input-action
  label="Subdomain"
  actionLabel="Prüfen"
  [(value)]="subdomain"
  [success]="frei() ? subdomain() + '.zenit.example ist frei.' : ''"
  (action)="pruefeSubdomain($event)"
/>
```

## States

| State    | How it looks                                                              | How to trigger it       |
| -------- | ------------------------------------------------------------------------- | ----------------------- |
| Rest     | field and secondary button in one row                                     | default                 |
| Focus    | 2px ring in `focus` with 2px offset on field or button                    | Tab                     |
| Loading  | spinner before the caption, button locked                                 | `loading`               |
| Success  | `.z-field__success` under the field, in `success`                         | `success`               |
| Error    | `.z-field__error` under the field, `aria-invalid` and the danger border   | `error`                 |
| Disabled | field and button at 45 percent, `cursor: not-allowed`                     | `disabled`              |

## Accessibility

- The label is a real `<label for>`, never only a placeholder, and "(optional)" belongs in it.
- Enter in the field triggers the button, but not on an empty field and not while `loading` holds.
- Success and error are always in the DOM as live regions, `role="status"` and `role="alert"`, so a
  sentence that appears later is announced instead of arriving silently. Both are tied to the field
  through `aria-describedby`; an error also sets `aria-invalid="true"`.
- A redeemed voucher shows up again as a line of its own in `z-price-summary`, so the effect is
  visible where the amount is.

## Responsive

Field and button stay on one row and shrink with the container; the field takes the free space.
Both are `--control-md` tall, which already meets the mobile minimum.

## Rendered classes and tokens

| Class              | Applies when                        |
| ------------------ | ----------------------------------- |
| `z-field`          | the wrapper                         |
| `z-field__label`   | the visible label                   |
| `z-input-action`   | the row of field and button         |
| `z-field__success` | the success live region             |
| `z-field__error`   | the error live region               |

Tokens: `--success` and `--danger` for the two answers, `--space-1` and `--space-2` for the gaps.
The 12px type of the two sentences is a literal value from the reference stylesheet.

## Deviations from the reference

- Addition to the API table: a `disabled` input. `15-zustaende.md` asks every control for a
  designed disabled state, and without it the caller has no way to lock the pair while an order is
  being sent.
- The two live regions share one grid item, so an empty pair costs one gap instead of two and the
  block stays flat until a sentence arrives.

## Do / Don't

- Do name the concrete effect on success ("Gutschein ZENIT10 eingelöst: −0,77 €").
- Do name cause and next step in the error.
- Do put "(optional)" in the label.
- Don't put the label in the placeholder.
- Don't fire the action on an empty field.
