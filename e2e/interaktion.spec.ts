import { expect, test, type Page } from '@playwright/test';
import { pruefeAxe } from './pruefungen';

/**
 * Real browser interaction, keyboard first. Every test drives the demo app the
 * way a person would: Tab, Enter, Space, arrow keys, hover and click.
 *
 * Only relative URLs are used, so this file also passes when it is picked up by
 * the default config on another port.
 *
 * Findings that describe a real bug are marked with `// Finding:` above the
 * test and stay active.
 */

/** Opens a demo route and waits for its heading. */
async function seite(page: Page, route: string): Promise<void> {
  await page.goto(`/${route}`);
  await page.locator('main h1').first().waitFor();
}

test.describe('Skip link and demo navigation', () => {
  test('the first Tab reaches the skip link and Enter moves focus into main', async ({ page }) => {
    await seite(page, 'grundlage');
    const skip = page.getByRole('link', { name: 'Zum Hauptinhalt springen' });

    await page.keyboard.press('Tab');
    await expect(skip).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(page.locator('main#inhalt')).toBeFocused();
  });

  test('the active route link carries aria-current="page"', async ({ page }) => {
    await seite(page, 'overlays');
    const nav = page.getByRole('navigation', { name: 'Demo-Seiten' });

    await expect(nav.getByRole('link', { name: 'Overlays' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(nav.getByRole('link', { name: 'Daten' })).not.toHaveAttribute(
      'aria-current',
      /.*/,
    );
  });
});

test.describe('Dialog on /overlays', () => {
  /**
   * The page also shows a static copy of the dialog and of the menu, so the
   * same labels exist more than once. The live trigger is always the first
   * match in document order.
   */
  const ausloeser = (page: Page) =>
    page.getByRole('button', { name: 'Server löschen', exact: true }).first();

  test('the destructive confirm opens by keyboard with focus in the text field', async ({
    page,
  }) => {
    await seite(page, 'overlays');
    await ausloeser(page).focus();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    // The accessible name comes from the dialog title.
    await expect(page.getByRole('dialog', { name: 'Server "Test" löschen?' })).toBeVisible();
    await expect(
      dialog.getByRole('textbox', { name: 'Gib zur Bestätigung den Servernamen ein' }),
    ).toBeFocused();
  });

  test('Tab cycles only inside the dialog', async ({ page }) => {
    await seite(page, 'overlays');
    await ausloeser(page).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Confirm is disabled at this point, so the cycle is field -> cancel -> field.
    for (let schritt = 0; schritt < 4; schritt++) {
      await page.keyboard.press('Tab');
      await expect
        .poll(() => page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')))
        .toBe(true);
    }
  });

  test('confirm stays disabled until the exact server name is typed', async ({ page }) => {
    await seite(page, 'overlays');
    await ausloeser(page).click();

    const dialog = page.getByRole('dialog');
    const feld = dialog.getByRole('textbox', {
      name: 'Gib zur Bestätigung den Servernamen ein',
    });
    const bestaetigen = dialog.getByRole('button', { name: 'Server löschen' });

    await expect(bestaetigen).toBeDisabled();
    await feld.pressSequentially('Tes');
    await expect(bestaetigen).toBeDisabled();
    await feld.pressSequentially('t');
    await expect(bestaetigen).toBeEnabled();

    await bestaetigen.click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText('Server löschen: Bestätigt')).toBeVisible();
  });

  test('Escape closes the dialog, returns focus to the trigger and reports cancelled', async ({
    page,
  }) => {
    await seite(page, 'overlays');
    const knopf = ausloeser(page);
    await knopf.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(knopf).toBeFocused();
    await expect(page.getByText('Server löschen: Abgebrochen')).toBeVisible();
  });

  test('a click next to the dialog closes it as cancelled', async ({ page }) => {
    await seite(page, 'overlays');
    await ausloeser(page).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // The backdrop has no role; the dialog sits in the middle, so click a corner.
    await page.locator('.cdk-overlay-backdrop').click({ position: { x: 5, y: 5 } });
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText('Server löschen: Abgebrochen')).toBeVisible();
  });

  test('the simple confirm puts focus on the cancel button first', async ({ page }) => {
    await seite(page, 'overlays');
    await page.getByRole('button', { name: 'Hart beenden', exact: true }).first().click();

    const dialog = page.getByRole('dialog', { name: 'Beispiel-Server 1 hart beenden?' });
    await expect(dialog.getByRole('button', { name: 'Abbrechen' })).toBeFocused();

    await dialog.getByRole('button', { name: 'Hart beenden' }).click();
    await expect(page.getByText('Hart beenden: Bestätigt')).toBeVisible();
  });

  test('the custom dialog opens and closes through its own actions', async ({ page }) => {
    await seite(page, 'overlays');
    await page.getByRole('button', { name: 'Notiz bearbeiten' }).click();

    const dialog = page.getByRole('dialog', { name: 'Notiz zu Beispiel-Server 1' });
    const feld = dialog.getByRole('textbox', { name: 'Notiz' });
    await expect(feld).toBeFocused();
    await feld.pressSequentially('Plugin entfernt');

    await dialog.getByRole('button', { name: 'Notiz speichern' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText('Notiz gespeichert: Plugin entfernt')).toBeVisible();
  });
});

test.describe('Menu on /overlays', () => {
  const ausloeser = (page: Page) => page.getByRole('button', { name: 'Weitere Aktionen' });
  const eintrag = (page: Page, name: string) => page.getByRole('menuitem', { name });

  for (const taste of ['Enter', 'Space', 'ArrowDown']) {
    test(`${taste} on the trigger opens the menu with the first item focused`, async ({ page }) => {
      await seite(page, 'overlays');
      await ausloeser(page).focus();
      await page.keyboard.press(taste);

      await expect(page.getByRole('menu')).toBeVisible();
      await expect(eintrag(page, 'Adresse kopieren')).toBeFocused();
    });
  }

  test('arrow keys, Home, End and typing a letter move the focus', async ({ page }) => {
    await seite(page, 'overlays');
    await ausloeser(page).focus();
    await page.keyboard.press('ArrowDown');

    await expect(eintrag(page, 'Adresse kopieren')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(eintrag(page, 'FTP-Zugang')).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(eintrag(page, 'Adresse kopieren')).toBeFocused();
    await page.keyboard.press('End');
    await expect(eintrag(page, 'Server löschen')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(eintrag(page, 'Adresse kopieren')).toBeFocused();

    // Typeahead: from the last item, "a" jumps back to "Adresse kopieren".
    await page.keyboard.press('End');
    await page.keyboard.press('a');
    await expect(eintrag(page, 'Adresse kopieren')).toBeFocused();
  });

  test('the disabled item can be focused but not activated', async ({ page }) => {
    await seite(page, 'overlays');
    await ausloeser(page).focus();
    await page.keyboard.press('ArrowDown');

    const gesperrt = eintrag(page, 'Zugriff teilen');
    await expect(gesperrt).toHaveAttribute('aria-disabled', 'true');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(gesperrt).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(page.getByRole('menu')).toBeVisible();
    await expect(page.getByText('Gewählter Eintrag: Zugriff teilen')).toHaveCount(0);
  });

  test('Enter on an item fires it, closes the menu and returns focus to the trigger', async ({
    page,
  }) => {
    await seite(page, 'overlays');
    await ausloeser(page).focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(eintrag(page, 'FTP-Zugang')).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(ausloeser(page)).toBeFocused();
    await expect(page.getByText('Gewählter Eintrag: FTP-Zugang')).toBeVisible();
  });

  test('Escape closes the menu and returns focus to the trigger', async ({ page }) => {
    await seite(page, 'overlays');
    await ausloeser(page).focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menu')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(ausloeser(page)).toBeFocused();
  });

  test('Tab closes the menu', async ({ page }) => {
    await seite(page, 'overlays');
    await ausloeser(page).focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menu')).toBeVisible();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('menu')).toHaveCount(0);
  });

  // Entries that lead somewhere are links. They keep the role and the keyboard
  // of an entry, and Enter follows the link instead of only closing the menu.
  test('Enter on a link entry navigates and closes the menu', async ({ page }) => {
    await seite(page, 'overlays');
    await page.getByRole('button', { name: 'Weitere Seiten' }).focus();
    await page.keyboard.press('ArrowDown');

    const daten = eintrag(page, 'Daten');
    await expect(daten).toBeFocused();
    await expect(daten).toHaveAttribute('href', '/daten');

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/daten$/);
    await expect(page.getByRole('menu')).toHaveCount(0);
  });

  // The CDK cancels the click of a locked entry, but RouterLink listens on the
  // same element and navigates regardless of defaultPrevented, so the menu has
  // to stop the click before the link ever sees it.
  test('a locked link entry leads nowhere, by click and by keyboard', async ({ page }) => {
    await seite(page, 'overlays');
    await page.getByRole('button', { name: 'Weitere Seiten' }).click();
    const gesperrt = eintrag(page, 'Rechnungen');

    await expect(gesperrt).toHaveAttribute('aria-disabled', 'true');
    // The address stays on the entry; only the click is swallowed.
    await expect(gesperrt).toHaveAttribute('href', '/daten');

    // force, because Playwright refuses to click what carries aria-disabled;
    // a visitor's mouse has no such scruples.
    await gesperrt.click({ force: true });
    await expect(page).toHaveURL(/\/overlays$/);
    await expect(page.getByRole('menu')).toBeVisible();

    await gesperrt.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');

    await expect(page).toHaveURL(/\/overlays$/);
    await expect(page.getByRole('menu')).toBeVisible();
  });

  test('Ctrl+click on a link entry opens a new tab and leaves the menu open', async ({
    page,
    context,
  }) => {
    await seite(page, 'overlays');
    await page.getByRole('button', { name: 'Weitere Seiten' }).click();
    const neuerTab = context.waitForEvent('page');

    await eintrag(page, 'Daten').click({ modifiers: ['ControlOrMeta'] });
    const tab = await neuerTab;
    await tab.waitForLoadState();

    expect(new URL(tab.url()).pathname).toBe('/daten');
    await expect(page, 'der eigene Tab bleibt stehen').toHaveURL(/\/overlays$/);
    await expect(page.getByRole('menu'), 'und das Menü bleibt offen').toBeVisible();
    await tab.close();
  });

  test('a link entry looks like a button entry, at rest and on hover', async ({ page }) => {
    await seite(page, 'overlays');
    await page.getByRole('button', { name: 'Weitere Seiten' }).click();
    const stil = (name: string) =>
      eintrag(page, name).evaluate((el) => {
        const s = getComputedStyle(el);
        return { color: s.color, dekoration: s.textDecorationLine, hoehe: s.height };
      });

    // Without the counter-rule `.z-root a` would colour the entry accent-text
    // and underline it on hover.
    expect(await stil('Daten')).toEqual(await stil('Link kopieren'));

    await eintrag(page, 'Daten').hover();
    expect((await stil('Daten')).dekoration).toBe('none');
    expect(await stil('Daten')).toEqual(await stil('Link kopieren'));

    await pruefeAxe(page, '/overlays mit offenem Link-Menü');
  });
});

test.describe('Tooltip on /rueckmeldung', () => {
  test('keyboard focus shows the tooltip, Escape hides it again', async ({ page }) => {
    await seite(page, 'rueckmeldung');
    const knopf = page.getByRole('button', { name: 'Aktualisieren' });

    await knopf.focus();
    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toHaveText('Aktualisieren');

    const id = await tooltip.getAttribute('id');
    expect(id).toBeTruthy();
    await expect(knopf).toHaveAttribute('aria-describedby', id ?? '');

    await page.keyboard.press('Escape');
    await expect(page.getByRole('tooltip')).toHaveCount(0);
    await expect(knopf).not.toHaveAttribute('aria-describedby', /.*/);
  });

  test('hovering shows the tooltip as well', async ({ page }) => {
    await seite(page, 'rueckmeldung');
    const knopf = page.getByRole('button', { name: 'Neustart', exact: true });

    await knopf.hover();
    await expect(page.getByRole('tooltip')).toHaveText(
      'Beispiel-Server 1 läuft seit 3 Tagen ohne Neustart',
    );
  });
});

test.describe('Toast on /rueckmeldung', () => {
  test('the success toast uses role="status" and disappears on its own', async ({ page }) => {
    await seite(page, 'rueckmeldung');
    await page.getByRole('button', { name: 'Erfolg zeigen' }).click();

    const toast = page.getByRole('status');
    await expect(toast).toContainText('Eigenschaften gespeichert');
    // 5 seconds by contract; wait generously instead of faking the clock.
    await expect(toast).toHaveCount(0, { timeout: 15_000 });
  });

  test('the error toast uses role="alert", stays and is removed by its close button', async ({
    page,
  }) => {
    await seite(page, 'rueckmeldung');
    await page.getByRole('button', { name: 'Fehler zeigen' }).click();

    const toast = page.getByRole('alert');
    await expect(toast).toContainText('Backup fehlgeschlagen: Speicher voll');
    await page.waitForTimeout(6_000);
    await expect(toast).toBeVisible();

    await toast.getByRole('button', { name: 'Schließen' }).click();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('at most three toasts are visible and "Alle schließen" removes all', async ({ page }) => {
    await seite(page, 'rueckmeldung');
    const zeigen = page.getByRole('button', { name: 'Dauerhaft zeigen' });
    for (let i = 0; i < 4; i++) {
      await zeigen.click();
    }

    await expect(page.getByRole('status').locator('.z-toast')).toHaveCount(3);
    await page.getByRole('button', { name: 'Alle schließen' }).click();
    await expect(page.getByRole('status').locator('.z-toast')).toHaveCount(0);
  });

  test('the toast action runs and closes its toast', async ({ page }) => {
    await seite(page, 'rueckmeldung');
    await page.getByRole('button', { name: 'Mit Aktion zeigen' }).click();

    const toast = page.getByRole('status').filter({ hasText: 'Eigenschaften gespeichert' });
    await toast.getByRole('button', { name: 'Rückgängig' }).click();

    await expect(page.getByRole('status')).toHaveCount(1);
    await expect(page.getByRole('status')).toContainText('Änderung zurückgenommen');
  });
});

test.describe('Forms on /formulare', () => {
  test('Space toggles checkbox and toggle and the shown model value follows', async ({ page }) => {
    await seite(page, 'formulare');

    const kasten = page.getByRole('checkbox', { name: 'server.properties' });
    await expect(kasten).toBeChecked();
    await kasten.focus();
    await page.keyboard.press('Space');
    await expect(kasten).not.toBeChecked();
    await expect(page.getByText('server.properties false')).toBeVisible();

    const schalter = page.getByRole('switch', { name: 'PvP' });
    await expect(schalter).toBeChecked();
    await schalter.focus();
    await page.keyboard.press('Space');
    await expect(schalter).not.toBeChecked();
    await expect(page.getByText('PvP false über model()')).toBeVisible();
  });

  test('controls disabled by input or by reactive forms cannot be changed', async ({ page }) => {
    await seite(page, 'formulare');

    await expect(page.getByRole('checkbox', { name: 'server.jar' })).toBeDisabled();
    await expect(page.getByRole('switch', { name: 'Whitelist' })).toBeDisabled();
    await expect(page.getByRole('slider', { name: 'CPU-Kerne' })).toBeDisabled();

    // Disabled through reactive forms (setDisabledState), not through the input.
    await expect(
      page.getByRole('checkbox', { name: 'RCON für Mitverwalter freigeben' }),
    ).toBeDisabled();
    await expect(page.getByRole('switch', { name: 'Fernsteuerung' })).toBeDisabled();
    await expect(page.getByRole('slider', { name: 'Aufbewahrung' })).toBeDisabled();
    const archiv = page.getByRole('group', { name: 'Zeitraum der laufenden Abrechnung' });
    await expect(archiv.getByRole('button', { name: '12 Monate' })).toBeDisabled();
  });

  test('the slider moves with arrow keys, Home and End and shows value plus unit', async ({
    page,
  }) => {
    await seite(page, 'formulare');
    const regler = page.getByRole('slider', { name: 'Arbeitsspeicher' });
    const anzeige = page
      .locator('z-slider', { has: page.getByRole('slider', { name: 'Arbeitsspeicher' }) })
      .locator('.z-range__value');

    await expect(anzeige).toHaveText('6 GB');
    await regler.focus();
    await page.keyboard.press('ArrowRight');
    await expect(anzeige).toHaveText('8 GB');
    await page.keyboard.press('ArrowLeft');
    await expect(anzeige).toHaveText('6 GB');
    await page.keyboard.press('End');
    await expect(anzeige).toHaveText('16 GB');
    await page.keyboard.press('Home');
    await expect(anzeige).toHaveText('2 GB');
  });

  test('Enter and Space move aria-pressed between segment buttons', async ({ page }) => {
    await seite(page, 'formulare');
    const gruppe = page.getByRole('group', { name: 'Zeitraum', exact: true });
    const drei = gruppe.getByRole('button', { name: '3 Monate' });
    const sechs = gruppe.getByRole('button', { name: '6 Monate' });
    const zwoelf = gruppe.getByRole('button', { name: '12 Monate' });

    await expect(sechs).toHaveAttribute('aria-pressed', 'true');
    await drei.focus();
    await page.keyboard.press('Enter');
    await expect(drei).toHaveAttribute('aria-pressed', 'true');
    await expect(sechs).toHaveAttribute('aria-pressed', 'false');

    await zwoelf.focus();
    await page.keyboard.press('Space');
    await expect(zwoelf).toHaveAttribute('aria-pressed', 'true');
    await expect(drei).toHaveAttribute('aria-pressed', 'false');
  });
});

test.describe('Tabs, Sidebar and AppHeader on /navigation', () => {
  test('clicking a tab moves aria-current', async ({ page }) => {
    await seite(page, 'navigation');
    const tabs = page.getByRole('navigation', { name: 'Hosting' });
    const uebersicht = tabs.getByRole('link', { name: 'Übersicht' });
    const speicher = tabs.getByRole('link', { name: 'Speicher' });

    await expect(uebersicht).toHaveAttribute('aria-current', 'page');
    await speicher.click();
    await expect(speicher).toHaveAttribute('aria-current', 'page');
    await expect(uebersicht).not.toHaveAttribute('aria-current', /.*/);
  });

  test('below 900px the sidebar list is replaced by a select that switches the area', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 800, height: 900 });
    await seite(page, 'navigation');

    await expect(page.getByRole('navigation', { name: 'Minecraft-Panel' })).toBeHidden();
    const auswahl = page.getByRole('combobox', { name: 'Minecraft-Panel' });
    await expect(auswahl).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Übersicht', level: 3 })).toBeVisible();
    await auswahl.selectOption('Konsole');
    await expect(page.getByRole('heading', { name: 'Konsole', level: 3 })).toBeVisible();
  });

  test('below 900px the header menu button toggles the navigation', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 900 });
    await seite(page, 'navigation');

    const knopf = page.getByRole('button', { name: 'Menü' }).first();
    const nav = page.getByRole('navigation', { name: 'Hauptnavigation' }).first();
    const guthaben = page.getByRole('link', { name: 'Guthaben 25,00 Euro, zur Abrechnung' });

    await expect(knopf).toHaveAttribute('aria-expanded', 'false');
    await expect(nav).toBeHidden();
    await expect(guthaben).toBeVisible();

    await knopf.click();
    await expect(knopf).toHaveAttribute('aria-expanded', 'true');
    await expect(nav).toBeVisible();
    await expect(guthaben).toBeVisible();

    await knopf.click();
    await expect(knopf).toHaveAttribute('aria-expanded', 'false');
    await expect(nav).toBeHidden();
  });
});

