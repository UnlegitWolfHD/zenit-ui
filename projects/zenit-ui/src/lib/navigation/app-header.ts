import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  ElementRef,
  input,
  model,
  viewChild,
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
 * The open state is {@link open}, two-way bindable. It closes itself when a
 * projected link inside the `<nav>` is clicked, so a single-page application
 * does not keep the menu over the new page, and on Escape while the focus is
 * inside the header.
 *
 * Accessibility: the toggle is a `<button type="button">` with `aria-label`
 * from {@link menuLabel}, `aria-expanded` reflecting the open state and
 * `aria-controls` pointing at the generated id of the `<nav>`. The `<nav>` is a
 * navigation landmark and takes its name from {@link navLabel}, and the host is
 * the `banner` landmark of the page unless {@link landmark} is off. Above 900px
 * the links are visible and the end slot stays visible at every width.
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
      #knopf
      zBtn="ghost"
      iconOnly
      type="button"
      class="z-header__menu"
      [attr.aria-label]="menuText()"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="navId"
      (click)="open.set(!open())"
    >
      <z-icon name="menu" />
    </button>
    <!-- The click handler is delegation for the projected links, not an
         interaction of the <nav> itself: the keyboard already reaches every
         link, and Enter on a link fires this very click event. -->
    <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
    <nav
      class="z-header__nav"
      [id]="navId"
      [attr.aria-label]="navLabel() || null"
      (click)="aufNavKlick($event)"
    >
      <ng-content />
    </nav>
    <div class="z-header__end"><ng-content select="[zHeaderEnd]" /></div>
  `,
  host: {
    class: 'z-header',
    '[class.z-header--open]': `open()`,
    '[attr.role]': `landmark() ? "banner" : null`,
    '(keydown.escape)': `aufEscape()`,
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
   * Whether the host is the `banner` landmark of the page. The reference markup
   * is a `<header>` at page level, so this is on. Switch it off with
   * `[landmark]="false"` wherever the header is not the page header but a
   * preview inside `<main>`: a banner must not sit inside the main content.
   *
   * @default true
   */
  readonly landmark = input(true, { transform: booleanAttribute });

  /**
   * `aria-label` of the menu button shown below 900px. Unset, the component
   * uses {@link ZLabels.headerMenu} from the label registry.
   *
   * @default undefined
   */
  readonly menuLabel = input<string>();

  /**
   * Whether the menu below 900px is open, two-way bindable as `[(open)]`. The
   * burger button toggles it, a click on a projected link inside the `<nav>`
   * and Escape close it. Above 900px the links are visible regardless, so the
   * value only matters on a phone.
   *
   * @default false
   */
  readonly open = model(false);

  private readonly labels = injectZLabels();
  // read: ElementRef, because the menu button is a ZButton host and the plain
  // query would hand out that component instead of the element.
  private readonly knopf = viewChild.required('knopf', { read: ElementRef<HTMLButtonElement> });

  protected readonly menuText = computed(() => this.menuLabel() ?? this.labels.headerMenu);
  protected readonly navId = `z-header-nav-${++laufendeNummer}`;

  /**
   * Closes the menu when the click came from a link, so following a projected
   * link does not leave the menu open over the new page. Delegation instead of
   * a listener per link, and the library stays free of `@angular/router`: what
   * counts is the `<a>`, not the directive on it. A button inside the nav, a
   * menu trigger for example, leaves the menu open.
   *
   * Two cases stay open on purpose. A link found above the `<nav>` does not
   * count, because `closest()` walks past the nav into whatever surrounds the
   * header. And Ctrl, Meta or Shift open the link in a new tab or window while
   * this page stays where it is, so the menu stays with it. The middle mouse
   * button needs no check: it fires `auxclick`, not `click`.
   */
  protected aufNavKlick(ereignis: MouseEvent): void {
    if (ereignis.ctrlKey || ereignis.metaKey || ereignis.shiftKey) return;
    const link = (ereignis.target as Element | null)?.closest('a');
    if (link && (ereignis.currentTarget as Element).contains(link)) this.open.set(false);
  }

  /**
   * Escape closes the open menu and puts the focus back on the burger button,
   * which is where the keyboard came from. Runs on the host, so it only sees
   * keys pressed inside the header, and does nothing while the menu is closed:
   * a header that is not menu-like must never swallow Escape or take focus.
   */
  protected aufEscape(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.knopf().nativeElement.focus();
  }
}
