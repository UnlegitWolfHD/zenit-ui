import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Eine Zeile einer Einstellungsliste: links Titel, Schluessel und Wirkung,
 * rechts das Bedienelement als projizierter Inhalt. `titleId` ist die id des
 * Titels, auf die ein `z-toggle` per `ariaLabelledby` zeigt.
 */
@Component({
  selector: 'z-setting',
  template: `
    <div class="z-setting__text">
      <span class="z-setting__title" [attr.id]="titleId() || null">{{ title() }}</span>
      @if (key()) {
        <span class="z-subtle z-mono caption">{{ key() }}</span>
      }
      @if (description()) {
        <span class="z-muted">{{ description() }}</span>
      }
    </div>
    <ng-content />
  `,
  host: {
    'class': 'z-setting',
    // Sonst haengt der Browser am statischen Attribut title="…" seinen
    // eigenen Tooltip an die ganze Zeile.
    '[attr.title]': `null`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZSetting {
  readonly title = input('');
  readonly key = input('');
  readonly description = input('');
  readonly titleId = input('');
}
