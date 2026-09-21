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
 * Sets an amount on a fixed scale, on a native `<input type="range">`: RAM,
 * slots, storage. The current value always stands next to the track as a
 * number with its unit, so the slider never is the only place the amount
 * appears.
 *
 * Renders the class `z-range` on the host, inside it `div.z-range__head` with
 * the `label.z-field__label` and the value in `span.z-range__value`, then the
 * range input, then `div.z-range__ticks` with one `<span>` per entry of
 * {@link ticks} and finally `span.z-field__hint`. Head label, ticks and hint
 * only appear when their input is filled.
 *
 * Accessibility: the label is tied to the input through a generated `id`. With
 * no visible label the input takes {@link ariaLabel} instead, and only then.
 * `aria-valuetext` carries the value with its unit, so a screen reader reads
 * "8 GB" and not just "8". {@link hint} is referenced through
 * `aria-describedby`, while the tick row is `aria-hidden="true"`, since it only
 * repeats the scale the input already reports.
 *
 * Scale and value are written straight onto the native element in an `effect`,
 * `min`, `max` and `step` included, because the browser would otherwise clamp
 * the value to the default scale 0 to 100.
 *
 * Forms: implements `ControlValueAccessor`, so `ngModel` and `formControl`
 * work. `setDisabledState` from forms and the {@link disabled} input are
 * independent; either one locks the slider.
 *
 * @example
 * ```html
 * <z-slider
 *   label="Arbeitsspeicher"
 *   unit="GB"
 *   [min]="2"
 *   [max]="16"
 *   [step]="2"
 *   [ticks]="[2, 4, 8, 16]"
 *   hint="Für Minecraft mit Mods sind 8 GB empfohlen."
 *   [(value)]="ram"
 * />
 * ```
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
  /**
   * Visible label above the track, tied to the input through a generated `id`.
   * Empty renders no label, and then {@link ariaLabel} names the input.
   *
   * @default ''
   */
  readonly label = input('');

  /**
   * `aria-label` of the input, used only while {@link label} stays empty. A
   * visible label always wins.
   *
   * @default ''
   */
  readonly ariaLabel = input('');

  /**
   * Lower end of the scale.
   *
   * @default 0
   */
  readonly min = input(0, { transform: numberAttribute });

  /**
   * Upper end of the scale.
   *
   * @default 100
   */
  readonly max = input(100, { transform: numberAttribute });

  /**
   * Distance between two bookable steps. Only steps that can actually be
   * ordered belong on the scale.
   *
   * @default 1
   */
  readonly step = input(1, { transform: numberAttribute });

  /**
   * Unit behind the value, for example `GB`. Shown next to the number with a
   * non-breaking space and read out through `aria-valuetext`. Empty shows the
   * bare number.
   *
   * @default ''
   */
  readonly unit = input('');

  /**
   * Scale values printed below the track, for example `[2, 4, 8, 16]`. Purely
   * visual: the row is `aria-hidden`, and the values change nothing about the
   * scale itself. An empty list renders no tick row.
   *
   * @default []
   */
  readonly ticks = input<readonly (string | number)[]>([]);

  /**
   * One sentence below the track, normally the recommendation for the chosen
   * game. Referenced through `aria-describedby`; empty renders nothing.
   *
   * @default ''
   */
  readonly hint = input('');

  /**
   * Current value, two-way bindable. Also the value seen by `ngModel` and
   * `formControl`. The browser keeps it on the scale between {@link min} and
   * {@link max}.
   *
   * @default 0
   */
  readonly value = model(0);

  /**
   * Locks the slider. Independent of `setDisabledState` from forms; either one
   * is enough. Boolean attribute.
   *
   * @default false
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly id = `z-slider-${++laufendeNummer}`;
  protected readonly hinweisId = `${this.id}-hint`;

  /** Value with its unit, separated by a non-breaking space. */
  protected readonly anzeige = computed(() =>
    this.unit() ? `${this.value()}\u{00a0}${this.unit()}` : `${this.value()}`,
  );

  /** Lock coming from forms, independent of the `disabled` input. Either one is enough. */
  private readonly formsGesperrt = signal(false);
  protected readonly gesperrt = computed(() => this.disabled() || this.formsGesperrt());

  private melde?: (wert: number) => void;
  private aufBeruehrt?: () => void;

  private readonly feld = viewChild.required<ElementRef<HTMLInputElement>>('feld');

  constructor() {
    // Scale and value are written straight onto the element, not through
    // bindings. A pointer input changes the value on the element itself. If a
    // control reverts it before a change detection ran, the expression still
    // holds the same value as last rendered and a [value] binding would not
    // write: track and control would drift apart. min, max and step are part
    // of the same effect, because the browser would otherwise clamp the value
    // to the still unset default scale 0 to 100.
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

  /**
   * `ControlValueAccessor`: takes the value from the form. `null` and
   * `undefined` fall back to {@link min}.
   */
  writeValue(wert: number): void {
    this.value.set(Number(wert ?? this.min()));
  }

  /**
   * `ControlValueAccessor`: registers the callback that reports a new value to
   * the form. It fires on every `input` of the track, so while dragging, not on
   * writes through {@link value}.
   */
  registerOnChange(fn: (wert: number) => void): void {
    this.melde = fn;
  }

  /** `ControlValueAccessor`: registers the callback fired when the track loses focus. */
  registerOnTouched(fn: () => void): void {
    this.aufBeruehrt = fn;
  }

  /** `ControlValueAccessor`: locks or unlocks the slider from the form side. */
  setDisabledState(gesperrt: boolean): void {
    this.formsGesperrt.set(gesperrt);
  }
}
