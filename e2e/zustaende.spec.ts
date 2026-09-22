import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * Per-component check of the states in spec/guidelines/15-zustaende.md: rest,
 * hover, keyboard focus, pressed, active, disabled, loading, error and the
 * transitions of "Bewegung" in CLAUDE.md.
 *
 * Everything is measured on the single component: computed styles plus element
 * screenshots (focus: bounding box plus 6px of air). No screenshot shows the
 * page shell, so a change of the demo header leaves these baselines alone.
 * The page level is covered by e2e/demo.spec.ts.
 */

/** Nothing here may change between rest, hover and pressed. */
const GEOMETRIE = [
  'width',
  'height',
  'transform',
  'boxShadow',
  'fontSize',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
] as const;

/** Hover is allowed to move exactly these. */
const FARBEN = ['backgroundColor', 'color', 'borderTopColor'] as const;

/** The only transition the design system allows, 150ms on three properties. */
const UEBERGANG = ['color', 'background-color', 'border-color'];

/** Air around the element in the focus screenshot, so the 2px ring fits in. */
const LUFT = 6;

async function seiteOeffnen(page: Page, route: string): Promise<void> {
  await page.goto(`/${route}`);
  await page.locator('main h1').first().waitFor();
  await page.evaluate(() => document.fonts.ready.then(() => true));
}

