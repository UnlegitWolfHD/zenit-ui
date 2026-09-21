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
import {
  ABFRAGE_DUNKEL,
  ABFRAGE_KONTRAST,
  ATTRIBUT_AKZENT,
  ATTRIBUT_SCHEMA,
  SCHEMA_DUNKEL,
  SCHEMA_HELL,
  SCHEMA_KONTRAST,
  SCHEMA_SYSTEM,
  ZThemeInitConfig,
  themeEinstellung,
} from './init-script';

declare const ngDevMode: boolean | undefined;

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
export interface ZThemeConfig extends ZThemeInitConfig {
  /**
   * Element that carries `data-theme` and `data-accent`. A getter, not the
   * element, so nothing touches the DOM while the providers are built; it is
   * called on the browser only. Return a stable element: when the getter
   * starts returning another one, the attributes are removed from the previous
   * element on the next change, not before. `zenitThemeInitScript` and the
   * server-side rendering of `data-theme` only know `<html>` and are skipped
   * for a custom target.
   *
   * @default () => document.documentElement
   */
  readonly target?: () => Element;
}

const Z_THEME_CONFIG = new InjectionToken<ZThemeConfig>('Z_THEME_CONFIG', {
  providedIn: 'root',
  factory: () => ({}),
});

/** The config each service instance was built from, for the check in the provider. */
const GENUTZTE_CONFIG = /* @__PURE__ */ new WeakMap<object, ZThemeConfig>();

/** Dev-mode only; production builds drop the branch together with `ngDevMode`. */
function warnen(text: string): void {
  if (typeof ngDevMode === 'undefined' || ngDevMode) {
    console.warn(`zenit-ui: ${text}`);
  }
}

