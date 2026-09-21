import { ChangeDetectionStrategy, Component, Directive, input } from '@angular/core';
import { ZIcon } from '../icon';

export type ZAlertStatus = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/** Die eine Aktion eines Alerts: ein Button, secondary und sm. */
@Directive({ selector: '[zAlertAction]' })
export class ZAlertAction {}

/**
 * Hinweis im Seitenfluss: Titel als ganzer Satz, darunter die Einzelheit,
 * daneben hoechstens ein Button.
 *
 * Ein Alert ist statischer Inhalt der Seite und keine Live-Region. Was waehrend
 * des Lesens eintrifft, meldet ein Toast mit `role="alert"`.
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
    'class': 'z-alert',
    '[class.z-alert--info]': `status() === 'info'`,
    '[class.z-alert--success]': `status() === 'success'`,
    '[class.z-alert--warning]': `status() === 'warning'`,
    '[class.z-alert--danger]': `status() === 'danger'`,
    /* Ohne das steht der Titel zusaetzlich als natives title-Attribut am
       Element und der Browser zeigt seinen eigenen Tooltip (gemessen). */
    '[attr.title]': `null`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZAlert {
  readonly status = input<ZAlertStatus>('neutral');
  readonly title = input('');
  /** Name der Material-Icon-Ligatur. Ohne Wert steht kein Icon im Alert. */
  readonly icon = input('');
}
