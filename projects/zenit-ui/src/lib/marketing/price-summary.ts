import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** One line item of the summary. */
export interface ZPriceLine {
  /** Name of the item, for example "Laufzeitrabatt". */
  label: string;
  /**
   * The amount, already formatted by the caller. Discounts carry a minus sign
   * and stay a line of their own, they never become a badge.
   */
  value: string;
}

/**
 * Result of the price calculator, carrying the only primary button of the
 * calculator.
 *
 * Renders an `<aside class="z-summary">` with the optional
 * `.z-summary__label`, the price in `.z-summary__price` with the period in a
 * `<small>`, the items as a `<dl class="z-summary__lines">` of `<dt>`/`<dd>`
 * pairs, then the projected content and last the optional `.z-summary__note`.
 * So the projected content is the button, and it sits between items and note.
 *
 * Accessibility: the `<aside>` is a complementary landmark named by
 * {@link label}; without a label it carries no `aria-label`. The `<dl>` ties
 * every item to its amount.
 *
 * Never show it empty: on load the cheapest game is preselected. All values
 * come from the price service and are never hard-coded.
 *
 * @example
 * ```html
 * <z-price-summary
 *   label="Valheim, monatlich"
 *   price="5,40&nbsp;€"
 *   period="/ Monat"
 *   [lines]="posten"
 *   note="Nach Stunden abgerechnet, nach oben gedeckelt."
 * >
 *   <button zBtn="primary" block>Server erstellen</button>
 * </z-price-summary>
 * ```
 */
@Component({
  selector: 'z-price-summary',
  template: `
    <aside class="z-summary" [attr.aria-label]="label() || null">
      <div>
        @if (label()) {
          <div class="z-summary__label">{{ label() }}</div>
        }
        <div class="z-summary__price">
          {{ price() }} <small>{{ period() }}</small>
        </div>
      </div>
      <dl class="z-summary__lines">
        @for (zeile of lines(); track $index) {
          <div class="z-summary__line">
            <dt>{{ zeile.label }}</dt>
            <dd>{{ zeile.value }}</dd>
          </div>
        }
      </dl>
      <ng-content />
      @if (note()) {
        <span class="z-summary__note">{{ note() }}</span>
      }
    </aside>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZPriceSummary {
  /**
   * Game and period, for example "Valheim, monatlich". Also the accessible name
   * of the landmark. Empty leaves both out.
   *
   * @default ''
   */
  readonly label = input('');

  /**
   * The price, already formatted by the caller: comma as the decimal mark, a
   * non-breaking space before the currency.
   *
   * @default ''
   */
  readonly price = input('');

  /**
   * Period shown after the price, for example "/ Monat". Rendered in a
   * `<small>` and always present in the markup, even when empty.
   *
   * @default ''
   */
  readonly period = input('');

  /**
   * The line items in display order. Not tracked by `label`, so duplicate
   * labels are allowed.
   *
   * @default []
   */
  readonly lines = input<ZPriceLine[]>([]);

  /**
   * One sentence on how billing works, shown under the button. Empty leaves it
   * out.
   *
   * @default ''
   */
  readonly note = input('');
}
