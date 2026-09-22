import { effect, ElementRef, inject } from '@angular/core';

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
 * value, and gives back what stood there before when it no longer does.
 *
 * The rule for the caller: while the library input is set the library value
 * wins, while it is unset the caller's attribute stands. Setting both at once
 * is a conflict this does not arbitrate, and the library value wins as long as
 * it lasts.
 *
 * Runs in an injection context on the host element and reads `wert`
 * reactively, so it belongs in a field initialiser or a constructor.
 *
 * @internal Wiring inside the library, not part of the public API.
 */
export function leiheAttribut(attribut: string, wert: () => string | null): void {
  const wirt = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  /** What stood there before the library wrote; `undefined` while it has not. */
  let geliehen: string | null | undefined;
  effect(() => {
    const neu = wert();
    if (neu !== null) {
      if (geliehen === undefined) {
        geliehen = wirt.getAttribute(attribut);
      }
      if (wirt.getAttribute(attribut) !== neu) {
        wirt.setAttribute(attribut, neu);
      }
      return;
    }
    if (geliehen === undefined) {
      return;
    }
    const zurueck = geliehen;
    geliehen = undefined;
    if (zurueck === null) {
      wirt.removeAttribute(attribut);
    } else {
      wirt.setAttribute(attribut, zurueck);
    }
  });
}

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

  constructor(
    private readonly wirt: HTMLElement,
    private readonly attribut: string,
    /** Which end of the list this token keeps. */
    private readonly platz: 'vorn' | 'hinten',
  ) {}

  /**
   * Puts this writer's token into the list, or takes it out again with `null`.
   * Every other token stays, and none appears twice.
   */
  setze(token: string | null): void {
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
    this.beobachter ??= new MutationObserver(() => this.setze(this.meins));
    this.beobachter.observe(this.wirt, { attributes: true, attributeFilter: [this.attribut] });
  }

  /** Stops watching. Whatever stands in the attribute stays there. */
  loese(): void {
    this.beobachter?.disconnect();
    this.beobachter = undefined;
  }
}
