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

/** Every bar on the page, so the tallest stuck one sets the room to keep clear. */
const lebende = new Set<HTMLElement>();

/** The one scroll and resize listener all bars share, as long as one lives. */
let horcher: AbortController | undefined;

/**
 * Marks every bar that really lies at the bottom edge of the viewport with
 * `data-stuck` and writes the height of the tallest of them, or removes the
 * property. A bar that stands in the page instead covers nothing: a framed demo
 * bar, a bar above the fold, and a `mobileOnly` bar from 900px on, which is
 * `display: none` and measures 0 everywhere.
 */
function miss(dokument: Document): void {
  const fenster = dokument.defaultView;
  let hoechste = 0;
  for (const bar of lebende) {
    const kasten = bar.getBoundingClientRect();
    const klebt =
      !!fenster && kasten.height > 0 && Math.abs(kasten.bottom - fenster.innerHeight) <= 1;
    bar.toggleAttribute('data-stuck', klebt);
    if (klebt) {
      hoechste = Math.max(hoechste, kasten.height);
    }
  }
  const wurzel = dokument.documentElement;
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
 * and casts no shadow. While it really lies at the bottom edge of the viewport
 * it carries the attribute `data-stuck`, which is what the stylesheet keeps
 * scroll room for.
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
    // A bar at the bottom edge of the viewport covers what is behind it, so a
    // control focused there would be invisible (WCAG 2.4.11). Neither the
    // height nor the fact that it sticks is a literal anywhere: every bar
    // measures both, marks itself with data-stuck while it sticks, and the
    // tallest stuck one lands in --z-stickybar, which the stylesheet turns into
    // scroll-padding. Whether a bar sticks changes with scrolling and with the
    // height of the page, so one passive listener per document watches scroll
    // (in the capture phase, so an inner scroller counts too) and resize, and a
    // ResizeObserver watches the bar and the document. ResizeObserver is
    // missing on the server, where there is no layout to keep clear either.
    const element = this.host.nativeElement;
    lebende.add(element);
    const fenster = this.dokument.defaultView;
    const beobachter =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(() => miss(this.dokument));

    afterRenderEffect(() => {
      beobachter?.observe(element);
      beobachter?.observe(this.dokument.documentElement);
      if (fenster && !horcher) {
        horcher = new AbortController();
        for (const art of ['scroll', 'resize'] as const) {
          fenster.addEventListener(art, () => miss(this.dokument), {
            capture: true,
            passive: true,
            signal: horcher.signal,
          });
        }
      }
      miss(this.dokument);
    });

    inject(DestroyRef).onDestroy(() => {
      beobachter?.disconnect();
      lebende.delete(element);
      if (!lebende.size) {
        horcher?.abort();
        horcher = undefined;
        // Nothing is left to keep room for, and saying so needs no measuring.
        this.dokument.documentElement.style.removeProperty('--z-stickybar');
        return;
      }
      // Destroying measures nothing. The bars that stay have not moved yet —
      // this runs while the view is being torn down, so their boxes are still
      // the ones from before — and on the server there is no box at all:
      // `getBoundingClientRect` does not exist there, and the application is
      // destroyed right after rendering, which made every page with two bars
      // fail. The remaining bars are measured in the next frame instead, which
      // the server never reaches, because its window has no
      // `requestAnimationFrame`.
      fenster?.requestAnimationFrame?.(() => miss(this.dokument));
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
