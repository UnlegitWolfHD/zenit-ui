import AxeBuilder from '@axe-core/playwright';
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
 * Prüfung des Pakets `konfigurator`: die drei neuen Routen gegen dieselben
 * Seitenprüfungen wie `demo.spec.ts`, dazu die Bedienung der neuen Bausteine
 * ausschließlich über die Tastatur.
 *
 * Eigener Port: `E2E_PORT=4540 npx playwright test e2e/konfigurator.spec.ts`.
 */
const ROUTEN = ['konfigurator', 'muster/server-erstellen', 'muster/preisrechner'] as const;

/** Screenshot-Name: der Pfad ohne Schrägstrich, z. B. muster-preisrechner. */
const bildname = (route: string) => route.replace(/\//g, '-');

/** Der Wizard steht links, die Zusammenfassung rechts; das Feld heißt so. */
const VERSIONSFELD = '#se-version';

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

test.describe('axe in allen Farbschemata', () => {
  for (const schema of ['light', 'contrast'] as const) {
    test(`/${'muster/server-erstellen'} in ${schema}`, async ({ page }) => {
      await seiteOeffnen(page, 'muster/server-erstellen', 1440);
      await page.selectOption('#theme-schema', schema);
      await expect(page.locator('html')).toHaveAttribute('data-theme', schema);
      await pruefeAxe(page, `/muster/server-erstellen (${schema})`);
    });
  }

  test('mit geöffneter Combobox', async ({ page }) => {
    await seiteOeffnen(page, 'konfigurator', 1440);
    await page.locator('#kf-version').focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.z-listbox')).toBeVisible();

    const ergebnis = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(
      ergebnis.violations.map((v) => `${v.id}: ${v.help}`),
      'axe-Verstöße bei offener Combobox',
    ).toEqual([]);
  });
});

test.describe('OptionCard mit der Tastatur', () => {
  test('Tab in die Gruppe, Pfeile wechseln, Tab verlässt sie', async ({ page }) => {
    await seiteOeffnen(page, 'konfigurator', 1440);
    const gruppe = page.locator('z-option-group').first();
    await gruppe.locator('input[type="radio"]:checked').focus();

    await expect(gruppe.locator('input:checked')).toHaveValue('vanilla');

    await page.keyboard.press('ArrowDown');
    await expect(gruppe.locator('input:checked')).toHaveValue('plugins');

    await page.keyboard.press('ArrowRight');
    await expect(gruppe.locator('input:checked')).toHaveValue('mods');

    await page.keyboard.press('ArrowUp');
    await expect(gruppe.locator('input:checked')).toHaveValue('plugins');

    // Ein Tab verlässt die ganze Gruppe, statt zur nächsten Karte zu gehen.
    await page.keyboard.press('Tab');
    const inGruppe = await page.evaluate(() =>
      document
        .querySelector('z-option-group')
        ?.contains(document.activeElement as Node | null),
    );
    expect(inGruppe).toBe(false);
  });

  test('eine zu kleine Stufe ist gesperrt und nennt den Grund', async ({ page }) => {
    await seiteOeffnen(page, 'konfigurator', 1440);
    const karte = page.locator('label.z-option').filter({ hasText: 'zu wenig für 1.21' }).first();

    await expect(karte.locator('input')).toBeDisabled();
    await expect(karte).toContainText('2 GB');
  });
});

test.describe('Combobox mit der Tastatur', () => {
  test('tippen, Pfeile, Enter, Escape, Leerzeile, Fokus bleibt im Feld', async ({ page }) => {
    await seiteOeffnen(page, 'konfigurator', 1440);
    const feld = page.locator('#kf-version');
    const liste = page.locator('.z-listbox');
    await feld.focus();

    await page.keyboard.press('ArrowDown');
    await expect(liste).toBeVisible();
    await expect(feld).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.z-listbox [role="group"]').first()).toHaveAttribute(
      'aria-label',
      'Aktuell',
    );

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(liste).toHaveCount(0);
    await expect(feld).toHaveValue('1.21.11');
    await expect(feld).toBeFocused();

    await feld.press('Control+a');
    await page.keyboard.type('1.20');
    await expect(page.locator('.z-listbox__option')).toHaveCount(2);
    await expect(feld).toBeFocused();

    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await expect(feld).toHaveValue('1.20.1');

    await feld.press('Control+a');
    await page.keyboard.type('gibt es nicht');
    await expect(page.locator('.z-listbox__option')).toHaveCount(0);
    await expect(page.locator('.z-listbox__empty')).toHaveText('Keine Version gefunden');

    await page.keyboard.press('Escape');
    await expect(liste).toHaveCount(0);
    // Escape schließt, leert aber nicht: der gewählte Wert steht wieder da.
    await expect(feld).toHaveValue('1.20.1');
    await expect(feld).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(feld).toHaveValue('1.20.1');
  });
});

