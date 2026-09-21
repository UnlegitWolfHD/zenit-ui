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

/**
 * Short addition to a control. Opens the tooltip panel in a CDK overlay,
 * centered above the trigger with 8px gap, below it as the fallback position.
 * A scroll anywhere around the trigger takes the panel back, in the page as
 * well as in an inner container such as the body of a scrolling dialog; only
 * while the trigger holds the focus does the panel follow the scroll instead,
 * until the trigger has left the scroller.
 *
 * Accessibility: the panel appears on pointer and focus. On leaving it does not
 * disappear at once but after 100ms, and entering the panel itself stops that
 * timer again, so the text can be read, selected and scrolled (WCAG 2.1
 * SC 1.4.13 "Hoverable"). The 8px between trigger and panel are the transparent
 * padding of the overlay pane (`.z-tooltip-pane`), so the pointer crosses the
 * panel instead of nothing; the position therefore carries no offset. While the
 * trigger holds the focus, the pointer leaving keeps the panel standing, since
 * it belongs to the focus then; `focusout` closes it at once unless the pointer
 * rests on trigger or panel, and Escape always closes at once.
 * `aria-describedby` is only present while the panel hangs in the DOM, because
 * a permanent reference would point at a missing id most of the time. A
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
    '(document:keydown.escape)': `verstecke()`,
    '[attr.aria-describedby]': `sichtbar() ? tooltipId : null`,
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
  /** Lives only while the panel stands; see {@link horcheAufScrollen}. */
  private scrollHorcher?: AbortController;
  /** When the panel went up, on the clock of `Event.timeStamp`. */
  private seit = 0;

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
      this.scrollHorcher?.abort();
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
    this.overlayRef ??= this.erzeugeOverlay();
    this.flaeche = this.overlayRef.attach(new ComponentPortal(ZTooltipPanel));
    this.flaeche.instance.text.set(text);
    this.flaeche.instance.id.set(this.tooltipId);
    this.sichtbar.set(true);
    this.horcheAufScrollen();
  }

  protected verstecke(): void {
    this.stoppeTimer();
    if (!this.sichtbar()) {
      return;
    }
    this.scrollHorcher?.abort();
    this.scrollHorcher = undefined;
    this.ueberPanel = false;
    this.overlayRef?.detach();
    this.flaeche = undefined;
    this.sichtbar.set(false);
  }

  /**
   * While the panel stands, every scroller around the trigger is listened to.
   * The listener hangs on the document in the CAPTURE phase, because a scroll
   * event on an inner element does not bubble: the `reposition` strategy of the
   * overlay builds on `ScrollDispatcher`, which only ever hears the window and
   * the containers a caller marked `cdkScrollable`. A tooltip inside the body of
   * a dialog therefore used to stand still while its trigger moved away under
   * it. Capture hears every scroller without asking any caller to annotate one.
   */
  private horcheAufScrollen(): void {
    this.seit = this.dokument.defaultView?.performance.now() ?? 0;
    this.scrollHorcher = new AbortController();
    this.dokument.addEventListener('scroll', (ereignis) => this.aufScrollen(ereignis), {
      capture: true,
      passive: true,
      signal: this.scrollHorcher.signal,
    });
  }

  /**
   * A scroll under the pointer takes the panel back, the way the native `title`
   * tooltip goes: one that lags behind its trigger is worse than none. The
   * focus is the exception, because WCAG 2.1 SC 1.4.13 "Hoverable" asks the
   * content to stand as long as the trigger keeps hover or focus, and the
   * browser itself scrolls a focused control into view. A focused trigger
   * therefore keeps its panel, which follows along and only goes once the
   * trigger has left the scroller. A scroll inside the panel is not a scroll of
   * the trigger and changes nothing, and neither does one that happened before
   * the panel went up: a browser scrolls a control into view as it is focused,
   * and that event only arrives afterwards, so without the timestamp the panel
   * would close under the very hand that opened it.
   */
  private aufScrollen(ereignis: Event): void {
    const ziel = ereignis.target as Node | null;
    if (
      !this.overlayRef ||
      ereignis.timeStamp < this.seit ||
      (ziel && this.overlayRef.overlayElement.contains(ziel))
    ) {
      return;
    }
    if (this.host.nativeElement.contains(this.dokument.activeElement) && !this.verdeckt(ziel)) {
      this.overlayRef.updatePosition();
      return;
    }
    this.verstecke();
  }

  /**
   * Has the trigger left the visible box of the scroller the event came from?
   * The page reports its scroll on the document, and in some engines on the
   * root element or the body; all three mean the viewport.
   */
  private verdeckt(ziel: Node | null): boolean {
    const seite =
      !(ziel instanceof Element) ||
      ziel === this.dokument.documentElement ||
      ziel === this.dokument.body;
    const fenster = this.dokument.defaultView;
    const rolle = seite
      ? { top: 0, left: 0, bottom: fenster?.innerHeight ?? 0, right: fenster?.innerWidth ?? 0 }
      : ziel.getBoundingClientRect();
    const trigger = this.host.nativeElement.getBoundingClientRect();
    return (
      trigger.bottom <= rolle.top ||
      trigger.top >= rolle.bottom ||
      trigger.right <= rolle.left ||
      trigger.left >= rolle.right
    );
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
