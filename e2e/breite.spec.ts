import { expect, test, type Page } from '@playwright/test';
import { pruefeAxe } from './pruefungen';

/**
 * The page width as an application setting (docs/theming.md, "Page width").
 *
 * The documented mechanism is one declaration in the application's own
 * stylesheet, `:root { --container: 1440px }`, which wins over the `:root`
 * block of `tokens.css` by source order. This suite measures that in the
 * browser instead of trusting the built bundle, and it pins the second half of
 * the audit: which blocks grow with the page and which keep a width of their
 * own. The rows of `docs/layout.md` are what these assertions check.
 *
 * Run with a port of its own, so a foreign `ng serve` does not get in the way:
 *   E2E_PORT=4707 npx playwright test e2e/breite.spec.ts
 */

/** What the application stylesheet holds; 1120px is the default of tokens.css. */
const BREIT = 1440;
/** `.z-container` gutter from 640px up (`--space-5`), per side. */
const RAND = 24;

/**
 * Registers the override the way an application does: a stylesheet of its own,
 * after every stylesheet of the library. `addStyleTag` appends to `<head>`, so
 * the block stands last and the equal specificity (0,1,0) is settled by order.
 */
async function breiteSetzen(page: Page, px: number) {
  await page.addStyleTag({ content: `:root { --container: ${px}px; }` });
}

async function seiteOeffnen(page: Page, route: string, breite: number, hoehe = 900) {
  await page.setViewportSize({ width: breite, height: hoehe });
  await page.goto(`/${route}`);
  await page.locator('main h1').first().waitFor();
  await page.evaluate(() => document.fonts.ready.then(() => true));
}

/** Left and right edge plus the content box of an element, rounded to whole px. */
function kasten(page: Page, selektor: string) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!(el instanceof HTMLElement)) {
      throw new Error(`${sel} fehlt auf der Seite`);
    }
    const stil = getComputedStyle(el);
    const masse = el.getBoundingClientRect();
    return {
      links: Math.round(masse.left),
      rechts: Math.round(masse.right),
      breite: Math.round(masse.width),
      inhalt: Math.round(
        el.clientWidth - parseFloat(stil.paddingInlineStart) - parseFloat(stil.paddingInlineEnd),
      ),
      /** Own limit in px, or null where the element has none. */
      kappe: stil.maxWidth.endsWith('px') ? Math.round(parseFloat(stil.maxWidth)) : null,
    };
  }, selektor);
}

function waagerechterScroll(page: Page) {
  return page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
}

test.describe(`:root { --container: ${BREIT}px } in der Anwendung`, () => {
  test('die Anwendung gewinnt gegen tokens.css', async ({ page }) => {
    await seiteOeffnen(page, 'muster/startseite', BREIT);
    const vorher = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--container').trim(),
    );
    expect(vorher, 'Voreinstellung aus tokens.css').toBe('1120px');

    await breiteSetzen(page, BREIT);
    const nachher = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--container').trim(),
    );
    expect(nachher, 'Block der Anwendung steht spaeter und gewinnt').toBe(`${BREIT}px`);
  });

  test('ein html-Selektor verliert, :root gewinnt', async ({ page }) => {
    await seiteOeffnen(page, 'muster/startseite', BREIT);
    // (0,0,1) gegen die (0,1,0) von tokens.css: die Spezifitaet entscheidet,
    // die Reihenfolge hilft nicht. Genau das sagt die Dokumentation.
    await page.addStyleTag({ content: 'html { --container: 1600px; }' });
    await expect
      .poll(() =>
        page.evaluate(() =>
          getComputedStyle(document.documentElement).getPropertyValue('--container').trim(),
        ),
      )
      .toBe('1120px');
  });

  test('der Inhaltskasten von .z-container misst 1440 minus Raender', async ({ page }) => {
    await seiteOeffnen(page, 'muster/startseite', BREIT);
    await breiteSetzen(page, BREIT);

    const haupt = await kasten(page, 'main.z-container');
    expect(haupt.breite, 'Randkasten von <main>').toBe(BREIT);
    expect(haupt.inhalt, 'Inhaltskasten = 1440 minus zweimal space-5').toBe(BREIT - 2 * RAND);
  });

  test('Kopf, Inhalt und Fuss stehen auf derselben Kante', async ({ page }) => {
    await seiteOeffnen(page, 'muster/startseite', BREIT);
    await breiteSetzen(page, BREIT);

    // Das Muster der Startseite legt z-app-header und z-footer in dasselbe
    // .z-container wie den Inhalt. Beide laufen ueber die volle Breite dessen,
    // was sie enthaelt, also genau ueber den Inhaltskasten.
    const haupt = await kasten(page, 'main.z-container');
    const kopfzeile = await kasten(page, '.z-header');
    const fusszeile = await kasten(page, '.z-footer');
    const inhaltLinks = haupt.links + RAND;
    const inhaltRechts = haupt.rechts - RAND;

    expect(
      [kopfzeile.links, kopfzeile.rechts],
      'Kopfzeile auf den Kanten des Inhaltskastens',
    ).toEqual([inhaltLinks, inhaltRechts]);
    expect([fusszeile.links, fusszeile.rechts], 'Fusszeile auf denselben Kanten').toEqual([
      inhaltLinks,
      inhaltRechts,
    ]);
  });

  test('kein waagerechtes Scrollen bei 1440px', async ({ page }) => {
    await seiteOeffnen(page, 'muster/startseite', BREIT);
    await breiteSetzen(page, BREIT);
    const masse = await waagerechterScroll(page);
    expect(
      masse.scrollWidth,
      `1440px scrollt waagerecht (${JSON.stringify(masse)})`,
    ).toBeLessThanOrEqual(masse.clientWidth);
  });

  test('die Einstellung aendert auf dem Telefon nichts', async ({ page }) => {
    // 375px: die Seite ist schmaler als jede der drei Breiten, also darf die
    // Einstellung dort ueberhaupt nicht auffallen.
    await seiteOeffnen(page, 'muster/startseite', 375, 800);
    // Nur die Geometrie: die Grenze selbst ist erklaertermassen eine andere.
    const geometrie = ({ links, rechts, breite, inhalt }: Awaited<ReturnType<typeof kasten>>) => ({
      links,
      rechts,
      breite,
      inhalt,
    });
    const ohne = await kasten(page, 'main.z-container');
    await breiteSetzen(page, BREIT);
    const mit = await kasten(page, 'main.z-container');
    expect(geometrie(mit), 'Container bei 375px unveraendert').toEqual(geometrie(ohne));

    const masse = await waagerechterScroll(page);
    expect(
      masse.scrollWidth,
      `375px scrollt waagerecht (${JSON.stringify(masse)})`,
    ).toBeLessThanOrEqual(masse.clientWidth);
  });

  for (const schema of ['dark', 'light', 'contrast'] as const) {
    test(`axe bleibt sauber in ${schema}`, async ({ page }) => {
      await page.addInitScript(
        (s) => window.localStorage.setItem('zenit-theme', JSON.stringify({ scheme: s })),
        schema,
      );
      await seiteOeffnen(page, 'muster/startseite', BREIT);
      await breiteSetzen(page, BREIT);
      await pruefeAxe(page, `muster/startseite bei ${BREIT}px in ${schema}`);
    });
  }
});

