import { booleanAttribute, Directive, input } from '@angular/core';

/**
 * Natives `<input>` oder `<textarea>` im Zenit-Stil. Der Fehlerzustand steht
 * als `aria-invalid="true"`, darauf greift der Rahmen in danger.
 */
@Directive({
  selector: 'input[zInput], textarea[zInput]',
  host: {
    'class': 'z-input',
    '[class.z-input--sm]': `size() === 'sm'`,
    '[class.z-input--mono]': `mono()`,
    '[attr.aria-invalid]': `invalid() ? "true" : null`,
  },
})
export class ZInput {
  readonly size = input<'sm' | 'md'>('md');
  readonly mono = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
}
