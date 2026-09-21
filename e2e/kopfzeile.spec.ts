import { expect, test, type Page } from '@playwright/test';
import { pruefeAxe, pruefeKeinScrollen, seiteOeffnen } from './pruefungen';

/**
 * The header below 900px with an image logo and the end slots of the first
 * integration, measured on /muster/kopfzeile (docs/components/app-header.md,
 * "Brand and end slot on small screens").
 *
 * Before the change the bar with "Login" and "Registrieren" measured 126px at
 * 360 and 375px, because the end slot dropped onto a second row, and 62px
 * everywhere else, because the inline image made the brand 45px tall.
 *
 * Run on a port of its own:
 *   E2E_PORT=4692 npx playwright test e2e/kopfzeile.spec.ts
 */
const ROUTE = 'muster/kopfzeile';
const BREITEN = [360, 375, 412, 899];
const EINZEILIG = ['abgemeldet', 'angemeldet', 'kunde', 'ladend'];
/** padding-block space-2 twice, a 40px control, the 1px line below. */
const EINE_ZEILE = 57;
/** The same with two 40px controls and the space-3 gap between them. */
const ZWEI_ZEILEN = 109;

function messen(page: Page, kopf: string) {
  return page.evaluate((name) => {
    const leiste = document.querySelector(`[data-kopf="${name}"]`);
    if (!leiste) throw new Error(name);
    const box = (sel: string) => {
      const r = leiste.querySelector(sel)!.getBoundingClientRect();
      return { links: r.left, rechts: r.right, mitte: r.top + r.height / 2, hoehe: r.height };
    };
    const r = leiste.getBoundingClientRect();
    return {
      breite: r.width,
      hoehe: r.height,
      mitte: r.top + r.height / 2 - 0.5,
      brand: box('.z-header__brand'),
      ende: box('.z-header__end'),
      menu: box('.z-header__menu'),
    };
  }, kopf);
}

for (const breite of BREITEN) {
  test(`${breite}px: one row of ${EINE_ZEILE}px for every end slot of the first integration`, async ({
    page,
  }) => {
    await seiteOeffnen(page, ROUTE, breite);
    for (const kopf of EINZEILIG) {
      const m = await messen(page, kopf);
      // The page has to measure a real header, edge to edge.
      expect(m.breite, `${kopf}: width of the bar`).toBe(breite);
      expect(m.hoehe, `${kopf}: height of the bar`).toBe(EINE_ZEILE);
      expect(m.brand.hoehe, `${kopf}: a 40px image makes a 40px brand`).toBe(40);
      // Logo, end slot, menu button, from left to right on one line.
      expect(m.brand.rechts, `${kopf}: brand before end slot`).toBeLessThanOrEqual(m.ende.links);
      expect(m.ende.rechts, `${kopf}: end slot before menu button`).toBeLessThanOrEqual(
        m.menu.links,
      );
      for (const teil of [m.brand, m.ende, m.menu]) {
        expect(Math.abs(teil.mitte - m.mitte), `${kopf}: centred on the row`).toBeLessThan(1);
      }
    }
    await pruefeKeinScrollen(page, `${ROUTE} at ${breite}px`);
  });
}

test('two buttons that do not fit stack inside the end slot, the bar does not wrap', async ({
  page,
}) => {
  for (const breite of BREITEN) {
    await seiteOeffnen(page, ROUTE, breite);
    const m = await messen(page, 'zweizeilig');
    expect(m.hoehe, `${breite}px`).toBe(breite < 410 ? ZWEI_ZEILEN : EINE_ZEILE);
    expect(m.brand.rechts).toBeLessThanOrEqual(m.ende.links);
    expect(m.ende.rechts).toBeLessThanOrEqual(m.menu.links);
    expect(Math.abs(m.brand.mitte - m.mitte), 'logo centred').toBeLessThan(1);
    expect(Math.abs(m.menu.mitte - m.mitte), 'menu button centred').toBeLessThan(1);
  }
});

test('360px: menu button, open header links and end slot controls are 40px tall', async ({
  page,
}) => {
  await seiteOeffnen(page, ROUTE, 360);
  const knopf = page.locator('[data-kopf="kunde"] .z-header__menu');
  await knopf.click();
  await expect(knopf).toHaveAttribute('aria-expanded', 'true');
  const hoehen = await page.evaluate(() =>
    Array.from(
      document.querySelectorAll(
        '[data-kopf="kunde"] :is(.z-header__menu, .z-header__link, .z-header__end .z-btn)',
      ),
    ).map((el) => el.getBoundingClientRect().height),
  );
  // Menu button, six links, the balance link and the account button.
  expect(hoehen).toEqual(Array(9).fill(40));
});

test('axe finds nothing on the page', async ({ page }) => {
  await seiteOeffnen(page, ROUTE, 375);
  await pruefeAxe(page, ROUTE);
});