test.describe('Server erstellen', () => {
  /** Klickt "Weiter" im offenen Schritt und wartet, bis der nächste offen ist. */
  async function weiter(page: Page, titel: string) {
    await page.locator('[aria-current="step"] .z-wstep__actions button').last().click();
    await expect(page.locator('[aria-current="step"] .z-wstep__title')).toHaveText(titel);
  }

  test('genau ein primary und eine gültige Vorgabe', async ({ page }) => {
    await seiteOeffnen(page, 'muster/server-erstellen', 1440);

    await expect(page.locator('.z-btn--primary')).toHaveCount(1);
    await expect(page.locator('.z-btn--primary')).toHaveText('Kostenpflichtig bestellen');
    await expect(page.locator('.z-btn--primary')).toBeDisabled();
    // Der Preis ist immer eine Zahl, nie ein Strich.
    await expect(page.locator('.z-summary__price')).toContainText('7,74 €');
  });

  test('Wizard bis zur Bestellung, Fokus folgt dem Inhalt', async ({ page }) => {
    await seiteOeffnen(page, 'muster/server-erstellen', 1440);

    await expect(page.locator('[aria-current="step"] .z-wstep__title')).toHaveText('Inhalt');
    await weiter(page, 'Größe');
    await expect(page.locator('[aria-current="step"] .z-wstep__title')).toBeFocused();
    await weiter(page, 'Bezahlen');
    await expect(page.locator('[aria-current="step"] .z-wstep__title')).toBeFocused();

    // Erledigte Schritte sind eingeklappt und zeigen ihre Kurzfassung.
    await expect(page.locator('z-wizard-step').first()).toHaveClass(/z-wstep--done/);
    await expect(page.locator('z-wizard-step').first().locator('.z-wstep__summary')).toHaveText(
      'Vanilla, Neueste',
    );

    await expect(page.locator('.z-btn--primary')).toBeDisabled();
    await expect(page.locator('.z-summary__note').first()).toHaveText(
      'Wähle noch eine Bezahlmethode',
    );

    const bezahlung = page.locator('z-option-group').filter({ hasText: 'Bezahlmethode' });
    await bezahlung.locator('input[value="paypal"]').focus();
    await page.keyboard.press('Space');
    await expect(page.locator('.z-btn--primary')).toBeEnabled();

    await page.locator('.z-btn--primary').click();
    await expect(page.locator('.z-toast')).toContainText('Beispiel: Bestellung ausgelöst');
  });

  test('"Ändern" öffnet Schritt 1 wieder', async ({ page }) => {
    await seiteOeffnen(page, 'muster/server-erstellen', 1440);
    await weiter(page, 'Größe');

    await page.locator('.z-wstep__edit').first().click();

    await expect(page.locator('[aria-current="step"] .z-wstep__title')).toHaveText('Inhalt');
    await expect(page.locator('[aria-current="step"] .z-wstep__title')).toBeFocused();
  });

  test('eine Version mit mehr Bedarf hebt den RAM sichtbar an', async ({ page }) => {
    await seiteOeffnen(page, 'muster/server-erstellen', 1440);
    const feld = page.locator(VERSIONSFELD);

    await feld.focus();
    await feld.press('Control+a');
    await page.keyboard.type('25w14a');
    await page.keyboard.press('Enter');

    await expect(feld).toHaveValue('25w14a');
    // Der Hinweis steht unter dem Feld, an dem die Änderung passiert ist.
    await expect(page.locator('#se-version-hint')).toHaveText(
      'Auf 6 GB angehoben, weil 25w14a das verlangt',
    );
    await expect(page).toHaveURL(/ram=6/);

    await weiter(page, 'Größe');
    const ram = page.locator('z-option-group').filter({ hasText: 'Arbeitsspeicher' });
    await expect(ram.locator('input:checked')).toHaveValue('6');
    await expect(ram.locator('input[value="4"]')).toBeDisabled();
    await expect(ram.locator('label.z-option').nth(1)).toContainText('zu wenig für 25w14a');
  });

  test('die Auswahl steht in der URL und übersteht ein Neuladen', async ({ page }) => {
    await seiteOeffnen(page, 'muster/server-erstellen', 1440);
    await weiter(page, 'Größe');

    const klasse = page.locator('z-option-group').filter({ hasText: 'Leistungsklasse' });
    await klasse.locator('input[value="budget"]').focus();
    await page.keyboard.press('Space');

    await expect(page).toHaveURL(/klasse=budget/);
    await expect(page).toHaveURL(/schritt=2/);
    await expect(page.locator('.z-summary__price')).toContainText('6,74 €');

    await page.reload();
    await page.locator('main h1').waitFor();

    await expect(page.locator('[aria-current="step"] .z-wstep__title')).toHaveText('Größe');
    await expect(
      page.locator('z-option-group').filter({ hasText: 'Leistungsklasse' }).locator('input:checked'),
    ).toHaveValue('budget');
  });

  test('ungültige Parameter fallen auf gültige Vorgaben zurück', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/muster/server-erstellen?typ=quatsch&version=9.9&ram=1&tage=7&schritt=9');
    await page.locator('main h1').waitFor();

    await expect(page.locator('[aria-current="step"] .z-wstep__title')).toHaveText('Inhalt');
    await expect(page.locator(VERSIONSFELD)).toHaveValue('Neueste');
    await expect(page.locator('.z-summary__price')).toContainText('7,74 €');
  });

  test('der Preisfehler-Schalter zeigt den Alert und sperrt die Bestellung', async ({ page }) => {
    await seiteOeffnen(page, 'muster/server-erstellen', 1440);
    await page.locator('.demo-steuerung input[role="switch"]').check();

    await expect(page.locator('.z-summary z-alert')).toHaveClass(/z-alert--danger/);
    await expect(page.locator('.z-summary z-alert')).toContainText(
      'Der Preis konnte nicht berechnet werden.',
    );
    await expect(page.locator('.z-summary z-alert button')).toHaveText('Erneut versuchen');
    await expect(page.locator('.z-btn--primary')).toBeDisabled();
    // Auch im Fehlerfall steht eine Zahl da, kein Strich.
    await expect(page.locator('.z-summary__price')).toContainText('7,74 €');
  });

  test('StickyBar nur unter 900px', async ({ page }) => {
    await seiteOeffnen(page, 'muster/server-erstellen', 1440);
    await expect(page.locator('z-sticky-bar')).toHaveCSS('display', 'none');

    await page.setViewportSize({ width: 375, height: 800 });
    await expect(page.locator('z-sticky-bar')).toBeVisible();
    await expect(page.locator('z-sticky-bar')).toContainText('7,74 €');
  });
});