test.describe('Pagination on /daten', () => {
  test('next and previous change the range text', async ({ page }) => {
    await seite(page, 'daten');
    const pager = page.locator('z-pagination').first();

    await expect(pager).toContainText('1 bis 25 von 118 Transaktionen');
    await pager.getByRole('button', { name: 'Nächste Seite' }).click();
    await expect(pager).toContainText('26 bis 50 von 118 Transaktionen');
    await pager.getByRole('button', { name: 'Vorherige Seite' }).click();
    await expect(pager).toContainText('1 bis 25 von 118 Transaktionen');
  });

  test('previous is disabled on page 1 and next on the last page', async ({ page }) => {
    await seite(page, 'daten');

    const erste = page
      .locator('z-panel')
      .filter({ hasText: 'Erste Seite' })
      .locator('z-pagination');
    await expect(erste.getByRole('button', { name: 'Vorherige Seite' })).toBeDisabled();
    await expect(erste.getByRole('button', { name: 'Nächste Seite' })).toBeEnabled();

    const letzte = page
      .locator('z-panel')
      .filter({ hasText: 'Letzte Seite' })
      .locator('z-pagination');
    await expect(letzte).toContainText('101 bis 118 von 118 Transaktionen');
    await expect(letzte.getByRole('button', { name: 'Nächste Seite' })).toBeDisabled();
    await expect(letzte.getByRole('button', { name: 'Vorherige Seite' })).toBeEnabled();
  });
});

