import { CdkMenuTrigger } from '@angular/cdk/menu';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Z_MENU,
  ZAppHeader,
  ZBrand,
  ZButton,
  ZHeaderEnd,
  ZHeaderLink,
  ZIcon,
  ZSkeleton,
} from 'zenit-ui';
import { KUNDEN_LINKS } from './beispieldaten';

/*
 * A neutral box with the proportions of the logo the first integration uses
 * (320x213), not a logo: CLAUDE.md forbids drawing one. At the 40px height the
 * application gives it, it renders 60x40.
 */
const PLATZHALTER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="213" viewBox="0 0 320 213">' +
      '<rect width="320" height="213" fill="#9ca3af"/></svg>',
  );

/**
 * The header with an image in the brand slot and the four end slots of the
 * first integration, edge to edge like a real page header, so that
 * e2e/kopfzeile.spec.ts can measure the bar at 360, 375, 412 and 899px.
 *
 * The labels "Login", "Registrieren" and "Zum Dashboard" are the ones that
 * application ships. They are kept because their width is what is measured.
 */
@Component({
  selector: 'demo-kopfzeile',
  imports: [
    CdkMenuTrigger,
    Z_MENU,
    ZAppHeader,
    ZBrand,
    ZButton,
    ZHeaderEnd,
    ZHeaderLink,
    ZIcon,
    ZSkeleton,
  ],
  template: `
    <h1 class="heading-1 demo-title">Kopfzeile</h1>
    <p class="demo-lead">
      Bildlogo mit 40px Höhe, sechs Links und die vier Inhalte, die rechts stehen können. Unter
      900px bleibt die Leiste eine Zeile: Logo, rechter Bereich, Menü-Button.
    </p>

    <section class="demo-section">
      <h2 class="heading-2">Öffentlich, abgemeldet</h2>
      <p class="demo-cap caption">
        Kein primärer Button im rechten Bereich: die Kopfzeile steht auf jedem Bildschirm, ein
        primärer wäre dort der zweite neben dem der Seite. Ghost und secondary, den einen primären
        trägt der Hero.
      </p>
      <div class="demo-randlos">
        <z-app-header navLabel="Navigation abgemeldet" [landmark]="false" data-kopf="abgemeldet">
          <a zBrand href="/muster/kopfzeile"
            ><img [src]="logo" alt="Startseite" style="height: var(--control-md); width: auto"
          /></a>
          @for (link of links; track link) {
            <a zHeaderLink href="/muster/kopfzeile" [active]="link === 'Gameserver'">{{ link }}</a>
          }
          <a zBtn="ghost" size="sm" zHeaderEnd href="/muster/kopfzeile">Login</a>
          <a zBtn="secondary" size="sm" zHeaderEnd href="/muster/kopfzeile">Registrieren</a>
        </z-app-header>
      </div>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">Öffentlich, angemeldet</h2>
      <div class="demo-randlos">
        <z-app-header navLabel="Navigation angemeldet" [landmark]="false" data-kopf="angemeldet">
          <a zBrand href="/muster/kopfzeile"
            ><img [src]="logo" alt="Startseite" style="height: var(--control-md); width: auto"
          /></a>
          @for (link of links; track link) {
            <a zHeaderLink href="/muster/kopfzeile">{{ link }}</a>
          }
          <a zBtn="secondary" size="sm" zHeaderEnd href="/muster/kopfzeile">Zum Dashboard</a>
        </z-app-header>
      </div>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">Kundenbereich</h2>
      <div class="demo-randlos">
        <z-app-header navLabel="Navigation Kundenbereich" [landmark]="false" data-kopf="kunde">
          <a zBrand href="/muster/kopfzeile"
            ><img [src]="logo" alt="Startseite" style="height: var(--control-md); width: auto"
          /></a>
          @for (link of links; track link) {
            <a zHeaderLink href="/muster/kopfzeile">{{ link }}</a>
          }
          <a
            zHeaderLink
            zHeaderEnd
            class="z-mono"
            href="/muster/kopfzeile"
            aria-label="Guthaben 12,34 Euro, zur Abrechnung"
            >12,34&nbsp;€</a
          >
          <button
            zBtn="ghost"
            iconOnly
            zHeaderEnd
            type="button"
            aria-label="Konto"
            [cdkMenuTriggerFor]="konto"
          >
            <z-icon name="account_circle" />
          </button>
        </z-app-header>
      </div>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">Kundenbereich, Anmeldung wird geprüft</h2>
      <div class="demo-randlos">
        <z-app-header navLabel="Navigation ladend" [landmark]="false" data-kopf="ladend">
          <a zBrand href="/muster/kopfzeile"
            ><img [src]="logo" alt="Startseite" style="height: var(--control-md); width: auto"
          /></a>
          @for (link of links; track link) {
            <a zHeaderLink href="/muster/kopfzeile">{{ link }}</a>
          }
          <z-skeleton zHeaderEnd width="160px" />
        </z-app-header>
      </div>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">Öffentlich, mit den Beschriftungen des Design-Systems</h2>
      <p class="demo-cap caption">
        Anmelden und Server erstellen brauchen neben dem Logo 362px, frei sind bei 360px Breite
        312px. Bei 360 und 375px stehen sie im rechten Bereich untereinander, bei 412px in einer
        Zeile.
      </p>
      <div class="demo-randlos">
        <z-app-header navLabel="Navigation zweizeilig" [landmark]="false" data-kopf="zweizeilig">
          <a zBrand href="/muster/kopfzeile"
            ><img [src]="logo" alt="Startseite" style="height: var(--control-md); width: auto"
          /></a>
          @for (link of links; track link) {
            <a zHeaderLink href="/muster/kopfzeile">{{ link }}</a>
          }
          <a zBtn="ghost" size="sm" zHeaderEnd href="/muster/kopfzeile">Anmelden</a>
          <a zBtn="secondary" size="sm" zHeaderEnd href="/muster/kopfzeile">Server erstellen</a>
        </z-app-header>
      </div>
    </section>

    <ng-template #konto>
      <z-menu>
        <button zMenuItem icon="person">Profil</button>
        <button zMenuItem icon="logout">Abmelden</button>
      </z-menu>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KopfzeilePage {
  protected readonly logo = PLATZHALTER;
  protected readonly links = KUNDEN_LINKS;
}
