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
 * Checks of the example application: the same rules as for the demo, once per
 * state of the page "Gameserver" and once per colour scheme, plus the page
 * "Einbindung", the code display and the interactions (toast after a restart,
 * dialog before a delete, row actions on a phone, theme control).
 *
 * Runs through playwright.beispiel.config.ts, because the application sits on
 * a port of its own and is built against dist/zenit-ui.
 */
const ZUSTAENDE = ['normal', 'laden', 'leer', 'fehler'] as const;
type Zustand = (typeof ZUSTAENDE)[number];

/** The two schemes next to the dark one, which is the default. */
const SCHEMATA = ['light', 'contrast'] as const;

/** The normal case needs no parameter; `?zustand=` fetches the other states. */
const route = (zustand: Zustand) =>
  zustand === 'normal' ? 'gameserver' : `gameserver?zustand=${zustand}`;

/** The building block that tells the state apart. */
const BAUSTEIN: Record<Zustand, string> = {
  normal: '.z-row__title',
  laden: '.z-skel',
  leer: '.z-empty',
  fehler: '.z-alert',
};

/**
 * Stores the choice that `provideZenitTheme` reads at startup. It has to run
 * before the first `goto`, and proves on the way that the storage is read.
 */
async function schemaVorgeben(page: Page, schema: string): Promise<void> {
  await page.addInitScript(
    (wert) => {
      window.localStorage.setItem('zenit-theme', wert);
    },
    JSON.stringify({ scheme: schema, accent: 'rot' }),
  );
}

/** Opens the page and waits until the simulated load is through. */
async function beispielOeffnen(page: Page, zustand: Zustand, breite: number, hoehe = 900) {
  await seiteOeffnen(page, route(zustand), breite, hoehe);
  await page.locator(BAUSTEIN[zustand]).first().waitFor();
}

for (const zustand of ZUSTAENDE) {
  test.describe(zustand, () => {
    for (const breite of [1440, 375]) {
      test(`screenshot at ${breite}px`, async ({ page }) => {
        await beispielOeffnen(page, zustand, breite);
        await expect(page).toHaveScreenshot(`beispiel-${zustand}-${breite}.png`, {
          fullPage: true,
        });
      });
    }

    test('axe without violations', async ({ page }) => {
      await beispielOeffnen(page, zustand, 1440);
      await pruefeAxe(page, `/${route(zustand)}`);
    });

    test('no horizontal scrolling at 360px', async ({ page }) => {
      await beispielOeffnen(page, zustand, 360, 800);
      await pruefeKeinScrollen(page, `/${route(zustand)}`);
    });

    test('style rules in the computed style', async ({ page }) => {
      await beispielOeffnen(page, zustand, 1440);
      await pruefeStilRegeln(page, `/${route(zustand)}`);
    });

    test('focus ring on every tab stop', async ({ page }) => {
      await beispielOeffnen(page, zustand, 1440);
      await pruefeFokusRing(page, `/${route(zustand)}`);
    });

    test('touch targets at 375px', async ({ page }) => {
      await beispielOeffnen(page, zustand, 375, 800);
      await pruefeKlickziele(page, `/${route(zustand)}`);
    });
  });
}

/*
 * The schemes of themes.css change every colour value, so contrast, focus ring
 * and the style rules are measured once per scheme. The dark case is already
 * covered by the runs above.
 */
for (const schema of SCHEMATA) {
  test.describe(`normal in ${schema}`, () => {
    test.beforeEach(async ({ page }) => {
      await schemaVorgeben(page, schema);
    });

    test('screenshot at 1440px', async ({ page }) => {
      await beispielOeffnen(page, 'normal', 1440);
      await expect(page.locator('html')).toHaveAttribute('data-theme', schema);
      await expect(page).toHaveScreenshot(`beispiel-normal-${schema}-1440.png`, { fullPage: true });
    });

    test('axe without violations', async ({ page }) => {
      await beispielOeffnen(page, 'normal', 1440);
      await pruefeAxe(page, `/gameserver (${schema})`);
    });

    test('style rules in the computed style', async ({ page }) => {
      await beispielOeffnen(page, 'normal', 1440);
      await pruefeStilRegeln(page, `/gameserver (${schema})`);
    });

    test('focus ring on every tab stop', async ({ page }) => {
      await beispielOeffnen(page, 'normal', 1440);
      await pruefeFokusRing(page, `/gameserver (${schema})`);
    });
  });
}