/**
 * Das Ergebnis der Erhebung: was mit der Seite waechst und was nicht. Je eine
 * Zusicherung pro Zeile der Tabelle in docs/layout.md, gemessen als Differenz
 * zwischen 1120 und 1440px.
 */
test.describe('was mit --container waechst und was nicht', () => {
  const ZUWACHS = BREIT - 1120;

  /** Misst einen Selektor bei 1120 und bei 1440px auf derselben Route. */
  async function differenz(page: Page, route: string, selektor: string) {
    await seiteOeffnen(page, route, BREIT);
    const schmal = await kasten(page, selektor);
    await breiteSetzen(page, BREIT);
    const weit = await kasten(page, selektor);
    return {
      schmal: schmal.breite,
      weit: weit.breite,
      delta: weit.breite - schmal.breite,
      kappe: weit.kappe,
    };
  }

  for (const fall of [
    { route: 'muster/dashboard', selektor: '.z-panel', name: 'Panel' },
    { route: 'muster/dashboard', selektor: '.z-rows', name: 'ServerList' },
    { route: 'muster/dashboard', selektor: '.z-pagehead', name: 'PageHeader' },
    { route: 'muster/startseite', selektor: '.z-section', name: 'Abschnitt' },
    { route: 'muster/startseite', selektor: '.z-footer__cols', name: 'Fussspalten' },
  ]) {
    test(`${fall.name} waechst um die volle Differenz`, async ({ page }) => {
      const m = await differenz(page, fall.route, fall.selektor);
      expect(m.delta, `${fall.selektor}: ${m.schmal} -> ${m.weit}`).toBe(ZUWACHS);
    });
  }

  for (const fall of [
    {
      route: 'muster/server-panel',
      selektor: '.z-side',
      name: 'Sidebar',
      breite: 240,
      grund: '--sidebar',
    },
    {
      route: 'muster/preisrechner',
      selektor: '.z-config__aside',
      name: 'Konfigurator-Spalte',
      breite: 340,
      grund: 'feste Spur ab 900px',
    },
  ]) {
    test(`${fall.name} behaelt ${fall.breite}px (${fall.grund})`, async ({ page }) => {
      const m = await differenz(page, fall.route, fall.selektor);
      expect([m.schmal, m.weit], fall.selektor).toEqual([fall.breite, fall.breite]);
    });
  }

  test('Fliesstext folgt seinem Mass, nicht der Seite', async ({ page }) => {
    // CLAUDE.md, "Fliesstext ist hoechstens measure breit". Der Lead des Hero
    // steht bei 52ch, die Antwort einer Frage bei --measure: beide haben ihre
    // eigene Grenze und hoeren dort auf, waehrend ihre Spalte weiterwaechst.
    const lead = await differenz(page, 'muster/startseite', '.z-hero__lead');
    const titel = await differenz(page, 'muster/startseite', '.z-hero__title');
    expect(titel.delta, 'die Spalte des Hero waechst mit').toBeGreaterThan(0);
    expect(lead.weit, `.z-hero__lead: ${lead.schmal} -> ${lead.weit}`).toBe(lead.kappe);
    expect(lead.weit, 'der Lead bleibt schmaler als seine Spalte').toBeLessThan(titel.weit);

    // Die Antwort ist schon bei 1120px an ihrer Grenze und ruehrt sich nicht.
    const antwort = await differenz(page, 'werkzeuge', '.z-faq__body');
    expect(antwort.delta, `.z-faq__body: ${antwort.schmal} -> ${antwort.weit}`).toBe(0);
    expect(antwort.weit, '.z-faq__body steht auf --measure').toBe(antwort.kappe);
  });
});

test('die Breitenwahl der Demo schreibt --container', async ({ page }) => {
  await seiteOeffnen(page, 'grundlage', BREIT);
  await page.locator('#theme-breite').selectOption(String(BREIT));
  await expect
    .poll(() =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--container').trim(),
      ),
    )
    .toBe(`${BREIT}px`);

  // Zurueck auf die Voreinstellung, damit die Wahl nichts hinterlaesst.
  await page.locator('#theme-breite').selectOption('1120');
  await expect
    .poll(() =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--container').trim(),
      ),
    )
    .toBe('1120px');
});
