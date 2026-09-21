import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Placeholder that holds the space while a list or metric loads. Renders an
 * empty host with the class `z-skel`, plus `z-skel--thumb` for the square
 * variant and an inline `width`.
 *
 * Accessibility: purely decorative, hence the fixed `aria-hidden="true"`. The
 * surrounding container carries `aria-busy="true"` and an `aria-label`. Show as
 * many placeholder rows as are normally expected (two or three) in the same
 * grid as the real rows, so nothing jumps when the data arrives. Show it only
 * after 300ms; a button that is working uses a spinner instead.
 *
 * @example
 * ```html
 * <z-panel title="Meine Server" busy aria-label="Server werden geladen">
 *   <z-skeleton thumb />
 *   <z-skeleton width="40%" />
 *   <z-skeleton width="64px" />
 * </z-panel>
 * ```
 */
@Component({
  selector: 'z-skeleton',
  template: ``,
  host: {
    'class': 'z-skel',
    '[class.z-skel--thumb]': `thumb()`,
    '[style.width]': `width() || null`,
    'aria-hidden': 'true',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZSkeleton {
  /**
   * CSS length for the placeholder, for example `40%` or `64px`. Empty means
   * full width.
   *
   * @default ''
   */
  readonly width = input('');

  /**
   * Renders a square instead of a line, for the image area of a row. Boolean
   * attribute.
   *
   * @default false
   */
  readonly thumb = input(false, { transform: booleanAttribute });
}
