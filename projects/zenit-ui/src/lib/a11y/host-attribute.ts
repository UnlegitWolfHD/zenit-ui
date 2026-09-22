import { DestroyRef, effect, ElementRef, inject } from '@angular/core';

declare const ngDevMode: boolean | undefined;

/**
 * An attribute a caller may plausibly write is never owned by a host binding.
 * `[attr.role]`, `[attr.aria-label]` or `[attr.tabindex]` with an expression
 * that evaluates to `null` **removes** the attribute, so a value the caller
 * wrote, static or bound, is silently deleted the moment the library has
 * nothing of its own to say there. The two helpers here are the two ways out.
 *
 * @module
 */

/**
 * Borrows a single-valued attribute: the library writes it only while it has a
 * value, and gives back the **latest** value of the caller when it no longer
 * does.
 *
 * The rule for the caller: while the library input is set the library value
 * wins, while it is unset the caller's attribute stands, static as well as
 * bound. A binding of the caller keeps writing while the library holds the
 * attribute, and every value it writes would otherwise win, so a
 * `MutationObserver` runs for as long as the value is borrowed: it notes the
 * new value as the one to give back and asserts the library value again. It
 * runs only while borrowed, and writing the value that already stands there is
 * skipped, so it cannot answer its own record; `takeRecords` drops the echo of
 * an own write for the same reason.
 *
 * Runs in an injection context on the host element and reads `wert`
 * reactively, so it belongs in a field initialiser or a constructor.
 *
 * @internal Wiring inside the library, not part of the public API.
 */
export function leiheAttribut(attribut: string, wert: () => string | null): void {
  const wirt = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  /** What the caller last wrote, and what it gets back; `undefined` while free. */
  let geliehen: string | null | undefined;
  /** The library value currently asserted, `null` while nothing is borrowed. */
  let meins: string | null = null;
  let beobachter: MutationObserver | undefined;

  /** A write of the caller landed while the library held the attribute. */
  const halte = (): void => {
    const steht = wirt.getAttribute(attribut);
    if (meins === null || steht === meins) {
      return;
    }
    geliehen = steht;
    wirt.setAttribute(attribut, meins);
    beobachter?.takeRecords();
  };

  effect(() => {
    const neu = wert();
    if (neu !== null) {
      const steht = wirt.getAttribute(attribut);
      // Anything but the library's own value is the caller's latest word, also
      // when the observer has not been called for it yet.
      if (geliehen === undefined || steht !== meins) {
        geliehen = steht;
      }
      meins = neu;
      if (steht !== neu) {
        wirt.setAttribute(attribut, neu);
        beobachter?.takeRecords();
      }
      // Not every environment has a MutationObserver: on the server the value
      // is written, only the re-assertion against a caller is missing.
      if (!beobachter && typeof MutationObserver !== 'undefined') {
        beobachter = new MutationObserver(halte);
      }
      beobachter?.observe(wirt, { attributes: true, attributeFilter: [attribut] });
      return;
    }
    beobachter?.disconnect();
    if (geliehen === undefined) {
      return;
    }
    // A value the caller wrote after the last observer run still counts.
    if (wirt.getAttribute(attribut) !== meins) {
      geliehen = wirt.getAttribute(attribut);
    }
    const zurueck = geliehen;
    geliehen = undefined;
    meins = null;
    if (zurueck === null) {
      wirt.removeAttribute(attribut);
    } else {
      wirt.setAttribute(attribut, zurueck);
    }
  });

  inject(DestroyRef).onDestroy(() => beobachter?.disconnect());
}

/**
 * Which end of which attribute is taken on an element, so a second writer on
 * the same end is caught instead of freezing the page. Development only; the
 * element is the key, so nothing is kept alive by it.
 */
const BELEGT = new WeakMap<Element, Set<string>>();

