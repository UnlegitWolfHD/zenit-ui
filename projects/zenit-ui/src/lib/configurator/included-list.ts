import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ZIcon } from '../icon';

/**
 * Lists what every plan includes without a surcharge. Three to five entries,
 * each one a concrete part of the product, directly under `z-price-summary`.
 *
 * Renders a `<ul class="z-included">` with a 16px check in `success` per line
 * and the text in `text-muted`. No panel, no heading.
 *
 * Accessibility: the check is decorative (`aria-hidden`), because the list
 * item already says that the entry is included.
 *
 * Only things a customer would otherwise expect to pay extra for. "Sofort
 * verfügbar" and "Jederzeit kündbar" belong in the note of the summary, and
 * the list appears exactly once per page.
 *
 * @example
 * ```html
 * <z-included-list
 *   [items]="[
 *     'DDoS-Schutz auf Layer 3/4',
 *     'Webpanel mit Konsole und Dateimanager',
 *     'Automatische Backups',
 *   ]"
 * />
 * ```
 */
@Component({
  selector: 'z-included-list',
  imports: [ZIcon],
  template: `<ul class="z-included">
    @for (punkt of items(); track $index) {
      <li><z-icon name="check" size="sm" />{{ punkt }}</li>
    }
  </ul>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZIncludedList {
  /**
   * The entries in display order, three to five of them. Tracked by index, so
   * reordering re-renders the lines. An empty array renders an empty `<ul>`.
   *
   * @default []
   */
  readonly items = input<readonly string[]>([]);
}
