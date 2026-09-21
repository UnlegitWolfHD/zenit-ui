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
  viewChildren,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { FormValueControl } from '@angular/forms/signals';
import { ZBadge, ZBadgeStatus } from '../badge';

/**
 * One card of a `z-option-group`.
 *
 * @typeParam T The type of {@link value}. `string` for a server type, `number`
 * for a RAM step, so the caller keeps the type it computes with.
 */
export interface ZOption<T extends string | number = string> {
  /** The value reported through `value`. Also the tracking key of the list. */
  value: T;
  /** The name of the option, one or two words. Shown in bold, in mono while `compact`. */
  title: string;
  /** One sentence on what the option means. Optional. */
  description?: string;
  /** The price, already formatted by the caller. Shown in the mono face. Optional. */
  price?: string;
  /** Short word above the card, for example "Empfohlen" or "−6 %". Optional. */
  badge?: string;
  /**
   * Colour of that badge. "Empfohlen" is `info` and appears at most once per
   * group, a discount is `success`.
   *
   * @default 'info'
   */
  badgeStatus?: ZBadgeStatus;
  /** Locks this one card while the rest of the group stays usable. */
  disabled?: boolean;
  /**
   * Why it is locked, for example "zu wenig für 1.21". Shown in place of
   * {@link description} and tied to the radio through `aria-describedby`.
   */
  disabledReason?: string;
}

let zaehler = 0;

/**
 * Picks exactly one of a few options that are meant to be compared: server
 * type, performance class, RAM step, term, payment method. From seven options
 * on it is a `z-combobox` or a `z-slider` instead.
 *
 * Renders a `<fieldset class="z-options">` with the question in
 * `<legend class="z-options__legend">` and one `<label class="z-option">` per
 * option, plus `z-options--compact` for short values such as RAM and term.
 *
 * Accessibility: it is a real radio group. Every card holds a visually hidden
 * native `<input type="radio">` of the same `name`, so the arrow keys move the
 * selection, Tab enters the group once and leaves it again, and the state is
 * announced without any script. The focus ring hangs on the card through
 * `:has(input:focus-visible)`. A locked card names its reason in the card and
 * points at it with `aria-describedby`.
 *
 * Implements `ControlValueAccessor`, so `ngModel` and reactive forms work
 * alongside the two-way binding on {@link value}, and has the shape of a
 * Signal Forms `FormValueControl<string>`, so `[formField]` works. The group as
 * a whole is locked from the form side; a single card is locked through
 * `disabled` on that option.
 *
 * @example
 * ```html
 * <z-option-group
 *   legend="Arbeitsspeicher"
 *   hint="Spielerzahlen sind Richtwerte"
 *   compact
 *   [options]="[
 *     { value: '2', title: '2 GB', disabled: true, disabledReason: 'zu wenig für 1.21' },
 *     { value: '4', title: '4 GB', description: 'etwa 10 Spieler', badge: 'Empfohlen' },
 *   ]"
 *   [(value)]="ram"
 * />
 * ```
 */