test.describe('Console and Faq on /werkzeuge', () => {
  test('Enter sends a command, clears the input and ArrowUp brings it back', async ({ page }) => {
    await seite(page, 'werkzeuge');
    const feld = page.getByRole('textbox', { name: 'Befehl' }).first();
    // The log is a <pre> without a mapped role, so it is addressed by class.
    const log = page.locator('.z-console__log').first();

    await feld.pressSequentially('whitelist add Alex');
    await feld.press('Enter');
    await expect(log).toContainText('> whitelist add Alex');
    await expect(log.locator('.z-log--cmd').last()).toContainText('> whitelist add Alex');
    await expect(feld).toHaveValue('');

    await feld.press('ArrowUp');
    await expect(feld).toHaveValue('whitelist add Alex');
  });

  test('appending lines keeps the log at the bottom, "Zum Ende" returns after scrolling up', async ({
    page,
  }) => {
    await seite(page, 'werkzeuge');
    const log = page.locator('.z-console__log').first();
    const zumEnde = page.getByRole('button', { name: 'Zum Ende' });

    await page.getByRole('button', { name: '50 Zeilen anhängen' }).click();
    await expect
      .poll(() =>
        log.evaluate((el) => Math.round(el.scrollHeight - el.scrollTop - el.clientHeight)),
      )
      .toBeLessThanOrEqual(4);
    await expect(zumEnde).toHaveCount(0);

    await log.evaluate((el) => {
      el.scrollTop = 0;
    });
    await expect(zumEnde).toBeVisible();

    await zumEnde.click();
    await expect(zumEnde).toHaveCount(0);
    await expect
      .poll(() =>
        log.evaluate((el) => Math.round(el.scrollHeight - el.scrollTop - el.clientHeight)),
      )
      .toBeLessThanOrEqual(4);
  });

  test('the disabled console does not take commands', async ({ page }) => {
    await seite(page, 'werkzeuge');
    await expect(page.getByRole('textbox', { name: 'Befehl' }).nth(1)).toBeDisabled();
  });

  test('the first question is open and Enter on a summary toggles it', async ({ page }) => {
    await seite(page, 'werkzeuge');
    const erste = page
      .locator('details')
      .filter({ hasText: 'Wie schnell ist mein Server online?' });
    const zweite = page.locator('details').filter({ hasText: 'Kann ich später mehr RAM buchen?' });

    await expect(erste).toHaveAttribute('open', '');
    await expect(zweite).not.toHaveAttribute('open', /.*/);

    await zweite.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(zweite).toHaveAttribute('open', '');

    await page.keyboard.press('Enter');
    await expect(zweite).not.toHaveAttribute('open', /.*/);
  });

  test('exactly one game tile is pressed and clicking another moves it', async ({ page }) => {
    await seite(page, 'werkzeuge');
    const gewaehlt = page.getByRole('button', { pressed: true });

    await expect(gewaehlt).toHaveCount(1);
    await expect(gewaehlt).toContainText('Terraria');

    await page.getByRole('button', { name: 'Valheim' }).click();
    await expect(page.getByRole('button', { pressed: true })).toHaveCount(1);
    await expect(page.getByRole('button', { pressed: true })).toContainText('Valheim');
  });
});

