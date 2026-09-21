import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Status of a badge. `neutral` is the plain tag and the state "Gestoppt",
 * `success` stands for Online or Aktiv, `warning` for a running change such as
 * "Neustart läuft", `danger` for Fehlgeschlagen or Offline, `info` for
 * something planned or being installed.
 */
export type ZBadgeStatus = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

/**
 * Status or tag in one word. A badge is never clickable and never carries a
 * meaning that only its color conveys: the state is always written out.
 *
 * Renders the projected content on a host with the class `z-badge` plus one of
 * `z-badge--success`, `--warning`, `--danger`, `--info`. With `dot` a leading
 * `span.z-badge__dot` is added. Two uses: a status with dot and color, or a
 * neutral tag without dot (Tarif, Loader, Version, Rechte). At most three tags
 * per row, and in a list the status always stays in the same column.
 *
 * @example
 * ```html
 * <z-badge status="success" dot>Online</z-badge>
 * <z-badge status="danger" dot>Fehlgeschlagen</z-badge>
 * <z-badge>PaperMC</z-badge>
 * ```
 */
@Component({
  selector: 'z-badge',
  template: `@if (dot()) {
      <span class="z-badge__dot"></span>
    }
    <ng-content />`,
  host: {
    class: 'z-badge',
    '[class.z-badge--success]': `status() === 'success'`,
    '[class.z-badge--warning]': `status() === 'warning'`,
    '[class.z-badge--danger]': `status() === 'danger'`,
    '[class.z-badge--info]': `status() === 'info'`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZBadge {
  /**
   * Color of the badge. `neutral` renders without a modifier class.
   *
   * @default 'neutral'
   */
  readonly status = input<ZBadgeStatus>('neutral');

  /**
   * Shows the leading dot. Set it for a server or job state, leave it off for a
   * plain tag. Boolean attribute, so `dot` alone is enough.
   *
   * @default false
   */
  readonly dot = input(false, { transform: booleanAttribute });
}
