import {
  AfterContentChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { ZField } from './field';

/** Huelle um ein natives `<select>`. Nativ wegen Tastatur und Systemrad. */
@Component({
  selector: 'z-select',
  template: `<ng-content />`,
  host: {
    'class': 'z-select',
    '[class.z-select--sm]': `size() === 'sm'`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZSelect implements AfterContentChecked {
  readonly size = input<'sm' | 'md'>('md');

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly feld = inject(ZField, { optional: true });

  /**
   * Das <select> ist projizierter Inhalt, ein Host-Binding kommt nicht an es
   * heran. Content-Haken laufen in der Ansicht, die den Inhalt deklariert.
   * Dieser Haken greift deshalb in beiden Faellen: wenn sich error oder hint
   * aendern, und wenn das <select> erst spaeter hinter einem @if entsteht.
   * Kein Signal-Tracking noetig, darum auch kein Wettlauf mit dem Waechter.
   */
  ngAfterContentChecked(): void {
    const id = this.feld?.beschreibung() ?? null;
    const ziel = this.el.nativeElement.querySelector('select');
    if (!ziel) {
      return;
    }
    if (id) {
      ziel.setAttribute('aria-describedby', id);
    } else {
      ziel.removeAttribute('aria-describedby');
    }
  }
}
