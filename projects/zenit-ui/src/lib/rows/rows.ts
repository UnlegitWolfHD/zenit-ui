import { ChangeDetectionStrategy, Component, computed, Directive, input } from '@angular/core';

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
    'class': 'z-rows',
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
  host: { 'class': 'z-rows__head' },
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
 * @example
 * ```html
 * <a zRow routerLink="/server/1">…</a>
 * <div zRow>…</div>
 * ```
 */
@Directive({
  selector: 'a[zRow], div[zRow]',
  host: { 'class': 'z-row' },
})
export class ZRow {}

/**
 * First column of a row: thumbnail, title and one meta line.
 *
 * Renders `<span class="z-row__thumb">` with the image or, without one, the
 * uppercased first character of the title, then `.z-row__title` and the
 * optional `.z-row__meta`. The host carries `z-row__main` and its native
 * `title` attribute is cleared, so the {@link title} input never becomes a
 * browser tooltip. The image is decorative and gets an empty `alt`, the
 * accessible text of the row comes from title and meta.
 *
 * @example
 * ```html
 * <z-row-main title="Beispiel-Server 1" meta="Minecraft · PaperMC 26.3 · 203.0.113.10" />
 * ```
 */
@Component({
  selector: 'z-row-main',
  template: `
    <span class="z-row__thumb">
      @if (image()) {
        <img [src]="image()" alt="" />
      } @else {
        {{ initiale() }}
      }
    </span>
    <div class="z-row__text">
      <div class="z-row__title">{{ title() }}</div>
      @if (meta()) {
        <div class="z-row__meta">{{ meta() }}</div>
      }
    </div>
  `,
  host: {
    'class': 'z-row__main',
    '[attr.title]': `null`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZRowMain {
  /**
   * Name of the entry. Without an image its first character, uppercased, fills
   * the thumbnail.
   *
   * @default ''
   */
  readonly title = input('');

  /**
   * One line under the title with the details of the entry, for example game,
   * version and address. Empty leaves the line out.
   *
   * @default ''
   */
  readonly meta = input('');

  /**
   * URL of the thumbnail. Empty falls back to the initial of the title.
   *
   * @default ''
   */
  readonly image = input('');

  protected readonly initiale = computed(() => this.title().trim().charAt(0).toUpperCase());
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
  host: { 'class': 'z-row__num' },
})
export class ZRowNum {}
