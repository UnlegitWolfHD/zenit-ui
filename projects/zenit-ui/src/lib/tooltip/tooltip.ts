import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  ComponentRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  signal,
} from '@angular/core';
import { ZTooltipPanel } from './tooltip-panel';

/** Gap between trigger and panel, matches `space-2`. */
const ABSTAND = 8;

let zaehler = 0;

/**
 * Short addition to a control. Opens the tooltip panel in a CDK overlay,
 * centered above the trigger with 8px gap, below it as the fallback position,
 * and repositions it on scroll.
 *
 * Accessibility: the panel appears on pointer and focus and disappears on
 * mouse leave, focus loss and Escape. `aria-describedby` is only present while
 * the panel hangs in the DOM, because a permanent reference would point at a
 * missing id most of the time. A disabled button fires no events, so the
 * surrounding element carries the tooltip, and the same reason also stands as a
 * sentence for keyboard users.
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
    '(mouseenter)': `zeige()`,
    '(mouseleave)': `verstecke()`,
    '(focusin)': `zeige()`,
    '(focusout)': `verstecke()`,
    '(document:keydown.escape)': `verstecke()`,
    '[attr.aria-describedby]': `sichtbar() ? tooltipId : null`,
  },
})
export class ZTooltip implements OnDestroy {
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
  private overlayRef?: OverlayRef;
  private flaeche?: ComponentRef<ZTooltipPanel>;

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
  }

  protected zeige(): void {
    const text = this.zTooltip();
    if (!text || this.sichtbar()) {
      return;
    }
    this.overlayRef ??= this.erzeugeOverlay();
    this.flaeche = this.overlayRef.attach(new ComponentPortal(ZTooltipPanel));
    this.flaeche.instance.text.set(text);
    this.flaeche.instance.id.set(this.tooltipId);
    this.sichtbar.set(true);
  }

  protected verstecke(): void {
    if (!this.sichtbar()) {
      return;
    }
    this.overlayRef?.detach();
    this.flaeche = undefined;
    this.sichtbar.set(false);
  }

  /**
   * Disposes the overlay together with the trigger.
   *
   * @internal Angular lifecycle hook.
   */
  ngOnDestroy(): void {
    this.overlayRef?.dispose();
  }

  /** Centered above, below as the fallback position. */
  private erzeugeOverlay(): OverlayRef {
    return this.overlay.create({
      positionStrategy: this.overlay
        .position()
        .flexibleConnectedTo(this.host)
        .withPositions([
          {
            originX: 'center',
            originY: 'top',
            overlayX: 'center',
            overlayY: 'bottom',
            offsetY: -ABSTAND,
          },
          {
            originX: 'center',
            originY: 'bottom',
            overlayX: 'center',
            overlayY: 'top',
            offsetY: ABSTAND,
          },
        ]),
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    });
  }
}
