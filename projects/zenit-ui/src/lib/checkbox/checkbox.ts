import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  forwardRef,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Selects entries for a bulk action or confirms a statement, on a native
 * `<input type="checkbox">`. It never switches anything immediately; for
 * settings that take effect at once use `z-toggle`.
 *
 * Renders `<label class="z-check">` with the native checkbox and a `<span>`
 * holding the projected text. Because the whole thing is a label, a click on
 * the text toggles the box.
 *
 * Accessibility: without visible text, for example in a table row, the caller
 * passes {@link ariaLabel}; the attribute is only written when it is not empty.
 * The checked state lives directly on the native element, written in an
 * `effect`, so a control that rejects an input still keeps element and model in
 * sync.
 *
 * Forms: implements `ControlValueAccessor`, so `ngModel` and `formControl`
 * work. `setDisabledState` from forms and the {@link disabled} input are
 * independent; either one locks the checkbox.
 *
 * @example
 * ```html
 * <z-checkbox [(checked)]="alleGewaehlt()">Alle auswählen</z-checkbox>
 * <z-checkbox [formControl]="agb">Ich stimme den Bedingungen zu</z-checkbox>
 * <z-checkbox ariaLabel="Beispiel-Server 1 auswählen" />
 * ```
 */
@Component({
  selector: 'z-checkbox',
  template: `
    <label class="z-check">
      <input
        #feld
        type="checkbox"
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
  /**
   * Checked state, two-way bindable. Also the value seen by `ngModel` and
   * `formControl`.
   *
   * @default false
   */
  readonly checked = model(false);

  /**
   * Locks the checkbox. Independent of `setDisabledState` from forms; either
   * one is enough. Boolean attribute.
   *
   * @default false
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * `aria-label` of the native input, for a checkbox without visible text.
   * Empty writes no attribute.
   *
   * @default ''
   */
  readonly ariaLabel = input('');

  /** Lock coming from forms, independent of the `disabled` input. Either one is enough. */
  private readonly formsGesperrt = signal(false);
  protected readonly gesperrt = computed(() => this.disabled() || this.formsGesperrt());

  private melde?: (wert: boolean) => void;
  private aufBeruehrt?: () => void;

  private readonly feld = viewChild.required<ElementRef<HTMLInputElement>>('feld');

  constructor() {
    // The check mark is written straight onto the element, not through a
    // [checked] binding. A click changes the checkedness on the element
    // itself. If a control reverts the input before a change detection ran,
    // the expression still holds the same value as last rendered and the
    // binding would not write: field and control would drift apart. That is
    // why Angular's own accessors write straight onto the element too.
    effect(() => {
      this.feld().nativeElement.checked = this.checked();
    });
  }

  protected aufAenderung(ereignis: Event): void {
    const wert = (ereignis.target as HTMLInputElement).checked;
    this.checked.set(wert);
    this.melde?.(wert);
  }

  protected beruehrt(): void {
    this.aufBeruehrt?.();
  }

  /**
   * `ControlValueAccessor`: takes the value from the form. `null` and
   * `undefined` count as unchecked.
   */
  writeValue(wert: boolean): void {
    this.checked.set(!!wert);
  }

  /**
   * `ControlValueAccessor`: registers the callback that reports a new value to
   * the form. It fires on a change of the native checkbox, not on writes
   * through {@link checked}.
   */
  registerOnChange(fn: (wert: boolean) => void): void {
    this.melde = fn;
  }

  /** `ControlValueAccessor`: registers the callback fired when the checkbox loses focus. */
  registerOnTouched(fn: () => void): void {
    this.aufBeruehrt = fn;
  }

  /** `ControlValueAccessor`: locks or unlocks the checkbox from the form side. */
  setDisabledState(gesperrt: boolean): void {
    this.formsGesperrt.set(gesperrt);
  }
}
