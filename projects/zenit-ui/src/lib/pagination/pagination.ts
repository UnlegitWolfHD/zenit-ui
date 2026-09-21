import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  untracked,
} from '@angular/core';
import { ZButton } from '../button';
import { ZIcon } from '../icon';
import { Z_LABELS } from '../labels';

/**
 * Pages through lists with more than {@link pageSize} entries and sits as the
 * last row inside a panel.
 *
 * Renders `<div class="z-pager">` with the range sentence on the left and
 * `.z-pager__nav` on the right: a back button, `page / pages` in the mono face
 * and a forward button. Both buttons are icon-only ghost buttons in size `sm`
 * with an `aria-label`, and they are `disabled` on the first and the last page.
 * As long as everything fits on one page the component renders nothing at all,
 * so an empty list shows no pager.
 *
 * The component does not slice the data. It reports the wanted page through
 * {@link page}, the caller cuts the list.
 *
 * @example
 * ```html
 * <z-panel title="Transaktionen" flush>
 *   <z-rows>…</z-rows>
 *   <z-pagination [(page)]="seite" [total]="118" itemLabel="Transaktionen" />
 * </z-panel>
 * ```
 */
@Component({
  selector: 'z-pagination',
  imports: [ZButton, ZIcon],
  template: `
    @if (sichtbar()) {
      <div class="z-pager">
        <span>{{ bereich()(von(), bis(), total(), itemLabel()) }}</span>
        <div class="z-pager__nav">
          <button
            type="button"
            zBtn="ghost"
            iconOnly
            size="sm"
            [attr.aria-label]="zurueckText()"
            [disabled]="seite() <= 1"
            (click)="zuSeite(seite() - 1)"
          >
            <z-icon name="chevron_left" />
          </button>
          <span class="z-mono">{{ seite() }} / {{ seiten() }}</span>
          <button
            type="button"
            zBtn="ghost"
            iconOnly
            size="sm"
            [attr.aria-label]="weiterText()"
            [disabled]="seite() >= seiten()"
            (click)="zuSeite(seite() + 1)"
          >
            <z-icon name="chevron_right" />
          </button>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZPagination {
  /**
   * Current page, 1-based and two-way bindable. The component keeps it inside
   * the valid range: a page below 1 or beyond the last one is written back
   * clamped, which also happens when {@link total} or {@link pageSize} change.
   *
   * @default 1
   */
  readonly page = model(1);

  /**
   * Entries per page. The spec fixes this at 25 and offers no per-page picker;
   * values below 1 are treated as 1.
   *
   * @default 25
   */
  readonly pageSize = input(25, { transform: numberAttribute });

  /**
   * Number of entries in the whole list, not just on the current page.
   *
   * @default 0
   */
  readonly total = input(0, { transform: numberAttribute });

  /**
   * What the list contains, for example "Rechnungen". Passed to
   * {@link rangeLabel} as the last argument.
   *
   * @default ''
   */
  readonly itemLabel = input('');

  /**
   * Builds the sentence in front of the buttons from the first and last entry
   * number of the current page, the total and {@link itemLabel}. Unset, the
   * component uses {@link ZLabels.paginationRange} from the label registry
   * ("1 bis 25 von 112 Rechnungen" in German).
   *
   * @default undefined
   */
  readonly rangeLabel =
    input<(von: number, bis: number, total: number, itemLabel: string) => string>();

  /**
   * `aria-label` of the back button. Unset, the component uses
   * {@link ZLabels.paginationPrev} from the label registry.
   *
   * @default undefined
   */
  readonly ariaLabelPrev = input<string>();

  /**
   * `aria-label` of the forward button. Unset, the component uses
   * {@link ZLabels.paginationNext} from the label registry.
   *
   * @default undefined
   */
  readonly ariaLabelNext = input<string>();

  private readonly labels = inject(Z_LABELS);

  protected readonly bereich = computed(() => this.rangeLabel() ?? this.labels.paginationRange);
  protected readonly zurueckText = computed(
    () => this.ariaLabelPrev() ?? this.labels.paginationPrev,
  );
  protected readonly weiterText = computed(
    () => this.ariaLabelNext() ?? this.labels.paginationNext,
  );

  protected readonly seiten = computed(() =>
    Math.max(1, Math.ceil(this.total() / Math.max(1, this.pageSize()))),
  );
  /** The page shown is always inside the valid range. */
  protected readonly seite = computed(() =>
    Math.min(Math.max(1, Math.trunc(this.page())), this.seiten()),
  );
  protected readonly sichtbar = computed(() => this.total() > 0 && this.total() > this.pageSize());
  protected readonly von = computed(() => (this.seite() - 1) * this.pageSize() + 1);
  protected readonly bis = computed(() => Math.min(this.seite() * this.pageSize(), this.total()));

  constructor() {
    // When total or pageSize change, a page beyond the end moves back into the
    // valid range.
    effect(() => {
      const geklemmt = this.seite();
      if (untracked(this.page) !== geklemmt) {
        this.page.set(geklemmt);
      }
    });
  }

  protected zuSeite(ziel: number): void {
    this.page.set(Math.min(Math.max(1, ziel), this.seiten()));
  }
}
