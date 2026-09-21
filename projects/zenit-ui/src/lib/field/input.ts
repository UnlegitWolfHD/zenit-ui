import { booleanAttribute, Directive, inject, input } from '@angular/core';
import { ZField } from './field';

/**
 * Natives `<input>` oder `<textarea>` im Zenit-Stil. Der Fehlerzustand steht
 * als `aria-invalid="true"`, darauf greift der Rahmen in danger. Steht das
 * Feld in einem `z-field`, zeigt `aria-describedby` auf dessen Hinweis oder
 * Fehler.
 */
@Directive({
  selector: 'input[zInput], textarea[zInput]',
  host: {
    'class': 'z-input',
    '[class.z-input--sm]': `size() === 'sm'`,
    '[class.z-input--mono]': `mono()`,
    '[attr.aria-invalid]': `invalid() ? "true" : null`,
    '[attr.aria-describedby]': `feld?.beschreibung() ?? null`,
    // size ist der Name aus der API-Tabelle, als natives Attribut am <input>
    // waere "sm" aber ungueltiges HTML.
    '[attr.size]': `null`,
  },
})
export class ZInput {
  readonly size = input<'sm' | 'md'>('md');
  readonly mono = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });

  protected readonly feld = inject(ZField, { optional: true });
}
