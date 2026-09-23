import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  HostAttributeToken,
  inject,
  input,
  linkedSignal,
  output,
} from '@angular/core';

/**
 * Content of a game tile, shared by {@link ZGameTile} and {@link ZGameTileLink}:
 * the cover area with image or text fallback, then title and price.
 */
const KACHEL = `<span class="z-game__cover" aria-hidden="true">
    @if (cover() && !coverFailed()) {
      <img [src]="cover()" alt="" (error)="coverFehlt()" />
    } @else {
      {{ title() }}
    }
  </span>
  <span class="z-game__title">{{ title() }}</span>
  <span class="z-game__price">{{ price() }}</span>`;

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
 * attribute `zGameTile`. A tile that leads to a page instead of changing a
 * selection is {@link ZGameTileLink}, `a[zGameTile]`.
 *
 * Renders the class `z-game` on the host and inside it `span.z-game__cover`,
 * a 3:4 area that shows the cover image whole, then `span.z-game__title` and
 * `span.z-game__price`. Title and price stand below the cover, never on it.
 * The image is fitted, not cropped: a 3:4 cover fills the area, a landscape
 * one such as a store header sits centred on `surface-raised` with nothing cut
 * off, and every tile keeps the same cell in the grid.
 * Without a {@link cover} the title stands as text on the cover area instead
 * of an image, and a cover whose URL fails to load drops into that same text
 * fallback and reports {@link coverError}. Selected means a 2px line in
 * `accent-text`, no glow and no scaling.
 *
 * Accessibility: the tile is a toggle button and always carries
 * `aria-pressed`, `"true"` when selected and `"false"` otherwise, so the state
 * is announced either way. The whole cover area is `aria-hidden`, because it
 * shows either an image of what the title below it already says or that title
 * as text; without it a tile with no cover, and one whose cover failed, would
 * put the title into the accessible name twice. The image keeps its empty
 * `alt` for the same reason. So the name of every tile is title plus price,
 * whatever the cover does. The native `title` attribute is suppressed on the
 * host, so the browser does not show its own tooltip because of the
 * {@link title} input. The host gets `type="button"`, so a tile inside a form
 * does not submit it; a static `type` written by the caller stays.
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
  template: KACHEL,
  host: {
    class: 'z-game',
    '[attr.type]': `typ`,
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
   * `src` of the cover image, any aspect ratio. It is shown whole in the 3:4
   * cover area: 3:4 fills it, a landscape image sits centred without being
   * cropped. Empty shows the title as text on the cover area instead, and so
   * does a URL that fails to load.
   *
   * @default ''
   */
  readonly cover = input('');

  /**
   * Fires once when the {@link cover} fails to load, so an application can log
   * the dead URL. The tile handles the failure itself and needs no answer: it
   * shows the text fallback of a missing cover from then on.
   */
  readonly coverError = output<void>();

  /**
   * Marks the tile as the chosen game: `aria-pressed="true"` plus the 2px line
   * in `accent-text`. On load the cheapest game is preselected, so the summary
   * is never empty. Boolean attribute.
   *
   * @default false
   */
  readonly selected = input(false, { transform: booleanAttribute });

  /**
   * The tile picks a game, it never submits: without a `type` a `<button>`
   * inside a form is a submit button. A static `type` from the caller is read
   * here and written back, because the host binding would otherwise delete it.
   */
  protected readonly typ = inject(new HostAttributeToken('type'), { optional: true }) ?? 'button';

  /**
   * True once the browser reported `error` for the current cover. A new
   * {@link cover} is a new URL, so the flag falls back to `false` with it
   * instead of hiding an image that may well load.
   */
  protected readonly coverFailed = linkedSignal<string, boolean>({
    source: this.cover,
    computation: () => false,
  });

  /** `(error)` of the `<img>`: text fallback from now on, and one report. */
  protected coverFehlt(): void {
    this.coverFailed.set(true);
    this.coverError.emit();
  }
}

/**
 * Game tile as a link, for a grid whose tiles lead somewhere, for example to
 * the order of that game. Sits on an `<a>` through the attribute `zGameTile`
 * and looks exactly like {@link ZGameTile}: same class `z-game`, same cover
 * area with the same text fallback for a missing or failing cover, same title
 * and price, same hover and focus ring.
 *
 * It has no selected state and no `aria-pressed`: a link navigates, it does
 * not toggle. The target is the caller's: `href` or `routerLink` on the same
 * `<a>`, which the component leaves alone, so the tile is a real, crawlable
 * link. The accessible name is title plus price, "Minecraft ab 1,98 € /
 * Monat", because the cover area is `aria-hidden`, as on the button. The
 * native `title` attribute is suppressed on the host, so the {@link title}
 * input never becomes a browser tooltip.
 *
 * @example
 * ```html
 * <z-game-grid>
 *   <a
 *     zGameTile
 *     title="Minecraft"
 *     price="ab 1,98 € / Monat"
 *     cover="/covers/minecraft.jpg"
 *     routerLink="/user/games/create"
 *     [queryParams]="{ game: 'minecraft' }"
 *   ></a>
 * </z-game-grid>
 * ```
 */
@Component({
  selector: 'a[zGameTile]',
  template: KACHEL,
  host: {
    class: 'z-game',
    '[attr.title]': `null`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZGameTileLink {
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
   * `src` of the cover image, any aspect ratio. It is shown whole in the 3:4
   * cover area: 3:4 fills it, a landscape image sits centred without being
   * cropped. Empty shows the title as text on the cover area instead, and so
   * does a URL that fails to load.
   *
   * @default ''
   */
  readonly cover = input('');

  /**
   * Fires once when the {@link cover} fails to load, so an application can log
   * the dead URL. The tile already shows the text fallback by then.
   */
  readonly coverError = output<void>();

  /** True once the browser reported `error` for the current cover. */
  protected readonly coverFailed = linkedSignal<string, boolean>({
    source: this.cover,
    computation: () => false,
  });

  /** `(error)` of the `<img>`: text fallback from now on, and one report. */
  protected coverFehlt(): void {
    this.coverFailed.set(true);
    this.coverError.emit();
  }
}
