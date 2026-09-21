import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Material Icon als Ligatur. Dekorativ, deshalb immer aria-hidden. */
@Component({
  selector: 'z-icon',
  template: `{{ name() }}`,
  host: {
    'class': 'material-icons z-icon',
    '[class.z-icon--sm]': `size() === 'sm'`,
    'aria-hidden': 'true',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZIcon {
  readonly name = input.required<string>();
  readonly size = input<'sm' | 'md'>('md');
}
