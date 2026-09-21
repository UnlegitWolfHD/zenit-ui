import { CdkMenuTrigger } from '@angular/cdk/menu';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import {
  Z_MENU,
  ZAlert,
  ZButton,
  ZDialog,
  ZField,
  ZInput,
  ZToast,
  ZToastOutlet,
  ZTooltip,
} from 'zenit-ui';
import { ALTLAST_CSS, ALTLAST_HTML } from './legacy-altlast';

/**
 * A piece of a migrated page. The demo renders it twice, once in the page as
 * usual and once in a `z-root` container inside `.z-legacy`, and the e2e suite
 * expects both copies to compute to the same styles, element by element.
 */
@Component({
  selector: 'demo-legacy-migriert',
  imports: [ZAlert, ZButton, ZField, ZInput],
  template: `
    <div class="z-stack">
      <p class="demo-flach">
        Guthaben und Rechnungen stehen jetzt an einem Ort.
        <a href="/muster/legacy">Rechnung 2026-0917 öffnen</a>
      </p>
      <z-alert status="info" title="Lastschrift am 01.10.2026" icon="info">
        Wir buchen 12,34&nbsp;€ ab. <a href="/muster/legacy">Zahlungsart ändern</a>
      </z-alert>
      <z-field label="Rechnungsnummer" [for]="praefix() + '-nummer'">
        <input zInput [id]="praefix() + '-nummer'" placeholder="2026-0917" />
      </z-field>
      <div class="z-cluster">
        <button zBtn="secondary" type="button">Rechnung suchen</button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegacyMigriert {
  /** Keeps the ids of the two copies apart. */
  readonly praefix = input.required<string>();
}

/**
 * The old page itself. The markup is a string shared with e2e/legacy.spec.ts,
 * so it is handed over as it is and not written into a template here. The host
 * generates no box; the old rules are descendant selectors and do not see it.
 */
@Component({
  selector: 'demo-altlast',
  template: ALTLAST_HTML,
  host: { style: 'display: contents' },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Altlast {}

/**
 * Simulates an application that moves to zenit-ui route by route: `z-root` on
 * `<html>` and `<body>`, `.z-legacy` on the content host, `z-root` again on
 * the container of a migrated page.
 *
 * `ViewEncapsulation.None` is what keeps the old rules at (0,0,1), see
 * `legacy-altlast.ts`. Angular removes the stylesheet again when the page is
 * left.
 */
@Component({
  selector: 'demo-legacy',
  imports: [
    CdkMenuTrigger,
    Z_MENU,
    Altlast,
    LegacyMigriert,
    ZAlert,
    ZButton,
    ZToastOutlet,
    ZTooltip,
  ],
  encapsulation: ViewEncapsulation.None,
  styles: ALTLAST_CSS,
  template: `
    <h1 class="heading-1 demo-title">Legacy</h1>
    <p class="demo-lead">
      Eine Anwendung zieht Route für Route um. Der Inhaltsbereich trägt z-legacy, solange nicht jede
      Seite umgezogen ist, und eine umgezogene Seite setzt z-root wieder an ihren Container.
    </p>

    <!-- tabindex -1 on both page containers: a migrated page is the usual target
         of the skip link, and its focus ring is one of the rules that come back. -->
    <section class="demo-section" data-legacy="referenz" tabindex="-1">
      <h2 class="heading-2">Umgezogene Seite, normal eingebunden</h2>
      <demo-legacy-migriert praefix="ref" />
      <div class="demo-row" data-legacy="ausloeser-referenz">
        <button zBtn="secondary" type="button" (click)="dialogOeffnen()">Dialog öffnen</button>
        <button zBtn="secondary" type="button" [cdkMenuTriggerFor]="menue">Menü öffnen</button>
        <button zBtn="secondary" type="button" zTooltip="Rechnung als PDF laden">Tooltip</button>
        <button zBtn="secondary" type="button" (click)="toastZeigen()">Toast zeigen</button>
      </div>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">Inhaltsbereich mit z-legacy</h2>
    </section>
    <!-- Outside .demo-section: its "h2 { margin: 0 }" is a rule of the demo shell
         and would reach the old h2, which no library rule does. -->
    <div class="z-legacy demo-alt" data-legacy="insel">
      <demo-altlast />

      <h3>Overlays von einer alten Seite aus</h3>
      <p data-legacy="ausloeser-insel">
        <button type="button" (click)="dialogOeffnen()">Dialog öffnen</button>
        <button type="button" [cdkMenuTriggerFor]="menue">Menü öffnen</button>
        <button type="button" zTooltip="Rechnung als PDF laden">Tooltip</button>
        <button type="button" (click)="toastZeigen()">Toast zeigen</button>
      </p>

      <h3>Baustein ohne z-root</h3>
      <z-alert status="warning" title="Wartung am 28.09.2026" icon="warning" data-legacy="lose">
        Von 02:00 bis 02:15 Uhr ist der Kundenbereich nicht erreichbar.
        <a href="/muster/legacy">Status ansehen</a>
      </z-alert>

      <h3>Umgezogene Seite im Inhaltsbereich</h3>
      <div class="z-root demo-legacy-seite" data-legacy="verschachtelt" tabindex="-1">
        <demo-legacy-migriert praefix="insel" />
      </div>
    </div>

    <ng-template #menue>
      <z-menu>
        <button zMenuItem icon="download">Als PDF laden</button>
        <button zMenuItem icon="mail">Per E-Mail senden</button>
      </z-menu>
    </ng-template>
    <z-toast-outlet />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegacyPage {
  private readonly dialog = inject(ZDialog);
  private readonly toast = inject(ZToast);

  protected dialogOeffnen(): void {
    this.dialog
      .confirm({
        title: 'Rechnung 2026-0917 stornieren?',
        body: 'Der Betrag von 12,34 € geht zurück auf dein Guthaben.',
        confirmLabel: 'Rechnung stornieren',
        cancelLabel: 'Abbrechen',
      })
      .subscribe();
  }

  protected toastZeigen(): void {
    this.toast.success('Rechnung 2026-0917 gespeichert');
  }
}
