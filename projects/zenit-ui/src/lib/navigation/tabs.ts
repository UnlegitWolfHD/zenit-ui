import { booleanAttribute, Directive, input } from '@angular/core';

/**
 * Tab bar for the sub-pages of one area. Every tab is a link with its own URL.
 *
 * Adds the class `z-tabs` to the host `<nav>` and renders no markup of its own.
 * On narrow screens the bar scrolls horizontally, it never wraps. Put an
 * `aria-label` on the `<nav>` naming the area the tabs belong to, so the
 * landmark is distinguishable from the other navigations on the page.
 *
 * Use `ZSegment` instead when the options only switch the view on the same data.
 *
 * @example
 * ```html
 * <nav zTabs aria-label="Hosting">
 *   <a zTab routerLink="uebersicht" [active]="true">Übersicht</a>
 *   <a zTab routerLink="apps">Apps</a>
 *   <a zTab routerLink="speicher">Speicher</a>
 * </nav>
 * ```
 */
@Directive({
  selector: 'nav[zTabs]',
  host: { 'class': 'z-tabs' },
})
export class ZTabs {}

/**
 * One tab inside `nav[zTabs]`, always a link. Carries the class `z-tab`.
 *
 * When `active` is set the host gets `aria-current="page"`; that attribute is
 * both what assistive technology announces and what the stylesheet draws the
 * 2px underline from. The library does not read the router, so the caller
 * decides which tab is active. The link itself brings keyboard support, the
 * directive adds none.
 *
 * @example
 * ```html
 * <a zTab routerLink="speicher" [active]="bereich() === 'speicher'">Speicher</a>
 * ```
 */
@Directive({
  selector: 'a[zTab]',
  host: {
    'class': 'z-tab',
    '[attr.aria-current]': `active() ? "page" : null`,
  },
})
export class ZTab {
  /**
   * Whether this tab points at the page currently shown. Written as a bare
   * attribute (`active`) it counts as `true`.
   *
   * @default false
   */
  readonly active = input(false, { transform: booleanAttribute });
}
