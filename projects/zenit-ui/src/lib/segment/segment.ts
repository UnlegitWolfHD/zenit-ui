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

/** One view in a segment. */
export interface ZSegmentOption {
  /** The value reported through `value`. Also the tracking key of the list. */
  value: string;
  /** Short noun shown on the button, without an icon. */
  label: string;
}

/**
 * Segment switches the view on the same data, at most four options: the period
 * in the billing view, open versus closed in support, filters. For sub-pages
 * with a URL of their own use `ZTabs` instead.
 *
 * Renders one `<button type="button">` per option and puts the class
 * `z-segment` on the host.
 *
 * Accessibility: the host is a `role="group"` named by {@link ariaLabel}; the
 * chosen option carries `aria-pressed="true"`, all others `"false"`. The
 * buttons are ordinary tab stops, so the Tab key moves between them and Enter
 * or Space picks one. While disabled every button is `disabled` and therefore
 * out of the tab order.
 *
 * Implements `ControlValueAccessor`, so `ngModel` and reactive forms work
 * alongside the two-way binding on {@link value}.
 *
 * @example
 * ```html
 * <z-segment
 *   [options]="[{ value: '1', label: '1 Monat' }, { value: '12', label: '12 Monate' }]"
 *   [(value)]="zeitraum"
 *   ariaLabel="Zeitraum"
 * />
 * ```
 */
@Component({
  selector: 'z-segment',
  template: `
    @for (option of options(); track option.value) {
      <button
        type="button"
        [attr.aria-pressed]="option.value === value()"
        [disabled]="gesperrt()"
        (click)="waehle(option.value)"
        (blur)="beruehrt()"
      >
        {{ option.label }}
      </button>
    }
  `,
  host: {
    class: 'z-segment',
    role: 'group',
    '[attr.aria-label]': `ariaLabel() || null`,
  },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ZSegment), multi: true }],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZSegment implements ControlValueAccessor {
  /**
   * The options in display order, at most four. Tracked by `value`, so those
   * have to be unique.
   *
   * @default []
   */
  readonly options = input<readonly ZSegmentOption[]>([]);

  /**
   * The chosen option's `value`, two-way bindable. A value that matches no
   * option leaves every button unpressed.
   *
   * @default ''
   */
  readonly value = model('');

  /**
   * Accessible name of the group, for example "Zeitraum". Empty means no
   * `aria-label` at all.
   *
   * @default ''
   */
  readonly ariaLabel = input('');

  /**
   * Disables every button. Independent of the disabled state that reactive
   * forms set; either one is enough to lock the segment.
   *
   * @default false
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Lock coming from forms, independent of the `disabled` input. Either one suffices. */
  private readonly formsGesperrt = signal(false);
  protected readonly gesperrt = computed(() => this.disabled() || this.formsGesperrt());

  private melde?: (wert: string) => void;
  private aufBeruehrt?: () => void;

  protected waehle(wert: string): void {
    if (wert === this.value()) {
      return;
    }
    this.value.set(wert);
    this.melde?.(wert);
  }

  protected beruehrt(): void {
    this.aufBeruehrt?.();
  }

  /**
   * `ControlValueAccessor`: takes the value from the form. `null` and
   * `undefined` become the empty string, which selects nothing.
   */
  writeValue(wert: string): void {
    this.value.set(wert ?? '');
  }

  /**
   * `ControlValueAccessor`: registers the callback that reports a new value to
   * the form. It fires on a click on a different option, not on writes through
   * {@link value}.
   */
  registerOnChange(fn: (wert: string) => void): void {
    this.melde = fn;
  }

  /** `ControlValueAccessor`: registers the callback fired when a button loses focus. */
  registerOnTouched(fn: () => void): void {
    this.aufBeruehrt = fn;
  }

  /** `ControlValueAccessor`: locks or unlocks the segment from the form side. */
  setDisabledState(gesperrt: boolean): void {
    this.formsGesperrt.set(gesperrt);
  }
}
