import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  model,
  numberAttribute,
  untracked,
} from '@angular/core';
import { ZSelect } from '../field';
import { ZIcon } from '../icon';
import { injectZLabels } from '../labels';

/** Counter for the id that ties the size selector to its label. */
let zaehler = 0;

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
 * With {@link pageSizeOptions} a labelled `<select>` for the page size stands
 * in front of the range sentence. Without it nothing changes, so a pager that
 * does not want a picker renders exactly as before.
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
  imports: [ZIcon, ZSelect],
  template: `
    @if (sichtbar()) {
      <nav [attr.aria-label]="navText()">
        <div class="z-pager">
          @if (groesseSichtbar()) {
            <div class="z-pager__size">
              <label [attr.for]="groesseId">{{ groesseText() }}</label>
              <z-select size="sm">
                <select [id]="groesseId" (change)="aufGroesse($event)">
                  @for (option of optionen(); track option) {
                    <option [value]="option" [selected]="option === proSeite()">
                      {{ option }}
                    </option>
                  }
                </select>
              </z-select>
            </div>
          }
          @if (blaettern()) {
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
          }
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
   * Entries per page, two-way bindable. A one-way `[pageSize]` keeps working
   * exactly as before; `[(pageSize)]` additionally receives what the user
   * picks from {@link pageSizeOptions}. A value below 1 and a value that is
   * not a finite number both count as 1, everywhere: in the page count as well
   * as in the range sentence.
   *
   * @default 25
   */
  readonly pageSize = model(25);

  /**
   * Sizes the user may choose from. Empty, the default, means no picker at
   * all. The rendered list is these options plus the current {@link pageSize},
   * de-duplicated and sorted, so the select never shows a size the pager is
   * not actually using.
   *
   * @default []
   */
  readonly pageSizeOptions = input<number[]>([]);

  /**
   * Visible label in front of the size select. Unset, the component uses
   * {@link ZLabels.paginationPageSize} from the label registry ("Einträge pro
   * Seite" in German).
   *
   * @default undefined
   */
  readonly pageSizeLabel = input<string>();

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

  private readonly labels = injectZLabels();

  protected readonly bereich = computed(() => this.rangeLabel() ?? this.labels.paginationRange);
  protected readonly navText = computed(() => this.ariaLabel() ?? this.labels.paginationNav);
  protected readonly zurueckText = computed(
    () => this.ariaLabelPrev() ?? this.labels.paginationPrev,
  );
  protected readonly weiterText = computed(
    () => this.ariaLabelNext() ?? this.labels.paginationNext,
  );
  protected readonly groesseText = computed(
    () => this.pageSizeLabel() ?? this.labels.paginationPageSize,
  );

  /** Ties the size select to its label; unique per instance on the page. */
  protected readonly groesseId = `z-pager-size-${++zaehler}`;

  /** {@link pageSize} as a whole number of at least 1, used by every count. */
  protected readonly proSeite = computed(() => {
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

  /**
   * The sizes the select offers: the given options plus the size in use,
   * de-duplicated and sorted, so a `pageSize` outside the options still shows
   * the right value instead of a wrong one.
   */
  protected readonly optionen = computed(() => {
    const gegeben = this.pageSizeOptions();
    if (gegeben.length === 0) {
      return [];
    }
    return [...new Set([...gegeben, this.proSeite()])].sort((a, b) => a - b);
  });

  /** Arrows and range sentence, the rule of the reference: more than one page. */
  protected readonly blaettern = computed(() => this.total() > 0 && this.total() > this.proSeite());

  /**
   * The size select, which follows a rule of its own: it stands while the list
   * is longer than the smallest option, that is while at least one of the
   * offered sizes would split it into pages. Tying it to {@link blaettern}
   * instead would strand the user on a size that fits everything onto one page:
   * the arrows go, the select goes with them, and there is no way back to a
   * smaller size.
   */
  protected readonly groesseSichtbar = computed(() => {
    const optionen = this.optionen();
    return optionen.length > 0 && this.total() > optionen[0];
  });

  protected readonly sichtbar = computed(() => this.blaettern() || this.groesseSichtbar());
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

  /**
   * Takes the size the user picked and keeps the first entry of the current
   * page in view: the new page is the one that entry falls on. Both models are
   * written once, so a caller bound to either sees one change.
   */
  protected aufGroesse(ereignis: Event): void {
    const neu = Math.trunc(Number((ereignis.target as HTMLSelectElement).value));
    if (!Number.isFinite(neu) || neu < 1) {
      return;
    }
    const ersterEintrag = (this.seite() - 1) * this.proSeite();
    this.pageSize.set(neu);
    this.page.set(Math.floor(ersterEintrag / neu) + 1);
  }
}
