# Forms

How the form controls of `zenit-ui` bind to a value. There are three ways, and every control
supports all three:

| Way                               | Use it for                                          | Binding                        |
| --------------------------------- | --------------------------------------------------- | ------------------------------ |
| Signal Forms                      | new forms; the default since Angular 22             | `[formField]`                  |
| Signal `model()`                  | a single control outside a form: a filter, a switch | `[(checked)]`, `[(value)]`     |
| Reactive or template-driven forms | existing forms (interop)                            | `[formControl]`, `[(ngModel)]` |

| Control                             | Value     | Element that takes the binding               |
| ----------------------------------- | --------- | -------------------------------------------- |
| `z-checkbox`                        | `boolean` | the component                                |
| `z-toggle`                          | `boolean` | the component                                |
| `z-slider`                          | `number`  | the component                                |
| `z-segment`                         | `string`  | the component                                |
| `input[zInput]`, `textarea[zInput]` | `string`  | the native element, next to `zInput`         |
| `z-select`                          | `string`  | the native `<select>` inside, not `z-select` |

## Signal Forms

One signal holds the model, `form()` derives the field tree, and the schema carries everything that
used to be spread over the template: required, scale, lock.

```ts
import { Component, signal } from '@angular/core';
import { disabled, form, FormField, max, min, required, submit } from '@angular/forms/signals';
import { ZButton, ZCheckbox, ZField, ZInput, ZSegment, ZSelect, ZSlider, ZToggle } from 'zenit-ui';

@Component({
  imports: [FormField, ZButton, ZCheckbox, ZField, ZInput, ZSegment, ZSelect, ZSlider, ZToggle],
  templateUrl: './bestellung.html',
})
export class Bestellung {
  protected readonly modell = signal({
    name: '',
    standort: 'nbg',
    ramGb: 4,
    laufzeit: '1',
    backups: false,
    offsite: false,
    agb: false,
  });

  protected readonly formular = form(this.modell, (pfad) => {
    required(pfad.name, { message: 'Gib dem Server einen Namen.' });
    min(pfad.ramGb, 2);
    max(pfad.ramGb, 16);
    disabled(pfad.offsite, ({ valueOf }) => !valueOf(pfad.backups));
    required(pfad.agb, { message: 'Bestätige die AGB, um fortzufahren.' });
  });

  /** First error of a field, once the user has left it or the form was submitted. */
  protected fehler(feld: {
    touched(): boolean;
    errors(): readonly { message?: string }[];
  }): string {
    return feld.touched() ? (feld.errors()[0]?.message ?? '') : '';
  }

  protected bestellen(): void {
    // submit() touches every field, so all errors show, and runs the action only when valid.
    void submit(this.formular, async () => this.sende(this.modell()));
  }
}
```

```html
<z-field label="Servername" for="name" [error]="fehler(formular.name())">
  <input zInput id="name" [formField]="formular.name" />
</z-field>

<z-field label="Standort" for="standort">
  <z-select>
    <select id="standort" [formField]="formular.standort">
      <option value="nbg">Nürnberg</option>
    </select>
  </z-select>
</z-field>

<z-slider label="Arbeitsspeicher" unit="GB" [step]="2" [formField]="formular.ramGb" />
<z-segment [options]="laufzeiten" [formField]="formular.laufzeit" ariaLabel="Laufzeit" />

<z-toggle [formField]="formular.backups" ariaLabel="Backup jede Nacht" />
<z-toggle [formField]="formular.offsite" ariaLabel="Backup an zweitem Standort" />

<z-checkbox [formField]="formular.agb" ariaDescribedby="agb-fehler">
  Ich stimme den <a href="/agb">Bedingungen</a> zu
</z-checkbox>
@if (fehler(formular.agb()); as satz) {
<span class="z-field__error" id="agb-fehler" role="alert">{{ satz }}</span>
}

<button zBtn="primary" type="button" (click)="bestellen()">Server erstellen</button>
```

What `[formField]` does with each control:

| Control                  | From the field state                                                                                                           | Reported back                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| `z-checkbox`             | value, `disabled`, `required`, `invalid`, `touched`                                                                            | value on change, touched on blur       |
| `z-toggle`               | value, `disabled`, `invalid`, `touched`                                                                                        | value on change, touched on blur       |
| `z-slider`               | value, `disabled`, `min`, `max`, `invalid`, `touched`                                                                          | value while dragging, touched on blur  |
| `z-segment`              | value, `disabled`                                                                                                              | value on click, touched on button blur |
| `input[zInput]`/textarea | value and the native `disabled`, `required`, `readonly`, `name`, `minLength`, `maxLength`; `invalid` and `touched` on `zInput` | value on input, touched on blur        |
| `<select>` in `z-select` | value and the native `disabled`, `required`, `name`                                                                            | value on input, touched on blur        |

Rules that follow from how Angular wires the directive:

