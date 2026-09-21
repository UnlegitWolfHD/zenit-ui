import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import {
  ZButton,
  ZConfig,
  ZConfigAside,
  ZCostChart,
  ZGameGrid,
  ZGameTile,
  ZIncludedList,
  ZOption,
  ZOptionGroup,
  ZPageHeader,
  ZPriceLine,
  ZPriceSummary,
  ZStickyBar,
} from 'zenit-ui';
import { SPIELE } from './beispieldaten';
import {
  ENTHALTEN,
  euro,
  FLEX_GRUNDBETRAG,
  flexDeckel,
  flexStundenpreis,
  KLASSEN,
  laufzeitOptionen,
  minusEuro,
  proZeitraum,
  RAM_STUFEN,
  rechnung,
  VORGABE,
} from './konfigurator-daten';

/** How the order is billed. Two cards, not a switch, because both have a price. */
const ABRECHNUNGEN: ZOption[] = [
  {
    value: 'monat',
    title: 'Monatspreis',
    description: 'Fester Betrag je Laufzeit, egal wie viel gespielt wird.',
  },
  {
    value: 'flex',
    title: 'Flex',
    description: 'Nach gespielten Stunden, nach oben gedeckelt.',
  },
];

/** The RAM steps without a version rule: this page orders nothing yet. */
const RAM_OPTIONEN: ZOption[] = RAM_STUFEN.map((stufe) => ({
  value: String(stufe.gb),
  title: `${stufe.gb}\u00a0GB`,
  description: stufe.spieler,
  badge: stufe.gb === 4 ? 'Empfohlen' : undefined,
  badgeStatus: 'info' as const,
}));

/**
 * The configurator without steps: one form, the summary next to it. This is
 * the public variant of `/muster/server-erstellen`; the button hands the whole
 * selection over as query parameters, so nothing is lost on the way into the
 * order.
 */
