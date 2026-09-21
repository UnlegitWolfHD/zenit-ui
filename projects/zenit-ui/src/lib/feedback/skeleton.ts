import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Platzhalter, solange Daten laden. Rein dekorativ, deshalb `aria-hidden`:
 * Der Container traegt `aria-busy` und den Text.
 */
@Component({
  selector: 'z-skeleton',
  template: ``,
  host: {
    'class': 'z-skel',
    '[class.z-skel--thumb]': `thumb()`,
    '[style.width]': `width() || null`,
    'aria-hidden': 'true',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZSkeleton {
  /** CSS-Laenge, zum Beispiel `40%` oder `64px`. Leer heisst volle Breite. */
  readonly width = input('');
  /** Quadrat statt Zeile, fuer die Bildflaeche einer Zeile. */
  readonly thumb = input(false, { transform: booleanAttribute });
}
