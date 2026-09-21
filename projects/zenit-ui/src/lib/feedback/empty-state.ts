import { ChangeDetectionStrategy, Component, Directive, input } from '@angular/core';

/**
 * Marks the single action of an empty state: one secondary button for the first
 * entry. It stays secondary even when the page header already shows a primary
 * button for the same action. Adds no markup and no classes of its own.
 *
 * @example
 * ```html
 * <z-empty-state title="Keine offenen Tickets">
 *   Wir antworten in der Regel innerhalb von 24 Stunden.
 *   <button zEmptyAction zBtn="secondary">Ticket erstellen</button>
 * </z-empty-state>
 * ```
 */
@Directive({ selector: '[zEmptyAction]' })
export class ZEmptyAction {}

/**
 * Fills a list that has no entries: a title naming the state, one sentence that
 * helps on, one action. No large grey icon, the text carries the state. An
 * empty list shows no pagination and no filters; data that is missing because
 * of an error is an alert, not an empty state.
 *
 * Renders a host with the class `z-empty`, an optional `span.z-empty__title`, a
 * `span.z-empty__body` around the projected text, and the projected
 * `[zEmptyAction]` element. The native `title` attribute is suppressed so the
 * browser does not show its own tooltip for the title input.
 *
 * @example
 * ```html
 * <z-panel title="Tickets" flush>
 *   <z-empty-state title="Keine offenen Tickets">
 *     Wir antworten in der Regel innerhalb von 24 Stunden, auf Discord oft schneller.
 *     <button zEmptyAction zBtn="secondary">Ticket erstellen</button>
 *   </z-empty-state>
 * </z-panel>
 * ```
 */
@Component({
  selector: 'z-empty-state',
  template: `
    @if (title()) {
      <span class="z-empty__title">{{ title() }}</span>
    }
    <span class="z-empty__body"><ng-content /></span>
    <ng-content select="[zEmptyAction]" />
  `,
  host: {
    'class': 'z-empty',
    /* Without this the title would also sit on the element as a native title
       attribute and the browser would show its own tooltip (measured). */
    '[attr.title]': `null`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZEmptyState {
  /**
   * Title that names the state, for example `Keine offenen Tickets`. Empty
   * means no title line.
   *
   * @default ''
   */
  readonly title = input('');
}
