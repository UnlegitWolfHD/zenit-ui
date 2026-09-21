import { ChangeDetectionStrategy, Component, Directive } from '@angular/core';

/**
 * Marks the column next to the form: the `z-price-summary` and, below it, the
 * `z-included-list`. From 900px on it sticks under the header
 * (`top: header + space-5`), below that it moves under the form.
 *
 * @example
 * ```html
 * <div zConfigAside>
 *   <z-price-summary price="7,74&nbsp;€">…</z-price-summary>
 * </div>
 * ```
 */
@Directive({ selector: '[zConfigAside]', host: { class: 'z-config__aside' } })
export class ZConfigAside {}

/**
 * Layout of a configurator: the form on the left, the summary on the right.
 *
 * Renders the class `z-config` on the host, a grid of one column that becomes
 * `1fr 340px` from 900px on. Below 900px the summary stands under the form,
 * and a `z-sticky-bar` keeps price and next step in view.
 *
 * @example
 * ```html
 * <z-config>
 *   <z-wizard>…</z-wizard>
 *   <div zConfigAside>
 *     <z-price-summary price="7,74&nbsp;€">…</z-price-summary>
 *   </div>
 * </z-config>
 * ```
 */
@Component({
  selector: 'z-config',
  template: `<ng-content />`,
  host: { class: 'z-config' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZConfig {}
