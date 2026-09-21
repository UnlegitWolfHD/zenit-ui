import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Kopf einer Seite im Kundenbereich: Titel links, Aktionen rechts. Der Inhalt
 * sind die Aktionen. Unter 640px bricht die Zeile um, die Aktionen stehen dann
 * unter dem Titel.
 */
@Component({
  selector: 'z-page-header',
  template: `
    <div>
      <h1 class="z-pagehead__title">{{ title() }}</h1>
      @if (sub()) {
        <p class="z-pagehead__sub">{{ sub() }}</p>
      }
    </div>
    <div class="z-pagehead__actions"><ng-content /></div>
  `,
  host: {
    'class': 'z-pagehead',
    '[attr.title]': `null`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZPageHeader {
  readonly title = input('');
  readonly sub = input('');
}
