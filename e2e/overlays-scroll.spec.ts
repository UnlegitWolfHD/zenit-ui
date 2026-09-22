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

/**
 * Waits until an open menu has armed its closing. `z-menu` ignores the scroll
 * that was still running when it opened and arms itself at the `scrollend` of
 * the browser or after two animation frames without a scroll event.
 */
async function zurRuhe(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((fertig) => {
        let offen = 3;
        const schritt = (): void => (offen-- ? requestAnimationFrame(schritt) : fertig());
        requestAnimationFrame(schritt);
      }),
  );
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
      await zurRuhe(page);
      await rumpfScrollen(page, 200);
      await expect(page.getByRole('menu'), 'das Menü schließt beim Scrollen').toHaveCount(0);
      await expect(menuKnopf, 'der Fokus steht wieder auf dem Auslöser').toBeFocused();
      await expect(page.getByRole('dialog'), 'der Dialog bleibt offen').toBeVisible();
    });

    test('Escape closes the long dialog and focus returns to the trigger', async ({ page }) => {
      await langerDialog(page, sicht.breite, sicht.hoehe);
      // The dialog puts the focus on the first tabbable element, which is the
      // tooltip trigger, so the first Escape belongs to the tooltip.
      await expect(page.getByRole('tooltip')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('tooltip')).toHaveCount(0);

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
    await zurRuhe(page);

    await page.mouse.wheel(0, 300);
    await expect(page.getByRole('menu')).toHaveCount(0);
  });
});

/**
 * Only the scroller an overlay hangs in counts. The console follows its own log
 * on every new line (`console.ts`), and in a real server panel that happens
 * every second: nothing of it may reach a menu or a tooltip in the page header.
 */
test.describe('another scroller on the same screen', () => {
  /**
   * Sends a few commands, so the log is longer than its box. Every line is one
   * the server could have sent; the component scrolls to the end by itself.
   */
  async function logFuellen(page: Page): Promise<void> {
    const eingabe = page.getByRole('textbox', { name: 'Befehl' });
    for (let nummer = 1; nummer <= 8; nummer++) {
      await eingabe.fill(`say Zeile ${nummer}`);
      await eingabe.press('Enter');
    }
    const masse = await page.locator('.z-console__log').evaluate((el) => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }));
    expect(masse.scrollHeight, 'das Log ist länger als sein Kasten').toBeGreaterThan(
      masse.clientHeight,
    );
  }

  /** Scrolls the console log the way a new line does, and waits for the event. */
  async function logScrollen(page: Page): Promise<void> {
    await page.locator('.z-console__log').evaluate(
      (el) =>
        new Promise<void>((fertig) => {
          el.addEventListener('scroll', () => requestAnimationFrame(() => fertig()), {
            once: true,
          });
          el.scrollTop = el.scrollTop === 0 ? el.scrollHeight : 0;
        }),
    );
  }

  test('a scrolling console leaves an open menu and a hovered tooltip alone', async ({ page }) => {
    await seite(page, 'muster/server-panel', 1440, 700);
    await page.getByRole('button', { name: 'Konsole' }).click();
    await expect(page.locator('.z-console__log')).toBeVisible();
    await logFuellen(page);

    const ausloeser = page.getByRole('button', { name: 'Weitere Aktionen' }).first();
    await ausloeser.click();
    await expect(page.getByRole('menu')).toBeVisible();
    await zurRuhe(page);

    await logScrollen(page);
    await expect(page.getByRole('menu'), 'das Menü bleibt offen').toBeVisible();

    // The same menu does close on a scroll of the page, which the trigger sits
    // in: the difference is the container, not the arming.
    await page.mouse.wheel(0, 200);
    await expect(page.getByRole('menu')).toHaveCount(0);

    const kopieren = page.getByRole('button', { name: 'Adresse kopieren' }).first();
    await kopieren.hover();
    await expect(page.getByRole('tooltip')).toBeVisible();

    await logScrollen(page);
    await expect(page.getByRole('tooltip'), 'der Tooltip bleibt stehen').toBeVisible();
  });
});

/**
 * A trigger reached with the keyboard is scrolled into view, and with smooth
 * scrolling those events arrive for about a second after the overlay has
 * opened. Neither the tooltip nor the menu may fall over that.
 */
