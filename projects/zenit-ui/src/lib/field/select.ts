import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Huelle um ein natives `<select>`. Nativ wegen Tastatur und Systemrad. */
@Component({
  selector: 'z-select',
  template: `<ng-content />`,
  host: {
    'class': 'z-select',
    '[class.z-select--sm]': `size() === 'sm'`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZSelect {
  readonly size = input<'sm' | 'md'>('md');
}
