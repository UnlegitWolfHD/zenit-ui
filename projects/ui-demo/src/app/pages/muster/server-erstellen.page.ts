import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  signal,
  untracked,
} from '@angular/core';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ZAlert,
  ZButton,
  ZCombobox,
  ZConfig,
  ZConfigAside,
  ZDisclosure,
  ZField,
  ZIncludedList,
  ZInput,
  ZInputAction,
  ZOptionGroup,
  ZPageHeader,
  ZPriceLine,
  ZPriceSummary,
  ZSetting,
  ZStickyBar,
  ZToast,
  ZToastOutlet,
  ZToggle,
  ZWizard,
  ZWizardActions,
  ZWizardStep,
} from 'zenit-ui';
import {
  angehobenerRam,
  BEZAHLMETHODEN,
  DemoAuswahl,
  ENTHALTEN,
  euro,
  gutscheinFehler,
  JAVA_VERSIONEN,
  KLASSEN,
  laufzeitOptionen,
  MINECRAFT_GRUNDBETRAG,
  mindestRam,
  minusEuro,
  ramOptionen,
  RAM_STUFEN,
  RECHNER_SPIELE,
  rechnung,
  SERVER_TYPEN,
  version,
  VERSIONEN,
  VORGABE,
} from './konfigurator-daten';

/** How long the simulated recalculation of the price takes. */
const RECHENDAUER = 220;

/** The parameters the whole selection fits into. */
type Parameter = Record<string, string>;

/**
 * The configurator pattern of `spec/guidelines/12-konfigurator.md`: PageHeader,
 * then `z-config` with the wizard on the left and the summary on the right.
 * Three steps, every default valid and orderable, the whole selection in the
 * query parameters.
 */
