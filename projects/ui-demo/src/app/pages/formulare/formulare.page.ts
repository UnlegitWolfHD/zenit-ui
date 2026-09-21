import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  ZButton,
  ZCheckbox,
  ZPanel,
  ZSegment,
  ZSegmentOption,
  ZSetting,
  ZSlider,
  ZToggle,
} from 'zenit-ui';

@Component({
  selector: 'demo-formulare-page',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ZButton,
    ZCheckbox,
    ZPanel,
    ZSegment,
    ZSetting,
    ZSlider,
    ZToggle,
  ],
  template: `
    <h1 class="heading-1 demo-title">Formulare</h1>
    <p class="demo-lead">
      Checkbox, Toggle mit Setting, Slider und Segment in allen Zuständen. Jeder Baustein steht
      einmal mit model()-Bindung, einmal mit ngModel und einmal mit formControl da. Beispieldaten:
      Beispiel-Server 1 auf 203.0.113.10, Tarif Flex.
    </p>

    <section class="demo-section">
      <h2 class="heading-2">Checkbox</h2>
      <p class="demo-cap caption">
        Wählt Einträge für eine Sammelaktion aus oder bestätigt eine Aussage. Sie schaltet nichts
        sofort, dafür ist Toggle da.
      </p>

      <div class="demo-row">
        <p class="demo-cap caption">model()-Bindung mit [(checked)]</p>
        <z-checkbox [(checked)]="serverProperties">server.properties</z-checkbox>
        <z-checkbox [(checked)]="whitelistJson">whitelist.json</z-checkbox>
        <z-checkbox disabled>server.jar</z-checkbox>
        <span class="z-muted">
          server.properties <span class="z-mono">{{ serverProperties() }}</span
          >, whitelist.json
          <span class="z-mono">{{ whitelistJson() }}</span>
        </span>
        <p class="demo-grund caption">
          server.jar gehört zum Loader von PaperMC und lässt sich nicht auswählen.
        </p>
      </div>

      <div class="demo-row">
        <p class="demo-cap caption">Mit Link im Text</p>
        <z-checkbox [(checked)]="agb">Ich habe die <a href="#">AGB</a> gelesen.</z-checkbox>
      </div>

      <div class="demo-row">
        <p class="demo-cap caption">
          Fehler nach dem Absenden: "Weiter" ohne Haken zeigt den Satz, das Setzen des Hakens nimmt
          ihn wieder weg.
        </p>
        <div class="demo-feld">
          <z-checkbox [(checked)]="agbBestellung">
            Ich habe die <a href="#">AGB</a> gelesen.
          </z-checkbox>
          @if (agbFehler()) {
            <span class="z-field__error" role="alert">Bestätige die AGB, um fortzufahren.</span>
          }
        </div>
        <button zBtn="secondary" type="button" (click)="bestellen()">Weiter</button>
        <p class="demo-grund caption">
          z-checkbox bringt ihr eigenes label mit und kennt kein aria-describedby, deshalb steht der
          Fehlersatz hier nicht in einem z-field, sondern als role="alert" direkt unter der
          Checkbox.
        </p>
      </div>

      <div class="demo-row">
        <p class="demo-cap caption">
          Ohne sichtbaren Text, Beschriftung über ariaLabel: so steht die Checkbox in einer
          Listenzeile
        </p>
        <z-checkbox ariaLabel="Beispiel-Server 1 auswählen" [(checked)]="zeile" />
        <span class="z-muted">Beispiel-Server 1, 203.0.113.10:25565</span>
        <span class="z-muted"
          >Gewählt: <span class="z-mono">{{ zeile() }}</span></span
        >
      </div>

      <div class="demo-row">
        <p class="demo-cap caption">ngModel</p>
        <z-checkbox [(ngModel)]="autoNeustart">Neustart jede Nacht um 05:00</z-checkbox>
        <span class="z-muted"
          >Wert <span class="z-mono">{{ autoNeustart }}</span></span
        >
      </div>

      <div class="demo-row">
        <p class="demo-cap caption">formControl, dazu ein per Forms deaktiviertes</p>
        <z-checkbox [formControl]="backupVorUpdate">Backup vor dem Update</z-checkbox>
        <span class="z-muted"
          >Wert <span class="z-mono">{{ backupVorUpdate.value }}</span></span
        >
        <z-checkbox [formControl]="rconFreigabe">RCON für Mitverwalter freigeben</z-checkbox>
        <p class="demo-grund caption">
          RCON ist gesperrt, solange Beispiel-Server 1 startet. Der Wert bleibt
          <span class="z-mono">{{ rconFreigabe.value }}</span
          >.
        </p>
      </div>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">Toggle und Setting</h2>
      <p class="demo-cap caption">
        Toggle schaltet eine Einstellung, die ohne Speichern-Button wirkt. Titel, Schlüssel und
        Wirkung stehen links in der z-setting-Zeile, der Toggle rechts und zeigt per ariaLabelledby
        auf den Titel.
      </p>

      <z-panel>
        <z-setting
          title="PvP"
          key="pvp"
          description="Spieler können sich gegenseitig angreifen."
          titleId="set-pvp"
        >
          <z-toggle [(checked)]="pvp" ariaLabelledby="set-pvp" />
        </z-setting>
        <z-setting
          title="Hardcore"
          key="hardcore"
          description="Bann bei Tod, Schwierigkeit fest auf schwer."
          titleId="set-hardcore"
        >
          <z-toggle [(ngModel)]="hardcore" ariaLabelledby="set-hardcore" />
        </z-setting>
        <z-setting
          title="Whitelist"
          description="Greift nach dem nächsten Neustart."
          titleId="set-whitelist"
        >
          <z-toggle disabled ariaLabelledby="set-whitelist" />
        </z-setting>
        <z-setting
          title="Backup jede Nacht"
          key="backup.nightly"
          description="Ein Backup um 04:00, 7 Tage Aufbewahrung."
          titleId="set-backup"
        >
          <z-toggle [formControl]="nachtBackup" ariaLabelledby="set-backup" />
        </z-setting>
        <z-setting
          title="Fernsteuerung"
          key="rcon"
          description="Konsole über Port 25575 von außen."
          titleId="set-fern"
        >
          <z-toggle [formControl]="fernsteuerung" ariaLabelledby="set-fern" />
        </z-setting>
      </z-panel>

      <p class="demo-grund caption">
        PvP <span class="z-mono">{{ pvp() }}</span> über model(), Hardcore
        <span class="z-mono">{{ hardcore }}</span> über ngModel, Backup
        <span class="z-mono">{{ nachtBackup.value }}</span> über formControl. Whitelist ist über den
        Input deaktiviert, solange PaperMC installiert wird. Die Fernsteuerung ist über Forms
        deaktiviert, weil der Tarif Flex sie nicht enthält.
      </p>

      <div class="demo-row">
        <p class="demo-cap caption">
          Ohne Setting-Zeile trägt der Toggle selbst die Beschriftung über ariaLabel
        </p>
        <z-toggle ariaLabel="Wartungsmodus" [(checked)]="wartung" />
        <span class="z-muted">
          Wartungsmodus <span class="z-mono">{{ wartung() }}</span>
        </span>
      </div>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">Slider</h2>
      <p class="demo-cap caption">
        Stellt eine Menge auf einer festen Skala ein. Der Wert steht als Zahl mit Einheit daneben,
        darunter die buchbaren Stufen.
      </p>

      <div class="demo-grid">
        <z-slider
          label="Arbeitsspeicher"
          unit="GB"
          [min]="2"
          [max]="16"
          [step]="2"
          [ticks]="arbeitsspeicherStufen"
          hint="Empfohlen für Valheim mit bis zu 10 Spielern: 6&nbsp;GB."
          [(value)]="arbeitsspeicher"
        />
        <z-slider
          label="Steckplätze"
          unit="Spieler"
          [min]="2"
          [max]="20"
          [step]="2"
          [ticks]="steckplatzStufen"
          hint="Jeder Steckplatz kostet 0,20&nbsp;€ im Monat."
          [(ngModel)]="steckplaetze"
        />
        <z-slider
          label="Speicher"
          unit="GB"
          [min]="10"
          [max]="100"
          [step]="10"
          [ticks]="speicherStufen"
          hint="Weltordner und Backups zusammen."
          [formControl]="speicher"
        />
        <z-slider
          label="CPU-Kerne"
          unit="Kerne"
          [min]="1"
          [max]="8"
          [step]="1"
          [ticks]="kernStufen"
          hint="Der Tarif Flex gibt 4&nbsp;Kerne fest vor."
          [value]="4"
          disabled
        />
        <z-slider
          label="Aufbewahrung"
          unit="Tage"
          [min]="1"
          [max]="30"
          [step]="1"
          [ticks]="aufbewahrungStufen"
          hint="Der Tarif Flex speichert 7 Tage, länger geht erst ab Tarif Dauer."
          [formControl]="aufbewahrung"
        />
      </div>

      <p class="demo-grund caption">
        Arbeitsspeicher <span class="z-mono">{{ arbeitsspeicher() }}&nbsp;GB</span> über model(),
        Steckplätze <span class="z-mono">{{ steckplaetze }}&nbsp;Spieler</span> über ngModel,
        Speicher <span class="z-mono">{{ speicher.value }}&nbsp;GB</span> über formControl.
        CPU-Kerne sind über den Input deaktiviert, die Aufbewahrung über Forms.
      </p>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">Segment</h2>
      <p class="demo-cap caption">
        Segment wechselt die Sicht auf dieselben Daten, höchstens vier Optionen. Für Unterseiten mit
        eigener URL sind Tabs da.
      </p>

      <div class="demo-row">
        <p class="demo-cap caption">Drei Optionen, model()-Bindung</p>
        <z-segment [options]="zeitraeume" [(value)]="zeitraum" ariaLabel="Zeitraum" />
        <span class="z-muted"
          >Zeitraum <span class="z-mono">{{ zeitraum() }}</span> Monate</span
        >
      </div>

      <div class="demo-row">
        <p class="demo-cap caption">Zwei Optionen, ngModel</p>
        <z-segment [options]="ticketStatus" [(ngModel)]="status" ariaLabel="Ticketstatus" />
        <span class="z-muted"
          >Status <span class="z-mono">{{ status }}</span></span
        >
      </div>

      <div class="demo-row">
        <p class="demo-cap caption">formControl</p>
        <z-segment
          [options]="zeitraeume"
          [formControl]="auslastungszeitraum"
          ariaLabel="Zeitraum der Auslastung"
        />
        <span class="z-muted">
          Zeitraum <span class="z-mono">{{ auslastungszeitraum.value }}</span> Monate
        </span>
      </div>

      <div class="demo-row">
        <p class="demo-cap caption">Deaktiviert über den Input und über Forms</p>
        <z-segment
          [options]="ticketStatus"
          value="geschlossen"
          ariaLabel="Ticketstatus im Archiv"
          disabled
        />
        <z-segment
          [options]="zeitraeume"
          [formControl]="abrechnungszeitraum"
          ariaLabel="Zeitraum der laufenden Abrechnung"
        />
        <p class="demo-grund caption">
          Im Archiv sind alle Tickets geschlossen. Der Zeitraum der Abrechnung steht bis zum
          01.10.2026 fest.
        </p>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormularePage {
  // Checkbox
  protected readonly serverProperties = signal(true);
  protected readonly whitelistJson = signal(false);
  protected readonly agb = signal(false);
  protected readonly agbBestellung = signal(false);
  private readonly abgeschickt = signal(false);
  /** The error only stands after a submit and disappears as soon as the box is ticked. */
  protected readonly agbFehler = computed(() => this.abgeschickt() && !this.agbBestellung());
  protected readonly zeile = signal(false);
  protected autoNeustart = true;
  protected readonly backupVorUpdate = new FormControl(true, { nonNullable: true });
  protected readonly rconFreigabe = new FormControl(
    { value: false, disabled: true },
    { nonNullable: true },
  );

  // Toggle
  protected readonly pvp = signal(true);
  protected hardcore = false;
  protected readonly wartung = signal(false);
  protected readonly nachtBackup = new FormControl(true, { nonNullable: true });
  protected readonly fernsteuerung = new FormControl(
    { value: false, disabled: true },
    { nonNullable: true },
  );

  // Slider
  protected readonly arbeitsspeicherStufen = [2, 4, 6, 8, 10, 12, 14, 16];
  protected readonly steckplatzStufen = [2, 8, 14, 20];
  protected readonly speicherStufen = [10, 40, 70, 100];
  protected readonly kernStufen = [1, 2, 3, 4, 5, 6, 7, 8];
  protected readonly aufbewahrungStufen = [1, 10, 20, 30];
  protected readonly arbeitsspeicher = signal(6);
  protected steckplaetze = 10;
  protected readonly speicher = new FormControl(40, { nonNullable: true });
  protected readonly aufbewahrung = new FormControl(
    { value: 7, disabled: true },
    { nonNullable: true },
  );

  // Segment
  protected readonly zeitraeume: ZSegmentOption[] = [
    { value: '3', label: '3 Monate' },
    { value: '6', label: '6 Monate' },
    { value: '12', label: '12 Monate' },
  ];
  protected readonly ticketStatus: ZSegmentOption[] = [
    { value: 'offen', label: 'Offen' },
    { value: 'geschlossen', label: 'Geschlossen' },
  ];
  protected readonly zeitraum = signal('6');
  protected status = 'offen';
  protected readonly auslastungszeitraum = new FormControl('3', { nonNullable: true });
  protected readonly abrechnungszeitraum = new FormControl(
    { value: '12', disabled: true },
    { nonNullable: true },
  );

  protected bestellen(): void {
    this.abgeschickt.set(true);
  }
}
