import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  ZButton,
  ZConsole,
  ZConsoleLine,
  ZFaq,
  ZGameGrid,
  ZGameTile,
  ZHero,
  ZHeroActions,
  ZHeroAside,
  ZIcon,
  ZPanel,
  ZPanelActions,
  ZPriceLine,
  ZPriceSummary,
  ZSpecItem,
  ZSpecList,
} from 'zenit-ui';

const STARTZEILEN: ZConsoleLine[] = [
  { time: '[12:04:27]', text: 'Starting minecraft server version 1.21.4' },
  { time: '[12:04:29]', text: 'Preparing level "world"' },
  { time: '[12:04:31]', text: 'Done (4.213s)! For help, type "help"' },
  {
    time: '[12:06:02]',
    text: "WARN Can't keep up! Is the server overloaded? Running 2140ms behind",
    level: 'warn',
  },
  {
    time: '[12:06:40]',
    text: "ERROR Could not load 'plugins/WorldGuard.jar': missing dependency WorldEdit",
    level: 'error',
  },
  { time: '[12:07:15]', text: '> whitelist add Steve', level: 'cmd' },
  { time: '[12:07:15]', text: 'Added Steve to the whitelist' },
];

@Component({
  selector: 'demo-werkzeuge-page',
  imports: [
    ZButton,
    ZConsole,
    ZFaq,
    ZGameGrid,
    ZGameTile,
    ZHero,
    ZHeroActions,
    ZHeroAside,
    ZIcon,
    ZPanel,
    ZPanelActions,
    ZPriceSummary,
    ZSpecList,
  ],
  template: `
    <h1 class="heading-1 demo-title">Werkzeuge</h1>
    <p class="demo-lead">
      Console, Hero, GameTile, PriceSummary, SpecList und Faq. Beispieldaten: Beispiel-Server 1 mit
      PaperMC. Preise und FAQ-Antworten sind Beispieltext aus den Vorschauen.
    </p>

    <section class="demo-section">
      <h2 class="heading-2">Console</h2>
      <p class="demo-cap caption">
        Werkzeugleiste, Log und Eingabe. In dieser Demo tut nur "Leeren" etwas.
      </p>

      <div class="demo-row">
        <button zBtn="ghost" size="sm"><z-icon name="content_copy" size="sm" />Log kopieren</button>
        <button zBtn="ghost" size="sm"><z-icon name="download" size="sm" />Log herunterladen</button>
        <button zBtn="ghost" size="sm" (click)="leeren()">
          <z-icon name="delete" size="sm" />Leeren
        </button>
      </div>

      <z-console
        [lines]="zeilen()"
        placeholder="Befehl eingeben, Enter sendet"
        (command)="aufBefehl($event)"
      >
        Das Log ist leer. Neue Ausgaben erscheinen hier.
      </z-console>

      <div class="demo-row">
        <button zBtn="secondary" (click)="anhaengen()">50 Zeilen anhängen</button>
        <p class="demo-cap caption">
          Das Log scrollt mit, solange du unten stehst. Scrollst du hoch, bleibt es stehen und der
          Button "Zum Ende" erscheint. Enter sendet den Befehl als eigene Zeile, Pfeil hoch holt den
          letzten Befehl zurück.
        </p>
      </div>

      <p class="demo-cap caption">
        Deaktiviert: Beispiel-Server 1 ist gestoppt, deshalb nimmt die Konsole keine Befehle an.
      </p>
      <z-console disabled placeholder="Befehl eingeben, Enter sendet">
        <span class="demo-row"
          >Server ist gestoppt
          <button zBtn="secondary"><z-icon name="play_arrow" />Server starten</button>
        </span>
      </z-console>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">Hero</h2>
      <p class="demo-cap caption">
        Kopf der Startseite. Der primäre Button der Seite steht hier. Preise sind Beispieltext.
      </p>

      <z-hero
        title="Gameserver aus Nürnberg. In etwa 60 Sekunden online."
        lead="Spiel wählen, RAM einstellen, starten. Dedizierte NVMe-Hardware ab 1,98&nbsp;€ im Monat, monatlich kündbar."
        note="Keine Kreditkarte nötig · DDoS-Schutz inklusive · Keine Einrichtungsgebühr"
      >
        <div zHeroActions>
          <button zBtn="primary" size="lg">Server erstellen</button>
          <button zBtn="secondary" size="lg">Preis berechnen</button>
        </div>

        <z-panel zHeroAside title="Günstigste Spiele" flush>
          <a zPanelActions href="#">Alle 14 Spiele</a>
          <ul class="demo-list">
            @for (spiel of guenstigste; track spiel.titel) {
              <li>
                <span class="title-sm">{{ spiel.titel }}</span>
                <span class="caption z-subtle z-mono">{{ spiel.preis }}</span>
              </li>
            }
          </ul>
        </z-panel>
      </z-hero>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">GameTile</h2>
      <p class="demo-cap caption">
        Genau eine Kachel ist gewählt: 2px-Linie in accent-text und aria-pressed. Die Demo zeigt den
        Text-Fallback, sie lädt keine fremden Bilder. Preise sind Beispieltext.
      </p>

      <z-game-grid>
        @for (spiel of spiele; track spiel.titel) {
          <button
            zGameTile
            [title]="spiel.titel"
            [price]="spiel.preis"
            [selected]="gewaehlt() === spiel.titel"
            (click)="gewaehlt.set(spiel.titel)"
          ></button>
        }
      </z-game-grid>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">PriceSummary</h2>
      <p class="demo-cap caption">
        Zustandsübersicht: auf einer echten Seite trägt die Zusammenfassung den einzigen primären
        Button des Rechners. Hier steht er schon im Hero. Preis und Posten sind Beispieltext.
      </p>

      <div class="demo-narrow">
        <z-price-summary
          label="Valheim, monatlich"
          price="5,40&nbsp;€"
          period="/ Monat"
          [lines]="posten"
          note="Nach Stunden abgerechnet, nach oben gedeckelt. Jederzeit kündbar."
        >
          <button zBtn="primary" block>Server erstellen</button>
        </z-price-summary>
      </div>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">SpecList</h2>
      <p class="demo-cap caption">
        Werte von /hardware, Node Normal. Technische Werte in mono, Zusätze in small.
      </p>
      <z-spec-list [items]="technik" />
    </section>

    <section class="demo-section">
      <h2 class="heading-2">Faq</h2>
      <p class="demo-cap caption">
        Natives details und summary, die erste Frage ist offen. Die Antworten sind Beispieltext aus
        der Vorschau und müssen gegen die echten Bedingungen geprüft werden.
      </p>

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
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WerkzeugePage {
  protected readonly zeilen = signal<ZConsoleLine[]>([...STARTZEILEN]);
  protected readonly gewaehlt = signal('Terraria');

  /** Sekunden seit Mitternacht, weiter ab der letzten Zeile der Vorschau. */
  private uhr = 12 * 3600 + 7 * 60 + 15;

  protected readonly guenstigste = [
    { titel: 'Terraria', preis: 'ab 1,98 €' },
    { titel: 'Valheim', preis: 'ab 2,70 €' },
    { titel: '7 Days to Die', preis: 'ab 3,95 €' },
  ];

  protected readonly spiele = [
    { titel: 'Terraria', preis: 'ab 1,98 € / Monat' },
    { titel: 'Valheim', preis: 'ab 2,70 € / Monat' },
    { titel: '7 Days to Die', preis: 'ab 3,95 € / Monat' },
    { titel: 'Rust Dedicated Server', preis: 'ab 9,43 € / Monat' },
  ];

  protected readonly posten: ZPriceLine[] = [
    { label: 'Arbeitsspeicher', value: '6 GB' },
    { label: 'Speicher', value: '30 GB NVMe' },
    { label: 'Laufzeit', value: '1 Monat' },
    { label: 'Einrichtung', value: '0,00 €' },
  ];

  protected readonly technik: ZSpecItem[] = [
    { term: 'Standort', value: 'Nürnberg, Deutschland', note: 'DSGVO-konform' },
    { term: 'Prozessor', value: 'AMD Ryzen 9 5950X', note: '16C / 32T, 4,9 GHz', mono: true },
    { term: 'Arbeitsspeicher', value: 'DDR4 ECC', note: '3600 MHz', mono: true },
    { term: 'Speicher', value: 'NVMe SSD PCIe 4.0', note: 'RAID-Z1', mono: true },
    {
      term: 'Anbindung',
      value: '1 Gbit/s',
      note: 'DDoS-Schutz auf Layer 3/4 inklusive',
      mono: true,
    },
    { term: 'Abrechnung', value: 'Nach Stunden, monatlich gedeckelt' },
  ];

  protected aufBefehl(text: string): void {
    this.zeilen.update((alt) => [...alt, { time: this.zeit(), text: `> ${text}`, level: 'cmd' }]);
  }

  protected anhaengen(): void {
    const neu: ZConsoleLine[] = Array.from({ length: 50 }, (_, i) => ({
      time: this.zeit(),
      text: `Saved chunk ${i + 1} of 50 in level "world"`,
    }));
    this.zeilen.update((alt) => [...alt, ...neu]);
  }

  protected leeren(): void {
    this.zeilen.set([]);
  }

  /** Zeitstempel wie in der Vorschau, eine Sekunde je Zeile. */
  private zeit(): string {
    this.uhr += 1;
    const zwei = (n: number) => String(n).padStart(2, '0');
    const h = Math.floor(this.uhr / 3600) % 24;
    const m = Math.floor(this.uhr / 60) % 60;
    return `[${zwei(h)}:${zwei(m)}:${zwei(this.uhr % 60)}]`;
  }
}
