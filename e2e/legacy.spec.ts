import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { ALTLAST_CSS, ALTLAST_HTML } from '../projects/ui-demo/src/app/pages/muster/legacy-altlast';
import { pruefeKeinScrollen, seiteOeffnen } from './pruefungen';

/**
 * `.z-legacy`, the class for a subtree that is not migrated yet
 * (docs/legacy.md), measured on /muster/legacy.
 *
 * The reference for "as before" is not an expectation written down here but a
 * second document: the same old stylesheet and the same markup, loaded without
 * a single rule of zenit-ui. Whatever that document computes, the island
 * inside `.z-legacy` has to compute as well.
 *
 * Run on a port of its own:
 *   E2E_PORT=4692 npx playwright test e2e/legacy.spec.ts
 */
const ROUTE = 'muster/legacy';
const SCHEMATA = ['dark', 'light', 'contrast'] as const;

/** Everything that does not depend on the width of the container. */
const EIGENSCHAFTEN = [
  'fontSize',
  'lineHeight',
  'fontFamily',
  'fontWeight',
  'fontStyle',
  'letterSpacing',
  'color',
  'textDecorationLine',
  'textDecorationColor',
  'textDecorationStyle',
  'textUnderlineOffset',
  'backgroundColor',
  'boxSizing',
  'display',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'borderTopWidth',
  'borderTopStyle',
  'borderTopColor',
  'borderTopLeftRadius',
  'outlineStyle',
  'outlineWidth',
  'outlineColor',
  'outlineOffset',
  'opacity',
  'cursor',
  'webkitFontSmoothing',
] as const;

async function schemaSetzen(page: Page, scheme: string) {
  await page.addInitScript(
    (wert) => window.localStorage.setItem('zenit-theme', wert),
    JSON.stringify({ scheme, accent: 'rot' }),
  );
}

/** Computed styles of every element below `wurzel`, in document order. */
function lesen(page: Page, wurzel: string, nur = '*') {
  return page.evaluate(
    ([wurzelSel, nurSel, eigenschaften]) => {
      const start = document.querySelector(wurzelSel);
      if (!start) throw new Error(`not found: ${wurzelSel}`);
      return Array.from(start.querySelectorAll(nurSel)).map((el) => {
        const stil = getComputedStyle(el) as unknown as Record<string, string>;
        const name = el.nodeName.toLowerCase() + (el.className ? `.${el.className}` : '');
        return [name, ...eigenschaften.map((e) => `${e}: ${stil[e]}`)].join('\n');
      });
    },
    [wurzel, nur, EIGENSCHAFTEN] as const,
  );
}

/** Resting state, the link hovered, the field focused, the button reached with Tab. */
async function altlastLesen(page: Page, wurzel: string) {
  const ruhe = await lesen(page, wurzel, '[data-alt]');
  await page.locator(`${wurzel} [data-alt="a"]`).hover();
  const hover = await lesen(page, wurzel, '[data-alt="a"]');
  await page.locator(`${wurzel} [data-alt="input"]`).focus();
  const fokusFeld = await lesen(page, wurzel, '[data-alt="input"]');
  await page.keyboard.press('Tab');
  const fokusKnopf = await lesen(page, wurzel, '[data-alt="button"]');
  await page.mouse.move(0, 0);
  return { ruhe, hover, fokusFeld, fokusKnopf };
}

