import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
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
    '[attr.aria-disabled]': `istLink && gesperrt() ? "true" : null`,
    '[attr.tabindex]': `istLink && gesperrt() ? "-1" : null`,
    '[attr.aria-busy]': `loading() ? "true" : null`,
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
  protected readonly variante = computed<ZButtonVariant>(() => this.zBtn() || 'secondary');
  protected readonly gesperrt = computed(() => this.disabled() || this.loading());
}
