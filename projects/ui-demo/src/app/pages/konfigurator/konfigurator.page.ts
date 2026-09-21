import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import {
  ZButton,
  ZCombobox,
  ZComboOption,
  ZCostChart,
  ZDialog,
  ZDialogActions,
  ZDialogLayout,
  ZDisclosure,
  ZField,
  ZIncludedList,
  ZInput,
  ZInputAction,
  ZOption,
  ZOptionGroup,
  ZPriceLine,
  ZPriceSummary,
  ZStickyBar,
  ZWizard,
  ZWizardActions,
  ZWizardStep,
} from 'zenit-ui';
import {
  BEZAHLMETHODEN,
  ENTHALTEN,
  JAVA_VERSIONEN,
  KLASSEN,
  laufzeitOptionen,
  ramOptionen,
  SERVER_TYPEN,
  VERSIONEN,
} from '../muster/konfigurator-daten';

/** The performance classes of the preview, Flex among them and locked. */
const KLASSEN_MIT_FLEX: ZOption[] = [
  ...KLASSEN,
  {
    value: 'flex',
    title: 'Flex',
    description: 'Zurzeit sind alle Plätze belegt.',
    price: 'ab 0,09\u00a0€ / Stunde',
    disabled: true,
    disabledReason: 'Zurzeit sind alle Plätze belegt.',
  },
];

/** A list that no filter matches, for the empty row of the Combobox. */
const KEINE_TREFFER: ZComboOption[] = [];

/**
 * A combobox in a dialog whose body scrolls: `.z-dialog` is `overflow: auto`,
 * and no container of the library is registered as `cdkScrollable`, so this is
 * the case where a panel used to hang in the air while the content under it
 * moved away. The list has to close with the first scroll of the dialog.
 */
