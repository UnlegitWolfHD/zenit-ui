import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Huelle um ein Bedienelement: Label darueber, darunter Hinweis oder Fehler.
 * `for` verbindet das Label mit der id des Feldes.
 */
@Component({
  selector: 'z-field',
  template: `
    @if (label()) {
      <label class="z-field__label" [attr.for]="fuer()">{{ label() }}</label>
    }
    <ng-content />
    @if (error()) {
      <span class="z-field__error">{{ error() }}</span>
    } @else if (hint()) {
      <span class="z-field__hint">{{ hint() }}</span>
    }
  `,
  host: { 'class': 'z-field' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZField {
  readonly label = input('');
  readonly for = input('');
  readonly hint = input('');
  readonly error = input('');

  /** `for` ist im Template ein Schluesselwort, deshalb dieser Zweitname. */
  protected readonly fuer = this.for;
}
