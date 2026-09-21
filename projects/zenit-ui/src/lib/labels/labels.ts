import {
  EnvironmentProviders,
  InjectionToken,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';

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

  /** Visible label of the page size select in `z-pagination`. */
  paginationPageSize: string;

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

  /** Caption of the "Ändern" button on a finished step of `z-wizard-step`. */
  wizardEdit: string;

  /** The one line `z-combobox` shows when nothing matches and `emptyText` is empty. */
  comboboxEmpty: string;

  /**
   * How many entries are left after filtering in `z-combobox`, for the live
   * region that a screen reader hears while the list itself stays unseen.
   *
   * @param count Number of entries in the open panel, always 1 or more.
   * @returns The rendered sentence, for example `3 Treffer`.
   */
  comboboxResults: (count: number) => string;

  /** The row and the announcement of `z-combobox` while `loading` is set. */
  comboboxLoading: string;

  /**
   * The row of `z-combobox` that commits the typed text as the value, shown
   * with `allowCustom` when the text matches no entry.
   *
   * @param text What the visitor typed, trimmed.
   * @returns The rendered row, for example `„Hardware“ übernehmen`.
   */
  comboboxUseCustom: (text: string) => string;

  /**
   * The row of `z-combobox` that stands in for the list while the typed text
   * is shorter than `minQueryLength`.
   *
   * @param count The least number of characters, `minQueryLength`.
   * @returns The rendered row, for example `Mindestens 2 Zeichen eingeben`.
   */
  comboboxMinQuery: (count: number) => string;

  /** Caption of the retry button in `z-price-summary`, used when `retryLabel` is empty. */
  summaryRetry: string;

  /** `<title>` of the SVG in `z-cost-chart`, and the accessible name of the plot. */
  chartTitle: string;

  /**
   * `<desc>` of the SVG in `z-cost-chart`: the chart in one sentence.
   *
   * @param base Base amount per month.
   * @param rate Price per hour, unrounded.
   * @param cap Upper limit per month.
   * @param capHours Hour at which the cap takes over, rounded for display.
   * @returns The rendered sentence.
   */
  chartDesc: (base: number, rate: number, cap: number, capHours: number) => string;

  /**
   * `<desc>` of the SVG in `z-cost-chart` where no cap is reached on the axis:
   * a flat price per hour, or a cap past the last hour shown.
   *
   * @param base Base amount per month.
   * @param rate Price per hour, unrounded.
   * @returns The rendered sentence.
   */
  chartDescOpen: (base: number, rate: number) => string;

  /** Label of the first figure above the chart in `z-cost-chart`. */
  chartPerHour: string;

  /** Label of the second figure above the chart in `z-cost-chart`. */
  chartCapPerMonth: string;

  /**
   * An amount in `z-cost-chart`, in full: comma as the decimal mark, a
   * non-breaking space before the currency.
   *
   * @param value The amount.
   * @returns The rendered amount, for example `5,90 €`.
   */
  chartMoney: (value: number) => string;

  /**
   * An amount on the value axis of `z-cost-chart`, without the decimals.
   *
   * @param value The amount.
   * @returns The rendered tick, for example `10 €`.
   */
  chartAxisMoney: (value: number) => string;

  /**
   * An hour on the time axis of `z-cost-chart`.
   *
   * @param hours The hour.
   * @returns The rendered tick, for example `100 h`.
   */
  chartAxisHours: (hours: number) => string;

  /**
   * The direct label at the start of the line in `z-cost-chart`.
   *
   * @param base Base amount per month.
   * @returns The rendered label, for example `1,50 € Grundbetrag`.
   */
  chartBaseLabel: (base: number) => string;

  /**
   * The direct label at the point where the cap takes over in `z-cost-chart`.
   *
   * @param hours That hour, rounded for display.
   * @returns The rendered label, for example `ab 100 h gedeckelt`.
   */
  chartCapLabel: (hours: number) => string;

  /**
   * The hours in the tooltip and in `aria-valuetext` of `z-cost-chart`.
   *
   * @param hours The hour under the cursor.
   * @returns The rendered text, for example `50 h gespielt`.
   */
  chartPlayed: (hours: number) => string;

  /** Caption of the disclosure that holds the table in `z-cost-chart`. */
  chartTable: string;

  /** Header of the hours column in that table. */
  chartTableHours: string;

  /** Header of the cost column in that table. */
  chartTableCost: string;

  /**
   * The last row of that table, which stands for every hour from the cap on.
   *
   * @param hours The hour at which the cap takes over.
   * @returns The rendered cell, for example `100 und mehr`.
   */
  chartTableCapRow: (hours: number) => string;
}