/**
 * Registers the theme of the library and applies the stored or the default
 * choice as soon as the application starts. Without this provider `ZTheme`
 * still works, but with the defaults and nothing applied up front.
 *
 * Application root only. `ZTheme` is a root service and reads the config of
 * the root injector once; a second `provideZenitTheme` in the `providers` of a
 * route (or a second one at the root) is ignored, with a `console.warn` in dev
 * mode.
 *
 * "As soon as the application starts" is still several frames after the first
 * paint. To avoid a flash of the default scheme put the output of
 * {@link zenitThemeInitScript} as an inline `<script>` at the top of the
 * `<head>` of `index.html`, in front of every stylesheet, and pass it the same
 * config as this function.
 *
 * The stylesheets are not part of this: register
 * `zenit-ui/styles/themes.css` after `zenit-ui/styles/tokens.css` and before
 * `zenit-ui/styles/zenit-ui.css`. Without it only the `dark` scheme exists and
 * `setScheme('light')` changes nothing visible.
 *
 * @param config Deviations from the defaults; see {@link ZThemeConfig}.
 * @returns Providers for the application root (`bootstrapApplication`).
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
    provideEnvironmentInitializer(() => {
      if (GENUTZTE_CONFIG.get(inject(ZTheme)) !== config) {
        warnen(
          'provideZenitTheme() was called more than once or outside the application root. ' +
            'ZTheme is a root service and uses one config only; this one is ignored.',
        );
      }
    }),
  ]);
}

/**
 * Reads and switches the colour scheme and the accent. The service owns three
 * readonly signals and three methods; everything else is CSS.
 *
 * What it does on the browser: it writes `data-theme` and `data-accent` onto
 * the target element, keeps the choice in `localStorage`, follows a change made
 * in another tab (`storage` event), and while the scheme is `'system'` it
 * follows `prefers-color-scheme` and `prefers-contrast` live. On the server
 * `window`, `matchMedia` and `localStorage` are never touched, so the service
 * is safe to inject during SSR and reports the defaults. The one thing it does
 * there: a `defaultScheme` other than `'system'` is written as `data-theme`
 * onto `<html>` of the server document, so the delivered HTML already carries
 * it.
 *
 * Unknown ids are rejected: {@link setScheme} and {@link setAccent} return
 * `false` and change nothing. They do not throw, because the usual caller is a
 * `<select>` whose value comes from outside the application (a stored value, a
 * query parameter) and a broken value there must not take the page down; in
 * dev mode a `console.warn` names the id. A stored unknown id is ignored the
 * same way.
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
  private readonly config = inject(Z_THEME_CONFIG);
  private readonly einst = themeEinstellung(this.config);

  private readonly gewaehltesSchema = signal(this.einst.defaultScheme);
  private readonly gewaehlterAkzent = signal(this.einst.defaultAccent);
  private readonly systemDunkel = signal(true);
  private readonly systemKontrast = signal(false);

  /** The element written to last, so a changed `target` leaves no attributes behind. */
  private letztesZiel: Element | null = null;

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
   * The scheme that is applied. Equal to {@link scheme}, except for `'system'`:
   * that resolves to `'contrast'` while `prefers-contrast: more` matches and
   * `'contrast'` is one of `schemes`, otherwise to `'dark'` or `'light'` after
   * `prefers-color-scheme`. Both follow a change without a reload.
   */
  readonly resolvedScheme = computed(() => {
    const gewaehlt = this.gewaehltesSchema();
    if (gewaehlt !== SCHEMA_SYSTEM) {
      return gewaehlt;
    }
    if (this.systemKontrast() && this.einst.schemes.includes(SCHEMA_KONTRAST)) {
      return SCHEMA_KONTRAST;
    }
    return this.systemDunkel() ? SCHEMA_DUNKEL : SCHEMA_HELL;
  });

  constructor() {
    GENUTZTE_CONFIG.set(this, this.config);
    if (!this.kenntSchema(this.einst.defaultScheme)) {
      warnen(`defaultScheme "${this.einst.defaultScheme}" is neither "system" nor one of schemes.`);
    }
    if (!this.einst.accents.includes(this.einst.defaultAccent)) {
      warnen(`defaultAccent "${this.einst.defaultAccent}" is not one of accents.`);
    }

    if (!this.imBrowser) {
      // The server knows neither the stored choice nor the operating system,
      // so only a fixed default can go into the HTML. A custom target is a
      // browser-only getter and stays untouched.
      if (!this.einst.target && this.einst.defaultScheme !== SCHEMA_SYSTEM) {
        this.dok.documentElement?.setAttribute(ATTRIBUT_SCHEMA, this.einst.defaultScheme);
      }
      return;
    }

    const zerstoert = inject(DestroyRef);
    const fenster = this.dok.defaultView;
    const folgen = (abfrageText: string, ziel: { set(wert: boolean): void }) => {
      const abfrage = fenster?.matchMedia?.(abfrageText);
      if (!abfrage) {
        return;
      }
      ziel.set(abfrage.matches);
      const beiWechsel = (ereignis: MediaQueryListEvent) => {
        ziel.set(ereignis.matches);
        this.anwenden();
      };
      // Optional calls: test doubles and old engines only know addListener.
      abfrage.addEventListener?.('change', beiWechsel);
      zerstoert.onDestroy(() => abfrage.removeEventListener?.('change', beiWechsel));
    };
    folgen(ABFRAGE_DUNKEL, this.systemDunkel);
    folgen(ABFRAGE_KONTRAST, this.systemKontrast);

    const key = this.einst.storageKey;
    if (key && fenster) {
      // Another tab changed or dropped the choice. `key` is null after clear().
      const beiSpeicher = (ereignis: StorageEvent) => {
        if (ereignis.key === null || ereignis.key === key) {
          this.uebernehmen();
        }
      };
      fenster.addEventListener('storage', beiSpeicher);
      zerstoert.onDestroy(() => fenster.removeEventListener('storage', beiSpeicher));
    }

    this.uebernehmen();
  }

  /**
   * Switches the scheme and stores the choice.
   *
   * @param id One of `schemes`, or `'system'`.
   * @returns `false` if the id is unknown; nothing changes then.
   */
  setScheme(id: string): boolean {
    if (!this.kenntSchema(id)) {
      warnen(`setScheme("${id}") ignored, the id is neither "system" nor one of schemes.`);
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
      warnen(`setAccent("${id}") ignored, the id is not one of accents.`);
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
    return id === SCHEMA_SYSTEM || this.einst.schemes.includes(id);
  }

  /** Takes the stored choice, the defaults where nothing valid is stored, and applies it. */
  private uebernehmen(): void {
    const gespeichert = this.lesen();
    const schema = gespeichert?.scheme;
    const akzent = gespeichert?.accent;
    this.gewaehltesSchema.set(
      typeof schema === 'string' && this.kenntSchema(schema) ? schema : this.einst.defaultScheme,
    );
    this.gewaehlterAkzent.set(
      typeof akzent === 'string' && this.einst.accents.includes(akzent)
        ? akzent
        : this.einst.defaultAccent,
    );
    this.anwenden();
  }

  /**
   * Writes both attributes. The default accent gets none, so a page without a
   * choice looks exactly like a page that never heard of this service.
   */
  private anwenden(): void {
    if (!this.imBrowser) {
      return;
    }
    const ziel = this.einst.target ? this.einst.target() : this.dok.documentElement;
    if (this.letztesZiel && this.letztesZiel !== ziel) {
      this.letztesZiel.removeAttribute(ATTRIBUT_SCHEMA);
      this.letztesZiel.removeAttribute(ATTRIBUT_AKZENT);
    }
    this.letztesZiel = ziel;
    ziel.setAttribute(ATTRIBUT_SCHEMA, this.resolvedScheme());
    if (this.gewaehlterAkzent() === this.einst.defaultAccent) {
      ziel.removeAttribute(ATTRIBUT_AKZENT);
    } else {
      ziel.setAttribute(ATTRIBUT_AKZENT, this.gewaehlterAkzent());
    }
  }

  /**
   * `localStorage` throws in a private window and when site data is blocked,
   * and it is the property access itself that throws (`SecurityError`).
   */
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

  private lesen(): { scheme?: unknown; accent?: unknown } | null {
    const key = this.einst.storageKey;
    if (!key) {
      return null;
    }
    try {
      const roh = this.speicher()?.getItem(key);
      const wert: unknown = roh ? JSON.parse(roh) : null;
      return wert && typeof wert === 'object' ? wert : null;
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
