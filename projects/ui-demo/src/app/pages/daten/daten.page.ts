import { CdkMenuTrigger } from '@angular/cdk/menu';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  Z_MENU,
  ZAlert,
  ZBadge,
  ZBadgeStatus,
  ZButton,
  ZCheckbox,
  ZEmptyAction,
  ZEmptyState,
  ZIcon,
  ZMetric,
  ZMetrics,
  ZNum,
  ZPagination,
  ZPanel,
  ZPanelActions,
  ZRow,
  ZRowAction,
  ZRowLink,
  ZRowMain,
  ZRowNum,
  ZRows,
  ZRowsHead,
  ZRowThumb,
  ZRowTitle,
  ZSkeleton,
  ZSort,
  ZSortHeader,
  ZTable,
  ZTableContainer,
  ZTableName,
  Z_LABELS,
  Z_LABELS_EN,
} from 'zenit-ui';

/**
 * Pagination without a single text input: the component provides `Z_LABELS`
 * with the English set for its own subtree, so the range sentence and both
 * `aria-label`s come out English.
 */
@Component({
  selector: 'demo-englische-pagination',
  imports: [ZPagination],
  template: `<z-pagination [(page)]="seite" [total]="118" itemLabel="transactions" />`,
  providers: [{ provide: Z_LABELS, useValue: Z_LABELS_EN }],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class EnglischePagination {
  protected readonly seite = signal(1);
}

interface DemoServer {
  name: string;
  meta: string;
  status: ZBadgeStatus;
  statusText: string;
  kosten: string;
}

/**
 * One row of the FileTable, including whether it is currently selected.
 *
 * `bytes` and `zeitpunkt` are what the page sorts by: the library reports the
 * wanted column, the values behind the rendered text are the caller's, because
 * "61,25 MB" and "04.09.2026, 05:53" do not sort as text.
 */
interface DemoDatei {
  name: string;
  icon: string;
  groesse: string;
  bytes: number;
  geaendert: string;
  zeitpunkt: string;
  gewaehlt: boolean;
}

@Component({
  selector: 'demo-daten-page',
  imports: [
    CdkMenuTrigger,
    EnglischePagination,
    Z_MENU,
    ZAlert,
    ZBadge,
    ZButton,
    ZCheckbox,
    ZEmptyAction,
    ZEmptyState,
    ZIcon,
    ZMetric,
    ZMetrics,
    ZNum,
    ZPagination,
    ZPanel,
    ZPanelActions,
    ZRow,
    ZRowAction,
    ZRowLink,
    ZRowMain,
    ZRowNum,
    ZRows,
    ZRowsHead,
    ZRowThumb,
    ZRowTitle,
    ZSkeleton,
    ZSortHeader,
    ZTable,
    ZTableContainer,
    ZTableName,
  ],
  template: `
    <h1 class="heading-1 demo-title">Daten</h1>
    <p class="demo-lead">
      Metric, ServerList, FileTable und Pagination in allen Zuständen. Beispieldaten:
      Beispiel-Server 1 bis 5 und Test auf 203.0.113.10 bis 203.0.113.15.
    </p>

    <section class="demo-section">
      <h2 class="heading-2">Metric</h2>
      <p class="demo-cap caption">
        Mehrere Kennzahlen stehen als Spalten in einem Panel, getrennt durch 1px-Linien. Der Balken
        ist neutral, ab 80&nbsp;% warnt er, ab 95&nbsp;% meldet er einen Fehler.
      </p>
      <z-panel flush>
        <z-metrics>
          <z-metric label="CPU" value="0,2" unit="%" [percent]="0.2" />
          <z-metric label="RAM" value="1,16" unit="/ 8,4&nbsp;GB" [percent]="14" />
          <z-metric
            label="Speicher"
            value="21,4"
            unit="/ 24&nbsp;GB"
            [percent]="89"
            sub="89&nbsp;% belegt"
          />
          <z-metric label="Laufzeit" value="2d 21h" sub="TPS 20 · Ping 91&nbsp;ms" />
        </z-metrics>
      </z-panel>

      <p class="demo-cap caption">
        Die Farbe steht nie allein: der Wert mit Prozent steht in der Unterzeile.
      </p>
      <z-panel flush>
        <z-metrics>
          <z-metric
            label="Speicher"
            value="23,6"
            unit="/ 24&nbsp;GB"
            [percent]="98"
            sub="98&nbsp;% belegt, kritisch"
          />
          <z-metric
            label="RAM"
            value="6,9"
            unit="/ 8,4&nbsp;GB"
            [percent]="82"
            sub="82&nbsp;% belegt"
          />
          <z-metric label="Spieler" value="7" unit="/ 20" [percent]="35" />
        </z-metrics>
      </z-panel>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">ServerList</h2>
      <p class="demo-cap caption">
        Die ganze Zeile ist ein Link. Der Status steht immer in der zweiten Spalte. Hover färbt die
        Zeile, der Tastaturfokus zeigt den Ring um die Zeile.
      </p>
      <z-panel title="Meine Server" flush>
        <span zPanelActions class="caption z-subtle z-mono">6</span>
        <z-rows>
          <z-rows-head>
            <span>Server</span>
            <span>Status</span>
            <span>Tarif</span>
            <span style="text-align:right">Bisher</span>
            <span></span>
          </z-rows-head>
          @for (eintrag of server; track eintrag.name) {
            <a zRow href="#">
              <z-row-main [title]="eintrag.name" [meta]="eintrag.meta" />
              <span>
                <z-badge [status]="eintrag.status" dot>{{ eintrag.statusText }}</z-badge>
              </span>
              <span class="z-muted">Flex, nach Stunden</span>
              <span zRowNum>{{ eintrag.kosten }}&nbsp;€</span>
              <z-icon name="chevron_right" />
            </a>
          }
        </z-rows>
      </z-panel>

      <p class="demo-cap caption">
        Eigene Spaltenbreiten über columns. Zeilen ohne Ziel sind div, die Aktion darin ist ein
        eigener Tab-Stopp.
      </p>
      <z-panel title="Geteilte Server" flush>
        <z-rows columns="minmax(0, 2fr) 128px 40px">
          <z-rows-head>
            <span>Server</span>
            <span>Rechte</span>
            <span></span>
          </z-rows-head>
          <div zRow>
            <z-row-main title="Beispiel-Server 1" meta="Für K freigegeben · 203.0.113.10" />
            <span><z-badge>Konsole</z-badge></span>
            <button zBtn="ghost" iconOnly aria-label="Freigabe für Beispiel-Server 1 entfernen">
              <z-icon name="close" />
            </button>
          </div>
          <div zRow>
            <z-row-main title="Test" meta="Für K freigegeben · 203.0.113.15" />
            <span><z-badge>Dateien</z-badge></span>
            <button zBtn="ghost" iconOnly aria-label="Freigabe für Test entfernen">
              <z-icon name="close" />
            </button>
          </div>
        </z-rows>
      </z-panel>

      <p class="demo-cap caption">
        Zeile als Link mit eigener Aktion: ein Button in einem a ist ungültiges Markup, deshalb ist
        die Zeile ein div, der Link sitzt auf dem Titel (zRowLink) und deckt über sein ::after die
        ganze Zeile ab. Die Aktion trägt zRowAction, liegt darüber und bleibt ein eigener Tab-Stopp.
        Tab-Reihenfolge: erst der Link, dann das Menü. Der Fokus-Ring umschließt die ganze Zeile.
      </p>
      <z-panel title="Zuletzt geöffnet" flush>
        <z-rows columns="minmax(0, 2fr) 128px 40px">
          <z-rows-head>
            <span>Server</span>
            <span>Status</span>
            <span></span>
          </z-rows-head>
          @for (eintrag of zuletzt; track eintrag.name) {
            <div zRow>
              <z-row-main [title]="eintrag.name" [meta]="eintrag.meta">
                <a zRowTitle zRowLink href="#">{{ eintrag.name }}</a>
              </z-row-main>
              <span>
                <z-badge [status]="eintrag.status" dot>{{ eintrag.statusText }}</z-badge>
              </span>
              <button
                zRowAction
                zBtn="ghost"
                iconOnly
                [attr.aria-label]="'Aktionen für ' + eintrag.name"
                [cdkMenuTriggerFor]="zeilenAktionen"
              >
                <z-icon name="more_vert" />
              </button>
            </div>
          }
        </z-rows>
      </z-panel>

      <ng-template #zeilenAktionen>
        <z-menu>
          <button zMenuItem icon="play_arrow">Starten</button>
          <button zMenuItem icon="content_copy">Adresse kopieren</button>
          <z-menu-separator />
          <button zMenuItem icon="delete" danger>Löschen</button>
        </z-menu>
      </ng-template>

      <p class="demo-cap caption">
        Vorschaubild: thumbText liefert den Anfangsbuchstaben, wenn das Bild fehlt oder nicht lädt
        (hier /covers/fehlt.png), zRowThumb setzt ein eigenes Medium ein, thumb=false lässt das
        Vorschaubild weg. Das Spiel steht trotzdem als Text in der Meta-Zeile.
      </p>
      <z-panel title="Vorschaubild" flush>
        <z-rows columns="minmax(0, 2fr) 128px">
          <z-rows-head>
            <span>Eintrag</span>
            <span>Status</span>
          </z-rows-head>
          <a zRow href="#">
            <z-row-main
              title="survival-01"
              meta="Valheim · 203.0.113.13"
              image="/covers/fehlt.png"
              thumbText="Valheim"
            />
            <span><z-badge status="success" dot>Online</z-badge></span>
          </a>
          <a zRow href="#">
            <z-row-main title="kreativ" meta="Rust · 203.0.113.14" thumbText="Rust" />
            <span><z-badge dot>Gestoppt</z-badge></span>
          </a>
          <div zRow>
            <z-row-main title="beispiel.de" meta="Domain · läuft bis 18.09.2027">
              <z-icon zRowThumb name="language" />
            </z-row-main>
            <span><z-badge status="success" dot>Aktiv</z-badge></span>
          </div>
          <div zRow>
            <z-row-main
              title="Ticket 4711"
              meta="Letzte Antwort 18.09.2026, 15:55"
              [thumb]="false"
            />
            <span><z-badge status="info" dot>Offen</z-badge></span>
          </div>
        </z-rows>
      </z-panel>

      <p class="demo-cap caption">
        Lädt: Skelettzeilen im selben Grid wie die echten Zeilen, damit beim Eintreffen der Daten
        nichts springt. Das Panel meldet aria-busy.
      </p>
      <z-panel title="Meine Server" flush busy aria-label="Server werden geladen">
        <z-rows>
          <z-rows-head>
            <span>Server</span>
            <span>Status</span>
            <span>Tarif</span>
            <span style="text-align:right">Bisher</span>
            <span></span>
          </z-rows-head>
          @for (platz of platzhalter; track platz.titel) {
            <div zRow>
              <div class="z-row__main">
                <z-skeleton thumb />
                <div class="demo-skel-lines">
                  <z-skeleton [width]="platz.titel" />
                  <z-skeleton [width]="platz.meta" />
                </div>
              </div>
              <z-skeleton width="64px" />
              <z-skeleton width="70%" />
              <z-skeleton width="48px" class="demo-skel-end" />
              <span></span>
            </div>
          }
        </z-rows>
      </z-panel>

      <p class="demo-cap caption">
        Leer: ein Satz und eine Aktion, keine Filter und keine Pagination.
      </p>
      <z-panel title="Meine Server" flush>
        <z-empty-state title="Noch kein Server">
          Der erste steht in etwa 60 Sekunden bereit.
          <button zEmptyAction zBtn="secondary"><z-icon name="add" />Server erstellen</button>
        </z-empty-state>
      </z-panel>

      <p class="demo-cap caption">Fehler: Ursache und nächster Schritt.</p>
      <z-panel title="Meine Server">
        <z-alert status="danger" title="Liste nicht geladen" icon="error">
          Das Panel hat nach 10 Sekunden nicht geantwortet. Lade die Seite neu oder öffne ein
          Ticket.
        </z-alert>
      </z-panel>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">FileTable</h2>
      <p class="demo-cap caption">
        Unter 640px scrollt die Tabelle seitlich in ihrem eigenen Container, die Seite nie. Der
        Container ist per Tab erreichbar. Die Kästchen sind z-checkbox, beschriftet über ariaLabel,
        und sie schalten hier wirklich. Ohne Auswahl steht die Werkzeugleiste über der Tabelle,
        sobald eine Zeile gewählt ist die Auswahl-Leiste. Die drei Spaltenköpfe sind Buttons
        (zSortHeader): ein Klick sortiert aufsteigend, der zweite absteigend, der dritte hebt die
        Sortierung auf. Nur der sortierte Kopf trägt aria-sort und den Pfeil.
      </p>
      <z-panel title="plugins" flush>
        <span zPanelActions class="caption z-subtle">{{ dateien().length }} Einträge</span>
        @if (anzahlGewaehlt()) {
          <div class="demo-leiste">
            <span class="demo-leiste__zahl title-sm">{{ anzahlGewaehlt() }} ausgewählt</span>
            <button zBtn="secondary" size="sm" type="button">
              <z-icon name="download" size="sm" />Herunterladen
            </button>
            <button zBtn="secondary" size="sm" type="button">
              <z-icon name="drive_file_move" size="sm" />Verschieben
            </button>
            <button
              zBtn="ghost"
              size="sm"
              iconOnly
              type="button"
              aria-label="Weitere Aktionen für die gewählten Dateien"
              [cdkMenuTriggerFor]="dateiAktionen"
            >
              <z-icon name="more_vert" />
            </button>
          </div>
        } @else {
          <div class="demo-leiste">
            <button zBtn="secondary" size="sm" type="button">
              <z-icon name="upload" size="sm" />Hochladen
            </button>
          </div>
        }
        <!-- #region sortierbar -->
        <z-table-container ariaLabel="Dateien, seitlich scrollbar">
          <table zTable [(sort)]="sortierung">
            <thead>
              <tr>
                <th class="z-table__check">
                  <z-checkbox
                    ariaLabel="Alle auswählen"
                    [checked]="alleGewaehlt()"
                    (checkedChange)="alleWaehlen($event)"
                  />
                </th>
                <th zSortHeader="name">Name</th>
                <th zNum zSortHeader="groesse" sortStart="desc">Größe</th>
                <th zNum zSortHeader="geaendert" sortStart="desc">Geändert</th>
              </tr>
            </thead>
            <tbody>
              @for (datei of sortierteDateien(); track datei.name) {
                <tr>
                  <td>
                    <z-checkbox
                      [ariaLabel]="datei.name"
                      [checked]="datei.gewaehlt"
                      (checkedChange)="dateiWaehlen(datei.name, $event)"
                    />
                  </td>
                  <td>
                    <span zTableName><z-icon [name]="datei.icon" />{{ datei.name }}</span>
                  </td>
                  <td zNum>{{ datei.groesse }}</td>
                  <td zNum>{{ datei.geaendert }}</td>
                </tr>
              }
            </tbody>
          </table>
        </z-table-container>
        <!-- #endregion -->
      </z-panel>
      <p class="demo-grund caption">
        "Löschen" ist unumkehrbar und steht deshalb nach Button/README nicht als danger neben den
        anderen Aktionen, sondern im Menü "Weitere Aktionen". Das Kästchen im Kopf kennt nur ein und
        aus; für "teilweise gewählt" fehlt z-checkbox ein indeterminate. Sortiert wird hier auf der
        Seite: die Bibliothek meldet über [(sort)] nur, welche Spalte gewünscht ist, die Reihenfolge
        rechnet ein computed. "Ordner zuerst" ist eine Regel dieser Seite und bleibt in beiden
        Richtungen stehen.
      </p>

      <p class="demo-cap caption">
        Lädt: Skelettzeilen im selben Raster wie die Tabelle, damit beim Eintreffen der Daten nichts
        springt. Das Panel meldet aria-busy.
      </p>
      <z-panel title="plugins" flush busy aria-label="Dateien werden geladen">
        <z-table-container ariaLabel="Dateien werden geladen, seitlich scrollbar">
          <table zTable>
            <thead>
              <tr>
                <th class="z-table__check">
                  <span class="z-visually-hidden">Auswahl</span>
                </th>
                <th>Name</th>
                <th style="text-align:right">Größe</th>
                <th style="text-align:right">Geändert</th>
              </tr>
            </thead>
            <tbody>
              @for (platz of dateiPlatzhalter; track platz.name) {
                <tr>
                  <td><z-skeleton width="18px" /></td>
                  <td><z-skeleton [width]="platz.name" /></td>
                  <td zNum><z-skeleton width="64px" class="demo-skel-end" /></td>
                  <td zNum><z-skeleton width="120px" class="demo-skel-end" /></td>
                </tr>
              }
            </tbody>
          </table>
        </z-table-container>
      </z-panel>

      <p class="demo-cap caption">
        Leer: ein leerer Ordner zeigt keine Tabelle, keine Werkzeugleiste und keine Pagination, nur
        den Satz und die eine Aktion.
      </p>
      <z-panel title="world/datapacks" flush>
        <z-empty-state title="Dieser Ordner ist leer">
          Lade eine Datei hoch oder lege sie per FTP in world/datapacks ab.
          <button zEmptyAction zBtn="secondary" type="button">
            <z-icon name="upload" />Hochladen
          </button>
        </z-empty-state>
      </z-panel>

      <ng-template #dateiAktionen>
        <z-menu>
          <button zMenuItem icon="content_copy">Kopieren</button>
          <z-menu-separator />
          <button zMenuItem icon="delete" danger>Löschen</button>
        </z-menu>
      </ng-template>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">Pagination</h2>
      <p class="demo-cap caption">
        118 Transaktionen, 25 je Seite. Die Pagination steht als letzte Zeile im Panel und blättert
        die Liste darüber. Eine volle Seite ist hier zu hoch für die Demo, deshalb scrollt die Liste
        in einem eigenen, benannten Bereich; im Produkt steht sie in voller Höhe.
      </p>
      <z-panel title="Transaktionen" flush>
        <div
          class="demo-scroll"
          tabindex="0"
          role="group"
          aria-label="Transaktionen, senkrecht scrollbar"
        >
          <z-rows columns="minmax(0, 2fr) minmax(0, 1fr) 96px">
            <z-rows-head>
              <span>Vorgang</span>
              <span>Datum</span>
              <span style="text-align:right">Betrag</span>
            </z-rows-head>
            @for (eintrag of seitenInhalt(); track eintrag.nummer) {
              <div zRow>
                <span>{{ eintrag.titel }}</span>
                <span class="z-muted z-mono">{{ eintrag.datum }}</span>
                <span zRowNum>{{ eintrag.betrag }}&nbsp;€</span>
              </div>
            }
          </z-rows>
        </div>
        <z-pagination
          [(page)]="seite"
          [total]="transaktionen.length"
          itemLabel="Transaktionen"
          ariaLabel="Seiten der Transaktionen"
        />
      </z-panel>

      <p class="demo-cap caption">
        Mit pageSizeOptions steht die Auswahl "Einträge pro Seite" im Pager, beschriftet und mit dem
        Feld verbunden. Beim Wechsel bleibt der erste sichtbare Eintrag sichtbar: aus Seite 3 bei 25
        wird Seite 6 bei 10. Unter 640px steht die Auswahl in einer eigenen Zeile und ist 40px hoch.
      </p>
      <z-panel title="Transaktionen" flush>
        <z-pagination
          [(page)]="groessenSeite"
          [(pageSize)]="proSeite"
          [total]="transaktionen.length"
          [pageSizeOptions]="[10, 25, 50]"
          itemLabel="Transaktionen"
          ariaLabel="Seiten der Transaktionen mit Auswahl der Seitengröße"
        />
      </z-panel>

      <p class="demo-cap caption">
        Auf der ersten Seite ist der Pfeil zurück deaktiviert, auf der letzten der Pfeil weiter.
      </p>
      <z-panel>
        <p class="demo-sub">Erste Seite</p>
        <z-pagination
          [(page)]="ersteSeite"
          [total]="118"
          itemLabel="Transaktionen"
          ariaLabel="Seiten der Transaktionen, Anfang der Liste"
        />
      </z-panel>
      <z-panel>
        <p class="demo-sub">Letzte Seite</p>
        <z-pagination
          [(page)]="letzteSeite"
          [total]="118"
          itemLabel="Transaktionen"
          ariaLabel="Seiten der Transaktionen, Ende der Liste"
        />
      </z-panel>

      <p class="demo-cap caption">Text von außen überschrieben</p>
      <z-panel>
        <p class="demo-sub">Dieselbe Liste mit einem eigenen Format über rangeLabel.</p>
        <z-pagination
          [(page)]="englischeSeite"
          [total]="118"
          itemLabel="transactions"
          ariaLabel="Seiten der Transaktionen mit eigenem Bereichstext"
          [rangeLabel]="englischerBereich"
        />
      </z-panel>

      <p class="demo-cap caption">
        Alle Texte zentral getauscht: diese Pagination bekommt keinen einzigen Text-Input. Die
        umgebende Komponente stellt Z_LABELS über providers auf den englischen Satz, deshalb sind
        auch die aria-Labels der beiden Pfeile englisch.
      </p>
      <z-panel>
        <p class="demo-sub">Z_LABELS_EN lokal über providers</p>
        <demo-englische-pagination />
      </z-panel>

      <p class="demo-cap caption">
        Passt alles auf eine Seite, rendert die Pagination nichts. Das Panel darunter enthält eine
        Pagination mit 0 Einträgen.
      </p>
      <z-panel>
        <p class="demo-sub">Keine Transaktionen in diesem Zeitraum.</p>
        <z-pagination [(page)]="leereSeite" [total]="0" itemLabel="Transaktionen" />
      </z-panel>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatenPage {
  protected readonly server: DemoServer[] = [
    {
      name: 'Beispiel-Server 1',
      meta: 'Minecraft · PaperMC 26.3 · 203.0.113.10',
      status: 'success',
      statusText: 'Online',
      kosten: '0,90',
    },
    {
      name: 'Beispiel-Server 2',
      meta: 'Minecraft · Vanilla · 203.0.113.11',
      status: 'warning',
      statusText: 'Startet',
      kosten: '0,53',
    },
    {
      name: 'Beispiel-Server 3',
      meta: 'Counter-Strike 2 · zuletzt am 18.09.2026, 15:55',
      status: 'neutral',
      statusText: 'Gestoppt',
      kosten: '0,41',
    },
    {
      name: 'Beispiel-Server 4',
      meta: 'Minecraft · Fabric · in etwa 60 Sekunden bereit',
      status: 'info',
      statusText: 'Wird installiert',
      kosten: '0,00',
    },
    {
      name: 'Test',
      meta: 'Counter-Strike 2 · noch nie gestartet',
      status: 'danger',
      statusText: 'Fehlgeschlagen',
      kosten: '0,65',
    },
    {
      name: 'Beispiel-Server 5',
      meta: 'Minecraft · PaperMC 26.3 · Guthaben leer',
      status: 'danger',
      statusText: 'Gesperrt',
      kosten: '1,24',
    },
  ];

  /** The two rows of the "Zeile als Link mit eigener Aktion" example. */
  protected readonly zuletzt = this.server.slice(0, 2);

  /** Widths of the placeholders as in spec/components/Skeleton/preview.html. */
  protected readonly platzhalter = [
    { titel: '40%', meta: '60%' },
    { titel: '30%', meta: '50%' },
  ];

  protected readonly dateien = signal<DemoDatei[]>([
    {
      name: 'plugins',
      icon: 'folder',
      groesse: '',
      bytes: 0,
      geaendert: '04.09.2026, 05:53',
      zeitpunkt: '2026-09-04 05:53',
      gewaehlt: false,
    },
    {
      name: 'world',
      icon: 'folder',
      groesse: '',
      bytes: 0,
      geaendert: '21.09.2026, 13:55',
      zeitpunkt: '2026-09-21 13:55',
      gewaehlt: false,
    },
    {
      name: 'server.jar',
      icon: 'description',
      groesse: '61,25\u00a0MB',
      bytes: 64_224_870,
      geaendert: '18.09.2026, 14:45',
      zeitpunkt: '2026-09-18 14:45',
      gewaehlt: false,
    },
    {
      name: 'server.properties',
      icon: 'description',
      groesse: '1,74\u00a0KB',
      bytes: 1_782,
      geaendert: '18.09.2026, 15:55',
      zeitpunkt: '2026-09-18 15:55',
      gewaehlt: true,
    },
  ]);

  // #region sortierung
  /** Which column the file table is sorted by, written by `th[zSortHeader]`. */
  protected readonly sortierung = signal<ZSort | null>({ key: 'name', direction: 'asc' });

  /**
   * The rows in the order the header asked for. The library sorts nothing: it
   * reports the column and the direction, the page owns the comparison and its
   * own rules. Folders stay in front in both directions, which is a rule of
   * this page, not of the table.
   */
  protected readonly sortierteDateien = computed(() => {
    const sortierung = this.sortierung();
    const zeilen = [...this.dateien()];
    if (!sortierung) {
      return zeilen;
    }
    const richtung = sortierung.direction === 'asc' ? 1 : -1;
    return zeilen.sort((a, b) => {
      const ordnerZuerst = Number(b.icon === 'folder') - Number(a.icon === 'folder');
      if (ordnerZuerst !== 0) {
        return ordnerZuerst;
      }
      if (sortierung.key === 'groesse') {
        return richtung * (a.bytes - b.bytes);
      }
      const links = sortierung.key === 'geaendert' ? a.zeitpunkt : a.name;
      const rechts = sortierung.key === 'geaendert' ? b.zeitpunkt : b.name;
      return richtung * links.localeCompare(rechts, 'de');
    });
  });
  // #endregion

  /** Widths of the placeholders in the loading state of the table. */
  protected readonly dateiPlatzhalter = [{ name: '40%' }, { name: '55%' }, { name: '30%' }];

  protected readonly anzahlGewaehlt = computed(
    () => this.dateien().filter((datei) => datei.gewaehlt).length,
  );
  protected readonly alleGewaehlt = computed(() => this.anzahlGewaehlt() === this.dateien().length);

  protected dateiWaehlen(name: string, gewaehlt: boolean): void {
    this.dateien.update((alt) =>
      alt.map((datei) => (datei.name === name ? { ...datei, gewaehlt } : datei)),
    );
  }

  protected alleWaehlen(gewaehlt: boolean): void {
    this.dateien.update((alt) => alt.map((datei) => ({ ...datei, gewaehlt })));
  }

  protected readonly transaktionen = Array.from({ length: 118 }, (_, i) => ({
    nummer: i + 1,
    titel: ['Aufladung', 'Serverstunden', 'Erstattung'][i % 3],
    datum: `${String((i % 28) + 1).padStart(2, '0')}.09.2026, 15:55`,
    betrag: (0.53 + (i % 47) / 10).toFixed(2).replace('.', ','),
  }));

  protected readonly seite = signal(1);
  /** The pager with the size picker owns both values, page and page size. */
  protected readonly groessenSeite = signal(1);
  protected readonly proSeite = signal(25);
  protected readonly ersteSeite = signal(1);
  protected readonly letzteSeite = signal(5);
  protected readonly leereSeite = signal(1);
  protected readonly englischeSeite = signal(1);

  protected readonly englischerBereich = (von: number, bis: number, total: number, label: string) =>
    `${von} to ${bis} of ${total} ${label}`;

  protected readonly seitenInhalt = computed(() => {
    const start = (this.seite() - 1) * 25;
    return this.transaktionen.slice(start, start + 25);
  });
}
