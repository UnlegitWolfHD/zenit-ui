import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Huelle um ein Bedienelement: Label darueber, darunter Hinweis oder Fehler.
 * `for` verbindet das Label mit der id des Feldes und ist zugleich die Wurzel
 * der ids fuer Hinweis und Fehler. Ohne `for` gibt es keine ids und kein
 * `aria-describedby`.
 */
@Component({
  selector: 'z-field',
  template: `
    @if (label()) {
      <label class="z-field__label" [attr.for]="fuer() || null">{{ label() }}</label>
    }
    <ng-content />
    @if (error()) {
      <span class="z-field__error" [attr.id]="fehlerId()">{{ error() }}</span>
    } @else if (hint()) {
      <span class="z-field__hint" [attr.id]="hinweisId()">{{ hint() }}</span>
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

  protected readonly hinweisId = computed(() => (this.for() ? `${this.for()}-hint` : null));
  protected readonly fehlerId = computed(() => (this.for() ? `${this.for()}-error` : null));

  /**
   * id des gerade sichtbaren Begleittextes. Das projizierte Bedienelement
   * haengt sich per `aria-describedby` daran.
   */
  readonly beschreibung = computed(() => {
    if (this.error()) {
      return this.fehlerId();
    }
    return this.hint() ? this.hinweisId() : null;
  });
}
