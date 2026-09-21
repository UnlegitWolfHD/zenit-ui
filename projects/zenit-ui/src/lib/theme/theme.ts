import { isPlatformBrowser } from '@angular/common';
import {
  DestroyRef,
  DOCUMENT,
  EnvironmentProviders,
  InjectionToken,
  PLATFORM_ID,
  Service,
  computed,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
  signal,
} from '@angular/core';

/**
 * Configuration of {@link provideZenitTheme}. Every field is optional; the
 * defaults match the stylesheets shipped in `zenit-ui/styles/themes.css`.
 *
 * @example
 * ```ts
 * provideZenitTheme({
 *   schemes: ['dark', 'light', 'contrast', 'sepia'],
 *   defaultScheme: 'system',
 *   storageKey: 'meine-app-theme',
 * });
 * ```
 */
export interface ZThemeConfig {
  /**
   * Ids of the selectable colour schemes. Each id is written to the target as
   * `data-theme="<id>"` and needs a matching CSS block; the ids shipped with
   * the library are `dark`, `light` and `contrast`. Own ids are allowed and are
   * validated against exactly this list.
   *
   * @default ['dark', 'light', 'contrast']
   */
  readonly schemes?: readonly string[];

  /**
   * Ids of the selectable accents, written as `data-accent="<id>"`. The first
   * entry of {@link defaultAccent} carries no attribute, because the default
   * accent already lives in `tokens.css` and in the scheme blocks.
   *
   * @default ['rot', 'blau', 'gruen', 'violett']
   */
  readonly accents?: readonly string[];

  /**
   * Scheme before the first choice of the user. Either one of {@link schemes}
   * or `'system'`, which follows `prefers-color-scheme` and resolves to `dark`
   * or `light`.
   *
   * @default 'dark'
   */
  readonly defaultScheme?: string;

  /**
   * Accent before the first choice of the user. It has to be one of
   * {@link accents} and gets no `data-accent` attribute.
   *
   * @default 'rot'
   */
  readonly defaultAccent?: string;

  /**
   * Key under which the choice is stored in `localStorage`. `null` turns
   * persistence off: the theme then resets on every load.
   *
   * @default 'zenit-theme'
   */
  readonly storageKey?: string | null;

  /**
   * Element that carries `data-theme` and `data-accent`. A getter, not the
   * element, so nothing touches the DOM while the providers are built; it is
   * called on the browser only.
   *
   * @default () => document.documentElement
   */
  readonly target?: () => Element;
}

/** Config as it reaches the service: everything filled in. */
type ZThemeEinstellung = Required<Omit<ZThemeConfig, 'target'>> & {
  readonly target: (() => Element) | null;
};

const STANDARD: ZThemeEinstellung = {
  schemes: ['dark', 'light', 'contrast'],
  accents: ['rot', 'blau', 'gruen', 'violett'],
  defaultScheme: 'dark',
  defaultAccent: 'rot',
  storageKey: 'zenit-theme',
  target: null,
};

const Z_THEME_CONFIG = new InjectionToken<ZThemeConfig>('Z_THEME_CONFIG', {
  providedIn: 'root',
  factory: () => ({}),
});

/** Merges a config onto the defaults, ignoring fields left out or `undefined`. */
function einstellung(config: ZThemeConfig): ZThemeEinstellung {
  const zusammen = { ...STANDARD };
  for (const [name, wert] of Object.entries(config)) {
    if (wert !== undefined) {
      (zusammen as Record<string, unknown>)[name] = wert;
    }
  }
  return zusammen;
}

/**
 * Registers the theme of the library and applies the stored or the default
 * choice as soon as the application starts. Without this provider `ZTheme`
 * still works, but with the defaults and nothing applied up front.
 *
 * The stylesheets are not part of this: include `zenit-ui/styles/themes.css`
 * after `zenit-ui/styles/tokens.css` (see `docs/theming.md`).
 *
 * @param config Deviations from the defaults; see {@link ZThemeConfig}.
 * @returns Providers for `bootstrapApplication` or a route.
 *
 * @example
 * ```ts
 * // app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [provideRouter(routes), provideZenitTheme({ defaultScheme: 'system' })],
 * };
 * ```
 */
export function provideZenitTheme(config: ZThemeConfig = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: Z_THEME_CONFIG, useValue: config },
    provideEnvironmentInitializer(() => void inject(ZTheme)),
  ]);
}

/**
 * Reads and switches the colour scheme and the accent. The service owns three
 * readonly signals and three methods; everything else is CSS.
 *
 * What it does on the browser: it writes `data-theme` and `data-accent` onto
 * the target element, keeps the choice in `localStorage`, and while the scheme
 * is `'system'` it follows `prefers-color-scheme` live. On the server it does
 * none of that: `document`, `window`, `matchMedia` and `localStorage` are never
 * touched outside the browser, so the service is safe to inject during SSR and
 * simply reports the defaults.
 *
 * Unknown ids are rejected: {@link setScheme} and {@link setAccent} return
 * `false` and change nothing. They do not throw, because the usual caller is a
 * `<select>` whose value comes from outside the application (a stored value, a
 * query parameter) and a broken value there must not take the page down. A
 * stored unknown id is ignored the same way.
 *
 * @example
 * ```ts
 * @Component({
 *   selector: 'app-theme-switch',
 *   template: `
 *     <select [value]="theme.scheme()" (change)="waehlen($event)">
 *       <option value="dark">Dunkel</option>
 *       <option value="light">Hell</option>
 *       <option value="system">System</option>
 *     </select>
 *     <p>Aktiv: {{ theme.resolvedScheme() }}</p>
 *   `,
 * })
 * export class ThemeSwitch {
 *   protected readonly theme = inject(ZTheme);
 *
 *   protected waehlen(event: Event): void {
 *     this.theme.setScheme((event.target as HTMLSelectElement).value);
 *   }
 * }
 * ```
 */
