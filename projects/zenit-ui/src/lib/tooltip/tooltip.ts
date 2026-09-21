import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  ComponentRef,
  DestroyRef,
  Directive,
  DOCUMENT,
  effect,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ZTooltipPanel } from './tooltip-panel';

/**
 * Grace period between leaving trigger or panel and closing. Long enough to
 * cross the gap with the pointer, short enough not to feel stuck.
 */
const NACHLAUF = 100;

let zaehler = 0;

/** The values of `overflow` that cut a child off at the edge of its box. */
const KLEMMT = new Set(['auto', 'scroll', 'hidden', 'clip', 'overlay']);

/** One box entirely beyond one of the edges of the other. */
function ausserhalb(
  kasten: DOMRect,
  rolle: { top: number; left: number; bottom: number; right: number },
): boolean {
  return (
    kasten.bottom <= rolle.top ||
    kasten.top >= rolle.bottom ||
    kasten.right <= rolle.left ||
    kasten.left >= rolle.right
  );
}

/** Two boxes at the same place on the screen: nothing moved the trigger. */
function unbewegt(a: DOMRect, b: DOMRect): boolean {
  return a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height;
}

/**
 * Short addition to a control. Opens the tooltip panel in a CDK overlay,
 * centered above the trigger with 8px gap, below it as the fallback position.
 * A scroll of a container the trigger sits in takes the panel back, in the page
 * as well as in an inner container such as the body of a scrolling dialog;
 * another scroller on the same screen leaves it alone. While the trigger holds
 * the focus the panel follows that scroll instead, steps aside while the
 * scroller covers the trigger and comes back once it can be seen again.
 *
 * Accessibility: the panel appears on pointer and focus. On leaving it does not
 * disappear at once but after 100ms, and entering the panel itself stops that
 * timer again, so the text can be read, selected and scrolled (WCAG 2.1
 * SC 1.4.13 "Hoverable"). The 8px between trigger and panel are the transparent
 * padding of the overlay pane (`.z-tooltip-pane`), so the pointer crosses the
 * panel instead of nothing; the position therefore carries no offset. While the
 * trigger holds the focus, the pointer leaving keeps the panel standing, since
 * it belongs to the focus then; `focusout` closes it at once unless the pointer
 * rests on trigger or panel, and Escape always closes at once, and only the
 * tooltip: the key stops there, so a dialog behind it needs a second Escape.
 * The id of the panel is added to `aria-describedby` of the trigger while the
 * panel hangs in the DOM and taken out again afterwards, because a permanent
 * reference would point at a missing id most of the time. Whatever the trigger
 * already carries there, a hint or an error of a `z-field` for example, stays
 * untouched. A
 * disabled button fires no events, so the surrounding element carries the
 * tooltip, and the same reason also stands as a sentence for keyboard users.
 *
 * @example
 * ```html
 * <button zBtn="ghost" iconOnly aria-label="Aktualisieren" zTooltip="Aktualisieren">
 *   <z-icon name="refresh" />
 * </button>
 *
 * <span zTooltip="Beispiel-Server 1 ist bereits gestoppt">
 *   <button zBtn="secondary" type="button" disabled>Stoppen</button>
 * </span>
 * ```
 */
@Directive({
  selector: '[zTooltip]',
  host: {
    '(mouseenter)': `aufZeiger(true)`,
    '(mouseleave)': `aufZeiger(false)`,
    '(focusin)': `zeige()`,
    '(focusout)': `aufFokusVerlust()`,
  },
})
export class ZTooltip {
  /**
   * The tooltip text, given as the value of the attribute. A change while the
   * panel is open reaches the panel. Empty means no tooltip: the panel is not
   * opened at all, and an open one closes.
   *
   * @default ''
   */
  readonly zTooltip = input('');

  protected readonly tooltipId = `z-tooltip-${++zaehler}`;
  protected readonly sichtbar = signal(false);

  private readonly overlay = inject(Overlay);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly dokument = inject(DOCUMENT);
  private overlayRef?: OverlayRef;
  private flaeche?: ComponentRef<ZTooltipPanel>;

  /** Where the pointer currently rests; both keep the panel open. */
  private ueberHost = false;
  private ueberPanel = false;
  private timer?: ReturnType<typeof setTimeout>;
  /** Takes the panel listeners with it on destroy. */
  private readonly abbruch = new AbortController();
  /** Lives only while the panel stands; see {@link horcheWaehrendOffen}. */
  private horcher?: AbortController;
  /** The trigger box the panel was hung on; a scroll that leaves it is none. */
  private verankert?: DOMRect;
  /** Watches `aria-describedby` while the panel stands; see {@link beschreibe}. */
  private beobachter?: MutationObserver;

