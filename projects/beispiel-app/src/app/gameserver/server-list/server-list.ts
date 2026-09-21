import { CdkMenuTrigger } from '@angular/cdk/menu';
import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import {
  Z_MENU,
  ZAlert,
  ZAlertAction,
  ZBadge,
  ZButton,
  ZEmptyAction,
  ZEmptyState,
  ZIcon,
  ZPagination,
  ZPanel,
  ZRow,
  ZRowAction,
  ZRowLink,
  ZRowMain,
  ZRowMeta,
  ZRowNum,
  ZRows,
  ZRowsHead,
  ZRowTitle,
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
  imports: [
    CdkMenuTrigger,
    Z_MENU,
    ZAlert,
    ZAlertAction,
    ZBadge,
    ZButton,
    ZEmptyAction,
    ZEmptyState,
    ZIcon,
    ZPagination,
    ZPanel,
    ZRow,
    ZRowAction,
    ZRowLink,
    ZRowMain,
    ZRowMeta,
    ZRowNum,
    ZRows,
    ZRowsHead,
    ZRowTitle,
    ZSkeleton,
  ],
  template: `
    <!-- The live region stands in every state, so a screen reader announces the
         sentence when it appears. aria-busy on the panel alone is silent, and
         an aria-label on the roleless host of z-panel is ignored. -->
    <p class="z-visually-hidden" role="status">
      @if (zustand() === 'skelett') {
        Server werden geladen
      }
    </p>
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
      <z-panel title="Meine Server" headingLevel="2" flush [busy]="zustand() === 'skelett'">
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
                  A row that is a target and carries its own actions is a
                  <div>: a <button> inside an <a> is invalid HTML and would
                  give both controls one tab stop (15-zustaende.md,
                  "Tastatur"). So the link sits on the title and carries
                  zRowLink, whose stretched ::after makes the whole row
                  clickable, and the menu button carries zRowAction, which
                  lifts it above that overlay, keeps it a tab stop of its own
                  and keeps it visible below 640px. In an application with a
                  detail page the link is
                  <a zRowTitle zRowLink [routerLink]="['/gameserver', server.id]">;
                  this example has only this one page and answers with a toast.
                -->
                <div zRow>
                  <z-row-main [title]="server.name">
                    <a
                      zRowTitle
                      zRowLink
                      href="#"
                      (click)="$event.preventDefault(); oeffnen.emit(server)"
                      >{{ server.name }}</a
                    >
                    <!-- Address and port in the mono face, the rest of the line
                         in the body face (CLAUDE.md, "Typografie"). -->
                    <div zRowMeta>
                      {{ server.spiel }} ·
                      <span class="z-mono">{{ server.adresse }}</span>
                      @if (server.hinweis) {
                        · {{ server.hinweis }}
                      }
                    </div>
                  </z-row-main>
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
                    zRowAction
                    zBtn="ghost"
                    iconOnly
                    type="button"
                    [id]="menueId(server)"
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
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  /** The servers to show, already filtered by the page. */
  readonly server = input.required<readonly BeispielServer[]>();

  /** Which state the list is in. */
  readonly zustand = input.required<ListenZustand>();

  /** The row itself was clicked: in a real application a routerLink. */
  readonly oeffnen = output<BeispielServer>();

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
   * 640px the stylesheet keeps name and status, drops tariff and amount and
   * keeps the action, so the row menu stays reachable on a phone.
   */
  protected readonly spalten = 'minmax(0, 2fr) 128px 96px 96px 40px';

  /**
   * Current page, clamped instead of reset: it follows the number of pages and
   * keeps the chosen page as long as that page still exists. Deleting the
   * seventh server on page two used to throw the reader back to page one; now
   * only a list that has become too short moves the page, and then no further
   * than the last page there is.
   */
  protected readonly seiten = computed(() =>
    Math.max(1, Math.ceil(this.server().length / PRO_SEITE)),
  );
  protected readonly seite = linkedSignal<number, number>({
    source: this.seiten,
    computation: (seiten, vorher) => Math.min(vorher?.value ?? 1, seiten),
  });

  protected readonly sichtbar = computed(() => {
    const start = (this.seite() - 1) * PRO_SEITE;
    return this.server().slice(start, start + PRO_SEITE);
  });

  protected preis(server: BeispielServer): string {
    return euro(server.kosten);
  }

  /** Id of the menu button of a row, so the dialog can name it as its trigger. */
  protected menueId(server: BeispielServer): string {
    return `aktionen-${server.id}`;
  }

  /**
   * Moves the focus off a row that is about to disappear. The page calls it
   * before it removes the server, because the menu button that opened the
   * dialog goes with its row and the focus would otherwise fall to `<body>`.
   *
   * It lands on the menu button of the row that takes the place of the removed
   * one, on the last row's button when the removed row was the last, and on the
   * main landmark when no row is left.
   */
  fokusNachEntfernen(server: BeispielServer): void {
    const index = Math.max(
      0,
      this.sichtbar().findIndex((eintrag) => eintrag.id === server.id),
    );
    afterNextRender(
      () => {
        const element = this.host.nativeElement;
        const knoepfe = element.querySelectorAll<HTMLElement>('.z-row__action');
        const ziel = knoepfe[Math.min(index, knoepfe.length - 1)];
        (ziel ?? element.closest('main'))?.focus();
      },
      { injector: this.injector },
    );
  }
}
