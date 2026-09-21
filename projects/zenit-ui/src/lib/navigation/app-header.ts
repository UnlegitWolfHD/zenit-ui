import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  input,
  signal,
} from '@angular/core';
import { ZButton } from '../button';
import { ZIcon } from '../icon';
import { injectZLabels } from '../labels';

/** Counts up once per header so that `aria-controls` stays unique. */
let laufendeNummer = 0;

/**
 * Brand slot of the header: plain text in the `display` face, no logo image.
 *
 * Adds the class `z-header__brand` and renders nothing itself, so the caller
 * decides the element. A link back to the start page is the usual choice.
 *
 * @example
 * ```html
 * <a zBrand href="/">Zenit</a>
 * ```
 */
@Directive({
  selector: '[zBrand]',
  host: { class: 'z-header__brand' },
})
export class ZBrand {}

/**
 * One link of the main navigation, carrying the class `z-header__link`.
 *
 * The active link gets `aria-current="page"`, which announces it as the current
 * page and drives the `accent-subtle` background. The library does not read the
 * router, so the caller decides which link is active.
 *
 * @example
 * ```html
 * <a zHeaderLink routerLink="/gameserver" [active]="true">Gameserver</a>
 * ```
 */
@Directive({
  selector: 'a[zHeaderLink]',
  host: {
    class: 'z-header__link',
    '[attr.aria-current]': `active() ? "page" : null`,
  },
})
export class ZHeaderLink {
  /**
   * Whether this link points at the page currently shown. Written as a bare
   * attribute (`active`) it counts as `true`.
   *
   * @default false
   */
  readonly active = input(false, { transform: booleanAttribute });
}

/**
 * Marks content for the right-hand end of the header: credit, avatar or
 * buttons. Pure slot marker, it adds no class and no markup.
 *
 * @example
 * ```html
 * <a zHeaderLink zHeaderEnd class="z-mono" href="/abrechnung">25,00&nbsp;€</a>
 * <span zHeaderEnd class="z-avatar" aria-hidden="true">K</span>
 * ```
 */
@Directive({ selector: '[zHeaderEnd]' })
export class ZHeaderEnd {}

/**
 * Header of the customer area and of the public pages. Same component both
 * times, only the links differ.
 *
 * Renders, in order: the `[zBrand]` slot, an icon-only ghost button that
 * toggles the navigation below 900px, a `<nav class="z-header__nav">` holding
 * the projected links, and a `<div class="z-header__end">` with the
 * `[zHeaderEnd]` slot. The host carries `z-header` and, while the navigation is
 * open, `z-header--open`.
 *
 * Accessibility: the toggle is a `<button type="button">` with `aria-label`
 * from {@link menuLabel}, `aria-expanded` reflecting the open state and
 * `aria-controls` pointing at the generated id of the `<nav>`. The `<nav>` is a
 * navigation landmark and takes its name from {@link navLabel}. Above 900px the
 * links are visible and the end slot stays visible at every width.
 *
 * @example
 * ```html
 * <z-app-header navLabel="Hauptnavigation">
 *   <a zBrand href="/">Zenit</a>
 *   <a zHeaderLink routerLink="/gameserver" [active]="true">Gameserver</a>
 *   <a zHeaderLink routerLink="/abrechnung">Abrechnung</a>
 *   <a zBtn="primary" size="sm" zHeaderEnd routerLink="/neu">Server erstellen</a>
 * </z-app-header>
 * ```
 */
@Component({
  selector: 'z-app-header',
  imports: [ZButton, ZIcon],
  template: `
    <ng-content select="[zBrand]" />
    <button
      zBtn="ghost"
      iconOnly
      type="button"
      class="z-header__menu"
      [attr.aria-label]="menuText()"
      [attr.aria-expanded]="offen()"
      [attr.aria-controls]="navId"
      (click)="offen.set(!offen())"
    >
      <z-icon name="menu" />
    </button>
    <nav class="z-header__nav" [id]="navId" [attr.aria-label]="navLabel() || null">
      <ng-content />
    </nav>
    <div class="z-header__end"><ng-content select="[zHeaderEnd]" /></div>
  `,
  host: {
    class: 'z-header',
    '[class.z-header--open]': `offen()`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZAppHeader {
  /**
   * Accessible name of the `<nav>` landmark. Empty means no `aria-label` at
   * all; set it whenever the page has more than one navigation.
   *
   * @default ''
   */
  readonly navLabel = input('');

  /**
   * `aria-label` of the menu button shown below 900px. Unset, the component
   * uses {@link ZLabels.headerMenu} from the label registry.
   *
   * @default undefined
   */
  readonly menuLabel = input<string>();

  private readonly labels = injectZLabels();

  protected readonly menuText = computed(() => this.menuLabel() ?? this.labels.headerMenu);
  protected readonly offen = signal(false);
  protected readonly navId = `z-header-nav-${++laufendeNummer}`;
}