/** Resolved value of a token, read from the running page instead of hard-coded. */
async function tokenFarbe(page: Page, token: string): Promise<string> {
  return page.evaluate((name) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${name})`;
    document.body.appendChild(probe);
    const farbe = getComputedStyle(probe).color;
    probe.remove();
    return farbe;
  }, token);
}

async function stil(ziel: Locator, namen: readonly string[]): Promise<Record<string, string>> {
  return ziel.evaluate(
    (el, eigenschaften) => {
      const berechnet = getComputedStyle(el) as unknown as Record<string, string>;
      return Object.fromEntries(eigenschaften.map((name) => [name, berechnet[name]]));
    },
    [...namen],
  );
}

interface Kasten {
  x: number;
  y: number;
  width: number;
  height: number;
}

async function kasten(ziel: Locator): Promise<Kasten> {
  const box = await ziel.boundingBox();
  if (!box) {
    throw new Error('Element hat keine Box');
  }
  const runden = (wert: number) => Math.round(wert * 100) / 100;
  return {
    x: runden(box.x),
    y: runden(box.y),
    width: runden(box.width),
    height: runden(box.height),
  };
}

/** Section of a demo page, found through its h2. */
const abschnitt = (page: Page, titel: string) =>
  page
    .locator('section.demo-section')
    .filter({ has: page.getByRole('heading', { level: 2, name: titel, exact: true }) });

/** One row inside a section, found through the text of its caption. */
const reihe = (page: Page, titel: string, text: string) =>
  abschnitt(page, titel).locator('.demo-row').filter({ hasText: text });

interface Baustein {
  /** Prefix of the screenshots, e. g. button-primary. */
  name: string;
  route: string;
  ziel: (page: Page) => Locator;
  /** Opens a dialog or a menu, or scrolls the console, before the element exists. */
  vorbereiten?: (page: Page) => Promise<void>;
  /** Closes again what `vorbereiten` opened; only the transition test needs it. */
  aufraeumen?: (page: Page) => Promise<void>;
  /** spec/components/bundle.css gives this element a :hover rule. */
  hoverFarbe: boolean;
  /** Element that carries the hover colour, when it is not the element itself. */
  farbeAn?: (page: Page) => Locator;
  farbProps?: readonly string[];
  /** Mouse down would open a native popup (select), so it is left out. */
  ohneDruck?: boolean;
  /** Focus without Tab, because Tab closes the CDK menu. */
  fokussieren?: (page: Page, ziel: Locator) => Promise<void>;
  /** Viewport for this component, when its states only exist at one width. */
  sicht?: { width: number; height: number };
}

/** Opens the menu of the overlays page by keyboard, so the items are reachable. */
const menuOeffnen = async (page: Page) => {
  await page.getByRole('button', { name: 'Weitere Aktionen' }).press('Enter');
  await page.getByRole('menu').waitFor();
};

const schliessen = async (page: Page) => {
  await page.keyboard.press('Escape');
};

const dialogOeffnen = async (page: Page) => {
  await abschnitt(page, 'Dialog').getByRole('button', { name: 'Hart beenden' }).click();
  await page.getByRole('dialog').waitFor();
};

const BAUSTEINE: Baustein[] = [
  // Grundlage: Button in all four variants, as a link, icon only and in the
  // Minecraft subtheme, plus Input, Textarea and Select.
  {
    name: 'button-primary',
    route: 'grundlage',
    ziel: (p) =>
      abschnitt(p, 'Button')
        .locator('.demo-row')
        .first()
        .getByRole('button', { name: 'Server erstellen' }),
    hoverFarbe: true,
  },
  {
    name: 'button-secondary',
    route: 'grundlage',
    ziel: (p) =>
      abschnitt(p, 'Button')
        .locator('.demo-row')
        .first()
        .getByRole('button', { name: 'Preis berechnen' }),
    hoverFarbe: true,
  },
  {
    name: 'button-ghost',
    route: 'grundlage',
    ziel: (p) =>
      abschnitt(p, 'Button')
        .locator('.demo-row')
        .first()
        .getByRole('button', { name: 'Abbrechen' }),
    hoverFarbe: true,
  },
  {
    name: 'button-danger',
    route: 'grundlage',
    ziel: (p) =>
      abschnitt(p, 'Button')
        .locator('.demo-row')
        .first()
        .getByRole('button', { name: 'Hart beenden' }),
    hoverFarbe: true,
  },
  {
    name: 'button-icon',
    route: 'grundlage',
    ziel: (p) => reihe(p, 'Button', 'Nur Icon').getByRole('button', { name: 'Aktualisieren' }),
    hoverFarbe: true,
  },
  {
    name: 'button-link',
    route: 'grundlage',
    ziel: (p) => reihe(p, 'Button', 'Als Link').getByRole('link', { name: 'Server erstellen' }),
    hoverFarbe: true,
  },
  {
    name: 'button-mc-primary',
    route: 'grundlage',
    ziel: (p) =>
      abschnitt(p, 'Button')
        .locator('.z-theme-mc')
        .getByRole('button', { name: 'Server konfigurieren' }),
    hoverFarbe: true,
  },
  {
    name: 'input',
    route: 'grundlage',
    ziel: (p) => p.getByLabel('Servername'),
    hoverFarbe: true,
  },
  {
    name: 'textarea',
    route: 'grundlage',
    ziel: (p) => p.getByLabel('Notiz'),
    hoverFarbe: true,
  },
  {
    // Mouse down on a native select opens the browser popup, which no
    // computed style can be read behind; the pressed check is left out.
    name: 'select',
    route: 'grundlage',
    ziel: (p) => p.getByLabel('Status', { exact: true }),
    hoverFarbe: true,
    ohneDruck: true,
  },

  // Formulare: the checkbox is measured unchecked, because :checked overrides
  // the hover border in the reference.
  {
    name: 'checkbox',
    route: 'formulare',
    ziel: (p) => p.getByRole('checkbox', { name: 'whitelist.json' }),
    hoverFarbe: true,
  },
  {
    name: 'toggle',
    route: 'formulare',
    ziel: (p) => p.getByRole('switch', { name: 'Hardcore' }),
    hoverFarbe: false,
  },
  {
    name: 'slider',
    route: 'formulare',
    ziel: (p) => p.getByRole('slider', { name: 'Arbeitsspeicher' }),
    hoverFarbe: false,
  },
  {
    name: 'segment',
    route: 'formulare',
    ziel: (p) =>
      p
        .getByRole('group', { name: 'Zeitraum', exact: true })
        .getByRole('button', { name: '3 Monate' }),
    hoverFarbe: true,
  },

  // Navigation: tab, sidebar entry, header link and footer link, each the one
  // that is not the current page.
  {
    name: 'tab',
    route: 'navigation',
    ziel: (p) => p.getByRole('navigation', { name: 'Hosting' }).getByRole('link', { name: 'Apps' }),
    hoverFarbe: true,
  },
  {
    name: 'sidebar-item',
    route: 'navigation',
    ziel: (p) => p.locator('z-sidebar').getByRole('button', { name: 'Konsole' }),
    hoverFarbe: true,
  },
  {
    name: 'header-link',
    route: 'navigation',
    ziel: (p) => p.locator('z-app-header').first().getByRole('link', { name: 'Dashboard' }),
    hoverFarbe: true,
  },
  {
    name: 'footer-link',
    route: 'navigation',
    ziel: (p) => p.locator('z-footer').first().getByRole('link', { name: 'Impressum' }),
    hoverFarbe: true,
  },

  // Daten: row link, the table container (tab stop only while it scrolls) and
  // the pagination.
  {
    name: 'row-link',
    route: 'daten',
    ziel: (p) => p.getByRole('link', { name: /Beispiel-Server 1/ }).first(),
    hoverFarbe: true,
  },
  {
    // The wrapper only becomes a region with a tab stop while the table is
    // really wider than it is; at the default 1280px the demo table fits. Its
    // states are therefore measured at 375px, where it scrolls. The counter
    // check for the wide viewport is the test below the loop.
    name: 'table-container',
    route: 'daten',
    sicht: { width: 375, height: 720 },
    ziel: (p) => p.locator('z-table-container').first(),
    hoverFarbe: false,
  },
  {
    name: 'pagination-next',
    route: 'daten',
    ziel: (p) => p.getByRole('button', { name: 'Nächste Seite' }).first(),
    hoverFarbe: true,
  },

  // Rückmeldung: alert action, the two buttons of a toast and a tooltip host.
  {
    name: 'alert-action',
    route: 'rueckmeldung',
    ziel: (p) => p.getByRole('button', { name: 'Vorschläge ansehen' }),
    hoverFarbe: true,
  },
  {
    name: 'toast-action',
    route: 'rueckmeldung',
    vorbereiten: async (p) => {
      await p.getByRole('button', { name: 'Mit Aktion zeigen' }).click();
      await p.getByRole('button', { name: 'Rückgängig' }).waitFor();
    },
    aufraeumen: async (p) => p.getByRole('button', { name: 'Alle schließen' }).click(),
    ziel: (p) => p.getByRole('button', { name: 'Rückgängig' }),
    hoverFarbe: false,
  },
  {
    name: 'toast-close',
    route: 'rueckmeldung',
    vorbereiten: async (p) => {
      await p.getByRole('button', { name: 'Dauerhaft zeigen' }).click();
      await p.getByRole('button', { name: 'Schließen', exact: true }).waitFor();
    },
    aufraeumen: async (p) => p.getByRole('button', { name: 'Alle schließen' }).click(),
    ziel: (p) => p.getByRole('button', { name: 'Schließen', exact: true }),
    hoverFarbe: true,
  },
  {
    name: 'tooltip-host',
    route: 'rueckmeldung',
    ziel: (p) => abschnitt(p, 'Tooltip').getByRole('button', { name: 'Neustart' }),
    hoverFarbe: true,
  },

  // Overlays: the two dialog buttons and the menu entries, each behind the
  // overlay that has to be opened first.
  {
    name: 'dialog-cancel',
    route: 'overlays',
    vorbereiten: dialogOeffnen,
    aufraeumen: schliessen,
    ziel: (p) => p.getByRole('dialog').getByRole('button', { name: 'Abbrechen' }),
    hoverFarbe: true,
  },
  {
    name: 'dialog-confirm',
    route: 'overlays',
    vorbereiten: dialogOeffnen,
    aufraeumen: schliessen,
    ziel: (p) => p.getByRole('dialog').getByRole('button', { name: 'Hart beenden' }),
    hoverFarbe: true,
  },
  {
    name: 'menu-item',
    route: 'overlays',
    vorbereiten: menuOeffnen,
    aufraeumen: schliessen,
    ziel: (p) => p.getByRole('menuitem', { name: 'FTP-Zugang' }),
    hoverFarbe: true,
    fokussieren: async (_p, ziel) => ziel.focus(),
  },
  {
    name: 'menu-item-danger',
    route: 'overlays',
    vorbereiten: menuOeffnen,
    aufraeumen: schliessen,
    ziel: (p) => p.getByRole('menuitem', { name: 'Server löschen' }),
    hoverFarbe: true,
    fokussieren: async (_p, ziel) => ziel.focus(),
  },

  // Werkzeuge: console input and its "Zum Ende" button, game tile and Faq.
  {
    name: 'console-input',
    route: 'werkzeuge',
    ziel: (p) => p.getByRole('textbox', { name: 'Befehl' }).first(),
    hoverFarbe: false,
  },
  {
    name: 'console-end',
    route: 'werkzeuge',
    vorbereiten: async (p) => {
      const log = p.locator('.z-console__log').first();
      await p.getByRole('button', { name: '50 Zeilen anhängen' }).click();
      // Das Log zieht selbst ans Ende nach. Erst danach hoch scrollen, sonst
      // holt der Nachlauf die Ansicht wieder zurück und der Button bleibt weg.
      await expect.poll(() => log.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
      await log.evaluate((el) => {
        el.scrollTop = 0;
      });
      await p.getByRole('button', { name: 'Zum Ende' }).waitFor();
    },
    ziel: (p) => p.getByRole('button', { name: 'Zum Ende' }),
    hoverFarbe: true,
  },
  {
    // The reference colours the cover of the tile, not the tile itself.
    name: 'game-tile',
    route: 'werkzeuge',
    ziel: (p) => p.getByRole('button', { name: /Valheim/ }),
    farbeAn: (p) => p.getByRole('button', { name: /Valheim/ }).locator('.z-game__cover'),
    farbProps: ['outlineColor'],
    hoverFarbe: true,
  },
  {
    name: 'faq-summary',
    route: 'werkzeuge',
    ziel: (p) =>
      p.locator('.z-faq summary').filter({ hasText: 'Kann ich später mehr RAM buchen?' }),
    hoverFarbe: false,
  },
];

interface Messung {
  geo: Record<string, string>;
  box: Kasten;
  farben: Record<string, string>;
}

async function messen(baustein: Baustein, page: Page): Promise<Messung> {
  return {
    geo: await stil(baustein.ziel(page), GEOMETRIE),
    box: await kasten(baustein.ziel(page)),
    farben: await stil((baustein.farbeAn ?? baustein.ziel)(page), baustein.farbProps ?? FARBEN),
  };
}

/** Puts the browser into keyboard mode, so :focus-visible applies. */
async function tastaturFokus(page: Page, baustein: Baustein): Promise<Locator> {
  const ziel = baustein.ziel(page);
  if (baustein.fokussieren) {
    await baustein.fokussieren(page, ziel);
    return ziel;
  }
  await page.keyboard.press('Tab');
  await ziel.focus();
  return ziel;
}

/** Feste Zeile im Sichtfenster, auf die jedes Ziel gescrollt wird. */
const ZIEL_OBEN = 160;

/**
 * Scrolls the target to a fixed row of the viewport. `focus()` scrolls only as
 * far as it has to, so the element would end up wherever the page happens to
 * stand, and the cut-out would move with everything above it: a navigation that
 * gains a link and wraps to a second line shifts every element screenshot of
 * the suite. A fixed row makes the cut-out depend on the element alone. Only
 * the page moves, the element keeps its place on it, so the cut-out shows the
 * same thing as before. Three passes, because the end of the document can stop
 * the scroll short; what is left is still at least the 6px of air.
 */
async function luftSchaffen(page: Page, ziel: Locator): Promise<void> {
  const sicht = page.viewportSize() ?? { width: 1280, height: 720 };
  // Ein Element in einem CDK-Overlay haengt am Sichtfenster, nicht an der
  // Seite: Scrollen verschiebt nur das Overlay und bringt keine Luft.
  const imOverlay = await ziel.evaluate((el) => !!el.closest('.cdk-overlay-container'));
  if (imOverlay) {
    return;
  }
  for (let versuch = 0; versuch < 3; versuch++) {
    const box = await kasten(ziel);
    const zeile = Math.min(ZIEL_OBEN, Math.max(LUFT, sicht.height - box.height - LUFT));
    const versatz = Math.round(box.y - zeile);
    if (versatz === 0) {
      return;
    }
    await page.evaluate((wert) => window.scrollBy(0, wert), versatz);
  }
}

/** Bounding box plus 6px, clamped to the viewport. */
async function fokusAusschnitt(page: Page, ziel: Locator): Promise<Kasten> {
  const box = await kasten(ziel);
  const sicht = page.viewportSize() ?? { width: 1280, height: 720 };
  const links = Math.max(0, box.x - LUFT);
  const oben = Math.max(0, box.y - LUFT);
  const rechts = Math.min(sicht.width, box.x + box.width + LUFT);
  const unten = Math.min(sicht.height, box.y + box.height + LUFT);
  return { x: links, y: oben, width: rechts - links, height: unten - oben };
}

const teile = (wert: string) => wert.split(',').map((eintrag) => eintrag.trim());
const ohneUebergang = (u: Record<string, string>) =>
  teile(u.transitionDuration).every((dauer) => dauer === '0s');

for (const baustein of BAUSTEINE) {
  test.describe(baustein.name, () => {
    if (baustein.sicht) {
      test.use({ viewport: baustein.sicht });
    }

    test.beforeEach(async ({ page }) => {
      await seiteOeffnen(page, baustein.route);
      await baustein.vorbereiten?.(page);
      await baustein.ziel(page).scrollIntoViewIfNeeded();
    });

    test('Hover färbt und bewegt nichts, Gedrückt hat keinen eigenen Stil', async ({ page }) => {
      const ruhe = await messen(baustein, page);

      await baustein.ziel(page).hover();
      const hover = await messen(baustein, page);
      expect(hover.geo, `${baustein.name}: Hover ändert Maße oder Schatten`).toEqual(ruhe.geo);
      expect(hover.box, `${baustein.name}: Hover verschiebt das Element`).toEqual(ruhe.box);
      if (baustein.hoverFarbe) {
        expect(hover.farben, `${baustein.name}: Hover ändert keine Farbe`).not.toEqual(ruhe.farben);
      } else {
        expect(
          hover.farben,
          `${baustein.name}: Hover färbt, obwohl die Vorlage keine Hover-Regel hat`,
        ).toEqual(ruhe.farben);
      }
      await expect(baustein.ziel(page)).toHaveScreenshot(`zustaende-${baustein.name}-hover.png`);

      if (!baustein.ohneDruck) {
        await page.mouse.down();
        const gedrueckt = await messen(baustein, page);
        // Away from the element before the release, so the click does not run.
        await page.mouse.move(0, 0);
        await page.mouse.up();
        expect(gedrueckt.geo, `${baustein.name}: Gedrückt ändert Maße oder Schatten`).toEqual(
          ruhe.geo,
        );
        expect(gedrueckt.box, `${baustein.name}: Gedrückt verschiebt das Element`).toEqual(
          ruhe.box,
        );
        expect(gedrueckt.farben, `${baustein.name}: Gedrückt hat einen eigenen Stil`).toEqual(
          hover.farben,
        );
      }
    });

    test('Tastaturfokus zeigt den 2px-Ring in --focus', async ({ page }) => {
      const fokus = await tokenFarbe(page, '--focus');
      const ziel = await tastaturFokus(page, baustein);

      await expect(ziel).toBeFocused();
      expect(
        await ziel.evaluate((el) => el.matches(':focus-visible')),
        `${baustein.name}: kein :focus-visible nach Tastaturbedienung`,
      ).toBe(true);

      const ring = await stil(ziel, [
        'outlineStyle',
        'outlineWidth',
        'outlineOffset',
        'outlineColor',
      ]);
      expect(ring.outlineStyle, `${baustein.name}: outline-style`).not.toBe('none');
      expect(ring.outlineWidth, `${baustein.name}: outline-width`).toBe('2px');
      expect(ring.outlineOffset, `${baustein.name}: outline-offset`).toBe('2px');
      expect(ring.outlineColor, `${baustein.name}: Ringfarbe ist nicht --focus`).toBe(fokus);

      await luftSchaffen(page, ziel);
      await expect(page).toHaveScreenshot(`zustaende-${baustein.name}-focus.png`, {
        clip: await fokusAusschnitt(page, ziel),
      });
    });

    test('Ohne Bewegung: kein Übergang', async ({ page }) => {
      const u = await stil(baustein.ziel(page), ['transitionProperty', 'transitionDuration']);
      expect(ohneUebergang(u), `${baustein.name}: Übergang trotz prefers-reduced-motion`).toBe(
        true,
      );
    });
  });
}

/**
 * A scrollable area is the container's only reason to be a tab stop, so role,
 * tabindex and the accessible name appear exactly while the table overflows.
 * That is also why the states above are measured at 375px.
 */
test.describe('table-container: Rolle und Tab-Stopp nur bei Überlauf', () => {
  const huelle = (page: Page) => page.locator('z-table-container').first();

  test('375px: Region mit Namen, per Tab erreichbar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 720 });
    await seiteOeffnen(page, 'daten');

    await expect(huelle(page)).toHaveAttribute('role', 'region');
    await expect(huelle(page)).toHaveAttribute('tabindex', '0');
    await expect(huelle(page)).toHaveAttribute('aria-label', 'Dateien, seitlich scrollbar');
  });

  test('1440px: keine Rolle, kein Name, kein Tab-Stopp', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await seiteOeffnen(page, 'daten');

    // Nothing to scroll, so a tab stop here would do nothing.
    await expect(huelle(page)).not.toHaveAttribute('role', /.*/);
    await expect(huelle(page)).not.toHaveAttribute('tabindex', /.*/);
    await expect(huelle(page)).not.toHaveAttribute('aria-label', /.*/);
  });
});

test.describe('Übergänge bei prefers-reduced-motion: no-preference', () => {
  test.use({ reducedMotion: 'no-preference' });

  for (const route of [...new Set(BAUSTEINE.map((b) => b.route))]) {
    test(`/${route}`, async ({ page }) => {
      await seiteOeffnen(page, route);
      const ohne: string[] = [];
      for (const baustein of BAUSTEINE.filter((b) => b.route === route)) {
        await baustein.vorbereiten?.(page);
        const u = await stil(baustein.ziel(page), ['transitionProperty', 'transitionDuration']);
        if (ohneUebergang(u)) {
          ohne.push(baustein.name);
        } else {
          expect(teile(u.transitionProperty), `${baustein.name}: transition-property`).toEqual(
            UEBERGANG,
          );
          expect(teile(u.transitionDuration), `${baustein.name}: transition-duration`).toEqual(
            UEBERGANG.map(() => '0.15s'),
          );
        }
        await baustein.aufraeumen?.(page);
      }
      test.info().annotations.push({ type: 'ohne Übergang', description: ohne.join(', ') || '-' });
    });
  }
});

test.describe('Aktiv und gewählt', () => {
  test('Tab: aria-current, Textfarbe und die 2px-Linie nur am aktiven Tab', async ({ page }) => {
    await seiteOeffnen(page, 'navigation');
    const tabs = page.getByRole('navigation', { name: 'Hosting' });
    const aktiv = tabs.getByRole('link', { name: 'Übersicht' });
    const ruhend = tabs.getByRole('link', { name: 'Apps' });

    await expect(aktiv).toHaveAttribute('aria-current', 'page');
    await expect(ruhend).not.toHaveAttribute('aria-current', 'page');
    const linie = await stil(aktiv, ['color', 'boxShadow']);
    expect(linie.color, 'aktiver Tab steht nicht in --text').toBe(await tokenFarbe(page, '--text'));
    expect(linie.boxShadow, 'aktiver Tab ohne 2px-Linie in --accent-text').toContain(
      await tokenFarbe(page, '--accent-text'),
    );
    expect(linie.boxShadow, 'aktiver Tab ohne 2px-Linie').toContain('-2px');
    expect((await stil(ruhend, ['boxShadow'])).boxShadow, 'ruhender Tab hat eine Linie').toBe(
      'none',
    );

    await expect(aktiv).toHaveScreenshot('zustaende-tab-active.png');
  });

  test('Sidebar-Eintrag: aria-current, surface-hover und text', async ({ page }) => {
    await seiteOeffnen(page, 'navigation');
    const aktiv = page.locator('z-sidebar').getByRole('button', { name: 'Übersicht' });

    await expect(aktiv).toHaveAttribute('aria-current', 'page');
    const farben = await stil(aktiv, ['backgroundColor', 'color']);
    expect(farben.backgroundColor, 'aktiver Eintrag ohne --surface-hover').toBe(
      await tokenFarbe(page, '--surface-hover'),
    );
    expect(farben.color, 'aktiver Eintrag ohne --text').toBe(await tokenFarbe(page, '--text'));

    await expect(aktiv).toHaveScreenshot('zustaende-sidebar-item-active.png');
  });

  test('Header-Link: aria-current, accent-subtle und text', async ({ page }) => {
    await seiteOeffnen(page, 'navigation');
    const aktiv = page.locator('z-app-header').first().getByRole('link', { name: 'Gameserver' });

    await expect(aktiv).toHaveAttribute('aria-current', 'page');
    const farben = await stil(aktiv, ['backgroundColor', 'color']);
    // Die Vorlage setzt hier accent-subtle statt surface-hover.
    expect(farben.backgroundColor, 'aktiver Header-Link ohne --accent-subtle').toBe(
      await tokenFarbe(page, '--accent-subtle'),
    );
    expect(farben.color, 'aktiver Header-Link ohne --text').toBe(await tokenFarbe(page, '--text'));

    await expect(aktiv).toHaveScreenshot('zustaende-header-link-active.png');
  });

  test('Segment: aria-pressed, surface-hover und text', async ({ page }) => {
    await seiteOeffnen(page, 'formulare');
    const gruppe = page.getByRole('group', { name: 'Zeitraum', exact: true });
    const gewaehlt = gruppe.getByRole('button', { name: '6 Monate' });

    await expect(gewaehlt).toHaveAttribute('aria-pressed', 'true');
    const farben = await stil(gewaehlt, ['backgroundColor', 'color']);
    expect(farben.backgroundColor, 'gewählte Option ohne --surface-hover').toBe(
      await tokenFarbe(page, '--surface-hover'),
    );
    expect(farben.color, 'gewählte Option ohne --text').toBe(await tokenFarbe(page, '--text'));

    await expect(gewaehlt).toHaveScreenshot('zustaende-segment-selected.png');
  });

  test('GameTile: aria-pressed und die 2px-Linie nur an der gewählten Kachel', async ({ page }) => {
    await seiteOeffnen(page, 'werkzeuge');
    const gewaehlt = page.getByRole('button', { name: /Terraria/ });
    const ruhend = page.getByRole('button', { name: /Valheim/ });

    await expect(gewaehlt).toHaveAttribute('aria-pressed', 'true');
    await expect(ruhend).toHaveAttribute('aria-pressed', 'false');
    const linie = await stil(gewaehlt.locator('.z-game__cover'), ['outlineWidth', 'outlineColor']);
    expect(linie.outlineWidth, 'gewählte Kachel ohne 2px-Linie').toBe('2px');
    expect(linie.outlineColor, 'gewählte Kachel nicht in --accent-text').toBe(
      await tokenFarbe(page, '--accent-text'),
    );
    expect(
      (await stil(ruhend.locator('.z-game__cover'), ['outlineWidth'])).outlineWidth,
      'ruhende Kachel hat eine 2px-Linie',
    ).toBe('1px');

    await expect(ruhend).toHaveScreenshot('zustaende-game-tile-rest.png');
    await expect(gewaehlt).toHaveScreenshot('zustaende-game-tile-selected.png');
  });

  test('Checkbox gewählt: accent als Fläche und Rahmen', async ({ page }) => {
    await seiteOeffnen(page, 'formulare');
    const gewaehlt = page.getByRole('checkbox', { name: 'server.properties' });

    await expect(gewaehlt).toBeChecked();
    const farben = await stil(gewaehlt, ['backgroundColor', 'borderTopColor']);
    const accent = await tokenFarbe(page, '--accent');
    expect(farben.backgroundColor, 'gewählte Checkbox ohne --accent').toBe(accent);
    expect(farben.borderTopColor, 'gewählte Checkbox ohne Rahmen in --accent').toBe(accent);

    await expect(gewaehlt).toHaveScreenshot('zustaende-checkbox-selected.png');
  });

  test('Toggle an: success als Fläche', async ({ page }) => {
    await seiteOeffnen(page, 'formulare');
    const an = page.getByRole('switch', { name: 'PvP' });

    await expect(an).toBeChecked();
    expect(
      (await stil(an, ['backgroundColor'])).backgroundColor,
      'eingeschalteter Toggle ohne --success',
    ).toBe(await tokenFarbe(page, '--success'));

    await expect(an).toHaveScreenshot('zustaende-toggle-selected.png');
  });

  test('Faq: geschlossen, offen und das Zeichen im Kopf', async ({ page }) => {
    await seiteOeffnen(page, 'werkzeuge');
    const offen = page.locator('.z-faq').filter({ hasText: 'Wie schnell ist mein Server online?' });
    const zu = page.locator('.z-faq').filter({ hasText: 'Kann ich später mehr RAM buchen?' });

    await expect(offen).toHaveAttribute('open', '');
    await expect(zu).not.toHaveAttribute('open', '');
    await expect(offen.locator('.z-faq__body')).toBeVisible();
    await expect(zu.locator('.z-faq__body')).toBeHidden();

    await expect(zu).toHaveScreenshot('zustaende-faq-closed.png');
    await zu.locator('summary').click();
    await expect(zu).toHaveAttribute('open', '');
    await expect(zu.locator('.z-faq__body')).toBeVisible();
    await expect(zu).toHaveScreenshot('zustaende-faq-open.png');
  });
});

/**
 * The two sizes of the hero. The design system gives the start page and
 * /minecraft `display-xl` and every sub-page `display-lg`, which the reference
 * stylesheet only has below 640px. So `size="lg"` has to render at a wide
 * viewport exactly what `size="xl"` renders below 640px, and it must not grow
 * back on a phone.
 */
test.describe('hero-lg', () => {
  const SCHRIFT = ['fontSize', 'lineHeight', 'letterSpacing', 'fontFamily', 'fontWeight'] as const;

  const hero = (page: Page, text: string) =>
    page.locator('z-hero').filter({ hasText: text }).first();
  const titel = (page: Page, text: string) => hero(page, text).locator('.z-hero__title');

  const XL = 'Gameserver aus Nürnberg';
  const LG = 'Preise';

  test('lg bei 1440px misst wie xl bei 639px, und unter 640px bleibt lg bei lg', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await seiteOeffnen(page, 'werkzeuge');
    const xlBreit = await stil(titel(page, XL), SCHRIFT);
    const lgBreit = await stil(titel(page, LG), SCHRIFT);

    expect(xlBreit.fontSize, 'xl bei 1440px').toBe('56px');
    expect(xlBreit.lineHeight, 'xl bei 1440px').toBe('60px');
    expect(lgBreit.fontSize, 'lg bei 1440px').toBe('40px');
    expect(lgBreit.lineHeight, 'lg bei 1440px').toBe('44px');

    await page.setViewportSize({ width: 639, height: 900 });
    const xlSchmal = await stil(titel(page, XL), SCHRIFT);
    const lgSchmal = await stil(titel(page, LG), SCHRIFT);

    expect(lgBreit, 'lg bei 1440px ist nicht der xl-Titel bei 639px').toEqual(xlSchmal);
    expect(lgSchmal, 'lg ändert sich unter 640px').toEqual(lgBreit);
    test.info().annotations.push({
      type: 'hero-lg',
      description:
        `xl@1440 ${xlBreit.fontSize}/${xlBreit.lineHeight}/${xlBreit.letterSpacing}, ` +
        `lg@1440 ${lgBreit.fontSize}/${lgBreit.lineHeight}/${lgBreit.letterSpacing}, ` +
        `xl@639 ${xlSchmal.fontSize}/${xlSchmal.lineHeight}/${xlSchmal.letterSpacing}, ` +
        `lg@639 ${lgSchmal.fontSize}/${lgSchmal.lineHeight}/${lgSchmal.letterSpacing}`,
    });
  });

  test('z-hero--lg steht nur am lg-Hero, die Überschrift behält ihre Klasse', async ({ page }) => {
    await seiteOeffnen(page, 'werkzeuge');

    await expect(hero(page, XL)).not.toHaveClass(/z-hero--lg/);
    await expect(hero(page, LG)).toHaveClass(/z-hero--lg/);
    await expect(titel(page, LG)).toHaveClass('z-hero__title');
    // Die Größe hängt nicht an der Ebene: beide Vorschauen sind h2.
    await expect(titel(page, XL)).toHaveJSProperty('tagName', 'H2');
    await expect(titel(page, LG)).toHaveJSProperty('tagName', 'H2');

    await expect(hero(page, LG)).toHaveScreenshot('zustaende-hero-lg.png');
  });

  // Hero/README.md: sub-pages "kommen oft ohne rechte Spalte aus". bundle.css
  // fixes .z-hero at 7fr/5fr above 900px, so such a hero would keep an empty
  // right column at 1440px. Measured on the computed grid, not on a picture.
  test('ohne [zHeroAside] eine Spalte bei 1440px, mit Aside 7 zu 5', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await seiteOeffnen(page, 'werkzeuge');

    const spuren = async (text: string) =>
      (await hero(page, text).evaluate((el) => getComputedStyle(el).gridTemplateColumns))
        .split(' ')
        .map((wert) => Number.parseFloat(wert));

    // Der Hero der Unterseite hat keine rechte Spalte.
    await expect(hero(page, LG).locator('[zHeroAside]')).toHaveCount(0);
    const ohne = await spuren(LG);
    const mit = await spuren(XL);

    expect(ohne.length, `eine Spur erwartet, gemessen ${ohne.join(' ')}`).toBe(1);
    expect(mit.length, `zwei Spuren erwartet, gemessen ${mit.join(' ')}`).toBe(2);
    expect(mit[0] / mit[1], '7 zu 5').toBeCloseTo(7 / 5, 2);

    // Der Titel füllt die volle Containerbreite, der Lead bleibt bei 52ch.
    const heroKasten = (await hero(page, LG).boundingBox())!;
    const titelKasten = (await titel(page, LG).boundingBox())!;
    const leadKasten = (await hero(page, LG).locator('.z-hero__lead').boundingBox())!;

    expect(titelKasten.width).toBeCloseTo(heroKasten.width, 0);
    expect(titelKasten.width).toBeCloseTo(ohne[0], 0);
    expect(leadKasten.width, 'der Lead behält sein eigenes Maß von 52ch').toBeLessThan(
      titelKasten.width,
    );

    test.info().annotations.push({
      type: 'hero-ohne-aside',
      description:
        `ohne Aside ${ohne.join(' ')}, mit Aside ${mit.join(' ')}, ` +
        `Titel ${Math.round(titelKasten.width)}px, Lead ${Math.round(leadKasten.width)}px`,
    });
  });
});

/**
 * Plus and minus next to the track, which spec/components/Slider/README.md:12
 * requires beyond twelve steps. Both are ordinary tab stops, so the whole
 * slider can be operated without a pointer; at the end of the scale the button
 * on that side keeps the focus and only says aria-disabled.
 */
test.describe('slider-steppers', () => {
  const regler = (page: Page) =>
    page.locator('z-slider').filter({ has: page.getByRole('slider', { name: 'Tickrate' }) });
  const spur = (page: Page) => page.getByRole('slider', { name: 'Tickrate' });
  const weniger = (page: Page) => regler(page).getByRole('button', { name: 'Verringern' });
  const mehr = (page: Page) => regler(page).getByRole('button', { name: 'Erhöhen' });

  test('nur Tastatur: Tab auf Minus, Enter bewegt um einen step', async ({ page }) => {
    await seiteOeffnen(page, 'formulare');

    await expect(spur(page)).toHaveValue('64');

    await spur(page).focus();
    await page.keyboard.press('Shift+Tab');
    await expect(weniger(page)).toBeFocused();

    await page.keyboard.press('Enter');

    await expect(spur(page)).toHaveValue('60');
    await expect(regler(page).locator('.z-range__value')).toHaveText('60 Hz');
    // Der Fokus bleibt auf dem Button, der gerade gedrückt wurde.
    await expect(weniger(page)).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(spur(page)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(mehr(page)).toBeFocused();

    await page.keyboard.press('Enter');

    await expect(spur(page)).toHaveValue('64');
  });

  test('am Ende der Skala aria-disabled, fokussierbar und ohne Wirkung', async ({ page }) => {
    await seiteOeffnen(page, 'formulare');

    await spur(page).focus();
    await page.keyboard.press('End');

    await expect(spur(page)).toHaveValue('128');
    await expect(mehr(page)).toHaveAttribute('aria-disabled', 'true');
    // Nicht nativ gesperrt: der Button bleibt fokussierbar, nur die Wirkung ist weg.
    await expect(mehr(page)).toHaveJSProperty('disabled', false);
    await expect(weniger(page)).not.toHaveAttribute('aria-disabled', 'true');

    await mehr(page).focus();
    await page.keyboard.press('Enter');

    await expect(spur(page)).toHaveValue('128');
    await expect(mehr(page)).toBeFocused();

    await spur(page).focus();
    await page.keyboard.press('Home');

    await expect(spur(page)).toHaveValue('20');
    await expect(weniger(page)).toHaveAttribute('aria-disabled', 'true');
    await expect(mehr(page)).not.toHaveAttribute('aria-disabled', 'true');
  });

  test('ein gesperrter Regler sperrt auch die Buttons', async ({ page }) => {
    await seiteOeffnen(page, 'formulare');
    const gesperrt = page
      .locator('z-slider')
      .filter({ has: page.getByRole('slider', { name: 'Aufbewahrung' }) });

    await expect(gesperrt.getByRole('button', { name: 'Verringern' })).toBeDisabled();
    await expect(gesperrt.getByRole('button', { name: 'Erhöhen' })).toBeDisabled();
  });

  test('Screenshot des Reglers mit steppers', async ({ page }) => {
    await seiteOeffnen(page, 'formulare');

    await expect(regler(page)).toHaveScreenshot('zustaende-slider-steppers.png');
  });

  // Without steppers the range input is a grid item of .z-range, as it was
  // before steppers existed: 20px tall, 40px below 640px, and exactly one
  // --space-2 gap to head and ticks. A wrapper div would put it into a line box
  // and add 5 to 9px under it.
  for (const [breite, hoehe] of [
    [1440, 20],
    [375, 40],
  ] as const) {
    test(`without steppers the track is ${hoehe}px and a direct grid item at ${breite}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: breite, height: 900 });
      await seiteOeffnen(page, 'formulare');

      const masse = await page
        .getByRole('slider', { name: 'Arbeitsspeicher' })
        .evaluate((spurOhne) => {
          const host = spurOhne.parentElement!;
          const box = spurOhne.getBoundingClientRect();
          const kopf = host.querySelector('.z-range__head')!.getBoundingClientRect();
          const marken = host.querySelector('.z-range__ticks')!.getBoundingClientRect();
          return {
            eltern: host.tagName,
            hoehe: box.height,
            abstandOben: box.top - kopf.bottom,
            abstandUnten: marken.top - box.bottom,
          };
        });

      expect(masse).toEqual({ eltern: 'Z-SLIDER', hoehe, abstandOben: 8, abstandUnten: 8 });
    });
  }
});

