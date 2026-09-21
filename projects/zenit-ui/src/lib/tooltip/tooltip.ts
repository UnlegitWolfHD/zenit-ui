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
 * centered above the trigger with 8px gap, below it as the fallback position,
 * and repositions it on scroll.
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
  }

  protected verstecke(): void {
    this.stoppeTimer();
    if (!this.sichtbar()) {
      return;
    }
    this.ueberPanel = false;
    this.overlayRef?.detach();
    this.flaeche = undefined;
    this.sichtbar.set(false);
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
