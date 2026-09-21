import { Service } from '@angular/core';
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
 * What the list renders. `start` is the first 300 milliseconds of a load:
 * nothing is drawn yet, because a fast answer must not make placeholders flash
 * (15-zustaende.md, "Lädt"). `gefiltert-leer` is a loaded list that the filter
 * narrows down to nothing.
 */
export type ListenZustand = 'start' | 'skelett' | 'liste' | 'leer' | 'fehler' | 'gefiltert-leer';

/** Skeleton rows only after 300 milliseconds (15-zustaende.md, Skeleton README). */
export const SKELETT_MS = 300;

/** Simulated answer of the server. */
const ANTWORT_MS = 600;

/**
 * A timer as a promise that a `resource()` can abort: the abort clears the
 * timer and rejects, and the resource drops the result of an aborted load.
 */
export function warte(ms: number, abbruch: AbortSignal): Promise<void> {
  return new Promise((fertig, abgebrochen) => {
    const timer = setTimeout(fertig, ms);
    abbruch.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        abgebrochen(abbruch.reason);
      },
      { once: true },
    );
  });
}

/**
 * Source of the server list. In a real application this service calls the API;
 * here it answers from `beispieldaten.ts` after a timer. It holds no state:
 * the page wraps {@link laden} in a `resource()`, and loading, empty and error
 * are states of that resource instead of a switch in the template.
 *
 * `@Service()` is the short form of `@Injectable({ providedIn: 'root' })` for
 * singletons (Angular 22).
 */
@Service()
export class GameserverData {
  // #region laden
  /**
   * One load, shaped like the loader of a `resource()`: a promise that settles
   * once and stops when `abbruch` fires. With `HttpClient` this method would
   * be `firstValueFrom(http.get(...))`, or the page would use `httpResource()`.
   *
   * @param simulation `fehler` rejects, `leer` answers with no server and
   *   `laden` never answers, so that the loading state can be looked at.
   */
  async laden(simulation: Simulation, abbruch: AbortSignal): Promise<readonly BeispielServer[]> {
    if (simulation === 'laden') {
      return new Promise<never>(() => undefined);
    }
    await warte(ANTWORT_MS, abbruch);
    if (simulation === 'fehler') {
      throw new Error('Simulated failure of the server list');
    }
    return simulation === 'leer' ? [] : BEISPIEL_SERVER;
  }
  // #endregion
}