test.describe('Lädt und Fehler', () => {
  test('Button lädt: Spinner vor dem Text, aria-busy und gesperrt', async ({ page }) => {
    await seiteOeffnen(page, 'grundlage');
    const laedt = page.getByRole('button', { name: 'Wird gestartet' }).first();

    await expect(laedt).toHaveAttribute('aria-busy', 'true');
    // Locked through aria-disabled, not through the native disabled: the
    // button that triggered the action keeps the focus.
    await expect(laedt).toHaveAttribute('aria-disabled', 'true');
    await expect(laedt).not.toHaveAttribute('disabled');
    expect(
      await laedt.evaluate((el) => el.firstElementChild?.classList.contains('z-spinner') ?? false),
      'Spinner steht nicht vor dem Text',
    ).toBe(true);

    await expect(laedt).toHaveScreenshot('zustaende-button-loading.png');
  });

  test('Feld im Fehler: Rahmen in --danger, Satz darunter, aria-invalid', async ({ page }) => {
    await seiteOeffnen(page, 'grundlage');
    const feld = page.getByLabel('Maximale Spieler');
    const danger = await tokenFarbe(page, '--danger');

    await expect(feld).toHaveAttribute('aria-invalid', 'true');
    const rahmen = await stil(feld, [
      'borderTopColor',
      'borderRightColor',
      'borderBottomColor',
      'borderLeftColor',
    ]);
    expect(Object.values(rahmen), 'Rahmen des Feldes nicht in --danger').toEqual([
      danger,
      danger,
      danger,
      danger,
    ]);

    const beschrieben = await feld.getAttribute('aria-describedby');
    expect(beschrieben, 'aria-describedby fehlt').toBeTruthy();
    const satz = page.locator(`#${beschrieben}`);
    await expect(satz).toHaveText('Dein Tarif erlaubt höchstens 100 Spieler.');
    expect((await stil(satz, ['color'])).color, 'Fehlersatz steht nicht in --danger').toBe(danger);
    const oben = await kasten(feld);
    const unten = await kasten(satz);
    expect(unten.y, 'Fehlersatz steht nicht unter dem Feld').toBeGreaterThan(oben.y);

    await expect(page.locator('z-field').filter({ has: feld })).toHaveScreenshot(
      'zustaende-input-error.png',
    );
  });

  test('game-tile mit totem Cover: Text-Fallback statt kaputtem Bild', async ({ page }) => {
    await seiteOeffnen(page, 'werkzeuge');
    const kachel = page.getByRole('button', { name: /Ark: Survival Ascended/ });
    const cover = kachel.locator('.z-game__cover');

    // Das Bild ist weg, sobald der Browser den Fehler meldet; ein kaputtes
    // Bildsymbol kann deshalb gar nicht stehen bleiben.
    await expect(cover.locator('img')).toHaveCount(0);
    await expect(cover).toHaveText('Ark: Survival Ascended');
    // Dieselbe Darstellung wie ohne Cover: Titel in display auf der Coverfläche.
    expect((await stil(cover, ['fontFamily'])).fontFamily).toContain('Space Grotesk');

    // Am Bedienelement ändert sich nichts: Schaltfläche mit aria-pressed, und
    // der Name ist Titel plus Preis, genau wie bei einer Kachel mit heilem und
    // bei einer ohne Cover. Die Coverfläche ist aria-hidden, deshalb steht der
    // Text-Fallback nicht im Namen.
    await expect(kachel).toHaveAttribute('aria-pressed', 'false');
    await expect(cover).toHaveAttribute('aria-hidden', 'true');
    await expect(kachel).toHaveAccessibleName(/^Ark: Survival Ascended ab 6,98/);
    await expect(page.getByRole('button', { name: /Terraria/ })).toHaveAccessibleName(
      /^Terraria ab 1,98/,
    );
    // (coverError) hat genau einmal gemeldet.
    await expect(page.getByText('1-mal gemeldet')).toBeVisible();

    await expect(kachel).toHaveScreenshot('zustaende-game-tile-cover-failed.png');
  });

  test('Tooltip erscheint bei Zeiger und Fokus und beschreibt den Auslöser', async ({ page }) => {
    await seiteOeffnen(page, 'rueckmeldung');
    const wirt = abschnitt(page, 'Tooltip').getByRole('button', { name: 'Neustart' });
    const text = 'Beispiel-Server 1 läuft seit 3 Tagen ohne Neustart';

    await wirt.hover();
    await expect(page.locator('.z-tooltip')).toHaveText(text);
    await expect(wirt).toHaveAttribute('aria-describedby', /.+/);

    await page.mouse.move(0, 0);
    await expect(page.locator('.z-tooltip')).toHaveCount(0);

    await page.keyboard.press('Tab');
    await wirt.focus();
    await expect(page.locator('.z-tooltip')).toHaveText(text);
  });
});

