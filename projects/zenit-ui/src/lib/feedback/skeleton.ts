import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Placeholder that holds the space while a list or metric loads. Renders an
 * empty host with the class `z-skel`, plus `z-skel--thumb` for the square
 * variant and an inline `width`. With {@link tile} it renders `z-skel--tile`
 * and inside it `span.z-skel__cover` and two `span.z-skel__line`, the geometry
 * of a `button[zGameTile]`, so it takes exactly the cell of a tile in a
 * `z-game-grid`.
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
 * <z-game-grid role="group" aria-busy="true" aria-label="Spiele werden geladen">
 *   <z-skeleton tile />
 *   <z-skeleton tile />
 * </z-game-grid>
 * ```
 */
@Component({
  selector: 'z-skeleton',
  template: `@if (tile()) {
    <span class="z-skel__cover"></span>
    <span class="z-skel__line z-skel__line--title"></span>
    <span class="z-skel__line z-skel__line--price"></span>
  }`,
  host: {
    class: 'z-skel',
    '[class.z-skel--thumb]': `thumb()`,
    '[class.z-skel--tile]': `tile()`,
    '[style.width]': `tile() ? null : width() || null`,
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

  /**
   * Renders the placeholder of a `button[zGameTile]`: a 3:4 cover area, a
   * title line and a price line with the gaps of the tile, for a
   * `z-game-grid` that is still loading. The grid cell sets its width, so
   * {@link width} does not apply. Boolean attribute.
   *
   * @default false
   */
  readonly tile = input(false, { transform: booleanAttribute });
}
