import { expect, test, type Locator, type Page } from '@playwright/test';
import { pruefeAxe } from './pruefungen';

/**
 * Overlays inside a scrolling container: the long dialog on /overlays.
 *
 * Measured in a real browser, because none of it exists in jsdom: the panel
 * height, the scrolling body, the tooltip and the menu that have to answer a
 * scroll of that body, and the footer that must never leave the screen.
 *
 * Run:
 *   E2E_PORT=4650 npx playwright test e2e/overlays-scroll.spec.ts
 */

/** The two sizes of the acceptance: a short laptop and a phone. */
const SICHTEN = [
  { name: '1440x700', breite: 1440, hoehe: 700 },
  { name: '375x667', breite: 375, hoehe: 667 },
] as const;

const OEFFNEN = 'Langen Dialog öffnen';

// The page also shows a static copy of the dialog, so every part is read
// inside the open one.
const karte = (page: Page) => page.getByRole('dialog').locator('.z-dialog');
const rumpf = (page: Page) => page.getByRole('dialog').locator('.z-dialog__body');
const kopf = (page: Page) => page.getByRole('dialog').locator('.z-dialog__header');
const fuss = (page: Page) => page.getByRole('dialog').locator('.z-dialog__footer');

async function seite(page: Page, route: string, breite: number, hoehe: number): Promise<void> {
  await page.setViewportSize({ width: breite, height: hoehe });
  await page.goto(`/${route}`);
  await page.locator('main h1').first().waitFor();
  await page.evaluate(() => document.fonts.ready.then(() => true));
}

async function langerDialog(page: Page, breite: number, hoehe: number): Promise<void> {
  await seite(page, 'overlays', breite, hoehe);
  await page.getByRole('button', { name: OEFFNEN }).click();
  await page.getByRole('dialog').waitFor();
}

/** Box of an element, failing loudly instead of returning null. */
async function kasten(
  ziel: Locator,
): Promise<{ x: number; y: number; width: number; height: number }> {
  const box = await ziel.boundingBox();
  expect(box, 'das Element steht im Layout').not.toBeNull();
  return box!;
}

/** Scrolls the body of the dialog and waits until the scroll has landed. */
async function rumpfScrollen(page: Page, weite = 400): Promise<number> {
  const stand = await rumpf(page).evaluate((el, w) => {
    el.scrollTop = w;
    return el.scrollTop;
  }, weite);
  expect(stand, 'der Rumpf lässt sich scrollen').toBeGreaterThan(0);
  return stand;
}

