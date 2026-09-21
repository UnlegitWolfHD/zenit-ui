import { expect, test } from '@playwright/test';
import {
  pruefeAxe,
  pruefeFokusRing,
  pruefeKeinScrollen,
  pruefeKlickziele,
  pruefeStilRegeln,
  seiteOeffnen,
} from './pruefungen';

/**
 * Prüfung der Demo-App gegen "Abnahme je Route" (spec/guidelines/00-auftrag.md)
 * und die Abnahmepunkte A3, A4, A7, A9 aus docs/pakete.md.
 *
 * Die Tests laufen generisch über ROUTEN. Sie prüfen heute die Stubs und nach
 * dem Zusammenfügen ohne Änderung die gefüllten Seiten. Die Prüfungen selbst
 * stehen in `pruefungen.ts`, weil die Beispiel-App dieselben braucht.
 */
const ROUTEN = [
  'grundlage',
  'formulare',
  'navigation',
  'daten',
  'rueckmeldung',
  'overlays',
  'werkzeuge',
  'muster/dashboard',
  'muster/server-panel',
  'muster/startseite',
] as const;

/** Screenshot-Name: der Pfad ohne Schrägstrich, z. B. muster-dashboard. */
const bildname = (route: string) => route.replace(/\//g, '-');

for (const route of ROUTEN) {
  test.describe(route, () => {
    for (const breite of [1440, 375]) {
      test(`Screenshot ${breite}px`, async ({ page }) => {
        await seiteOeffnen(page, route, breite);
        await expect(page).toHaveScreenshot(`${bildname(route)}-${breite}.png`, { fullPage: true });
      });
    }

    test('axe ohne Verstöße', async ({ page }) => {
      await seiteOeffnen(page, route, 1440);
      await pruefeAxe(page, `/${route}`);
    });

    test('360px ohne horizontales Scrollen', async ({ page }) => {
      await seiteOeffnen(page, route, 360, 800);
      await pruefeKeinScrollen(page, `/${route}`);
    });

    test('Stil-Regeln im berechneten Style', async ({ page }) => {
      await seiteOeffnen(page, route, 1440);
      await pruefeStilRegeln(page, `/${route}`);
    });

    test('Fokus-Ring auf jedem Tab-Stopp', async ({ page }) => {
      await seiteOeffnen(page, route, 1440);
      await pruefeFokusRing(page, `/${route}`);
    });

    test('Klickziele bei 375px', async ({ page }) => {
      await seiteOeffnen(page, route, 375, 800);
      await pruefeKlickziele(page, `/${route}`);
    });
  });
}
