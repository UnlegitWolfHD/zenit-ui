import { expect, test, type Page } from '@playwright/test';
import { pruefeAxe, seiteOeffnen } from './pruefungen';

/**
 * Native input types and the colour scheme the browser draws them in.
 *
 * `color-scheme` decides the palette of everything a page cannot style itself:
 * the popup of a `<select>`, the calendar and clock popups, their indicators,
 * the spin buttons of a number field, scrollbars and autofill. The default
 * lives in the base styles (`_grundlage.css`, `:where(:root)`), so an
 * application that only ships `tokens.css` and `zenit-ui.css` gets it too; the
 * scheme files override it at a higher specificity. This spec checks the half
 * that only a browser can answer.
 *
 * Run with its own port, so a foreign `ng serve` does not interfere:
 *   E2E_PORT=4641 npx playwright test e2e/native-eingaben.spec.ts
 */
const SCHEMATA = ['dark', 'light', 'contrast'] as const;
/** The key and the format ZTheme writes to localStorage. */
const SPEICHER = 'zenit-theme';

/** Sets the stored choice before the application starts, as an earlier visit would have. */
async function wahlSetzen(page: Page, scheme: string) {
  await page.addInitScript(([schluessel, wert]) => window.localStorage.setItem(schluessel, wert), [
    SPEICHER,
    JSON.stringify({ scheme, accent: 'rot' }),
  ] as const);
}

/** Resolved value of a token, read from the running page instead of hard-coded. */
async function token(page: Page, name: string): Promise<string> {
  return page.evaluate((eigenschaft) => {
    const probe = document.createElement('div');
    probe.style.cssText = `position:absolute;display:block;width:var(${eigenschaft})`;
    document.body.appendChild(probe);
    const wert = getComputedStyle(probe).width;
    probe.remove();
    return wert;
  }, name);
}

const farbschema = (page: Page, waehler: string) =>
  page.evaluate((sel) => {
    const el = sel === 'html' ? document.documentElement : document.querySelector(sel);
    return el ? getComputedStyle(el).colorScheme : 'kein Element';
  }, waehler);

test('dark is the colour scheme of the native controls without a stored theme', async ({
  page,
}) => {
  await seiteOeffnen(page, 'grundlage', 1440);

  expect(await farbschema(page, 'html'), 'color-scheme am html').toBe('dark');
  // The controls inherit it; that is what the popup and the indicator follow.
  expect(await farbschema(page, 'select#sel-status'), 'color-scheme am select').toBe('dark');
  expect(await farbschema(page, 'input#in-date'), 'color-scheme am Datumsfeld').toBe('dark');
});

test('the light scheme turns the native controls light', async ({ page }) => {
  await wahlSetzen(page, 'light');
  await seiteOeffnen(page, 'grundlage', 1440);

  expect(await farbschema(page, 'html'), 'color-scheme am html').toBe('light');
  expect(await farbschema(page, 'select#sel-status'), 'color-scheme am select').toBe('light');
  expect(await farbschema(page, 'input#in-date'), 'color-scheme am Datumsfeld').toBe('light');
});

test('the contrast scheme stays dark', async ({ page }) => {
  await wahlSetzen(page, 'contrast');
  await seiteOeffnen(page, 'grundlage', 1440);

  expect(await farbschema(page, 'html'), 'color-scheme am html').toBe('dark');
});

test('the date field has the field height and a visible focus ring', async ({ page }) => {
  await seiteOeffnen(page, 'grundlage', 1440);
  const datum = page.getByLabel('Gültig bis');

  const hoehe = (await datum.boundingBox())?.height;
  expect(String(hoehe) + 'px', 'Datumsfeld nicht so hoch wie --control-md').toBe(
    await token(page, '--control-md'),
  );

  await datum.focus();
  const ring = await datum.evaluate((el) => {
    const st = getComputedStyle(el);
    return { breite: st.outlineWidth, stil: st.outlineStyle, farbe: st.outlineColor };
  });
  const fokus = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--focus)';
    document.body.appendChild(probe);
    const farbe = getComputedStyle(probe).color;
    probe.remove();
    return farbe;
  });
  expect(ring.stil, 'Datumsfeld ohne Fokus-Ring').not.toBe('none');
  expect(parseFloat(ring.breite), 'Fokus-Ring schmaler als 2px').toBeGreaterThanOrEqual(2);
  expect(ring.farbe, 'Fokus-Ring nicht in --focus').toBe(fokus);
});

test('the date field in error carries the danger frame and the sentence', async ({ page }) => {
  await seiteOeffnen(page, 'grundlage', 1440);
  const datum = page.getByLabel('Kündigung zum');

  await expect(datum).toHaveAttribute('aria-invalid', 'true');
  const beschrieben = await datum.getAttribute('aria-describedby');
  expect(beschrieben, 'aria-describedby fehlt').toBeTruthy();
  await expect(page.locator(`#${beschrieben}`)).toHaveText(
    'Das Datum liegt in der Vergangenheit. Wähle ein Datum ab dem 22.09.2026.',
  );
  // The value of a date field is an ISO string, never a Date.
  expect(await datum.inputValue()).toBe('2026-09-01');
});

for (const schema of SCHEMATA) {
  test(`axe is clean on /grundlage in the ${schema} scheme`, async ({ page }) => {
    await wahlSetzen(page, schema);
    await seiteOeffnen(page, 'grundlage', 1440);
    await pruefeAxe(page, `Grundlage (${schema})`);
  });
}
