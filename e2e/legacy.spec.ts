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

/**
 * The element that carries the old body rule: the `.z-legacy` host in the demo,
 * `<body>` in the bare document. Its own box is part of the old page, so
 * `.z-root *` must not turn it into a border-box.
 */
function wirtLesen(page: Page, wirt: string) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) throw new Error(`not found: ${sel}`);
    const st = getComputedStyle(el);
    return {
      boxSizing: st.boxSizing,
      width: st.width,
      paddingLeft: st.paddingLeft,
      paddingRight: st.paddingRight,
      randbreite: el.getBoundingClientRect().width,
      fontSize: st.fontSize,
      lineHeight: st.lineHeight,
      fontFamily: st.fontFamily,
      color: st.color,
      backgroundColor: st.backgroundColor,
    };
  }, wirt);
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

    // The host: 18rem of content plus 1rem of padding on each side.
    const wirt = await wirtLesen(page, '[data-legacy="insel"]');
    expect(wirt).toEqual(await wirtLesen(nackt, 'body'));
    expect(wirt.boxSizing).toBe('content-box');
    expect(wirt.randbreite).toBe(320);

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

    // The nested container itself, the usual target of a skip link, gets the
    // ring like any page container outside .z-legacy.
    const ring = async (sel: string) => {
      await page.locator(sel).focus();
      return page.evaluate((s) => {
        const st = getComputedStyle(document.querySelector(s)!);
        return [st.outlineStyle, st.outlineWidth, st.outlineColor, st.outlineOffset].join(' ');
      }, sel);
    };
    const ringSeite = await ring('[data-legacy="referenz"]');
    expect(ringSeite).toContain('solid 2px');
    expect(await ring('[data-legacy="verschachtelt"]')).toBe(ringSeite);
  });

  // New for the footer ground (docs/pakete.md, Festlegung 1): `[data-legacy="fuss"]`
  // is the `z-footer` the demo page places inside `.z-legacy` itself, right on
  // the light `.demo-alt` surface (#fafafa), so this measures the case the
  // background addition is for. Colours are read as computed `rgb()` strings
  // and compared against a `var(--token)` probe, the same trick `pruefeFokusRing`
  // in pruefungen.ts uses for `--focus`. `.z-footer__base` and its link already
  // carry their own `color` in bundle.css (`text-subtle`, `.z-root
  // .z-footer__base a` -> `text-muted`), unlike a plain link in `z-alert__body`,
  // which has none of its own and falls back to the base rule that `.z-legacy`
  // switches off, and then to `.demo-alt a`'s blue. The footer's own rules are
  // not part of that switched-off set, so they are expected to hold here too:
  // no `color` addition needed, only the `background` this test guards.
  test(`${schema}: the footer above the legacy island keeps the page ground and stays readable`, async ({
    page,
  }) => {
    await schemaSetzen(page, schema);
    await seiteOeffnen(page, ROUTE, 1440);

    const gemessen = await page.evaluate(() => {
      const tokenFarbe = (token: string) => {
        const probe = document.createElement('span');
        probe.style.color = `var(${token})`;
        document.body.appendChild(probe);
        const farbe = getComputedStyle(probe).color;
        probe.remove();
        return farbe;
      };
      const zerlegen = (rgb: string) => {
        const teile = rgb.match(/[\d.]+/g)!.map(Number);
        return { r: teile[0], g: teile[1], b: teile[2] };
      };
      const leuchtdichte = ({ r, g, b }: { r: number; g: number; b: number }) => {
        const k = (c: number) => {
          const v = c / 255;
          return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * k(r) + 0.7152 * k(g) + 0.0722 * k(b);
      };
      const kontrast = (a: string, b: string) => {
        const la = leuchtdichte(zerlegen(a));
        const lb = leuchtdichte(zerlegen(b));
        return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
      };

      const footer = document.querySelector('[data-legacy="fuss"]')!;
      const basis = footer.querySelector('.z-footer__base')!;
      const link = footer.querySelector('.z-footer__base a')!;
      const bg = tokenFarbe('--bg');
      const basisFarbe = getComputedStyle(basis).color;
      const linkFarbe = getComputedStyle(link).color;

      return {
        insel: footer.closest('[data-legacy="insel"]') !== null,
        footerHintergrund: getComputedStyle(footer).backgroundColor,
        bg,
        basisFarbe,
        linkFarbe,
        textSubtleToken: tokenFarbe('--text-subtle'),
        textMutedToken: tokenFarbe('--text-muted'),
        basisKontrast: kontrast(basisFarbe, bg),
        linkKontrast: kontrast(linkFarbe, bg),
      };
    });

    expect(gemessen.insel, 'the footer sits inside the .z-legacy island').toBe(true);
    expect(gemessen.footerHintergrund).toBe(gemessen.bg);
    expect(gemessen.basisFarbe).toBe(gemessen.textSubtleToken);
    expect(gemessen.linkFarbe).toBe(gemessen.textMutedToken);
    expect(gemessen.basisKontrast).toBeGreaterThanOrEqual(4.5);
    expect(gemessen.linkKontrast).toBeGreaterThanOrEqual(4.5);
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

/**
 * The rem base belongs to the application. `_grundlage.css` sets neither
 * `font-size` nor `line-height` on `<html>`: the two declarations of the
 * reference rule live in `.z-root:where(:not(html))`, which still weighs
 * (0,1,0) but leaves the root element out. A plain `html { font-size: … }` at
 * (0,0,1) is then the only author rule on `<html>` and wins at every
 * specificity and in either include order. Its predecessor
 * `html.z-root { font-size: 100% }` weighed (0,1,1) and beat the application
 * instead: a product whose user setting reads
 * `html { font-size: var(--base-font-size) }` rendered 16px for 14px and 18px
 * alike, before and after `zenit-ui.css`.
 */

/** Puts `css` before the first or after the last stylesheet of the document. */
function appRegel(page: Page, css: string, wo: 'vor' | 'nach') {
  return page.evaluate(
    ([text, stelle]) => {
      const links = [...document.querySelectorAll('link[rel="stylesheet"]')];
      const st = document.createElement('style');
      st.dataset['appRegel'] = '1';
      st.textContent = text;
      const anker = stelle === 'vor' ? links[0] : links[links.length - 1];
      anker.parentNode!.insertBefore(st, stelle === 'vor' ? anker : anker.nextSibling);
    },
    [css, wo] as const,
  );
}

function appRegelWeg(page: Page) {
  return page.evaluate(() =>
    document.querySelectorAll('style[data-app-regel]').forEach((s) => s.remove()),
  );
}

/** `<html>`, the page size on `<body>` and what `1rem` measures inside `wirt`. */
function remBasis(page: Page, wirt = 'body') {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel)!;
    const probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;width:1rem';
    el.appendChild(probe);
    const einRem = getComputedStyle(probe).width;
    probe.remove();
    const html = getComputedStyle(document.documentElement);
    const body = getComputedStyle(document.body);
    return {
      html: `${html.fontSize} / ${html.lineHeight}`,
      body: `${body.fontSize} / ${body.lineHeight}`,
      einRem,
    };
  }, wirt);
}

