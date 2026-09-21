import { Directive, ElementRef, inject } from '@angular/core';

declare const ngDevMode: boolean | undefined;

/**
 * The first tab stop of a page: a link that jumps past header and navigation
 * straight to the main content (`spec/guidelines/15-zustaende.md`, "Tastatur").
 *
 * The directive adds the class `z-skip-link` and nothing else. Text, `href` and
 * position in the document belong to the caller, because only the application
 * knows what its main content is called and where it starts. Put the link first
 * in the body, before the header.
 *
 * The class is what makes it work: `.z-root a` weighs (0,1,1) and beats any
 * application class on a link (0,1,0), so a skip link styled by hand keeps
 * `accent-text` and ends up red on red. The library's own rule
 * `.z-root a.z-skip-link` weighs (0,2,1) and wins.
 *
 * The link is invisible until it takes focus; then it becomes a block at the
 * top left, above everything else on the page.
 *
 * **The target needs `tabindex="-1"`.** Without it the browser moves the
 * viewport but leaves the focus where it was, and the next Tab goes back to the
 * second link of the header. In dev mode the directive checks the target on the
 * first focus and warns when it is missing or cannot take focus.
 *
 * @example
 * ```html
 * <a zSkipLink href="#inhalt">Zum Hauptinhalt springen</a>
 * <header>…</header>
 * <main id="inhalt" tabindex="-1">…</main>
 * ```
 */
@Directive({
  selector: 'a[zSkipLink]',
  host: {
    class: 'z-skip-link',
    '(focus)': 'zielPruefen()',
  },
})
export class ZSkipLink {
  private readonly element = inject<ElementRef<HTMLAnchorElement>>(ElementRef);

  /** The check runs once; a skip link is focused on every page visit. */
  private geprueft = false;

  /**
   * Dev-mode check of the link target, on the first focus. It runs that late on
   * purpose: the target usually lives in the same template, and at construction
   * time it is not in the document yet.
   */
  protected zielPruefen(): void {
    if (this.geprueft || (typeof ngDevMode !== 'undefined' && !ngDevMode)) {
      return;
    }
    this.geprueft = true;

    const element = this.element.nativeElement;
    // getAttribute, not .hash: a router link writes the fragment through the
    // property, and both spellings end up in the attribute anyway.
    const fragment = (element.getAttribute('href') ?? '').split('#')[1];
    if (!fragment) {
      console.warn(
        `zenit-ui: zSkipLink without a target fragment (href="${element.getAttribute('href') ?? ''}").`,
      );
      return;
    }

    const ziel = element.ownerDocument.getElementById(decodeURIComponent(fragment));
    if (!ziel) {
      console.warn(`zenit-ui: zSkipLink points at #${fragment}, which is not in the document.`);
      return;
    }

    // Anything that can take focus either is focusable by default or says so
    // with tabindex. A skip link target is a <main> or a <div>, so in practice
    // this is the missing tabindex="-1".
    const fokussierbar =
      ziel.hasAttribute('tabindex') ||
      ziel.matches(
        'a[href], area[href], button, input, select, textarea, iframe, [contenteditable]',
      );
    if (!fokussierbar) {
      console.warn(
        `zenit-ui: the target #${fragment} of zSkipLink cannot take focus. Give it tabindex="-1", otherwise only the viewport moves.`,
      );
    }
  }
}
