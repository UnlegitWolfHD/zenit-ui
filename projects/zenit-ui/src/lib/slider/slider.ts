import {
  afterNextRender,
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
  untracked,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ZIcon } from '../icon';
import { injectZLabels } from '../labels';

/** Set by the Angular build; a production build drops the branch around it. */
declare const ngDevMode: boolean | undefined;

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
 * {@link steppers} adds a minus and a plus button left and right of the track,
 * which the design system requires beyond twelve steps and on devices without a
 * mouse. Each of them moves the value by one {@link step},
 * clamped to the scale, and writes through the same path as the track, so model,
 * form and `valueChange` see exactly one change. The scale stays what it is; the
 * buttons only add a second way to reach it, and the range input keeps its own
 * arrow keys, Home and End. A development build warns once per instance when a
 * scale has more than twelve steps and {@link steppers} is off.
 *
 * Accessibility: the label is tied to the input through a generated `id`. With
 * no visible label the input takes {@link ariaLabel} instead, and only then.
 * `aria-valuetext` carries the value with its unit, so a screen reader reads
 * "8 GB" and not just "8". {@link hint} is referenced through
 * `aria-describedby`, while the tick row is `aria-hidden="true"`, since it only
 * repeats the scale the input already reports. Without {@link label} and
 * without {@link ariaLabel} the slider has no name at all, which a development
 * build reports once per instance as a `console.warn`.
 *
 * Scale and value are written straight onto the native element in an `effect`,
 * `min`, `max` and `step` included, because the browser would otherwise clamp
 * the value to the default scale 0 to 100. The same effect reads the value back
 * from the element afterwards: the element clamps to the scale and snaps to the
 * step, and that corrected value becomes the model and is reported to the form,
 * so thumb, display and value never drift apart. A {@link max} below
 * {@link min} is written onto the element as `min`, the way the browsers read
 * it anyway, so the scale collapses onto `min` and the value is `min`.
 *
 * Forms: implements `ControlValueAccessor`, so `ngModel` and `formControl`
 * work, and so does the Signal Forms `[formField]`, which binds through the
 * same accessor. There the scale comes from the schema: Angular rejects
 * `[min]`, `[max]` and `[disabled]` next to `[formField]` and feeds
 * {@link min}, {@link max}, {@link disabled}, {@link invalid} and
 * {@link touched} from the `min()`, `max()` and `disabled()` rules and the
 * field state. `setDisabledState` from forms and the {@link disabled} input
 * are independent; either one locks the slider.
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
  imports: [ZIcon],
  template: `
    <div class="z-range__head">
      @if (label()) {
        <label class="z-field__label" [attr.for]="id">{{ label() }}</label>
      }
      <span class="z-range__value">{{ anzeige() }}</span>
    </div>
    <div [class.z-range__row]="steppers()">
      @if (steppers()) {
        <button
          type="button"
          class="z-btn z-btn--ghost z-btn--icon z-btn--sm"
          [attr.aria-label]="wenigerText"
          [disabled]="gesperrt()"
          [attr.aria-disabled]="amMinimum() ? 'true' : null"
          (click)="stufe(-1)"
        >
          <z-icon name="remove" />
        </button>
      }
      <input
        #feld
        type="range"
        [id]="id"
        [attr.aria-label]="label() ? null : ariaLabel() || null"
        [disabled]="gesperrt()"
        [attr.aria-valuetext]="anzeige()"
        [attr.aria-describedby]="hint() ? hinweisId : null"
        [attr.aria-invalid]="invalid() && touched() ? 'true' : null"
        (input)="aufEingabe($event)"
        (blur)="beruehrt()"
      />
      @if (steppers()) {
        <button
          type="button"
          class="z-btn z-btn--ghost z-btn--icon z-btn--sm"
          [attr.aria-label]="mehrText"
          [disabled]="gesperrt()"
          [attr.aria-disabled]="amMaximum() ? 'true' : null"
          (click)="stufe(1)"
        >
          <z-icon name="add" />
        </button>
      }
    </div>
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
  host: { class: 'z-range' },
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
   * Lower end of the scale. With `[formField]` it comes from the `min()` rule
   * of the schema; without such a rule, `undefined`, it is the default.
   *
   * @default 0
   */
  readonly min = input(0, { transform: (wert: unknown) => numberAttribute(wert, 0) });

  /**
   * Upper end of the scale. With `[formField]` it comes from the `max()` rule
   * of the schema; without such a rule, `undefined`, it is the default.
   *
   * @default 100
   */
  readonly max = input(100, { transform: (wert: unknown) => numberAttribute(wert, 100) });

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
   * Adds a minus and a plus button left and right of the track, each moving the
   * value by one {@link step}. The design system requires them beyond twelve
   * steps and on devices without a mouse. Explicit on purpose:
   * the component never switches them on by itself, because a slider that grows
   * a pair of buttons the moment a `max` changes is a layout that moves without
   * anyone asking for it. A development build warns once per instance when
   * `(max - min) / step` is above twelve and this is still off. Boolean
   * attribute.
   *
   * @default false
   */
  readonly steppers = input(false, { transform: booleanAttribute });

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
   * `formControl`. A value outside {@link min} and {@link max} or between two
   * steps is corrected to the value the element really holds, and that
   * correction is written back here and reported to the form.
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

  /**
   * Validation failed. Writes `aria-invalid="true"` onto the range input while
   * {@link touched} holds too; there is no error colour for a slider. Set by
   * `[formField]` from the field state. Boolean attribute.
   *
   * @default false
   */
  readonly invalid = input(false, { transform: booleanAttribute });

  /**
   * Whether the user has left the slider, which gates {@link invalid}, so an
   * untouched form does not start out in error. Set by `[formField]`; outside
   * Signal Forms it stays `true` and {@link invalid} alone decides.
   *
   * @default true
   */
  readonly touched = input(true, { transform: booleanAttribute });

  protected readonly id = `z-slider-${++laufendeNummer}`;
  protected readonly hinweisId = `${this.id}-hint`;

  /** Value with its unit, separated by a non-breaking space. */
  protected readonly anzeige = computed(() =>
    this.unit() ? `${this.value()}\u{00a0}${this.unit()}` : `${this.value()}`,
  );

  /** Lock coming from forms, independent of the `disabled` input. Either one is enough. */
  private readonly formsGesperrt = signal(false);
  protected readonly gesperrt = computed(() => this.disabled() || this.formsGesperrt());

  private readonly labels = injectZLabels();
  /** Names of the two buttons; the registry is the only place they come from. */
  protected readonly wenigerText = this.labels.sliderDecrease;
  protected readonly mehrText = this.labels.sliderIncrease;

  /**
   * Upper end as the browsers read it: a `max` below `min` collapses the scale
   * onto `min`, the same way the effect writes it onto the element.
   */
  protected readonly obergrenze = computed(() => Math.max(this.min(), this.max()));
  protected readonly amMinimum = computed(() => this.value() <= this.min());
  protected readonly amMaximum = computed(() => this.value() >= this.obergrenze());

  /** The step the buttons move by; `0` and `NaN` would otherwise freeze them. */
  private readonly schrittweite = computed(() => Math.abs(this.step()) || 1);

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
      // A max below min is an authoring mistake. The browsers resolve it as
      // "the maximum is at least the minimum", so the scale collapses onto min;
      // it is written that way, because the engines disagree on which of the
      // two clamps wins otherwise and the value would then keep flipping
      // between min and max.
      schiene.max = String(Math.max(this.min(), this.max()));
      schiene.step = String(this.step());
      schiene.value = String(this.value());
      // The element keeps itself on the scale: it clamps to min and max and
      // rounds onto the step. Without reading that back, thumb, aria-valuetext
      // and model would name three different numbers. The correction runs at
      // most once, because the next pass reads back exactly the value it has
      // just written.
      //
      // `Number.isFinite`, not `!Number.isNaN`: only an engine that really
      // parses the value answers with a number at all. The server has no
      // layout and no value parsing, so `valueAsNumber` is `undefined` there —
      // and `Number.isNaN(undefined)` is `false`, so the old guard let it
      // through and the slider reported `undefined` to the form, which dropped
      // the field out of the model and took `[formField]` down with it.
      const echt = schiene.valueAsNumber;
      if (Number.isFinite(echt) && echt !== untracked(this.value)) {
        this.value.set(echt);
        this.melde?.(echt);
      }
    });

    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      // After the first render, so a name arriving through a binding is there.
      afterNextRender(() => {
        if (!this.label() && !this.ariaLabel()) {
          console.warn(
            'ZSlider: Der Regler hat keinen zugänglichen Namen. Setze label="…" für ein sichtbares Label oder ariaLabel="…" ohne sichtbares Label.',
          );
        }
        const stufen = (this.obergrenze() - this.min()) / this.schrittweite();
        if (!this.steppers() && stufen > 12) {
          console.warn(
            `ZSlider: ${Math.round(stufen)} Stufen ohne steppers. ` +
              'spec/components/Slider/README.md: "Bei mehr als 12 Stufen oder auf Geräten ohne ' +
              'Maus zusätzlich Plus- und Minus-Buttons anbieten." Setze steppers am z-slider.',
          );
        }
      });
    }
  }

  /**
   * One step up or down, the way the two buttons move the value: clamped to the
   * scale and reported through the same path as an input on the track, so model,
   * form and `valueChange` see exactly one change. A button that is only marked
   * `aria-disabled` keeps the focus, so its click is swallowed here.
   */
  protected stufe(richtung: 1 | -1): void {
    if (this.gesperrt() || (richtung < 0 ? this.amMinimum() : this.amMaximum())) {
      return;
    }
    const ziel = Math.min(
      Math.max(untracked(this.value) + richtung * this.schrittweite(), this.min()),
      this.obergrenze(),
    );
    if (ziel === untracked(this.value)) {
      return;
    }
    this.value.set(ziel);
    this.melde?.(ziel);
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
