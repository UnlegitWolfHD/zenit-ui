import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  contentChild,
  Directive,
  input,
} from '@angular/core';

/**
 * Marks the element that is projected into the panel header, to the right of
 * the title: a link or one action. Adds no markup and no classes of its own.
 *
 * @example
 * ```html
 * <z-panel title="Zahlungsmittel">
 *   <span zPanelActions>
 *     <button zBtn="secondary" size="sm"><z-icon name="add" size="sm" />Hinzufügen</button>
 *   </span>
 * </z-panel>
 * ```
 */
@Directive({ selector: '[zPanelActions]' })
export class ZPanelActions {}

/**
 * The only container with a border. Groups data or a tool into one block:
 * server list, activities, payment methods, file manager, settings group. Not
 * for feature texts, facts or FAQ on public pages, and never a panel inside a
 * panel.
 *
 * Renders a host with the class `z-panel`. If there is a title or a
 * `[zPanelActions]` element, a `div.z-panel__header` with `.z-panel__title` in
 * the tag {@link headingLevel} names (`h3` by default)
 * comes first, then `div.z-panel__body` (plus `z-panel__body--flush` for lists
 * and tables) with the projected content, and finally a projected
 * `z-pagination` after the body.
 *
 * Accessibility: `busy` sets `aria-busy="true"` on the host while content is
 * loading; the panel then also carries its own `aria-label`. The native `title`
 * attribute is suppressed so the browser does not show its own tooltip for the
 * title input.
 *
 * @example
 * ```html
 * <z-panel title="Meine Server" flush>
 *   <a zPanelActions href="/user/server">Alle anzeigen</a>
 *   <ul class="demo-list">…</ul>
 * </z-panel>
 * ```
 */
@Component({
  selector: 'z-panel',
  template: `
    @if (title() || aktionen()) {
      <div class="z-panel__header">
        @if (title()) {
          @switch (headingLevel()) {
            @case (2) {
              <h2 class="z-panel__title" [class.z-mono]="titleMono()">{{ title() }}</h2>
            }
            @case (4) {
              <h4 class="z-panel__title" [class.z-mono]="titleMono()">{{ title() }}</h4>
            }
            @default {
              <h3 class="z-panel__title" [class.z-mono]="titleMono()">{{ title() }}</h3>
            }
          }
        }
        <ng-content select="[zPanelActions]" />
      </div>
    }
    <div class="z-panel__body" [class.z-panel__body--flush]="flush()">
      <ng-content />
    </div>
    <ng-content select="z-pagination" />
  `,
  host: {
    class: 'z-panel',
    '[attr.title]': `null`,
    '[attr.aria-busy]': `busy() ? "true" : null`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZPanel {
  /**
   * Panel title in normal capitalization, without an icon. Empty means no
   * header, unless a `[zPanelActions]` element is projected.
   *
   * @default ''
   */
  readonly title = input('');

  /**
   * Tag of the title: `2`, `3` or `4`. The reference markup has `h3`, which
   * fits a panel below a section heading. Raise it to `2` where the panel sits
   * directly under the page `<h1>` and is a section of its own, as the panels
   * of a customer-area page are. The visual size never changes with it.
   *
   * @default 3
   */
  readonly headingLevel = input<2 | 3 | 4, 2 | 3 | 4 | '2' | '3' | '4'>(3, {
    transform: (wert) => Number(wert) as 2 | 3 | 4,
  });

  /**
   * Sets the title in the mono face, for a title that is a technical value as
   * a whole, such as an endpoint (`GET /api/v1/gameservers`), a file name or a
   * configuration key. Adds `z-mono` to the heading; tag and size stay the
   * same. Boolean attribute.
   *
   * @default false
   */
  readonly titleMono = input(false, { transform: booleanAttribute });

  /**
   * Removes the padding of the body so lists and tables can reach the border.
   * Boolean attribute.
   *
   * @default false
   */
  readonly flush = input(false, { transform: booleanAttribute });

  /**
   * Marks the panel as loading and sets `aria-busy="true"`. Boolean attribute.
   *
   * @default false
   */
  readonly busy = input(false, { transform: booleanAttribute });

  protected readonly aktionen = contentChild(ZPanelActions);
}