@Component({
  selector: 'demo-muster-server-erstellen-page',
  imports: [
    FormField,
    ZAlert,
    ZButton,
    ZCombobox,
    ZConfig,
    ZConfigAside,
    ZDisclosure,
    ZField,
    ZIncludedList,
    ZInput,
    ZInputAction,
    ZOptionGroup,
    ZPageHeader,
    ZPriceSummary,
    ZSetting,
    ZStickyBar,
    ZToastOutlet,
    ZToggle,
    ZWizard,
    ZWizardActions,
    ZWizardStep,
  ],
  template: `
    <div class="demo-kundenbereich">
      <z-page-header title="Server erstellen" sub="Beispielrechnung dieser Vorschau" />

      <div class="demo-steuerung">
        <span class="body-sm">Demo-Schalter</span>
        <z-setting title="Preisberechnung schlägt fehl" titleId="demo-preisfehler">
          <z-toggle [(checked)]="preisFehlerSchalter" ariaLabelledby="demo-preisfehler" />
        </z-setting>
      </div>

      @if (uebernahme(); as satz) {
        <z-alert status="info" title="Diese Vorschau zeigt den Ablauf für Minecraft" icon="info">
          {{ satz }}
        </z-alert>
      }

      <z-config>
        <z-wizard>
          <z-wizard-step
            headingLevel="2"
            title="Inhalt"
            [state]="zustand(1)"
            [summary]="schritt() > 1 ? kurzInhalt() : 'Server-Typ und Version'"
            (edit)="geheZu(1)"
          >
            <z-option-group legend="Server-Typ" [options]="typen" [formField]="formular.typ" />
            <z-field
              label="Minecraft-Version"
              for="se-version"
              [hint]="ramHinweis() || 'Die Liste zeigt aktuelle, ältere und Snapshot-Versionen.'"
            >
              <z-combobox
                inputId="se-version"
                [options]="versionen"
                emptyText="Keine Version gefunden"
                [formField]="formular.version"
              />
            </z-field>
            <button zWizardActions zBtn="secondary" type="button" (click)="geheZu(2)">
              Weiter zu Größe
            </button>
          </z-wizard-step>

          <z-wizard-step
            headingLevel="2"
            title="Größe"
            [state]="zustand(2)"
            [summary]="schritt() > 2 ? kurzGroesse() : 'Arbeitsspeicher und Leistungsklasse'"
            (edit)="geheZu(2)"
          >
            <z-option-group
              legend="Arbeitsspeicher"
              hint="Spielerzahlen sind Richtwerte"
              compact
              [options]="ramStufen()"
              [formField]="formular.ramGb"
            />
            @if (ramHinweis(); as satz) {
              <p class="demo-grund body-sm">{{ satz }}</p>
            }
            <z-option-group
              legend="Leistungsklasse"
              [options]="klassen"
              [formField]="formular.klasse"
            />
            <button zWizardActions zBtn="ghost" type="button" (click)="geheZu(1)">Zurück</button>
            <button zWizardActions zBtn="secondary" type="button" (click)="geheZu(3)">
              Weiter zu Bezahlen
            </button>
          </z-wizard-step>

          <z-wizard-step
            headingLevel="2"
            title="Bezahlen"
            [state]="zustand(3)"
            summary="Name, Gutschein, Laufzeit, Bezahlmethode"
            (edit)="geheZu(3)"
          >
            <z-field label="Servername (optional)" for="se-name">
              <input zInput id="se-name" [formField]="formular.name" />
            </z-field>

            <z-input-action
              label="Gutscheincode (optional)"
              actionLabel="Einlösen"
              [(value)]="gutscheinFeld"
              [loading]="gutscheinLaeuft()"
              [success]="gutscheinErfolg()"
              [error]="gutscheinFehlerText()"
              (action)="loeseEin($event)"
            />

            <z-option-group
              legend="Laufzeit"
              compact
              [options]="laufzeiten()"
              [formField]="formular.tage"
            />

            <z-option-group
              legend="Bezahlmethode"
              [options]="bezahlmethoden"
              [formField]="formular.bezahlung"
            />

            <z-setting
              title="Automatisch verlängern"
              key="auto_renew"
              description="Der Server läuft nach der Laufzeit weiter."
              titleId="se-verlaengern"
            >
              <z-toggle [formField]="formular.verlaengern" ariaLabelledby="se-verlaengern" />
            </z-setting>

            <z-disclosure
              title="Expertenmodus"
              [summary]="expertenZeile()"
              [(open)]="expertenOffen"
            >
              <z-field label="Build" for="se-build" hint="Leer lassen für den neuesten Build.">
                <input zInput mono id="se-build" [formField]="formular.build" />
              </z-field>
              <z-field label="Java-Version" for="se-java">
                <z-combobox
                  inputId="se-java"
                  [options]="javaVersionen"
                  emptyText="Keine Java-Version gefunden"
                  [formField]="formular.java"
                />
              </z-field>
              <z-field label="Startscript" for="se-start">
                <input zInput mono id="se-start" [formField]="formular.start" />
              </z-field>
            </z-disclosure>

            <button zWizardActions zBtn="ghost" type="button" (click)="geheZu(2)">Zurück</button>
          </z-wizard-step>
        </z-wizard>

        <div zConfigAside class="z-stack">
          <z-price-summary
            [label]="summenLabel()"
            [price]="preisText()"
            [lines]="posten()"
            [total]="summenZeile()"
            [loading]="preisLaedt()"
            [error]="
              preisFehler() ? 'Der Preis konnte nicht berechnet werden. Versuche es erneut.' : ''
            "
            [note]="hinweisText()"
            legalNote="Gemäß § 19 UStG wird keine Umsatzsteuer berechnet."
            (retry)="berechneNeu()"
          >
            <button
              zBtn="primary"
              block
              type="button"
              [disabled]="!bestellbar()"
              (click)="bestellen()"
            >
              Kostenpflichtig bestellen
            </button>
          </z-price-summary>
          <z-included-list [items]="enthalten" />
        </div>
      </z-config>

      <z-sticky-bar [price]="preisText()" [summary]="kurzAlles()" mobileOnly>
        @if (schritt() < 3) {
          <button zBtn="secondary" type="button" (click)="geheZu(schritt() + 1)">Weiter</button>
        } @else {
          <button zBtn="secondary" type="button" [disabled]="!bestellbar()" (click)="bestellen()">
            Kostenpflichtig bestellen
          </button>
        }
      </z-sticky-bar>
    </div>
    <z-toast-outlet />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MusterServerErstellenPage {
  protected readonly typen = SERVER_TYPEN;
  protected readonly klassen = KLASSEN;
  protected readonly versionen = VERSIONEN;
  protected readonly javaVersionen = JAVA_VERSIONEN;
  protected readonly bezahlmethoden = BEZAHLMETHODEN;
  protected readonly enthalten = ENTHALTEN;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ZToast);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /**
   * The whole form is one Signal Form over one model signal, and every derived
   * value is a `computed` over it. The price logic itself lives in
   * `konfigurator-daten.ts` as pure functions. Numbers stay numbers: the option
   * groups are typed on their value, so nothing is converted on the way in or
   * out.
   */
  protected readonly werte = signal({
    ...VORGABE,
    name: '',
    verlaengern: true,
    build: '',
    java: 'auto',
    start: '',
  });

  protected readonly formular = form(this.werte, (pfad) => {
    required(pfad.bezahlung, { message: 'Wähle eine Bezahlmethode.' });
  });

  protected readonly schritt = signal(1);
  protected readonly expertenOffen = signal(false);
  protected readonly preisFehlerSchalter = signal(false);
  protected readonly preisLaedt = signal(false);
  protected readonly preisFehler = signal(false);

  protected readonly gutscheinFeld = signal('');
  protected readonly gutscheinLaeuft = signal(false);
  protected readonly gutscheinErfolg = signal('');
  protected readonly gutscheinFehlerText = signal('');
  /** The voucher that is really applied, not what stands in the field. */
  private readonly gutscheinCode = signal('');

  /** What the price calculator last came back with, and what the page shows. */
  private readonly bestaetigterPreis = signal('');
  /** Set when the selection arrived from the calculator with another game. */
  private readonly uebernommenesSpiel = signal('');

  private rechenTimer?: ReturnType<typeof setTimeout>;
  private pruefTimer?: ReturnType<typeof setTimeout>;

  /** The selection as the pure functions want it. */
  private readonly auswahl = computed<DemoAuswahl>(() => {
    const { typ, version: v, ramGb, klasse, tage, bezahlung, grundbetrag } = this.werte();
    return { typ, version: v, ramGb, klasse, tage, bezahlung, grundbetrag };
  });

  protected readonly ramStufen = computed(() => ramOptionen(this.werte().version));
  protected readonly laufzeiten = computed(() =>
    laufzeitOptionen(this.werte().klasse, this.werte().ramGb, this.werte().grundbetrag),
  );

  /** The raise that has happened, so the sentence about it can stand still. */
  private readonly angehoben = signal<{ version: string; gb: number } | null>(null);

  /**
   * The one sentence about a choice that moved another. It stands as long as
   * the raised state stands: a different version or a different RAM step takes
   * it away, because then the sentence would not be about what is on screen.
   */
  protected readonly ramHinweis = computed(() => {
    const stand = this.angehoben();
    const { version: v, ramGb } = this.werte();
    if (!stand || stand.version !== v || stand.gb !== ramGb) {
      return '';
    }
    return `Auf ${ramGb}\u00a0GB angehoben, weil ${version(v).kurz} das verlangt`;
  });

  /** What the calculator handed over, once, above the wizard. */
  protected readonly uebernahme = computed(() => {
    const spiel = this.uebernommenesSpiel();
    if (!spiel) {
      return '';
    }
    const { klasse, ramGb, tage } = this.werte();
    const klassenname = this.klassen.find((e) => e.value === klasse)?.title ?? '';
    return (
      `Für ${spiel} gibt es hier noch keinen eigenen Ablauf. Übernommen sind ` +
      `${ramGb}\u00a0GB, ${klassenname} und ${tage}\u00a0Tage; Server-Typ und Version ` +
      `gehören zu Minecraft. Wechsle im Preisrechner zurück, wenn du ${spiel} wolltest.`
    );
  });

  private readonly summe = computed(() => rechnung(this.auswahl(), this.gutscheinCode()));

  /**
   * The number on screen. While a calculation runs it is the last one that came
   * back, never the new one in muted grey: a price a customer reads has been
   * confirmed.
   */
  protected readonly preisText = computed(() =>
    this.preisLaedt() ? this.bestaetigterPreis() : euro(this.summe().summe),
  );

  /** Whether anything is taken off, which is what a sum line is there for. */
  private readonly mitRabatt = computed(
    () => !!this.summe().laufzeitrabatt || !!this.summe().gutschein,
  );

  // One fact, one place: without a deduction the sum is the price in the head
  // already, so neither the sum nor the price before the discount gets a line.
  protected readonly summenZeile = computed(() =>
    this.mitRabatt() ? { label: 'Summe', value: euro(this.summe().summe) } : null,
  );

  protected readonly posten = computed<ZPriceLine[]>(() => {
    const { typ, version: v, klasse, tage, ramGb } = this.werte();
    const zahl = this.summe();
    const zeilen: ZPriceLine[] = [
      { label: 'Typ', value: this.typen.find((e) => e.value === typ)?.title ?? '' },
      { label: 'Version', value: version(v).label },
      { label: 'Arbeitsspeicher', value: `${angehobenerRam(ramGb, v)}\u00a0GB` },
      {
        label: 'Leistungsklasse',
        value: this.klassen.find((e) => e.value === klasse)?.title ?? '',
      },
      { label: 'Laufzeit', value: `${tage}\u00a0Tage` },
    ];
    if (this.mitRabatt()) {
      zeilen.push({ label: `Preis für ${tage}\u00a0Tage`, value: euro(zahl.vorRabatt) });
    }
    if (zahl.laufzeitrabatt) {
      zeilen.push({
        label: 'Laufzeitrabatt',
        value: minusEuro(zahl.laufzeitrabatt),
        discount: true,
      });
    }
    if (zahl.gutschein) {
      zeilen.push({
        label: `Gutschein ${this.gutscheinCode()}`,
        value: minusEuro(zahl.gutschein),
        discount: true,
      });
    }
    return zeilen;
  });

  /**
   * Everything the order needs before the button opens: the last step, a
   * payment method, and a price that has come back. An unconfirmed price is not
   * a price to order on.
   */
  protected readonly bestellbar = computed(
    () =>
      this.schritt() === 3 && !!this.werte().bezahlung && !this.preisFehler() && !this.preisLaedt(),
  );

  protected readonly hinweisText = computed(() => {
    if (this.preisFehler()) {
      return 'Der Preis steht noch nicht fest.';
    }
    if (this.preisLaedt()) {
      return 'Der Preis wird neu berechnet.';
    }
    if (!this.werte().bezahlung) {
      return 'Wähle noch eine Bezahlmethode';
    }
    if (this.schritt() < 3) {
      return 'Bestellen kannst du im letzten Schritt.';
    }
    return 'Nach Stunden abgerechnet, jederzeit kündbar.';
  });

  protected readonly summenLabel = computed(() => `Minecraft, alle ${this.werte().tage}\u00a0Tage`);

  protected readonly kurzInhalt = computed(
    () =>
      `${this.typen.find((e) => e.value === this.werte().typ)?.title}, ${version(this.werte().version).label}`,
  );

  protected readonly kurzGroesse = computed(
    () =>
      `${angehobenerRam(this.werte().ramGb, this.werte().version)}\u00a0GB, ` +
      `${this.klassen.find((e) => e.value === this.werte().klasse)?.title}`,
  );

  protected readonly kurzAlles = computed(
    () => `Minecraft, ${this.kurzGroesse()}, alle ${this.werte().tage}\u00a0Tage`,
  );

  protected readonly expertenZeile = computed(() => {
    const { build, java, start } = this.werte();
    const teile = [
      build || 'neuester Build',
      this.javaVersionen.find((e) => e.value === java)?.label ?? '',
      start || 'Standard-Startscript',
    ];
    return teile.filter(Boolean).join(', ');
  });

  constructor() {
    this.ausUrl();
    this.bestaetigterPreis.set(euro(this.summe().summe));

    // The URL carries the whole selection, so a link is shareable and a reload
    // brings the state back, step included.
    effect(() => {
      const parameter = this.alsParameter();
      untracked(() => {
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: parameter,
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      });
    });

    // A price that is recomputed shows the last confirmed number with a
    // spinner, never a dash and never the new number before it is confirmed.
    // The delay is simulated; a real page would wait for its service. The first
    // run is skipped: the page opens with a price that is already right.
    let ersterLauf = true;
    effect(() => {
      this.preisSchluessel();
      untracked(() => {
        if (ersterLauf) {
          ersterLauf = false;
          return;
        }
        this.berechneNeu();
      });
    });

    // The RAM the version demands is written into the model, so the card that
    // is checked, the summary and the price are the same value. The jump is
    // visible, and ramHinweis() says why it happened.
    effect(() => {
      const { ramGb, version: v } = this.werte();
      const echt = angehobenerRam(ramGb, v);
      if (echt !== ramGb) {
        untracked(() => {
          this.formular.ramGb().value.set(echt);
          this.angehoben.set({ version: v, gb: echt });
        });
      }
    });

    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.rechenTimer);
      clearTimeout(this.pruefTimer);
    });
  }

  protected zustand(nummer: number): 'done' | 'current' | 'locked' {
    if (nummer === this.schritt()) {
      return 'current';
    }
    return nummer < this.schritt() ? 'done' : 'locked';
  }

  protected geheZu(nummer: number): void {
    this.schritt.set(Math.min(Math.max(nummer, 1), 3));
    // The focus follows the content: it lands on the heading of the step that
    // is open now, and the page scrolls to it.
    afterNextRender(
      () => {
        const titel = this.host.nativeElement.querySelector<HTMLElement>(
          '[aria-current="step"] .z-wstep__title',
        );
        titel?.focus();
        titel?.scrollIntoView({ block: 'start', behavior: 'auto' });
      },
      { injector: this.injector },
    );
  }

  protected loeseEin(code: string): void {
    this.gutscheinLaeuft.set(true);
    this.gutscheinErfolg.set('');
    this.gutscheinFehlerText.set('');
    clearTimeout(this.pruefTimer);
    this.pruefTimer = setTimeout(() => {
      this.gutscheinLaeuft.set(false);
      const fehler = gutscheinFehler(code);
      if (fehler) {
        this.gutscheinCode.set('');
        this.gutscheinFehlerText.set(fehler);
        return;
      }
      this.gutscheinCode.set(code.trim().toUpperCase());
      const betrag = rechnung(this.auswahl(), this.gutscheinCode()).gutschein;
      this.gutscheinErfolg.set(`Gutschein ${this.gutscheinCode()} eingelöst: ${minusEuro(betrag)}`);
    }, RECHENDAUER);
  }

  protected berechneNeu(): void {
    clearTimeout(this.rechenTimer);
    this.preisFehler.set(false);
    this.preisLaedt.set(true);
    this.rechenTimer = setTimeout(() => {
      this.preisLaedt.set(false);
      const fehlgeschlagen = this.preisFehlerSchalter();
      this.preisFehler.set(fehlgeschlagen);
      if (!fehlgeschlagen) {
        this.bestaetigterPreis.set(euro(this.summe().summe));
      }
    }, RECHENDAUER);
  }

  protected bestellen(): void {
    // submit() touches every field, so a missing payment method shows at once.
    void submit(this.formular, async () => {
      this.toast.success('Beispiel: Bestellung ausgelöst');
    });
  }

  /** Everything that changes the price, as one value an effect can watch. */
  private readonly preisSchluessel = computed(() =>
    [
      this.werte().klasse,
      this.werte().ramGb,
      this.werte().tage,
      this.werte().grundbetrag,
      this.gutscheinCode(),
      this.preisFehlerSchalter(),
    ].join('|'),
  );

  private readonly alsParameter = computed<Parameter>(() => {
    const { typ, version: v, ramGb, klasse, tage, bezahlung } = this.werte();
    return {
      typ,
      version: v,
      ram: String(ramGb),
      klasse,
      tage: String(tage),
      bezahlung: bezahlung || 'offen',
      schritt: String(this.schritt()),
      spiel: this.uebernommenesSpiel() || 'minecraft',
    };
  });

  /** Reads the query parameters, and falls back to the valid default for each. */
  private ausUrl(): void {
    const p = this.route.snapshot.queryParamMap;
    const einer = <T extends { value?: string }>(liste: readonly T[], wert: string | null) =>
      liste.some((e) => (e as { value?: string }).value === wert) ? (wert as string) : '';

    const gewaehlteVersion = einer(VERSIONEN, p.get('version')) || VORGABE.version;
    const ramParameter = Number(p.get('ram'));
    const istStufe = RAM_STUFEN.some((stufe) => stufe.gb === ramParameter);
    const ram = istStufe ? ramParameter : mindestRam(gewaehlteVersion);
    const angehobenerWert = angehobenerRam(ram, gewaehlteVersion);
    const tage = [30, 90, 180].includes(Number(p.get('tage')))
      ? Number(p.get('tage'))
      : VORGABE.tage;

    // A raise that comes in through the URL is a raise too, and the sentence
    // under the field has to say so: without this the price would silently be
    // one step above what the link asked for.
    if (istStufe && angehobenerWert !== ram) {
      this.angehoben.set({ version: gewaehlteVersion, gb: angehobenerWert });
    }

    const spiel = RECHNER_SPIELE.find((eintrag) => eintrag.titel === p.get('spiel'));
    if (spiel) {
      this.uebernommenesSpiel.set(spiel.titel);
    }

    this.werte.update((alt) => ({
      ...alt,
      typ: einer(SERVER_TYPEN, p.get('typ')) || VORGABE.typ,
      version: gewaehlteVersion,
      ramGb: angehobenerWert,
      klasse: einer(KLASSEN, p.get('klasse')) || VORGABE.klasse,
      tage,
      bezahlung: einer(BEZAHLMETHODEN, p.get('bezahlung')),
      grundbetrag: spiel?.grundbetrag ?? MINECRAFT_GRUNDBETRAG,
    }));
    const schritt = Number(p.get('schritt'));
    this.schritt.set([1, 2, 3].includes(schritt) ? schritt : 1);
  }
}