test.describe('einbindung', () => {
  /** The page is ready as soon as the first code block stands. */
  async function einbindungOeffnen(page: Page, breite: number, hoehe = 900) {
    await seiteOeffnen(page, 'einbindung', breite, hoehe);
    await page.locator('.app-code__text').first().waitFor();
  }

  for (const breite of [1440, 375]) {
    test(`screenshot at ${breite}px`, async ({ page }) => {
      await einbindungOeffnen(page, breite);
      await expect(page).toHaveScreenshot(`beispiel-einbindung-${breite}.png`, { fullPage: true });
    });
  }

  test('axe without violations', async ({ page }) => {
    await einbindungOeffnen(page, 1440);
    await pruefeAxe(page, '/einbindung');
  });

  test('no horizontal scrolling at 360px', async ({ page }) => {
    await einbindungOeffnen(page, 360, 800);
    await pruefeKeinScrollen(page, '/einbindung');
  });

  test('style rules in the computed style', async ({ page }) => {
    await einbindungOeffnen(page, 1440);
    await pruefeStilRegeln(page, '/einbindung');
  });

  test('focus ring on every tab stop', async ({ page }) => {
    await einbindungOeffnen(page, 1440);
    await pruefeFokusRing(page, '/einbindung');
  });

  test('touch targets at 375px', async ({ page }) => {
    await einbindungOeffnen(page, 375, 800);
    await pruefeKlickziele(page, '/einbindung');
  });

  test('shows the real source of the application', async ({ page }) => {
    await einbindungOeffnen(page, 1440);

    // Anchors from the real files: tsconfig, angular.json and app.config.ts.
    await expect(page.locator('.app-code__text').first()).toContainText('dist/zenit-ui');
    await expect(
      page.locator('.app-code__text', { hasText: 'dist/zenit-ui/styles/themes.css' }),
    ).toHaveCount(1);
    await expect(
      page.locator('.app-code__text', {
        hasText: "provideZenitTheme({ defaultScheme: 'system' })",
      }),
    ).toHaveCount(1);
  });
});

test.describe('code display on the Gameserver page', () => {
  /** Opens the first disclosure; it is closed when the page loads. */
  async function offenlegungOeffnen(page: Page, breite: number) {
    await beispielOeffnen(page, 'normal', breite);
    const offenlegung = page.locator('details.app-code-faq').first();
    await expect(offenlegung).not.toHaveAttribute('open', /.*/);
    await offenlegung.locator('summary').click();
    await expect(offenlegung.locator('.app-code__text')).toBeVisible();
    return offenlegung;
  }

  for (const breite of [1440, 375]) {
    test(`screenshot with the code open at ${breite}px`, async ({ page }) => {
      await offenlegungOeffnen(page, breite);
      await expect(page).toHaveScreenshot(`beispiel-code-offen-${breite}.png`, { fullPage: true });
    });
  }

  test('copies the code and reports it as a toast', async ({ page }) => {
    const offenlegung = await offenlegungOeffnen(page, 1440);

    await offenlegung.getByRole('button', { name: /kopieren/ }).click();

    await expect(page.locator('.z-toast')).toHaveText(/Code kopiert/);
  });
});