for (const schema of SCHEMATA) {
  test(`${schema}: the old page inside .z-legacy computes as it does without zenit-ui`, async ({
    page,
    context,
  }) => {
    await schemaSetzen(page, schema);
    await seiteOeffnen(page, ROUTE, 375);
    const insel = await altlastLesen(page, '[data-legacy="insel"]');

    // The reference: no zenit-ui, the old body rule on <body>.
    const nackt = await context.newPage();
    await nackt.setViewportSize({ width: 375, height: 900 });
    await nackt.setContent(
      `<!doctype html><html lang="de"><head><style>${ALTLAST_CSS}</style></head>` +
        `<body class="demo-alt"><main>${ALTLAST_HTML}</main></body></html>`,
    );
    const referenz = await altlastLesen(nackt, 'main');

    expect(referenz.ruhe).toHaveLength(7);
    expect(insel).toEqual(referenz);

    // What the first integration measured as broken, spelled out once: the
    // h2 carries no line height of its own and must not get the shell's 20px.
    const h2 = insel.ruhe.find((e) => e.startsWith('h2'));
    expect(h2).toContain('fontSize: 27.2px');
    expect(h2).toContain('lineHeight: normal');
  });

  test(`${schema}: a z-root container inside .z-legacy equals a migrated page`, async ({
    page,
  }) => {
    await schemaSetzen(page, schema);
    await seiteOeffnen(page, ROUTE, 1440);
    const paar = async () => [
      await lesen(page, '[data-legacy="referenz"] demo-legacy-migriert'),
      await lesen(page, '[data-legacy="verschachtelt"] demo-legacy-migriert'),
    ];

    const [normal, verschachtelt] = await paar();
    expect(normal.length).toBeGreaterThan(10);
    expect(verschachtelt).toEqual(normal);

    // The focus ring is one of the base rules that stop at .z-legacy and come
    // back with the nested z-root.
    await page.locator('#ref-nummer').focus();
    const ringNormal = (await lesen(page, '[data-legacy="referenz"]', '#ref-nummer'))[0];
    await page.locator('#insel-nummer').focus();
    const ringInsel = (await lesen(page, '[data-legacy="verschachtelt"]', '#insel-nummer'))[0];
    expect(ringNormal).toContain('outlineStyle: solid');
    expect(ringNormal).toContain('outlineWidth: 2px');
    expect(ringInsel).toEqual(ringNormal);
  });

  test(`${schema}: axe finds nothing on the page`, async ({ page }) => {
    await schemaSetzen(page, schema);
    await seiteOeffnen(page, ROUTE, 1440);
    // The alert without a z-root around it is excluded on purpose. It shows
    // what does NOT work (next test): it takes the tokens of the shell onto a
    // surface of the old page, and text-muted of the dark scheme on a light
    // ground fails 4.5:1. docs/legacy.md says so and says what to do instead.
    const ergebnis = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .exclude('[data-legacy="lose"]')
      .analyze();
    expect(
      ergebnis.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`),
    ).toEqual([]);
  });
}

test('a library component straight inside .z-legacy keeps its classes and loses the base rules', async ({
  page,
}) => {
  await seiteOeffnen(page, ROUTE, 1440);
  const werte = await page.evaluate(() => {
    const stil = (sel: string) => {
      const el = document.querySelector(`[data-legacy="lose"]${sel}`);
      if (!el) throw new Error(sel);
      return getComputedStyle(el);
    };
    const alert = stil('');
    const link = stil(' a');
    const icon = stil(' .z-icon');
    return {
      // Class rules of the library still apply: layout, surface, radius, icon.
      display: alert.display,
      radius: alert.borderTopLeftRadius,
      padding: alert.paddingLeft,
      iconSize: icon.fontSize,
      // Lost: the 14px/20px of z-root, border-box, the link colour of the library.
      fontSize: alert.fontSize,
      lineHeight: alert.lineHeight,
      boxSizing: alert.boxSizing,
      fontFamily: alert.fontFamily,
      linkColor: link.color,
    };
  });
  expect(werte).toEqual({
    display: 'flex',
    radius: '8px',
    padding: '16px',
    iconSize: '20px',
    fontSize: '16px',
    lineHeight: 'normal',
    boxSizing: 'content-box',
    fontFamily: 'Georgia, "Times New Roman", serif',
    linkColor: 'rgb(11, 87, 208)',
  });
});

/** Opens one overlay from the given trigger row, reads it, closes it again. */
async function overlayLesen(page: Page, reihe: string, art: string) {
  const knopf = (name: string) => page.locator(`${reihe} button`, { hasText: name });
  let wurzel = '.cdk-overlay-container';
  if (art === 'dialog') {
    await knopf('Dialog öffnen').click();
    await page.locator('.z-dialog').waitFor();
  } else if (art === 'menu') {
    await knopf('Menü öffnen').click();
    await page.locator('.z-menu').waitFor();
  } else if (art === 'tooltip') {
    await knopf('Tooltip').hover();
    await page.locator('.z-tooltip').waitFor();
  } else {
    wurzel = 'z-toast-outlet';
    await knopf('Toast zeigen').click();
    await page.locator('.z-toast').waitFor();
  }
  const ausserhalb = await page.evaluate(
    (sel) => document.querySelector(sel)?.closest('.z-legacy') === null,
    wurzel,
  );
  expect(ausserhalb, `${art} renders outside .z-legacy`).toBe(true);
  const gelesen = await lesen(page, wurzel);

  if (art === 'toast') {
    await page.locator('.z-toast__close').click();
    await page.locator('.z-toast').waitFor({ state: 'detached' });
  } else if (art === 'tooltip') {
    await page.mouse.move(0, 0);
    await page.locator('.z-tooltip').waitFor({ state: 'detached' });
  } else {
    await page.keyboard.press('Escape');
    await page.locator('.z-dialog, .z-menu').waitFor({ state: 'detached' });
  }
  return gelesen;
}

for (const art of ['dialog', 'menu', 'tooltip', 'toast']) {
  test(`a ${art} opened from the old page looks like one opened from a migrated page`, async ({
    page,
  }) => {
    await seiteOeffnen(page, ROUTE, 1440);
    const normal = await overlayLesen(page, '[data-legacy="ausloeser-referenz"]', art);
    const insel = await overlayLesen(page, '[data-legacy="ausloeser-insel"]', art);
    expect(normal.length).toBeGreaterThan(0);
    expect(insel).toEqual(normal);
  });
}

test('no horizontal scrolling at 360px', async ({ page }) => {
  await seiteOeffnen(page, ROUTE, 360);
  await pruefeKeinScrollen(page, ROUTE);
});