for (const sicht of SICHTEN) {
  test.describe(`long dialog at ${sicht.name}`, () => {
    test('the dialog fits the viewport and only its body scrolls', async ({ page }) => {
      await langerDialog(page, sicht.breite, sicht.hoehe);

      const flaeche = await kasten(karte(page));
      expect(flaeche.y, 'der Dialog beginnt im Sichtfeld').toBeGreaterThanOrEqual(0);
      expect(
        flaeche.y + flaeche.height,
        `der Dialog endet im Sichtfeld (${sicht.hoehe}px)`,
      ).toBeLessThanOrEqual(sicht.hoehe + 1);

      const masse = await rumpf(page).evaluate((el) => ({
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
      }));
      expect(
        masse.scrollHeight,
        'das Formular ist länger als der Rumpf, der Rumpf scrollt also wirklich',
      ).toBeGreaterThan(masse.clientHeight);

      const kopfVorher = await kasten(kopf(page));
      const fussVorher = await kasten(fuss(page));
      await rumpfScrollen(page);
      expect(await kasten(kopf(page)), 'der Kopf bleibt stehen').toEqual(kopfVorher);
      expect(await kasten(fuss(page)), 'die Fußzeile bleibt stehen').toEqual(fussVorher);
      expect(
        fussVorher.y + fussVorher.height,
        'die Fußzeile steht im Sichtfeld',
      ).toBeLessThanOrEqual(sicht.hoehe + 1);
    });

    test('the last field is reachable by Tab and visible, the footer stays clickable', async ({
      page,
    }) => {
      await langerDialog(page, sicht.breite, sicht.hoehe);
      const letztes = page.getByRole('textbox', { name: 'Startbefehl' });

      // Tab from the first field down to the last one, the way a person fills
      // the form in. 30 steps are more than the dialog has stops.
      for (let schritt = 0; schritt < 30 && !(await letztes.evaluate(istFokussiert)); schritt++) {
        await page.keyboard.press('Tab');
      }
      await expect(letztes).toBeFocused();

      const feld = await kasten(letztes);
      const sichtbar = await rumpf(page).evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom };
      });
      expect(
        feld.y,
        'das fokussierte Feld steht im sichtbaren Teil des Rumpfs',
      ).toBeGreaterThanOrEqual(sichtbar.top - 1);
      expect(feld.y + feld.height, 'und endet darin').toBeLessThanOrEqual(sichtbar.bottom + 1);

      // The footer is not covered by the scrolled body: the point in the middle
      // of the confirming button really belongs to that button.
      const knopf = page.getByRole('button', { name: 'Server anlegen' });
      const box = await kasten(knopf);
      const getroffen = await page.evaluate(
        ([x, y]) => document.elementFromPoint(x, y)?.textContent?.trim() ?? '',
        [box.x + box.width / 2, box.y + box.height / 2] as const,
      );
      expect(getroffen, 'die Fußzeile liegt über dem Rumpf').toContain('Server anlegen');
    });

    test('a tooltip in the body goes on scroll, a menu in the body closes', async ({ page }) => {
      await langerDialog(page, sicht.breite, sicht.hoehe);

      const hinweis = page.getByRole('button', { name: 'Hinweis zur Welt' });
      await hinweis.hover();
      await expect(page.getByRole('tooltip')).toBeVisible();
      await rumpfScrollen(page, 200);
      await expect(page.getByRole('tooltip'), 'der Tooltip verschwindet beim Scrollen').toHaveCount(
        0,
      );

      await rumpf(page).evaluate((el) => (el.scrollTop = 0));
      const menuKnopf = page.getByRole('button', { name: 'Aktionen für Welt 1' });
      await menuKnopf.click();
      await expect(page.getByRole('menu')).toBeVisible();
      await rumpfScrollen(page, 200);
      await expect(page.getByRole('menu'), 'das Menü schließt beim Scrollen').toHaveCount(0);
      await expect(menuKnopf, 'der Fokus steht wieder auf dem Auslöser').toBeFocused();
      await expect(page.getByRole('dialog'), 'der Dialog bleibt offen').toBeVisible();
    });

    test('Escape closes the long dialog and focus returns to the trigger', async ({ page }) => {
      await langerDialog(page, sicht.breite, sicht.hoehe);
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(page.getByRole('button', { name: OEFFNEN })).toBeFocused();
      await expect(page.getByText('Langer Dialog: Abgebrochen')).toBeVisible();
    });
  });
}

/** Runs in the browser: is this element the active one? */
function istFokussiert(el: Element): boolean {
  return document.activeElement === el;
}

test.describe('page scroll', () => {
  test('a tooltip goes when the page scrolls under it', async ({ page }) => {
    await seite(page, 'rueckmeldung', 1440, 700);
    const knopf = page.getByRole('button', { name: 'Aktualisieren' }).first();
    await knopf.hover();
    await expect(page.getByRole('tooltip')).toBeVisible();

    // Upwards: hovering has already scrolled the button into view near the
    // bottom of the page, where a downward wheel would move nothing.
    await page.mouse.wheel(0, -300);
    await expect(page.getByRole('tooltip')).toHaveCount(0);
  });

  test('the row menu closes when the page scrolls under it', async ({ page }) => {
    await seite(page, 'muster/server-panel', 1440, 700);
    await page.getByRole('button', { name: 'Weitere Aktionen' }).first().click();
    await expect(page.getByRole('menu')).toBeVisible();

    await page.mouse.wheel(0, 300);
    await expect(page.getByRole('menu')).toHaveCount(0);
  });
});

test.describe('colour schemes', () => {
  for (const schema of ['dark', 'light', 'contrast'] as const) {
    test(`axe finds nothing in the open long dialog (${schema})`, async ({ page }) => {
      await page.addInitScript(
        (wert) => window.localStorage.setItem('zenit-theme', wert),
        JSON.stringify({ scheme: schema, accent: 'rot' }),
      );
      await langerDialog(page, 1440, 700);
      await pruefeAxe(page, `/overlays, langer Dialog, ${schema}`);
    });
  }
});
