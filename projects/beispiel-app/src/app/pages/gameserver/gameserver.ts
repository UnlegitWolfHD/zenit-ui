import { Clipboard } from '@angular/cdk/clipboard';
import { Component, computed, inject, input, linkedSignal, resource, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
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
  SKELETT_MS,
  warte,
} from '../../gameserver/gameserver-data';
import { ServerList } from '../../gameserver/server-list/server-list';
import { CodeBlock } from '../../shared/code-block/code-block';
import { DATEI, quelltext } from '../../shared/quelltexte';

/** The states a reader can call up through `?zustand=`. */
const SIMULATIONEN: readonly Simulation[] = ['normal', 'laden', 'leer', 'fehler'];

/** The filter that narrows nothing down: no text, "Alle Status". */
const KEIN_FILTER = { suche: '', status: STATUS_FILTER[0] };

/**
 * Page "Gameserver" of the customer area (10-seitenmuster.md): AppHeader,
 * PageHeader with one fact and one action, then the panels. The page title is
 * the same word as the navigation link.
 *
 * It owns the load, the filter, the feedback and the confirmation; drawing the
 * list is the job of ServerList. State is signals throughout: the query
 * parameter is an input, the list a `resource()`, the filter a Signal Form
 * (docs/signals.md).
 *
 * Every region carries a disclosure with its own source. A native `details` and
 * not `z-faq`, because that component projects into a `<p>` limited to
 * `measure`, and a `<pre>` inside a `<p>` is invalid HTML that the parser
 * closes early. `nav[zTabs]` with "Vorschau | Code" was the alternative; it
 * would show the code by default and put a second interactive layer on every
 * region of a page whose job is to be looked at. A closed `details` stays out
 * of the way, needs no script and is keyboard operable by itself.
 */
