import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  Directive,
  input,
} from '@angular/core';

/**
 * Marks the bottom row of the footer: copyright on the left, the legal links on
 * the right. Pure slot marker, it adds no class and no markup. The legal links
 * are mandatory on every page, including the panels.
 *
 * @example
 * ```html
 * <div zFooterBase>
 *   <span>© 2026 Zenit-Hosting</span>
 *   <a href="/impressum">Impressum</a>
 * </div>
 * ```
 */
@Directive({ selector: '[zFooterBase]' })
export class ZFooterBase {}

/**
 * One link column of the public footer.
 *
 * Renders an optional `<h2 class="z-footer__head">` and a
 * `<ul class="z-footer__list">` around the projected content, so the content is
 * the `<li>` elements. Only usable inside `z-footer`, which selects these
 * elements into its column grid.
 *
 * @example
 * ```html
 * <z-footer-col heading="Hosting">
 *   <li><a href="/minecraft">Minecraft</a></li>
 *   <li><a href="/preise">Preise</a></li>
 * </z-footer-col>
 * ```
 */
@Component({
  selector: 'z-footer-col',
  template: `
    @if (heading()) {
      <h2 class="z-footer__head">{{ heading() }}</h2>
    }
    <ul class="z-footer__list">
      <ng-content />
    </ul>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZFooterCol {
  /**
   * Heading of the column, one word. Empty leaves the `<h2>` out, which keeps
   * the heading outline free of empty levels.
   *
   * @default ''
   */
  readonly heading = input('');
}

/**
 * Footer of every page. Public pages use the columns, the customer area shows
 * the bottom row only.
 *
 * Renders `<div class="z-footer__cols">` with the projected `z-footer-col`
 * elements and `<div class="z-footer__base">` with the `[zFooterBase]` slot;
 * the host carries `z-footer` and, unless {@link landmark} is off, the
 * `contentinfo` role of the page. Without columns the grid stays empty and
 * collapses, so the same element serves both cases. Content that matches
 * neither slot is not rendered.
 *
 * @example
 * ```html
 * <z-footer>
 *   <z-footer-col heading="Hosting">
 *     <li><a href="/minecraft">Minecraft</a></li>
 *   </z-footer-col>
 *   <div zFooterBase>
 *     <span>© 2026 Zenit-Hosting</span>
 *     <a href="/impressum">Impressum</a>
 *   </div>
 * </z-footer>
 * ```
 */
@Component({
  selector: 'z-footer',
  template: `
    <div class="z-footer__cols"><ng-content select="z-footer-col" /></div>
    <div class="z-footer__base"><ng-content select="[zFooterBase]" /></div>
  `,
  host: {
    class: 'z-footer',
    '[attr.role]': `landmark() ? "contentinfo" : null`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZFooter {
  /**
   * Whether the host is the `contentinfo` landmark of the page. The reference
   * markup is a `<footer>` at page level, so this is on. Switch it off with
   * `[landmark]="false"` wherever the footer is not the page footer but a
   * preview inside `<main>`: a contentinfo must not sit inside the main
   * content.
   *
   * @default true
   */
  readonly landmark = input(true, { transform: booleanAttribute });
}