@Component({
  selector: 'demo-muster-preisrechner-page',
  imports: [
    FormField,
    RouterLink,
    ZButton,
    ZConfig,
    ZConfigAside,
    ZCostChart,
    ZGameGrid,
    ZGameTile,
    ZIncludedList,
    ZOptionGroup,
    ZPageHeader,
    ZPriceSummary,
    ZStickyBar,
  ],
  template: `
    <div class="demo-kundenbereich">
      <z-page-header
        title="Preisrechner"
        sub="Beispielwerte dieser Vorschau, keine gültigen Preise"
      />

      <z-config>
        <div class="z-stack">
          <div class="z-stack">
            <span class="title-sm">Spiel</span>
            <z-game-grid>
              @for (spiel of spiele; track spiel.titel) {
                <button
                  zGameTile
                  type="button"
                  [title]="spiel.titel"
                  [price]="spiel.preis"
                  [selected]="werte().spiel === spiel.titel"
                  (click)="rechner.spiel().value.set(spiel.titel)"
                ></button>
              }
            </z-game-grid>
          </div>

          <z-option-group
            legend="Leistungsklasse"
            [options]="klassen"
            [formField]="rechner.klasse"
          />

          <z-option-group
            legend="Arbeitsspeicher"
            hint="Spielerzahlen sind Richtwerte"
            compact
            [options]="ramOptionen"
            [formField]="rechner.ramGb"
          />

          <z-option-group
            legend="Laufzeit"
            compact
            [options]="laufzeiten()"
            [formField]="rechner.tage"
          />

          <z-option-group
            legend="Abrechnung"
            [options]="abrechnungen"
            [formField]="rechner.abrechnung"
          />

          @if (werte().abrechnung === 'flex') {
            <div class="demo-diagramm">
              <z-cost-chart
                [base]="flexGrund"
                [rate]="stundenpreis()"
                [cap]="deckel()"
                [maxHours]="150"
                [caption]="diagrammSatz()"
              />
            </div>
          }
        </div>

        <div zConfigAside class="z-stack">
          <z-price-summary
            [label]="summenLabel()"
            [price]="preisText()"
            [period]="zeitraumText()"
            [lines]="posten()"
            [total]="summenZeile()"
            note="Beispielrechnung dieser Vorschau: 1,74 € Grundbetrag plus Leistungsklasse je GB. Keine gültigen Preise."
            legalNote="Gemäß § 19 UStG wird keine Umsatzsteuer berechnet."
          >
            <a
              zBtn="primary"
              block
              routerLink="/muster/server-erstellen"
              [queryParams]="uebergabe()"
              >Server erstellen</a
            >
          </z-price-summary>
          <z-included-list [items]="enthalten" />
        </div>
      </z-config>

      <z-sticky-bar [price]="preisText()" [summary]="kurzAlles()" mobileOnly>
        <a zBtn="secondary" routerLink="/muster/server-erstellen" [queryParams]="uebergabe()"
          >Server erstellen</a
        >
      </z-sticky-bar>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MusterPreisrechnerPage {
  protected readonly spiele = SPIELE;
  protected readonly klassen = KLASSEN;
  protected readonly ramOptionen = RAM_OPTIONEN;
  protected readonly abrechnungen = ABRECHNUNGEN;
  protected readonly enthalten = ENTHALTEN;
  protected readonly flexGrund = FLEX_GRUNDBETRAG;

  /** One form for the whole page: no steps, every default valid. */
  protected readonly werte = signal({
    spiel: 'Valheim',
    klasse: VORGABE.klasse,
    ramGb: String(VORGABE.ramGb),
    tage: String(VORGABE.tage),
    abrechnung: 'monat',
  });
  protected readonly rechner = form(this.werte);

  private readonly ramZahl = computed(() => Number(this.werte().ramGb));
  private readonly monatspreis = computed(() => proZeitraum(this.werte().klasse, this.ramZahl()));

  protected readonly laufzeiten = computed(() =>
    laufzeitOptionen(this.werte().klasse, this.ramZahl()),
  );

  protected readonly stundenpreis = computed(() => flexStundenpreis(this.ramZahl()));
  protected readonly deckel = computed(() => flexDeckel(this.monatspreis()));

  private readonly summe = computed(() =>
    rechnung({
      ...VORGABE,
      klasse: this.werte().klasse,
      ramGb: this.ramZahl(),
      version: '1.20.1',
      tage: Number(this.werte().tage),
    }),
  );

  private readonly istFlex = computed(() => this.werte().abrechnung === 'flex');

  protected readonly preisText = computed(() =>
    euro(this.istFlex() ? this.deckel() : this.summe().summe),
  );

  protected readonly zeitraumText = computed(() =>
    this.istFlex() ? 'höchstens im Monat' : `/ ${this.werte().tage}\u00a0Tage`,
  );

  protected readonly summenLabel = computed(
    () => `${this.werte().spiel}, ${this.istFlex() ? 'Flex' : 'Monatspreis'}`,
  );

  protected readonly summenZeile = computed(() => ({
    label: this.istFlex() ? 'Höchstens im Monat' : 'Summe',
    value: this.preisText(),
  }));

  protected readonly posten = computed<ZPriceLine[]>(() => {
    const zahl = this.summe();
    const zeilen: ZPriceLine[] = [
      { label: 'Spiel', value: this.werte().spiel },
      {
        label: 'Leistungsklasse',
        value: this.klassen.find((e) => e.value === this.werte().klasse)?.title ?? '',
      },
      { label: 'Arbeitsspeicher', value: `${this.ramZahl()}\u00a0GB` },
    ];
    if (this.istFlex()) {
      zeilen.push({ label: 'Grundbetrag', value: euro(FLEX_GRUNDBETRAG) });
      zeilen.push({ label: 'Pro Stunde', value: euro(this.stundenpreis()) });
      return zeilen;
    }
    zeilen.push({ label: `Laufzeit ${this.werte().tage}\u00a0Tage`, value: euro(zahl.vorRabatt) });
    if (zahl.laufzeitrabatt) {
      zeilen.push({
        label: 'Laufzeitrabatt',
        value: minusEuro(zahl.laufzeitrabatt),
        discount: true,
      });
    }
    return zeilen;
  });

  protected readonly diagrammSatz = computed(() => {
    const klasse = this.klassen.find((e) => e.value === this.werte().klasse)?.title ?? '';
    return (
      `${klasse} mit ${this.ramZahl()}\u00a0GB: ${euro(FLEX_GRUNDBETRAG)} Grundbetrag plus ` +
      `${euro(this.stundenpreis())} je Stunde, nie mehr als ${euro(this.deckel())} im Monat.`
    );
  });

  protected readonly kurzAlles = computed(
    () =>
      `${this.werte().spiel}, ${this.ramZahl()}\u00a0GB, ` +
      (this.istFlex() ? 'Flex' : `alle ${this.werte().tage}\u00a0Tage`),
  );

  /** The whole selection, as the order page reads it back. */
  protected readonly uebergabe = computed(() => ({
    klasse: this.werte().klasse,
    ram: this.werte().ramGb,
    tage: this.werte().tage,
  }));
}
