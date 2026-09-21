import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Ladeanzeige. Ohne label rein dekorativ, mit label eine Statusmeldung. */
@Component({
  selector: 'z-spinner',
  template: ``,
  host: {
    'class': 'z-spinner',
    '[attr.role]': `label() ? 'status' : null`,
    '[attr.aria-label]': `label() || null`,
    '[attr.aria-hidden]': `label() ? null : 'true'`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZSpinner {
  readonly label = input('');
}
