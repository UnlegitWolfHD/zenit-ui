import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ZIcon } from '../icon';

/** Feld mit vorangestelltem Icon, zum Beispiel die Suche. */
@Component({
  selector: 'z-input-group',
  imports: [ZIcon],
  template: `<z-icon [name]="icon()" /><ng-content />`,
  host: { 'class': 'z-input-wrap' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZInputGroup {
  readonly icon = input.required<string>();
}
