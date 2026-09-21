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
import { ZIcon } from '../icon';
import { Z_LABELS } from '../labels';

/**
 * Pages through lists with more than {@link pageSize} entries and sits as the
 * last row inside a panel.
 *
 * Renders a `<nav>` with an accessible name around `<div class="z-pager">`: the
 * range sentence on the left and `.z-pager__nav` on the right, with a back
 * button, `page / pages` in the mono face and a forward button. Both buttons are
 * icon-only ghost buttons in size `sm` with an `aria-label`. As long as
 * everything fits on one page the component renders nothing at all, so an empty
 * list shows no pager.
 *
 * Accessibility: on the first and the last page the matching arrow carries
 * `aria-disabled="true"` instead of the native `disabled`, and its click is
 * swallowed. A native `disabled` on the button that was just used would throw
 * the focus back to `<body>`; this way the focus stays where the user put it and
 * the state is still announced. The range sentence is an `aria-live="polite"`
 * region, so paging is reported even though nothing moves the focus.
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
  imports: [ZIcon],
  template: `
    @if (sichtbar()) {
      <nav [attr.aria-label]="navText()">
        <div class="z-pager">
          <span aria-live="polite">{{ bereich()(von(), bis(), total(), itemLabel()) }}</span>
          <div class="z-pager__nav">
            <button
              type="button"
              class="z-btn z-btn--ghost z-btn--icon z-btn--sm"
              [attr.aria-label]="zurueckText()"
              [attr.aria-disabled]="seite() <= 1 ? 'true' : null"
              (click)="zuSeite(seite() - 1)"
            >
              <z-icon name="chevron_left" />
            </button>
            <span class="z-mono">{{ seite() }} / {{ seiten() }}</span>
            <button
              type="button"
              class="z-btn z-btn--ghost z-btn--icon z-btn--sm"
              [attr.aria-label]="weiterText()"
              [attr.aria-disabled]="seite() >= seiten() ? 'true' : null"
              (click)="zuSeite(seite() + 1)"
            >
              <z-icon name="chevron_right" />
            </button>
          </div>
        </div>
      </nav>
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
   * Entries per page. The spec fixes this at 25 and offers no per-page picker.
   * A value below 1 and a value that is not a finite number both count as 1,
   * everywhere: in the page count as well as in the range sentence.
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
   * Accessible name of the `<nav>` around the pager, which tells a screen
   * reader what this navigation landmark is for. Unset, the component uses
   * {@link ZLabels.paginationNav} from the label registry.
   *
   * @default undefined
   */
  readonly ariaLabel = input<string>();

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
  protected readonly navText = computed(() => this.ariaLabel() ?? this.labels.paginationNav);
  protected readonly zurueckText = computed(
    () => this.ariaLabelPrev() ?? this.labels.paginationPrev,
  );
  protected readonly weiterText = computed(
    () => this.ariaLabelNext() ?? this.labels.paginationNext,
  );

  /** {@link pageSize} as a whole number of at least 1, used by every count. */
  private readonly proSeite = computed(() => {
    const roh = Math.trunc(this.pageSize());
    return Number.isFinite(roh) ? Math.max(1, roh) : 1;
  });

  protected readonly seiten = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.proSeite())),
  );
  /** The page shown is always inside the valid range. */
  protected readonly seite = computed(() =>
    Math.min(Math.max(1, Math.trunc(this.page())), this.seiten()),
  );
  protected readonly sichtbar = computed(() => this.total() > 0 && this.total() > this.proSeite());
  protected readonly von = computed(() => (this.seite() - 1) * this.proSeite() + 1);
  protected readonly bis = computed(() => Math.min(this.seite() * this.proSeite(), this.total()));

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

  /**
   * A click on an arrow that is marked `aria-disabled` is swallowed: the button
   * keeps the focus and nothing else happens.
   */
  protected zuSeite(ziel: number): void {
    if (ziel < 1 || ziel > this.seiten()) {
      return;
    }
    this.page.set(ziel);
  }
}
