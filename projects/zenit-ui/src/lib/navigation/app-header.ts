import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  Directive,
  input,
  signal,
} from '@angular/core';
import { ZButton } from '../button';
import { ZIcon } from '../icon';

/** Laeuft je Kopfzeile einmal hoch, damit aria-controls eindeutig bleibt. */
let laufendeNummer = 0;

/** Marke im Kopf: reine Schrift in `display`, kein Logo. */
@Directive({
  selector: '[zBrand]',
  host: { 'class': 'z-header__brand' },
})
export class ZBrand {}

/** Ein Link der Hauptnavigation. Aktiv traegt er `aria-current="page"`. */
@Directive({
  selector: 'a[zHeaderLink]',
  host: {
    'class': 'z-header__link',
    '[attr.aria-current]': `active() ? "page" : null`,
  },
})
export class ZHeaderLink {
  readonly active = input(false, { transform: booleanAttribute });
}

/** Rechter Teil der Kopfzeile: Guthaben, Avatar oder Buttons. */
@Directive({ selector: '[zHeaderEnd]' })
export class ZHeaderEnd {}

/**
 * Kopfzeile fuer den Kundenbereich und fuer oeffentliche Seiten. Unter 900px
 * klappt die Navigation in ein Menue; der rechte Teil bleibt sichtbar.
 */
@Component({
  selector: 'z-app-header',
  imports: [ZButton, ZIcon],
  template: `
    <ng-content select="[zBrand]" />
    <button
      zBtn="ghost"
      iconOnly
      type="button"
      class="z-header__menu"
      [attr.aria-label]="menuLabel()"
      [attr.aria-expanded]="offen()"
      [attr.aria-controls]="navId"
      (click)="offen.set(!offen())"
    >
      <z-icon name="menu" />
    </button>
    <nav class="z-header__nav" [id]="navId" [attr.aria-label]="navLabel() || null">
      <ng-content />
    </nav>
    <div class="z-header__end"><ng-content select="[zHeaderEnd]" /></div>
  `,
  host: {
    'class': 'z-header',
    '[class.z-header--open]': `offen()`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZAppHeader {
  readonly navLabel = input('');
  /** aria-label des Menue-Knopfes unter 900px, vom Aufrufer ueberschreibbar. */
  readonly menuLabel = input('Menü');

  protected readonly offen = signal(false);
  protected readonly navId = `z-header-nav-${++laufendeNummer}`;
}