/**
 * One token of the library inside an attribute that holds a list of them,
 * `aria-describedby` above all. Several writers share such an attribute: the
 * caller writes its own ids, a `z-field` links its hint or error, a `zTooltip`
 * adds the id of its panel while it stands. Each of them owns exactly one
 * token and leaves the others alone.
 *
 * The token keeps a fixed end of the list, which is what makes two writers on
 * the same element settle instead of pushing each other around: a description
 * that belongs to the control sits at the front, a passing addition such as a
 * tooltip at the back, and the caller's own tokens keep their order in
 * between.
 *
 * **The invariant: at most one writer per attribute and end on one element.**
 * Two writers claiming the same end move the token past each other for as long
 * as the page lives, which is a frozen tab, not a wrong attribute. A second
 * claim on the same end therefore throws in development; in production the
 * check is compiled away, so keep it covered by a test.
 *
 * While a token stands, a `MutationObserver` watches the attribute, because
 * the caller may rewrite it as a whole: a binding of its own going to another
 * value deletes every foreign token in one go, and the token is put back then.
 * Writing is skipped when nothing changes and the record of an own write is
 * dropped with `takeRecords`, so the observer cannot answer itself: Chromium
 * queues a record for a `setAttribute` with an unchanged value as well, and
 * answering that record with another write freezes the tab in the microtask
 * checkpoint.
 *
 * @internal Wiring inside the library, not part of the public API.
 */
export class ZTokenAttribut {
  /** The token this writer currently has in the list, `null` for none. */
  private meins: string | null = null;
  /** Lives only while a token stands. */
  private beobachter?: MutationObserver;
  /** Whether this writer currently holds the end; see {@link BELEGT}. */
  private beansprucht = false;
  private readonly schluessel: string;

  constructor(
    private readonly wirt: HTMLElement,
    private readonly attribut: string,
    /** Which end of the list this token keeps. */
    private readonly platz: 'vorn' | 'hinten',
  ) {
    this.schluessel = `${attribut}:${platz}`;
  }

  /**
   * Puts this writer's token into the list, or takes it out again with `null`.
   * Every other token stays, and none appears twice.
   */
  setze(token: string | null): void {
    this.beanspruche(token !== null);
    const steht = this.wirt.getAttribute(this.attribut);
    const werte = (steht ?? '')
      .split(/\s+/)
      .filter((wert) => wert && wert !== this.meins && wert !== token);
    if (token) {
      if (this.platz === 'vorn') {
        werte.unshift(token);
      } else {
        werte.push(token);
      }
    }
    this.meins = token;
    const soll = werte.join(' ');
    if (soll !== (steht ?? '')) {
      if (soll) {
        this.wirt.setAttribute(this.attribut, soll);
      } else if (steht !== null) {
        this.wirt.removeAttribute(this.attribut);
      }
      // The record of this write is the observer's own echo and would call it
      // one more time for nothing. `takeRecords` drops exactly that one: no
      // other script can have run since the write, and everything the caller
      // queued before was already delivered to the callback that is running.
      this.beobachter?.takeRecords();
    }
    if (!token) {
      this.loese();
      return;
    }
    // Not every environment has a MutationObserver: on the server the token is
    // written, only the answer to a caller rewriting the attribute is missing.
    if (!this.beobachter && typeof MutationObserver !== 'undefined') {
      this.beobachter = new MutationObserver(() => this.setze(this.meins));
    }
    this.beobachter?.observe(this.wirt, { attributes: true, attributeFilter: [this.attribut] });
  }

  /** Claims this end of the list, or lets it go. Development only. */
  private beanspruche(dazu: boolean): void {
    if (typeof ngDevMode !== 'undefined' && !ngDevMode) {
      return;
    }
    if (this.beansprucht === dazu) {
      return;
    }
    const belegt = BELEGT.get(this.wirt) ?? new Set<string>();
    if (dazu && belegt.has(this.schluessel)) {
      throw new Error(
        `zenit-ui: two writers keep the ${this.platz === 'vorn' ? 'front' : 'back'} of ` +
          `"${this.attribut}" on the same element. One of them has to take the other end, ` +
          `otherwise the two move their token past each other for as long as the page lives.`,
      );
    }
    if (dazu) {
      belegt.add(this.schluessel);
      BELEGT.set(this.wirt, belegt);
    } else {
      belegt.delete(this.schluessel);
    }
    this.beansprucht = dazu;
  }

  /** Stops watching. Whatever stands in the attribute stays there. */
  loese(): void {
    this.beobachter?.disconnect();
    this.beobachter = undefined;
  }
}
