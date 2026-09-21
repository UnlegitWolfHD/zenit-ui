import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
} from '@angular/core';
import { ZSpinner } from '../spinner';

export type ZButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

/**
 * Button auf `<button>` oder `<a>`. Der Ladezustand zeigt den Spinner vor dem
 * Text und sperrt die Schaltflaeche.
 */
@Component({
  selector: 'button[zBtn], a[zBtn]',
  imports: [ZSpinner],
  template: `@if (loading()) {<z-spinner />}<ng-content />`,
  host: {
    'class': 'z-btn',
    '[class.z-btn--primary]': `variante() === 'primary'`,
    '[class.z-btn--secondary]': `variante() === 'secondary'`,
    '[class.z-btn--ghost]': `variante() === 'ghost'`,
    '[class.z-btn--danger]': `variante() === 'danger'`,
    '[class.z-btn--sm]': `size() === 'sm'`,
    '[class.z-btn--lg]': `size() === 'lg'`,
    '[class.z-btn--icon]': `iconOnly()`,
    '[class.z-btn--block]': `block()`,
    '[attr.disabled]': `istLink || !gesperrt() ? null : ""`,
    '[attr.aria-disabled]': `ariaGesperrt || (istLink && gesperrt()) ? "true" : null`,
    '[attr.tabindex]': `istLink && gesperrt() ? "-1" : null`,
    '[attr.aria-busy]': `loading() ? "true" : null`,
    '(click)': `aufKlick($event)`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZButton {
  /** Leerer Wert bedeutet secondary. */
  readonly zBtn = input<ZButtonVariant | ''>('secondary');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly block = input(false, { transform: booleanAttribute });
  readonly iconOnly = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly istLink =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.nodeName === 'A';
  /**
   * Statisches `aria-disabled="true"` des Aufrufers. So bleibt ein `<button>`
   * fokussierbar und kann den Grund per Tooltip zeigen, was ein echtes
   * `disabled` verhindert. Ohne diese Abfrage loescht die Bindung das Attribut.
   */
  protected readonly ariaGesperrt =
    inject(new HostAttributeToken('aria-disabled'), { optional: true }) === 'true';
  protected readonly variante = computed<ZButtonVariant>(() => this.zBtn() || 'secondary');
  protected readonly gesperrt = computed(() => this.disabled() || this.loading());

  /**
   * Ein `<a>` und ein `<button aria-disabled="true">` bleiben klickbar. Der
   * Klick wird deshalb abgefangen, bevor ihn ein anderer Listener auf
   * demselben Element sieht (zum Beispiel routerLink). `href` bleibt
   * unangetastet.
   */
  protected aufKlick(ereignis: Event): void {
    if (this.ariaGesperrt || (this.istLink && this.gesperrt())) {
      ereignis.preventDefault();
      ereignis.stopImmediatePropagation();
    }
  }
}