test.describe('an overlay opened while the trigger is still being scrolled', () => {
  test.use({ reducedMotion: 'no-preference' });

  /**
   * Long dialog with a smoothly scrolling body, focus in the first field and
   * the body sent to its end: from here every move of the focus starts a
   * smooth scroll of some 700px, the way Shift+Tab does on a real screen.
   * Focus comes first, because Playwright scrolls to an element instantly
   * before it touches it and would skip the animation.
   */
  async function amEnde(page: Page): Promise<void> {
    await langerDialog(page, 1440, 700);
    await page.addStyleTag({ content: '.z-dialog__body { scroll-behavior: smooth; }' });
    await page.getByRole('textbox', { name: 'Servername' }).focus();
    await rumpf(page).evaluate((el) => (el.scrollTop = el.scrollHeight));
  }

  test('the tooltip of the trigger stands once the scrolling has come to rest', async ({
    page,
  }) => {
    await amEnde(page);

    // Three steps back: the field above, the menu trigger, then the tooltip
    // trigger at the very top of the body, which the browser scrolls into view.
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab');
    const hinweis = page.getByRole('button', { name: 'Hinweis zur Welt' });
    await expect(hinweis).toBeFocused();
    await expect(page.getByRole('tooltip')).toBeVisible();

    // And it goes with the trigger and comes back with it, as long as the
    // focus stays where it is (WCAG 2.1 SC 1.4.13).
    await rumpf(page).evaluate((el) => (el.scrollTop = 200));
    await expect(page.getByRole('tooltip')).toHaveCount(0);
    await rumpf(page).evaluate((el) => (el.scrollTop = 0));
    await expect(hinweis).toBeFocused();
    await expect(page.getByRole('tooltip')).toBeVisible();
  });

  test('a menu opened while the page is still scrolling stays open', async ({ page }) => {
    // The phone layout, because its page is long enough for a smooth scroll
    // that lasts: 2000px take the better part of a second.
    await seite(page, 'muster/server-panel', 375, 667);
    const ausloeser = page.getByRole('button', { name: 'Weitere Aktionen' }).first();
    await ausloeser.focus();

    // A smooth scroll of the page, the kind the browser runs when a trigger is
    // reached with the keyboard. Enter opens the menu while it is running, and
    // the events of that scroll arrive for the next second.
    await page.evaluate(() => window.scrollTo({ top: 2000, behavior: 'smooth' }));
    await page.keyboard.press('Enter');

    await expect(page.getByRole('menu')).toBeVisible();
    await page.waitForTimeout(1200);
    await expect(page.getByRole('menu'), 'auch nach dem Scrollen noch offen').toBeVisible();

    // And once the page lies still, the next scroll closes it as it should.
    // Upwards, because the smooth scroll has already run to the end of the
    // page, and with the pointer over the page, which it has not touched yet.
    await page.mouse.move(180, 400);
    await page.mouse.wheel(0, -200);
    await expect(page.getByRole('menu')).toHaveCount(0);
  });
});