  constructor() {
    // The text can change while the panel hangs in the overlay, for example
    // when the reason for a disabled button changes. Empty closes the panel,
    // because an empty tooltip opens none either.
    effect(() => {
      const text = this.zTooltip();
      if (!this.sichtbar()) {
        return;
      }
      if (text) {
        this.flaeche?.instance.text.set(text);
      } else {
        this.verstecke();
      }
    });

    // The overlay goes together with the trigger and takes the pending timer
    // and the panel listeners with it.
    inject(DestroyRef).onDestroy(() => {
      this.stoppeTimer();
      this.abbruch.abort();
      this.horcher?.abort();
      this.beobachter?.disconnect();
      // The trigger may outlive the directive, so it keeps its own description
      // and loses only the id of the panel.
      this.beschreibe(false);
      this.overlayRef?.dispose();
    });
  }

  protected aufZeiger(drueber: boolean): void {
    this.ueberHost = drueber;
    if (drueber) {
      this.zeige();
    } else {
      this.planeSchliessen();
    }
  }

  /**
   * The focus leaves the trigger. With the pointer still on trigger or panel
   * the hover keeps the panel and only leaving both takes it back.
   */
  protected aufFokusVerlust(): void {
    if (!this.ueberHost && !this.ueberPanel) {
      this.verstecke();
    }
  }

  protected zeige(): void {
    const text = this.zTooltip();
    if (!text) {
      return;
    }
    this.stoppeTimer();
    if (this.sichtbar()) {
      return;
    }
    this.zeigeFlaeche(text);
    this.horcheWaehrendOffen();
  }

  protected verstecke(): void {
    this.stoppeTimer();
    this.horcher?.abort();
    this.horcher = undefined;
    this.verankert = undefined;
    this.ueberPanel = false;
    this.verbergeFlaeche();
  }

  /** Panel into the overlay; the trigger box it belongs to is noted with it. */
  private zeigeFlaeche(text: string): void {
    this.overlayRef ??= this.erzeugeOverlay();
    this.flaeche = this.overlayRef.attach(new ComponentPortal(ZTooltipPanel));
    this.flaeche.instance.text.set(text);
    this.flaeche.instance.id.set(this.tooltipId);
    this.verankert = this.host.nativeElement.getBoundingClientRect();
    this.sichtbar.set(true);
    this.beschreibe(true);
    // The caller may rewrite the attribute while the panel stands: a binding of
    // its own, or the hint and the error of a `z-field` around the control.
    // Adding is idempotent, so answering the change cannot loop.
    this.beobachter ??= new MutationObserver(() => this.beschreibe(true));
    this.beobachter.observe(this.host.nativeElement, {
      attributes: true,
      attributeFilter: ['aria-describedby'],
    });
  }

  /** Panel out of the overlay. Whoever keeps listening stays listening. */
  private verbergeFlaeche(): void {
    if (!this.sichtbar()) {
      return;
    }
    this.beobachter?.disconnect();
    this.beschreibe(false);
    this.overlayRef?.detach();
    this.flaeche = undefined;
    this.sichtbar.set(false);
  }