@Service()
export class ZTheme {
  private readonly dok = inject(DOCUMENT);
  private readonly imBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly einst = einstellung(inject(Z_THEME_CONFIG));

  private readonly gewaehltesSchema = signal(this.einst.defaultScheme);
  private readonly gewaehlterAkzent = signal(this.einst.defaultAccent);
  private readonly systemDunkel = signal(true);

  /**
   * The chosen scheme, exactly as it was set: one of `schemes`, or `'system'`
   * while the operating system decides. For what is actually on the page, read
   * {@link resolvedScheme}.
   */
  readonly scheme = this.gewaehltesSchema.asReadonly();

  /**
   * The chosen accent. The default accent is a value here as well, even though
   * it carries no attribute on the target.
   */
  readonly accent = this.gewaehlterAkzent.asReadonly();

  /**
   * The scheme that is applied. Equal to {@link scheme}, except for `'system'`,
   * which resolves to `'dark'` or `'light'` and follows a change of
   * `prefers-color-scheme` without a reload.
   */
  readonly resolvedScheme = computed(() => {
    const gewaehlt = this.gewaehltesSchema();
    return gewaehlt === 'system' ? (this.systemDunkel() ? 'dark' : 'light') : gewaehlt;
  });

  constructor() {
    if (!this.imBrowser) {
      return;
    }
    const fenster = this.dok.defaultView;
    const abfrage = fenster?.matchMedia?.('(prefers-color-scheme: dark)');
    if (abfrage) {
      this.systemDunkel.set(abfrage.matches);
      const beiWechsel = (ereignis: MediaQueryListEvent) => {
        this.systemDunkel.set(ereignis.matches);
        this.anwenden();
      };
      abfrage.addEventListener('change', beiWechsel);
      inject(DestroyRef).onDestroy(() => abfrage.removeEventListener('change', beiWechsel));
    }

    const gespeichert = this.lesen();
    if (gespeichert?.scheme && this.kenntSchema(gespeichert.scheme)) {
      this.gewaehltesSchema.set(gespeichert.scheme);
    }
    if (gespeichert?.accent && this.einst.accents.includes(gespeichert.accent)) {
      this.gewaehlterAkzent.set(gespeichert.accent);
    }
    this.anwenden();
  }

  /**
   * Switches the scheme and stores the choice.
   *
   * @param id One of `schemes`, or `'system'`.
   * @returns `false` if the id is unknown; nothing changes then.
   */
  setScheme(id: string): boolean {
    if (!this.kenntSchema(id)) {
      return false;
    }
    this.gewaehltesSchema.set(id);
    this.sichern();
    this.anwenden();
    return true;
  }

  /**
   * Switches the accent and stores the choice.
   *
   * @param id One of `accents`.
   * @returns `false` if the id is unknown; nothing changes then.
   */
  setAccent(id: string): boolean {
    if (!this.einst.accents.includes(id)) {
      return false;
    }
    this.gewaehlterAkzent.set(id);
    this.sichern();
    this.anwenden();
    return true;
  }

  /** Back to `defaultScheme` and `defaultAccent` and drops the stored choice. */
  reset(): void {
    this.gewaehltesSchema.set(this.einst.defaultScheme);
    this.gewaehlterAkzent.set(this.einst.defaultAccent);
    this.vergessen();
    this.anwenden();
  }

  private kenntSchema(id: string): boolean {
    return id === 'system' || this.einst.schemes.includes(id);
  }

  private ziel(): Element | null {
    if (!this.imBrowser) {
      return null;
    }
    return this.einst.target ? this.einst.target() : this.dok.documentElement;
  }

  /**
   * Writes both attributes. The default accent gets none, so a page without a
   * choice looks exactly like a page that never heard of this service.
   */
  private anwenden(): void {
    const ziel = this.ziel();
    if (!ziel) {
      return;
    }
    ziel.setAttribute('data-theme', this.resolvedScheme());
    if (this.gewaehlterAkzent() === this.einst.defaultAccent) {
      ziel.removeAttribute('data-accent');
    } else {
      ziel.setAttribute('data-accent', this.gewaehlterAkzent());
    }
  }

  /** `localStorage` throws in a private window and when site data is blocked. */
  private speicher(): Storage | null {
    if (!this.imBrowser || !this.einst.storageKey) {
      return null;
    }
    try {
      return this.dok.defaultView?.localStorage ?? null;
    } catch {
      return null;
    }
  }

  private lesen(): { scheme?: string; accent?: string } | null {
    const key = this.einst.storageKey;
    if (!key) {
      return null;
    }
    try {
      const roh = this.speicher()?.getItem(key);
      const wert: unknown = roh ? JSON.parse(roh) : null;
      return wert && typeof wert === 'object'
        ? (wert as { scheme?: string; accent?: string })
        : null;
    } catch {
      return null;
    }
  }

  private sichern(): void {
    const key = this.einst.storageKey;
    if (!key) {
      return;
    }
    try {
      this.speicher()?.setItem(
        key,
        JSON.stringify({ scheme: this.gewaehltesSchema(), accent: this.gewaehlterAkzent() }),
      );
    } catch {
      // Private window, quota, blocked site data: the theme still works, it
      // just does not survive the reload.
    }
  }

  private vergessen(): void {
    const key = this.einst.storageKey;
    if (!key) {
      return;
    }
    try {
      this.speicher()?.removeItem(key);
    } catch {
      // See sichern().
    }
  }
}
