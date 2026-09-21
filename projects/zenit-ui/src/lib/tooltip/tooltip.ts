import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  inject,
  input,
  OnDestroy,
  signal,
} from '@angular/core';

/** Abstand zwischen Ausloeser und Flaeche, entspricht `space-2`. */
const ABSTAND = 8;

let zaehler = 0;

/**
 * Die Flaeche des Tooltips. Haengt im CDK-Overlay am Body, nicht im
 * Seitenfluss, und wird nur von der Direktive `zTooltip` erzeugt.
 */
@Component({
  selector: 'z-tooltip',
  template: `{{ text() }}`,
  host: {
    'class': 'z-tooltip',
    'role': 'tooltip',
    '[attr.id]': `id()`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZTooltipPanel {
  readonly text = signal('');
  readonly id = signal('');
}

/**
 * Kurzer Zusatz an einem Bedienelement. Erscheint bei Zeiger und Fokus,
 * verschwindet bei Verlassen, Fokusverlust und Escape.
 *
 * `aria-describedby` steht nur, solange die Flaeche im DOM haengt. Ein
 * dauerhafter Verweis zeigte sonst die meiste Zeit auf eine id, die es nicht
 * gibt.
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
  /** Der Text. Leer heisst: kein Tooltip. */
  readonly zTooltip = input('');

  protected readonly tooltipId = `z-tooltip-${++zaehler}`;
  protected readonly sichtbar = signal(false);

  private readonly overlay = inject(Overlay);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private overlayRef?: OverlayRef;

  protected zeige(): void {
    const text = this.zTooltip();
    if (!text || this.sichtbar()) {
      return;
    }
    this.overlayRef ??= this.erzeugeOverlay();
    const flaeche = this.overlayRef.attach(new ComponentPortal(ZTooltipPanel));
    flaeche.instance.text.set(text);
    flaeche.instance.id.set(this.tooltipId);
    this.sichtbar.set(true);
  }

  protected verstecke(): void {
    if (!this.sichtbar()) {
      return;
    }
    this.overlayRef?.detach();
    this.sichtbar.set(false);
  }

  ngOnDestroy(): void {
    this.overlayRef?.dispose();
  }

  /** Oben mittig, darunter als Ausweichlage. */
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
