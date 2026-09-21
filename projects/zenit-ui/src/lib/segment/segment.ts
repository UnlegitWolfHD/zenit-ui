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

/** Eine Sicht im Segment: `value` ist der Wert, `label` das kurze Substantiv. */
export interface ZSegmentOption {
  value: string;
  label: string;
}

/**
 * Segment wechselt die Sicht auf dieselben Daten, hoechstens vier Optionen.
 * Die Gruppe traegt `role="group"` mit `ariaLabel`, die gewaehlte Sicht
 * `aria-pressed="true"`. Fuer Unterseiten mit eigener URL sind Tabs da.
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
    'class': 'z-segment',
    'role': 'group',
    '[attr.aria-label]': `ariaLabel() || null`,
  },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ZSegment), multi: true }],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZSegment implements ControlValueAccessor {
  readonly options = input<readonly ZSegmentOption[]>([]);
  readonly value = model('');
  readonly ariaLabel = input('');
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Sperre aus Forms, unabhaengig vom Input `disabled`. Eines von beiden reicht. */
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

  writeValue(wert: string): void {
    this.value.set(wert ?? '');
  }

  registerOnChange(fn: (wert: string) => void): void {
    this.melde = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.aufBeruehrt = fn;
  }

  setDisabledState(gesperrt: boolean): void {
    this.formsGesperrt.set(gesperrt);
  }
}
