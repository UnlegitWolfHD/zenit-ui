/*
 * Plain TypeScript without a single import, on purpose: `ng add zenit-ui`
 * needs the same script, and schematics are compiled apart from the library
 * (CommonJS, no DOM types, `rootDir: schematics`). A byte-identical copy of
 * this file therefore lives at `schematics/ng-add/init-script.ts`; the test in
 * `schematics/ng-add/index.spec.ts` fails as soon as the two differ. Edit this
 * file, then copy it over.
 */

/**
 * The part of the theme configuration that decides which attributes end up on
 * the page. {@link ZThemeConfig} extends it; {@link zenitThemeInitScript}
 * takes exactly this part.
 */
export interface ZThemeInitConfig {
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
   * Ids of the selectable accents, written as `data-accent="<id>"`. The entry
   * named by {@link defaultAccent} carries no attribute, because the default
   * accent already lives in `tokens.css` and in the scheme blocks.
   *
   * @default ['rot', 'blau', 'gruen', 'violett']
   */
  readonly accents?: readonly string[];

  /**
   * Scheme before the first choice of the user. Either one of {@link schemes}
   * or `'system'`, which follows the operating system: `contrast` while
   * `prefers-contrast: more` matches and `contrast` is one of {@link schemes},
   * otherwise `dark` or `light` after `prefers-color-scheme`.
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
}

/** @internal Defaults shared by `ZTheme` and the init script. */
export const THEME_STANDARD: Required<ZThemeInitConfig> = {
  schemes: ['dark', 'light', 'contrast'],
  accents: ['rot', 'blau', 'gruen', 'violett'],
  defaultScheme: 'dark',
  defaultAccent: 'rot',
  storageKey: 'zenit-theme',
};

/** @internal The scheme id that hands the decision to the operating system. */
export const SCHEMA_SYSTEM = 'system';
/** @internal The scheme `system` resolves to while `prefers-contrast: more` matches. */
export const SCHEMA_KONTRAST = 'contrast';
/** @internal */
export const SCHEMA_DUNKEL = 'dark';
/** @internal */
export const SCHEMA_HELL = 'light';
/** @internal */
export const ABFRAGE_DUNKEL = '(prefers-color-scheme: dark)';
/** @internal */
export const ABFRAGE_KONTRAST = '(prefers-contrast: more)';
/** @internal */
export const ATTRIBUT_SCHEMA = 'data-theme';
/** @internal */
export const ATTRIBUT_AKZENT = 'data-accent';

/** @internal Merges a config onto the defaults, ignoring fields left out or `undefined`. */
export function themeEinstellung<T extends ZThemeInitConfig>(
  config: T,
): T & Required<ZThemeInitConfig> {
  const gesetzt = Object.fromEntries(
    Object.entries(config).filter(([, wert]) => wert !== undefined),
  ) as T;
  return { ...THEME_STANDARD, ...gesetzt };
}

/**
 * The script body. Written for every browser that can run the library and a
 * few older ones (no arrow functions, no `let`), because it runs before any
 * build step had a say. It mirrors what `ZTheme` does on start: read the stored
 * choice, drop unknown ids, resolve `system`, write `data-theme` and, unless
 * the accent is the default, `data-accent` onto `<html>`. Without `matchMedia`
 * `system` resolves to `dark`, as in the service.
 */
const RUMPF =
  '(function(k,S,A,ds,da){' +
  'var s=ds,a=da,d=document.documentElement,' +
  'm=function(q,f){try{return matchMedia(q).matches}catch(e){return f}};' +
  "try{var v=JSON.parse((k&&localStorage.getItem(k))||'null');" +
  "if(v&&typeof v==='object'){" +
  `if(v.scheme==='${SCHEMA_SYSTEM}'||S.indexOf(v.scheme)>-1)s=v.scheme;` +
  'if(A.indexOf(v.accent)>-1)a=v.accent}}catch(e){}' +
  `if(s==='${SCHEMA_SYSTEM}')s=S.indexOf('${SCHEMA_KONTRAST}')>-1&&m('${ABFRAGE_KONTRAST}',false)?'${SCHEMA_KONTRAST}':` +
  `m('${ABFRAGE_DUNKEL}',true)?'${SCHEMA_DUNKEL}':'${SCHEMA_HELL}';` +
  `d.setAttribute('${ATTRIBUT_SCHEMA}',s);` +
  `if(a!==da)d.setAttribute('${ATTRIBUT_AKZENT}',a)` +
  '})';

/**
 * JSON that is safe inside `<script>`: `<` would close the element
 * (`</script>`, `<!--`), U+2028 and U+2029 end a line in old engines. The
 * pattern is built here and not at module level, so an application that never
 * calls the function does not keep it in its bundle.
 */
function alsLiteral(wert: unknown): string {
  const heikel = new RegExp('[<' + String.fromCharCode(0x2028, 0x2029) + ']', 'g');
  return JSON.stringify(wert).replace(
    heikel,
    (zeichen) => '\\u' + zeichen.charCodeAt(0).toString(16).padStart(4, '0'),
  );
}

/**
 * Returns the source of a small script that applies the stored or the default
 * theme before the first paint. `ZTheme` can only do that once Angular has
 * started, which is several frames late: a user who chose `light` would see
 * the dark default flash on every load.
 *
 * Put the result into a `<script>` as early in `<head>` as possible, in front
 * of every stylesheet, and pass the same config as to `provideZenitTheme`. The
 * script always writes to `<html>`; with a custom `target` it is of no use.
 * It is a pure string function: no DOM access, safe on the server and in a
 * build script, and the result contains no `eval`.
 *
 * The stylesheet has to block rendering as well. The Angular CLI inlines
 * "critical" CSS and loads the rest late; `[data-theme="light"]` is never
 * critical, because nothing in `index.html` matches it. Set
 * `optimization.styles.inlineCritical` to `false` (`ng add zenit-ui --themes`
 * does both). See `docs/theming.md`, "No flash of the wrong theme".
 *
 * With a Content Security Policy the returned string is what you hash
 * (`sha256`) or what goes into the `<script nonce="…">` element.
 *
 * @param config The same values as for `provideZenitTheme`; `target` is ignored.
 * @returns The script body, without the `<script>` tags.
 *
 * @example
 * ```ts
 * // server.ts or a build script
 * const head = `<script nonce="${nonce}">${zenitThemeInitScript({ defaultScheme: 'system' })}</script>`;
 * ```
 */
export function zenitThemeInitScript(config: ZThemeInitConfig = {}): string {
  const e = themeEinstellung(config);
  const argumente = [e.storageKey, e.schemes, e.accents, e.defaultScheme, e.defaultAccent].map(
    alsLiteral,
  );
  return `${RUMPF}(${argumente.join(',')})`;
}
