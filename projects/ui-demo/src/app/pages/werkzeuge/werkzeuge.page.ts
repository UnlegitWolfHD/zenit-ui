import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SPIELE } from '../muster/beispieldaten';
import {
  ZButton,
  ZConsole,
  ZConsoleLine,
  ZEmptyAction,
  ZEmptyState,
  ZFaq,
  ZGameGrid,
  ZGameTile,
  ZGameTileLink,
  ZHero,
  ZHeroActions,
  ZHeroAside,
  ZIcon,
  ZPanel,
  ZPanelActions,
  ZPriceLine,
  ZPriceSummary,
  ZSkeleton,
  ZSpecItem,
  ZSpecList,
} from 'zenit-ui';

/**
 * Neutral test image, no game artwork: a grey box in the size of a store
 * header (460x215) with a word at its left and right edge, so the demo shows
 * that the tile crops neither side of an image in its own ratio.
 */
function testbild(breite: number, hoehe: number): string {
  return (
    'data:image/svg+xml,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${breite}" height="${hoehe}" viewBox="0 0 ${breite} ${hoehe}">` +
        `<rect width="${breite}" height="${hoehe}" fill="dimgray"/>` +
        `<g font-family="sans-serif" font-size="40" fill="white" dominant-baseline="middle">` +
        `<text x="8" y="${hoehe / 2}">links</text>` +
        `<text x="${breite - 8}" y="${hoehe / 2}" text-anchor="end">rechts</text></g></svg>`,
    )
  );
}
const QUERFORMAT = testbild(460, 215);

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
    RouterLink,
    ZButton,
    ZConsole,
    ZEmptyAction,
    ZEmptyState,
    ZFaq,
    ZGameGrid,
    ZGameTile,
    ZGameTileLink,
    ZHero,
    ZHeroActions,
    ZHeroAside,
    ZIcon,
    ZPanel,
    ZPanelActions,
    ZPriceSummary,
    ZSkeleton,
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
        <button zBtn="ghost" size="sm">
          <z-icon name="download" size="sm" />Log herunterladen
        </button>
        <button zBtn="ghost" size="sm" (click)="leeren()">
          <z-icon name="delete" size="sm" />Leeren
        </button>
      </div>

      <z-console
        [lines]="zeilen()"
        placeholder="Befehl eingeben, Enter sendet"
        (command)="aufBefehl($event)"
      >
        <z-empty-state title="Das Log ist leer">
          Neue Ausgaben erscheinen hier, sobald Beispiel-Server 1 etwas schreibt.
        </z-empty-state>
      </z-console>

      <div class="demo-row">
        <button zBtn="secondary" (click)="anhaengen()">50 Zeilen anhängen</button>
        <p class="demo-grund caption">
          Das Log scrollt mit, solange du unten stehst. Scrollst du hoch, bleibt es stehen und der
          Button "Zum Ende" erscheint. Enter sendet den Befehl als eigene Zeile, Pfeil hoch holt den
          letzten Befehl zurück.
        </p>
      </div>

      <p class="demo-cap caption">
        Deaktiviert: Beispiel-Server 1 ist gestoppt, deshalb nimmt die Konsole keine Befehle an.
      </p>
      <z-console disabled placeholder="Befehl eingeben, Enter sendet">
        <z-empty-state title="Server ist gestoppt">
          Starte Beispiel-Server 1, dann nimmt die Konsole wieder Befehle an.
          <button zEmptyAction zBtn="secondary"><z-icon name="play_arrow" />Server starten</button>
        </z-empty-state>
      </z-console>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">Hero</h2>
      <p class="demo-cap caption">
        Kopf der Startseite. Der primäre Button der Seite steht hier. Preise sind Beispieltext. Auf
        einer öffentlichen Seite ist der Titel das h1 der Seite; hier steht er unter dem h1
        "Werkzeuge", deshalb setzt die Vorschau headingLevel="2". Die Größe bleibt dieselbe. Siehe
        /muster/startseite für den Regelfall.
      </p>

      <z-hero
        headingLevel="2"
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

      <p class="demo-cap caption">
        Unterseite: size="lg" stellt den Titel auf display-lg (40px), so wie ihn jede Seite außer
        Startseite und /minecraft trägt. Unterseiten kommen oft ohne rechte Spalte aus; ohne
        [zHeroAside] steht der Hero auf jeder Breite einspaltig, der Lead bleibt bei 52 Zeichen.
        Text von /preise. Unter 640px sind beide Größen gleich groß.
      </p>

      <z-hero
        headingLevel="2"
        size="lg"
        title="Preise"
        lead="Nach Stunden abgerechnet und nach oben auf den Monatspreis gedeckelt, ab 1,98&nbsp;€ im Monat."
      />
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

      <p class="demo-cap caption">
        Mit Bild, ohne Bild und mit Ladefehler in einem Raster: die Bildfläche hat das Maß eines
        Store-Headers (460 × 215), ein Bild in diesem Format steht unbeschnitten darin. Das Testbild
        ist neutral und trägt an jedem Rand ein Wort. Ohne Bild und nach einem Ladefehler steht der
        Name auf derselben Fläche, alle Kacheln sind gleich hoch.
      </p>

      <z-game-grid>
        <button
          zGameTile
          title="Querformat"
          price="ab 4,98&nbsp;€ / Monat"
          [cover]="querformat"
        ></button>
        <button zGameTile title="Ohne Bild" price="ab 2,70&nbsp;€ / Monat"></button>
        <button
          zGameTile
          title="Ladefehler"
          price="ab 9,43&nbsp;€ / Monat"
          cover="/covers/fehlt-quer.jpg"
        ></button>
      </z-game-grid>

      <p class="demo-cap caption">
        Lädt: z-skeleton tile hält die Zelle einer Kachel, Cover, Titel und Preis in denselben
        Maßen. Das Raster trägt aria-busy und ein aria-label.
      </p>

      <z-game-grid role="group" aria-busy="true" aria-label="Spiele werden geladen">
        @for (platz of kachelPlaetze; track platz) {
          <z-skeleton tile />
        }
      </z-game-grid>

      <p class="demo-cap caption">
        Cover fehlgeschlagen: diese Kachel lädt /covers/fehlt.jpg, das es nicht gibt. Nach dem
        Fehler steht derselbe Text-Fallback wie ohne Cover, kein kaputtes Bild. (coverError) hat das
        {{ coverFehler() }}-mal gemeldet.
      </p>

      <z-game-grid>
        <button
          zGameTile
          title="Ark: Survival Ascended"
          price="ab 6,98&nbsp;€ / Monat"
          cover="/covers/fehlt.jpg"
          (coverError)="coverFehler.update((n) => n + 1)"
        ></button>
      </z-game-grid>

      <p class="demo-cap caption">
        Als Link: a[zGameTile] sieht aus wie die Kachel, führt aber zur Bestellung des Spiels
        (routerLink mit queryParams). Kein aria-pressed, keine Auswahl; der Linkname ist Titel und
        Preis.
      </p>

      <z-game-grid>
        @for (spiel of linkSpiele; track spiel.titel) {
          <a
            zGameTile
            [title]="spiel.titel"
            [price]="spiel.preis"
            routerLink="/muster/server-erstellen"
            [queryParams]="{ spiel: spiel.titel }"
          ></a>
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

  /** How often (coverError) reported the dead cover URL; the tile fires once. */
  protected readonly coverFehler = signal(0);

  /** Seconds since midnight, continuing from the last line of the preview. */
  private uhr = 12 * 3600 + 7 * 60 + 15;

  protected readonly guenstigste = [
    { titel: 'Terraria', preis: 'ab 1,98\u00a0€' },
    { titel: 'Valheim', preis: 'ab 2,70\u00a0€' },
    { titel: '7 Days to Die', preis: 'ab 3,95\u00a0€' },
  ];

  /** Test image of the cover demo, see {@link testbild}. */
  protected readonly querformat = QUERFORMAT;

  /** Four placeholders; a real page shows as many as it normally lists. */
  protected readonly kachelPlaetze = [1, 2, 3, 4];

  /**
   * Games of the link grid, from the same list /muster/server-erstellen reads
   * `?spiel=` against, so each tile really opens the order of its game.
   */
  protected readonly linkSpiele = SPIELE.slice(0, 3);

  protected readonly spiele = [
    { titel: 'Terraria', preis: 'ab 1,98\u00a0€ / Monat' },
    { titel: 'Valheim', preis: 'ab 2,70\u00a0€ / Monat' },
    { titel: '7 Days to Die', preis: 'ab 3,95\u00a0€ / Monat' },
    { titel: 'Rust Dedicated Server', preis: 'ab 9,43\u00a0€ / Monat' },
  ];

  protected readonly posten: ZPriceLine[] = [
    { label: 'Arbeitsspeicher', value: '6\u00a0GB' },
    { label: 'Speicher', value: '30\u00a0GB NVMe' },
    { label: 'Laufzeit', value: '1\u00a0Monat' },
    { label: 'Einrichtung', value: '0,00\u00a0€' },
  ];

  protected readonly technik: ZSpecItem[] = [
    { term: 'Standort', value: 'Nürnberg, Deutschland', note: 'DSGVO-konform' },
    { term: 'Prozessor', value: 'AMD Ryzen 9 5950X', note: '16C / 32T, 4,9\u00a0GHz', mono: true },
    { term: 'Arbeitsspeicher', value: 'DDR4 ECC', note: '3600\u00a0MHz', mono: true },
    { term: 'Speicher', value: 'NVMe SSD PCIe 4.0', note: 'RAID-Z1', mono: true },
    {
      term: 'Anbindung',
      value: '1\u00a0Gbit/s',
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

  /** Timestamps as in the preview, one second per line. */
  private zeit(): string {
    this.uhr += 1;
    const zwei = (n: number) => String(n).padStart(2, '0');
    const h = Math.floor(this.uhr / 3600) % 24;
    const m = Math.floor(this.uhr / 60) % 60;
    return `[${zwei(h)}:${zwei(m)}:${zwei(this.uhr % 60)}]`;
  }
}
