import { Clipboard } from '@angular/cdk/clipboard';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import {
  ZButton,
  ZDialog,
  ZField,
  ZIcon,
  ZInput,
  ZInputGroup,
  ZPageHeader,
  ZSelect,
  ZToast,
} from 'zenit-ui';
import { BeispielServer, STATUS_FILTER } from '../../gameserver/beispieldaten';
import {
  filtern,
  GameserverData,
  ListenZustand,
  Simulation,
} from '../../gameserver/gameserver-data';
import { ServerList } from '../../gameserver/server-list/server-list';

/** The states a reader can call up through `?zustand=`. */
const SIMULATIONEN: readonly Simulation[] = ['normal', 'laden', 'leer', 'fehler'];

/**
 * Page "Gameserver" of the customer area (10-seitenmuster.md): AppHeader,
 * PageHeader with one fact and one action, then the panels. The page title is
 * the same word as the navigation link.
 *
 * It owns the filter, the feedback and the confirmation; drawing the list is
 * the job of ServerList.
 */
@Component({
  selector: 'app-gameserver',
  imports: [ServerList, ZButton, ZField, ZIcon, ZInput, ZInputGroup, ZPageHeader, ZSelect],
  host: { class: 'app-page' },
  template: `
    <!-- One fact, and the one primary of this screen (PageHeader README). -->
    <z-page-header title="Gameserver" sub="Abrechnung nach Stunden, nächste Rechnung am 01.10.2026">
      <button zBtn="primary" type="button" (click)="erstellen()">
        <z-icon name="add" />
        Server erstellen
      </button>
    </z-page-header>

    <div class="z-stack">
      @if (filterSichtbar()) {
        <!-- An empty list shows no filters (EmptyState README), so the row only
             exists while there is something to narrow down. -->
        <div class="app-filter">
          <z-field label="Suche" for="suche">
            <z-input-group icon="search">
              <input
                zInput
                size="sm"
                id="suche"
                name="suche"
                type="search"
                placeholder="Name oder Adresse"
                [value]="suche()"
                (input)="sucheSetzen($event)"
              />
            </z-input-group>
          </z-field>
          <z-field label="Status" for="status">
            <z-select size="sm">
              <select id="status" name="status" (change)="statusSetzen($event)">
                @for (option of statusOptionen; track option) {
                  <option [value]="option" [selected]="option === status()">{{ option }}</option>
                }
              </select>
            </z-select>
          </z-field>
        </div>
      }

      <app-server-list
        [server]="gefiltert()"
        [zustand]="listenZustand()"
        (kopieren)="adresseKopieren($event)"
        (neustart)="neustart($event)"
        (loeschen)="loeschen($event)"
        (erstellen)="erstellen()"
        (filterZuruecksetzen)="filterZuruecksetzen()"
        (erneutLaden)="erneutLaden()"
      />
    </div>
  `,
})
export class Gameserver {
  private readonly daten = inject(GameserverData);
  private readonly toast = inject(ZToast);
  private readonly dialog = inject(ZDialog);
  private readonly clipboard = inject(Clipboard);

  /**
   * Query parameter `?zustand=laden|leer|fehler`, handed over by the router
   * through `withComponentInputBinding()`. Anything else shows the normal list.
   */
  readonly zustand = input<string>();

  protected readonly statusOptionen = STATUS_FILTER;
  protected readonly suche = signal('');
  protected readonly status = signal(STATUS_FILTER[0]);

  /** Search over name and address, plus the status filter. */
  protected readonly gefiltert = computed(() =>
    filtern(this.daten.server(), this.suche(), this.status()),
  );

  /** A loaded list that the filter narrows down to nothing is its own state. */
  protected readonly listenZustand = computed<ListenZustand>(() => {
    const zustand = this.daten.zustand();
    return zustand === 'liste' && this.gefiltert().length === 0 ? 'gefiltert-leer' : zustand;
  });

  protected readonly filterSichtbar = computed(() => this.daten.server().length > 0);

  constructor() {
    // The query parameter is the only trigger for a load, so opening
    // /gameserver?zustand=fehler shows exactly that state.
    effect(() => this.daten.laden(this.simulation()));
  }

  private simulation(): Simulation {
    const wunsch = this.zustand();
    return SIMULATIONEN.find((s) => s === wunsch) ?? 'normal';
  }

  protected sucheSetzen(ereignis: Event): void {
    this.suche.set((ereignis.target as HTMLInputElement).value);
  }

  protected statusSetzen(ereignis: Event): void {
    this.status.set((ereignis.target as HTMLSelectElement).value);
  }

  protected filterZuruecksetzen(): void {
    this.suche.set('');
    this.status.set(STATUS_FILTER[0]);
  }

  /** The wizard belongs to the real application; here it only says so. */
  protected erstellen(): void {
    this.toast.show('Der Assistent gehört in deine Anwendung', { icon: 'info' });
  }

  protected adresseKopieren(server: BeispielServer): void {
    this.clipboard.copy(server.adresse);
    this.toast.show('Adresse kopiert', { icon: 'content_copy' });
  }

  /**
   * Restart needs no dialog (Dialog README). The feedback is a toast: one
   * sentence, no full stop, in the past participle.
   */
  protected neustart(server: BeispielServer): void {
    this.toast.success(`Neustart für ${server.name} gestartet`);
  }

  /**
   * Deleting cannot be undone, so it goes through a confirmation that asks for
   * the server name. Escape and "Abbrechen" return the focus to the menu
   * button; that comes from the CDK.
   */
  protected loeschen(server: BeispielServer): void {
    // The menu closes only after (triggered) has run and hands the focus back
    // to the row button. Opening one microtask later makes that button the
    // element the dialog returns the focus to when it closes.
    queueMicrotask(() => this.dialogFragen(server));
  }

  private dialogFragen(server: BeispielServer): void {
    this.dialog
      .confirm({
        title: `Server "${server.name}" löschen?`,
        body: 'Alle Welten, Backups und Zugänge gehen verloren. Das lässt sich nicht rückgängig machen.',
        confirmLabel: 'Löschen',
        cancelLabel: 'Abbrechen',
        danger: true,
        requireText: server.name,
        requireLabel: 'Name des Servers',
      })
      .subscribe((bestaetigt) => {
        if (bestaetigt) {
          this.daten.entfernen(server.id);
          this.toast.success(`${server.name} gelöscht`);
        }
      });
  }

  /** The retry answers normally, so that the error state can be left again. */
  protected erneutLaden(): void {
    this.daten.laden('normal');
  }
}
