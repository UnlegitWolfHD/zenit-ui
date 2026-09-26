import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { pruefeAxe } from './pruefungen';

/**
 * Prüfung der Farbschemata und Akzente (docs/theming.md).
 *
 * Die Farbwerte selbst prüft `node tools/check-theme-contrast.mjs` rechnerisch.
 * Hier läuft die andere Hälfte: dass der gewählte Block im Browser wirklich
 * gewinnt, dass axe auf jeder Route in jeder Kombination sauber bleibt, dass der
 * Fokus-Ring sichtbar ist, dass kein Schema die Verbotsliste aus CLAUDE.md
 * aufmacht und dass ein gespeichertes Schema schon im ersten Frame steht.
 *
 * Lauf mit eigenem Port, damit ein fremdes `ng serve` nicht stört:
 *   E2E_PORT=4360 npx playwright test e2e/themes.spec.ts
 */
const SCHEMATA = ['dark', 'light', 'contrast'] as const;
const AKZENTE = ['rot', 'blau', 'gruen', 'violett', 'schwarz'] as const;
/**
 * Every route of the demo: the list of demo.spec.ts plus /themes. axe runs on
 * each of them in every combination, because a contrast failure only shows
 * where the pair occurs (link-in-text-block only on /formulare, for example).
 */
const ROUTEN = [
  'grundlage',
  'formulare',
  'navigation',
  'daten',
  'rueckmeldung',
  'overlays',
  'werkzeuge',
  'themes',
  'muster/dashboard',
  'muster/server-panel',
  'muster/startseite',
] as const;
/** The expensive checks (effects, focus rings) stay on these three routes. */
const ROUTEN_TIEF: readonly string[] = ['grundlage', 'rueckmeldung', 'themes'];

/** Der Schlüssel und das Format, die ZTheme in localStorage schreibt. */
const SPEICHER = 'zenit-theme';

/**
 * Setzt die Wahl, bevor die Anwendung startet, so wie sie ein früherer Besuch
 * hinterlassen hätte. Das Skript im <head> von index.html liest sie vor dem
 * ersten Frame, ZTheme nach dem Start.
 */
async function wahlSetzen(page: Page, scheme: string, accent: string) {
  await page.addInitScript(([schluessel, wert]) => window.localStorage.setItem(schluessel, wert), [
    SPEICHER,
    JSON.stringify({ scheme, accent }),
  ] as const);
}

async function seiteOeffnen(page: Page, route: string, breite = 1440, hoehe = 900) {
  await page.setViewportSize({ width: breite, height: hoehe });
  await page.goto(`/${route}`);
  await page.locator('main h1').first().waitFor();
  await page.evaluate(() => document.fonts.ready.then(() => true));
}

/** Liest, was am <html> steht: das ist das Ergebnis des Dienstes. */
function angewandt(page: Page) {
  return page.evaluate(() => ({
    theme: document.documentElement.getAttribute('data-theme'),
    accent: document.documentElement.getAttribute('data-accent'),
    bg: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),
    accentFarbe: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
  }));
}

/** Verläufe, backdrop-filter und Textschatten sind in jedem Schema verboten. */
async function verboteneEffekte(page: Page) {
  return page.evaluate(() => {
    const funde: string[] = [];
    const name = (el: Element, pseudo: string) => {
      const klasse = (el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean);
      return el.nodeName.toLowerCase() + (klasse.length ? '.' + klasse.join('.') : '') + pseudo;
    };
    for (const el of [document.body, ...Array.from(document.body.querySelectorAll('*'))]) {
      for (const pseudo of ['', '::before', '::after']) {
        const st = getComputedStyle(el, pseudo || undefined);
        if (pseudo && st.content === 'none') continue;
        if (st.backgroundImage.includes('gradient')) {
          funde.push(`${name(el, pseudo)}: background-image ${st.backgroundImage}`);
        }
        if (st.backdropFilter && st.backdropFilter !== 'none') {
          funde.push(`${name(el, pseudo)}: backdrop-filter ${st.backdropFilter}`);
        }
        if (st.textShadow && st.textShadow !== 'none') {
          funde.push(`${name(el, pseudo)}: text-shadow ${st.textShadow}`);
        }
      }
    }
    return Array.from(new Set(funde));
  });
}

/**
 * Die ersten zehn Tab-Stopps. Gesucht ist ein 2px-Outline am Element selbst
 * oder, wenn das Element für die Maus unsichtbar ist (Checkbox, Toggle), am
 * Nachbarn, der den Ring stellvertretend zeichnet.
 */
