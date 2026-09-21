import { ChangeDetectionStrategy, Component, input, numberAttribute } from '@angular/core';

/**
 * Step indicator for a multi-step flow. Belongs in the order assistant, where
 * the steps really do follow one another.
 *
 * Renders an `<ol class="z-steps">` with one `<li class="z-step">` per entry of
 * `steps`, each opened by its position in `.z-step__num`. Steps before `current`
 * get `z-step--done`, the current one carries `aria-current="step"`. The ordered
 * list conveys the sequence to assistive technology; the component is static
 * text and adds no focus or keyboard handling of its own.
 *
 * @example
 * ```html
 * <z-stepper [steps]="['Spiel', 'Leistung', 'Bezahlen']" [current]="1" />
 * ```
 */
@Component({
  selector: 'z-stepper',
  template: `
    <ol class="z-steps">
      @for (schritt of steps(); track $index) {
        <li
          class="z-step"
          [class.z-step--done]="$index < current()"
          [attr.aria-current]="$index === current() ? 'step' : null"
        >
          <span class="z-step__num">{{ $index + 1 }}</span>{{ schritt }}
        </li>
      }
    </ol>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZStepper {
  /**
   * Labels of the steps in order, one short noun each. The spec asks for two to
   * four steps. An empty array renders an empty list.
   *
   * @default []
   */
  readonly steps = input<string[]>([]);

  /**
   * Zero-based index of the current step; every step with a lower index counts
   * as done. An index past the last step marks all steps done and none current.
   *
   * @default 0
   */
  readonly current = input(0, { transform: numberAttribute });
}