/** German amount: comma as the decimal mark, non-breaking space before the currency. */
function euroDe(wert: number, stellen: number): string {
  return `${wert.toFixed(stellen).replace('.', ',')}\u00a0€`;
}

/** English amount: the currency in front, point as the decimal mark. */
function euroEn(wert: number, stellen: number): string {
  return `€${wert.toFixed(stellen)}`;
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
  paginationPageSize: 'Einträge pro Seite',
  consoleLog: 'Serverlog',
  consoleInput: 'Befehl',
  consoleJumpToEnd: 'Zum Ende',
  headerMenu: 'Menü',
  toastClose: 'Schließen',
  tableRegion: 'Tabelle, seitlich scrollbar',
  wizardEdit: 'Ändern',
  comboboxEmpty: 'Kein Treffer',
  comboboxResults: (count) => (count === 1 ? '1 Treffer' : `${count} Treffer`),
  comboboxLoading: 'Lädt',
  comboboxUseCustom: (text) => `„${text}“ übernehmen`,
  comboboxMinQuery: (count) => `Mindestens ${count} Zeichen eingeben`,
  summaryRetry: 'Erneut versuchen',
  chartTitle: 'Monatliche Kosten nach gespielten Stunden',
  chartDesc: (base, rate, cap, capHours) =>
    `Start bei ${euroDe(base, 2)} Grundbetrag, plus ${euroDe(rate, 2)} je Stunde, ` +
    `ab ${capHours} Stunden gedeckelt bei ${euroDe(cap, 2)}.`,
  chartDescOpen: (base, rate) =>
    `Start bei ${euroDe(base, 2)} Grundbetrag, plus ${euroDe(rate, 2)} je Stunde, ohne Deckel auf dieser Achse.`,
  chartPerHour: 'Pro Stunde',
  chartCapPerMonth: 'Höchstens im Monat',
  chartMoney: (value) => euroDe(value, 2),
  chartAxisMoney: (value) => euroDe(value, 0),
  chartAxisHours: (hours) => `${hours}\u00a0h`,
  chartBaseLabel: (base) => `${euroDe(base, 2)} Grundbetrag`,
  chartCapLabel: (hours) => `ab ${hours}\u00a0h gedeckelt`,
  chartPlayed: (hours) => `${hours}\u00a0h gespielt`,
  chartTable: 'Als Tabelle',
  chartTableHours: 'Gespielte Stunden',
  chartTableCost: 'Kosten im Monat',
  chartTableCapRow: (hours) => `${hours} und mehr`,
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
  paginationPageSize: 'Items per page',
  consoleLog: 'Server log',
  consoleInput: 'Command',
  consoleJumpToEnd: 'Jump to end',
  headerMenu: 'Menu',
  toastClose: 'Close',
  tableRegion: 'Table, scrollable horizontally',
  wizardEdit: 'Change',
  comboboxEmpty: 'No match',
  comboboxResults: (count) => (count === 1 ? '1 result' : `${count} results`),
  comboboxLoading: 'Loading',
  comboboxUseCustom: (text) => `Use “${text}”`,
  comboboxMinQuery: (count) => `Type at least ${count} characters`,
  summaryRetry: 'Try again',
  chartTitle: 'Monthly cost by hours played',
  chartDesc: (base, rate, cap, capHours) =>
    `Starts at ${euroEn(base, 2)} base, plus ${euroEn(rate, 2)} per hour, ` +
    `capped at ${euroEn(cap, 2)} from ${capHours} hours on.`,
  chartDescOpen: (base, rate) =>
    `Starts at ${euroEn(base, 2)} base, plus ${euroEn(rate, 2)} per hour, with no cap on this axis.`,
  chartPerHour: 'Per hour',
  chartCapPerMonth: 'At most per month',
  chartMoney: (value) => euroEn(value, 2),
  chartAxisMoney: (value) => euroEn(value, 0),
  chartAxisHours: (hours) => `${hours}\u00a0h`,
  chartBaseLabel: (base) => `${euroEn(base, 2)} base`,
  chartCapLabel: (hours) => `capped from ${hours}\u00a0h`,
  chartPlayed: (hours) => `${hours}\u00a0h played`,
  chartTable: 'As a table',
  chartTableHours: 'Hours played',
  chartTableCost: 'Cost per month',
  chartTableCapRow: (hours) => `${hours} and more`,
} satisfies ZLabels;