async function fokusRinge(page: Page, stopps = 10) {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  const funde: string[] = [];
  let gesehen = 0;
  const pfade = new Set<string>();
  for (let schritt = 0; schritt < stopps; schritt++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body || el === document.documentElement) return null;
      const pfad: string[] = [];
      let knoten: Element | null = el;
      while (knoten && knoten !== document.documentElement) {
        const eltern: Element | null = knoten.parentElement;
        const i = eltern ? Array.prototype.indexOf.call(eltern.children, knoten) + 1 : 1;
        pfad.unshift(`${knoten.nodeName.toLowerCase()}:nth-child(${i})`);
        knoten = eltern;
      }
      const beschreibung = (n: Element) => {
        const klasse = (n.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean);
        const text = (n.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30);
        return (
          n.nodeName.toLowerCase() +
          (klasse.length ? '.' + klasse.join('.') : '') +
          (text ? ` "${text}"` : '')
        );
      };
      const ringSitzt = (st: CSSStyleDeclaration) =>
        st.outlineStyle !== 'none' && parseFloat(st.outlineWidth) >= 2;
      const st = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const nachbarn = [
        el.parentElement,
        ...(el.parentElement ? Array.from(el.parentElement.children) : []),
      ].filter((n): n is Element => !!n && n !== el);
      return {
        pfad: pfad.join('>'),
        name: beschreibung(el),
        ringSitzt: ringSitzt(st),
        outline: `${st.outlineStyle} ${st.outlineWidth}`,
        farbe: st.outlineColor,
        nachbarRing: nachbarn.some((n) => ringSitzt(getComputedStyle(n))),
        unsichtbar:
          rect.width < 2 ||
          rect.height < 2 ||
          st.visibility === 'hidden' ||
          parseFloat(st.opacity) === 0,
      };
    });
    if (!info) break;
    if (pfade.has(info.pfad)) break;
    pfade.add(info.pfad);
    gesehen++;
    if (info.ringSitzt || (info.unsichtbar && info.nachbarRing)) continue;
    funde.push(`${info.name}: outline "${info.outline}"`);
  }
  return { funde, gesehen };
}

for (const scheme of SCHEMATA) {
  for (const accent of AKZENTE) {
    test.describe(`${scheme} / ${accent}`, () => {
      for (const route of ROUTEN) {
        const tief = ROUTEN_TIEF.includes(route);
        const titel = tief ? 'ist barrierefrei, fokussierbar und effektfrei' : 'ist barrierefrei';
        test(`/${route} ${titel}`, async ({ page }) => {
          await wahlSetzen(page, scheme, accent);
          await seiteOeffnen(page, route);

          const zustand = await angewandt(page);
          expect(zustand.theme, `data-theme auf /${route}`).toBe(scheme);
          expect(zustand.accent, `data-accent auf /${route}`).toBe(
            accent === 'rot' ? null : accent,
          );
          expect(zustand.bg, `--bg ist in ${scheme} nicht aufgeloest`).not.toBe('');

          await pruefeAxe(page, `/${route} in ${scheme}/${accent}`);
          if (!tief) return;

          expect(
            await verboteneEffekte(page),
            `/${route} in ${scheme}/${accent}: Verlauf, backdrop-filter oder text-shadow`,
          ).toEqual([]);

          const ringe = await fokusRinge(page);
          expect(ringe.gesehen, `/${route} hat keinen Tab-Stopp`).toBeGreaterThan(0);
          expect(
            ringe.funde,
            `/${route} in ${scheme}/${accent}: Tab-Stopps ohne 2px-Fokus-Ring`,
          ).toEqual([]);
        });
      }
    });
  }
}

/**
 * Links in running text are underlined in every scheme (deviation in
 * _grundlage.css); links in navigation, header, footer, tabs, rows and buttons
 * are not. Checked on the computed style at rest.
 */
