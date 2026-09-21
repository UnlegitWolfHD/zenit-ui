import { ChangeDetectionStrategy, Component, Directive, input } from '@angular/core';

/** Die höchstens zwei Buttons des Kopfes. */
@Directive({
  selector: '[zHeroActions]',
  host: { 'class': 'z-hero__actions' },
})
export class ZHeroActions {}

/** Die rechte Spalte: Preisliste, Konfigurator oder ein Screenshot des Panels. */
@Directive({ selector: '[zHeroAside]' })
export class ZHeroAside {}

/**
 * Kopf einer öffentlichen Seite: zwei Spalten im Verhältnis 7 zu 5, unter
 * 900px einspaltig. Die Größe der h1 steht in der Klasse `z-hero__title` und
 * wechselt unter 640px von `display-xl` auf `display-lg`.
 */
@Component({
  selector: 'z-hero',
  template: `
    <div>
      <h1 class="z-hero__title">{{ title() }}</h1>
      @if (lead()) {
        <p class="z-hero__lead">{{ lead() }}</p>
      }
      <ng-content select="[zHeroActions]" />
      @if (note()) {
        <p class="z-hero__note">{{ note() }}</p>
      }
    </div>
    <ng-content select="[zHeroAside]" />
  `,
  host: {
    'class': 'z-hero',
    '[attr.title]': `null`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZHero {
  readonly title = input('');
  readonly lead = input('');
  readonly note = input('');
}
