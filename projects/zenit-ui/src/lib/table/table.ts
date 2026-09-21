import { ChangeDetectionStrategy, Component, Directive, input } from '@angular/core';

/**
 * Wrapper around `table[zTable]`. Below 640px the table scrolls sideways in
 * here, the page itself never does.
 *
 * Renders only the projected content and puts `z-table-wrap` on the host. The
 * host is a `role="region"` with `tabindex="0"` and an `aria-label`, so the
 * scrollable area is reachable and scrollable by keyboard alone.
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
    'class': 'z-table-wrap',
    'role': 'region',
    'tabindex': '0',
    '[attr.aria-label]': `ariaLabel()`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZTableContainer {
  /**
   * Accessible name of the scrollable region. German default, meant to be
   * overridden with the content of the table.
   *
   * @default 'Tabelle, seitlich scrollbar'
   */
  readonly ariaLabel = input('Tabelle, seitlich scrollbar');
}

/**
 * Table for files, invoices, backups and databases: everything with several
 * equal columns and bulk actions. Adds the class `z-table` to a native
 * `<table>` and renders nothing itself, so semantics, header cells and keyboard
 * behaviour stay the browser's.
 *
 * @example
 * ```html
 * <table zTable>
 *   <thead>…</thead>
 *   <tbody>…</tbody>
 * </table>
 * ```
 */
@Directive({
  selector: 'table[zTable]',
  host: { 'class': 'z-table' },
})
export class ZTable {}

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
  host: { 'class': 'z-table__num' },
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
  host: { 'class': 'z-table__name' },
})
export class ZTableName {}
