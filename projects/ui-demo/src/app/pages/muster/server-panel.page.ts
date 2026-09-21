import { CdkMenuTrigger } from '@angular/cdk/menu';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  Z_MENU,
  ZAlert,
  ZAppHeader,
  ZBadge,
  ZBadgeStatus,
  ZBrand,
  ZButton,
  ZCheckbox,
  ZConsole,
  ZConsoleLine,
  ZDialog,
  ZEmptyAction,
  ZEmptyState,
  ZHeaderEnd,
  ZHeaderLink,
  ZIcon,
  ZInput,
  ZMetric,
  ZMetrics,
  ZNum,
  ZPanel,
  ZPanelActions,
  ZRow,
  ZRowMain,
  ZRows,
  ZSelect,
  ZSetting,
  ZSidebar,
  ZSidebarGroup,
  ZSidebarItem,
  ZSpecItem,
  ZSpecList,
  ZTab,
  ZTable,
  ZTableContainer,
  ZTableName,
  ZTabs,
  ZToast,
  ZToastOutlet,
  ZToggle,
  ZTooltip,
} from 'zenit-ui';
import {
  DATEIEN,
  GUTHABEN,
  KUNDEN_LINKS,
  LOGZEILEN,
  NUTZER,
  PANEL_ADRESSE,
  PANEL_SERVER,
} from './beispieldaten';

/** Badge and word for every server status of 15-zustaende.md. */
const STATUS: Record<string, { wort: string; badge: ZBadgeStatus }> = {
  online: { wort: 'Online', badge: 'success' },
  startet: { wort: 'Startet', badge: 'warning' },
  gestoppt: { wort: 'Gestoppt', badge: 'neutral' },
  installation: { wort: 'Wird installiert', badge: 'info' },
  fehlgeschlagen: { wort: 'Fehlgeschlagen', badge: 'danger' },
  gesperrt: { wort: 'Gesperrt', badge: 'danger' },
};

/**
 * Server panel after 10-seitenmuster.md: AppHeader, sticky panel head with
 * name, status and actions, below it sidebar and content in `z-panel-shell`.
 * The main action in the head follows the status (15-zustaende.md), so a demo
 * control switches the status by hand.
 */
