import { CdkMenuTrigger } from '@angular/cdk/menu';
import { Component, computed, input, linkedSignal, output } from '@angular/core';
import {
  ZAlert,
  ZAlertAction,
  ZBadge,
  ZButton,
  ZEmptyAction,
  ZEmptyState,
  ZIcon,
  ZMenu,
  ZMenuItem,
  ZMenuSeparator,
  ZPagination,
  ZPanel,
  ZRow,
  ZRowMain,
  ZRowNum,
  ZRows,
  ZRowsHead,
  ZSkeleton,
} from 'zenit-ui';
import { BeispielServer, euro } from '../beispieldaten';
import { ListenZustand } from '../gameserver-data';

/** Rows per page. 25 is the default of z-pagination; eight servers need less. */
const PRO_SEITE = 6;

/** Number of skeleton rows: as many as a normal answer brings (Skeleton README). */
const PLATZHALTER = [1, 2, 3];

/**
 * The server list in all of its states. Presentational: it knows the servers
 * and the state, and it reports what the user wants; loading, deleting and
 * feedback stay in the page.
 *
 * The states come from 15-zustaende.md. Error is an alert instead of the panel,
 * because a page carries at most one alert and it stands above the content
 * (Alert README).
 */
@Component({
  selector: 'app-server-list',
  // ZMenu, ZMenuItem and ZMenuSeparator one by one instead of the bundle
  // Z_MENU: in the built package its type collapses to (typeof ZMenu)[], so
  // the Angular compiler no longer sees the other two entries.
  imports: [
    CdkMenuTrigger,
    ZAlert,
    ZAlertAction,
    ZBadge,
    ZButton,
    ZEmptyAction,
    ZEmptyState,
    ZIcon,
    ZMenu,
    ZMenuItem,
    ZMenuSeparator,
    ZPagination,
    ZPanel,
    ZRow,
    ZRowMain,
    ZRowNum,
    ZRows,
    ZRowsHead,
    ZSkeleton,
  ],
  template: `
    @if (zustand() === 'fehler') {
      <!-- An error message names the cause and the next step; the one button
           is secondary and small (Alert README). -->
      <z-alert status="danger" title="Die Serverliste ist nicht geladen" icon="error">
        Das Panel hat nach 30 Sekunden nicht geantwortet. Lade die Liste neu oder öffne ein Ticket.
        <button zAlertAction zBtn="secondary" size="sm" type="button" (click)="erneutLaden.emit()">
          Erneut laden
        </button>
      </z-alert>
    } @else {
      <z-panel
        title="Meine Server"
        headingLevel="2"
        flush
        [busy]="zustand() === 'skelett'"
        [attr.aria-label]="zustand() === 'skelett' ? 'Server werden geladen' : null"
      >
        <!-- #region zustaende -->
        @switch (zustand()) {
          @case ('start') {
            <!-- The first 300 milliseconds stay empty: an answer that fast must
                 not make placeholders flash (15-zustaende.md). -->
          }
          @case ('skelett') {
            <z-rows [columns]="spalten">
              <z-rows-head>
                <span>Server</span>
                <span>Status</span>
                <span>Tarif</span>
                <span class="app-rechts">Bisher</span>
                <span></span>
              </z-rows-head>
              <!-- Same grid, same row height: the layout must not jump when the
                   data arrives (Skeleton README). -->
              @for (platz of platzhalter; track platz) {
                <div zRow>
                  <span class="z-cluster">
                    <z-skeleton thumb />
                    <z-skeleton width="120px" />
                  </span>
                  <z-skeleton width="72px" />
                  <z-skeleton width="48px" />
                  <z-skeleton width="56px" />
                  <span></span>
                </div>
              }
            </z-rows>
          }
          @case ('leer') {
            <!-- The primary "Server erstellen" already sits in the PageHeader,
                 so the same action is secondary here (EmptyState README). -->
            <z-empty-state title="Du hast noch keinen Server">
              Der erste Server steht in etwa 60 Sekunden bereit.
              <button zEmptyAction zBtn="secondary" type="button" (click)="erstellen.emit()">
                Server erstellen
              </button>
            </z-empty-state>
          }
          @case ('gefiltert-leer') {
            <!-- Own sentence: the list is not empty, the filter is too narrow. -->
            <z-empty-state title="Kein Server passt zum Filter">
              Ändere die Suche oder wähle wieder alle Status.
              <button
                zEmptyAction
                zBtn="secondary"
                type="button"
                (click)="filterZuruecksetzen.emit()"
              >
                Filter zurücksetzen
              </button>
            </z-empty-state>
          }
          @default {
            <z-rows [columns]="spalten">
              <z-rows-head>
                <span>Server</span>
                <span>Status</span>
                <span>Tarif</span>
                <span class="app-rechts">Bisher</span>
                <span></span>
              </z-rows-head>
              @for (server of sichtbar(); track server.id) {
                <!-- #region zeile -->
                <!--
                  A row with its own actions is a <div>, not an <a>: a button
                  inside a link is invalid HTML, and the menu has to be a tab
                  stop of its own (15-zustaende.md, "Tastatur"). The library
                  documents exactly these two variants on ZRow, and the demo
                  uses the div variant for every row that carries an action
                  ("Geteilt mit mir" in projects/ui-demo, pages/daten). In an
                  application with a detail page the first cell becomes
                  <a [routerLink]="['/gameserver', server.id]"> around
                  <z-row-main />; this example has only this one page.
                -->
                <div zRow>
                  <z-row-main [title]="server.name" [meta]="server.meta" />
                  <!-- Status always in the second column, as a word plus dot. -->
                  <span>
                    <z-badge [status]="server.status" dot>{{ server.statusText }}</z-badge>
                  </span>
                  <!-- Tariff is a tag: neutral, no dot (Badge README). -->
                  <span
                    ><z-badge>{{ server.tarif }}</z-badge></span
                  >
                  <!-- Amounts right aligned in mono with tabular figures. -->
                  <span zRowNum>{{ preis(server) }}</span>
                  <button
                    zBtn="ghost"
                    iconOnly
                    type="button"
                    [attr.aria-label]="'Weitere Aktionen für ' + server.name"
                    [cdkMenuTriggerFor]="weitere"
                  >
                    <z-icon name="more_vert" />
                  </button>
                </div>
                <ng-template #weitere>
                  <z-menu>
                    <button zMenuItem icon="content_copy" (triggered)="kopieren.emit(server)">
                      Adresse kopieren
                    </button>
                    <button zMenuItem icon="restart_alt" (triggered)="neustart.emit(server)">
                      Neustart
                    </button>
                    <!-- Destructive entries sit below the separator and always
                         open a dialog (Menu README). -->
                    <z-menu-separator />
                    <button zMenuItem icon="delete" danger (triggered)="loeschen.emit(server)">
                      Server löschen
                    </button>
                  </z-menu>
                </ng-template>
                <!-- #endregion -->
              }
            </z-rows>
          }
        }
        <!-- #endregion -->
        <!-- #region seitenwahl -->
        <!--
          The pagination stands alone in its @if: z-panel picks it out of the
          projected content and puts it in the last row, and a control flow
          block only reaches a named slot while it holds this single node.
          z-pagination renders nothing while everything fits on one page.
        -->
        @if (zustand() === 'liste') {
          <z-pagination
            [(page)]="seite"
            [pageSize]="proSeite"
            [total]="server().length"
            itemLabel="Servern"
          />
        }
        <!-- #endregion -->
      </z-panel>
    }
  `,
})
export class ServerList {
  /** The servers to show, already filtered by the page. */
  readonly server = input.required<readonly BeispielServer[]>();

