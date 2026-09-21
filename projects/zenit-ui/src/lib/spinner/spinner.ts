import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Loading indicator. Renders an empty host with the class `z-spinner`; the ring
 * itself comes from the stylesheet.
 *
 * Accessibility depends on `label`: with a label the host becomes a status
 * message (`role="status"` plus that label as `aria-label`), without one it is
 * decorative and carries `aria-hidden="true"`. A button that is working shows
 * its own spinner through `loading` on `zBtn`; lists use `z-skeleton` instead.
 * The one list that does not is the panel of `z-combobox`: a `role="listbox"`
 * takes options, and a skeleton row has no accessible name, so the waiting row
 * there carries a decorative spinner beside its word.
 *
 * @example
 * ```html
 * <z-panel title="Auslastung" busy>
 *   <z-spinner label="Wird geladen" />
 * </z-panel>
 * ```
 */
@Component({
  selector: 'z-spinner',
  template: ``,
  host: {
    class: 'z-spinner',
    '[attr.role]': `label() ? 'status' : null`,
    '[attr.aria-label]': `label() || null`,
    '[attr.aria-hidden]': `label() ? null : 'true'`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZSpinner {
  /**
   * Text announced while loading, for example `Wird geladen`. An empty string
   * keeps the spinner decorative and hidden from assistive technology.
   *
   * @default ''
   */
  readonly label = input('');
}
