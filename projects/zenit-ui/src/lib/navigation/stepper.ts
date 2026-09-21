import { ChangeDetectionStrategy, Component, input, numberAttribute } from '@angular/core';

/**
 * Schrittanzeige eines mehrstufigen Ablaufs. `current` ist der Index des
 * aktuellen Schritts (der erste Schritt ist 0). Alle Schritte davor gelten
 * als erledigt, die Reihenfolge steht als `<ol>` in der Struktur.
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
  readonly steps = input<string[]>([]);
  readonly current = input(0, { transform: numberAttribute });
}
