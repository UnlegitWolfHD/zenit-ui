import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ZBadgeStatus = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

/** Status oder Tag in einem Wort. Nie anklickbar. */
@Component({
  selector: 'z-badge',
  template: `@if (dot()) {<span class="z-badge__dot"></span>}<ng-content />`,
  host: {
    'class': 'z-badge',
    '[class.z-badge--success]': `status() === 'success'`,
    '[class.z-badge--warning]': `status() === 'warning'`,
    '[class.z-badge--danger]': `status() === 'danger'`,
    '[class.z-badge--info]': `status() === 'info'`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZBadge {
  readonly status = input<ZBadgeStatus>('neutral');
  readonly dot = input(false, { transform: booleanAttribute });
}
