import {
  afterRenderEffect,
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
export class ZSelect {
  readonly size = input<'sm' | 'md'>('md');

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly feld = inject(ZField, { optional: true });

  constructor() {
    // Das <select> ist projizierter Inhalt, ein Host-Binding kommt nicht an
    // es heran. Deshalb wird aria-describedby nach dem Rendern gesetzt.
    afterRenderEffect(() => {
      const ziel = this.el.nativeElement.querySelector('select');
      if (!ziel) {
        return;
      }
      const id = this.feld?.beschreibung() ?? null;
      if (id) {
        ziel.setAttribute('aria-describedby', id);
      } else {
        ziel.removeAttribute('aria-describedby');
      }
    });
  }
}
