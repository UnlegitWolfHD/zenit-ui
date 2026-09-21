import { QUELLTEXTE } from './quelltexte.generated';

/**
 * Access to the real sources of this application. `quelltexte.generated.ts` is
 * written by `tools/generate-example-snippets.mjs` from the files themselves,
 * so what the page shows cannot drift from what the page does; the check mode
 * of that script fails the build when it does.
 */

/**
 * The keys of `quelltexte.generated.ts`, which are the paths of the files in
 * the repository. Named here once, so no template carries a path string.
 */
export const DATEI = {
  index: 'projects/beispiel-app/src/index.html',
  styles: 'projects/beispiel-app/src/styles.css',
  main: 'projects/beispiel-app/src/main.ts',
  appConfig: 'projects/beispiel-app/src/app/app.config.ts',
  routen: 'projects/beispiel-app/src/app/app.routes.ts',
  shell: 'projects/beispiel-app/src/app/layout/shell/shell.ts',
  themeControl: 'projects/beispiel-app/src/app/layout/theme-control/theme-control.ts',
  seite: 'projects/beispiel-app/src/app/pages/gameserver/gameserver.ts',
  daten: 'projects/beispiel-app/src/app/gameserver/gameserver-data.ts',
  liste: 'projects/beispiel-app/src/app/gameserver/server-list/server-list.ts',
  tsconfig: 'projects/beispiel-app/tsconfig.app.json',
  angular: 'angular.json (Auszug)',
} as const;

/** Start of a marked region, for example `<!-- #region filterzeile -->`. */
const START = '#region ';

/** End of any region, in whatever comment syntax the file uses. */
const ENDE = '#endregion';

/**
 * Cuts the region {@link region} out of {@link quelle} and removes the marker
 * lines and the common indentation.
 *
 * A marker is a line that contains `#region <name>` or `#endregion`, in the
 * comment syntax of the file: `// #region`, `<!-- #region -->` or
 * `/* #region *\/`. Comparing plain text instead of a regular expression keeps
 * region names free of escaping rules.
 *
 * @param quelle Whole file.
 * @param region Name behind `#region`.
 * @returns The lines between the markers, without leading or trailing empty
 * lines. An unknown region gives an empty string; the unit test of this file
 * checks every region the application actually shows.
 */
export function ausschnitt(quelle: string, region: string): string {
  const zeilen = quelle.replace(/\r\n/g, '\n').split('\n');
  const start = zeilen.findIndex((zeile) => zeile.includes(START + region));
  if (start < 0) {
    return '';
  }
  // Regions nest: the row of the list sits inside the block of all states.
  // Counting the depth keeps the inner code and ends the outer region at its
  // own marker instead of at the first one that comes along.
  const block: string[] = [];
  let tiefe = 1;
  for (const zeile of zeilen.slice(start + 1)) {
    if (zeile.includes(START)) {
      tiefe++;
    } else if (zeile.includes(ENDE)) {
      tiefe--;
      if (tiefe === 0) {
        break;
      }
    } else {
      block.push(zeile);
    }
  }
  return ausrichten(block);
}

/**
 * Removes the indentation the block carries only because of where it sits in
 * its file, plus the empty lines at both ends.
 */
function ausrichten(zeilen: readonly string[]): string {
  const einzug = zeilen
    .filter((zeile) => zeile.trim().length > 0)
    .reduce((kleinster, zeile) => Math.min(kleinster, zeile.length - zeile.trimStart().length), 80);
  return zeilen
    .map((zeile) => zeile.slice(Math.min(einzug, zeile.length - zeile.trimStart().length)))
    .join('\n')
    .replace(/^\n+|\s+$/g, '');
}

/**
 * The text of one file, or of one region inside it.
 *
 * @param datei Key from `quelltexte.generated.ts`, which is the path of the
 * file in the repository.
 * @param region Optional name of a `#region` inside that file.
 */
export function quelltext(datei: string, region?: string): string {
  const quelle = QUELLTEXTE[datei] ?? '';
  if (region) {
    return ausschnitt(quelle, region);
  }
  // A whole file drops its markers as well: they organise the display, they are
  // not part of what the reader has to copy.
  return quelle
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((zeile) => !zeile.includes(START) && !zeile.includes(ENDE))
    .join('\n')
    .replace(/\s+$/, '');
}
