import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Head of a page in the customer area: title on the left, actions on the right.
 * The projected content is the actions, at most two buttons.
 *
 * Renders the title as the page `<h1 class="z-pagehead__title">`, the optional
 * second line as `<p class="z-pagehead__sub">` and the projected content in
 * `<div class="z-pagehead__actions">`. The host carries `z-pagehead` and its
 * native `title` attribute is cleared, so the {@link title} input never turns
 * into a browser tooltip over the whole header.
 *
 * Below 640px the row wraps and the actions move under the title.
 *
 * @example
 * ```html
 * <z-page-header title="Gameserver" sub="3 Server, 2 online">
 *   <button zBtn="secondary" type="button">Bestellungen</button>
 *   <button zBtn="primary" type="button">Server erstellen</button>
 * </z-page-header>
 * ```
 */
@Component({
  selector: 'z-page-header',
  template: `
    <div>
      <h1 class="z-pagehead__title">{{ title() }}</h1>
      @if (sub()) {
        <p class="z-pagehead__sub">{{ sub() }}</p>
      }
    </div>
    <div class="z-pagehead__actions"><ng-content /></div>
  `,
  host: {
    class: 'z-pagehead',
    '[attr.title]': `null`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZPageHeader {
  /**
   * Page title, rendered as the `<h1>`. Use the same wording as the navigation
   * link that leads here.
   *
   * @default ''
   */
  readonly title = input('');

  /**
   * One line with the most important fact of the page, for example
   * "3 Server, 2 online". Empty leaves the line out.
   *
   * @default ''
   */
  readonly sub = input('');
}
