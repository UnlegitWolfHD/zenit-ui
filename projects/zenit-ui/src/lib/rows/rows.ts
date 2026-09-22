import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  Directive,
  input,
  linkedSignal,
} from '@angular/core';

/**
 * Row pattern for everything the customer owns: servers, domains, tickets,
 * payment methods, files.
 *
 * Renders only the projected content and puts the class `z-rows` on the host.
 * {@link columns} feeds the custom property `--z-cols`, which head and rows
 * share, so status, plan and cost line up in fixed columns.
 *
 * @example
 * ```html
 * <z-rows columns="minmax(0, 2fr) 128px 40px">
 *   <z-rows-head>
 *     <span>Server</span>
 *     <span>Status</span>
 *     <span></span>
 *   </z-rows-head>
 *   <a zRow routerLink="/server/1">
 *     <z-row-main title="Beispiel-Server 1" meta="Minecraft · 203.0.113.10" />
 *     <span><z-badge status="success" dot>Online</z-badge></span>
 *     <z-icon name="chevron_right" />
 *   </a>
 * </z-rows>
 * ```
 */
@Component({
  selector: 'z-rows',
  template: `<ng-content />`,
  host: {
    class: 'z-rows',
    '[style.--z-cols]': `columns() || null`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZRows {
  /**
   * Value for `grid-template-columns`, shared by head and rows through
   * `--z-cols`, for example `minmax(0, 2fr) 128px 40px`. Empty keeps the
   * default grid from the stylesheet.
   *
   * @default ''
   */
  readonly columns = input('');
}

/**
 * Column head of the list, carrying the class `z-rows__head`. Renders only the
 * projected content, one element per column. The head disappears below 640px,
 * so it must never hold the only copy of a fact.
 *
 * @example
 * ```html
 * <z-rows-head>
 *   <span>Server</span>
 *   <span>Status</span>
 *   <span style="text-align:right">Bisher</span>
 * </z-rows-head>
 * ```
 */
@Component({
  selector: 'z-rows-head',
  template: `<ng-content />`,
  host: { class: 'z-rows__head' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZRowsHead {}

/**
 * One row, carrying the class `z-row`. Renders nothing itself.
 *
 * As an `<a>` the whole row is the link to the detail page and brings its own
 * focus ring and keyboard handling. As a `<div>` the row is not clickable and
 * holds its own actions, each of which is a tab stop of its own.
 *
 * A row that needs both, a target and its own actions, is a `<div>` with an
 * {@link ZRowLink} on the title and {@link ZRowAction} on the buttons: a
 * `<button>` inside an `<a>` would be invalid markup.
 *
 * @example
 * ```html
 * <a zRow routerLink="/server/1">…</a>
 * <div zRow>…</div>
 * ```
 */
@Directive({
  selector: 'a[zRow], div[zRow]',
  host: { class: 'z-row' },
})
export class ZRow {}

/**
 * Pure slot marker for the title of a row, so `z-row-main` can hold a link or
 * any other markup instead of its {@link ZRowMain.title} text. It adds no class
 * and no markup. Without it the row falls back to the `title` input.
 *
 * @example
 * ```html
 * <z-row-main title="Beispiel-Server 1" meta="Minecraft · 203.0.113.10">
 *   <a zRowTitle zRowLink routerLink="/user/server/1">Beispiel-Server 1</a>
 * </z-row-main>
 * ```
 */
@Directive({ selector: '[zRowTitle]' })
export class ZRowTitle {}

/**
 * Slot for the meta line of a row when that line is more than plain text. It
 * carries the class `z-row__meta` and lands under the title, in place of the
 * {@link ZRowMain.meta} input, so that an address, a port or a file name inside
 * it can take `z-mono` while the rest of the line stays in the body face.
 *
 * Use a block element: the meta line clips with an ellipsis, which an inline
 * element cannot do. Without it the row falls back to the `meta` input.
 *
 * @example
 * ```html
 * <z-row-main title="Beispiel-Server 1">
 *   <div zRowMeta>Minecraft · PaperMC 26.3 · <span class="z-mono">203.0.113.10:25565</span></div>
 * </z-row-main>
 * ```
 */
@Directive({
  selector: '[zRowMeta]',
  host: { class: 'z-row__meta' },
})
export class ZRowMeta {}

/**
 * Link inside a `div[zRow]` that makes the whole row clickable: the link sits
 * on the title and carries the class `z-row__link`, whose stretched `::after`
 * covers the row. The row keeps its hover colour, and the focus ring of the
 * link is drawn around the whole row rather than around the title text.
 *
 * Everything the row holds stays under that overlay, so buttons and menus in
 * the row need {@link ZRowAction} to stay clickable and keep their own tab
 * stop. As with any stretched link, text in the row cannot be selected by
 * dragging, exactly as in an `a[zRow]`.
 *
 * @example
 * ```html
 * <div zRow>
 *   <z-row-main title="Beispiel-Server 1" meta="Minecraft · 203.0.113.10">
 *     <a zRowTitle zRowLink routerLink="/user/server/1">Beispiel-Server 1</a>
 *   </z-row-main>
 *   <span><z-badge status="success" dot>Online</z-badge></span>
 *   <button zRowAction zBtn="ghost" iconOnly aria-label="Aktionen für Beispiel-Server 1">
 *     <z-icon name="more_vert" />
 *   </button>
 * </div>
 * ```
 */
@Directive({
  selector: 'a[zRowLink]',
  host: { class: 'z-row__link' },
})
export class ZRowLink {}

/**
 * Action inside a row that holds an {@link ZRowLink}: adds the class
 * `z-row__action`, which lifts the element above the stretched link overlay so
 * it stays clickable and remains a tab stop of its own. It renders nothing
 * itself and needs its own `aria-label` when it shows only an icon.
 *
 * @example
 * ```html
 * <button zRowAction zBtn="ghost" iconOnly aria-label="Freigabe entfernen">
 *   <z-icon name="close" />
 * </button>
 * ```
 */
@Directive({
  selector: '[zRowAction]',
  host: { class: 'z-row__action' },
})
export class ZRowAction {}

/**
 * Pure slot marker for an own medium in the thumbnail of a row, an icon or an
 * image the caller renders itself. It lands in `.z-row__thumb` and replaces
 * both the {@link ZRowMain.image} and the initial. It adds no class and no
 * markup. Without it the row falls back to the `image` input. The thumbnail is
 * `aria-hidden`, so the content is decoration: what it shows has to stand as
 * text in the row as well, usually in {@link ZRowMeta}. Nothing focusable goes
 * into the slot, no link, button or input: it would stay a tab stop inside
 * `aria-hidden`.
 *
 * @example
 * ```html
 * <z-row-main title="beispiel.de" meta="Domain · läuft bis 18.09.2027">
 *   <z-icon zRowThumb name="language" />
 * </z-row-main>
 * ```
 */
@Directive({ selector: '[zRowThumb]' })
export class ZRowThumb {}

/**
 * First column of a row: thumbnail, title and one meta line.
 *
 * Renders `<span class="z-row__thumb">` with the image or, without one, the
 * uppercased first character of {@link thumbText} or else of the title, then
 * `.z-row__title` and the optional `.z-row__meta`. An image whose URL fails to
 * load drops into the same initial, so no broken-image icon is shown. A
 * {@link ZRowThumb} element replaces image and initial, and {@link thumb} set
 * to `false` leaves the thumbnail out. The host carries `z-row__main` and its native
 * `title` attribute is cleared, so the {@link title} input never becomes a
 * browser tooltip. The thumbnail is decoration: `.z-row__thumb` carries
 * `aria-hidden="true"` and the image an empty `alt`, so a link row is read as
 * title and meta only. Whatever the thumbnail shows, a game for example,
 * therefore also belongs into the meta line as text.
 *
 * A `[zRowTitle]` element takes the place of the title text, which is how a
 * link gets into the title of a row, and a {@link ZRowMeta} element takes the
 * place of the meta text, which is how an address reaches the mono face.
 * {@link title} still feeds the initial of the thumbnail unless
 * {@link thumbText} is set, so it stays set either way.
 *
 * @example
 * ```html
 * <z-row-main title="Beispiel-Server 1" meta="Minecraft · PaperMC 26.3 · 203.0.113.10" />
 * ```
 */
@Component({
  selector: 'z-row-main',
  template: `
    @if (thumb()) {
      <span class="z-row__thumb" aria-hidden="true">
        <ng-content select="[zRowThumb]" />
        @if (!eigenesMedium()) {
          @if (image() && !imageFailed()) {
            <img [src]="image()" alt="" (error)="imageFailed.set(true)" />
          } @else {
            {{ initiale() }}
          }
        }
      </span>
    }
    <div class="z-row__text">
      <div class="z-row__title">
        <ng-content select="[zRowTitle]">{{ title() }}</ng-content>
      </div>
      <ng-content select="[zRowMeta]" />
      @if (meta()) {
        <div class="z-row__meta">{{ meta() }}</div>
      }
    </div>
  `,
  host: {
    class: 'z-row__main',
    '[attr.title]': `null`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZRowMain {
  /**
   * Name of the entry. Without an image and without {@link thumbText} its
   * first character, uppercased, fills the thumbnail.
   *
   * @default ''
   */
  readonly title = input('');

  /**
   * One line under the title with the details of the entry, for example game,
   * version and address. Empty leaves the line out. A projected
   * {@link ZRowMeta} element replaces it, for a line that mixes faces.
   *
   * @default ''
   */
  readonly meta = input('');

  /**
   * URL of the thumbnail. Empty falls back to the initial, and so does a URL
   * that fails to load.
   *
   * @default ''
   */
  readonly image = input('');

  /**
   * Text whose first character, uppercased, fills the thumbnail when there is
   * no image or it fails to load, for example the game of a server whose
   * {@link title} is its own name. Empty takes the initial of the title.
   *
   * @default ''
   */
  readonly thumbText = input('');

  /**
   * Shows the thumbnail. `false` leaves `.z-row__thumb` out, so the row starts
   * with its title. Boolean attribute.
   *
   * @default true
   */
  readonly thumb = input(true, { transform: booleanAttribute });

  /**
   * True once the browser reported `error` for the current {@link image}. A new
   * URL is tried again, so the flag falls back to `false` with it.
   */
  protected readonly imageFailed = linkedSignal<string, boolean>({
    source: this.image,
    computation: () => false,
  });

  /**
   * The projected {@link ZRowThumb}, if one is rendered right now. A query and
   * not the fallback content of `<ng-content>`: a slot element inside an `@if`
   * occupies the slot even while the condition is false, which would leave an
   * empty thumbnail instead of image or initial.
   */
  protected readonly eigenesMedium = contentChild(ZRowThumb);

  protected readonly initiale = computed(() =>
    (this.thumbText().trim() || this.title().trim()).charAt(0).toUpperCase(),
  );
}

/**
 * Amount or number inside a row: right-aligned in the mono face. Adds the class
 * `z-row__num` and renders nothing itself.
 *
 * @example
 * ```html
 * <span zRowNum>0,90&nbsp;€</span>
 * ```
 */
@Directive({
  selector: '[zRowNum]',
  host: { class: 'z-row__num' },
})
export class ZRowNum {}
