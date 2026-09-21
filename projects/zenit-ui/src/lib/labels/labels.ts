import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';

/**
 * Every default text the library ships, in one place.
 *
 * The library holds no copy of its own beyond these: they are the accessible
 * names and the one visible sentence that a component cannot leave empty
 * without breaking screen readers. Everything else comes from the caller as an
 * input.
 *
 * A key is a plain `string` when the text is fixed and a function when it takes
 * parameters. Components read the registry through {@link Z_LABELS}; an input
 * set on the element still wins over the registry value.
 *
 * @see {@link Z_LABELS_DE} for the German defaults, {@link Z_LABELS_EN} for the
 * English ones and {@link provideZenitLabels} to override single keys.
 */
export interface ZLabels {
  /** `aria-label` of the back button in `z-pagination`. */
  paginationPrev: string;

  /** `aria-label` of the forward button in `z-pagination`. */
  paginationNext: string;

  /** Accessible name of the `<nav>` landmark around the pager in `z-pagination`. */
  paginationNav: string;

  /**
   * The sentence in front of the pagination buttons.
   *
   * @param from Number of the first entry on the current page, 1-based.
   * @param to Number of the last entry on the current page.
   * @param total Number of entries in the whole list.
   * @param itemLabel What the list contains, for example "Rechnungen".
   * @returns The rendered sentence, for example `1 bis 25 von 118 Rechnungen`.
   */
  paginationRange: (from: number, to: number, total: number, itemLabel: string) => string;

  /** `aria-label` of the log region in `z-console`. */
  consoleLog: string;

  /** `aria-label` of the command input in `z-console`. */
  consoleInput: string;

  /** Caption of the button that jumps back to the end of the log in `z-console`. */
  consoleJumpToEnd: string;

  /** `aria-label` of the menu button of `z-app-header`, shown below 900px. */
  headerMenu: string;

  /** `aria-label` of the close button on every toast in `z-toast-outlet`. */
  toastClose: string;

  /** Accessible name of the scrollable region `z-table-container`. */
  tableRegion: string;
}

/**
 * German defaults, the value {@link Z_LABELS} falls back to. They match the
 * wording of the design system: normal capitalisation, no slogans.
 */
export const Z_LABELS_DE = {
  paginationPrev: 'Vorherige Seite',
  paginationNext: 'Nächste Seite',
  paginationNav: 'Seitennavigation',
  paginationRange: (from, to, total, itemLabel) => `${from} bis ${to} von ${total} ${itemLabel}`,
  consoleLog: 'Serverlog',
  consoleInput: 'Befehl',
  consoleJumpToEnd: 'Zum Ende',
  headerMenu: 'Menü',
  toastClose: 'Schließen',
  tableRegion: 'Tabelle, seitlich scrollbar',
} satisfies ZLabels;

/**
 * English equivalents of {@link Z_LABELS_DE}, complete and ready to hand to
 * {@link provideZenitLabels}.
 *
 * @example
 * ```ts
 * providers: [provideZenitLabels(Z_LABELS_EN)];
 * ```
 */
export const Z_LABELS_EN = {
  paginationPrev: 'Previous page',
  paginationNext: 'Next page',
  paginationNav: 'Pagination',
  paginationRange: (from, to, total, itemLabel) => `${from} to ${to} of ${total} ${itemLabel}`,
  consoleLog: 'Server log',
  consoleInput: 'Command',
  consoleJumpToEnd: 'Jump to end',
  headerMenu: 'Menu',
  toastClose: 'Close',
  tableRegion: 'Table, scrolls sideways',
} satisfies ZLabels;

/**
 * The label registry the components read. Without a provider it resolves to
 * {@link Z_LABELS_DE}.
 *
 * Provide it directly on a component to change the texts for that subtree
 * only, or application-wide through {@link provideZenitLabels}.
 *
 * @example
 * ```ts
 * @Component({
 *   providers: [{ provide: Z_LABELS, useValue: Z_LABELS_EN }],
 * })
 * ```
 */
export const Z_LABELS = new InjectionToken<ZLabels>('Z_LABELS', {
  providedIn: 'root',
  factory: () => Z_LABELS_DE,
});

/**
 * Overrides label defaults for the whole application. Keys that are left out
 * keep their German default, so a partial translation stays valid.
 *
 * @param labels The keys to replace.
 * @returns Providers for `bootstrapApplication` or a route's `providers`.
 *
 * @example
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [provideZenitLabels({ paginationPrev: 'Previous page' })],
 * });
 * ```
 */
export function provideZenitLabels(labels: Partial<ZLabels>): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: Z_LABELS, useValue: { ...Z_LABELS_DE, ...labels } }]);
}