/**
 * The label registry the components read. Without a provider it resolves to
 * {@link Z_LABELS_DE}.
 *
 * Provide it directly on a component to change the texts for that subtree
 * only, or through {@link provideZenitLabels} for the application or a route.
 * Read it with {@link injectZLabels}, not with `inject(Z_LABELS)`: a provider
 * written by hand may be incomplete, and only the function fills the gaps.
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
 * Overrides label defaults, for the whole application or for a route. Keys
 * that are left out keep the value of the enclosing injector: a route that
 * overrides one key inside an English application stays English otherwise.
 * Without an enclosing provider they keep their German default, so a partial
 * translation stays valid.
 *
 * **Two calls in the same `providers` array do not stack.** The factory reads
 * the enclosing injector with `skipSelf`, and both calls sit in the same
 * injector, so the second one never sees the first: it merges over the parent,
 * which at the root is `Z_LABELS_DE`. `[provideZenitLabels(Z_LABELS_EN),
 * provideZenitLabels({ tableRegion: 'Invoices, scrollable' })]` therefore gives
 * German labels with one English key, not English with one override. Stacking
 * only works across injectors: application root, then a route.
 *
 * For "English plus one override" make it one call with a spread.
 *
 * @param labels The keys to replace.
 * @returns Providers for `bootstrapApplication` or a route's `providers`.
 *
 * @example
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [
 *     // One call, one object: English everywhere, one key of our own.
 *     provideZenitLabels({ ...Z_LABELS_EN, tableRegion: 'Invoices, scrollable' }),
 *   ],
 * });
 * ```
 */
export function provideZenitLabels(labels: Partial<ZLabels>): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: Z_LABELS,
      useFactory: (): ZLabels => ({
        ...(inject(Z_LABELS, { skipSelf: true, optional: true }) ?? Z_LABELS_DE),
        ...labels,
      }),
    },
  ]);
}

/**
 * Reads the label registry of the current injector, complete. This is what the
 * components of the library call, and what your own components should call.
 *
 * `{ provide: Z_LABELS, useValue: { toastClose: 'Close' } }` compiles when the
 * value is cast or comes from JSON, and would leave every other key
 * `undefined`: an icon-only button without `aria-label`, a `TypeError` for
 * `paginationRange`. The function therefore lays the provided value over
 * {@link Z_LABELS_DE}. Call it in an injection context.
 *
 * @returns Every key of {@link ZLabels}, the German default where the provider has none.
 *
 * @example
 * ```ts
 * export class Pager {
 *   private readonly labels = injectZLabels();
 * }
 * ```
 */
export function injectZLabels(): ZLabels {
  return { ...Z_LABELS_DE, ...inject(Z_LABELS) };
}
