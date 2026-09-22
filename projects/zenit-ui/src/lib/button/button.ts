import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
} from '@angular/core';
import { ZSpinner } from '../spinner';

/**
 * The four button variants. `primary` is the one main action per screen,
 * `secondary` every further action, `ghost` cancel and icon actions in
 * toolbars, `danger` only irreversible actions.
 */
export type ZButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

/**
 * Triggers an action, on a native `<button>` or on an `<a>`. The component
 * brings no element of its own: it attaches to the host through the attribute
 * `zBtn`, so links keep their `href` and their routing.
 *
 * Renders the class `z-btn` on the host plus one variant class
 * (`z-btn--primary`, `z-btn--secondary`, `z-btn--ghost`, `z-btn--danger`) and,
 * where set, `z-btn--sm`, `z-btn--lg`, `z-btn--icon` and `z-btn--block`. Size
 * `md` adds no class. The content is projected as is; while {@link loading} is
 * set a `z-spinner` sits in front of it.
 *
 * Accessibility: on a `<button>`, {@link disabled} and {@link loading} set the
 * native `disabled` attribute; {@link loading} additionally sets
 * `aria-busy="true"`. An `<a>` cannot be disabled natively, so it gets
 * `aria-disabled="true"` and `tabindex="-1"` instead, and the click is
 * swallowed. A caller may also write a static `aria-disabled="true"` onto a
 * `<button>`: the button then stays focusable and can explain the reason in a
 * tooltip, which a real `disabled` would prevent, and its click is swallowed
 * as well. Icon-only buttons need an `aria-label` from the caller.
 *
 * The component never touches `type`: the native default stays, so a
 * `<button zBtn>` inside a form submits it. A button that only triggers an
 * action therefore carries `type="button"` from the caller.
 *
 * @example
 * ```html
 * <button zBtn="primary" size="lg" [loading]="laeuft()">Server erstellen</button>
 * <button zBtn="ghost" iconOnly size="sm" aria-label="Mehr"><z-icon name="more_vert" /></button>
 * <a zBtn routerLink="/user/server">Alle anzeigen</a>
 * ```
 */
@Component({
  selector: 'button[zBtn], a[zBtn]',
  imports: [ZSpinner],
  template: `@if (loading()) {
      <z-spinner />
    }
    <ng-content />`,
  host: {
    class: 'z-btn',
    '[class.z-btn--primary]': `variante() === 'primary'`,
    '[class.z-btn--secondary]': `variante() === 'secondary'`,
    '[class.z-btn--ghost]': `variante() === 'ghost'`,
    '[class.z-btn--danger]': `variante() === 'danger'`,
    '[class.z-btn--sm]': `size() === 'sm'`,
    '[class.z-btn--lg]': `size() === 'lg'`,
    '[class.z-btn--icon]': `iconOnly()`,
    '[class.z-btn--block]': `block()`,
    '[attr.disabled]': `istLink || !gesperrt() ? null : ""`,
    '[attr.aria-disabled]': `ariaGesperrt || (istLink && gesperrt()) ? "true" : null`,
    '[attr.aria-busy]': `loading() ? "true" : null`,
    '(click)': `aufKlick($event)`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZButton {
  /**
   * Variant of the button. The bare attribute `zBtn` carries the empty string,
   * which counts as `secondary`, so `<button zBtn>` is the secondary button.
   *
   * @default 'secondary'
   */
  readonly zBtn = input<ZButtonVariant | ''>('secondary');

  /**
   * Height of the button: `sm` for toolbars, `md` everywhere, `lg` only in the
   * hero and in the closing call to action. `md` adds no class.
   *
   * @default 'md'
   */
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  /**
   * Stretches the button over the full width of its container, for a form on a
   * phone. Boolean attribute.
   *
   * @default false
   */
  readonly block = input(false, { transform: booleanAttribute });

  /**
   * Square button that holds an icon and no text. The caller supplies the
   * `aria-label`. Boolean attribute.
   *
   * @default false
   */
  readonly iconOnly = input(false, { transform: booleanAttribute });

  /**
   * Shows a spinner in front of the content, sets `aria-busy="true"` and locks
   * the button just like {@link disabled}. Boolean attribute.
   *
   * @default false
   */
  readonly loading = input(false, { transform: booleanAttribute });

  /**
   * Locks the button. On a `<button>` this is the native `disabled` attribute,
   * on an `<a>` it is `aria-disabled="true"` with `tabindex="-1"` and a
   * swallowed click; a `tabindex` of the caller's own comes back when the lock
   * goes. Boolean attribute.
   *
   * @default false
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly istLink =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.nodeName === 'A';
  /**
   * Static `aria-disabled="true"` written by the caller. That keeps a
   * `<button>` focusable so it can show the reason in a tooltip, which a real
   * `disabled` would prevent. Without reading it here the host binding would
   * delete the attribute.
   */
  protected readonly ariaGesperrt =
    inject(new HostAttributeToken('aria-disabled'), { optional: true }) === 'true';
  protected readonly variante = computed<ZButtonVariant>(() => this.zBtn() || 'secondary');
  protected readonly gesperrt = computed(() => this.disabled() || this.loading());

  constructor() {
    const wirt = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    /** What the caller last wrote, and what it gets back when the lock goes. */
    let geliehen: string | null = null;
    let gesetzt = false;
    const sperren = (): void => {
      if (!gesetzt) {
        geliehen = wirt.getAttribute('tabindex');
        gesetzt = true;
      }
      if (wirt.getAttribute('tabindex') !== '-1') {
        wirt.setAttribute('tabindex', '-1');
      }
    };
    // A binding of the caller keeps writing while the link is locked, and every
    // value it writes would put the locked link back into the tab order. The
    // observer notes the new value and asserts the lock again; it runs only
    // while the link is locked, and writing `-1` over `-1` is skipped, so it
    // cannot answer its own record.
    let beobachter: MutationObserver | undefined;
    const halte = (): void => {
      geliehen = wirt.getAttribute('tabindex');
      if (geliehen === '-1') {
        return;
      }
      sperren();
    };
    // A locked link is taken out of the tab order, and only then is `tabindex`
    // touched at all: a host binding would write on every change and thereby
    // delete a `tabindex` the caller wrote, static or bound. The lock borrows
    // the attribute and gives back what stood there last.
    effect(() => {
      if (this.istLink && this.gesperrt()) {
        sperren();
        // Not every environment has a MutationObserver: on the server the lock
        // writes `tabindex="-1"` into the rendered HTML, only the re-assertion
        // against a caller is missing. Constructing it eagerly threw a
        // ReferenceError there and took every page with a locked link down.
        if (!beobachter && typeof MutationObserver !== 'undefined') {
          beobachter = new MutationObserver(halte);
        }
        beobachter?.observe(wirt, { attributes: true, attributeFilter: ['tabindex'] });
        return;
      }
      beobachter?.disconnect();
      if (!gesetzt) {
        return;
      }
      gesetzt = false;
      if (geliehen === null) {
        wirt.removeAttribute('tabindex');
      } else {
        wirt.setAttribute('tabindex', geliehen);
      }
    });
    inject(DestroyRef).onDestroy(() => beobachter?.disconnect());
  }

  /**
   * An `<a>` and a `<button aria-disabled="true">` stay clickable. The click is
   * therefore caught before another listener on the same element sees it (for
   * example `routerLink`). `href` is left untouched.
   */
  protected aufKlick(ereignis: Event): void {
    if (this.ariaGesperrt || (this.istLink && this.gesperrt())) {
      ereignis.preventDefault();
      ereignis.stopImmediatePropagation();
    }
  }
}
