import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  model,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Checkbox auf nativem `<input type="checkbox">`. Waehlt Eintraege fuer eine
 * Sammelaktion aus oder bestaetigt eine Aussage. Sie schaltet nichts sofort,
 * dafuer ist Toggle da. Ohne sichtbaren Text traegt sie `ariaLabel`.
 */
@Component({
  selector: 'z-checkbox',
  template: `
    <label class="z-check">
      <input
        type="checkbox"
        [checked]="checked()"
        [disabled]="gesperrt()"
        [attr.aria-label]="ariaLabel() || null"
        (change)="aufAenderung($event)"
        (blur)="beruehrt()"
      /><span><ng-content /></span>
    </label>
  `,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ZCheckbox), multi: true },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZCheckbox implements ControlValueAccessor {
  readonly checked = model(false);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input('');

  /** Sperre aus Forms, unabhaengig vom Input `disabled`. Eines von beiden reicht. */
  private readonly formsGesperrt = signal(false);
  protected readonly gesperrt = computed(() => this.disabled() || this.formsGesperrt());

  private melde?: (wert: boolean) => void;
  private aufBeruehrt?: () => void;

  protected aufAenderung(ereignis: Event): void {
    const wert = (ereignis.target as HTMLInputElement).checked;
    this.checked.set(wert);
    this.melde?.(wert);
  }

  protected beruehrt(): void {
    this.aufBeruehrt?.();
  }

  writeValue(wert: boolean): void {
    this.checked.set(!!wert);
  }

  registerOnChange(fn: (wert: boolean) => void): void {
    this.melde = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.aufBeruehrt = fn;
  }

  setDisabledState(gesperrt: boolean): void {
    this.formsGesperrt.set(gesperrt);
  }
}