test.describe('Server panel on /muster/server-panel', () => {
  /** The sticky panel head holds badge, address and the status actions. */
  const kopf = (page: Page) => page.locator('.demo-panelkopf');

  /** The demo control switches the server status by hand. */
  const statusSetzen = (page: Page, wert: string) =>
    page.getByRole('combobox', { name: 'Serverstatus' }).selectOption(wert);

  test('badge word and main action follow the status (15-zustaende.md)', async ({ page }) => {
    await seite(page, 'muster/server-panel');

    // Online: two secondary actions, no primary in the head.
    await expect(kopf(page).locator('z-badge')).toHaveText('Online');
    await expect(kopf(page).getByRole('button', { name: 'Neustart' })).toHaveClass(
      /z-btn--secondary/,
    );
    await expect(kopf(page).getByRole('button', { name: 'Stoppen' })).toHaveClass(
      /z-btn--secondary/,
    );
    await expect(kopf(page).locator('.z-btn--primary')).toHaveCount(0);

    await statusSetzen(page, 'gestoppt');
    await expect(kopf(page).locator('z-badge')).toHaveText('Gestoppt');
    await expect(kopf(page).getByRole('button', { name: 'Starten' })).toHaveClass(/z-btn--primary/);

    // Startet: every status action is disabled, the triggering one spins.
    await statusSetzen(page, 'startet');
    await expect(kopf(page).locator('z-badge')).toHaveText('Startet');
    await expect(kopf(page).getByRole('button', { name: 'Wird gestartet' })).toBeDisabled();
    await expect(kopf(page).getByRole('button', { name: 'Stoppen' })).toBeDisabled();
  });

  test('"Hart beenden" from the menu asks first and reports with a toast', async ({ page }) => {
    await seite(page, 'muster/server-panel');
    await page.getByRole('button', { name: 'Weitere Aktionen' }).click();
    await page.getByRole('menuitem', { name: 'Hart beenden' }).click();

    const dialog = page.getByRole('dialog', { name: 'Beispiel-Server 1 hart beenden?' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Hart beenden' }).click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('status')).toContainText('Beispiel-Server 1 wurde hart beendet');
  });
});

test.describe('List states on /muster/dashboard', () => {
  const steuerung = (page: Page) => page.getByRole('group', { name: 'Zustand der Serverliste' });

  test('"Leer" shows the empty state and no pagination', async ({ page }) => {
    await seite(page, 'muster/dashboard');
    await expect(page.locator('z-pagination')).toHaveCount(1);

    await steuerung(page).getByRole('button', { name: 'Leer' }).click();
    await expect(page.getByText('Du hast noch keinen Server')).toBeVisible();
    await expect(page.locator('z-pagination')).toHaveCount(0);
  });

  test('"Fehler" shows exactly one alert and it is the danger one', async ({ page }) => {
    await seite(page, 'muster/dashboard');
    await steuerung(page).getByRole('button', { name: 'Fehler' }).click();

    const alert = page.locator('z-alert');
    await expect(alert).toHaveCount(1);
    await expect(alert).toHaveClass(/z-alert--danger/);
    await expect(alert).toContainText('Die Serverliste ist nicht geladen');
  });
});

test.describe('Calculator on /muster/startseite', () => {
  test('the slider changes the price and exactly one game tile stays selected', async ({
    page,
  }) => {
    await seite(page, 'muster/startseite');
    const preis = page.locator('.z-summary__price');
    const gewaehlt = page.locator('z-game-grid').getByRole('button', { pressed: true });

    await expect(gewaehlt).toHaveCount(1);
    await expect(gewaehlt).toContainText('Valheim');
    // Valheim 2,70 € + 4 GB à 0,45 € + 8 Steckplätze à 0,20 €.
    await expect(preis).toContainText('6,10');

    await page.getByRole('slider', { name: 'Arbeitsspeicher' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(preis).toContainText('7,00');
    await expect(gewaehlt).toHaveCount(1);
  });
});
