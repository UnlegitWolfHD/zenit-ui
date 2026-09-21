import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Ein Posten der Zusammenfassung. */
export interface ZPriceLine {
  label: string;
  value: string;
}

/**
 * Ergebnis des Preisrechners. Der projizierte Inhalt ist der Button, er steht
 * zwischen Posten und Hinweis.
 */
@Component({
  selector: 'z-price-summary',
  template: `
    <aside class="z-summary" [attr.aria-label]="label() || null">
      <div>
        @if (label()) {
          <div class="z-summary__label">{{ label() }}</div>
        }
        <div class="z-summary__price">{{ price() }} <small>{{ period() }}</small></div>
      </div>
      <dl class="z-summary__lines">
        @for (zeile of lines(); track $index) {
          <div class="z-summary__line">
            <dt>{{ zeile.label }}</dt>
            <dd>{{ zeile.value }}</dd>
          </div>
        }
      </dl>
      <ng-content />
      @if (note()) {
        <span class="z-summary__note">{{ note() }}</span>
      }
    </aside>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZPriceSummary {
  readonly label = input('');
  readonly price = input('');
  readonly period = input('');
  readonly lines = input<ZPriceLine[]>([]);
  readonly note = input('');
}
