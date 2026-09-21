import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { disabled, form, FormField } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
import {
  ABRECHNUNGEN,
  ENTHALTEN,
  euro,
  FLEX_GRUNDBETRAG,
  flexDeckel,
  flexStundenpreis,
  KLASSEN,
  laufzeitGrund,
  laufzeitOptionen,
  minusEuro,
  proZeitraum,
  RAM_STUFEN,
  RECHNER_SPIELE,
  rechnung,
  VORGABE,
} from './konfigurator-daten';

/** The RAM steps without a version rule: this page orders nothing yet. */
const RAM_OPTIONEN: ZOption<number>[] = RAM_STUFEN.map((stufe) => ({
  value: stufe.gb,
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
            [hint]="laufzeitSperrgrund()"
            [options]="laufzeiten()"
            [formField]="rechner.tage"
          />

          <z-option-group
            legend="Abrechnung"
            [options]="abrechnungen"
            [formField]="rechner.abrechnung"
          />

          @if (istFlex()) {
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
            note="Beispielrechnung dieser Vorschau: Grundbetrag des Spiels plus Leistungsklasse je GB. Keine gültigen Preise."
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
  protected readonly spiele = RECHNER_SPIELE;
  protected readonly klassen = KLASSEN;
  protected readonly ramOptionen = RAM_OPTIONEN;
  protected readonly abrechnungen = ABRECHNUNGEN;
  protected readonly enthalten = ENTHALTEN;
  protected readonly flexGrund = FLEX_GRUNDBETRAG;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  /** One form for the whole page: no steps, every default valid. */
  protected readonly werte = signal({
    spiel: RECHNER_SPIELE[1].titel,
    klasse: VORGABE.klasse,
    ramGb: VORGABE.ramGb,
    tage: VORGABE.tage,
    abrechnung: 'monat',
  });
  protected readonly rechner = form(this.werte, (pfad) => {
    // Flex bills hours up to a cap: there is no term to choose, so the cards are
    // locked and the legend says why, instead of staying clickable to no effect.
    disabled(pfad.tage, ({ valueOf }) => !!laufzeitGrund(valueOf(pfad.abrechnung)));
  });

  /** Why the term group is locked, and the sentence at its legend. */
  protected readonly laufzeitSperrgrund = computed(() => laufzeitGrund(this.werte().abrechnung));

  private readonly grundbetrag = computed(
    () =>
      RECHNER_SPIELE.find((spiel) => spiel.titel === this.werte().spiel)?.grundbetrag ??
      RECHNER_SPIELE[0].grundbetrag,
  );

  private readonly monatspreis = computed(() =>
    proZeitraum(this.grundbetrag(), this.werte().klasse, this.werte().ramGb),
  );

  protected readonly laufzeiten = computed(() =>
    laufzeitOptionen(
      this.werte().klasse,
      this.werte().ramGb,
      this.grundbetrag(),
      this.werte().abrechnung,
    ),
  );

  protected readonly stundenpreis = computed(() => flexStundenpreis(this.werte().ramGb));
  protected readonly deckel = computed(() => flexDeckel(this.monatspreis()));

  private readonly summe = computed(() =>
    rechnung({
      ...VORGABE,
      version: '1.20.1',
      klasse: this.werte().klasse,
      ramGb: this.werte().ramGb,
      tage: this.werte().tage,
      grundbetrag: this.grundbetrag(),
    }),
  );

  protected readonly istFlex = computed(() => this.werte().abrechnung === 'flex');

  protected readonly preisText = computed(() =>
    euro(this.istFlex() ? this.deckel() : this.summe().summe),
  );

  // One unit across the page: days, never a month next to it.
  protected readonly zeitraumText = computed(() =>
    this.istFlex() ? 'höchstens je 30\u00a0Tage' : `/ ${this.werte().tage}\u00a0Tage`,
  );

  protected readonly summenLabel = computed(
    () => `${this.werte().spiel}, ${this.istFlex() ? 'Flex' : 'Monatspreis'}`,
  );

  /** Whether anything is taken off, which is what a sum line is there for. */
  private readonly mitRabatt = computed(() => !this.istFlex() && !!this.summe().laufzeitrabatt);

  // One fact, one place: without a deduction the sum is the price in the head
  // already, so neither the sum nor the price before the discount gets a line.
  protected readonly summenZeile = computed(() =>
    this.mitRabatt() ? { label: 'Summe', value: this.preisText() } : null,
  );

  protected readonly posten = computed<ZPriceLine[]>(() => {
    const zahl = this.summe();
    const zeilen: ZPriceLine[] = [
      { label: 'Spiel', value: this.werte().spiel },
      {
        label: 'Leistungsklasse',
        value: this.klassen.find((e) => e.value === this.werte().klasse)?.title ?? '',
      },
      { label: 'Arbeitsspeicher', value: `${this.werte().ramGb}\u00a0GB` },
    ];
    if (this.istFlex()) {
      zeilen.push({ label: 'Grundbetrag', value: euro(FLEX_GRUNDBETRAG) });
      zeilen.push({ label: 'Pro Stunde', value: euro(this.stundenpreis()) });
      return zeilen;
    }
    zeilen.push({ label: 'Laufzeit', value: `${this.werte().tage}\u00a0Tage` });
    if (this.mitRabatt()) {
      zeilen.push({
        label: `Preis für ${this.werte().tage}\u00a0Tage`,
        value: euro(zahl.vorRabatt),
      });
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
      `${klasse} mit ${this.werte().ramGb}\u00a0GB: ${euro(FLEX_GRUNDBETRAG)} Grundbetrag plus ` +
      `${euro(this.stundenpreis())} je Stunde, nie mehr als ${euro(this.deckel())} je 30\u00a0Tage.`
    );
  });

  protected readonly kurzAlles = computed(
    () =>
      `${this.werte().spiel}, ${this.werte().ramGb}\u00a0GB, ` +
      (this.istFlex() ? 'Flex' : `alle ${this.werte().tage}\u00a0Tage`),
  );

  /** The whole selection, as the order page reads it back. */
  protected readonly uebergabe = computed(() => ({
    spiel: this.werte().spiel,
    klasse: this.werte().klasse,
    ram: String(this.werte().ramGb),
    tage: String(this.werte().tage),
    abrechnung: this.werte().abrechnung,
  }));

  constructor() {
    this.ausUrl();

    // The calculator carries its selection in the URL too, so a link is
    // shareable and a reload keeps what was chosen.
    effect(() => {
      const parameter = this.uebergabe();
      untracked(() => {
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: parameter,
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      });
    });
  }

  /** Reads the query parameters, and falls back to the valid default for each. */
  private ausUrl(): void {
    const p = this.route.snapshot.queryParamMap;
    const spiel = RECHNER_SPIELE.find((eintrag) => eintrag.titel === p.get('spiel'));
    const ram = Number(p.get('ram'));
    const tage = Number(p.get('tage'));
    const abrechnung = p.get('abrechnung');

    this.werte.update((alt) => ({
      ...alt,
      spiel: spiel?.titel ?? alt.spiel,
      klasse: KLASSEN.some((e) => e.value === p.get('klasse'))
        ? (p.get('klasse') as string)
        : alt.klasse,
      ramGb: RAM_STUFEN.some((stufe) => stufe.gb === ram) ? ram : alt.ramGb,
      tage: [30, 90, 180].includes(tage) ? tage : alt.tage,
      abrechnung: abrechnung === 'flex' || abrechnung === 'monat' ? abrechnung : alt.abrechnung,
    }));
  }
}