for (const groesse of [14, 18]) {
  test(`an application rule html { font-size: ${groesse}px } at (0,0,1) wins, before and after the library stylesheet`, async ({
    page,
  }) => {
    await seiteOeffnen(page, ROUTE, 1440);
    // Without such a rule the library leaves `<html>` to the browser.
    expect(await remBasis(page)).toEqual({
      html: '16px / normal',
      body: '14px / 20px',
      einRem: '16px',
    });

    // The form a product uses for a user setting, which is what made the old
    // (0,1,1) rule visible.
    const regel = `html { --base-font-size: ${groesse}px; font-size: var(--base-font-size) }`;
    for (const wo of ['vor', 'nach'] as const) {
      await appRegel(page, regel, wo);
      expect(await remBasis(page), `html rule ${wo} zenit-ui.css`).toEqual({
        html: `${groesse}px / normal`,
        // The page size stays with body.z-root, unchanged in both cases.
        body: '14px / 20px',
        einRem: `${groesse}px`,
      });
      await appRegelWeg(page);
    }
  });
}

test('1rem inside .z-legacy follows the application rule on <html>', async ({ page }) => {
  await seiteOeffnen(page, ROUTE, 1440);
  const insel = '[data-legacy="insel"]';
  for (const groesse of [14, 18]) {
    await appRegel(page, `html { font-size: ${groesse}px }`, 'nach');
    const inselGroesse = await page.evaluate(
      (sel) => getComputedStyle(document.querySelector(sel)!).fontSize,
      insel,
    );
    // .z-legacy is `font-size: 1rem`, the one rem in the library's stylesheets.
    expect({ ...(await remBasis(page, insel)), inselGroesse }).toEqual({
      html: `${groesse}px / normal`,
      body: '14px / 20px',
      einRem: `${groesse}px`,
      inselGroesse: `${groesse}px`,
    });
    await appRegelWeg(page);
  }
});

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

