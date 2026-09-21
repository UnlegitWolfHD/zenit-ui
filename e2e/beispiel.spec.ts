import { expect, test, type Page } from '@playwright/test';
import {
  pruefeAxe,
  pruefeFokusRing,
  pruefeKeinScrollen,
  pruefeKlickziele,
  pruefeStilRegeln,
  seiteOeffnen,
} from './pruefungen';

/**
 * Prüfung der Beispiel-App: dieselben Regeln wie für die Demo-App, einmal je
 * Zustand der Seite "Gameserver", dazu zwei Interaktionen (Toast nach dem
 * Neustart, Dialog vor dem Löschen).
 *
 * Läuft über playwright.beispiel.config.ts, weil die App auf einem eigenen
 * Port steht und gegen dist/zenit-ui gebaut wird.
 */
const ZUSTAENDE = ['normal', 'laden', 'leer', 'fehler'] as const;
type Zustand = (typeof ZUSTAENDE)[number];

/** Der Normalfall braucht keinen Parameter, die anderen Zustände holt `?zustand=`. */
const route = (zustand: Zustand) =>
  zustand === 'normal' ? 'gameserver' : `gameserver?zustand=${zustand}`;

/** Der Baustein, an dem der Zustand zu erkennen ist. */
const BAUSTEIN: Record<Zustand, string> = {
  normal: '.z-row__title',
  laden: '.z-skel',
  leer: '.z-empty',
  fehler: '.z-alert',
};

/** Öffnet die Seite und wartet, bis der simulierte Ladevorgang durch ist. */
async function beispielOeffnen(page: Page, zustand: Zustand, breite: number, hoehe = 900) {
  await seiteOeffnen(page, route(zustand), breite, hoehe);
  await page.locator(BAUSTEIN[zustand]).first().waitFor();
}

for (const zustand of ZUSTAENDE) {
  test.describe(zustand, () => {
    for (const breite of [1440, 375]) {
      test(`Screenshot ${breite}px`, async ({ page }) => {
        await beispielOeffnen(page, zustand, breite);
        await expect(page).toHaveScreenshot(`beispiel-${zustand}-${breite}.png`, {
          fullPage: true,
        });
      });
    }

    test('axe ohne Verstöße', async ({ page }) => {
      await beispielOeffnen(page, zustand, 1440);
      await pruefeAxe(page, `/${route(zustand)}`);
    });

    test('360px ohne horizontales Scrollen', async ({ page }) => {
      await beispielOeffnen(page, zustand, 360, 800);
      await pruefeKeinScrollen(page, `/${route(zustand)}`);
    });

    test('Stil-Regeln im berechneten Style', async ({ page }) => {
      await beispielOeffnen(page, zustand, 1440);
      await pruefeStilRegeln(page, `/${route(zustand)}`);
    });

    test('Fokus-Ring auf jedem Tab-Stopp', async ({ page }) => {
      await beispielOeffnen(page, zustand, 1440);
      await pruefeFokusRing(page, `/${route(zustand)}`);
    });

    test('Klickziele bei 375px', async ({ page }) => {
      await beispielOeffnen(page, zustand, 375, 800);
      await pruefeKlickziele(page, `/${route(zustand)}`);
    });
  });
}

test.describe('Aktionen einer Zeile', () => {
  /** Das Mehr-Menü der ersten Zeile, ein eigener Tab-Stopp neben der Zeile. */
  const menueKnopf = (page: Page) =>
    page.getByRole('button', { name: 'Weitere Aktionen für Beispiel-Server 1' });

  test('Neustart meldet sich als Toast', async ({ page }) => {
    await beispielOeffnen(page, 'normal', 1440);

    await menueKnopf(page).click();
    await page.getByRole('menuitem', { name: 'Neustart' }).click();

    const toast = page.locator('.z-toast');
    await expect(toast).toHaveText(/Neustart für Beispiel-Server 1 gestartet/);
    // Kein Alert: eine flüchtige Rückmeldung ist ein Toast (Toast README).
    await expect(page.locator('.z-alert')).toHaveCount(0);
  });

  test('Löschen fragt nach dem Servernamen und gibt den Fokus zurück', async ({ page }) => {
    await beispielOeffnen(page, 'normal', 1440);

    await menueKnopf(page).click();
    await page.getByRole('menuitem', { name: 'Server löschen' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Server "Beispiel-Server 1" löschen?');
    const bestaetigen = dialog.getByRole('button', { name: 'Löschen', exact: true });
    await expect(bestaetigen).toBeDisabled();

    // Ein falscher Name reicht nicht, erst der genaue Name gibt frei.
    const feld = dialog.getByRole('textbox');
    await feld.fill('Beispiel-Server');
    await expect(bestaetigen).toBeDisabled();
    await feld.fill('Beispiel-Server 1');
    await expect(bestaetigen).toBeEnabled();

    await dialog.getByRole('button', { name: 'Abbrechen' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    // Der Fokus kehrt zum Auslöser zurück, der Server steht noch in der Liste.
    await expect(menueKnopf(page)).toBeFocused();
    await expect(page.locator('.z-row__title').first()).toHaveText('Beispiel-Server 1');
  });
});
