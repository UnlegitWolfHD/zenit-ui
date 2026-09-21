import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Wrapper around a form control: label above, hint or error below. The label
 * always stands above the control, never only as a placeholder.
 *
 * Renders a host with the class `z-field`, an optional `label.z-field__label`,
 * the projected control, and below it either `span.z-field__error` or, if there
 * is no error, `span.z-field__hint`. Error and hint are mutually exclusive; the
 * error wins.
 *
 * Accessibility: `for` links the label to the id of the control and is also the
 * root of the ids for hint (`<for>-hint`) and error (`<for>-error`). Without
 * `for` there are no ids and no `aria-describedby`. A projected `input zInput`,
 * `textarea zInput` or `z-select` picks that id up by itself.
 *
 * @example
 * ```html
 * <z-field label="Servername" for="in-name" hint="Nur für dich sichtbar.">
 *   <input zInput id="in-name" value="Beispiel-Server 1" />
 * </z-field>
 *
 * <z-field label="Maximale Spieler" for="in-max" error="Dein Tarif erlaubt höchstens 100 Spieler.">
 *   <input zInput mono invalid id="in-max" value="200" />
 * </z-field>
 * ```
 */
@Component({
  selector: 'z-field',
  template: `
    @if (label()) {
      <label class="z-field__label" [attr.for]="fuer() || null">{{ label() }}</label>
    }
    <ng-content />
    @if (error()) {
      <span class="z-field__error" [attr.id]="fehlerId()">{{ error() }}</span>
    } @else if (hint()) {
      <span class="z-field__hint" [attr.id]="hinweisId()">{{ hint() }}</span>
    }
  `,
  host: { 'class': 'z-field' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZField {
  /**
   * Visible label above the control. Empty means no label element is rendered.
   *
   * @default ''
   */
  readonly label = input('');

  /**
   * id of the control inside the field. Connects the label with the control and
   * serves as the prefix for the hint and error ids. Empty means no `for`
   * attribute and no `aria-describedby` wiring.
   *
   * @default ''
   */
  readonly for = input('');

  /**
   * Helper text below the control. Only shown while `error` is empty.
   *
   * @default ''
   */
  readonly hint = input('');

  /**
   * Error message below the control. Non-empty replaces the hint. The message
   * names the cause and the next step; the control itself is marked with
   * `invalid`.
   *
   * @default ''
   */
  readonly error = input('');

  /** `for` is a keyword in the template, hence this second name. */
  protected readonly fuer = this.for;

  protected readonly hinweisId = computed(() => (this.for() ? `${this.for()}-hint` : null));
  protected readonly fehlerId = computed(() => (this.for() ? `${this.for()}-error` : null));

  /**
   * id of the currently visible accompanying text: the error id while `error`
   * is set, otherwise the hint id, and `null` if neither is shown or `for` is
   * empty. The projected control binds its `aria-describedby` to this.
   *
   * @internal Wiring between `z-field` and the controls inside it, not meant to
   * be read by applications.
   */
  readonly beschreibung = computed(() => {
    if (this.error()) {
      return this.fehlerId();
    }
    return this.hint() ? this.hinweisId() : null;
  });
}