test('the limits docs/legacy.md states: second level, both classes on one element', async ({
  page,
}) => {
  await seiteOeffnen(page, ROUTE, 1440);
  const werte = await page.evaluate(() => {
    const main = document.querySelector('main')!;
    const bauen = (html: string) => {
      const huelle = document.createElement('div');
      huelle.innerHTML = html;
      main.appendChild(huelle);
      const el = huelle.querySelector('[data-probe]')!;
      const st = getComputedStyle(el);
      const knopf = getComputedStyle(huelle.querySelector('button')!);
      // font-family of a bare button tells whether the base rules apply:
      // inherited (Inter) with them, the browser's Arial without.
      return [st.boxSizing, st.fontSize, st.lineHeight, knopf.fontFamily.split(',')[0]].join(' | ');
    };
    const inhalt = '<p data-probe>Text</p><button type="button">Knopf</button>';
    return {
      zweiteEbene: bauen(
        `<div class="z-legacy"><div class="z-root"><div class="z-legacy">${inhalt}</div></div></div>`,
      ),
      beideInDerInsel: bauen(
        `<div class="z-legacy"><div class="z-root z-legacy">${inhalt}</div></div>`,
      ),
      beideOhneInsel: bauen(`<div class="z-root z-legacy">${inhalt}</div>`),
    };
  });
  expect(werte).toEqual({
    // Counts as migrated: base rules on. But the inherited values are those of
    // the inner .z-legacy, 16px and normal, not the 14px/20px of a page.
    zweiteEbene: 'border-box | 16px | normal | Inter',
    beideInDerInsel: 'border-box | 16px | normal | Inter',
    // Outside any island the element is a plain .z-legacy host.
    beideOhneInsel: 'content-box | 16px | normal | Arial',
  });
});

/**
 * Waits until the CDK backdrop is the one of a fully open overlay, and until a
 * closed overlay has taken its backdrop out of the document again.
 *
 * The CDK attaches the backdrop with `opacity: 0` and adds
 * `cdk-overlay-backdrop-showing` only in the next animation frame, and it
 * removes the element only once the fade-out has ended. `lesen` walks every
 * element of the overlay container and records the class list and the opacity,
 * so a reading taken between attach and that frame differs from one taken after
 * it — `div.cdk-overlay-backdrop z-backdrop` at `opacity: 0` against
 * `div.cdk-overlay-backdrop z-backdrop cdk-overlay-backdrop-showing` at
 * `opacity: 1`. Both readings of a comparison have to be taken in the same
 * state, which is what this waits for: shown before the reading, gone after it.
 * The library switches the fade itself off (`.z-backdrop.cdk-overlay-backdrop
 * { transition: none }`), so this is a wait for one frame, not for 400ms.
 *
 * Tooltip and toast have no backdrop at all; there both calls are a no-op.
 */
async function hintergrund(page: Page, zustand: 'offen' | 'zu'): Promise<void> {
  const alle = page.locator('.cdk-overlay-backdrop');
  if (zustand === 'zu') {
    await expect(alle).toHaveCount(0);
    return;
  }
  if ((await alle.count()) === 0) {
    return;
  }
  await expect(alle).toHaveClass(/cdk-overlay-backdrop-showing/);
  await expect(alle).toHaveCSS('opacity', '1');
}

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
  await hintergrund(page, 'offen');
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
  await hintergrund(page, 'zu');
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
