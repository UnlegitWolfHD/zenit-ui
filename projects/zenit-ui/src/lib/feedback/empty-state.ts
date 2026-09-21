import { ChangeDetectionStrategy, Component, Directive, input } from '@angular/core';

/** Die Aktion eines EmptyState: ein Button, secondary. */
@Directive({ selector: '[zEmptyAction]' })
export class ZEmptyAction {}

/**
 * Fuellt eine Liste ohne Eintraege: Titel, ein Satz, eine Aktion. Kein Icon,
 * der Text traegt den Zustand.
 */
@Component({
  selector: 'z-empty-state',
  template: `
    @if (title()) {
      <span class="z-empty__title">{{ title() }}</span>
    }
    <span class="z-empty__body"><ng-content /></span>
    <ng-content select="[zEmptyAction]" />
  `,
  host: {
    'class': 'z-empty',
    /* Ohne das steht der Titel zusaetzlich als natives title-Attribut am
       Element und der Browser zeigt seinen eigenen Tooltip (gemessen). */
    '[attr.title]': `null`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZEmptyState {
  readonly title = input('');
}
