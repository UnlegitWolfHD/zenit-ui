import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ZButton } from '../button';
import { ZIcon } from '../icon';
import { injectZLabels } from '../labels';
import { ZToast, ZToastItem } from './toast';

/**
 * Stands once in the root template and renders the toasts of the `ZToast`
 * service. Sits `position: fixed` in the bottom right corner, on mobile at the
 * bottom across the full width.
 *
 * Renders a host with the class `z-toast-outlet` holding two permanent
 * `div.z-toast-outlet__live` regions, and per toast a `div.z-toast` plus
 * `z-toast--success` or `z-toast--danger`, an optional `z-icon`, the text, an
 * optional `button.z-toast__action` and the close button `button.z-toast__close`
 * (ghost, `sm`, icon only).
 *
 * Accessibility: a screen reader announces a change *inside* an existing live
 * region, not a region that appears together with its content. The outlet
 * therefore renders the two regions from the start, empty, and puts each toast
 * into the matching one: `role="status"` with `aria-live="polite"` for neutral
 * and success, `role="alert"` with `aria-live="assertive"` for danger. The toast
 * elements carry no `role` of their own, because a live region nested in a live
 * region is announced twice. Both regions set `aria-atomic="false"`, which
 * overrides the `true` implied by `status` and `alert`: with up to three toasts
 * open, only the one that was just added is read out instead of all of them.
 * The close button has an overridable German `aria-label` default. Using the
 * action runs it and closes that toast.
 *
 * Both regions are `display: contents`, so the toasts stay the grid items of
 * `.z-toast-outlet`; the `order` bound per toast keeps the visual sequence of
 * the service list (newest at the bottom) across the two regions.
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
    @for (gruppe of gruppen(); track gruppe.rolle) {
      <div
        class="z-toast-outlet__live"
        [attr.role]="gruppe.rolle"
        [attr.aria-live]="gruppe.live"
        aria-atomic="false"
      >
        @for (eintrag of gruppe.toasts; track eintrag.toast.id) {
          @let toast = eintrag.toast;
          <div
            class="z-toast"
            [class.z-toast--success]="toast.status === 'success'"
            [class.z-toast--danger]="toast.status === 'danger'"
            [style.order]="eintrag.reihe"
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
              [attr.aria-label]="schliessenText()"
              (click)="dienst.dismiss(toast.id)"
            >
              <z-icon name="close" size="sm" />
            </button>
          </div>
        }
      </div>
    }
  `,
  host: { class: 'z-toast-outlet' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZToastOutlet {
  /**
   * `aria-label` of the close button on every toast. Unset, the component uses
   * {@link ZLabels.toastClose} from the label registry.
   *
   * @default undefined
   */
  readonly closeLabel = input<string>();

  private readonly labels = injectZLabels();

  protected readonly schliessenText = computed(() => this.closeLabel() ?? this.labels.toastClose);
  protected readonly dienst = inject(ZToast);
  protected readonly toasts = this.dienst.toasts;

  /**
   * The two live regions with their toasts. `reihe` is the position in the
   * service list and becomes the CSS `order`, so splitting the list over two
   * regions does not change what the eye sees.
   */
  protected readonly gruppen = computed(() => {
    const mitReihe = this.toasts().map((toast, reihe) => ({ toast, reihe }));
    return [
      {
        rolle: 'status',
        live: 'polite',
        toasts: mitReihe.filter(({ toast }) => toast.status !== 'danger'),
      },
      {
        rolle: 'alert',
        live: 'assertive',
        toasts: mitReihe.filter(({ toast }) => toast.status === 'danger'),
      },
    ];
  });

  protected aufAktion(toast: ZToastItem): void {
    toast.action?.();
    this.dienst.dismiss(toast.id);
  }
}
