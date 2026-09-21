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
import type { FormCheckboxControl } from '@angular/forms/signals';

/**
 * Switches a setting that takes effect without a save button, on a native
 * `<input type="checkbox" role="switch">`. For choices that only take effect
 * on submit use `z-checkbox`.
 *
 * Renders that single input with the class `z-toggle` and nothing else; the
 * label belongs to the surrounding `z-setting` row. Off is `surface` with
 * `border-control`, on is `success`, because "on" is a state and not an
 * action.
 *
 * Accessibility: `role="switch"` makes the state readable as on or off. Inside
 * a `z-setting` row the caller points {@link ariaLabelledby} at the `titleId`
 * of the row title; standing alone the toggle carries {@link ariaLabel}.
 * Either attribute is only written when it is not empty. The switch state
 * lives directly on the native element, written in an `effect`, so a control
 * that rejects a switch still keeps element and model in sync.
 *
 * Forms: implements `ControlValueAccessor`, so `ngModel` and `formControl`
 * work, and has the shape of a Signal Forms `FormCheckboxControl`, so
 * `[formField]` works and feeds {@link disabled}, {@link invalid} and
 * {@link touched} from the field state. `setDisabledState` from forms and the
 * {@link disabled} input are independent; either one locks the toggle.
 *
 * @example
 * ```html
 * <z-setting title="PvP" key="pvp" description="Spieler können sich gegenseitig angreifen." titleId="pvp-titel">
 *   <z-toggle [(checked)]="pvp" ariaLabelledby="pvp-titel" />
 * </z-setting>
 * ```
 */
@Component({
  selector: 'z-toggle',
  template: `
    <input
      #feld
      class="z-toggle"
      type="checkbox"
      role="switch"
      [disabled]="gesperrt()"
      [attr.aria-label]="ariaLabel() || null"
      [attr.aria-labelledby]="ariaLabelledby() || null"
      [attr.aria-describedby]="ariaDescribedby() || null"
      [attr.aria-invalid]="invalid() && touched() ? 'true' : null"
      (change)="aufAenderung($event)"
      (blur)="beruehrt()"
    />
  `,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ZToggle), multi: true }],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZToggle implements ControlValueAccessor, FormCheckboxControl {
  /**
   * Switch state, two-way bindable: `true` is on. Also the value seen by
   * `ngModel` and `formControl`.
   *
   * @default false
   */
  readonly checked = model(false);

  /**
   * Locks the toggle. Independent of `setDisabledState` from forms; either one
   * is enough. Boolean attribute.
   *
   * @default false
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * `aria-label` of the switch, for a toggle without a row title. Empty writes
   * no attribute.
   *
   * @default ''
   */
  readonly ariaLabel = input('');

  /**
   * `aria-labelledby` of the switch, normally the `titleId` of the surrounding
   * `z-setting` row. Takes precedence over {@link ariaLabel} in a screen
   * reader. Empty writes no attribute.
   *
   * @default ''
   */
  readonly ariaLabelledby = input('');

  /**
   * `aria-describedby` of the switch: the `id`s of the error or hint sentence
   * that belongs to it, separated by spaces, for example the description of
   * the `z-setting` row. Empty writes no attribute.
   *
   * @default ''
   */
  readonly ariaDescribedby = input('');

  /**
   * Validation failed. Writes `aria-invalid="true"` onto the switch while
   * {@link touched} holds too; there is no error colour for a toggle. Set by
   * `[formField]` from the field state. Boolean attribute.
   *
   * @default false
   */
  readonly invalid = input(false, { transform: booleanAttribute });

  /**
   * Whether the user has left the toggle, which gates {@link invalid}, so an
   * untouched form does not start out in error. Set by `[formField]`; outside
   * Signal Forms it stays `true` and {@link invalid} alone decides.
   *
   * @default true
   */
  readonly touched = input(true, { transform: booleanAttribute });

  /** Lock coming from forms, independent of the `disabled` input. Either one is enough. */
  private readonly formsGesperrt = signal(false);
  protected readonly gesperrt = computed(() => this.disabled() || this.formsGesperrt());

  private melde?: (wert: boolean) => void;
  private aufBeruehrt?: () => void;

  private readonly feld = viewChild.required<ElementRef<HTMLInputElement>>('feld');

  constructor() {
    // The switch state is written straight onto the element, not through a
    // [checked] binding. A click changes the checkedness on the element
    // itself. If a control reverts the input before a change detection ran,
    // the expression still holds the same value as last rendered and the
    // binding would not write: field and control would drift apart.
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
   * `undefined` count as off.
   */
  writeValue(wert: boolean): void {
    this.checked.set(!!wert);
  }

  /**
   * `ControlValueAccessor`: registers the callback that reports a new value to
   * the form. It fires on a change of the switch, not on writes through
   * {@link checked}.
   */
  registerOnChange(fn: (wert: boolean) => void): void {
    this.melde = fn;
  }

  /** `ControlValueAccessor`: registers the callback fired when the toggle loses focus. */
  registerOnTouched(fn: () => void): void {
    this.aufBeruehrt = fn;
  }

  /** `ControlValueAccessor`: locks or unlocks the toggle from the form side. */
  setDisabledState(gesperrt: boolean): void {
    this.formsGesperrt.set(gesperrt);
  }
}