@Component({
  selector: 'demo-anpassen-dialog',
  imports: [
    ZButton,
    ZCombobox,
    ZDialogActions,
    ZDialogLayout,
    ZField,
    ZIncludedList,
    ZInput,
    ZOptionGroup,
  ],
  template: `
    <z-dialog title="Server anpassen">
      <z-field label="Minecraft-Version" for="kd-version" hint="Tippen filtert die Liste.">
        <z-combobox
          inputId="kd-version"
          [options]="versionen"
          [(value)]="version"
          emptyText="Keine Version gefunden"
        />
      </z-field>
      <z-option-group
        legend="Arbeitsspeicher"
        hint="Spielerzahlen sind Richtwerte"
        compact
        [options]="ramStufen"
        [(value)]="ram"
      />
      <z-field label="Java-Version" for="kd-java">
        <z-combobox
          inputId="kd-java"
          [options]="javaVersionen"
          value="auto"
          emptyText="Keine Java-Version gefunden"
        />
      </z-field>
      <z-field label="Build" for="kd-build" hint="Leer lassen für den neuesten Build.">
        <input zInput mono id="kd-build" />
      </z-field>
      <z-field label="Startscript" for="kd-start">
        <input zInput mono id="kd-start" value="-Xms2G -Xmx4G" />
      </z-field>
      <z-included-list [items]="enthalten" />
      <ng-container zDialogActions>
        <button zBtn="ghost" (click)="ref.close()">Abbrechen</button>
        <button zBtn="primary" (click)="ref.close(version())">Speichern</button>
      </ng-container>
    </z-dialog>
  `,
  // The dialog has to scroll for this demo to show anything: `.z-dialog` in
  // _overlays.css takes its bound from `max-height: inherit`, and the parent of
  // the `z-dialog` element is this host, not the overlay pane, so the bound
  // never arrives and the content would simply grow past the viewport. The host
  // takes the bound the reference means, and the dialog scrolls with it.
  styles: `
    :host {
      display: block;
      max-height: calc(100vh - 2 * var(--space-5));
      overflow: auto;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnpassenDialog {
  protected readonly ref = inject<DialogRef<string>>(DialogRef);
  protected readonly versionen = VERSIONEN;
  protected readonly javaVersionen = JAVA_VERSIONEN;
  protected readonly enthalten = ENTHALTEN;
  protected readonly ramStufen = ramOptionen('neueste');
  protected readonly version = signal('neueste');
  protected readonly ram = signal(4);
}

/**
 * Gallery of the configurator building blocks: every block once per state from
 * `spec/guidelines/15-zustaende.md` and from its README.
 */
@Component({
  selector: 'demo-konfigurator-page',
  imports: [
    FormField,
    ReactiveFormsModule,
    ZButton,
    ZCombobox,
    ZCostChart,
    ZDisclosure,
    ZField,
    ZIncludedList,
    ZInput,
    ZInputAction,
    ZOptionGroup,
    ZPriceSummary,
    ZStickyBar,
    ZWizard,
    ZWizardActions,
    ZWizardStep,
  ],
  template: `
    <h1 class="display-lg demo-title">Konfigurator</h1>
    <p class="body demo-lead">
      Die acht Bausteine des Konfigurators in allen Zuständen. Diese Übersicht stellt Zustände
      nebeneinander, deshalb stehen hier mehrere primäre Buttons; auf einer echten Seite gibt es
      genau einen. Alle Preise sind Beispielwerte dieser Vorschau.
    </p>

    <section class="demo-section">
      <h2 class="heading-2">OptionCard</h2>
      <p class="demo-cap caption">
        Radiogruppe: Pfeiltasten wechseln, Tab verlässt die Gruppe. Gewählt trägt den Rahmen in
        "accent-text".
      </p>

      <div class="demo-grid demo-grid--start">
        <z-option-group legend="Server-Typ" [options]="typen" [(value)]="typ" />
        <z-option-group legend="Leistungsklasse" [options]="klassenMitFlex" [(value)]="klasse" />
      </div>

      <p class="demo-cap caption">
        Kompakt, mit dem Badge "Empfohlen" (info, höchstens einmal je Gruppe) und einer
        deaktivierten Stufe, die den Grund nennt.
      </p>
      <z-option-group
        legend="Arbeitsspeicher"
        hint="Spielerzahlen sind Richtwerte"
        compact
        [options]="ramStufen"
        [(value)]="ram"
      />

      <p class="demo-cap caption">Rabatt als Badge in success, mit echtem Minuszeichen.</p>
      <z-option-group legend="Laufzeit" compact [options]="laufzeiten" [(value)]="laufzeit" />

      <p class="demo-cap caption">
        Die ganze Gruppe deaktiviert, hier über ein gesperrtes "formControl".
      </p>
      <z-option-group legend="Bezahlmethode" [options]="bezahlmethoden" [formControl]="gesperrt" />

      <p class="demo-cap caption">Signal Forms über "[formField]".</p>
      <z-option-group legend="Server-Typ" [options]="typen" [formField]="formular.typ" />
      <p class="demo-grund body-sm">Gewählt: {{ formular.typ().value() }}</p>

      <p class="demo-cap caption">Im Minecraft-Subtheme trägt die gewählte Karte mc-accent.</p>
      <div class="z-theme-mc">
        <z-option-group legend="Server-Typ" [options]="typen" [(value)]="typMc" />
      </div>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">Combobox</h2>
      <p class="demo-cap caption">
        Tippen filtert über Bezeichnung und Zusatz, Pfeile bewegen, Enter wählt, Escape schließt.
        Der Fokus bleibt im Feld.
      </p>
      <div class="demo-grid demo-grid--narrow demo-grid--start">
        <z-field
          label="Minecraft-Version"
          for="kf-version"
          hint="Gruppen: Aktuell, Ältere, Snapshots."
        >
          <z-combobox
            inputId="kf-version"
            [options]="versionen"
            [(value)]="version"
            emptyText="Keine Version gefunden"
          />
        </z-field>

        <z-field label="Java-Version" for="kf-java" error="Java 8 unterstützen wir nicht mehr.">
          <z-combobox inputId="kf-java" [options]="javaVersionen" value="17" />
        </z-field>

        <z-field label="Modpack" for="kf-leer" hint="Diese Liste ist leer.">
          <z-combobox
            inputId="kf-leer"
            [options]="keineTreffer"
            placeholder="Modpack suchen"
            emptyText="Keine Version gefunden"
          />
        </z-field>

        <z-field label="Region" for="kf-gesperrt" hint="Nur Nürnberg verfügbar.">
          <z-combobox inputId="kf-gesperrt" [options]="regionen" value="nbg" disabled />
        </z-field>
      </div>

      <p class="demo-cap caption">
        Im Dialog: der Inhalt des Dialogs scrollt, und die Liste gehört zu ihrem Feld. Sobald etwas
        um das Feld herum scrollt, schließt sie sich, wie es ein natives "select" tut.
      </p>
      <div class="demo-row">
        <button zBtn="secondary" type="button" (click)="versionWechseln()">Server anpassen</button>
      </div>
      @if (dialogVersion(); as gewaehlt) {
        <p class="demo-grund body-sm">Im Dialog gewählt: {{ gewaehlt }}</p>
      }
    </section>

    <section class="demo-section">
      <h2 class="heading-2">Wizard</h2>
      <p class="demo-cap caption">
        Erledigt (eingeklappt mit Kurzfassung und "Ändern"), aktuell (offen, mit
        "aria-current=step") und gesperrt.
      </p>
      <z-wizard>
        <z-wizard-step
          title="Inhalt"
          summary="Vanilla, neueste Version"
          state="done"
          (edit)="geaendert.set('Inhalt')"
        />
        <z-wizard-step title="Größe" state="current">
          <z-option-group
            legend="Arbeitsspeicher"
            compact
            [options]="ramStufen"
            [(value)]="wizardRam"
          />
          <button zWizardActions zBtn="ghost" type="button">Zurück</button>
          <button zWizardActions zBtn="secondary" type="button">Weiter zu Bezahlen</button>
        </z-wizard-step>
        <z-wizard-step title="Bezahlen" summary="Name, Laufzeit, Bezahlmethode" state="locked" />
      </z-wizard>
      @if (geaendert(); as schritt) {
        <p class="demo-grund body-sm">"Ändern" im Schritt {{ schritt }} ausgelöst.</p>
      }
    </section>

    <section class="demo-section">
      <h2 class="heading-2">StickyBar</h2>
      <p class="demo-cap caption">
        Hier in einem Rahmen statt am Fensterrand, damit die Leiste auf dieser Seite sichtbar bleibt
        und nicht die Seite selbst besetzt. Im Muster klebt sie unter 900px am unteren Rand.
      </p>
      <div class="demo-rahmen">
        <p class="demo-grund body-sm">Inhalt über der Leiste.</p>
        <z-sticky-bar price="7,74&nbsp;€" summary="Minecraft, 4 GB, alle 30 Tage">
          <button zBtn="primary" type="button">Weiter</button>
        </z-sticky-bar>
      </div>

      <p class="demo-cap caption">Dieselbe Leiste als Sammelaktion in einer Liste.</p>
      <div class="demo-rahmen">
        <p class="demo-grund body-sm">Dateiliste.</p>
        <z-sticky-bar price="2 ausgewählt" summary="world.zip, plugins.zip">
          <button zBtn="secondary" type="button">Herunterladen</button>
        </z-sticky-bar>
      </div>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">IncludedList</h2>
      <p class="demo-cap caption">Steht unter der Zusammenfassung, genau einmal je Seite.</p>
      <div class="demo-narrow">
        <z-included-list [items]="enthalten" />
      </div>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">Disclosure</h2>
      <p class="demo-cap caption">
        Natives "details": zu, offen, und mit einer Kurzzeile, die die Änderung darin zeigt.
      </p>
      <z-disclosure title="Expertenmodus" summary="Build, Java-Version, Startscript">
        <z-field label="Startparameter" for="kf-args">
          <input zInput mono id="kf-args" value="-Xms2G -Xmx4G" />
        </z-field>
      </z-disclosure>
      <z-disclosure
        title="Expertenmodus"
        summary="Java 21, eigene Startparameter"
        [(open)]="expertenOffen"
      >
        <z-field label="Startparameter" for="kf-args2">
          <input zInput mono id="kf-args2" value="-Xms4G -Xmx8G -XX:+UseG1GC" />
        </z-field>
      </z-disclosure>
      <p class="demo-grund body-sm">Zweite Disclosure offen: {{ expertenOffen() }}</p>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">InputAction</h2>
      <p class="demo-cap caption">
        Enter im Feld löst den Button aus, bei leerem Feld und während der Prüfung nicht.
      </p>
      <div class="demo-grid demo-grid--start">
        <z-input-action label="Gutscheincode (optional)" actionLabel="Einlösen" value="" />
        <z-input-action
          label="Gutscheincode (optional)"
          actionLabel="Einlösen"
          value="ZENIT10"
          loading
        />
        <z-input-action
          label="Gutscheincode (optional)"
          actionLabel="Einlösen"
          value="ZENIT10"
          success="Gutschein ZENIT10 eingelöst: −0,77&nbsp;€"
        />
        <z-input-action
          label="Gutscheincode (optional)"
          actionLabel="Einlösen"
          value="SOMMER"
          error="Dieser Code ist am 31.08.2026 abgelaufen."
        />
        <z-input-action
          label="Gutscheincode (optional)"
          actionLabel="Einlösen"
          value="ZENIT10"
          disabled
        />
        <z-input-action
          label="Subdomain"
          actionLabel="Prüfen"
          [(value)]="subdomain"
          [success]="subdomainErfolg()"
          (action)="pruefeSubdomain($event)"
        />
      </div>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">CostChart</h2>
      <p class="demo-cap caption">
        Eine Reihe, deshalb neutral in "text" und ohne Legende. Zeiger und Tastatur (Pfeile, Home,
        Ende) zeigen dieselbe Ablesung.
      </p>
      <div class="demo-diagramm">
        <z-cost-chart
          [base]="1.5"
          [rate]="0.088"
          [cap]="10.3"
          [maxHours]="150"
          caption="Normal mit 4 GB: 1,50 € Grundbetrag plus 0,09 € je Stunde, nie mehr als 10,30 € im Monat."
        />
      </div>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">PriceSummary</h2>
      <p class="demo-cap caption">
        Die neuen Zustände: lädt, Fehler, unvollständig, sowie Rabatt- und Gutscheinzeile mit Summe
        und Steuerhinweis.
      </p>
      <div class="demo-grid demo-grid--wide demo-grid--start">
        <z-price-summary
          label="Minecraft, alle 30 Tage (lädt)"
          price="7,74&nbsp;€"
          [lines]="einfachePosten"
          loading
          note="Der Preis wird neu berechnet."
        >
          <button zBtn="primary" block type="button" disabled>Kostenpflichtig bestellen</button>
        </z-price-summary>

        <z-price-summary
          label="Minecraft, alle 30 Tage (Fehler)"
          price="7,74&nbsp;€"
          [lines]="einfachePosten"
          error="Der Preis konnte nicht berechnet werden. Versuche es erneut."
          note="Der Preis steht noch nicht fest."
          (retry)="neuBerechnet.set(true)"
        >
          <button zBtn="primary" block type="button" disabled>Kostenpflichtig bestellen</button>
        </z-price-summary>

        <z-price-summary
          label="Minecraft, alle 30 Tage (unvollständig)"
          price="7,74&nbsp;€"
          [lines]="einfachePosten"
          note="Wähle noch eine Bezahlmethode"
        >
          <button zBtn="primary" block type="button" disabled>Kostenpflichtig bestellen</button>
        </z-price-summary>

        <z-price-summary
          label="Minecraft, alle 180 Tage"
          price="41,49&nbsp;€"
          [lines]="rabattPosten"
          [total]="summe"
          note="Nach Stunden abgerechnet, jederzeit kündbar."
          legalNote="Gemäß § 19 UStG wird keine Umsatzsteuer berechnet."
        >
          <button zBtn="primary" block type="button">Kostenpflichtig bestellen</button>
        </z-price-summary>
      </div>
      @if (neuBerechnet()) {
        <p class="demo-grund body-sm">"Erneut versuchen" ausgelöst.</p>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KonfiguratorPage {
  protected readonly typen = SERVER_TYPEN;
  protected readonly klassenMitFlex = KLASSEN_MIT_FLEX;
  protected readonly bezahlmethoden = BEZAHLMETHODEN;
  protected readonly versionen = VERSIONEN;
  protected readonly javaVersionen = JAVA_VERSIONEN;
  protected readonly keineTreffer = KEINE_TREFFER;
  protected readonly enthalten = ENTHALTEN;
  protected readonly ramStufen = ramOptionen('neueste');
  protected readonly laufzeiten = laufzeitOptionen('normal', 4);

  protected readonly regionen: ZComboOption[] = [
    { value: 'nbg', label: 'Nürnberg', note: 'in etwa 15 ms' },
  ];

  protected readonly typ = signal('vanilla');
  protected readonly typMc = signal('plugins');
  protected readonly klasse = signal('normal');
  protected readonly ram = signal(4);
  protected readonly wizardRam = signal(4);
  protected readonly laufzeit = signal(30);
  protected readonly version = signal('neueste');
  protected readonly expertenOffen = signal(true);
  protected readonly geaendert = signal('');
  protected readonly neuBerechnet = signal(false);
  protected readonly subdomain = signal('beispiel');
  protected readonly dialogVersion = signal('');
  private readonly gepruefteSubdomain = signal('');
  private readonly dialog = inject(ZDialog);

  /** A locked reactive control: that is how a whole group is disabled. */
  protected readonly gesperrt = new FormControl({ value: 'paypal', disabled: true });

  /** The same group through Signal Forms. */
  private readonly modell = signal({ typ: 'mods' });
  protected readonly formular = form(this.modell);

  protected readonly subdomainErfolg = computed(() =>
    this.gepruefteSubdomain() ? `${this.gepruefteSubdomain()}.zenit.example ist frei.` : '',
  );

  protected readonly einfachePosten: ZPriceLine[] = [
    { label: 'Typ', value: 'Vanilla' },
    { label: 'Version', value: 'Neueste' },
    { label: 'Arbeitsspeicher', value: '4\u00a0GB' },
  ];

  protected readonly rabattPosten: ZPriceLine[] = [
    { label: 'Typ', value: 'Vanilla' },
    { label: 'Arbeitsspeicher', value: '4\u00a0GB' },
    { label: 'Laufzeit 180\u00a0Tage', value: '46,44\u00a0€' },
    { label: 'Laufzeitrabatt', value: '−4,18\u00a0€', discount: true },
    { label: 'Gutschein ZENIT10', value: '−0,77\u00a0€', discount: true },
  ];

  protected readonly summe = { label: 'Summe', value: '41,49\u00a0€' };

  protected pruefeSubdomain(wert: string): void {
    this.gepruefteSubdomain.set(wert.trim());
  }

  protected versionWechseln(): void {
    this.dialog
      .open<string, unknown, AnpassenDialog>(AnpassenDialog)
      .closed.subscribe((wert) => this.dialogVersion.set(wert ?? ''));
  }
}
