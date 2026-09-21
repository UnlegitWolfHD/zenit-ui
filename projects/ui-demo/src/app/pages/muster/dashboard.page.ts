import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ZAlert,
  ZAlertAction,
  ZAppHeader,
  ZBadge,
  ZBrand,
  ZButton,
  ZEmptyAction,
  ZEmptyState,
  ZHeaderEnd,
  ZHeaderLink,
  ZIcon,
  ZMetric,
  ZMetrics,
  ZPageHeader,
  ZPagination,
  ZPanel,
  ZRow,
  ZRowMain,
  ZRowNum,
  ZRows,
  ZRowsHead,
  ZSegment,
  ZSegmentOption,
  ZSkeleton,
} from 'zenit-ui';
import { GUTHABEN, KUNDEN_LINKS, NUTZER, SERVER } from './beispieldaten';

/*
 * Loading, empty and error are switched by hand so every state from
 * 15-zustaende.md is visible. The value stays a plain string because
 * `[(value)]` of z-segment binds a `model<string>`.
 */
const PRO_SEITE = 4;

/**
 * Page in the customer area after 10-seitenmuster.md: AppHeader, PageHeader
 * with one fact and at most two actions, at most one alert, then panels with a
 * `space-5` gap. The most important panel is "Meine Server".
 */
@Component({
  selector: 'demo-muster-dashboard-page',
  imports: [
    RouterLink,
    ZAlert,
    ZAlertAction,
    ZAppHeader,
    ZBadge,
    ZBrand,
    ZButton,
    ZEmptyAction,
    ZEmptyState,
    ZHeaderEnd,
    ZHeaderLink,
    ZIcon,
    ZMetric,
    ZMetrics,
    ZPageHeader,
    ZPagination,
    ZPanel,
    ZRow,
    ZRowMain,
    ZRowNum,
    ZRows,
    ZRowsHead,
    ZSegment,
    ZSkeleton,
  ],
  template: `
    <div class="z-stack">
      <div class="demo-steuerung">
        <span class="title-sm">Demo-Steuerung</span>
        <span class="z-muted">Zustand der Serverliste</span>
        <z-segment [options]="zustaende" [(value)]="zustand" ariaLabel="Zustand der Serverliste" />
      </div>

      <z-app-header navLabel="Hauptnavigation" [landmark]="false">
        <span zBrand>Zenit</span>
        @for (link of kundenLinks; track link) {
          <a zHeaderLink href="#" [active]="link === 'Dashboard'" (click)="$event.preventDefault()">
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

      <div class="demo-kundenbereich">
        <z-page-header title="Dashboard" sub="Nächste Abrechnung am 01.10.2026">
          <button zBtn="secondary" type="button">Bestellungen</button>
          <button zBtn="primary" type="button"><z-icon name="add" />Server erstellen</button>
        </z-page-header>

        <div class="z-stack">
          @if (zustand() === 'fehler') {
            <z-alert status="danger" title="Die Serverliste ist nicht geladen" icon="error">
              Das Panel hat nach 30 Sekunden nicht geantwortet. Lade die Seite neu oder öffne ein
              Ticket.
              <button zAlertAction zBtn="secondary" size="sm" type="button">Erneut laden</button>
            </z-alert>
          } @else {
            <z-alert status="info" title="Dein Guthaben reicht noch 6 Tage." icon="info">
              Danach werden laufende Server gesperrt.
              <button zAlertAction zBtn="secondary" size="sm" type="button">
                Guthaben aufladen
              </button>
            </z-alert>

            <!-- #region tabellenseite -->
            <z-panel title="Meine Server" headingLevel="2" flush [busy]="zustand() === 'laedt'">
              @switch (zustand()) {
                @case ('laedt') {
                  <z-rows>
                    <z-rows-head>
                      <span>Server</span>
                      <span>Status</span>
                      <span>Tarif</span>
                      <span style="text-align:right">Bisher</span>
                      <span></span>
                    </z-rows-head>
                    @for (platz of platzhalter; track platz) {
                      <div zRow>
                        <span class="z-cluster">
                          <z-skeleton thumb />
                          <z-skeleton width="120px" />
                        </span>
                        <z-skeleton width="72px" />
                        <z-skeleton width="96px" />
                        <z-skeleton width="48px" />
                        <span></span>
                      </div>
                    }
                  </z-rows>
                }
                @case ('leer') {
                  <z-empty-state title="Du hast noch keinen Server">
                    Der erste Server steht in etwa 60 Sekunden bereit.
                    <button zEmptyAction zBtn="secondary" type="button">Server erstellen</button>
                  </z-empty-state>
                }
                @default {
                  <z-rows>
                    <z-rows-head>
                      <span>Server</span>
                      <span>Status</span>
                      <span>Tarif</span>
                      <span style="text-align:right">Bisher</span>
                      <span></span>
                    </z-rows-head>
                    @for (eintrag of seitenInhalt(); track eintrag.name) {
                      <a zRow routerLink="/muster/server-panel">
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
                }
              }
              @if (zustand() === 'liste') {
                <z-pagination
                  [(page)]="seite"
                  [pageSize]="proSeite"
                  [total]="server.length"
                  itemLabel="Servern"
                />
              }
            </z-panel>
            <!-- #endregion -->

            <z-panel title="Auslastung der laufenden Server" headingLevel="2" flush>
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
                <z-metric label="Spieler" value="7" unit="/ 20" [percent]="35" />
              </z-metrics>
            </z-panel>
          }
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MusterDashboardPage {
  protected readonly kundenLinks = KUNDEN_LINKS;
  protected readonly guthaben = GUTHABEN;
  protected readonly nutzer = NUTZER;
  protected readonly server = SERVER;
  protected readonly proSeite = PRO_SEITE;
  protected readonly platzhalter = [1, 2, 3];

  protected readonly zustaende: ZSegmentOption[] = [
    { value: 'liste', label: 'Liste' },
    { value: 'laedt', label: 'Lädt' },
    { value: 'leer', label: 'Leer' },
    { value: 'fehler', label: 'Fehler' },
  ];

  protected readonly zustand = signal('liste');
  protected readonly seite = signal(1);

  protected readonly seitenInhalt = computed(() => {
    const start = (this.seite() - 1) * PRO_SEITE;
    return this.server.slice(start, start + PRO_SEITE);
  });
}
