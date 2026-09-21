import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
} from '@angular/core';
import { ZButton } from '../button';

let zaehler = 0;

/**
 * A field with a button that checks or applies the value right away: voucher
 * code, subdomain, a player for the whitelist.
 *
 * Renders a `div.z-field` with the visible label, a
 * `div.z-input-action` holding the `input.z-input` and the secondary button,
 * and below it the feedback: the effect in `.z-field__success`, the reason in
 * `.z-field__error`.
 *
 * Accessibility: the label is a real `<label for>`, never only a placeholder,
 * and "(optional)" belongs in it. Enter in the field triggers the button, but
 * not on an empty field and not while it is loading. Success and error are
 * always in the DOM as polite live regions (`role="status"`), so a sentence that
 * appears later is announced; both are tied to the field through
 * `aria-describedby`, and an error also sets `aria-invalid` on it. Polite, not
 * `role="alert"`: the answer belongs to an action the visitor just took, so it
 * waits its turn instead of interrupting whatever is being read.
 *
 * @example
 * ```html
 * <z-input-action
 *   label="Gutscheincode (optional)"
 *   actionLabel="Einlösen"
 *   [(value)]="code"
 *   [loading]="pruefe()"
 *   [success]="erfolg()"
 *   [error]="fehler()"
 *   (action)="einloesen($event)"
 * />
 * ```
 */
@Component({
  selector: 'z-input-action',
  imports: [ZButton],
  template: `
    <div class="z-field">
      @if (label()) {
        <label class="z-field__label" [for]="feldId">{{ label() }}</label>
      }
      <div class="z-input-action">
        <input
          class="z-input z-input--mono"
          type="text"
          [id]="feldId"
          [attr.aria-label]="label() ? null : ariaLabel() || null"
          [value]="value()"
          [disabled]="disabled()"
          [attr.aria-invalid]="error() ? 'true' : null"
          [attr.aria-describedby]="feldId + '-success ' + feldId + '-error'"
          (input)="value.set($any($event.target).value)"
          (keydown.enter)="loesAus($event)"
        />
        <button
          zBtn="secondary"
          type="button"
          [loading]="loading()"
          [disabled]="disabled()"
          (click)="loesAus($event)"
        >
          {{ actionLabel() }}
        </button>
      </div>
      <!-- Both live regions stand in the markup before their sentence does,
           which is what makes a later sentence announce itself. Empty they are
           inline and generate no line box, so the block stays flat; one shared
           grid item keeps it at one gap instead of two. -->
      <div>
        <span class="z-field__success" [id]="feldId + '-success'" role="status">{{
          success()
        }}</span>
        <span class="z-field__error" [id]="feldId + '-error'" role="status">{{ error() }}</span>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZInputAction {
  /**
   * Visible label above the field. "(optional)" belongs in here, not in the
   * placeholder. Empty renders no label element.
   *
   * @default ''
   */
  readonly label = input('');

  /**
   * Accessible name of the field where {@link label} is empty, for example in a
   * toolbar. A visible label always wins over it.
   *
   * @default ''
   */
  readonly ariaLabel = input('');

  /**
   * Caption of the button, a verb: "Einlösen", "Prüfen", "Hinzufügen".
   *
   * @default ''
   */
  readonly actionLabel = input('');

  /**
   * What stands in the field, two-way bindable. It is also what {@link action}
   * carries.
   *
   * @default ''
   */
  readonly value = model('');

  /**
   * The effect of a successful check, for example "Gutschein ZENIT10
   * eingelöst: −0,77 €". Empty leaves the line blank.
   *
   * @default ''
   */
  readonly success = input('');

  /**
   * Why the check failed, naming cause and next step. Also sets `aria-invalid`
   * on the field and with it the danger border. Empty leaves the line blank.
   *
   * @default ''
   */
  readonly error = input('');

  /**
   * While the check runs: the button shows the spinner and is locked, and
   * Enter in the field triggers nothing. Boolean attribute.
   *
   * @default false
   */
  readonly loading = input(false, { transform: booleanAttribute });

  /**
   * Locks field and button, for example while the order is being sent. Boolean
   * attribute.
   *
   * @default false
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * Fires with the current value when the button is pressed or Enter is hit in
   * the field. It does not fire on an empty field and not while
   * {@link loading} holds.
   */
  readonly action = output<string>();

  protected readonly feldId = `z-input-action-${++zaehler}`;

  protected loesAus(ereignis: Event): void {
    ereignis.preventDefault();
    const wert = this.value().trim();
    if (!wert || this.loading() || this.disabled()) {
      return;
    }
    // The trimmed value, because that is what was checked a line above and
    // what every caller would trim again.
    this.action.emit(wert);
  }
}