@Component({
  selector: 'z-option-group',
  imports: [ZBadge],
  template: `
    <fieldset class="z-options" [class.z-options--compact]="compact()">
      <legend class="z-options__legend">
        {{ legend() }}
        @if (hint()) {
          <small>{{ hint() }}</small>
        }
      </legend>
      @for (option of options(); track option.value; let i = $index) {
        <label class="z-option">
          <input
            #radio
            type="radio"
            [name]="gruppenname"
            [value]="option.value"
            [checked]="option.value === value()"
            [disabled]="gesperrt() || !!option.disabled"
            [attr.aria-describedby]="satz(option) ? gruppenname + '-' + i : null"
            (change)="waehle(option.value)"
            (blur)="beruehrt()"
          />
          @if (option.badge) {
            <z-badge class="z-option__badge" [status]="option.badgeStatus ?? 'info'">{{
              option.badge
            }}</z-badge>
          }
          <span class="z-option__title">{{ option.title }}</span>
          @if (satz(option); as text) {
            <span class="z-option__desc" [id]="gruppenname + '-' + i">{{ text }}</span>
          }
          @if (option.price) {
            <span class="z-option__price">{{ option.price }}</span>
          }
        </label>
      }
    </fieldset>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ZOptionGroup), multi: true },
  ],
})
export class ZOptionGroup<T extends string | number = string>
  implements ControlValueAccessor, FormValueControl<T>
{
  /**
   * The question or the term above the cards, rendered as the `<legend>`.
   *
   * @default ''
   */
  readonly legend = input('');

  /**
   * Addition after the legend, in a `<small>`, for example "Spielerzahlen sind
   * Richtwerte". Empty renders nothing.
   *
   * @default ''
   */
  readonly hint = input('');

  /**
   * The options in display order, at most six. Tracked by `value`, so those
   * have to be unique.
   *
   * @default []
   */
  readonly options = input<readonly ZOption<T>[]>([]);

  /**
   * The chosen option's `value`, two-way bindable. A value that matches no
   * option leaves every card unchecked, and so does the unset state: a radio
   * group has no neutral member of `T`, so an unbound group starts out
   * `undefined` and every card is unchecked.
   *
   * @default undefined
   */
  // The cast is the one place where the missing empty member of T is named.
  // It matches what the DOM does: no radio is checked.
  readonly value = model<T>(undefined as unknown as T);

  /**
   * Narrow cards with the title in the mono face, for short values such as
   * "4 GB" or "90 Tage". Adds `z-options--compact`. Boolean attribute.
   *
   * @default false
   */
  readonly compact = input(false, { transform: booleanAttribute });

  /**
   * Locks every card of the group. Independent of the disabled state that forms
   * set; either one is enough. A single card is locked through `disabled` on
   * its option. Boolean attribute.
   *
   * @default false
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Unique `name` of the radios, which is what makes them one group. */
  protected readonly gruppenname = `z-options-${++zaehler}`;

  /** Lock coming from forms, independent of the `disabled` input. Either one suffices. */
  private readonly formsGesperrt = signal(false);
  protected readonly gesperrt = computed(() => this.disabled() || this.formsGesperrt());

  private readonly radios = viewChildren<ElementRef<HTMLInputElement>>('radio');
  /** Bumped on every native change, so the mirror below runs again. */
  private readonly spiegelzaehler = signal(0);

  private melde?: (wert: T) => void;
  private aufBeruehrt?: () => void;

  constructor() {
    // The browser checks a radio before anyone is asked. If the caller refuses
    // the new value, `value()` never changes and the binding has nothing to
    // redo, so the DOM would keep a selection the model does not have. This
    // effect writes the model back into every radio after each change, the way
    // checkbox, toggle and slider mirror their own state (docs/signals.md).
    effect(() => {
      this.spiegelzaehler();
      const wert = this.value();
      this.options();
      for (const radio of this.radios()) {
        radio.nativeElement.checked = radio.nativeElement.value === String(wert);
      }
    });
  }

  /** The reason wins over the description, the way the reference card shows it. */
  protected satz(option: ZOption<T>): string {
    return (option.disabled && option.disabledReason) || option.description || '';
  }

  protected waehle(wert: T): void {
    this.spiegelzaehler.update((zahl) => zahl + 1);
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
   * `undefined` leave every card unchecked.
   */
  writeValue(wert: T): void {
    this.value.set(wert ?? (undefined as unknown as T));
    this.spiegelzaehler.update((zahl) => zahl + 1);
  }

  /**
   * `ControlValueAccessor`: registers the callback that reports a new value to
   * the form. It fires on a real change of the radio, not on writes through
   * {@link value}.
   */
  registerOnChange(fn: (wert: T) => void): void {
    this.melde = fn;
  }

  /** `ControlValueAccessor`: registers the callback fired when a card loses focus. */
  registerOnTouched(fn: () => void): void {
    this.aufBeruehrt = fn;
  }

  /** `ControlValueAccessor`: locks or unlocks every card of the group. */
  setDisabledState(gesperrt: boolean): void {
    this.formsGesperrt.set(gesperrt);
  }
}
