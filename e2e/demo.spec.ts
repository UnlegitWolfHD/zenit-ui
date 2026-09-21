import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Prüfung der Demo-App gegen "Abnahme je Route" (spec/guidelines/00-auftrag.md)
 * und die Abnahmepunkte A3, A4, A7, A9 aus docs/pakete.md.
 *
 * Die Tests laufen generisch über ROUTEN. Sie prüfen heute die Stubs und nach
 * dem Zusammenfügen ohne Änderung die gefüllten Seiten.
 */
const ROUTEN = [
  'grundlage',
  'formulare',
  'navigation',
  'daten',
  'rueckmeldung',
  'overlays',
  'werkzeuge',
] as const;

/** Die 7 Größen aus CLAUDE.md, "Typografie". */
const SCHRIFTGROESSEN = [12, 14, 16, 20, 28, 40, 56];
/** Die 3 Schriften aus tokens.css. Material Icons ist Icon-Schrift, kein Textstil. */
const TEXTSCHRIFTEN = ['Inter', 'Space Grotesk', 'JetBrains Mono'];
/** radius-sm, radius-md, radius-full; 50 % als gleichwertige Schreibweise. */
const RADIEN = ['0px', '0', '4px', '8px', '9999px', '50%'];

async function seiteOeffnen(page: Page, route: string, breite: number, hoehe = 900) {
  await page.setViewportSize({ width: breite, height: hoehe });
  await page.goto(`/${route}`);
  await page.locator('main h1').first().waitFor();
  await page.evaluate(() => document.fonts.ready.then(() => true));
}

