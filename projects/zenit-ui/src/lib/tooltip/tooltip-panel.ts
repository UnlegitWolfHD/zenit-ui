import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

/**
 * Die Flaeche des Tooltips. Haengt im CDK-Overlay am Body, nicht im
 * Seitenfluss, und wird nur von der Direktive `zTooltip` erzeugt. Sie ist
 * deshalb nicht Teil der oeffentlichen API.
 */
@Component({
  selector: 'z-tooltip',
  template: `{{ text() }}`,
  host: {
    'class': 'z-tooltip',
    'role': 'tooltip',
    '[attr.id]': `id()`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZTooltipPanel {
  readonly text = signal('');
  readonly id = signal('');
}
