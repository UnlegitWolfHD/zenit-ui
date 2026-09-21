import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { ZButton } from '../button';
import { ZIcon } from '../icon';
import { ZToast, ZToastItem } from './toast';

/**
 * Steht einmal im Root-Template und zeigt die Toasts des Service. Liegt
 * `position: fixed` unten rechts, mobil unten ueber die volle Breite.
 */
@Component({
  selector: 'z-toast-outlet',
  imports: [ZButton, ZIcon],
  template: `
    @for (toast of toasts(); track toast.id) {
      <div
        class="z-toast"
        [class.z-toast--success]="toast.status === 'success'"
        [class.z-toast--danger]="toast.status === 'danger'"
        [attr.role]="toast.status === 'danger' ? 'alert' : 'status'"
      >
        @if (toast.icon) {
          <z-icon [name]="toast.icon" />
        }
        <span>{{ toast.text }}</span>
        @if (toast.actionLabel) {
          <button type="button" class="z-toast__action" (click)="aufAktion(toast)">
            {{ toast.actionLabel }}
          </button>
        }
        <button
          zBtn="ghost"
          size="sm"
          iconOnly
          type="button"
          class="z-toast__close"
          [attr.aria-label]="closeLabel()"
          (click)="dienst.dismiss(toast.id)"
        >
          <z-icon name="close" size="sm" />
        </button>
      </div>
    }
  `,
  host: { 'class': 'z-toast-outlet' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZToastOutlet {
  /** Ueberschreibbarer aria-Standard des Schliessen-Buttons. */
  readonly closeLabel = input('Schließen');

  protected readonly dienst = inject(ZToast);
  protected readonly toasts = this.dienst.toasts;

  protected aufAktion(toast: ZToastItem): void {
    toast.action?.();
    this.dienst.dismiss(toast.id);
  }
}