test.describe('Link underline', () => {
  const unterstrichen = (page: Page, auswahl: string) =>
    page
      .locator(auswahl)
      .evaluateAll((liste) =>
        liste.map((el) => getComputedStyle(el).textDecorationLine.includes('underline')),
      );

  test('underlines links in running text', async ({ page }) => {
    await seiteOeffnen(page, 'formulare');
    const imText = await unterstrichen(page, 'main label a');

    expect(imText.length, 'no link in running text on /formulare').toBeGreaterThan(0);
    expect(imText).not.toContain(false);
  });

  for (const route of ['navigation', 'muster/startseite', 'muster/server-panel'] as const) {
    test(`leaves navigation, header, footer, tabs, rows and buttons alone on /${route}`, async ({
      page,
    }) => {
      await seiteOeffnen(page, route);
      const auswahl = [
        'nav a',
        '.z-header a',
        '.z-footer a',
        'a.z-tab',
        'a.z-row',
        'a.z-side__item',
        'a.z-btn',
      ].join(', ');
      const ohne = await unterstrichen(page, auswahl);

      expect(ohne.length, `no navigation links on /${route}`).toBeGreaterThan(0);
      expect(ohne).not.toContain(true);
    });
  }
});

/**
 * A stored light scheme must never flash dark. ZTheme sets data-theme only once
 * Angular has started, many frames after the first paint; the script from
 * zenitThemeInitScript() in <head> sets it before.
 *
 * The probe runs inside the page: a requestAnimationFrame loop from the first
 * frame on, with a throttled network, so there really are frames between the
 * first paint and the start of the application. Against the dev server this
 * checks the script. The second half of the fix
 * (optimization.styles.inlineCritical: false) only exists in a production
 * build; run the same test against the built output for that, see
 * docs/theming.md, "No flash of the wrong theme":
 *   THEME_FLASH_URL=http://localhost:4510 E2E_PORT=4511 \
 *     npx playwright test e2e/themes.spec.ts -g "No flash"
 */
test.describe('No flash of the wrong theme', () => {
  const DUNKEL = 'rgb(6, 6, 8)';
  const HELL = 'rgb(255, 255, 255)';
  const BASIS = process.env['THEME_FLASH_URL'] ?? '';

  test('paints a stored light scheme from the first frame on', async ({ page }) => {
    await wahlSetzen(page, 'light', 'blau');
    await page.addInitScript(() => {
      const proben: { bg: string; theme: string | null; accent: string | null }[] = [];
      (window as unknown as { __proben: typeof proben }).__proben = proben;
      const messen = () => {
        const html = document.documentElement;
        proben.push({
          bg: getComputedStyle(html).backgroundColor,
          theme: html.getAttribute('data-theme'),
          accent: html.getAttribute('data-accent'),
        });
        if (proben.length < 2000) requestAnimationFrame(messen);
      };
      requestAnimationFrame(messen);
    });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 100,
      downloadThroughput: (8 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASIS}/`);
    await page.locator('main h1').first().waitFor();

    const proben = await page.evaluate(
      () =>
        (
          window as unknown as {
            __proben: { bg: string; theme: string | null; accent: string | null }[];
          }
        ).__proben,
    );
    const dunkel = proben.filter((p) => p.bg === DUNKEL).length;
    const ohneSchema = proben.filter((p) => p.theme !== 'light' || p.accent !== 'blau').length;

    expect(proben.length, 'no frames between first paint and start').toBeGreaterThan(3);
    expect(dunkel, `${dunkel} of ${proben.length} frames dark`).toBe(0);
    expect(ohneSchema, `${ohneSchema} of ${proben.length} frames without the stored theme`).toBe(0);
    expect(proben.at(-1)?.bg).toBe(HELL);
  });
});

test.describe('Steuerung im Kopf', () => {
  test('schaltet Schema und Akzent und überlebt den Neuladen', async ({ page }) => {
    await seiteOeffnen(page, 'themes');

    await page.locator('#theme-schema').selectOption('light');
    await page.locator('#theme-akzent').selectOption('violett');

    await expect
      .poll(() => angewandt(page))
      .toMatchObject({
        theme: 'light',
        accent: 'violett',
      });

    await page.reload();
    await page.locator('main h1').first().waitFor();

    const nachNeuladen = await angewandt(page);
    expect(nachNeuladen.theme).toBe('light');
    expect(nachNeuladen.accent).toBe('violett');
    expect(await page.locator('#theme-schema').inputValue()).toBe('light');
    expect(await page.locator('#theme-akzent').inputValue()).toBe('violett');
  });

  test('bei 360px ohne waagerechtes Scrollen und mit 40px hohen Zielen', async ({ page }) => {
    await seiteOeffnen(page, 'themes', 360, 800);

    const masse = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(masse.scrollWidth, '/themes scrollt bei 360px waagerecht').toBeLessThanOrEqual(
      masse.clientWidth,
    );

    for (const id of ['#theme-schema', '#theme-akzent']) {
      const kasten = await page.locator(id).boundingBox();
      expect(kasten?.height ?? 0, `${id} ist kein 40px-Klickziel`).toBeGreaterThanOrEqual(39.5);
    }
  });
});

test.describe('System-Modus', () => {
  for (const [farbschema, erwartet] of [
    ['dark', 'dark'],
    ['light', 'light'],
  ] as const) {
    test(`folgt prefers-color-scheme ${farbschema}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: farbschema });
      await wahlSetzen(page, 'system', 'rot');
      await seiteOeffnen(page, 'themes');

      expect((await angewandt(page)).theme).toBe(erwartet);
    });
  }

  test('wechselt ohne Neuladen mit', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await wahlSetzen(page, 'system', 'rot');
    await seiteOeffnen(page, 'themes');

    expect((await angewandt(page)).theme).toBe('dark');

    await page.emulateMedia({ colorScheme: 'light' });

    await expect.poll(async () => (await angewandt(page)).theme).toBe('light');
  });
});

