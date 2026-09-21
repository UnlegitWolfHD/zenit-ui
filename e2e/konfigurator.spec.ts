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

/** Geschütztes Leerzeichen, wie es die Seite vor Einheit und Währung setzt. */
const NB = '\u00a0';

/** Screenshot-Name: der Pfad ohne Schrägstrich, z. B. muster-preisrechner. */
const bildname = (route: string) => route.replace(/\//g, '-');

/** Der Wizard steht links, die Zusammenfassung rechts; das Feld heißt so. */
const VERSIONSFELD = '#se-version';

/**
 * Wählt eine Karte einer OptionCard-Gruppe über die Tastatur. Das Radio ist
 * unsichtbar (opacity 0, pointer-events none), geklickt wird sonst die Karte;
 * fokussieren und Leertaste ist der Weg, den auch eine Tastatur nimmt.
 */
async function waehleKarte(page: Page, gruppe: string, wert: string) {
  const feld = page
    .locator('z-option-group')
    .filter({ hasText: gruppe })
    .locator(`input[value="${wert}"]`);
  await feld.focus();
  await page.keyboard.press('Space');
  await expect(feld).toBeChecked();
}

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

/** axe mit den WCAG-Tags auf der offenen Seite, ohne sie neu zu laden. */
async function axeHier(page: Page, name: string) {
  const ergebnis = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(
    ergebnis.violations.map((v) => `${v.id} (${v.impact}): ${v.help}`),
    `axe-Verstöße ${name}`,
  ).toEqual([]);
}

test.describe('axe in allen Farbschemata', () => {
  for (const route of ROUTEN) {
    for (const schema of ['light', 'contrast'] as const) {
      test(`/${route} in ${schema}`, async ({ page }) => {
        await seiteOeffnen(page, route, 1440);
        await page.selectOption('#theme-schema', schema);
        await expect(page.locator('html')).toHaveAttribute('data-theme', schema);
        await axeHier(page, `/${route} (${schema})`);
      });
    }
  }
});

test.describe('axe in den geöffneten Zuständen', () => {
  test('Combobox offen, Disclosure offen, Tabelle offen', async ({ page }) => {
    await seiteOeffnen(page, 'konfigurator', 1440);
    await page.locator('.z-chart details summary').click();
    await page.locator('#kf-version').focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.z-listbox')).toBeVisible();

    await axeHier(page, '/konfigurator mit offener Combobox');
  });

  test('Zusammenfassung in allen Zuständen', async ({ page }) => {
    await seiteOeffnen(page, 'konfigurator', 1440);

    // Die Galerie zeigt lädt, Fehler, unvollständig und Rabatt nebeneinander.
    await expect(page.locator('.z-summary__price--pending')).toHaveCount(1);
    await expect(page.locator('.z-summary z-alert')).toHaveCount(1);
    await expect(page.locator('.z-summary__total')).toHaveCount(1);
    await axeHier(page, '/konfigurator mit allen Zusammenfassungs-Zuständen');
  });

  test('Schritt 2 und Schritt 3 des Wizards', async ({ page }) => {
    for (const schritt of [2, 3]) {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/muster/server-erstellen?schritt=${schritt}&bezahlung=paypal`);
      await page.locator('main h1').waitFor();
      await expect(page.locator('[aria-current="step"] .z-step__num')).toHaveText(String(schritt));
      await axeHier(page, `/muster/server-erstellen Schritt ${schritt}`);
    }
  });

  test('Preisrechner mit Flex und Diagramm', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/muster/preisrechner?abrechnung=flex');
    await page.locator('main h1').waitFor();
    await expect(page.locator('z-cost-chart')).toBeVisible();
    await axeHier(page, '/muster/preisrechner mit Flex');
  });
});

test.describe('Fokus wird nirgends verdeckt', () => {
  /**
   * Geht durch alle Tab-Stopps und prüft, dass die StickyBar keinen davon
   * verdeckt (WCAG 2.4.11). Gemessen wird die KARTE, nicht das versteckte
   * Radio darin: der Browser scrollt die fokussierte Box in den Sichtbereich,
   * und was der Nutzer sieht, ist die Karte. Mitte und Unterkante, weil ein
   * halb verdecktes Ziel auch verdeckt ist.
   */
  async function verdeckteStopps(page: Page): Promise<string[]> {
    const verdeckt: string[] = [];
    const gesehen = new Set<string>();
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    for (let schritt = 0; schritt < 140; schritt++) {
      await page.keyboard.press('Tab');
      const fund = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        // Ein verstecktes Radio steht für seine Karte.
        const sichtbar =
          el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'radio'
            ? ((el.closest('label') as HTMLElement) ?? el)
            : el;
        const kasten = sichtbar.getBoundingClientRect();
        const name = (sichtbar.textContent || el.getAttribute('aria-label') || el.tagName)
          .trim()
          .replace(/\s+/g, ' ')
          .slice(0, 40);
        const schluessel = `${sichtbar.tagName}.${sichtbar.className}:${name}`;
        if (kasten.width < 2 || kasten.height < 2) {
          return { schluessel, name, verdeckt: false };
        }
        const leiste = document.querySelector('z-sticky-bar');
        const trifftLeiste = (y: number) => {
          const punkt = document.elementFromPoint(
            Math.round(kasten.left + kasten.width / 2),
            Math.round(y),
          );
          return !!leiste && !!punkt && leiste.contains(punkt) && !leiste.contains(sichtbar);
        };
        return {
          schluessel,
          name,
          verdeckt: trifftLeiste(kasten.top + kasten.height / 2) || trifftLeiste(kasten.bottom - 2),
        };
      });
      if (!fund) break;
      if (gesehen.has(fund.schluessel)) break;
      gesehen.add(fund.schluessel);
      if (fund.verdeckt) verdeckt.push(fund.name);
    }
    expect(gesehen.size, 'kein Tab-Stopp gefunden').toBeGreaterThan(5);
    return verdeckt;
  }

  const SEITEN = [
    { route: 'muster/server-erstellen', suche: '?schritt=1' },
    { route: 'muster/server-erstellen', suche: '?schritt=2' },
    { route: 'muster/server-erstellen', suche: '?schritt=3&bezahlung=paypal' },
    { route: 'muster/preisrechner', suche: '?abrechnung=flex' },
  ] as const;

  for (const hoehe of [600, 667, 740]) {
    for (const seite of SEITEN) {
      test(`/${seite.route}${seite.suche} bei 375x${hoehe}`, async ({ page }) => {
        await page.setViewportSize({ width: 375, height: hoehe });
        await page.goto(`/${seite.route}${seite.suche}`);
        await page.locator('main h1').waitFor();
        await page.evaluate(() => document.fonts.ready.then(() => true));
        await expect(page.locator('z-sticky-bar')).toBeVisible();

        expect(
          await verdeckteStopps(page),
          `/${seite.route}${seite.suche}: Fokus hinter der StickyBar (WCAG 2.4.11)`,
        ).toEqual([]);
      });
    }
  }
});

test.describe('OptionCard mit der Tastatur', () => {
  test('Tab in die Gruppe, Pfeile wechseln, Tab verlässt sie', async ({ page }) => {
    await seiteOeffnen(page, 'konfigurator', 1440);
    const gruppe = page.locator('z-option-group').first();

    // Mit Tab in die Gruppe, nicht mit focus(): genau das ist die Prüfung.
    await page.locator('.z-skip-link').focus();
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      const drin = await page.evaluate(() =>
        document.querySelector('z-option-group')?.contains(document.activeElement as Node | null),
      );
      if (drin) break;
    }
    await expect(gruppe.locator('input:checked')).toBeFocused();
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
      document.querySelector('z-option-group')?.contains(document.activeElement as Node | null),
    );
    expect(inGruppe).toBe(false);
  });

  test('der Text einer Karte liegt über dem Radio, der Klick wählt trotzdem', async ({ page }) => {
    await seiteOeffnen(page, 'konfigurator', 1440);
    const karte = page.locator('label.z-option').filter({ hasText: 'Plugins' }).first();
    const titel = karte.locator('.z-option__title');

    // Das unsichtbare Radio liegt über der ganzen Karte. Ohne eigene
    // Positionierung der Texte fängt es jeden Zeiger ab, und in einer
    // freigeschalteten Karte lässt sich kein Wort mehr mit der Maus markieren.
    const obenauf = await titel.evaluate((el) => {
      const kasten = el.getBoundingClientRect();
      return (
        document.elementFromPoint(
          kasten.left + kasten.width / 2,
          kasten.top + kasten.height / 2,
        ) === el
      );
    });
    expect(obenauf).toBe(true);

    await titel.click();
    await expect(karte.locator('input')).toBeChecked();
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

    // Auch hier über die Tastatur hinein, damit der Weg mitgeprüft wird.
    await page.locator('#kf-version').evaluate((el: HTMLElement) => {
      const vorher = el.previousElementSibling as HTMLElement | null;
      (vorher ?? el).scrollIntoView({ block: 'center' });
    });
    await page.locator('z-combobox').first().locator('input').focus();
    await expect(feld).toBeFocused();

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

test.describe('Combobox beim Scrollen', () => {
  test('das Panel schließt, wenn das Feld aus dem Bild scrollt', async ({ page }) => {
    await seiteOeffnen(page, 'konfigurator', 1440, 700);
    const feld = page.locator('#kf-version');
    await feld.scrollIntoViewIfNeeded();
    await feld.focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.z-listbox')).toBeVisible();

    await page.evaluate(() => window.scrollBy(0, 1600));
    await page.waitForTimeout(150);

    // Weder offen noch irgendwo allein in der Seite stehend.
    await expect(page.locator('.z-listbox')).toHaveCount(0);
    await expect(feld).toHaveAttribute('aria-expanded', 'false');
  });
});

test.describe('Combobox im Dialog', () => {
  test('die Liste folgt dem Feld und schließt, wenn es aus dem Dialog scrollt', async ({
    page,
  }) => {
    await seiteOeffnen(page, 'konfigurator', 375, 600);
    await page.getByRole('button', { name: 'Server anpassen', exact: true }).click();
    const dialog = page.locator('.z-dialog');
    await expect(dialog).toBeVisible();

    // Ohne wirklich scrollbaren Dialog prüft der Test nichts.
    expect(await dialog.evaluate((el) => el.scrollHeight - el.clientHeight)).toBeGreaterThan(20);

    const feld = page.locator('#kd-version');
    await feld.focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.z-listbox')).toBeVisible();

    // Ein innerer Container: der ScrollDispatcher des CDK hört ihn nicht,
    // der Capture-Horcher der Combobox schon. Ein Stück gescrollt, bleibt das
    // Feld im Dialog: die Liste geht mit, statt stehen zu bleiben.
    const obenVorher = await page.locator('.z-listbox').evaluate((el) => {
      return el.getBoundingClientRect().top;
    });
    await dialog.evaluate((el) => {
      el.scrollTop = 60;
    });
    await expect
      .poll(() => page.locator('.z-listbox').evaluate((el) => el.getBoundingClientRect().top))
      .toBeLessThan(obenVorher - 40);
    await expect(page.locator('.z-listbox')).toBeVisible();

    // Bis ans Ende gescrollt, ist das Feld aus dem Dialog heraus: jetzt gibt es
    // nichts mehr, worauf die Liste zeigen könnte.
    await dialog.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });

    await expect(page.locator('.z-listbox')).toHaveCount(0);
    await expect(feld).toHaveAttribute('aria-expanded', 'false');
  });
});

test.describe('Server erstellen', () => {
  /**
   * Geht mit Tab bis zum "Weiter" des offenen Schritts und löst es mit Enter
   * aus. Keine Maus, kein `.click()`: der Wizard wird so bedient, wie ihn eine
   * Tastatur bedient.
   */
  async function weiter(page: Page, titel: string) {
    const ziel = page.locator('[aria-current="step"] .z-wstep__actions button').last();
    const beschriftung = (await ziel.textContent())?.trim();
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press('Tab');
      const drauf = await page.evaluate(
        (text) => (document.activeElement?.textContent || '').trim() === text,
        beschriftung,
      );
      if (drauf) break;
    }
    await expect(ziel).toBeFocused();
    await page.keyboard.press('Enter');
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

  test('Wizard bis zur Bestellung, nur mit der Tastatur', async ({ page }) => {
    await seiteOeffnen(page, 'muster/server-erstellen', 1440);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

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

    // Auch der Bestell-Button wird ertastet und mit Enter ausgelöst.
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press('Tab');
      if (await page.locator('.z-btn--primary').evaluate((el) => el === document.activeElement)) {
        break;
      }
    }
    await expect(page.locator('.z-btn--primary')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('.z-toast')).toContainText('Beispiel: Bestellung ausgelöst');
  });

  test('"Ändern" öffnet Schritt 1 wieder', async ({ page }) => {
    await seiteOeffnen(page, 'muster/server-erstellen', 1440);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await weiter(page, 'Größe');

    await page.locator('.z-wstep__edit').first().focus();
    await page.keyboard.press('Enter');

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
      page
        .locator('z-option-group')
        .filter({ hasText: 'Leistungsklasse' })
        .locator('input:checked'),
    ).toHaveValue('budget');
  });

  test('ein Anheben aus der URL sagt genauso, dass es passiert ist', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/muster/server-erstellen?ram=2&version=25w14a');
    await page.locator('main h1').waitFor();

    // Der Link fragt 2 GB, die Version verlangt 6: der Wert springt sichtbar,
    // und der Satz unter dem Feld sagt warum. Stumm wäre er falsch.
    await expect(page.locator('#se-version-hint')).toHaveText(
      'Auf 6\u00a0GB angehoben, weil 25w14a das verlangt',
    );
    await expect(page).toHaveURL(/ram=6/);
  });

  test('die Übergabe aus dem Rechner hebt sichtbar an', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/muster/preisrechner?klasse=budget&ram=2&tage=90&spiel=Valheim');
    await page.locator('main h1').waitFor();
    const vorher = await page.locator('.z-summary__price').textContent();

    await page.locator('.z-btn--primary').click();
    await page.locator('main h1').waitFor();

    await expect(page.locator('main h1')).toHaveText('Server erstellen');
    await expect(page.locator('#se-version-hint')).toContainText('angehoben');
    // Der Preis darf sich ändern, aber nicht schweigend.
    expect((await page.locator('.z-summary__price').textContent())?.trim()).not.toBe(
      vorher?.trim(),
    );
  });

  test('ein anderes Spiel sagt in EINEM Alert, was übernommen wurde', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/muster/server-erstellen?spiel=Valheim&ram=8&klasse=budget');
    await page.locator('main h1').waitFor();

    await expect(page.locator('z-alert')).toHaveCount(1);
    await expect(page.locator('z-alert')).toHaveClass(/z-alert--info/);
    await expect(page.locator('z-alert')).toContainText('Valheim');
    await expect(page.locator('z-alert')).toContainText('8\u00a0GB');
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

  test('der Bestell-Button wartet auf einen bestätigten Preis', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/muster/server-erstellen?schritt=3&bezahlung=paypal');
    await page.locator('main h1').waitFor();
    await expect(page.locator('.z-btn--primary')).toBeEnabled();
    const bestaetigt = (await page.locator('.z-summary__price').textContent())?.trim();

    // Eine Laufzeitänderung stößt die Neuberechnung an.
    await waehleKarte(page, 'Laufzeit', '180');

    // Während sie läuft: gesperrt, und die letzte bestätigte Zahl steht da.
    await expect(page.locator('.z-summary__price--pending')).toBeVisible();
    await expect(page.locator('.z-btn--primary')).toBeDisabled();
    expect((await page.locator('.z-summary__price').textContent())?.trim()).toContain(
      bestaetigt ?? '',
    );

    await expect(page.locator('.z-summary__price--pending')).toHaveCount(0);
    await expect(page.locator('.z-btn--primary')).toBeEnabled();
    await expect(page.locator('.z-summary__price')).toContainText('42,26\u00a0€');
  });

  test('nach einem Preisfehler bleibt die Bestellung gesperrt, bis der Preis steht', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/muster/server-erstellen?schritt=3&bezahlung=paypal');
    await page.locator('main h1').waitFor();
    await page.locator('.demo-steuerung input[role="switch"]').check();
    await expect(page.locator('.z-summary z-alert')).toBeVisible();

    await page.locator('.z-summary z-alert button').click();

    // "Erneut versuchen" rechnet neu: solange das läuft, ist nichts bestellbar.
    await expect(page.locator('.z-btn--primary')).toBeDisabled();
  });

  test('die Posten ergeben genau die Summe', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/muster/server-erstellen?schritt=3&tage=90&bezahlung=paypal');
    await page.locator('main h1').waitFor();
    await page.locator('#se-input-action-1, .z-input-action .z-input').first().fill('ZENIT10');
    await page.locator('.z-input-action button').click();
    await expect(page.locator('.z-field__success')).toContainText('ZENIT10');
    await expect(page.locator('.z-summary__price--pending')).toHaveCount(0);

    const zahlen = await page.evaluate(() => {
      const betrag = (text: string) =>
        Number(
          text
            .replace(/[^\d,.-]/g, '')
            .replace('\u2212', '-')
            .replace(',', '.'),
        );
      const zeilen = Array.from(document.querySelectorAll('.z-summary__line'));
      const posten = zeilen
        .map((z) => z.querySelector('dd')?.textContent?.trim() ?? '')
        .filter((t) => t.includes('\u20ac'));
      const summe = document.querySelector('.z-summary__total dd')?.textContent?.trim();
      return { posten: posten.map(betrag), summe: betrag(summe ?? '0') };
    });

    const [preis, rabatt, gutschein] = zahlen.posten;
    expect(Math.round((preis - rabatt - gutschein) * 100) / 100).toBe(zahlen.summe);
  });

  test('Flex sperrt Laufzeit und Gutschein und sagt jeweils warum', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/muster/server-erstellen?schritt=3&bezahlung=paypal&abrechnung=flex');
    await page.locator('main h1').waitFor();

    const laufzeit = page
      .locator('z-option-group')
      .filter({ has: page.locator('legend', { hasText: 'Laufzeit' }) });
    await expect(laufzeit.locator('.z-options__legend small')).toHaveText(
      'Flex wird nach Stunden abgerechnet, es gibt keine Laufzeit.',
    );
    await expect(laufzeit.locator('input')).toHaveCount(3);
    await expect(laufzeit.locator('input:disabled')).toHaveCount(3);
    // Kein Preis auf einer Karte, die nichts kostet.
    await expect(laufzeit.locator('.z-option__price')).toHaveCount(0);

    const gutschein = page.locator('z-input-action');
    await expect(gutschein.locator('input')).toBeDisabled();
    await expect(gutschein.locator('.z-field__error')).toHaveText(
      'Für Flex gilt kein Gutschein. Wechsle zu Monatspreis, um den Code einzulösen.',
    );
  });

  test('ein eingelöster Gutschein verschwindet mit dem Wechsel zu Flex', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/muster/server-erstellen?schritt=3&bezahlung=paypal');
    await page.locator('main h1').waitFor();
    await page.locator('.z-input-action .z-input').fill('ZENIT10');
    await page.locator('.z-input-action button').click();
    await expect(page.locator('.z-field__success')).toContainText('ZENIT10');
    await expect(page.locator('.z-summary')).toContainText('Gutschein ZENIT10');

    await waehleKarte(page, 'Abrechnung', 'flex');

    // Weder der Satz am Feld noch die Zeile in der Zusammenfassung dürfen
    // einen Rabatt behaupten, den der Preis nicht mehr hat.
    await expect(page.locator('.z-field__success')).toHaveText('');
    await expect(page.locator('.z-summary')).not.toContainText('Gutschein');
  });

  test('die Leiste nennt Flex und den Zeitraum, aus demselben Stand wie die Summe', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/muster/server-erstellen?schritt=3&bezahlung=paypal');
    await page.locator('main h1').waitFor();
    const leiste = page.locator('z-sticky-bar');

    await expect(leiste.locator('small')).toHaveText(
      `Minecraft, 4${NB}GB, Normal, alle 30${NB}Tage`,
    );

    await waehleKarte(page, 'Abrechnung', 'flex');

    // Während der Neuberechnung gehören Preis und Text weiter zusammen:
    // beide zeigen den alten Stand, nicht den neuen Text zum alten Preis.
    await expect(page.locator('.z-summary__price--pending')).toBeVisible();
    await expect(leiste).toContainText(`7,74${NB}€`);
    await expect(leiste.locator('small')).toHaveText(
      `Minecraft, 4${NB}GB, Normal, alle 30${NB}Tage`,
    );

    await expect(page.locator('.z-summary__price--pending')).toHaveCount(0);
    await expect(leiste).toContainText(`10,32${NB}€`);
    await expect(leiste.locator('small')).toHaveText(
      `Minecraft, 4${NB}GB, Normal, Flex, höchstens je 30${NB}Tage`,
    );
    // Dieselbe Aussage wie im Kopf der Zusammenfassung.
    await expect(page.locator('.z-summary__price small')).toHaveText(`höchstens je 30${NB}Tage`);
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

test.describe('CostChart bei 360px', () => {
  test('der Achsentext steht wirklich in 12px da', async ({ page }) => {
    await seiteOeffnen(page, 'konfigurator', 360, 800);

    const mass = await page.evaluate(() => {
      const svg = document.querySelector('.z-chart svg') as SVGSVGElement;
      const kasten = svg.getBoundingClientRect();
      const box = svg.viewBox.baseVal;
      const text = svg.querySelector('.z-chart__axis') as SVGTextElement;
      return {
        skalierung: kasten.width / box.width,
        groesse: parseFloat(getComputedStyle(text).fontSize),
        hoehe: text.getBBox().height,
        ticks: svg.querySelectorAll('.z-chart__axis').length,
      };
    });

    // Ein viewBox aus der gemessenen Breite: eine Einheit ist ein Pixel.
    expect(Math.abs(mass.skalierung - 1)).toBeLessThan(0.02);
    expect(mass.groesse).toBe(12);
    expect(mass.hoehe * mass.skalierung).toBeGreaterThanOrEqual(11);
    // Weniger Ticks als bei 1440px, sonst kleben die Beschriftungen aneinander.
    expect(mass.ticks).toBeLessThanOrEqual(8);
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
    await expect(page).toHaveURL(/spiel=/);
    await expect(page.locator('main h1')).toHaveText('Server erstellen');
  });

  test('die Auswahl steht in der URL und übersteht ein Neuladen', async ({ page }) => {
    await seiteOeffnen(page, 'muster/preisrechner', 1440);
    await waehleKarte(page, 'Arbeitsspeicher', '8');

    await expect(page).toHaveURL(/ram=8/);

    await page.reload();
    await page.locator('main h1').waitFor();

    await expect(
      page
        .locator('z-option-group')
        .filter({ hasText: 'Arbeitsspeicher' })
        .locator('input:checked'),
    ).toHaveValue('8');
  });

  test('eine Einheit auf der ganzen Seite: Tage', async ({ page }) => {
    await seiteOeffnen(page, 'muster/preisrechner', 1440);

    const text = (await page.locator('main').textContent()) ?? '';
    expect(text).not.toContain('/ Monat');
    expect(text).not.toContain('im Monat');
    await expect(page.locator('.z-game__price').first()).toContainText('Tage');
  });

  test('der "ab"-Preis der Kachel ist die kleinste bestellbare Kombination', async ({ page }) => {
    await seiteOeffnen(page, 'muster/preisrechner', 1440);
    const kachel = page.locator('button[zGameTile]').first();
    const abPreis = (await kachel.locator('.z-game__price').textContent())?.trim();

    await kachel.click();
    await waehleKarte(page, 'Leistungsklasse', 'budget');
    await waehleKarte(page, 'Arbeitsspeicher', '2');

    // Der Betrag der Kachel muss genau der Summe dieser Auswahl entsprechen.
    const betrag = (abPreis ?? '').replace('ab', '').split('/')[0].trim();
    await expect(page.locator('.z-summary__price')).toContainText(betrag);
    await expect(page.locator('.z-summary__price')).toContainText('30\u00a0Tage');
  });
});
