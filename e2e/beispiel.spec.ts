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
 * Zustand der Seite "Gameserver" und je Farbschema, dazu die Seite
 * "Einbindung", die Code-Anzeige und die Interaktionen (Toast nach dem
 * Neustart, Dialog vor dem Löschen, Theme-Umschalter).
 *
 * Läuft über playwright.beispiel.config.ts, weil die App auf einem eigenen
 * Port steht und gegen dist/zenit-ui gebaut wird.
 */
const ZUSTAENDE = ['normal', 'laden', 'leer', 'fehler'] as const;
type Zustand = (typeof ZUSTAENDE)[number];

/** Die beiden Schemata neben dem voreingestellten dunklen. */
const SCHEMATA = ['light', 'contrast'] as const;

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

/**
 * Legt die Wahl ab, die `provideZenitTheme` beim Start liest. Muss vor dem
 * ersten `goto` stehen; prüft nebenbei, dass die Speicherung wirklich greift.
 */
async function schemaVorgeben(page: Page, schema: string): Promise<void> {
  await page.addInitScript(
    (wert) => {
      window.localStorage.setItem('zenit-theme', wert);
    },
    JSON.stringify({ scheme: schema, accent: 'rot' }),
  );
}

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

/*
 * Die Schemata aus themes.css ändern jeden Farbwert, also werden Kontrast,
 * Fokus-Ring und die Stil-Regeln je Schema neu gemessen. Der dunkle Fall
 * steckt schon in den Läufen oben.
 */
for (const schema of SCHEMATA) {
  test.describe(`normal in ${schema}`, () => {
    test.beforeEach(async ({ page }) => {
      await schemaVorgeben(page, schema);
    });

    test('Screenshot 1440px', async ({ page }) => {
      await beispielOeffnen(page, 'normal', 1440);
      await expect(page.locator('html')).toHaveAttribute('data-theme', schema);
      await expect(page).toHaveScreenshot(`beispiel-normal-${schema}-1440.png`, { fullPage: true });
    });

    test('axe ohne Verstöße', async ({ page }) => {
      await beispielOeffnen(page, 'normal', 1440);
      await pruefeAxe(page, `/gameserver (${schema})`);
    });

    test('Stil-Regeln im berechneten Style', async ({ page }) => {
      await beispielOeffnen(page, 'normal', 1440);
      await pruefeStilRegeln(page, `/gameserver (${schema})`);
    });

    test('Fokus-Ring auf jedem Tab-Stopp', async ({ page }) => {
      await beispielOeffnen(page, 'normal', 1440);
      await pruefeFokusRing(page, `/gameserver (${schema})`);
    });
  });
}

test.describe('einbindung', () => {
  /** Die Seite ist fertig, sobald der erste Codeblock steht. */
  async function einbindungOeffnen(page: Page, breite: number, hoehe = 900) {
    await seiteOeffnen(page, 'einbindung', breite, hoehe);
    await page.locator('.app-code__text').first().waitFor();
  }

  for (const breite of [1440, 375]) {
    test(`Screenshot ${breite}px`, async ({ page }) => {
      await einbindungOeffnen(page, breite);
      await expect(page).toHaveScreenshot(`beispiel-einbindung-${breite}.png`, { fullPage: true });
    });
  }

  test('axe ohne Verstöße', async ({ page }) => {
    await einbindungOeffnen(page, 1440);
    await pruefeAxe(page, '/einbindung');
  });

  test('360px ohne horizontales Scrollen', async ({ page }) => {
    await einbindungOeffnen(page, 360, 800);
    await pruefeKeinScrollen(page, '/einbindung');
  });

  test('Stil-Regeln im berechneten Style', async ({ page }) => {
    await einbindungOeffnen(page, 1440);
    await pruefeStilRegeln(page, '/einbindung');
  });

  test('Fokus-Ring auf jedem Tab-Stopp', async ({ page }) => {
    await einbindungOeffnen(page, 1440);
    await pruefeFokusRing(page, '/einbindung');
  });

  test('Klickziele bei 375px', async ({ page }) => {
    await einbindungOeffnen(page, 375, 800);
    await pruefeKlickziele(page, '/einbindung');
  });

  test('zeigt den echten Quelltext der Anwendung', async ({ page }) => {
    await einbindungOeffnen(page, 1440);

    // Anker aus den echten Dateien: tsconfig, angular.json und app.config.ts.
    await expect(page.locator('.app-code__text').first()).toContainText('dist/zenit-ui');
    await expect(
      page.locator('.app-code__text', { hasText: 'dist/zenit-ui/styles/themes.css' }),
    ).toHaveCount(1);
    await expect(
      page.locator('.app-code__text', {
        hasText: "provideZenitTheme({ defaultScheme: 'system' })",
      }),
    ).toHaveCount(1);
  });
});

test.describe('Code-Anzeige auf der Gameserver-Seite', () => {
  /** Klappt die erste Offenlegung auf; sie ist beim Laden zu. */
  async function offenlegungOeffnen(page: Page, breite: number) {
    await beispielOeffnen(page, 'normal', breite);
    const offenlegung = page.locator('details.app-code-faq').first();
    await expect(offenlegung).not.toHaveAttribute('open', /.*/);
    await offenlegung.locator('summary').click();
    await expect(offenlegung.locator('.app-code__text')).toBeVisible();
    return offenlegung;
  }

  for (const breite of [1440, 375]) {
    test(`Screenshot mit offenem Code ${breite}px`, async ({ page }) => {
      await offenlegungOeffnen(page, breite);
      await expect(page).toHaveScreenshot(`beispiel-code-offen-${breite}.png`, { fullPage: true });
    });
  }

  test('kopiert den Code und meldet es als Toast', async ({ page }) => {
    const offenlegung = await offenlegungOeffnen(page, 1440);

    await offenlegung.getByRole('button', { name: /kopieren/ }).click();

    await expect(page.locator('.z-toast')).toHaveText(/Code kopiert/);
  });
});

test.describe('Theme-Umschalter', () => {
  test('setzt das Schema und merkt es sich über den Neuladen hinaus', async ({ page }) => {
    await beispielOeffnen(page, 'normal', 1440);

    await page.getByRole('button', { name: /Farbschema wählen/ }).click();
    await page.getByRole('menuitem', { name: 'Hell' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.getByRole('button', { name: /Akzentfarbe wählen/ }).click();
    await page.getByRole('menuitem', { name: 'Blau' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-accent', 'blau');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('html')).toHaveAttribute('data-accent', 'blau');
  });
});

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
