import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Grid of the game tiles: `auto-fill` from 128px width, so the number of
 * columns follows the available space.
 *
 * Renders the class `z-games` on the host and only the projected tiles. From
 * about 15 games a search field belongs above the grid; the component does not
 * bring one.
 *
 * @example
 * ```html
 * <z-game-grid>
 *   <button zGameTile title="Minecraft" price="ab 1,98 € / Monat" [selected]="true"></button>
 *   <button zGameTile title="Rust" price="ab 4,98 € / Monat"></button>
 * </z-game-grid>
 * ```
 */
@Component({
  selector: 'z-game-grid',
  template: `<ng-content />`,
  host: { class: 'z-games' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZGameGrid {}

/**
 * Selectable game tile in the price calculator on the start page, under
 * `/preise` and in the order assistant. Sits on a `<button>` through the
 * attribute `zGameTile`.
 *
 * Renders the class `z-game` on the host and inside it `span.z-game__cover`
 * with the 3:4 cover image, then `span.z-game__title` and
 * `span.z-game__price`. Title and price stand below the cover, never on it.
 * Without a {@link cover} the title stands as text on the cover area instead
 * of an image. Selected means a 2px line in `accent-text`, no glow and no
 * scaling.
 *
 * Accessibility: the tile is a toggle button and always carries
 * `aria-pressed`, `"true"` when selected and `"false"` otherwise, so the state
 * is announced either way. The cover image has an empty `alt`, because the
 * title stands right below it as text. The native `title` attribute is
 * suppressed on the host, so the browser does not show its own tooltip because
 * of the {@link title} input.
 *
 * @example
 * ```html
 * <button
 *   zGameTile
 *   title="Minecraft"
 *   price="ab 1,98 € / Monat"
 *   cover="/covers/minecraft.jpg"
 *   [selected]="spiel() === 'minecraft'"
 *   (click)="spiel.set('minecraft')"
 * ></button>
 * ```
 */
@Component({
  // The API table prescribes button[zGameTile]: a component with an attribute
  // selector, like Button.
  selector: 'button[zGameTile]',
  template: `<span class="z-game__cover">
      @if (cover()) {
        <img [src]="cover()" alt="" />
      } @else {
        {{ title() }}
      }
    </span>
    <span class="z-game__title">{{ title() }}</span>
    <span class="z-game__price">{{ price() }}</span>`,
  host: {
    class: 'z-game',
    '[attr.aria-pressed]': `selected() ? "true" : "false"`,
    '[attr.title]': `null`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZGameTile {
  /**
   * Name of the game. Stands below the cover and, without a {@link cover}, as
   * the text fallback on the cover area as well.
   *
   * @default ''
   */
  readonly title = input('');

  /**
   * Starting price including the period, for example "ab 1,98 € / Monat",
   * shown in the mono face below the title.
   *
   * @default ''
   */
  readonly price = input('');

  /**
   * `src` of the cover image in 3:4 format. Empty shows the title as text on
   * the cover area instead.
   *
   * @default ''
   */
  readonly cover = input('');

  /**
   * Marks the tile as the chosen game: `aria-pressed="true"` plus the 2px line
   * in `accent-text`. On load the cheapest game is preselected, so the summary
   * is never empty. Boolean attribute.
   *
   * @default false
   */
  readonly selected = input(false, { transform: booleanAttribute });
}
