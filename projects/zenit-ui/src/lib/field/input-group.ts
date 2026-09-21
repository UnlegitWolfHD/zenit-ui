import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ZIcon } from '../icon';

/**
 * Field with a leading icon, for example a search box. Renders a
 * `div.z-input-wrap` (host) with a `z-icon` in front of the projected
 * `input zInput`.
 *
 * Accessibility: the icon is decorative and `aria-hidden`, so the field still
 * needs its own label, usually from the surrounding `z-field`.
 *
 * @example
 * ```html
 * <z-field label="Suche" for="in-search">
 *   <z-input-group icon="search">
 *     <input zInput id="in-search" placeholder="Name, Spiel oder Adresse" />
 *   </z-input-group>
 * </z-field>
 * ```
 */
@Component({
  selector: 'z-input-group',
  imports: [ZIcon],
  template: `<z-icon [name]="icon()" /><ng-content />`,
  host: { class: 'z-input-wrap' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZInputGroup {
  /**
   * Name of the Material Icons ligature in front of the field, for example
   * `search`. Required.
   */
  readonly icon = input.required<string>();
}
