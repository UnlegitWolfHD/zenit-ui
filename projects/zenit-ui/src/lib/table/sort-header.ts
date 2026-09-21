import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { ZIcon } from '../icon';
import { ZSort, ZTable } from './table';

/**
 * Header cell that sorts its column. Sits on a `<th>` inside a
 * `table[zTable]` and renders a real `<button>` around the projected header
 * text, so the cell is reachable by keyboard, has a focus ring and is
 * announced as a button.
 *
 * A click cycles through three steps: {@link sortStart}, the opposite
 * direction, unsorted. The state lives on the table
 * ({@link ZTable.sort}), so only one column is ever sorted; this component
 * only reads and writes it. The library does not sort the rows, the caller
 * does, usually in a `computed()`.
 *
 * Accessibility: the `<th>` carries `aria-sort`, `ascending` or `descending`
 * on the sorted column and `none` on every other sortable one, which is the
 * WAI-ARIA pattern for a sortable table. The accessible name of the button is
 * the header text itself, so no extra label and no `title` is needed. While
 * {@link disabled} is set the column takes no part in sorting: the button is
 * natively disabled and the cell carries no `aria-sort` at all, so it reads
 * like the plain header it is.
 *
 * @example
 * ```html
 * <table zTable [(sort)]="sortierung">
 *   <thead>
 *     <tr>
 *       <th zSortHeader="name">Name</th>
 *       <th zNum zSortHeader="groesse" sortStart="desc">Größe</th>
 *     </tr>
 *   </thead>
 *   <tbody>…</tbody>
 * </table>
 * ```
 */
@Component({
  selector: 'th[zSortHeader]',
  imports: [ZIcon],
  template: `<button type="button" class="z-table__sort" [disabled]="disabled()" (click)="weiter()">
    <ng-content />
    @if (richtung()) {
      <z-icon [name]="richtung() === 'asc' ? 'arrow_upward' : 'arrow_downward'" size="sm" />
    }
  </button>`,
  host: {
    '[attr.aria-sort]': 'sortierstand()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZSortHeader {
  /**
   * Key of this column, the value that ends up in {@link ZSort.key}. It only
   * has to be unique inside the table; the caller matches it against its own
   * field when it orders the rows.
   */
  readonly zSortHeader = input.required<string>();

  /**
   * Direction of the first click. `desc` suits columns where the largest value
   * is the interesting one, for example a size or an amount.
   *
   * @default 'asc'
   */
  readonly sortStart = input<'asc' | 'desc'>('asc');

  /**
   * Whether this column cannot be sorted. The button is natively disabled and
   * the cell carries no `aria-sort`.
   *
   * @default false
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly tabelle = inject(ZTable);

  /** Direction this column is sorted in, or `null` while it is not the sorted one. */
  protected readonly richtung = computed<'asc' | 'desc' | null>(() => {
    const sortierung = this.tabelle.sort();
    if (this.disabled() || sortierung?.key !== this.zSortHeader()) {
      return null;
    }
    return sortierung.direction;
  });

  /** `aria-sort` of the cell, left off entirely while the column is disabled. */
  protected readonly sortierstand = computed(() => {
    if (this.disabled()) {
      return null;
    }
    const richtung = this.richtung();
    if (!richtung) {
      return 'none';
    }
    return richtung === 'asc' ? 'ascending' : 'descending';
  });

  /** One step of the cycle: start direction, opposite direction, unsorted. */
  protected weiter(): void {
    const start = this.sortStart();
    const jetzt = this.richtung();
    const gegenrichtung = start === 'asc' ? 'desc' : 'asc';
    const naechste: ZSort | null =
      jetzt === null
        ? { key: this.zSortHeader(), direction: start }
        : jetzt === start
          ? { key: this.zSortHeader(), direction: gegenrichtung }
          : null;
    this.tabelle.sort.set(naechste);
  }
}