test.describe('CostChart', () => {
  test('Pfeiltasten bewegen den Zeiger, die Tabelle klappt auf', async ({ page }) => {
    await seiteOeffnen(page, 'konfigurator', 1440);
    const plot = page.locator('.z-chart__plot');

    await plot.focus();
    await expect(plot).toHaveAttribute('aria-valuenow', '0');
    await expect(page.locator('.z-chart__tip')).toBeVisible();

    await page.keyboard.press('End');
    await expect(plot).toHaveAttribute('aria-valuenow', '150');
    await expect(plot).toHaveAttribute('aria-valuetext', '150 h gespielt: 10,30 €');

    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight');
    await expect(plot).toHaveAttribute('aria-valuenow', '5');
    await expect(page.locator('.z-chart__tip')).toContainText('5 h gespielt');

    // Der Tooltip bleibt in der Zeichenfläche.
    const innen = await page.evaluate(() => {
      const flaeche = document.querySelector('.z-chart__plot')!.getBoundingClientRect();
      const tip = document.querySelector('.z-chart__tip')!.getBoundingClientRect();
      return tip.left >= flaeche.left - 1 && tip.right <= flaeche.right + 1;
    });
    expect(innen).toBe(true);

    const tabelle = page.locator('.z-chart details');
    await expect(tabelle.locator('table')).toBeHidden();
    await tabelle.locator('summary').click();
    await expect(tabelle.locator('tbody tr')).toHaveCount(4);
    await expect(tabelle.locator('tbody tr').last()).toContainText('100 und mehr');
  });
});

test.describe('Preisrechner', () => {
  test('ein primary, Flex zeigt das Diagramm, der Button übergibt die Auswahl', async ({
    page,
  }) => {
    await seiteOeffnen(page, 'muster/preisrechner', 1440);

    await expect(page.locator('.z-btn--primary')).toHaveCount(1);
    await expect(page.locator('.z-btn--primary')).toHaveText('Server erstellen');
    await expect(page.locator('z-cost-chart')).toHaveCount(0);

    const abrechnung = page.locator('z-option-group').filter({ hasText: 'Abrechnung' });
    await abrechnung.locator('input[value="flex"]').focus();
    await page.keyboard.press('Space');

    await expect(page.locator('z-cost-chart')).toBeVisible();
    await expect(page.locator('.z-chart__figure').first()).toContainText('0,09 €');

    await page.locator('.z-btn--primary').click();
    await expect(page).toHaveURL(/muster\/server-erstellen\?.*ram=4/);
    await expect(page.locator('main h1')).toHaveText('Server erstellen');
  });
});