@Component({
  selector: 'app-gameserver',
  imports: [
    CodeBlock,
    FormField,
    ServerList,
    ZButton,
    ZField,
    ZIcon,
    ZInput,
    ZInputGroup,
    ZPageHeader,
    ZSelect,
  ],
  host: { class: 'app-page' },
  template: `
    <!-- #region seitenkopf -->
    <!-- One fact, and the one primary of this screen (PageHeader README). -->
    <z-page-header title="Gameserver" sub="Abrechnung nach Stunden, nächste Rechnung am 01.10.2026">
      <button zBtn="primary" type="button" (click)="erstellen()">
        <z-icon name="add" />
        Server erstellen
      </button>
    </z-page-header>
    <!-- #endregion -->

    <details class="app-code-faq">
      <summary>So ist es eingebunden: Seitenkopf</summary>
      <app-code-block
        [code]="quellen.seitenkopf"
        datei="pages/gameserver/gameserver.ts"
        sprache="Template"
      />
    </details>

    <div class="z-stack">
      @if (filterSichtbar()) {
        <!-- #region filterzeile -->
        <!-- An empty list shows no filters (EmptyState README), so the row only
             exists while there is something to narrow down. -->
        <div class="app-filter">
          <z-field label="Suche" for="suche">
            <z-input-group icon="search">
              <input
                zInput
                size="sm"
                id="suche"
                type="search"
                placeholder="Name oder Adresse"
                [formField]="filter.suche"
              />
            </z-input-group>
          </z-field>
          <z-field label="Status" for="status">
            <z-select size="sm">
              <select id="status" [formField]="filter.status">
                @for (option of statusOptionen; track option) {
                  <option [value]="option">{{ option }}</option>
                }
              </select>
            </z-select>
          </z-field>
        </div>
        <!-- #endregion -->

        <details class="app-code-faq">
          <summary>So ist es eingebunden: Filterzeile</summary>
          <div class="app-code-gruppe">
            <app-code-block
              [code]="quellen.filterzeile"
              datei="pages/gameserver/gameserver.ts"
              sprache="Template"
            />
            <app-code-block
              [code]="quellen.filter"
              datei="pages/gameserver/gameserver.ts"
              sprache="TypeScript"
            />
          </div>
        </details>
      }

      <!-- #region liste -->
      <app-server-list
        [server]="gefiltert()"
        [zustand]="zustandDerListe()"
        (kopieren)="adresseKopieren($event)"
        (neustart)="neustart($event)"
        (loeschen)="loeschen($event)"
        (erstellen)="erstellen()"
        (filterZuruecksetzen)="filterZuruecksetzen()"
        (erneutLaden)="erneutLaden()"
      />
      <!-- #endregion -->

      <details class="app-code-faq">
        <summary>So ist es eingebunden: Serverliste mit allen Zuständen</summary>
        <div class="app-code-gruppe">
          <app-code-block
            [code]="quellen.liste"
            datei="pages/gameserver/gameserver.ts"
            sprache="Template"
          />
          <app-code-block
            [code]="quellen.laden"
            datei="pages/gameserver/gameserver.ts"
            sprache="TypeScript"
          />
          <app-code-block
            [code]="quellen.dienst"
            datei="gameserver/gameserver-data.ts"
            sprache="TypeScript"
          />
          <app-code-block
            [code]="quellen.zustaende"
            datei="gameserver/server-list/server-list.ts"
            sprache="Template"
          />
          <app-code-block
            [code]="quellen.zeile"
            datei="gameserver/server-list/server-list.ts"
            sprache="Template"
          />
          <app-code-block
            [code]="quellen.seitenwahl"
            datei="gameserver/server-list/server-list.ts"
            sprache="Template"
          />
        </div>
      </details>

      <details class="app-code-faq">
        <summary>So ist es eingebunden: Aktionen mit Toast und Dialog</summary>
        <app-code-block
          [code]="quellen.aktionen"
          datei="pages/gameserver/gameserver.ts"
          sprache="TypeScript"
        />
      </details>

      <details class="app-code-faq">
        <summary>So ist es eingebunden: Rahmen und Theme-Umschalter</summary>
        <div class="app-code-gruppe">
          <app-code-block
            [code]="quellen.kopfzeile"
            datei="layout/shell/shell.ts"
            sprache="Template"
          />
          <app-code-block
            [code]="quellen.themeUmschalter"
            datei="layout/theme-control/theme-control.ts"
            sprache="TypeScript"
          />
        </div>
      </details>
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

  /**
   * The code the disclosures show, read once from the generated copy of the
   * real files. Nothing here is written by hand, so the page cannot show code
   * that the page does not run.
   */
  protected readonly quellen = {
    seitenkopf: quelltext(DATEI.seite, 'seitenkopf'),
    filterzeile: quelltext(DATEI.seite, 'filterzeile'),
    filter: quelltext(DATEI.seite, 'filter'),
    liste: quelltext(DATEI.seite, 'liste'),
    laden: quelltext(DATEI.seite, 'laden'),
    dienst: quelltext(DATEI.daten, 'laden'),
    aktionen: quelltext(DATEI.seite, 'aktionen'),
    zustaende: quelltext(DATEI.liste, 'zustaende'),
    zeile: quelltext(DATEI.liste, 'zeile'),
    seitenwahl: quelltext(DATEI.liste, 'seitenwahl'),
    kopfzeile: quelltext(DATEI.shell, 'kopfzeile'),
    themeUmschalter: quelltext(DATEI.themeControl),
  };

  // #region laden
  /**
   * What the server answers. It follows the query parameter and stays writable,
   * which is what `linkedSignal()` is for: "Erneut laden" asks for the normal
   * answer, so that the simulated error can be left again, and a new parameter
   * wins over that choice.
   */
  private readonly simulation = linkedSignal<Simulation>(
    () => SIMULATIONEN.find((s) => s === this.zustand()) ?? 'normal',
  );

  /**
   * The list is a `resource()`: new params start a load and abort the running
   * one, a rejected loader is the error state, and no effect or subscription
   * pushes the answer into a signal. A real page calls `liste.reload()` to
   * try again.
   */
  private readonly liste = resource<readonly BeispielServer[], Simulation>({
    params: () => this.simulation(),
    loader: ({ params, abortSignal }) => this.daten.laden(params, abortSignal),
    defaultValue: [],
  });

  /**
   * Turns true once a load has taken longer than 300 milliseconds, and only
   * then does the list draw skeleton rows (15-zustaende.md, "Lädt"). The delay
   * is a resource as well: it starts with the load, and the end of the load
   * aborts it and puts it back to `false`.
   */
  private readonly dauertLange = resource({
    params: () => this.liste.isLoading() || undefined,
    loader: ({ abortSignal }) => warte(SKELETT_MS, abortSignal).then(() => true),
    defaultValue: false,
  });

  /** `value()` of a resource throws in the error state, hence the guard. */
  private readonly server = computed(() => (this.liste.hasValue() ? this.liste.value() : []));

  protected erneutLaden(): void {
    this.simulation.set('normal');
  }
  // #endregion

  // #region filter
  /**
   * The filter is a Signal Form: one signal holds the values, `form()` turns
   * it into a field tree, and `[formField]` binds a native control to one
   * field. No handler reads `$event.target`, and the filtered list is a
   * `computed()` over the same signal.
   */
  protected readonly filterWerte = signal(KEIN_FILTER);
  protected readonly filter = form(this.filterWerte);

  protected readonly gefiltert = computed(() => {
    const { suche, status } = this.filterWerte();
    return filtern(this.server(), suche, status);
  });

  protected filterZuruecksetzen(): void {
    // reset() with a value writes the model and clears touched and dirty.
    this.filter().reset(KEIN_FILTER);
  }
  // #endregion

  /** Every state of the list, derived from the two resources and the filter. */
  protected readonly zustandDerListe = computed<ListenZustand>(() => {
    if (this.liste.isLoading()) {
      return this.dauertLange.value() ? 'skelett' : 'start';
    }
    if (this.liste.error()) {
      return 'fehler';
    }
    if (this.server().length === 0) {
      return 'leer';
    }
    return this.gefiltert().length === 0 ? 'gefiltert-leer' : 'liste';
  });

  /** An empty list shows no filters. */
  protected readonly filterSichtbar = computed(() => this.server().length > 0);

  /** The wizard belongs to the real application; here it only says so. */
  protected erstellen(): void {
    this.toast.show('Der Assistent gehört in deine Anwendung', { icon: 'info' });
  }

  protected adresseKopieren(server: BeispielServer): void {
    this.clipboard.copy(server.adresse);
    this.toast.show('Adresse kopiert', { icon: 'content_copy' });
  }

  // #region aktionen
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

  private async dialogFragen(server: BeispielServer): Promise<void> {
    // confirm() answers exactly once with an Observable<boolean>. One value is
    // a promise, so the page awaits it and holds no subscription.
    const bestaetigt = await firstValueFrom(
      this.dialog.confirm({
        title: `Server "${server.name}" löschen?`,
        body: 'Alle Welten, Backups und Zugänge gehen verloren. Das lässt sich nicht rückgängig machen.',
        confirmLabel: 'Löschen',
        cancelLabel: 'Abbrechen',
        danger: true,
        requireText: server.name,
        requireLabel: 'Name des Servers',
      }),
    );
    if (bestaetigt) {
      // Writing to a resource puts it into the state 'local'. Deleting the
      // last server leaves the list empty.
      this.liste.update((alt) => alt.filter((eintrag) => eintrag.id !== server.id));
      this.toast.success(`${server.name} gelöscht`);
    }
  }
  // #endregion
}
