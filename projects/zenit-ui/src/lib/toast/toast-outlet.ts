import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { ZButton } from '../button';
import { ZIcon } from '../icon';
import { ZToast, ZToastItem } from './toast';

/**
 * Stands once in the root template and renders the toasts of the `ZToast`
 * service. Sits `position: fixed` in the bottom right corner, on mobile at the
 * bottom across the full width.
 *
 * Renders a host with the class `z-toast-outlet` and per toast a `div.z-toast`
 * plus `z-toast--success` or `z-toast--danger`, an optional `z-icon`, the text,
 * an optional `button.z-toast__action` and the close button
 * `button.z-toast__close` (ghost, `sm`, icon only).
 *
 * Accessibility: a `danger` toast carries `role="alert"`, all others
 * `role="status"`. The close button has an overridable German `aria-label`
 * default. Using the action runs it and closes that toast.
 *
 * @example
 * ```html
 * <z-toast-outlet />
 * <z-toast-outlet closeLabel="Close" />
 * ```
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
  /**
   * `aria-label` of the close button on every toast. Overridable default.
   *
   * @default 'Schließen'
   */
  readonly closeLabel = input('Schließen');

  protected readonly dienst = inject(ZToast);
  protected readonly toasts = this.dienst.toasts;

  protected aufAktion(toast: ZToastItem): void {
    toast.action?.();
    this.dienst.dismiss(toast.id);
  }
}
