import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Prüfung der Farbschemata und Akzente (docs/theming.md).
 *
 * Die Farbwerte selbst prüft `node tools/check-theme-contrast.mjs` rechnerisch.
 * Hier läuft die andere Hälfte: dass der gewählte Block im Browser wirklich
 * gewinnt, dass axe auf jeder Kombination sauber bleibt, dass der Fokus-Ring
 * sichtbar ist und dass kein Schema die Verbotsliste aus CLAUDE.md aufmacht.
 *
 * Lauf mit eigenem Port, damit ein fremdes `ng serve` nicht stört:
 *   E2E_PORT=4360 npx playwright test e2e/themes.spec.ts
 */
const SCHEMATA = ['dark', 'light', 'contrast'] as const;
const AKZENTE = ['rot', 'blau', 'gruen', 'violett'] as const;
const ROUTEN = ['grundlage', 'rueckmeldung', 'themes'] as const;

/** Der Schlüssel und das Format, die ZTheme in localStorage schreibt. */
const SPEICHER = 'zenit-theme';

/**
 * Setzt die Wahl, bevor die Anwendung startet. So sieht der erste Frame schon
 * das richtige Schema; das ist auch der Weg, den ein Produkt geht.
 */
async function wahlSetzen(page: Page, scheme: string, accent: string) {
  await page.addInitScript(
    ([schluessel, wert]) => window.localStorage.setItem(schluessel, wert),
    [SPEICHER, JSON.stringify({ scheme, accent })] as const,
  );
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
        test(`/${route} ist barrierefrei, fokussierbar und effektfrei`, async ({ page }) => {
          await wahlSetzen(page, scheme, accent);
          await seiteOeffnen(page, route);

          const zustand = await angewandt(page);
          expect(zustand.theme, `data-theme auf /${route}`).toBe(scheme);
          expect(zustand.accent, `data-accent auf /${route}`).toBe(
            accent === 'rot' ? null : accent,
          );
          expect(zustand.bg, `--bg ist in ${scheme} nicht aufgeloest`).not.toBe('');

          const ergebnis = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze();
          const lesbar = ergebnis.violations.map(
            (v) =>
              `${v.id} (${v.impact}): ${v.help}\n    ${v.helpUrl}\n` +
              v.nodes
                .map(
                  (n) =>
                    `    ${n.target.join(' ')}\n      ${(n.failureSummary || '').replace(/\n/g, '\n      ')}`,
                )
                .join('\n'),
          );
          expect(lesbar, `axe-Verstoesse auf /${route} in ${scheme}/${accent}`).toEqual([]);

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

test.describe('Steuerung im Kopf', () => {
  test('schaltet Schema und Akzent und überlebt den Neuladen', async ({ page }) => {
    await seiteOeffnen(page, 'themes');

    await page.locator('#theme-schema').selectOption('light');
    await page.locator('#theme-akzent').selectOption('violett');

    await expect.poll(() => angewandt(page)).toMatchObject({
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
