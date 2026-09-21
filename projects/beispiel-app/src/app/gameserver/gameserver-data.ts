import { OnDestroy, Service, signal } from '@angular/core';
import { BEISPIEL_SERVER, BeispielServer, STATUS_FILTER } from './beispieldaten';

/**
 * Narrows the list: free text over name and address, plus one status. A pure
 * function, so the page keeps a `computed()` of one line and the rule can be
 * tested without a component.
 *
 * @param suche Free text, case is ignored. Empty means everything.
 * @param status One of {@link STATUS_FILTER}; the first entry means everything.
 */
export function filtern(
  server: readonly BeispielServer[],
  suche: string,
  status: string,
): readonly BeispielServer[] {
  const text = suche.trim().toLowerCase();
  return server.filter(
    (eintrag) =>
      (!text ||
        eintrag.name.toLowerCase().includes(text) ||
        eintrag.adresse.toLowerCase().includes(text)) &&
      (status === STATUS_FILTER[0] || eintrag.statusText === status),
  );
}

/**
 * What the page asks for, taken from the query parameter `?zustand=`. `normal`
 * is the default and shows the list.
 */
export type Simulation = 'normal' | 'laden' | 'leer' | 'fehler';

/**
 * What the list shows right now. `start` is the first 300 milliseconds of a
 * load: nothing is drawn yet, because a fast answer must not make placeholders
 * flash (15-zustaende.md, "Lädt").
 */
export type Ladezustand = 'start' | 'skelett' | 'liste' | 'leer' | 'fehler';

/** Everything the list renders, including the case "filter matches nothing". */
export type ListenZustand = Ladezustand | 'gefiltert-leer';

/** Skeleton rows only after 300 milliseconds (15-zustaende.md, Skeleton README). */
const SKELETT_MS = 300;

/** Simulated answer of the server. */
const ANTWORT_MS = 600;

/**
 * Source of the server list. In a real application this service calls the API;
 * here it answers from `beispieldaten.ts` after a timer, so that loading, empty
 * and error are real states of the page and not a switch in the template.
 *
 * `@Service()` is the short form of `@Injectable({ providedIn: 'root' })` for
 * singletons (Angular 22).
 */
@Service()
export class GameserverData implements OnDestroy {
  private readonly liste = signal<readonly BeispielServer[]>([]);
  private readonly ladezustand = signal<Ladezustand>('start');
  private timer: ReturnType<typeof setTimeout>[] = [];

  /** The servers that have arrived. Empty while loading and on error. */
  readonly server = this.liste.asReadonly();

  /** Which of the states the list is in. */
  readonly zustand = this.ladezustand.asReadonly();

  /**
   * Starts a load. `laden` keeps the skeleton standing, so that the loading
   * state can be looked at; every other simulation answers after
   * {@link ANTWORT_MS}.
   */
  laden(simulation: Simulation = 'normal'): void {
    this.stoppeTimer();
    this.liste.set([]);
    this.ladezustand.set('start');
    this.timer.push(setTimeout(() => this.ladezustand.set('skelett'), SKELETT_MS));
    if (simulation === 'laden') {
      return;
    }
    this.timer.push(
      setTimeout(() => {
        if (simulation === 'fehler') {
          this.ladezustand.set('fehler');
          return;
        }
        this.liste.set(simulation === 'leer' ? [] : BEISPIEL_SERVER);
        this.ladezustand.set(simulation === 'leer' ? 'leer' : 'liste');
      }, ANTWORT_MS),
    );
  }

  /** Removes a server after the confirmation. The last one leaves the list empty. */
  entfernen(id: string): void {
    this.liste.update((alt) => alt.filter((server) => server.id !== id));
    if (this.liste().length === 0) {
      this.ladezustand.set('leer');
    }
  }

  /** @internal Angular lifecycle hook: no timer survives the application. */
  ngOnDestroy(): void {
    this.stoppeTimer();
  }

  private stoppeTimer(): void {
    for (const t of this.timer) {
      clearTimeout(t);
    }
    this.timer = [];
  }
}