- **State comes from the schema, not the template.** Next to `[formField]` Angular rejects
  `[disabled]`, `[required]`, `[min]`, `[max]`, `[invalid]`, `[touched]`, `[value]` and `[checked]`
  at compile time (NG8022). The scale of a slider therefore lives in `min()` and `max()`. Without
  those rules the slider keeps its defaults, 0 to 100.
- **The slider stays on its scale.** A model value outside `min()` and `max()` or between two steps
  is corrected to the value the track really shows, and that correction is written into the field.
  A `min()` or `max()` violation can therefore not be reached through the slider.
- **`aria-invalid` waits for `touched`.** A required empty field is invalid from the start. `zInput`,
  `z-checkbox`, `z-toggle` and `z-slider` write `aria-invalid="true"`, and `zInput` the `danger`
  border with it, only once the field is invalid and touched. `submit()` touches every field.
- **`reset()`** on a field or the form writes the value back into the control and clears touched
  and dirty, so error sentence and `aria-invalid` go away.
- The custom controls bind through their `ControlValueAccessor`, which Signal Forms prefers when a
  component provides one. `z-checkbox`, `z-toggle` and `z-segment` also satisfy
  `FormCheckboxControl` and `FormValueControl<string>` as types.

## Errors with `z-field`

`z-field` takes the sentence as `error`, a string; it replaces the hint and `zInput` or the select
points `aria-describedby` at it. Pass the first error of the field once it is touched, as `fehler()`
does above. Messages come from the schema (`{ message: '…' }`) and name cause and next step.

A native `<select>` carries no library directive, so its `aria-invalid` is bound by hand; attribute
bindings are allowed next to `[formField]`:

```html
<select
  id="standort"
  [formField]="formular.standort"
  [attr.aria-invalid]="formular.standort().touched() && formular.standort().invalid() ? 'true' : null"
></select>
```

`z-checkbox` and `z-toggle` bring their own label and do not sit in a `z-field`. Their sentence is a
`span.z-field__error` with an `id`, referenced through `ariaDescribedby`. There is no error colour
for checkbox, toggle and slider; the reference has none.

## Signal `model()`

For a control that is not part of a form. No validation, no touched state; `disabled` is the input.

```html
<z-checkbox [(checked)]="alleGewaehlt">Alle auswählen</z-checkbox>
<z-toggle [(checked)]="pvp" ariaLabelledby="pvp-titel" />
<z-slider label="Arbeitsspeicher" unit="GB" [min]="2" [max]="16" [step]="2" [(value)]="ram" />
<z-segment [options]="zeitraeume" [(value)]="zeitraum" ariaLabel="Zeitraum" />
```

Native elements have no `model()`; bind `[value]` and `(input)` or use one of the forms packages.

## Reactive and template-driven forms (interop)

Every custom control implements `ControlValueAccessor`. `setDisabledState` and the `disabled` input
are independent; either one locks the control. Native elements use Angular's own accessors.

```html
<z-checkbox [formControl]="agb" [invalid]="agb.invalid && agb.touched" ariaDescribedby="agb-fehler">
  Ich stimme den Bedingungen zu
</z-checkbox>
<z-toggle [formControl]="backups" ariaLabel="Backup jede Nacht" />
<z-slider label="Speicher" unit="GB" [min]="10" [max]="100" [step]="10" [formControl]="speicher" />
<z-segment [options]="zeitraeume" [(ngModel)]="zeitraum" ariaLabel="Zeitraum" />

<z-field
  label="Servername"
  for="name"
  [error]="name.touched && name.invalid ? 'Gib dem Server einen Namen.' : ''"
>
  <input zInput id="name" [formControl]="name" [invalid]="name.touched && name.invalid" />
</z-field>
```

Here nothing sets `invalid` for you: these forms packages do not write inputs of a control that has
a value accessor. Bind `[invalid]` yourself; `touched` stays `true`, so `invalid` alone decides.

## Not supported

- `readonly()`, `hidden()` and `pending` on the four custom controls. Checkbox, switch, range and
  button group have no read-only mode in HTML; use `disabled()`. A hidden field is removed by the
  caller with `@if`, as Angular asks.
- `required()` on `z-toggle`, `z-slider` and `z-segment`: a switch and a range always have a value,
  and `role="group"` takes neither `aria-required` nor `aria-invalid`. The rule still validates;
  only the attribute is not reflected.
- `name`, `errors`, `dirty`, `disabledReasons`, `minLength`, `maxLength` and `pattern` are not taken
  by the custom controls. Read them from the field (`formular.agb().errors()`) where needed.
- `indeterminate` is no form value. It is a `model()` on `z-checkbox` only, and forms never see it.
- The `touch` output of the Signal Forms contract. The controls report touched through the value
  accessor, which is the path Signal Forms takes for them; `debounce(pfad, 'blur')` works that way.
- `[formField]` on the `z-select` host. It belongs on the native `<select>` inside.