for (const scheme of SCHEMATA) {
  test(`Screenshot /themes in ${scheme} bei 1440px`, async ({ page }) => {
    await wahlSetzen(page, scheme, 'rot');
    await seiteOeffnen(page, 'themes');
    await expect(page).toHaveScreenshot(`themes-${scheme}-1440.png`, { fullPage: true });
  });
}

/**
 * A link in the text of an alert, for every status on every ground an alert
 * stands on: free on bg, in a panel on surface, in a dialog on surface-raised.
 * accent-text missed 4.5:1 on the tints in dark, so the link takes text
 * (_grundlage.css). axe measures each of the 15 links in every scheme and
 * accent; a link axe cannot decide (incomplete) fails as well, because a
 * translucent tint is exactly where it gives up. Links outside alerts keep
 * accent-text.
 */
test.describe('Links im Alert', () => {
  for (const scheme of SCHEMATA) {
    for (const accent of AKZENTE) {
      test(`reach 4.5:1 on every status and ground in ${scheme}/${accent}`, async ({ page }) => {
        await wahlSetzen(page, scheme, accent);
        await seiteOeffnen(page, 'rueckmeldung');
        const matrix = page.locator('[data-alert-matrix]');
        const links = matrix.locator('.z-alert__body a');

        await expect(links).toHaveCount(15);
        for (const grund of ['bg', 'surface', 'surface-raised']) {
          await expect(matrix.locator(`[data-grund="${grund}"] .z-alert__body a`)).toHaveCount(5);
        }

        const ergebnis = await new AxeBuilder({ page })
          .include('[data-alert-matrix]')
          .withRules(['color-contrast'])
          .analyze();
        const knoten = (liste: typeof ergebnis.violations) =>
          liste.flatMap((regel) => regel.nodes.map((n) => `${n.target.join(' ')} ${n.html}`));
        expect(knoten(ergebnis.violations), `Kontrast in ${scheme}/${accent}`).toEqual([]);
        expect(
          knoten(ergebnis.incomplete).filter((k) => k.includes('<a ')),
          `unentschiedene Links in ${scheme}/${accent}`,
        ).toEqual([]);

        const farben = await links.evaluateAll((liste) => {
          const text = getComputedStyle(document.documentElement).getPropertyValue('--text');
          const probe = document.createElement('span');
          probe.style.color = text;
          document.body.append(probe);
          const soll = getComputedStyle(probe).color;
          probe.remove();
          return liste.map((a) => ({
            gleich: getComputedStyle(a).color === soll,
            linie: getComputedStyle(a).textDecorationLine,
          }));
        });
        expect(
          farben.every((f) => f.gleich),
          'jeder Link im Alert nimmt --text',
        ).toBe(true);
        expect(farben.every((f) => f.linie.includes('underline'))).toBe(true);
      });
    }
  }

  test('leave links outside an alert in accent-text', async ({ page }) => {
    await seiteOeffnen(page, 'formulare');
    const farben = await page.locator('main label a').evaluateAll((liste) => {
      const akzent = getComputedStyle(document.documentElement).getPropertyValue('--accent-text');
      const probe = document.createElement('span');
      probe.style.color = akzent;
      document.body.append(probe);
      const soll = getComputedStyle(probe).color;
      probe.remove();
      return liste.map((a) => getComputedStyle(a).color === soll);
    });

    expect(farben.length).toBeGreaterThan(0);
    expect(farben).not.toContain(false);
  });
});
