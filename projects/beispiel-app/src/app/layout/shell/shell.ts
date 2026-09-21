import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  ZAppHeader,
  ZBrand,
  ZFooter,
  ZFooterBase,
  ZHeaderEnd,
  ZHeaderLink,
  ZSkipLink,
  ZToastOutlet,
} from 'zenit-ui';
import { GUTHABEN, KUNDEN_LINKS, NUTZER } from '../../gameserver/beispieldaten';
import { ThemeControl } from '../theme-control/theme-control';

/**
 * Layout of the customer area: header, content, footer (10-seitenmuster.md,
 * "Seite im Kundenbereich"). Every page of a real application sits in here, so
 * the shell is the only place that knows about navigation, theme control and
 * toast outlet.
 */
@Component({
  selector: 'app-shell',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    ThemeControl,
    ZAppHeader,
    ZBrand,
    ZFooter,
    ZFooterBase,
    ZHeaderLink,
    ZHeaderEnd,
    ZSkipLink,
    ZToastOutlet,
  ],
  template: `
    <!-- First tab stop of the page, visible only while focused. The directive
         brings the whole appearance; the application supplies text and target. -->
    <a zSkipLink class="body-sm" href="#inhalt">Zum Hauptinhalt springen</a>

    <!-- Header, content and footer share the same z-container, so brand,
         page title and copyright stand on one line at every width. -->
    <div class="z-container">
      <!-- #region kopfzeile -->
      <z-app-header navLabel="Hauptnavigation">
        <!-- The logo file belongs to the repository of the real site; the design
             system ships none, so the brand is its name in the display face. -->
        <span zBrand>Zenit</span>
        @for (link of links; track link.name) {
          @if (link.route) {
            <a
              zHeaderLink
              [routerLink]="link.route"
              routerLinkActive
              #aktiv="routerLinkActive"
              [active]="aktiv.isActive"
              >{{ link.name }}</a
            >
          } @else {
            <!-- The other pages of the customer area are not part of this
                 example. They stay links so the header keeps its real shape. -->
            <a zHeaderLink href="#" (click)="$event.preventDefault()">{{ link.name }}</a>
          }
        }
        <!-- Credit in mono without a red pill, and a link to the billing page
             (AppHeader README). The label says what the number is and where the
             link goes, because "25,00 €" alone says nothing when read out loud;
             the amount comes from the same value the link shows, so the two
             cannot drift apart. -->
        <a
          zHeaderLink
          zHeaderEnd
          class="z-mono"
          href="#"
          [attr.aria-label]="'Guthaben ' + guthaben + ', zur Abrechnung'"
          (click)="$event.preventDefault()"
          >{{ guthaben }}</a
        >
        <!-- Colour scheme and accent, see layout/theme-control. -->
        <app-theme-control zHeaderEnd />
        <!-- Decorative: the name is already in the account menu of a real app. -->
        <span zHeaderEnd class="z-avatar" aria-hidden="true">{{ nutzer }}</span>
      </z-app-header>
      <!-- #endregion -->
    </div>

    <!-- tabindex="-1" lets the skip link move the focus here. z-container keeps
         the content at most the container width and left aligned. -->
    <main id="inhalt" tabindex="-1" class="z-container app-main">
      <router-outlet />
    </main>

    <div class="z-container">
      <!-- #region fusszeile -->
      <z-footer>
        <!-- Customer area: only the bottom row, copyright left and the legal
             links right, no link columns (Footer README). Both parts carry
             zFooterBase, because the row spreads its own children. -->
        <span zFooterBase>© 2026 Zenit-Hosting</span>
        <span zFooterBase class="z-cluster">
          @for (link of rechtliches; track link) {
            <a href="#" (click)="$event.preventDefault()">{{ link }}</a>
          }
        </span>
      </z-footer>
      <!-- #endregion -->
    </div>

    <!-- #region toastauslass -->
    <!-- Once per application, at the end of the layout (README, step 4). -->
    <z-toast-outlet />
    <!-- #endregion -->
  `,
})
export class Shell {
  protected readonly guthaben = GUTHABEN;
  protected readonly nutzer = NUTZER;
  protected readonly links = KUNDEN_LINKS;
  protected readonly rechtliches = ['Impressum', 'Datenschutz', 'AGB', 'Widerruf'];
}