  /**
   * Puts the id of the panel into `aria-describedby` of the trigger, or takes
   * it out again. The attribute is a list of ids and belongs to the caller: a
   * static one, a binding, or the hint and the error that a `z-field` links to
   * its control. Overwriting it would silently cut the control off from its own
   * description, so only this one token is added and removed.
   */
  private beschreibe(dazu: boolean): void {
    const wirt = this.host.nativeElement;
    const werte = (wirt.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .filter((wert) => wert && wert !== this.tooltipId);
    if (dazu) {
      werte.push(this.tooltipId);
    }
    if (werte.length) {
      wirt.setAttribute('aria-describedby', werte.join(' '));
    } else {
      wirt.removeAttribute('aria-describedby');
    }
  }

  /**
   * While the panel stands, every scroller around the trigger is listened to,
   * and Escape is caught before anything else sees it.
   *
   * Both listeners hang on the document in the CAPTURE phase. For the scroll
   * because an event on an inner element does not bubble: the `reposition`
   * strategy of the overlay builds on `ScrollDispatcher`, which only ever hears
   * the window and the containers a caller marked `cdkScrollable`, so a tooltip
   * inside the body of a dialog used to stand still while its trigger moved
   * away under it. For Escape because the keyboard dispatcher of the CDK sits
   * on `document.body` and would otherwise close the dialog behind the tooltip
   * with the same key press (WAI-ARIA Practices: the first Escape dismisses the
   * tooltip, the second the dialog).
   */
  private horcheWaehrendOffen(): void {
    if (this.horcher) {
      return;
    }
    this.horcher = new AbortController();
    const signal = this.horcher.signal;
    this.dokument.addEventListener('scroll', (ereignis) => this.aufScrollen(ereignis), {
      capture: true,
      passive: true,
      signal,
    });
    this.dokument.addEventListener(
      'keydown',
      (ereignis) => {
        if (ereignis.key !== 'Escape' || !this.sichtbar()) {
          return;
        }
        ereignis.stopPropagation();
        this.verstecke();
      },
      { capture: true, signal },
    );
  }

  /**
   * A scroll under the pointer takes the panel back, the way the native `title`
   * tooltip goes: one that lags behind its trigger is worse than none.
   *
   * Only a scroller the trigger sits in counts. `document` contains it too,
   * which is how a scroll of the page arrives, while the panel and every other
   * scroller of the screen (a console that follows its own log, a table beside
   * the trigger) do not move the trigger and are therefore ignored. An event
   * that leaves the trigger box exactly where it was changes nothing either:
   * the scroll that brought the trigger into view has already happened when the
   * panel goes up, and its event only arrives afterwards.
   *
   * The focus is the exception to closing. WCAG 2.1 SC 1.4.13 asks the content
   * to stand as long as the trigger keeps hover or focus, and the browser
   * itself scrolls a focused control into view, so the panel of a focused
   * trigger follows the scroll, steps aside while the scroller covers the
   * trigger and comes back once it can be seen again.
   */
  private aufScrollen(ereignis: Event): void {
    const ziel = ereignis.target as Node | null;
    const wirt = this.host.nativeElement;
    if (!this.overlayRef || !ziel?.contains(wirt)) {
      return;
    }
    const kasten = wirt.getBoundingClientRect();
    if (this.verankert && unbewegt(this.verankert, kasten)) {
      return;
    }
    this.verankert = kasten;
    if (!wirt.contains(this.dokument.activeElement)) {
      this.verstecke();
      return;
    }
    if (this.verdeckt(kasten)) {
      this.verbergeFlaeche();
    } else if (!this.sichtbar()) {
      this.zeigeFlaeche(this.zTooltip());
    } else {
      this.overlayRef.updatePosition();
    }
  }

  /**
   * Has the trigger left the visible part of anything that clips it? Not only
   * the scroller the event came from: with two scrollers inside each other the
   * inner one can hold the trigger out of sight while the outer one moves, and
   * a panel brought back then would float over foreign content. The viewport
   * counts as the outermost clip.
   */
  private verdeckt(kasten: DOMRect): boolean {
    const fenster = this.dokument.defaultView;
    if (
      ausserhalb(kasten, {
        top: 0,
        left: 0,
        bottom: fenster?.innerHeight ?? 0,
        right: fenster?.innerWidth ?? 0,
      })
    ) {
      return true;
    }
    for (
      let element = this.host.nativeElement.parentElement;
      element;
      element = element.parentElement
    ) {
      const stil = fenster?.getComputedStyle(element);
      const klemmt = !!stil && (KLEMMT.has(stil.overflowX) || KLEMMT.has(stil.overflowY));
      if (klemmt && ausserhalb(kasten, element.getBoundingClientRect())) {
        return true;
      }
    }
    return false;
  }

  /**
   * Closes after the grace period instead of at once, so the pointer can reach
   * the panel. A trigger holding the focus keeps the panel: the panel belongs
   * to that focus then and only `focusout` or Escape takes it back.
   */
  private planeSchliessen(): void {
    this.stoppeTimer();
    if (this.host.nativeElement.contains(this.dokument.activeElement)) {
      return;
    }
    this.timer = setTimeout(() => this.verstecke(), NACHLAUF);
  }

  private stoppeTimer(): void {
    clearTimeout(this.timer);
    this.timer = undefined;
  }

  /** Centered above, below as the fallback position. */
  private erzeugeOverlay(): OverlayRef {
    const ref = this.overlay.create({
      panelClass: 'z-tooltip-pane',
      positionStrategy: this.overlay
        .position()
        .flexibleConnectedTo(this.host)
        .withPositions([
          { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom' },
          { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top' },
        ]),
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    });
    // The panel hangs on the body, far outside the trigger, so it has to report
    // its own hover: entering stops the pending close, leaving starts a new
    // one. The listeners live as long as the overlay and go with the
    // AbortController on destroy.
    ref.overlayElement.addEventListener(
      'mouseenter',
      () => {
        this.ueberPanel = true;
        this.stoppeTimer();
      },
      { signal: this.abbruch.signal },
    );
    ref.overlayElement.addEventListener(
      'mouseleave',
      () => {
        this.ueberPanel = false;
        this.planeSchliessen();
      },
      { signal: this.abbruch.signal },
    );
    return ref;
  }
}