interface Gesperrt {
  name: string;
  route: string;
  ziel: (page: Page) => Locator;
  vorbereiten?: (page: Page) => Promise<void>;
  /** aria-disabled stays in the tab order, native disabled does not. */
  tabErreichbar?: boolean;
  /**
   * Entry of a CDK menu: the menu carries a roving focus, so no entry is a tab
   * stop and Tab closes the whole menu. Instead of the Tab walk the test checks
   * that the entry sits outside the tab order and still takes focus.
   */
  rovingFokus?: boolean;
  /** Visible reason next to the element. */
  grund: string;
  /** Value that a click must not change. */
  wirkung?: (page: Page) => Promise<string>;
}

const GESPERRT: Gesperrt[] = [
  {
    name: 'button-disabled',
    route: 'grundlage',
    ziel: (p) => reihe(p, 'Button', 'Deaktiviert').getByRole('button', { name: 'Stoppen' }),
    grund: 'Beispiel-Server 1 ist bereits gestoppt.',
  },
  {
    name: 'button-link-disabled',
    route: 'grundlage',
    ziel: (p) => reihe(p, 'Button', 'Als Link').getByRole('link', { name: 'Aufladen' }),
    grund: 'Aufladen ist gesperrt, solange die Zahlung läuft.',
    wirkung: async (p) => p.url(),
  },
  {
    name: 'input-disabled',
    route: 'grundlage',
    ziel: (p) => p.getByLabel('Subdomain'),
    grund: 'Die Subdomain vergibt Zenit, sie lässt sich nicht ändern.',
  },
  {
    name: 'select-disabled',
    route: 'grundlage',
    ziel: (p) => p.getByLabel('Standort'),
    grund: 'Zenit betreibt nur Nürnberg.',
  },
  {
    name: 'checkbox-disabled',
    route: 'formulare',
    ziel: (p) => p.getByRole('checkbox', { name: 'server.jar' }),
    grund: 'server.jar gehört zum Loader von PaperMC und lässt sich nicht auswählen.',
    wirkung: async (p) => String(await p.getByRole('checkbox', { name: 'server.jar' }).isChecked()),
  },
  {
    name: 'toggle-disabled',
    route: 'formulare',
    ziel: (p) => p.getByRole('switch', { name: 'Whitelist' }),
    grund: 'Whitelist ist über den Input deaktiviert, solange PaperMC installiert wird.',
    wirkung: async (p) => String(await p.getByRole('switch', { name: 'Whitelist' }).isChecked()),
  },
  {
    name: 'slider-disabled',
    route: 'formulare',
    ziel: (p) => p.getByRole('slider', { name: 'CPU-Kerne' }),
    grund: 'Der Tarif Flex gibt 4 Kerne fest vor.',
    wirkung: async (p) => p.getByRole('slider', { name: 'CPU-Kerne' }).inputValue(),
  },
  {
    name: 'segment-disabled',
    route: 'formulare',
    ziel: (p) =>
      p
        .getByRole('group', { name: 'Ticketstatus im Archiv' })
        .getByRole('button', { name: 'Offen' }),
    grund: 'Im Archiv sind alle Tickets geschlossen.',
    wirkung: async (p) =>
      (await p
        .getByRole('group', { name: 'Ticketstatus im Archiv' })
        .getByRole('button', { name: 'Offen' })
        .getAttribute('aria-pressed')) ?? '',
  },
  {
    // aria-disabled instead of the native disabled: a native disabled on the
    // arrow that was just used would throw the focus back to <body>, so the
    // arrow keeps its tab stop, is announced as disabled and swallows the
    // click. Its look is the .z-btn[aria-disabled="true"] of the reference.
    name: 'pagination-disabled',
    route: 'daten',
    tabErreichbar: true,
    ziel: (p) =>
      p
        .locator('.z-panel')
        .filter({ hasText: 'Erste Seite' })
        .getByRole('button', { name: 'Vorherige Seite' }),
    grund:
      'Auf der ersten Seite ist der Pfeil zurück deaktiviert, auf der letzten der Pfeil weiter.',
    wirkung: async (p) =>
      p
        .locator('.z-panel')
        .filter({ hasText: 'Erste Seite' })
        .locator('.z-pager__nav .z-mono')
        .innerText(),
  },
  {
    // aria-disabled instead of disabled, so the button keeps its tooltip.
    name: 'button-aria-disabled',
    route: 'rueckmeldung',
    ziel: (p) => abschnitt(p, 'Tooltip').getByRole('button', { name: 'Stoppen' }),
    tabErreichbar: true,
    grund: 'Stoppen ist gesperrt: Beispiel-Server 1 ist bereits gestoppt.',
  },
  {
    name: 'menu-item-disabled',
    route: 'overlays',
    vorbereiten: menuOeffnen,
    ziel: (p) => p.getByRole('menuitem', { name: 'Zugriff teilen' }),
    rovingFokus: true,
    grund: 'Zugriff teilen ist gesperrt, solange Beispiel-Server 1 installiert wird.',
    wirkung: async (p) => (await p.locator('.demo-sub').count()) + '',
  },
  {
    name: 'console-input-disabled',
    route: 'werkzeuge',
    ziel: (p) => p.getByRole('textbox', { name: 'Befehl' }).nth(1),
    grund: 'Beispiel-Server 1 ist gestoppt, deshalb nimmt die Konsole keine Befehle an.',
    wirkung: async (p) => p.getByRole('textbox', { name: 'Befehl' }).nth(1).inputValue(),
  },
];

