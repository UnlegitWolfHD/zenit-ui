import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  ZBadge,
  ZBadgeStatus,
  ZButton,
  ZIcon,
  ZMetric,
  ZMetrics,
  ZNum,
  ZPagination,
  ZPanel,
  ZPanelActions,
  ZRow,
  ZRowMain,
  ZRowNum,
  ZRows,
  ZRowsHead,
  ZTable,
  ZTableContainer,
  ZTableName,
} from 'zenit-ui';

interface DemoServer {
  name: string;
  meta: string;
  status: ZBadgeStatus;
  statusText: string;
  kosten: string;
}

@Component({
  selector: 'demo-daten-page',
  imports: [
    ZBadge,
    ZButton,
    ZIcon,
    ZMetric,
    ZMetrics,
    ZNum,
    ZPagination,
    ZPanel,
    ZPanelActions,
    ZRow,
    ZRowMain,
    ZRowNum,
    ZRows,
    ZRowsHead,
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
          <z-metric label="Laufzeit" value="2d 21h" sub="TPS 20 · Ping 91 ms" />
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
        Lädt: Platzhalterzeilen, das Panel meldet aria-busy. Skelettzeilen kommen aus dem Paket
        rueckmeldung.
      </p>
      <z-panel title="Meine Server" flush busy>
        <z-rows>
          <z-rows-head>
            <span>Server</span>
            <span>Status</span>
            <span>Tarif</span>
            <span style="text-align:right">Bisher</span>
            <span></span>
          </z-rows-head>
          @for (platz of platzhalter; track platz) {
            <div zRow><span class="z-subtle">Lädt</span></div>
          }
        </z-rows>
      </z-panel>

      <p class="demo-cap caption">
        Leer: ein Satz und eine Aktion. Der EmptyState kommt aus dem Paket rueckmeldung.
      </p>
      <z-panel title="Meine Server">
        <div class="demo-row">
          <p class="demo-sub">
            Du hast noch keinen Server. Der erste steht in etwa 60 Sekunden bereit.
          </p>
          <button zBtn="secondary"><z-icon name="add" />Server erstellen</button>
        </div>
      </z-panel>

      <p class="demo-cap caption">
        Fehler: Ursache und nächster Schritt in einem Satz. Nach dem Zusammenfügen steht hier
        z-alert aus dem Paket rueckmeldung.
      </p>
      <z-panel title="Meine Server">
        <p class="demo-sub">
          Die Liste ist nicht geladen, das Panel hat nicht geantwortet. Lade die Seite neu.
        </p>
      </z-panel>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">FileTable</h2>
      <p class="demo-cap caption">
        Unter 640px scrollt die Tabelle seitlich in ihrem eigenen Container, die Seite nie. Der
        Container ist per Tab erreichbar. Die Kästchen bekommen ihre Form aus dem Paket formulare.
      </p>
      <z-panel title="Dateien" flush>
        <z-table-container ariaLabel="Dateien, seitlich scrollbar">
          <table zTable>
            <thead>
              <tr>
                <th class="z-table__check">
                  <label class="z-check"
                    ><input type="checkbox" aria-label="Alle auswählen"
                  /></label>
                </th>
                <th>Name</th>
                <th style="text-align:right">Größe</th>
                <th style="text-align:right">Geändert</th>
              </tr>
            </thead>
            <tbody>
              @for (datei of dateien; track datei.name) {
                <tr>
                  <td>
                    <label class="z-check"
                      ><input
                        type="checkbox"
                        [attr.aria-label]="datei.name"
                        [checked]="datei.gewaehlt"
                    /></label>
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
      </z-panel>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">Pagination</h2>
      <p class="demo-cap caption">
        118 Transaktionen, 25 je Seite. Die Pagination steht als letzte Zeile im Panel und blättert
        die Liste darüber.
      </p>
      <z-panel title="Transaktionen" flush>
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
        <z-pagination [(page)]="seite" [total]="transaktionen.length" itemLabel="Transaktionen" />
      </z-panel>

      <p class="demo-cap caption">
        Auf der ersten Seite ist der Pfeil zurück deaktiviert, auf der letzten der Pfeil weiter.
      </p>
      <z-panel>
        <p class="demo-sub">Erste Seite</p>
        <z-pagination [(page)]="ersteSeite" [total]="118" itemLabel="Transaktionen" />
      </z-panel>
      <z-panel>
        <p class="demo-sub">Letzte Seite</p>
        <z-pagination [(page)]="letzteSeite" [total]="118" itemLabel="Transaktionen" />
      </z-panel>

      <p class="demo-cap caption">Text von außen überschrieben</p>
      <z-panel>
        <p class="demo-sub">Dieselbe Liste mit einem eigenen Format über rangeLabel.</p>
        <z-pagination
          [(page)]="englischeSeite"
          [total]="118"
          itemLabel="transactions"
          [rangeLabel]="englischerBereich"
        />
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

  protected readonly platzhalter = [1, 2, 3];

  protected readonly dateien = [
    { name: 'plugins', icon: 'folder', groesse: '', geaendert: '04.09.2026, 05:53', gewaehlt: false },
    { name: 'world', icon: 'folder', groesse: '', geaendert: '21.09.2026, 13:55', gewaehlt: false },
    {
      name: 'server.jar',
      icon: 'description',
      groesse: '61,25 MB',
      geaendert: '18.09.2026, 14:45',
      gewaehlt: false,
    },
    {
      name: 'server.properties',
      icon: 'description',
      groesse: '1,74 KB',
      geaendert: '18.09.2026, 15:55',
      gewaehlt: true,
    },
  ];

  protected readonly transaktionen = Array.from({ length: 118 }, (_, i) => ({
    nummer: i + 1,
    titel: ['Aufladung', 'Serverstunden', 'Erstattung'][i % 3],
    datum: `${String((i % 28) + 1).padStart(2, '0')}.09.2026, 15:55`,
    betrag: (0.53 + (i % 47) / 10).toFixed(2).replace('.', ','),
  }));

  protected readonly seite = signal(1);
  protected readonly ersteSeite = signal(1);
  protected readonly letzteSeite = signal(5);
  protected readonly leereSeite = signal(1);
  protected readonly englischeSeite = signal(1);

  protected readonly englischerBereich = (
    von: number,
    bis: number,
    total: number,
    label: string,
  ) => `${von} to ${bis} of ${total} ${label}`;

  protected readonly seitenInhalt = computed(() => {
    const start = (this.seite() - 1) * 25;
    return this.transaktionen.slice(start, start + 25);
  });
}