  /** Which state the list is in. */
  readonly zustand = input.required<ListenZustand>();

  /** "Adresse kopieren" from the row menu. */
  readonly kopieren = output<BeispielServer>();

  /** "Neustart" from the row menu. */
  readonly neustart = output<BeispielServer>();

  /** "Server löschen" from the row menu. The page asks before it happens. */
  readonly loeschen = output<BeispielServer>();

  /** "Server erstellen" from the empty state. */
  readonly erstellen = output<void>();

  /** "Filter zurücksetzen" when the filter matches nothing. */
  readonly filterZuruecksetzen = output<void>();

  /** "Erneut laden" from the error alert. */
  readonly erneutLaden = output<void>();

  protected readonly proSeite = PRO_SEITE;
  protected readonly platzhalter = PLATZHALTER;

  /**
   * Shared grid for head and rows, so that status, tariff and amount line up:
   * name, status, tariff, amount, action button (ServerList README). Below
   * 640px the stylesheet keeps the first two columns and drops the rest.
   */
  protected readonly spalten = 'minmax(0, 2fr) 128px 96px 96px 40px';

  /**
   * Current page. A new filter delivers a new array, and the page jumps back to
   * one, so nobody stares at an empty page two.
   */
  protected readonly seite = linkedSignal({ source: this.server, computation: () => 1 });

  protected readonly sichtbar = computed(() => {
    const start = (this.seite() - 1) * PRO_SEITE;
    return this.server().slice(start, start + PRO_SEITE);
  });

  protected preis(server: BeispielServer): string {
    return euro(server.kosten);
  }
}
