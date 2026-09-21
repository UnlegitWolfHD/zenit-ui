import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  DOCUMENT,
  ElementRef,
  inject,
  input,
} from '@angular/core';

/** Every bar on the page, so the tallest visible one sets the room to keep clear. */
const lebende = new Set<HTMLElement>();

/** Writes the height of the tallest visible bar, or removes the property. */
function schreibe(dokument: Document): void {
  const wurzel = dokument.documentElement;
  let hoechste = 0;
  for (const bar of lebende) {
    hoechste = Math.max(hoechste, bar.getBoundingClientRect().height);
  }
  if (hoechste > 0) {
    wurzel.style.setProperty('--z-stickybar', `${Math.round(hoechste)}px`);
  } else {
    wurzel.style.removeProperty('--z-stickybar');
  }
}

/**
 * Keeps price and next step in view at the bottom edge of small screens, and
 * carries exactly one button.
 *
 * Renders the class `z-stickybar` on the host, the price in
 * `.z-stickybar__price` with the summary of the selection in a `<small>`, and
 * the projected button beside it. `mobileOnly` adds `z-stickybar--mobile`,
 * which hides the bar from 900px on, where the summary sticks next to the form
 * instead. It sticks at `bottom: 0` on `surface-raised` with a 1px line above,
 * and casts no shadow.
 *
 * The button is the "Weiter" of the current step, "Kostenpflichtig bestellen"
 * in the last one; it triggers the same thing as its twin in the summary. The
 * bar also carries a bulk action in a list ("2 ausgewählt").
 *
 * @example
 * ```html
 * <z-sticky-bar price="7,74&nbsp;€" summary="Minecraft, 4 GB, alle 30 Tage" mobileOnly>
 *   <button zBtn="primary" type="button">Weiter</button>
 * </z-sticky-bar>
 * ```
 */
@Component({
  selector: 'z-sticky-bar',
  template: `
    <div class="z-stickybar__price">
      {{ price() }}
      @if (summary()) {
        <small>{{ summary() }}</small>
      }
    </div>
    <ng-content />
  `,
  host: {
    class: 'z-stickybar',
    '[class.z-stickybar--mobile]': `mobileOnly()`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZStickyBar {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly dokument = inject(DOCUMENT);

  constructor() {
    // The bar covers the bottom of the viewport, so a control focused behind it
    // would be invisible (WCAG 2.4.11). Its height is not a literal anywhere:
    // every bar measures itself, the tallest visible one lands in
    // --z-stickybar, and the stylesheet turns that into scroll-padding. A bar
    // that is hidden (a mobileOnly bar from 900px on) measures 0 and drops out
    // of the maximum by itself. ResizeObserver is missing on the server, where
    // there is no layout to keep clear either.
    const element = this.host.nativeElement;
    lebende.add(element);
    const beobachter =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(() => schreibe(this.dokument));

    afterRenderEffect(() => {
      beobachter?.observe(element);
      schreibe(this.dokument);
    });

    inject(DestroyRef).onDestroy(() => {
      beobachter?.disconnect();
      lebende.delete(element);
      schreibe(this.dokument);
    });
  }

  /**
   * The price, already formatted by the caller: comma as the decimal mark, a
   * non-breaking space before the currency. Shown in `mono-lg`.
   *
   * @default ''
   */
  readonly price = input('');

  /**
   * The selection in a few words, for example "Minecraft, 4 GB, alle 30 Tage".
   * Empty leaves the `<small>` out.
   *
   * @default ''
   */
  readonly summary = input('');

  /**
   * Hides the bar from 900px on, where `z-price-summary` sticks next to the
   * form. Leave it off for a bulk action bar, which is needed at every width.
   * Boolean attribute.
   *
   * @default false
   */
  readonly mobileOnly = input(false, { transform: booleanAttribute });
}
