import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
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

  constructor() {
    const wirt = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    // Both as borrowed attributes, not as host bindings: a host binding writes
    // `null` as soon as `label` is empty and thereby deletes the `role` and
    // the `aria-label` of the caller.
    leiheAttribut('role', () => (this.label() ? 'status' : null));
    leiheAttribut('aria-label', () => this.label() || null);

    /**
     * Only a spinner that nobody names is decorative. The question is asked of
     * the element, not of the static attributes at construction: a caller that
     * binds `[attr.aria-label]` has written nothing yet at that point, and its
     * name would be hidden behind `aria-hidden="true"` for good.
     */
    const messen = (): void => {
      if (this.label() || wirt.hasAttribute('role') || wirt.hasAttribute('aria-label')) {
        wirt.removeAttribute('aria-hidden');
      } else {
        wirt.setAttribute('aria-hidden', 'true');
      }
    };
    // Third effect on purpose: effects of one injection context run in the
    // order they were created, so both borrows above have given their
    // attributes back by the time this one reads the element.
    effect(messen);
    if (typeof MutationObserver === 'undefined') {
      return;
    }
    // The caller may name the spinner at any time, and take the name back.
    const beobachter = new MutationObserver(messen);
    beobachter.observe(wirt, { attributes: true, attributeFilter: ['role', 'aria-label'] });
    inject(DestroyRef).onDestroy(() => beobachter.disconnect());
  }
}
