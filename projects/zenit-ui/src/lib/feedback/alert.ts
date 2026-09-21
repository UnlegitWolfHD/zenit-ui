import { ChangeDetectionStrategy, Component, Directive, input } from '@angular/core';
import { ZIcon } from '../icon';

/**
 * Status of an alert. `neutral` is a plain note, `info` a hint, `success` a
 * finished operation, `warning` something the customer should act on soon, and
 * `danger` something that failed. The color only covers the surface and the
 * icon.
 */
export type ZAlertStatus = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/**
 * Marks the single action of an alert, projected next to the text: one button,
 * secondary and `size="sm"`. Adds no markup and no classes of its own.
 *
 * @example
 * ```html
 * <z-alert status="warning" title="2 Änderungen greifen erst nach einem Neustart">
 *   PvP und maximale Spieler.
 *   <button zAlertAction zBtn="secondary" size="sm">Jetzt neu starten</button>
 * </z-alert>
 * ```
 */
@Directive({ selector: '[zAlertAction]' })
export class ZAlertAction {}

/**
 * Note in the page flow: title as a full sentence, the detail below it, at most
 * one button next to it. Error texts say what happened and what the customer
 * can do. At most one alert per page, above the content.
 *
 * Renders a host with the class `z-alert` plus one of `z-alert--info`,
 * `--success`, `--warning`, `--danger`, an optional leading `z-icon`, a
 * `div.z-alert__text` with `span.z-alert__title` and `span.z-alert__body`
 * around the projected content, and the projected `[zAlertAction]` element.
 *
 * Accessibility: an alert is static page content and not a live region. What
 * arrives while the page is being read is announced by a toast with
 * `role="alert"`. The native `title` attribute is suppressed so the browser
 * does not show its own tooltip for the title input.
 *
 * @example
 * ```html
 * <z-alert status="danger" title="Installation fehlgeschlagen" icon="error">
 *   SteamCMD hat nach 120 Sekunden nicht geantwortet. Starte die Installation erneut.
 *   <button zAlertAction zBtn="secondary" size="sm">Erneut installieren</button>
 * </z-alert>
 * ```
 */
@Component({
  selector: 'z-alert',
  imports: [ZIcon],
  template: `
    @if (icon()) {
      <z-icon [name]="icon()" />
    }
    <div class="z-alert__text">
      @if (title()) {
        <span class="z-alert__title">{{ title() }}</span>
      }
      <span class="z-alert__body"><ng-content /></span>
    </div>
    <ng-content select="[zAlertAction]" />
  `,
  host: {
    class: 'z-alert',
    '[class.z-alert--info]': `status() === 'info'`,
    '[class.z-alert--success]': `status() === 'success'`,
    '[class.z-alert--warning]': `status() === 'warning'`,
    '[class.z-alert--danger]': `status() === 'danger'`,
    /* Without this the title would also sit on the element as a native title
       attribute and the browser would show its own tooltip (measured). */
    '[attr.title]': `null`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZAlert {
  /**
   * Color of the alert. `neutral` renders without a modifier class.
   *
   * @default 'neutral'
   */
  readonly status = input<ZAlertStatus>('neutral');

  /**
   * Title as a full sentence. Empty means no title line.
   *
   * @default ''
   */
  readonly title = input('');

  /**
   * Name of the Material Icons ligature, for example `error` or `restart_alt`.
   * Empty means no icon in the alert.
   *
   * @default ''
   */
  readonly icon = input('');
}