test.describe('theme control', () => {
  test('sets the scheme and keeps it across a reload', async ({ page }) => {
    await beispielOeffnen(page, 'normal', 1440);

    await page.getByRole('button', { name: /Farbschema wählen/ }).click();
    await page.getByRole('menuitem', { name: 'Hell' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.getByRole('button', { name: /Akzentfarbe wählen/ }).click();
    await page.getByRole('menuitem', { name: 'Blau' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-accent', 'blau');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('html')).toHaveAttribute('data-accent', 'blau');
  });
});

test.describe('actions of a row', () => {
  /** The row menu of the first row, a tab stop of its own next to the row. */
  const menueKnopf = (page: Page) =>
    page.getByRole('button', { name: 'Weitere Aktionen für Beispiel-Server 1' });

  test('a restart reports itself as a toast', async ({ page }) => {
    await beispielOeffnen(page, 'normal', 1440);

    await menueKnopf(page).click();
    await page.getByRole('menuitem', { name: 'Neustart' }).click();

    const toast = page.locator('.z-toast');
    await expect(toast).toHaveText(/Neustart für Beispiel-Server 1 gestartet/);
    // No alert: a transient message is a toast (Toast README).
    await expect(page.locator('.z-alert')).toHaveCount(0);
  });

  test('a delete asks for the server name and gives the focus back', async ({ page }) => {
    await beispielOeffnen(page, 'normal', 1440);

    await menueKnopf(page).click();
    await page.getByRole('menuitem', { name: 'Server löschen' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Server "Beispiel-Server 1" löschen?');
    const bestaetigen = dialog.getByRole('button', { name: 'Löschen', exact: true });
    await expect(bestaetigen).toBeDisabled();

    // A wrong name is not enough; only the exact name enables the button.
    const feld = dialog.getByRole('textbox');
    await feld.fill('Beispiel-Server');
    await expect(bestaetigen).toBeDisabled();
    await feld.fill('Beispiel-Server 1');
    await expect(bestaetigen).toBeEnabled();

    await dialog.getByRole('button', { name: 'Abbrechen' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    // Focus returns to the trigger and the server is still in the list.
    await expect(menueKnopf(page)).toBeFocused();
    await expect(page.locator('.z-row__title').first()).toHaveText('Beispiel-Server 1');
  });

  test('gives the focus back to the trigger on Escape, from the keyboard', async ({ page }) => {
    await beispielOeffnen(page, 'normal', 1440);

    // The whole path without a mouse: open the menu, run the entry, leave the
    // dialog. The mouse path is the test above.
    await menueKnopf(page).press('Enter');
    await page.getByRole('menuitem', { name: 'Server löschen' }).press('Enter');
    await expect(page.getByRole('dialog')).toHaveCount(1);
    await page.keyboard.press('Escape');

    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(menueKnopf(page)).toBeFocused();
  });

  test('moves the focus to the next row after a confirmed delete', async ({ page }) => {
    await beispielOeffnen(page, 'normal', 1440);

    await menueKnopf(page).click();
    await page.getByRole('menuitem', { name: 'Server löschen' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox').fill('Beispiel-Server 1');
    await dialog.getByRole('button', { name: 'Löschen', exact: true }).click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    // The trigger went with its row, so the focus takes the row that moved up
    // instead of falling to <body>.
    await expect(
      page.getByRole('button', { name: 'Weitere Aktionen für Beispiel-Server 2' }),
    ).toBeFocused();
    await expect(page.locator('.z-row__title').first()).toHaveText('Beispiel-Server 2');
  });

  test('stays on page two when a server is deleted there', async ({ page }) => {
    await beispielOeffnen(page, 'normal', 1440);

    await page.getByRole('button', { name: 'Nächste Seite' }).click();
    await expect(page.locator('.z-pager__nav .z-mono')).toHaveText('2 / 2');
    const zweiteSeite = page.getByRole('button', {
      name: 'Weitere Aktionen für Beispiel-Server 7',
    });

    await zweiteSeite.click();
    await page.getByRole('menuitem', { name: 'Server löschen' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox').fill('Beispiel-Server 7');
    await dialog.getByRole('button', { name: 'Löschen', exact: true }).click();

    // Seven servers still need two pages, so the reader stays where they were.
    await expect(page.locator('.z-pager__nav .z-mono')).toHaveText('2 / 2');
    await expect(page.locator('.z-row__title')).toHaveText(['Beispiel-Server 6']);
  });
});

test.describe('the loading state', () => {
  /** The live region of the list, next to the two of the toast outlet. */
  const meldung = (page: Page) => page.locator('app-server-list [role="status"]');

  test('announces that the servers are loading', async ({ page }) => {
    await beispielOeffnen(page, 'normal', 1440);
    // The region stands in every state, so its text is what gets announced.
    await expect(meldung(page)).toHaveCount(1);
    await expect(meldung(page)).toHaveText('');

    await beispielOeffnen(page, 'laden', 1440);
    await expect(meldung(page)).toHaveText('Server werden geladen');
  });
});

test.describe('a row on a phone', () => {
  /** Same trigger as above, but at 375px, where the reference hid it. */
  const menueKnopf = (page: Page) =>
    page.getByRole('button', { name: 'Weitere Aktionen für Beispiel-Server 1' });

  test('keeps the row menu visible, 40px high and usable at 375px', async ({ page }) => {
    await beispielOeffnen(page, 'normal', 375, 800);

    const knopf = menueKnopf(page);
    await expect(knopf).toBeVisible();
    const flaeche = await knopf.boundingBox();
    expect(flaeche?.height ?? 0).toBeGreaterThanOrEqual(40);

    await knopf.click();
    await expect(page.getByRole('menuitem', { name: 'Adresse kopieren' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Server löschen' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(knopf).toBeFocused();
  });

  test('follows the row link at 375px', async ({ page }) => {
    await beispielOeffnen(page, 'normal', 375, 800);

    const zeilenLink = page.getByRole('link', { name: 'Beispiel-Server 1' });
    await expect(zeilenLink).toBeVisible();
    await zeilenLink.click();

    await expect(page.locator('.z-toast')).toHaveText(/Beispiel-Server 1/);
  });

  test('shows the address of a row in the mono face', async ({ page }) => {
    await beispielOeffnen(page, 'normal', 375, 800);

    const adresse = page.locator('.z-row__meta .z-mono').first();
    await expect(adresse).toHaveText('203.0.113.10:25565');
    await expect(adresse).toHaveCSS('font-family', /JetBrains Mono/);
  });
});