for (const route of ROUTEN) {
  test.describe(route, () => {
    for (const breite of [1440, 375]) {
      test(`Screenshot ${breite}px`, async ({ page }) => {
        await seiteOeffnen(page, route, breite);
        await expect(page).toHaveScreenshot(`${route}-${breite}.png`, { fullPage: true });
      });
    }

    test('axe ohne Verstöße', async ({ page }) => {
      await seiteOeffnen(page, route, 1440);
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
      expect(lesbar, `axe-Verstöße auf /${route}`).toEqual([]);
    });

    test('360px ohne horizontales Scrollen', async ({ page }) => {
      await seiteOeffnen(page, route, 360, 800);
      const masse = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(
        masse.scrollWidth,
        `/${route} scrollt bei 360px waagerecht (${masse.scrollWidth} > ${masse.clientWidth})`,
      ).toBeLessThanOrEqual(masse.clientWidth);
    });

    test('Stil-Regeln im berechneten Style', async ({ page }) => {
      await seiteOeffnen(page, route, 1440);
      const bericht = await page.evaluate(
        ([groessen, textschriften, radien]) => {
          const beschreibung = (el: Element, pseudo = '') => {
            const klasse = (el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean);
            const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
            return (
              el.nodeName.toLowerCase() +
              (klasse.length ? '.' + klasse.join('.') : '') +
              pseudo +
              (text ? ` "${text}"` : '')
            );
          };
          const eigenerText = (el: Element) =>
            Array.from(el.childNodes).some(
              (n) => n.nodeType === 3 && (n.textContent || '').trim().length > 0,
            );
          const sichtbar = (el: Element) => {
            const pruefung = (el as Element & { checkVisibility?: () => boolean }).checkVisibility;
            return pruefung ? pruefung.call(el) : true;
          };
          const erste = (familie: string) =>
            (familie.split(',')[0] || '').trim().replace(/^["']|["']$/g, '');

          const verlauf: string[] = [];
          const backdrop: string[] = [];
          const schatten: string[] = [];
          const radius: string[] = [];
          const groessenFunde: string[] = [];
          const schriftFunde: string[] = [];
          const textschriftenGefunden = new Set<string>();
          const iconschriften = new Set<string>();

          const alle = Array.from(document.body.querySelectorAll('*'));
          for (const el of [document.body, ...alle]) {
            for (const pseudo of ['', '::before', '::after']) {
              const st = getComputedStyle(el, pseudo || undefined);
              if (pseudo && st.content === 'none') continue;
              const name = beschreibung(el, pseudo);
              if (st.backgroundImage.includes('gradient')) {
                verlauf.push(`${name}: background-image ${st.backgroundImage}`);
              }
              if (st.backdropFilter && st.backdropFilter !== 'none') {
                backdrop.push(`${name}: backdrop-filter ${st.backdropFilter}`);
              }
              if (st.textShadow && st.textShadow !== 'none') {
                schatten.push(`${name}: text-shadow ${st.textShadow}`);
              }
              for (const ecke of [
                'borderTopLeftRadius',
                'borderTopRightRadius',
                'borderBottomRightRadius',
                'borderBottomLeftRadius',
              ] as const) {
                for (const teil of st[ecke].split(/\s+/).filter(Boolean)) {
                  if (!radien.includes(teil)) radius.push(`${name}: ${ecke} ${st[ecke]}`);
                }
              }
            }

            if (!eigenerText(el) || !sichtbar(el)) continue;
            const st = getComputedStyle(el);
            const name = beschreibung(el);
            const familie = erste(st.fontFamily);
            const groesse = Math.round(parseFloat(st.fontSize) * 100) / 100;
            const istIcon = el.classList.contains('z-icon');
            if (istIcon) {
              iconschriften.add(familie);
              // Icons tragen 20px (--icon) oder 16px (z-icon--sm) und sind damit
              // abgenommen; alles andere an einem z-icon ist ein Fund.
              if (groesse !== 16 && groesse !== 20) {
                groessenFunde.push(`${name}: Icon mit ${groesse}px statt 16/20px`);
              }
              continue;
            }
            textschriftenGefunden.add(familie);
            if (!textschriften.includes(familie)) {
              schriftFunde.push(`${name}: font-family ${st.fontFamily}`);
            }
            if (!groessen.includes(groesse)) {
              groessenFunde.push(`${name}: font-size ${groesse}px`);
            }
          }

          return {
            verlauf,
            backdrop,
            schatten,
            radius: Array.from(new Set(radius)),
            groessenFunde: Array.from(new Set(groessenFunde)),
            schriftFunde: Array.from(new Set(schriftFunde)),
            textschriften: Array.from(textschriftenGefunden).sort(),
            iconschriften: Array.from(iconschriften).sort(),
          };
        },
        [SCHRIFTGROESSEN, TEXTSCHRIFTEN, RADIEN] as const,
      );

      test
        .info()
        .annotations.push({
          type: 'Schriften',
          description: `Text: ${bericht.textschriften.join(', ') || '(keine)'} | Icon: ${bericht.iconschriften.join(', ') || '(keine)'}`,
        });

      expect.soft(bericht.verlauf, `/${route}: Verläufe`).toEqual([]);
      expect.soft(bericht.backdrop, `/${route}: backdrop-filter`).toEqual([]);
      expect.soft(bericht.schatten, `/${route}: text-shadow`).toEqual([]);
      expect.soft(bericht.radius, `/${route}: border-radius außerhalb 0/4/8/9999px`).toEqual([]);
      expect.soft(bericht.schriftFunde, `/${route}: fremde Schriftfamilie`).toEqual([]);
      expect
        .soft(bericht.groessenFunde, `/${route}: Schriftgröße außerhalb 12/14/16/20/28/40/56px`)
        .toEqual([]);
      expect
        .soft(bericht.textschriften.length, `/${route}: Textschriften ${bericht.textschriften}`)
        .toBeLessThanOrEqual(3);
    });

    test('Fokus-Ring auf jedem Tab-Stopp', async ({ page }) => {
      await seiteOeffnen(page, route, 1440);
      const fokusFarbe = await page.evaluate(() => {
        const probe = document.createElement('span');
        probe.style.color = 'var(--focus)';
        document.body.appendChild(probe);
        const farbe = getComputedStyle(probe).color;
        probe.remove();
        return farbe;
      });
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

      const gesehen = new Set<string>();
      const funde: string[] = [];
      const ersatzringe: string[] = [];
      for (let schritt = 0; schritt < 300; schritt++) {
        await page.keyboard.press('Tab');
        const info = await page.evaluate((farbe) => {
          const el = document.activeElement;
          if (!el || el === document.body || el === document.documentElement) return null;
          const pfad: string[] = [];
          let knoten: Element | null = el;
          while (knoten && knoten !== document.documentElement) {
            const eltern: Element | null = knoten.parentElement;
            const index = eltern ? Array.prototype.indexOf.call(eltern.children, knoten) + 1 : 1;
            pfad.unshift(`${knoten.nodeName.toLowerCase()}:nth-child(${index})`);
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
          // Fokus-Ring absichtlich am Nachbarn: nur Eltern und Geschwister zählen.
          const nachbarn = [
            el.parentElement,
            ...(el.parentElement ? Array.from(el.parentElement.children) : []),
          ].filter((n): n is Element => !!n && n !== el);
          let nachbarRing: string | null = null;
          for (const n of nachbarn) {
            const ns = getComputedStyle(n);
            if (ringSitzt(ns)) {
              nachbarRing = `${beschreibung(n)} (outline)`;
              break;
            }
            if (ns.boxShadow !== 'none' && ns.boxShadow.includes(farbe)) {
              nachbarRing = `${beschreibung(n)} (box-shadow aus --focus)`;
              break;
            }
          }
          return {
            pfad: pfad.join('>'),
            name: beschreibung(el),
            ringSitzt: ringSitzt(st),
            outline: `${st.outlineStyle} ${st.outlineWidth}`,
            nachbarRing,
            unsichtbar:
              rect.width < 2 ||
              rect.height < 2 ||
              st.visibility === 'hidden' ||
              parseFloat(st.opacity) === 0,
          };
        }, fokusFarbe);

        if (!info) break;
        if (gesehen.has(info.pfad)) break;
        gesehen.add(info.pfad);

        if (info.ringSitzt) continue;
        if (info.unsichtbar && info.nachbarRing) {
          ersatzringe.push(`${info.name} -> Ring an ${info.nachbarRing}`);
          continue;
        }
        funde.push(
          `${info.name}: outline "${info.outline}"` +
            (info.nachbarRing ? ` (Nachbar-Ring ${info.nachbarRing}, aber Element ist sichtbar)` : ' (kein Ring am Element und keiner am Nachbarn)'),
        );
      }

      if (ersatzringe.length) {
        test.info().annotations.push({ type: 'Ersatzring', description: ersatzringe.join(' | ') });
      }
      expect(gesehen.size, `/${route} hat keinen Tab-Stopp`).toBeGreaterThan(0);
      expect(funde, `/${route}: Tab-Stopps ohne sichtbaren 2px-Fokus-Ring`).toEqual([]);
    });

    test('Klickziele bei 375px', async ({ page }) => {
      await seiteOeffnen(page, route, 375, 800);
      const ziele = await page.evaluate(() => {
        const beschreibung = (el: Element) => {
          const klasse = (el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean);
          const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30);
          return (
            el.nodeName.toLowerCase() +
            (klasse.length ? '.' + klasse.join('.') : '') +
            (text ? ` "${text}"` : '')
          );
        };
        const funde: string[] = [];
        const auswahl = document.body.querySelectorAll(
          'a, button, input, select, summary, [role="switch"], [tabindex="0"]',
        );
        for (const el of Array.from(auswahl)) {
          const st = getComputedStyle(el);
          const eigen = el.getBoundingClientRect();
          if (st.display === 'none' || st.visibility === 'hidden') continue;
          // Nur fuer die Tastatur sichtbar (Skip-Link, sr-only): kein Klickziel.
          // Im Fokus klappt der Link auf und wird hier wieder mitgeprueft.
          if (
            (st.clipPath !== 'none' || st.clip !== 'auto') &&
            eigen.width <= 2 &&
            eigen.height <= 2
          )
            continue;
          // Checkbox, Radio, Switch und Range liegen im <label>: geklickt wird
          // das Label, also zählt dessen Box.
          const ziel = el.closest('label') ?? el;
          const rect = ziel.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;
          if (rect.height >= 39.5) continue;
          // Inline-Link im Fließtext: Höhe ist die Zeilenhöhe, kein Klickziel.
          if (el.nodeName === 'A' && st.display === 'inline') continue;
          // Die Box ist nicht immer die Trefferflaeche: ein absolut gesetztes
          // ::before vergroessert sie, ohne die Box zu aendern (z-toggle).
          // Gemessen wird deshalb, wie hoch der Streifen ist, der den Klick
          // wirklich auf das Ziel leitet.
          ziel.scrollIntoView({ block: 'center' });
          const sicht = ziel.getBoundingClientRect();
          const x = Math.round(sicht.left + sicht.width / 2);
          const mitte = Math.round(sicht.top + sicht.height / 2);
          const trifft = (y: number) => {
            const getroffen = document.elementFromPoint(x, y);
            return !!getroffen && (getroffen === ziel || ziel.contains(getroffen));
          };
          let hoehe = sicht.height;
          if (trifft(mitte)) {
            let oben = mitte;
            let unten = mitte;
            while (mitte - oben < 40 && trifft(oben - 1)) oben--;
            while (unten - mitte < 40 && trifft(unten + 1)) unten++;
            hoehe = Math.max(hoehe, unten - oben + 1);
          }
          if (hoehe >= 39.5) continue;
          funde.push(
            `${beschreibung(el)}: ${Math.round(hoehe * 10) / 10}px hoch` +
              (ziel === el ? '' : ` (gemessen am ${beschreibung(ziel)})`),
          );
        }
        return { funde };
      });

      expect(ziele.funde, `/${route}: Klickziele unter 40px Höhe bei 375px`).toEqual([]);
    });
  });
}
