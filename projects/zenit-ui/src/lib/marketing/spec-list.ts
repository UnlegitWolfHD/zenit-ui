import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** One term and value pair of a `z-spec-list`. */
export interface ZSpecItem {
  /** Short term, rendered as the `<dt>`. */
  term: string;
  /** The concrete value, rendered as the `<dd>`. */
  value: string;
  /** Addition after the value, rendered in a `<small>`. Optional. */
  note?: string;
  /**
   * Sets the value in the mono face through `z-mono`. Use it for technical
   * values: addresses, ports, sizes, configuration keys.
   *
   * @default false
   */
  mono?: boolean;
}

/**
 * Facts as term and value pairs. Replaces metric tiles, chip clouds and feature
 * cards on public pages; a fact appears exactly once per page.
 *
 * Renders a `<dl class="z-spec">` with one `<dt>`/`<dd>` pair per entry, which
 * is what ties every value to its term for assistive technology. No icons, no
 * cards; the rows are separated by 1px lines. Below 480px the value moves under
 * the term.
 *
 * @example
 * ```html
 * <z-spec-list
 *   [items]="[
 *     { term: 'CPU', value: 'AMD Ryzen 9 7950X', note: '16 Kerne' },
 *     { term: 'Anbindung', value: '1 Gbit/s', mono: true },
 *   ]"
 * />
 * ```
 */
@Component({
  selector: 'z-spec-list',
  template: `<dl class="z-spec">
    @for (eintrag of items(); track $index) {
      <dt>{{ eintrag.term }}</dt>
      <dd>
        @if (eintrag.mono) {
          <span class="z-mono">{{ eintrag.value }}</span>
        } @else {
          {{ eintrag.value }}
        }
        @if (eintrag.note) {
          <small>{{ eintrag.note }}</small>
        }
      </dd>
    }
  </dl>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZSpecList {
  /**
   * The facts in display order. Tracked by index, so reordering re-renders the
   * rows. An empty array renders an empty `<dl>`.
   *
   * @default []
   */
  readonly items = input<ZSpecItem[]>([]);
}