test.describe('Escape in the long dialog', () => {
  test('the first Escape takes the menu, the second the dialog', async ({ page }) => {
    await langerDialog(page, 1440, 700);
    const menuKnopf = page.getByRole('button', { name: 'Aktionen für Welt 1' });
    await menuKnopf.click();
    await expect(page.getByRole('menu')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(page.getByRole('dialog'), 'der Dialog steht noch').toBeVisible();
    await expect(menuKnopf).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('the first Escape takes the tooltip, the second the dialog', async ({ page }) => {
    await langerDialog(page, 1440, 700);
    await page.getByRole('button', { name: 'Hinweis zur Welt' }).focus();
    await expect(page.getByRole('tooltip')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('tooltip')).toHaveCount(0);
    await expect(page.getByRole('dialog'), 'der Dialog steht noch').toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});

/**
 * Two scrollers inside each other. The tooltip may only come back when the
 * trigger is visible in every one of them, not just in the one that moved.
 */
test.describe('nested scrollers', () => {
  test('the panel stays away while the inner container still covers the trigger', async ({
    page,
  }) => {
    await langerDialog(page, 1440, 700);
    // The dialog itself becomes a scroller around the scrolling body.
    await page.addStyleTag({
      content:
        '.z-dialog-panel .z-dialog { max-height: 320px; overflow: auto; }' +
        '.z-dialog-panel .z-dialog__body { height: 600px; max-height: none; flex: none; }',
    });
    const karteEl = karte(page);
    const hinweis = page.getByRole('button', { name: 'Hinweis zur Welt' });
    await hinweis.focus();
    await expect(page.getByRole('tooltip')).toBeVisible();

    // Just far enough: the trigger sits above the top edge of the body and
    // still inside the box of the card around it. Asking only the scroller of
    // the event would call it visible.
    await rumpf(page).evaluate((el) => (el.scrollTop = 60));
    await expect(page.getByRole('tooltip')).toHaveCount(0);
    const lage = await page.evaluate(() => {
      const knopf = document
        .querySelector('.cdk-overlay-container button[aria-label="Hinweis zur Welt"]')!
        .getBoundingClientRect();
      const rumpfKasten = document
        .querySelector('.cdk-overlay-container .z-dialog__body')!
        .getBoundingClientRect();
      const karteKasten = document
        .querySelector('.cdk-overlay-container .z-dialog')!
        .getBoundingClientRect();
      return { knopf: knopf.bottom, rumpf: rumpfKasten.top, karte: karteKasten.top };
    });
    expect(lage.knopf, 'der Auslöser steht über der Kante des Rumpfs').toBeLessThanOrEqual(
      lage.rumpf,
    );
    expect(lage.knopf, 'und noch im Kasten der Karte').toBeGreaterThan(lage.karte);

    // The outer scroller moves a little: the trigger is still behind the top
    // edge of the body, so the panel has to stay away. Asked after a moment,
    // because a panel that comes back needs a frame to do it.
    await karteEl.evaluate((el) => (el.scrollTop = 5));
    await page.waitForTimeout(200);
    await expect(page.getByRole('tooltip'), 'kommt nicht zurück').toHaveCount(0);

    // Back in the body, and it is there again.
    await rumpf(page).evaluate((el) => (el.scrollTop = 0));
    await expect(page.getByRole('tooltip')).toBeVisible();
  });
});

/**
 * The tooltip writes its id into `aria-describedby` of the trigger, and the
 * caller writes that attribute too: a `z-field` links its error there on every
 * keystroke. Answering that write with another one freezes the tab, because
 * Chromium queues a mutation record even for an unchanged value, so the
 * observer would call itself for as long as the page lives. jsdom cannot show
 * that; this runs in the browser and fails fast instead of hanging the suite.
 */
test.describe('aria-describedby while the tooltip stands', () => {
  test.setTimeout(30_000);

  /** Does the page still run timers? Returns false when it does not answer. */
  async function antwortet(page: Page): Promise<boolean> {
    return page.evaluate(
      () =>
        new Promise<boolean>((fertig) => {
          setTimeout(() => fertig(true), 50);
        }),
      { timeout: 1000 },
    );
  }

  test('the field writes its error and the page keeps running', async ({ page }) => {
    await langerDialog(page, 1440, 700);
    const feld = page.getByRole('textbox', { name: 'Anzeigename' });
    await feld.focus();
    await expect(page.getByRole('tooltip')).toBeVisible();
    const panelId = await page.getByRole('tooltip').getAttribute('id');

    // One keystroke: the error appears and z-field rewrites aria-describedby.
    await feld.pressSequentially('a');
    await expect(page.getByText('Mindestens 3 Zeichen')).toBeVisible();

    expect(await antwortet(page), 'die Seite antwortet noch').toBe(true);
    const werte = (await feld.getAttribute('aria-describedby'))?.split(/\s+/) ?? [];
    expect(werte, 'Fehlertext und Tooltip stehen beide da').toEqual([
      'demo-lang-anzeige-error',
      panelId,
    ]);
  });

  test('a caller that clears the attribute costs at most four mutations', async ({ page }) => {
    await langerDialog(page, 1440, 700);
    const feld = page.getByRole('textbox', { name: 'Anzeigename' });
    await feld.focus();
    await expect(page.getByRole('tooltip')).toBeVisible();

    // Everything in one go in the page: a binding going to null is a
    // removeAttribute, and two seconds are counted afterwards.
    const messung = await page.evaluate(
      async () => {
        const el = document.querySelector('#demo-lang-anzeige') as HTMLElement;
        let zaehler = 0;
        const zaehlen = new MutationObserver((eintraege) => (zaehler += eintraege.length));
        zaehlen.observe(el, { attributes: true, attributeFilter: ['aria-describedby'] });
        el.removeAttribute('aria-describedby');
        await new Promise((fertig) => setTimeout(fertig, 2000));
        zaehlen.disconnect();
        return { zaehler, wert: el.getAttribute('aria-describedby') };
      },
      { timeout: 10_000 },
    );

    expect(messung.zaehler, 'zwei Sekunden, ein paar Mutationen').toBeLessThanOrEqual(4);
    expect(messung.wert, 'die id des Panels steht wieder da').toMatch(/^z-tooltip-\d+$/);
    expect(await antwortet(page), 'die Seite antwortet noch').toBe(true);
  });

  /**
   * Three writers on the same attribute: the caller with an id of its own, the
   * `z-field` with its hint and its error, and the tooltip with the id of its
   * panel. Each of them owns one token. The field keeps the front of the list,
   * the tooltip the back, so no two of them push each other around, and the
   * caller's token stands in between and is never touched.
   */
  test('caller, field and tooltip hold their token through hint, error and none', async ({
    page,
  }) => {
    await langerDialog(page, 1440, 700);
    const feld = page.getByRole('textbox', { name: 'Anzeigename' });
    await feld.focus();
    await expect(page.getByRole('tooltip')).toBeVisible();
    const panelId = (await page.getByRole('tooltip').getAttribute('id'))!;

    /** The caller writes its own description, the way a binding of its own does. */
    await page.evaluate(() =>
      document.querySelector('#demo-lang-anzeige')!.setAttribute('aria-describedby', 'p-fremd'),
    );

    async function ids(): Promise<string[]> {
      return ((await feld.getAttribute('aria-describedby')) ?? '').split(/\s+/).filter(Boolean);
    }

    // The caller wiped both foreign tokens; they come back around its own.
    await expect
      .poll(ids, { message: 'der Tooltip steht wieder da' })
      .toEqual(['p-fremd', panelId]);

    // One character: the error appears.
    await feld.pressSequentially('a');
    await expect(page.getByText('Mindestens 3 Zeichen')).toBeVisible();
    await expect
      .poll(ids, { message: 'Fehler vorn, Tooltip hinten' })
      .toEqual(['demo-lang-anzeige-error', 'p-fremd', panelId]);

    // Two more: the error gives way to the hint, and only that token changes.
    await feld.pressSequentially('bc');
    await expect(page.getByText('3 von 32 Zeichen')).toBeVisible();
    await expect
      .poll(ids, { message: 'der Hinweis löst den Fehler ab' })
      .toEqual(['demo-lang-anzeige-hint', 'p-fremd', panelId]);

    // And back to nothing: the field takes its own token and nothing else.
    await feld.press('Control+a');
    await feld.press('Backspace');
    await expect(page.getByText('3 von 32 Zeichen')).toHaveCount(0);
    await expect
      .poll(ids, { message: 'nur noch Aufrufer und Tooltip' })
      .toEqual(['p-fremd', panelId]);

    expect(await antwortet(page), 'die Seite antwortet noch').toBe(true);
  });

  /**
   * The same cycle, counted: every step costs a handful of mutations and then
   * stops. A writer that answers its own record would count into the thousands
   * here instead of hanging the test only on the timeout.
   */
  test('the whole cycle costs a bounded number of mutations', async ({ page }) => {
    await langerDialog(page, 1440, 700);
    const feld = page.getByRole('textbox', { name: 'Anzeigename' });
    await feld.focus();
    await expect(page.getByRole('tooltip')).toBeVisible();

    await page.evaluate(() => {
      const el = document.querySelector('#demo-lang-anzeige')!;
      const fenster = window as unknown as { zaehler: number };
      fenster.zaehler = 0;
      new MutationObserver((eintraege) => (fenster.zaehler += eintraege.length)).observe(el, {
        attributes: true,
        attributeFilter: ['aria-describedby'],
      });
    });

    await feld.pressSequentially('abc');
    await expect(page.getByText('3 von 32 Zeichen')).toBeVisible();
    await feld.press('Control+a');
    await feld.press('Backspace');
    await expect(page.getByText('3 von 32 Zeichen')).toHaveCount(0);
    await page.waitForTimeout(1000);

    const zaehler = await page.evaluate(() => (window as unknown as { zaehler: number }).zaehler, {
      timeout: 10_000,
    });

    expect(zaehler, 'vier Tastendrücke, keine Schleife').toBeLessThanOrEqual(20);
    expect(await antwortet(page), 'die Seite antwortet noch').toBe(true);
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