test.describe('Deaktiviert', () => {
  for (const gesperrt of GESPERRT) {
    test(`${gesperrt.name}: 45 % Deckkraft, not-allowed, Grund und wirkungsloser Klick`, async ({
      page,
    }) => {
      await seiteOeffnen(page, gesperrt.route);
      await gesperrt.vorbereiten?.(page);
      const ziel = gesperrt.ziel(page);
      await ziel.scrollIntoViewIfNeeded();

      const werte = await stil(ziel, ['opacity', 'cursor']);
      expect(werte.opacity, `${gesperrt.name}: Deckkraft`).toBe('0.45');
      expect(werte.cursor, `${gesperrt.name}: Zeiger`).toBe('not-allowed');

      // Der Grund steht sichtbar daneben.
      await expect(page.getByText(gesperrt.grund, { exact: false }).first()).toBeVisible();

      if (gesperrt.rovingFokus) {
        // Menü: kein eigener Tab-Stopp, aber der Eintrag nimmt den Fokus an,
        // damit das CDK ihn mit den Pfeiltasten ansteuern und vorlesen kann.
        expect(await ziel.evaluate((el) => (el as HTMLElement).tabIndex), 'tabindex').toBe(-1);
        await ziel.focus();
        expect(await ziel.evaluate((el) => el === document.activeElement), 'Fokus').toBe(true);
      } else {
        // Tab-Erreichbarkeit: vom vorherigen Tab-Stopp aus einmal weiter.
        const vorher = await ziel.evaluate((el) => {
          const auswahl = 'a[href], button, input, select, textarea, summary, [tabindex]';
          const vorgaenger = Array.from(document.querySelectorAll<HTMLElement>(auswahl)).filter(
            (kandidat) =>
              kandidat !== el &&
              kandidat.tabIndex >= 0 &&
              !(kandidat as HTMLInputElement).disabled &&
              kandidat.getBoundingClientRect().width > 0 &&
              (el.compareDocumentPosition(kandidat) & Node.DOCUMENT_POSITION_PRECEDING) !== 0,
          );
          const letzter = vorgaenger[vorgaenger.length - 1];
          letzter?.focus();
          return !!letzter && document.activeElement === letzter;
        });
        expect(vorher, `${gesperrt.name}: kein vorheriger Tab-Stopp gefunden`).toBe(true);
        await page.keyboard.press('Tab');
        const fokussiert = await ziel.evaluate((el) => el === document.activeElement);
        expect(fokussiert, `${gesperrt.name}: Tab-Erreichbarkeit`).toBe(
          gesperrt.tabErreichbar ?? false,
        );
      }

      // Der Klick tut nichts.
      if (gesperrt.wirkung) {
        const vorKlick = await gesperrt.wirkung(page);
        await ziel.click({ force: true, noWaitAfter: true });
        expect(await gesperrt.wirkung(page), `${gesperrt.name}: Klick wirkt trotzdem`).toBe(
          vorKlick,
        );
      }

      await expect(ziel).toHaveScreenshot(`zustaende-${gesperrt.name}.png`);
    });
  }
});
