import {
  afterNextRender,
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { leiheAttribut } from '../a11y/host-attribute';
import { injectZLabels } from '../labels';

/**
 * Which column a table is sorted by and in which direction, the value of
 * {@link ZTable.sort}.
 */
export interface ZSort {
  /** Key of the sorted column: the value of `zSortHeader` on its header cell. */
  key: string;

  /** Direction of the sort, ascending or descending. */
  direction: 'asc' | 'desc';
}

/**
 * Table for files, invoices, backups and databases: everything with several
 * equal columns and bulk actions. Adds the class `z-table` to a native
 * `<table>` and renders nothing itself, so semantics, header cells and keyboard
 * behaviour stay the browser's.
 *
 * It also holds the sort state of the table, which the header cells marked with
 * `zSortHeader` read and write. The library does not sort: it reports what the
 * user asked for through {@link sort}, the caller orders the rows.
 *
 * @example
 * ```html
 * <table zTable [(sort)]="sortierung">
 *   <thead>…</thead>
 *   <tbody>…</tbody>
 * </table>
 * ```
 */
@Directive({
  selector: 'table[zTable]',
  host: { class: 'z-table' },
})
export class ZTable {
  /**
   * Column the table is sorted by, two-way bindable. `null` means unsorted,
   * which is also the third step of the cycle a `th[zSortHeader]` runs through.
   * Only one column is sorted at a time, because the whole table shares this
   * one value.
   *
   * @default null
   */
  readonly sort = model<ZSort | null>(null);
}

/**
 * Wrapper around `table[zTable]`. Below 640px the table scrolls sideways in
 * here, the page itself never does.
 *
 * Renders only the projected content and puts `z-table-wrap` on the host. While
 * the table is actually wider than the wrapper, the host becomes a
 * `role="region"` with `tabindex="0"` and an `aria-label`, so the scrollable
 * area is reachable and scrollable by keyboard alone. While everything fits, all
 * three are left off: a table that cannot scroll would otherwise be a tab stop
 * that does nothing, on every desktop screen.
 *
 * The three attributes are borrowed, not bound: what the caller wrote on
 * `<z-table-container>` comes back when the overflow is gone, so a `role`, an
 * `aria-label` or a `tabindex` of the caller's own survives a window that is
 * resized wide enough.
 *
 * @example
 * ```html
 * <z-table-container ariaLabel="Dateien, seitlich scrollbar">
 *   <table zTable>
 *     <thead>
 *       <tr><th>Name</th><th style="text-align:right">Größe</th></tr>
 *     </thead>
 *     <tbody>
 *       <tr>
 *         <td><span zTableName><z-icon name="description" />server.jar</span></td>
 *         <td zNum>61,25 MB</td>
 *       </tr>
 *     </tbody>
 *   </table>
 * </z-table-container>
 * ```
 */
@Component({
  selector: 'z-table-container',
  template: `<ng-content />`,
  host: {
    class: 'z-table-wrap',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZTableContainer {
  /**
   * Accessible name of the scrollable region, meant to be overridden with the
   * content of the table. Unset, the component uses
   * {@link ZLabels.tableRegion} from the label registry.
   *
   * @default undefined
   */
  readonly ariaLabel = input<string>();

  private readonly labels = injectZLabels();
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  // The predicate lands in the static partial declaration, which a JIT consumer
  // evaluates while this class is defined: ZTable has to be declared above.
  private readonly tabelle = contentChild(ZTable, { read: ElementRef });
  private beobachter?: ResizeObserver;

  protected readonly bereichText = computed(() => this.ariaLabel() ?? this.labels.tableRegion);
  /** Whether the content is wider than the wrapper, so there is something to scroll. */
  protected readonly ueberlauf = signal(false);

  constructor() {
    // Only while there is something to scroll does the library own these
    // three. As host bindings they wrote `null` on every other change and
    // deleted whatever the caller had put there; borrowed, the caller's values
    // come back.
    leiheAttribut('role', () => (this.ueberlauf() ? 'region' : null));
    leiheAttribut('tabindex', () => (this.ueberlauf() ? '0' : null));
    leiheAttribut('aria-label', () => (this.ueberlauf() ? this.bereichText() : null));

    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      // Not every environment has a ResizeObserver; without one the wrapper
      // keeps the state of the last measurement.
      if (typeof ResizeObserver === 'undefined') {
        return;
      }
      this.beobachter = new ResizeObserver(() => this.messen());
      this.beobachter.observe(this.el.nativeElement);
      destroyRef.onDestroy(() => this.beobachter?.disconnect());
    });

    // A changed table is wider or narrower without the wrapper changing size,
    // so the observer alone would miss it: measure after the render as well,
    // and watch the table itself from then on.
    afterRenderEffect({
      earlyRead: () => {
        const tabelle = this.tabelle()?.nativeElement;
        if (tabelle) {
          this.beobachter?.observe(tabelle);
        }
        this.messen();
      },
    });
  }

  private messen(): void {
    const el = this.el.nativeElement;
    this.ueberlauf.set(el.scrollWidth > el.clientWidth);
  }
}

/**
 * Right-aligned cell in the mono face: size, date, amount. Adds the class
 * `z-table__num` and renders nothing itself.
 *
 * @example
 * ```html
 * <td zNum>61,25 MB</td>
 * ```
 */
@Directive({
  selector: '[zNum]',
  host: { class: 'z-table__num' },
})
export class ZNum {}

/**
 * Name cell: icon and name in the mono face. Adds the class `z-table__name` and
 * renders nothing itself; the icon comes from the caller and is `folder` or
 * `description`.
 *
 * @example
 * ```html
 * <td><span zTableName><z-icon name="folder" />plugins</span></td>
 * ```
 */
@Directive({
  selector: '[zTableName]',
  host: { class: 'z-table__name' },
})
export class ZTableName {}