@Component({
  selector: 'demo-muster-server-panel-page',
  imports: [
    CdkMenuTrigger,
    RouterLink,
    Z_MENU,
    ZAlert,
    ZAppHeader,
    ZBadge,
    ZBrand,
    ZButton,
    ZCheckbox,
    ZConsole,
    ZEmptyAction,
    ZEmptyState,
    ZHeaderEnd,
    ZHeaderLink,
    ZIcon,
    ZInput,
    ZMetric,
    ZMetrics,
    ZNum,
    ZPanel,
    ZPanelActions,
    ZRow,
    ZRowMain,
    ZRows,
    ZSelect,
    ZSetting,
    ZSidebar,
    ZSidebarGroup,
    ZSidebarItem,
    ZSpecList,
    ZTab,
    ZTable,
    ZTableContainer,
    ZTableName,
    ZTabs,
    ZToastOutlet,
    ZToggle,
    ZTooltip,
  ],
  template: `
    <div class="z-stack">
      <div class="demo-steuerung">
        <span class="title-sm">Demo-Steuerung</span>
        <span class="z-muted" id="muster-status-label">Serverstatus</span>
        <z-select size="sm">
          <select aria-labelledby="muster-status-label" (change)="setzeStatus($event)">
            @for (eintrag of statusListe; track eintrag.wert) {
              <option [value]="eintrag.wert" [selected]="eintrag.wert === status()">
                {{ eintrag.wort }}
              </option>
            }
          </select>
        </z-select>
      </div>

      <z-app-header navLabel="Hauptnavigation" [landmark]="false">
        <span zBrand>Zenit</span>
        @for (link of kundenLinks; track link) {
          <a
            zHeaderLink
            href="#"
            [active]="link === 'Gameserver'"
            (click)="$event.preventDefault()"
          >
            {{ link }}
          </a>
        }
        <a
          zHeaderLink
          zHeaderEnd
          class="z-mono"
          href="#"
          aria-label="Guthaben 25,00 Euro, zur Abrechnung"
          (click)="$event.preventDefault()"
          >{{ guthaben }}</a
        >
        <span zHeaderEnd class="z-avatar" aria-hidden="true">{{ nutzer }}</span>
      </z-app-header>

      <div class="demo-panelkopf">
        <div class="z-cluster">
          <a zBtn="ghost" iconOnly routerLink="/muster/dashboard" aria-label="Zurück zum Dashboard">
            <z-icon name="arrow_back" />
          </a>
          <h1 class="heading-2 demo-flach">{{ servername }}</h1>
          <z-badge [status]="aktuell().badge">{{ aktuell().wort }}</z-badge>
          <span class="z-mono z-muted">{{ adresse }}</span>
          <button
            zBtn="ghost"
            iconOnly
            type="button"
            aria-label="Adresse kopieren"
            zTooltip="Adresse kopieren"
            (click)="adresseKopieren()"
          >
            <z-icon name="content_copy" />
          </button>
        </div>

        <div class="z-cluster">
          @switch (status()) {
            @case ('online') {
              <button zBtn="secondary" type="button" (click)="neustarten()">
                <z-icon name="restart_alt" />Neustart
              </button>
              <button zBtn="secondary" type="button" (click)="stoppen()">
                <z-icon name="stop" />Stoppen
              </button>
            }
            @case ('startet') {
              <button zBtn="primary" loading type="button">Wird gestartet</button>
              <span zTooltip="Beispiel-Server 1 startet gerade">
                <button zBtn="secondary" type="button" disabled>
                  <z-icon name="stop" />Stoppen
                </button>
              </span>
            }
            @case ('gestoppt') {
              <button zBtn="primary" type="button" (click)="starten()">
                <z-icon name="play_arrow" />Starten
              </button>
            }
            @case ('fehlgeschlagen') {
              <button zBtn="primary" type="button" (click)="erneutInstallieren()">
                <z-icon name="refresh" />Erneut installieren
              </button>
            }
            @case ('gesperrt') {
              <button zBtn="primary" type="button" (click)="aufladen()">Guthaben aufladen</button>
            }
          }
          <button
            zBtn="ghost"
            iconOnly
            type="button"
            [attr.aria-label]="'Weitere Aktionen für ' + servername"
            [cdkMenuTriggerFor]="weitere"
          >
            <z-icon name="more_vert" />
          </button>
        </div>
      </div>

      @if (status() === 'fehlgeschlagen') {
        <z-alert status="danger" title="Installation fehlgeschlagen" icon="error">
          SteamCMD hat nach 120 Sekunden nicht geantwortet. Starte die Installation erneut oder
          öffne ein Ticket.
        </z-alert>
      }
      @if (status() === 'installation') {
        <p class="z-muted demo-flach">
          Während der Installation gibt es keine Aktion im Kopf. Beispiel-Server 1 ist in etwa 60
          Sekunden bereit.
        </p>
      }

      <div class="z-panel-shell">
        <z-sidebar [ariaLabel]="servername">
          <z-sidebar-group>
            @for (eintrag of bereiche; track eintrag.text) {
              <button
                type="button"
                zSidebarItem
                [icon]="eintrag.icon"
                [active]="bereich() === eintrag.text"
                (click)="bereich.set(eintrag.text)"
              >
                {{ eintrag.text }}
              </button>
            }
          </z-sidebar-group>
        </z-sidebar>

        <div class="z-stack">
          <h2 class="heading-2 demo-flach">{{ bereich() }}</h2>

          @switch (bereich()) {
            @case ('Konsole') {
              <div class="z-cluster">
                <button zBtn="ghost" size="sm" type="button">
                  <z-icon name="content_copy" size="sm" />Log kopieren
                </button>
                <button zBtn="ghost" size="sm" type="button">
                  <z-icon name="download" size="sm" />Log herunterladen
                </button>
                <button zBtn="ghost" size="sm" type="button" (click)="logLeeren()">
                  <z-icon name="delete" size="sm" />Leeren
                </button>
              </div>
              <z-console
                [lines]="zeilen()"
                [disabled]="status() !== 'online'"
                placeholder="Befehl eingeben, Enter sendet"
                (command)="aufBefehl($event)"
              >
                Das Log ist leer. Neue Ausgaben erscheinen hier.
              </z-console>
              @if (status() !== 'online') {
                <p class="demo-grund caption">
                  Die Eingabe ist gesperrt: Befehle nimmt Beispiel-Server 1 nur im Status Online an.
                </p>
              }
            }
            @case ('Dateien') {
              <z-panel title="plugins" flush>
                <span zPanelActions class="caption z-subtle z-mono">4 Einträge</span>
                <z-table-container ariaLabel="Dateien, seitlich scrollbar">
                  <table zTable>
                    <thead>
                      <tr>
                        <th class="z-table__check">
                          <z-checkbox ariaLabel="Alle auswählen" />
                        </th>
                        <th>Name</th>
                        <th style="text-align:right">Größe</th>
                        <th style="text-align:right">Geändert</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (datei of dateien; track datei.name) {
                        <tr>
                          <td><z-checkbox [ariaLabel]="datei.name" /></td>
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
            }
            @case ('Eigenschaften') {
              <nav zTabs aria-label="Eigenschaften">
                @for (tab of tabs; track tab) {
                  <a
                    zTab
                    href="#"
                    [active]="aktiverTab() === tab"
                    (click)="waehleTab(tab, $event)"
                    >{{ tab }}</a
                  >
                }
              </nav>

              @switch (aktiverTab()) {
                @case ('Gamerules') {
                  <z-panel title="Gamerules">
                    <z-setting
                      title="Feuer breitet sich aus"
                      key="doFireTick"
                      description="Greift sofort."
                      titleId="muster-firetick"
                    >
                      <z-toggle [(checked)]="feuer" ariaLabelledby="muster-firetick" />
                    </z-setting>
                    <z-setting
                      title="Inventar bleibt beim Tod"
                      key="keepInventory"
                      description="Greift sofort."
                      titleId="muster-keep"
                    >
                      <z-toggle [(checked)]="inventar" ariaLabelledby="muster-keep" />
                    </z-setting>
                  </z-panel>
                }
                @case ('Datapacks') {
                  <z-panel title="Datapacks" flush>
                    <z-empty-state title="Kein Datapack installiert">
                      Lege ein Datapack in den Ordner world/datapacks und starte den Server neu.
                      <button zEmptyAction zBtn="secondary" type="button">
                        Datapack hochladen
                      </button>
                    </z-empty-state>
                  </z-panel>
                }
                @default {
                  <z-panel title="Welt">
                    <z-setting
                      title="PvP"
                      key="pvp"
                      description="Spieler können sich gegenseitig angreifen."
                      titleId="muster-pvp"
                    >
                      <z-toggle [(checked)]="pvp" ariaLabelledby="muster-pvp" />
                    </z-setting>
                    <z-setting
                      title="Schwierigkeit"
                      key="difficulty"
                      description="Greift nach dem nächsten Neustart."
                      titleId="muster-difficulty"
                    >
                      <z-select size="sm">
                        <select aria-labelledby="muster-difficulty">
                          @for (stufe of schwierigkeiten; track stufe) {
                            <option>{{ stufe }}</option>
                          }
                        </select>
                      </z-select>
                    </z-setting>
                  </z-panel>

                  <z-panel title="Spieler">
                    <z-setting
                      title="Maximale Spieler"
                      key="max-players"
                      description="Greift nach dem nächsten Neustart."
                      titleId="muster-maxplayers"
                    >
                      <input
                        zInput
                        mono
                        class="demo-narrow"
                        type="number"
                        min="1"
                        max="20"
                        value="20"
                        aria-labelledby="muster-maxplayers"
                      />
                    </z-setting>
                    <z-setting
                      title="Whitelist"
                      key="white-list"
                      description="Nur eingetragene Namen dürfen verbinden."
                      titleId="muster-whitelist"
                    >
                      <z-toggle [(checked)]="whitelist" ariaLabelledby="muster-whitelist" />
                    </z-setting>
                  </z-panel>
                }
              }
            }
            @default {
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

              <div class="demo-grid demo-grid--start">
                <z-panel title="Spieler" flush>
                  <span zPanelActions class="caption z-subtle z-mono">2 / 20</span>
                  <z-rows columns="minmax(0, 1fr) 96px">
                    @for (eintrag of spieler; track eintrag.name) {
                      <div zRow>
                        <z-row-main [title]="eintrag.name" [meta]="eintrag.meta" />
                        <span class="z-muted">{{ eintrag.rolle }}</span>
                      </div>
                    }
                  </z-rows>
                </z-panel>

                <z-panel title="Einstellungen">
                  <z-spec-list [items]="einstellungen" />
                </z-panel>
              </div>
            }
          }
        </div>
      </div>
    </div>

    <ng-template #weitere>
      <z-menu>
        <button zMenuItem icon="content_copy" (triggered)="adresseKopieren()">
          Adresse kopieren
        </button>
        <button zMenuItem icon="folder" (triggered)="bereich.set('Dateien')">FTP-Zugang</button>
        <z-menu-separator />
        <button zMenuItem icon="power_settings_new" danger (triggered)="hartBeenden()">
          Hart beenden
        </button>
      </z-menu>
    </ng-template>

    <z-toast-outlet />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MusterServerPanelPage {
  private readonly dialog = inject(ZDialog);
  private readonly toast = inject(ZToast);

  protected readonly kundenLinks = KUNDEN_LINKS;
  protected readonly guthaben = GUTHABEN;
  protected readonly nutzer = NUTZER;
  protected readonly servername = PANEL_SERVER;
  protected readonly adresse = PANEL_ADRESSE;
  protected readonly dateien = DATEIEN;

  protected readonly statusListe = Object.entries(STATUS).map(([wert, eintrag]) => ({
    wert,
    wort: eintrag.wort,
  }));

  protected readonly bereiche = [
    { icon: 'dashboard', text: 'Übersicht' },
    { icon: 'terminal', text: 'Konsole' },
    { icon: 'folder', text: 'Dateien' },
    { icon: 'tune', text: 'Eigenschaften' },
  ];

  protected readonly tabs = ['Eigenschaften', 'Gamerules', 'Datapacks'];
  protected readonly schwierigkeiten = ['Friedlich', 'Einfach', 'Normal', 'Schwer'];

  protected readonly spieler = [
    { name: 'Steve', meta: 'seit 41 Minuten · 203.0.113.20', rolle: 'Operator' },
    { name: 'Alex', meta: 'seit 12 Minuten · 203.0.113.21', rolle: 'Spieler' },
  ];

  protected readonly einstellungen: ZSpecItem[] = [
    { term: 'Version', value: 'PaperMC 26.3', mono: true },
    { term: 'Welt', value: 'world', mono: true },
    { term: 'Startskript', value: 'java -Xmx8G -jar server.jar', mono: true },
    { term: 'Neustart', value: 'Täglich um 04:00' },
  ];

  protected readonly status = signal('online');
  protected readonly bereich = signal('Übersicht');
  protected readonly aktiverTab = signal('Eigenschaften');
  protected readonly zeilen = signal<ZConsoleLine[]>([...LOGZEILEN]);

  protected readonly pvp = signal(true);
  protected readonly whitelist = signal(false);
  protected readonly feuer = signal(true);
  protected readonly inventar = signal(false);

  protected readonly aktuell = computed(() => STATUS[this.status()] ?? STATUS['online']);

  /** Seconds since midnight, continuing from the last line of the preview. */
  private uhr = 12 * 3600 + 7 * 60 + 15;

  protected setzeStatus(ereignis: Event): void {
    this.status.set((ereignis.target as HTMLSelectElement).value);
  }

  protected waehleTab(tab: string, ereignis: Event): void {
    ereignis.preventDefault();
    this.aktiverTab.set(tab);
  }

  protected starten(): void {
    this.status.set('startet');
    this.toast.show('Beispiel-Server 1 wird gestartet', { icon: 'play_arrow' });
  }

  protected stoppen(): void {
    this.status.set('gestoppt');
    this.toast.success('Beispiel-Server 1 ist gestoppt');
  }

  protected neustarten(): void {
    this.status.set('startet');
    this.toast.show('Beispiel-Server 1 startet neu', { icon: 'restart_alt' });
  }

  protected erneutInstallieren(): void {
    this.status.set('installation');
    this.toast.show('Installation neu gestartet', { icon: 'refresh' });
  }

  protected aufladen(): void {
    this.status.set('gestoppt');
    this.toast.success('Guthaben aufgeladen, Beispiel-Server 1 ist wieder freigegeben');
  }

  protected hartBeenden(): void {
    this.dialog
      .confirm({
        title: 'Beispiel-Server 1 hart beenden?',
        body: 'Der Prozess wird sofort gestoppt. Nicht gespeicherte Daten der Welt gehen verloren.',
        confirmLabel: 'Hart beenden',
        cancelLabel: 'Abbrechen',
        danger: true,
      })
      .subscribe((ja) => {
        if (!ja) {
          return;
        }
        this.status.set('gestoppt');
        this.toast.success('Beispiel-Server 1 wurde hart beendet');
      });
  }

  /** Only the browser clipboard, no service and no network. */
  protected adresseKopieren(): void {
    const zwischenablage = navigator.clipboard;
    const gescheitert = () =>
      this.toast.error(
        'Adresse nicht kopiert: der Browser hat den Zugriff auf die Zwischenablage abgelehnt. ' +
          'Markiere die Adresse und kopiere sie mit Strg und C.',
      );
    if (!zwischenablage) {
      gescheitert();
      return;
    }
    zwischenablage
      .writeText(this.adresse)
      .then(() => this.toast.show('Adresse kopiert', { icon: 'content_copy' }), gescheitert);
  }

  protected aufBefehl(text: string): void {
    this.zeilen.update((alt) => [...alt, { time: this.zeit(), text: `> ${text}`, level: 'cmd' }]);
  }

  protected logLeeren(): void {
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
