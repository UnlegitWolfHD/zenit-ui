import {
  ChangeDetectionStrategy,
  Component,
  HostAttributeToken,
  inject,
  input,
} from '@angular/core';
import { leiheAttribut } from '../a11y/host-attribute';

/**
 * Loading indicator. Renders an empty host with the class `z-spinner`; the ring
 * itself comes from the stylesheet.
 *
 * Accessibility depends on `label`: with a label the host becomes a status
 * message (`role="status"` plus that label as `aria-label`), without one it is
 * decorative and carries `aria-hidden="true"`. A caller that writes its own
 * `role` or `aria-label` on `<z-spinner>` keeps them: the input wins while it
 * holds a value, the caller's attributes stand while it does not, and a
 * spinner the caller named itself is not hidden either. A button that is working shows
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
    '[attr.aria-hidden]': `label() || eigenerName ? null : 'true'`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZSpinner {
  /**
   * Text announced while loading, for example `Wird geladen`. An empty string
   * keeps the spinner decorative and hidden from assistive technology, unless
   * the caller named the spinner itself.
   *
   * @default ''
   */
  readonly label = input('');

  /**
   * A `role` or an `aria-label` the caller wrote on the host. Then the spinner
   * is not decorative and must not be hidden, even without {@link label}.
   */
  protected readonly eigenerName =
    inject(new HostAttributeToken('role'), { optional: true }) ??
    inject(new HostAttributeToken('aria-label'), { optional: true });

  constructor() {
    // Both as borrowed attributes, not as host bindings: a host binding writes
    // `null` as soon as `label` is empty and thereby deletes the `role` and
    // the `aria-label` of the caller.
    leiheAttribut('role', () => (this.label() ? 'status' : null));
    leiheAttribut('aria-label', () => this.label() || null);
  }
}
