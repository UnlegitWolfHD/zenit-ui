import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { form, FormField, max, min } from '@angular/forms/signals';
import {
  ZAppHeader,
  ZBadge,
  ZBrand,
  ZButton,
  ZFaq,
  ZFooter,
  ZFooterBase,
  ZFooterCol,
  ZGameGrid,
  ZGameTile,
  ZHeaderEnd,
  ZHeaderLink,
  ZHero,
  ZHeroActions,
  ZHeroAside,
  ZPanel,
  ZPanelActions,
  ZPriceLine,
  ZPriceSummary,
  ZRow,
  ZRowMain,
  ZRows,
  ZSegment,
  ZSegmentOption,
  ZSlider,
  ZSpecList,
} from 'zenit-ui';
import { euro, OEFFENTLICHE_LINKS, SERVER, SPIELE, TECHNIK } from './beispieldaten';

/*
 * Example calculation for this preview only. The rates are made up for the
 * demo and are written out in the note under the summary, so the page never
 * claims a real price.
 */
const PREIS_JE_GB = 0.45;
const PREIS_JE_STECKPLATZ = 0.2;

/**
 * Public page after 10-seitenmuster.md: head, then the tool of the page, then
 * facts, FAQ and the one centred block, the closing CTA.
 */
@Component({
  selector: 'demo-muster-startseite-page',
  imports: [
    FormField,
    ZAppHeader,
    ZBadge,
    ZBrand,
    ZButton,
    ZFaq,
    ZFooter,
    ZFooterBase,
    ZFooterCol,
    ZGameGrid,
    ZGameTile,
    ZHeaderEnd,
    ZHeaderLink,
    ZHero,
    ZHeroActions,
    ZHeroAside,
    ZPanel,
    ZPanelActions,
    ZPriceSummary,
    ZRow,
    ZRowMain,
    ZRows,
    ZSegment,
    ZSlider,
    ZSpecList,
  ],
  template: `
    <z-app-header navLabel="Hauptnavigation" [landmark]="false">
      <span zBrand>Zenit</span>
      @for (link of links; track link) {
        <a zHeaderLink href="#" (click)="$event.preventDefault()">{{ link }}</a>
      }
      <a zBtn="ghost" size="sm" zHeaderEnd href="#" (click)="$event.preventDefault()">Anmelden</a>
    </z-app-header>

    <z-hero
      title="Gameserver aus Nürnberg. In etwa 60 Sekunden online."
      lead="Spiel wählen, Arbeitsspeicher einstellen, starten. Dedizierte NVMe-Hardware, nach Stunden abgerechnet und monatlich kündbar."
      note="Keine Kreditkarte nötig · DDoS-Schutz inklusive · Keine Einrichtungsgebühr"
    >
      <div zHeroActions>
        <a zBtn="primary" size="lg" href="#rechner">Server zusammenstellen</a>
      </div>

      <z-panel zHeroAside title="Kundenbereich" headingLevel="2" flush>
        <span zPanelActions class="caption z-subtle">Beispieldaten dieser Vorschau</span>
        <z-rows columns="minmax(0, 1fr) 128px">
          @for (eintrag of vorschau; track eintrag.name) {
            <div zRow>
              <z-row-main [title]="eintrag.name" [meta]="eintrag.meta" />
              <span>
                <z-badge [status]="eintrag.status" dot>{{ eintrag.statusText }}</z-badge>
              </span>
            </div>
          }
        </z-rows>
      </z-panel>
    </z-hero>

    <section id="rechner" class="z-section">
      <div class="z-stack">
        <h2 class="heading-2 demo-flach">Server zusammenstellen</h2>
        <p class="body demo-lead">
          Beispielrechnung für diese Vorschau. Die Werte stammen aus den Vorschauen der Bausteine
          und sind keine gültigen Preise.
        </p>

        <z-game-grid>
          @for (eintrag of spiele; track eintrag.titel) {
            <button
              zGameTile
              type="button"
              [title]="eintrag.titel"
              [price]="eintrag.preis"
              [selected]="werte().spiel === eintrag.titel"
              (click)="rechner.spiel().value.set(eintrag.titel)"
            ></button>
          }
        </z-game-grid>

        <div class="demo-grid">
          <div class="z-stack">
            <z-slider
              label="Arbeitsspeicher"
              unit="GB"
              [step]="2"
              [ticks]="arbeitsspeicherStufen"
              hint="Empfohlen für Valheim mit bis zu 10 Spielern: 6&nbsp;GB."
              [formField]="rechner.arbeitsspeicher"
            />
            <z-slider
              label="Steckplätze"
              unit="Spieler"
              [step]="2"
              [ticks]="steckplatzStufen"
              hint="Jeder Steckplatz kostet 0,20&nbsp;€ im Monat."
              [formField]="rechner.steckplaetze"
            />
            <div class="z-stack">
              <span class="title-sm">Laufzeit</span>
              <z-segment
                [options]="laufzeiten"
                [formField]="rechner.laufzeit"
                ariaLabel="Laufzeit"
              />
            </div>
          </div>

          <z-price-summary
            [label]="werte().spiel + ', monatlich'"
            [price]="preisText()"
            period="/ Monat"
            [lines]="posten()"
            note="Beispielrechnung dieser Vorschau: Grundpreis des Spiels, dazu 0,45&nbsp;€ je GB über 2&nbsp;GB und 0,20&nbsp;€ je Steckplatz über 2. Keine gültigen Preise."
          >
            <button zBtn="primary" block type="button">Server erstellen</button>
          </z-price-summary>
        </div>
      </div>
    </section>

    <section class="z-section">
      <div class="z-stack">
        <h2 class="heading-2 demo-flach">Hardware und Plattform</h2>
        <z-spec-list [items]="technik" />
      </div>
    </section>

    <section class="z-section">
      <div class="z-stack">
        <h2 class="heading-2 demo-flach">Häufige Fragen</h2>
        <div>
          <z-faq question="Wie schnell ist mein Server online?" open>
            Nach der Bestellung dauert die Einrichtung in der Regel etwa 60 Sekunden. Große Modpacks
            brauchen beim ersten Start länger, weil sie erst heruntergeladen werden.
          </z-faq>
          <z-faq question="Kann ich später mehr RAM buchen?">
            Ja, im Panel unter Upgrade. Der neue Preis gilt ab der nächsten Stunde.
          </z-faq>
          <z-faq question="Wie wird abgerechnet?">
            Nach Stunden von deinem Guthaben, nach oben gedeckelt auf den Monatspreis.
          </z-faq>
        </div>
      </div>
    </section>

    <section class="z-section demo-cta">
      <h2 class="display-lg demo-flach">Server zusammenstellen</h2>
      <a zBtn="primary" size="lg" href="#rechner">Server zusammenstellen</a>
    </section>

    <z-footer [landmark]="false">
      <z-footer-col heading="Hosting">
        <li><a href="#">Minecraft</a></li>
        <li><a href="#">Preise</a></li>
        <li><a href="#">Hardware</a></li>
      </z-footer-col>
      <z-footer-col heading="Hilfe">
        <li><a href="#">Wiki</a></li>
        <li><a href="#">Vorschläge</a></li>
        <li><a href="#">Discord</a></li>
      </z-footer-col>
      <z-footer-col heading="Rechtliches">
        <li><a href="#">Impressum</a></li>
        <li><a href="#">Datenschutz</a></li>
        <li><a href="#">AGB</a></li>
        <li><a href="#">Widerruf</a></li>
      </z-footer-col>
      <span zFooterBase>© 2026 Zenit-Hosting</span>
      <a zFooterBase href="#">Cookie-Einstellungen</a>
    </z-footer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MusterStartseitePage {
  protected readonly links = OEFFENTLICHE_LINKS;
  protected readonly spiele = SPIELE;
  protected readonly technik = TECHNIK;
  /** Right half of the hero: a real piece of the product, no illustration. */
  protected readonly vorschau = SERVER.slice(0, 3);

  protected readonly arbeitsspeicherStufen = [2, 4, 6, 8, 10, 12, 14, 16];
  protected readonly steckplatzStufen = [2, 8, 14, 20];

  protected readonly laufzeiten: ZSegmentOption[] = [
    { value: '1', label: '1 Monat' },
    { value: '3', label: '3 Monate' },
    { value: '6', label: '6 Monate' },
    { value: '12', label: '12 Monate' },
  ];

  /**
   * The calculator is one Signal Form: the order is a single value, and the
   * price is a `computed()` over it. The limits of the two sliders stand in the
   * schema, because `[formField]` owns `min` and `max` of its control and
   * hands them to `z-slider`. The game tiles are buttons, not a form control,
   * so a click writes the field directly.
   */
  protected readonly werte = signal({
    spiel: 'Valheim',
    arbeitsspeicher: 6,
    steckplaetze: 10,
    laufzeit: '6',
  });
  protected readonly rechner = form(this.werte, (pfad) => {
    min(pfad.arbeitsspeicher, 2);
    max(pfad.arbeitsspeicher, 16);
    min(pfad.steckplaetze, 2);
    max(pfad.steckplaetze, 20);
  });

  private readonly monatspreis = computed(() => {
    const { spiel, arbeitsspeicher, steckplaetze } = this.werte();
    const gewaehlt = SPIELE.find((eintrag) => eintrag.titel === spiel) ?? SPIELE[0];
    return (
      gewaehlt.grundpreis +
      (arbeitsspeicher - 2) * PREIS_JE_GB +
      (steckplaetze - 2) * PREIS_JE_STECKPLATZ
    );
  });

  protected readonly preisText = computed(() => euro(this.monatspreis()));

  protected readonly posten = computed<ZPriceLine[]>(() => {
    const { arbeitsspeicher, steckplaetze, laufzeit } = this.werte();
    const monate = Number(laufzeit);
    const zeitraum = monate === 1 ? '1\u00a0Monat' : `${monate}\u00a0Monate`;
    return [
      { label: 'Arbeitsspeicher', value: `${arbeitsspeicher}\u00a0GB` },
      { label: 'Steckplätze', value: `${steckplaetze}\u00a0Spieler` },
      { label: 'Einrichtung', value: euro(0) },
      { label: `Summe für ${zeitraum}`, value: euro(this.monatspreis() * monate) },
    ];
  });
}
