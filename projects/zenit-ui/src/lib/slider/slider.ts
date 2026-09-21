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
  numberAttribute,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let laufendeNummer = 0;

/**
 * Slider auf nativem `<input type="range">`. Stellt eine Menge auf einer
 * festen Skala ein. Der Wert steht immer als Zahl mit Einheit daneben, die
 * Skalenwerte stehen als `ticks` darunter.
 */
@Component({
  selector: 'z-slider',
  template: `
    <div class="z-range__head">
      @if (label()) {
        <label class="z-field__label" [attr.for]="id">{{ label() }}</label>
      }
      <span class="z-range__value">{{ anzeige() }}</span>
    </div>
    <input
      #feld
      type="range"
      [id]="id"
      [attr.aria-label]="label() ? null : ariaLabel() || null"
      [disabled]="gesperrt()"
      [attr.aria-valuetext]="anzeige()"
      [attr.aria-describedby]="hint() ? hinweisId : null"
      (input)="aufEingabe($event)"
      (blur)="beruehrt()"
    />
    @if (ticks().length) {
      <div class="z-range__ticks" aria-hidden="true">
        @for (marke of ticks(); track $index) {
          <span>{{ marke }}</span>
        }
      </div>
    }
    @if (hint()) {
      <span class="z-field__hint" [id]="hinweisId">{{ hint() }}</span>
    }
  `,
  host: { 'class': 'z-range' },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ZSlider), multi: true }],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZSlider implements ControlValueAccessor {
  readonly label = input('');
  /** Ersetzt das sichtbare Label, wenn `label` leer bleibt. */
  readonly ariaLabel = input('');
  readonly min = input(0, { transform: numberAttribute });
  readonly max = input(100, { transform: numberAttribute });
  readonly step = input(1, { transform: numberAttribute });
  readonly unit = input('');
  readonly ticks = input<readonly (string | number)[]>([]);
  readonly hint = input('');
  readonly value = model(0);
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly id = `z-slider-${++laufendeNummer}`;
  protected readonly hinweisId = `${this.id}-hint`;

  /** Wert mit Einheit, geschuetztes Leerzeichen dazwischen. */
  protected readonly anzeige = computed(() =>
    this.unit() ? `${this.value()}\u{00a0}${this.unit()}` : `${this.value()}`,
  );

  /** Sperre aus Forms, unabhaengig vom Input `disabled`. Eines von beiden reicht. */
  private readonly formsGesperrt = signal(false);
  protected readonly gesperrt = computed(() => this.disabled() || this.formsGesperrt());

  private melde?: (wert: number) => void;
  private aufBeruehrt?: () => void;

  private readonly feld = viewChild.required<ElementRef<HTMLInputElement>>('feld');

  constructor() {
    // Skala und Wert stehen direkt am Element, nicht ueber Bindungen. Eine
    // Zeigereingabe aendert den Wert am Element selbst. Dreht eine Steuerung
    // sie zurueck, bevor eine Change Detection lief, traegt der Ausdruck
    // denselben Wert wie zuletzt gerendert, und eine Bindung [value] wuerde
    // nicht schreiben: Schiene und Steuerung liefen auseinander. min, max und
    // step stehen mit im Effekt, weil der Browser den Wert sonst auf die noch
    // ungesetzte Standardskala 0 bis 100 begrenzt.
    effect(() => {
      const schiene = this.feld().nativeElement;
      schiene.min = String(this.min());
      schiene.max = String(this.max());
      schiene.step = String(this.step());
      schiene.value = String(this.value());
    });
  }

  protected aufEingabe(ereignis: Event): void {
    const wert = (ereignis.target as HTMLInputElement).valueAsNumber;
    this.value.set(wert);
    this.melde?.(wert);
  }

  protected beruehrt(): void {
    this.aufBeruehrt?.();
  }

  writeValue(wert: number): void {
    this.value.set(Number(wert ?? this.min()));
  }

  registerOnChange(fn: (wert: number) => void): void {
    this.melde = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.aufBeruehrt = fn;
  }

  setDisabledState(gesperrt: boolean): void {
    this.formsGesperrt.set(gesperrt);
  }
}
