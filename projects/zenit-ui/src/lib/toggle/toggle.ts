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
 * Toggle auf nativem `<input type="checkbox" role="switch">`. Schaltet eine
 * Einstellung ohne Speichern-Button. In einer `z-setting`-Zeile zeigt
 * `ariaLabelledby` auf die `titleId` des Titels, sonst traegt der Toggle
 * `ariaLabel`.
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
      (change)="aufAenderung($event)"
      (blur)="beruehrt()"
    />
  `,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ZToggle), multi: true }],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZToggle implements ControlValueAccessor {
  readonly checked = model(false);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input('');
  readonly ariaLabelledby = input('');

  /** Sperre aus Forms, unabhaengig vom Input `disabled`. Eines von beiden reicht. */
  private readonly formsGesperrt = signal(false);
  protected readonly gesperrt = computed(() => this.disabled() || this.formsGesperrt());

  private melde?: (wert: boolean) => void;
  private aufBeruehrt?: () => void;

  private readonly feld = viewChild.required<ElementRef<HTMLInputElement>>('feld');

  constructor() {
    // Der Schaltzustand steht direkt am Element, nicht ueber eine Bindung
    // [checked]. Ein Klick aendert die Checkedness am Element selbst. Dreht
    // eine Steuerung die Eingabe zurueck, bevor eine Change Detection lief,
    // traegt der Ausdruck denselben Wert wie zuletzt gerendert, und die
    // Bindung wuerde nicht schreiben: Feld und Steuerung liefen auseinander.
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
