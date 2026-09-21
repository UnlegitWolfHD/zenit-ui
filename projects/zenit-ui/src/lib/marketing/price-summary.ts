import { booleanAttribute, ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ZButton } from '../button';
import { ZAlert, ZAlertAction } from '../feedback';
import { injectZLabels } from '../labels';
import { ZSpinner } from '../spinner';

/** One line item of the summary. */
export interface ZPriceLine {
  /** Name of the item, for example "Laufzeitrabatt". */
  label: string;
  /**
   * The amount, already formatted by the caller. Discounts carry a minus sign
   * and stay a line of their own, they never become a badge.
   */
  value: string;
  /**
   * Marks the line as a deduction: it gets `z-summary__discount` and the
   * amount stands in `success`. The real minus sign (U+2212) comes from the
   * caller, along with the rest of the formatting.
   */
  discount?: boolean;
}

/** The sum under the line items. */
export interface ZPriceTotal {
  /** What the sum is, for example "Summe für 30 Tage". */
  label: string;
  /** The amount, already formatted by the caller. */
  value: string;
}

/**
 * Result of the price calculator, carrying the only primary button of the
 * calculator.
 *
 * Renders an `<aside class="z-summary">` with the optional
 * `.z-summary__label`, the price in `.z-summary__price` with the period in a
 * `<small>`, the items as a `<dl class="z-summary__lines">` of `<dt>`/`<dd>`
 * pairs with the optional `.z-summary__total` as the last pair, then the
 * projected content and last the notes. So the projected content is the
 * button, and it sits between items and note.
 *
 * States: while {@link loading} holds, the last number stays and moves to
 * `.z-summary__price--pending` with a spinner beside it, never a dash. With
 * {@link error} a `danger` alert stands above the button, with the retry
 * button next to it, and the caller locks its own button. "Incomplete" is no
 * state of its own: the caller disables its button and writes into
 * {@link note} what is still missing. Validation errors of the selection
 * belong at the field, not here.
 *
 * Accessibility: the `<aside>` is a complementary landmark named by
 * {@link label}; without a label it carries no `aria-label`. The `<dl>` ties
 * every item to its amount. The price is a polite live region, so a changed
 * amount is announced instead of only redrawn; while {@link loading} holds it
 * also carries `aria-busy` and the caller keeps the last confirmed number
 * there, so nothing unconfirmed is ever read out.
 *
 * Never show it empty: on load the cheapest game is preselected. All values
 * come from the price service and are never hard-coded.
 *
 * @example
 * ```html
 * <z-price-summary
 *   label="Minecraft, alle 30 Tage"
 *   price="7,74&nbsp;€"
 *   [lines]="posten"
 *   [total]="{ label: 'Summe', value: '7,74&nbsp;€' }"
 *   note="Wähle noch eine Bezahlmethode"
 *   legalNote="Gemäß § 19 UStG wird keine Umsatzsteuer berechnet."
 * >
 *   <button zBtn="primary" block type="button" disabled>Kostenpflichtig bestellen</button>
 * </z-price-summary>
 * ```
 */
@Component({
  selector: 'z-price-summary',
  imports: [ZAlert, ZAlertAction, ZButton, ZSpinner],
  template: `
    <aside class="z-summary" [attr.aria-label]="label() || null">
      <div>
        @if (label()) {
          <div class="z-summary__label">{{ label() }}</div>
        }
        <!-- A price that changes has to be heard, not just seen. The region is
             always in the markup and only its text changes; while the
             calculation runs it says nothing, so only a confirmed amount is
             announced. -->
        <div
          class="z-summary__price"
          [class.z-summary__price--pending]="loading()"
          aria-live="polite"
          aria-atomic="true"
          [attr.aria-busy]="loading() ? 'true' : null"
        >
          {{ price() }} <small>{{ period() }}</small>
          @if (loading()) {
            <z-spinner />
          }
        </div>
      </div>
      <dl class="z-summary__lines">
        @for (zeile of lines(); track $index) {
          <div class="z-summary__line" [class.z-summary__discount]="zeile.discount">
            <dt>{{ zeile.label }}</dt>
            <dd>{{ zeile.value }}</dd>
          </div>
        }
        @if (total(); as summe) {
          <div class="z-summary__total">
            <dt>{{ summe.label }}</dt>
            <dd>{{ summe.value }}</dd>
          </div>
        }
      </dl>
      @if (error()) {
        <z-alert status="danger" icon="error">
          {{ error() }}
          <button zAlertAction zBtn="secondary" size="sm" type="button" (click)="retry.emit()">
            {{ retryLabel() || etiketten.summaryRetry }}
          </button>
        </z-alert>
      }
      <ng-content />
      @if (note()) {
        <span class="z-summary__note">{{ note() }}</span>
      }
      @if (legalNote()) {
        <span class="z-summary__note">{{ legalNote() }}</span>
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
   * The sum under the items, set off by a line in `border-control`. Leave it
   * out where there is only one amount to show.
   *
   * @default null
   */
  readonly total = input<ZPriceTotal | null>(null);

  /**
   * While the price is being recomputed: the last number stays and turns
   * `text-muted`, with a spinner beside it. There is never a dash in place of
   * a price. Boolean attribute.
   *
   * @default false
   */
  readonly loading = input(false, { transform: booleanAttribute });

  /**
   * Why the price could not be computed, for example "Preis konnte nicht
   * berechnet werden". Shows a `danger` alert with the retry button. The order
   * button is locked by the caller. Empty renders nothing.
   *
   * @default ''
   */
  readonly error = input('');

  /**
   * Caption of that retry button. Empty falls back to the `summaryRetry` label
   * of the registry.
   *
   * @default ''
   */
  readonly retryLabel = input('');

  /**
   * One sentence on how billing works, or what is still missing before the
   * order can go out. Shown under the button. Empty leaves it out.
   *
   * @default ''
   */
  readonly note = input('');

  /**
   * The tax note, as the last line of the summary, for example "Gemäß § 19
   * UStG wird keine Umsatzsteuer berechnet." Empty leaves it out.
   *
   * @default ''
   */
  readonly legalNote = input('');

  /** Fires on the retry button. The caller starts the computation again. */
  readonly retry = output<void>();

  protected readonly etiketten = injectZLabels();
}
