import { expect, test, type Page } from '@playwright/test';

/**
 * Semantic structure of every demo route, read from the browser's accessibility
 * tree (CDP `Accessibility.getFullAXTree`) and from the DOM.
 *
 * axe already passes on every page (`demo.spec.ts`), but axe does not judge the
 * structure a screen-reader user navigates by: landmarks, the heading outline,
 * the names of the widgets, the states that are really exposed, the live
 * regions and the table semantics. That is what this file checks, per route at
 * 1440px and at 375px, because the header menu and the sidebar select change
 * the tree on mobile.
 *
 * Every check is asserted. Where the demo deviates from the rule on purpose,
 * the reason stands above the check and the expectation spells the deviation
 * out, so a different deviation still fails.
 *
 * Run:
 *   E2E_PORT=4480 npx playwright test e2e/a11y-baum.spec.ts
 */

/**
 * The eleven routes with the text of their navigation link and the headings the
 * page is expected to carry as `h1`.
 *
 * Usually the `h1` is the navigation link, as CLAUDE.md demands ("Seitentitel
 * und Navigationslink heißen gleich"). Three routes deviate: one component
 * page previews a component that brings its own page heading, and the two
 * pattern pages carry the heading of the product page they imitate. The
 * expected headings are written out per route, so any other change still fails.
 */
const ROUTEN = [
  { pfad: 'grundlage', nav: 'Grundlage', h1: ['Grundlage'] },
  { pfad: 'formulare', nav: 'Formulare', h1: ['Formulare'] },
  // /navigation carries four h1: z-page-header renders its title as the page
  // h1 (page-header.ts) and the page previews three of them, so jumping by h1
  // lands on previews instead of on the page. Accepted for the component
  // gallery, which has to show the real markup; a heading level input on
  // z-page-header would be the fix if a product ever needs one.
  {
    pfad: 'navigation',
    nav: 'Navigation',
    h1: ['Navigation', 'Gameserver', 'Abrechnung', 'Dashboard'],
  },
  { pfad: 'daten', nav: 'Daten', h1: ['Daten'] },
  { pfad: 'rueckmeldung', nav: 'Rückmeldung', h1: ['Rückmeldung'] },
  { pfad: 'overlays', nav: 'Overlays', h1: ['Overlays'] },
  // The Hero preview sets headingLevel="2", so the hero title joins the
  // outline below the page heading instead of becoming a second h1.
  { pfad: 'werkzeuge', nav: 'Werkzeuge', h1: ['Werkzeuge'] },
  { pfad: 'konfigurator', nav: 'Konfigurator', h1: ['Konfigurator'] },
  { pfad: 'themes', nav: 'Themes', h1: ['Themes'] },
  { pfad: 'muster/dashboard', nav: 'Dashboard', h1: ['Dashboard'] },
  // The two pattern pages simulate a product page, so their h1 is the page
  // they imitate, not the demo navigation link.
  { pfad: 'muster/server-panel', nav: 'Server-Panel', h1: ['Beispiel-Server 1'] },
  {
    pfad: 'muster/startseite',
    nav: 'Startseite',
    h1: ['Gameserver aus Nürnberg. In etwa 60 Sekunden online.'],
  },
  { pfad: 'muster/server-erstellen', nav: 'Server erstellen', h1: ['Server erstellen'] },
  { pfad: 'muster/preisrechner', nav: 'Preisrechner', h1: ['Preisrechner'] },
] as const;

/** Desktop and mobile: below 900px the header menu and the sidebar select appear. */
const BREITEN = [1440, 375] as const;

/** Roles that open a landmark. */
const LANDMARKEN = new Set([
  'banner',
  'complementary',
  'contentinfo',
  'form',
  'main',
  'navigation',
  'region',
  'search',
]);

/** The widget roles whose accessible name is checked. */
const WIDGETS = new Set([
  'button',
  'checkbox',
  'combobox',
  'link',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'radio',
  'searchbox',
  'slider',
  'spinbutton',
  'switch',
  'tab',
  'textbox',
]);

/**
 * Every Material icon ligature the demo uses, collected from `<z-icon name="…">`
 * and the `icon="…"` inputs. A ligature renders as text, so an accessible name
 * that contains one means the icon leaked into the name instead of a label.
 * Matched case sensitively and delimited by whitespace, because German labels
 * are capitalised ("Info" is a word, `info` is the icon) and a file name may
 * well begin with one ("backup-2026-09-20.zip").
 */
const LIGATUREN = [
  'account_balance_wallet',
  'add',
  'arrow_back',
  'backup',
  'check_circle',
  'chevron_left',
  'chevron_right',
  'close',
  'content_copy',
  'dashboard',
  'delete',
  'description',
  'dns',
  'download',
  'drive_file_move',
  'edit_note',
  'error',
  'folder',
  'group',
  'group_add',
  'info',
  'menu',
  'more_vert',
  'play_arrow',
  'power_settings_new',
  'refresh',
  'remove',
  'report',
  'restart_alt',
  'search',
  'stop',
  'terminal',
  'tune',
  'upload',
  'warning',
];

/** Link texts that say nothing without their surroundings. */
const VAGE_LINKTEXTE = [
  'hier',
  'hier klicken',
  'klick hier',
  'klicken sie hier',
  'mehr',
  'mehr dazu',
  'mehr erfahren',
  'weiterlesen',
  'link',
  'read more',
  'more',
];

/** English UI words that must not show up in the German demo. */
const ENGLISCHE_UI_WOERTER = ['Close', 'Next', 'Previous', 'Loading', 'Pagination'];

/* ------------------------------------------------------------------ *
 * Reading the accessibility tree
 * ------------------------------------------------------------------ */

/** One element of the DOM as CDP hands it over. */
interface DomRoh {
  backendNodeId: number;
  nodeType: number;
  nodeName: string;
  nodeValue?: string;
  attributes?: string[];
  children?: DomRoh[];
  shadowRoots?: DomRoh[];
  contentDocument?: DomRoh;
}

/** One node of the accessibility tree as CDP hands it over. */
interface AxRoh {
  nodeId: string;
  parentId?: string;
  childIds?: string[];
  backendDOMNodeId?: number;
  ignored: boolean;
  role?: { value?: unknown };
  name?: { value?: unknown };
  properties?: { name: string; value?: { value?: unknown } }[];
}

/** An element with its attributes and its own text. */
interface DomEintrag {
  id: number;
  tag: string;
  attr: Record<string, string>;
  text: string;
  wo: string;
}

/** A node of the accessibility tree together with the element behind it. */
interface Knoten {
  id: number;
  rolle: string;
  name: string;
  ignoriert: boolean;
  eig: Record<string, string>;
  tag: string;
  attr: Record<string, string>;
  wo: string;
  /** The landmarks above the node, outermost first. */
  landmarken: string[];
  /** The heading that was open when the node appeared. */
  abschnitt: string;
}

/** Everything one page state hands to the checks. */
interface Bericht {
  knoten: Knoten[];
  dom: DomEintrag[];
  /** Every element with the accessibility node it became, if it has one. */
  zuDom: { dom: DomEintrag; ax: Knoten | null }[];
  lang: string;
  skip: { href: string; zielDa: boolean; fokussierbar: boolean };
  refs: string[];
  tabellen: Tabelle[];
  reihen: Reihen[];
  englisch: string[];
  toast: { wo: string; rolle: string; live: string; atomic: string }[];
}

/** One `table[zTable]` with its header cells and rows. */
interface Tabelle {
  panel: string;
  busy: boolean;
  kopf: { text: string; name: string }[];
  spalten: number;
  zeilen: { name: string; kastenName: string | null }[];
}

/** One `z-rows` list with the roles its parts get in the tree. */
interface Reihen {
  panel: string;
  kopfZellen: string[];
  zeilen: number;
}

/** Short, readable description of an element. */
function beschreibe(tag: string, attr: Record<string, string>, text: string): string {
  const klassen = (attr['class'] ?? '').trim().split(/\s+/).filter(Boolean).slice(0, 3);
  const id = attr['id'] ? `#${attr['id']}` : '';
  const kurz = text.slice(0, 40);
  return `${tag}${id}${klassen.length ? '.' + klassen.join('.') : ''}${kurz ? ` "${kurz}"` : ''}`;
}

/** Walks the CDP DOM tree into a map from `backendNodeId` to element. */
function domSammeln(roh: DomRoh, karte: Map<number, DomEintrag>): void {
  if (roh.nodeType === 1) {
    const attr: Record<string, string> = {};
    const liste = roh.attributes ?? [];
    for (let i = 0; i + 1 < liste.length; i += 2) {
      attr[liste[i]] = liste[i + 1];
    }
    const text = (roh.children ?? [])
      .filter((kind) => kind.nodeType === 3)
      .map((kind) => kind.nodeValue ?? '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    const tag = roh.nodeName.toLowerCase();
    karte.set(roh.backendNodeId, {
      id: roh.backendNodeId,
      tag,
      attr,
      text,
      wo: beschreibe(tag, attr, text),
    });
  }
  for (const kind of [...(roh.children ?? []), ...(roh.shadowRoots ?? [])]) {
    domSammeln(kind, karte);
  }
  if (roh.contentDocument) {
    domSammeln(roh.contentDocument, karte);
  }
}

/**
 * Reads the accessibility tree and the DOM of the open page.
 *
 * `page.accessibility` is deprecated, so the tree comes from CDP. The DOM comes
 * from the same session, which gives every accessibility node its element back
 * (tag, attributes, text) without a second round trip per node.
 */
async function baumLesen(page: Page): Promise<{ knoten: Knoten[]; dom: DomEintrag[] }> {
  const sitzung = await page.context().newCDPSession(page);
  try {
    await sitzung.send('DOM.enable');
    await sitzung.send('Accessibility.enable');
    const dokument = (await sitzung.send('DOM.getDocument', {
      depth: -1,
      pierce: true,
    })) as unknown as { root: DomRoh };
    const karte = new Map<number, DomEintrag>();
    domSammeln(dokument.root, karte);

    const baum = (await sitzung.send('Accessibility.getFullAXTree')) as unknown as {
      nodes: AxRoh[];
    };
    const nachId = new Map(baum.nodes.map((n) => [n.nodeId, n]));
    const knoten: Knoten[] = [];
    let abschnitt = '';

    const gehe = (roh: AxRoh, landmarken: string[]): void => {
      const element = karte.get(roh.backendDOMNodeId ?? -1);
      const rolle = String(roh.role?.value ?? '');
      const name = String(roh.name?.value ?? '').trim();
      const eig: Record<string, string> = {};
      for (const p of roh.properties ?? []) {
        eig[p.name] = String(p.value?.value ?? '');
      }
      knoten.push({
        id: roh.backendDOMNodeId ?? -1,
        rolle,
        name,
        ignoriert: roh.ignored,
        eig,
        tag: element?.tag ?? '',
        attr: element?.attr ?? {},
        wo: element?.wo ?? `(ohne Element) ${rolle}`,
        landmarken,
        abschnitt,
      });
      if (rolle === 'heading' && name) {
        abschnitt = name;
      }
      const tiefer = LANDMARKEN.has(rolle)
        ? [...landmarken, `${rolle}${name ? ` "${name}"` : ' (ohne Namen)'}`]
        : landmarken;
      for (const kindId of roh.childIds ?? []) {
        const kind = nachId.get(kindId);
        if (kind) {
          gehe(kind, tiefer);
        }
      }
    };

    const wurzel = baum.nodes.find((n) => !n.parentId) ?? baum.nodes[0];
    if (wurzel) {
      gehe(wurzel, []);
    }
    return { knoten, dom: [...karte.values()] };
  } finally {
    await sitzung.detach();
  }
}

/**
 * Everything that is easier to read straight from the document: the language,
 * the skip link, dangling id references, the tables, the `z-rows` lists and
 * English UI strings.
 */
async function domLesen(page: Page, wortliste: string[]) {
  return page.evaluate((woerter) => {
    /** Text without the aria-hidden parts, so icon ligatures do not count. */
    const sichtbarerText = (el: Element): string => {
      let text = '';
      for (const kind of Array.from(el.childNodes)) {
        if (kind.nodeType === 3) {
          text += kind.nodeValue ?? '';
        } else if (kind.nodeType === 1) {
          const kindEl = kind as Element;
          if (kindEl.getAttribute('aria-hidden') !== 'true') {
            text += ' ' + sichtbarerText(kindEl);
          }
        }
      }
      return text.replace(/\s+/g, ' ').trim();
    };
    const kurz = (el: Element) => {
      const klassen = (el.getAttribute('class') ?? '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 3);
      const text = sichtbarerText(el).slice(0, 40);
      return (
        el.nodeName.toLowerCase() +
        (el.id ? `#${el.id}` : '') +
        (klassen.length ? '.' + klassen.join('.') : '') +
        (text ? ` "${text}"` : '')
      );
    };

    // Mark what looks disabled, so the accessibility tree can be asked whether
    // it says so too. The attribute changes nothing that is rendered.
    const bedienbar =
      'a, button, input, select, textarea, summary, [role="button"], [role="link"], [role="menuitem"]';
    for (const el of Array.from(document.querySelectorAll(bedienbar))) {
      const stil = getComputedStyle(el);
      if (stil.cursor === 'not-allowed' || stil.pointerEvents === 'none') {
        el.setAttribute('data-pruef-gesperrt', '1');
      } else {
        el.removeAttribute('data-pruef-gesperrt');
      }
    }

    // Mark what is not rendered at this width. The sidebar becomes a select and
    // the header navigation folds into a menu, so their entries are gone from
    // the tree on purpose; their states are nothing the tree has to show.
    const zustandsTraeger =
      '[aria-current], [aria-pressed], [aria-expanded], [aria-disabled], [aria-invalid], [aria-busy]';
    for (const el of Array.from(document.querySelectorAll(zustandsTraeger))) {
      if ((el as HTMLElement).checkVisibility?.()) {
        el.removeAttribute('data-pruef-unsichtbar');
      } else {
        el.setAttribute('data-pruef-unsichtbar', '1');
      }
    }

    // Every id that aria-labelledby, aria-describedby, aria-controls or
    // aria-owns points at has to exist.
    const refs: string[] = [];
    for (const el of Array.from(
      document.querySelectorAll(
        '[aria-labelledby], [aria-describedby], [aria-controls], [aria-owns]',
      ),
    )) {
      for (const attribut of [
        'aria-labelledby',
        'aria-describedby',
        'aria-controls',
        'aria-owns',
      ]) {
        const wert = el.getAttribute(attribut);
        if (!wert) continue;
        for (const id of wert.trim().split(/\s+/).filter(Boolean)) {
          if (!document.getElementById(id)) {
            refs.push(`${kurz(el)}: ${attribut}="${id}" zeigt ins Leere`);
          }
        }
      }
    }

    const skipLink = document.querySelector<HTMLAnchorElement>('a.z-skip-link');
    const ziel = skipLink
      ? document.getElementById((skipLink.getAttribute('href') ?? '').replace('#', ''))
      : null;
    const skip = {
      href: skipLink?.getAttribute('href') ?? '',
      zielDa: !!ziel,
      fokussierbar: !!ziel?.matches('a[href], button, input, select, textarea, [tabindex]'),
    };

    const panelTitel = (el: Element) =>
      el.closest('.z-panel')?.querySelector('.z-panel__title')?.textContent?.trim() ??
      '(ohne Panel)';

    const tabellen = Array.from(document.querySelectorAll('table.z-table')).map((tabelle) => {
      const kopf = Array.from(tabelle.querySelectorAll('thead th')).map((th) => {
        const text = sichtbarerText(th);
        const innen = th.querySelector('[aria-label]')?.getAttribute('aria-label') ?? '';
        return { text, name: text || (th.getAttribute('aria-label') ?? '') || innen };
      });
      const zeilen = Array.from(tabelle.querySelectorAll('tbody tr')).map((tr) => ({
        name: sichtbarerText(tr.querySelector('.z-table__name') ?? tr.children[1] ?? tr),
        kastenName:
          tr.querySelector('input[type="checkbox"]')?.getAttribute('aria-label') ??
          (tr.querySelector('input[type="checkbox"]') ? '' : null),
      }));
      return {
        panel: panelTitel(tabelle),
        busy: !!tabelle.closest('[aria-busy="true"]'),
        kopf,
        spalten: tabelle.querySelector('tbody tr')?.children.length ?? 0,
        zeilen,
      };
    });

    const reihen = Array.from(document.querySelectorAll('.z-rows')).map((liste) => ({
      panel: panelTitel(liste),
      kopfZellen: Array.from(liste.querySelector('.z-rows__head')?.children ?? []).map((zelle) =>
        sichtbarerText(zelle),
      ),
      zeilen: liste.querySelectorAll('.z-row').length,
    }));

    // Only strings that are part of the interface are scanned. The prose and
    // the section headings name the components in English on purpose
    // ("Pagination", "FileTable"), and the English pagination on /daten is a
    // deliberate example of the English label set.
    const englisch: string[] = [];
    const ui =
      'button, a, label, th, option, summary, [role="button"], [role="menuitem"], .z-badge';
    for (const el of Array.from(document.querySelectorAll(ui))) {
      if (el.closest('demo-englische-pagination')) continue;
      if (!(el as HTMLElement).checkVisibility?.()) continue;
      const text = `${sichtbarerText(el)} ${el.getAttribute('aria-label') ?? ''}`;
      for (const wort of woerter) {
        if (new RegExp(`\\b${wort}\\b`, 'i').test(text)) {
          englisch.push(`${kurz(el)}: "${wort}"`);
        }
      }
    }

    const toast = Array.from(document.querySelectorAll('.z-toast-outlet__live')).map((bereich) => ({
      wo: kurz(bereich),
      rolle: bereich.getAttribute('role') ?? '',
      live: bereich.getAttribute('aria-live') ?? '',
      atomic: bereich.getAttribute('aria-atomic') ?? '',
    }));

    return {
      lang: document.documentElement.getAttribute('lang') ?? '',
      skip,
      refs,
      tabellen,
      reihen,
      englisch,
      toast,
    };
  }, wortliste);
}

/** Opens a route in the wanted width and waits for its heading and the fonts. */
async function seiteOeffnen(page: Page, route: string, breite: number): Promise<void> {
  await page.setViewportSize({ width: breite, height: 900 });
  await page.goto(`/${route}`);
  await page.locator('main h1').first().waitFor();
  await page.evaluate(() => document.fonts.ready.then(() => true));
}

/** Reads one page state completely. */
async function berichtLesen(page: Page): Promise<Bericht> {
  const teil = await domLesen(page, ENGLISCHE_UI_WOERTER);
  const { knoten, dom } = await baumLesen(page);
  // The join runs over the backendNodeId, not over the description: a demo
  // page shows the same button several times, and two of them differ only in
  // their state.
  const axNachId = new Map<number, Knoten>();
  for (const k of knoten) {
    if (!axNachId.has(k.id)) {
      axNachId.set(k.id, k);
    }
  }
  return {
    knoten,
    dom,
    zuDom: dom.map((eintrag) => ({ dom: eintrag, ax: axNachId.get(eintrag.id) ?? null })),
    ...teil,
  };
}

/**
 * One page load per route and width, shared by the checks of that state. The
 * report is plain data, so every test works on the same tree instead of
 * loading the page six times.
 */
const berichte = new Map<string, Promise<Bericht>>();

function bericht(page: Page, route: string, breite: number): Promise<Bericht> {
  const schluessel = `${route}@${breite}`;
  const vorhanden = berichte.get(schluessel);
  if (vorhanden) {
    return vorhanden;
  }
  const frisch = seiteOeffnen(page, route, breite).then(() => berichtLesen(page));
  berichte.set(schluessel, frisch);
  return frisch;
}

/** Puts a report into the run output and into the test annotations. */
function melden(titel: string, zeilen: string[]): void {
  const text = zeilen.join('\n  ');
  test.info().annotations.push({ type: titel, description: text });
  console.log(`\n${titel}\n  ${text}`);
}

/** The widget nodes a screen reader can reach. */
const widgets = (b: Bericht) => b.knoten.filter((k) => !k.ignoriert && WIDGETS.has(k.rolle));

/** The headings with their level, in document order. */
const ueberschriften = (b: Bericht) =>
  b.knoten
    .filter((k) => !k.ignoriert && k.rolle === 'heading')
    .map((k) => ({ stufe: Number(k.eig['level'] ?? 0), name: k.name, tag: k.tag }));

/* ------------------------------------------------------------------ *
 * The checks, per route and width
 * ------------------------------------------------------------------ */

for (const route of ROUTEN) {
  test.describe(`/${route.pfad}`, () => {
    for (const breite of BREITEN) {
      test(`landmarks at ${breite}px`, async ({ page }) => {
        const b = await bericht(page, route.pfad, breite);
        const landmarken = b.knoten.filter((k) => !k.ignoriert && LANDMARKEN.has(k.rolle));
        melden(
          `Landmarken /${route.pfad} ${breite}px`,
          landmarken.map(
            (l) =>
              `${l.rolle} "${l.name || '(ohne Namen)'}" ${l.wo}` +
              (l.landmarken.length ? ` [in ${l.landmarken.join(' > ')}]` : ''),
          ),
        );

        const seitenEbene = (rolle: string) =>
          landmarken.filter(
            (l) => l.rolle === rolle && !l.landmarken.some((e) => e.startsWith('main')),
          );

        expect(seitenEbene('main'), 'genau ein main').toHaveLength(1);
        expect(seitenEbene('banner').length, 'banner auf Seitenebene').toBeLessThanOrEqual(1);
        expect(
          seitenEbene('contentinfo').length,
          'contentinfo auf Seitenebene',
        ).toBeLessThanOrEqual(1);

        // z-app-header and z-footer carry role="banner" and role="contentinfo"
        // on their host, so a product built from them has both landmarks. Every
        // z-app-header and z-footer of this demo is a preview inside <main>,
        // where a banner would be wrong, so all of them pass [landmark]="false"
        // and the page landmarks stay the ones of the demo shell.
        const kopfVorschau = b.dom.filter((d) => d.tag === 'z-app-header').length;
        const fussVorschau = b.dom.filter((d) => d.tag === 'z-footer').length;
        if (kopfVorschau || fussVorschau) {
          melden(`Kopf- und Fußvorschau /${route.pfad} ${breite}px`, [
            `${kopfVorschau} × z-app-header, ${fussVorschau} × z-footer im Dokument`,
            `banner im Baum: ${landmarken.filter((l) => l.rolle === 'banner').length}, contentinfo: ${landmarken.filter((l) => l.rolle === 'contentinfo').length}`,
          ]);
        }
        expect(
          landmarken
            .filter(
              (l) =>
                ['banner', 'contentinfo'].includes(l.rolle) &&
                l.landmarken.some((e) => e.startsWith('main')),
            )
            .map((l) => `${l.rolle}: ${l.wo}`),
          'banner oder contentinfo innerhalb von main',
        ).toEqual([]);

        const ohneNamen = landmarken
          .filter((l) => ['complementary', 'region', 'navigation'].includes(l.rolle) && !l.name)
          .map((l) => `${l.rolle}: ${l.wo}`);
        expect(ohneNamen, 'navigation, region und complementary ohne Namen').toEqual([]);

        // Two landmarks of one role with one name cannot be told apart in a
        // list of landmarks, so every navigation and every region on a page
        // names what it navigates or holds ("Seiten der Transaktionen",
        // "Dateien werden geladen, seitlich scrollbar").
        const namen = landmarken
          .filter((l) => l.rolle === 'navigation' || l.rolle === 'region')
          .map((l) => `${l.rolle} "${l.name}"`);
        const doppelt = namen.filter((n, i) => namen.indexOf(n) !== i);
        expect([...new Set(doppelt)], 'navigation- und region-Namen sind eindeutig').toEqual([]);

        expect(b.skip.href, 'Skip-Link zeigt auf den Hauptinhalt').toBe('#inhalt');
        expect(b.skip.zielDa, 'Ziel des Skip-Links steht im Dokument').toBe(true);
        expect(b.skip.fokussierbar, 'Ziel des Skip-Links ist fokussierbar').toBe(true);
      });

      test(`heading outline at ${breite}px`, async ({ page }) => {
        const b = await bericht(page, route.pfad, breite);
        const liste = ueberschriften(b);
        melden(
          `Gliederung /${route.pfad} ${breite}px`,
          liste.map((u) => `${'  '.repeat(Math.max(0, u.stufe - 1))}h${u.stufe} ${u.name}`),
        );

        expect(
          liste.filter((u) => !u.name.trim()),
          'leere Überschriften',
        ).toEqual([]);

        const erste = liste.filter((u) => u.stufe === 1).map((u) => u.name);
        expect(erste, `h1 von /${route.pfad}`).toEqual([...route.h1]);
        if (route.h1.length === 1 && route.h1[0] !== route.nav) {
          melden(`Abweichung /${route.pfad}`, [
            `h1 "${route.h1[0]}" statt des Navigationstextes "${route.nav}": Musterseite, die eine Produktseite nachstellt.`,
          ]);
        }

        // No level may be skipped. z-panel renders its title as h3 by default;
        // a panel that sits directly under the page heading is a section of its
        // own and sets headingLevel="2" (the pattern pages and the example
        // app do, and they are meant to be copied into a product).
        const spruenge: string[] = [];
        let vorige = 0;
        for (const u of liste) {
          if (vorige && u.stufe > vorige + 1) {
            spruenge.push(`h${vorige} → h${u.stufe} "${u.name}"`);
          }
          vorige = u.stufe;
        }
        expect(spruenge, 'übersprungene Überschriftenebenen').toEqual([]);
      });

      test(`names of interactive elements at ${breite}px`, async ({ page }) => {
        const b = await bericht(page, route.pfad, breite);
        const liste = widgets(b);
        expect(liste.length, 'die Seite hat Bedienelemente').toBeGreaterThan(0);

        expect(
          liste.filter((k) => !k.name).map((k) => `${k.rolle}: ${k.wo} (${k.abschnitt})`),
          'Bedienelemente ohne zugänglichen Namen',
        ).toEqual([]);

        const ligaturen = liste
          .filter((k) => LIGATUREN.some((l) => new RegExp(`(^|\\s)${l}(\\s|$)`).test(k.name)))
          .map((k) => `${k.rolle} "${k.name}": ${k.wo}`);
        expect(ligaturen, 'Namen, die eine Icon-Ligatur enthalten').toEqual([]);

        const vage = liste
          .filter((k) => k.rolle === 'link' && VAGE_LINKTEXTE.includes(k.name.trim().toLowerCase()))
          .map((k) => `link "${k.name}": ${k.wo}`);
        expect(vage, 'Linktexte ohne Aussage').toEqual([]);

        // Duplicate names inside one landmark: two controls with the same name
        // and different targets cannot be told apart in a list of elements.
        const gruppen = new Map<string, Knoten[]>();
        for (const k of liste) {
          const schluessel = `${k.landmarken.join(' > ') || 'ohne Landmarke'} | ${k.rolle} | ${k.name}`;
          gruppen.set(schluessel, [...(gruppen.get(schluessel) ?? []), k]);
        }
        const mehrfach = [...gruppen.entries()].filter(([, ks]) => ks.length > 1);
        if (mehrfach.length) {
          // The remaining duplicates are the deliberate variants of a component
          // page (the same button as primary, secondary and ghost), so the full
          // list is reported, not asserted.
          melden(
            `Doppelte Namen /${route.pfad} ${breite}px`,
            mehrfach.map(
              ([schluessel, ks]) =>
                `${ks.length} × ${schluessel} → ${ks
                  .map((k) => k.abschnitt || '(ohne Abschnitt)')
                  .join(' | ')}`,
            ),
          );
        }
        // Asserted for the icon-only row menu: "Weitere Aktionen" says nothing
        // on its own, so every one of them names its object ("Weitere Aktionen
        // für Beispiel-Server 1") and no two of them are alike.
        const aktionsNamen = liste
          .filter((k) => k.rolle === 'button' && k.name.startsWith('Weitere Aktionen'))
          .map((k) => k.name);
        expect(
          aktionsNamen.filter((n) => n === 'Weitere Aktionen'),
          '"Weitere Aktionen" ohne Objekt im Namen',
        ).toEqual([]);
        expect(
          [...new Set(aktionsNamen.filter((n, i) => aktionsNamen.indexOf(n) !== i))],
          'zwei Menü-Knöpfe mit demselben Namen',
        ).toEqual([]);
        // Ambiguous for real: the same link text leading somewhere else.
        const zweideutig = mehrfach
          .filter(([, ks]) => ks[0].rolle === 'link')
          .filter(([, ks]) => new Set(ks.map((k) => k.attr['href'] ?? '')).size > 1)
          .map(([schluessel, ks]) => `${schluessel} → ${ks.map((k) => k.attr['href']).join(', ')}`);
        expect(zweideutig, 'gleicher Linktext, anderes Ziel').toEqual([]);
      });

      test(`states in the tree at ${breite}px`, async ({ page }) => {
        const b = await bericht(page, route.pfad, breite);
        const zuEigenschaft: Record<string, string> = {
          'aria-pressed': 'pressed',
          'aria-expanded': 'expanded',
          'aria-disabled': 'disabled',
          'aria-invalid': 'invalid',
          'aria-busy': 'busy',
        };
        // CDP writes booleans as 1 and 0, the attribute as true and false.
        const gleich = (a: string, b2: string) => {
          const norm = (w: string) =>
            ({ '1': 'true', '0': 'false' })[w.toLowerCase()] ?? w.toLowerCase();
          return norm(a) === norm(b2);
        };

        const funde: string[] = [];
        for (const { dom, ax } of b.zuDom) {
          if (dom.attr['data-pruef-unsichtbar']) continue;
          for (const [attribut, eigenschaft] of Object.entries(zuEigenschaft)) {
            const wert = dom.attr[attribut];
            if (!wert) continue;
            if (!ax || ax.ignoriert) {
              funde.push(`${dom.wo}: ${attribut}="${wert}", aber nicht im Baum`);
              continue;
            }
            const imBaum = ax.eig[eigenschaft];
            if (imBaum === undefined) {
              // A "false" that the tree leaves out is the default state and is
              // announced as such; only a set state has to show up.
              if (wert !== 'false') {
                funde.push(`${dom.wo}: ${attribut}="${wert}" fehlt als ${eigenschaft} im Baum`);
              }
              continue;
            }
            if (!gleich(imBaum, wert)) {
              funde.push(`${dom.wo}: ${attribut}="${wert}", im Baum ${eigenschaft}="${imBaum}"`);
            }
          }
          // `Accessibility.getFullAXTree` has no property for aria-current, so
          // the tree cannot be asked for it. What can be checked is that the
          // value is a valid token and that the element carrying it is in the
          // tree at all, which is where a screen reader reads it.
          const aktuell = dom.attr['aria-current'];
          if (aktuell) {
            const erlaubt = ['page', 'step', 'location', 'date', 'time', 'true', 'false'];
            if (!erlaubt.includes(aktuell)) {
              funde.push(`${dom.wo}: aria-current="${aktuell}" ist kein gültiger Wert`);
            }
            if (!ax || ax.ignoriert) {
              funde.push(`${dom.wo}: aria-current="${aktuell}", aber nicht im Baum`);
            }
          }
          if (dom.attr['data-pruef-gesperrt'] && ax && !ax.ignoriert) {
            const gesperrt = ax.eig['disabled'] === 'true' || dom.attr['aria-disabled'] === 'true';
            if (!gesperrt && WIDGETS.has(ax.rolle)) {
              funde.push(`${dom.wo}: sieht gesperrt aus, im Baum aber nicht disabled`);
            }
          }
        }
        expect(funde, 'Zustände, die der Baum nicht zeigt').toEqual([]);
        expect(b.refs, 'aria-Verweise ins Leere').toEqual([]);
      });

      test(`live regions, tables and language at ${breite}px`, async ({ page }) => {
        const b = await bericht(page, route.pfad, breite);
        expect(b.lang, 'html[lang]').toBe('de');
        expect(b.englisch, 'englische Oberflächentexte in der deutschen Demo').toEqual([]);

        // A toast outlet has both live regions from the start, so a screen
        // reader announces a toast that arrives later at all.
        if (b.toast.length) {
          expect(b.toast.map((t) => `${t.rolle}/${t.live}/${t.atomic}`)).toEqual([
            'status/polite/false',
            'alert/assertive/false',
          ]);
        }

        // No live region on static content: what is already there when the page
        // loads must not be announced on top of everything else.
        const statischeAlerts = b.dom
          .filter((d) => d.attr['role'] === 'alert' && !d.attr['class']?.includes('z-toast-outlet'))
          .map((d) => d.wo);
        expect(statischeAlerts, 'role="alert" auf statischem Seiteninhalt').toEqual([]);

        // Paging moves no focus, so the range sentence of every pager has to be
        // a polite live region of its own.
        const pager = b.dom.filter((d) => d.attr['class'] === 'z-pager').length;
        const bereiche = b.dom.filter(
          (d) => d.tag === 'span' && d.attr['aria-live'] === 'polite' && /\d/.test(d.text),
        );
        expect(
          bereiche.length,
          'Bereichssatz je Pagination ist eine höfliche Live-Region',
        ).toBeGreaterThanOrEqual(pager);

        const konsolen = b.dom.filter((d) => d.tag === 'z-console').length;
        const logs = b.knoten.filter(
          (k) => !k.ignoriert && k.attr['class']?.includes('z-console__log'),
        );
        expect(logs.length, 'jede z-console steht mit ihrem Log im Baum').toBe(konsolen);
        for (const log of logs) {
          expect(log.rolle, 'Konsolenlog ist role="log"').toBe('log');
          expect(log.name, 'Konsolenlog hat einen Namen').not.toBe('');
        }

        if (b.tabellen.length) {
          melden(
            `Tabellen /${route.pfad} ${breite}px`,
            b.tabellen.map(
              (t) =>
                `"${t.panel}"${t.busy ? ' (lädt)' : ''}: ${t.kopf.length} Kopfzellen [${t.kopf
                  .map((k) => k.name || '(leer)')
                  .join(' | ')}], ${t.zeilen.length} Zeilen`,
            ),
          );
        }
        for (const tabelle of b.tabellen) {
          expect(
            tabelle.kopf.length,
            `"${tabelle.panel}": Kopfzelle je Spalte`,
          ).toBeGreaterThanOrEqual(tabelle.spalten);
          // Loading too: the checkbox column of the skeleton table names itself
          // through a visually hidden word, as the live table does through its
          // "Alle auswählen" checkbox.
          expect(
            tabelle.kopf.map((k) => k.name || '(leer)'),
            `"${tabelle.panel}"${tabelle.busy ? ' lädt' : ''}: jede Kopfzelle hat einen Namen`,
          ).not.toContain('(leer)');
          const ohneDateiname = tabelle.zeilen
            .filter((z) => z.kastenName !== null && !z.kastenName.includes(z.name))
            .map((z) => `${z.name}: Kästchen heißt "${z.kastenName}"`);
          expect(ohneDateiname, `"${tabelle.panel}": Kästchen nennt die Datei`).toEqual([]);
        }

        // z-rows is a CSS grid of generic containers: the head row is a row of
        // spans, not a table head, so the cells of a row are not associated
        // with it. That is a limit of the design, not a defect: the reference
        // markup has no list or table semantics either, and every row carries
        // its own readable text.
        if (b.reihen.length) {
          const rollen = (klasse: string) =>
            b.knoten
              .filter((k) => !k.ignoriert && k.attr['class']?.split(/\s+/).includes(klasse))
              .map((k) => k.rolle);
          melden(
            `z-rows /${route.pfad} ${breite}px`,
            b.reihen.map(
              (r) =>
                `"${r.panel}": Kopf [${r.kopfZellen.join(' | ')}], ${r.zeilen} Zeilen, ` +
                `Rollen im Baum: z-rows=${[...new Set(rollen('z-rows'))].join(',') || 'ignoriert'}, ` +
                `Kopf=${[...new Set(rollen('z-rows__head'))].join(',') || 'ignoriert'}, ` +
                `Zeile=${[...new Set(rollen('z-row'))].join(',') || 'ignoriert'}`,
            ),
          );
        }
      });
    }
  });
}

/* ------------------------------------------------------------------ *
 * The game tiles of /werkzeuge
 * ------------------------------------------------------------------ */

/**
 * The cover area of a game tile shows either a picture of what the title below
 * it says or, without a cover and when a cover fails to load, that title as
 * text. Visible text inside a button or a link goes into its accessible name,
 * so the area is `aria-hidden` and the name of every tile is title plus price,
 * no matter what the cover does. Both variants count: `button[zGameTile]` is a
 * toggle with `aria-pressed`, `a[zGameTile]` a link without it. Read out of the
 * tree, not out of the DOM, because the name is what the browser computes, not
 * what the markup looks like.
 */
test.describe('game tiles', () => {
  test('no game tile names its title twice, whatever its cover does', async ({ page }) => {
    await seiteOeffnen(page, 'werkzeuge', 1440);
    const erwartet = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.z-game')).map((el) => ({
        link: el.tagName === 'A',
        titel: el.querySelector('.z-game__title')?.textContent?.trim() ?? '',
        preis: el.querySelector('.z-game__price')?.textContent?.trim() ?? '',
        coverText: el.querySelector('.z-game__cover')?.textContent?.trim() ?? '',
        bild: !!el.querySelector('.z-game__cover img'),
      })),
    );
    const b = await berichtLesen(page);
    const kacheln = b.knoten.filter(
      (k) => !k.ignoriert && k.attr['class']?.split(/\s+/).includes('z-game'),
    );
    const glatt = (wert: string) => wert.replace(/\s+/g, ' ').trim();
    // CDP schreibt Wahrheitswerte als 1 und 0, und ein "false" lässt der Baum
    // als Standardzustand weg; vorgelesen wird es so oder so.
    const zustand = (wert: string | undefined) =>
      ({ '1': 'true', '0': 'false' })[wert ?? ''] ?? wert ?? 'false';

    melden(
      'Spielkacheln /werkzeuge 1440px',
      kacheln.map(
        (k, i) =>
          `${k.rolle} "${k.name}" pressed=${zustand(k.eig['pressed'])}` +
          ` [Cover: ${erwartet[i]?.bild ? 'Bild' : `Text "${erwartet[i]?.coverText}"`}]`,
      ),
    );

    expect(kacheln.length, 'jede Kachel steht im Baum').toBe(erwartet.length);
    expect(kacheln.length, 'die Seite hat Spielkacheln').toBeGreaterThan(0);
    // Ohne eine Kachel, die den Text-Fallback zeigt, prüft der Name nichts.
    const mitFallback = erwartet.filter((e) => !e.bild && e.coverText);
    expect(mitFallback.length, 'Kacheln mit Text-Fallback').toBeGreaterThan(0);

    // The page shows both variants; without a link tile the link half checks nothing.
    expect(erwartet.filter((e) => e.link).length, 'Link-Kacheln').toBeGreaterThan(0);
    expect(erwartet.filter((e) => !e.link).length, 'Button-Kacheln').toBeGreaterThan(0);

    // A button tile is a toggle with aria-pressed, the first one on the page is
    // chosen. A link tile is a link and carries no pressed state at all.
    const ersterButton = erwartet.findIndex((e) => !e.link);
    expect(
      kacheln.map((k) =>
        k.rolle === 'link'
          ? `link pressed=${k.eig['pressed'] ?? 'keins'}`
          : `${k.rolle} ${zustand(k.eig['pressed'])}`,
      ),
      'jede Button-Kachel ist eine Schaltfläche mit aria-pressed, jede Link-Kachel ein Link ohne',
    ).toEqual(
      erwartet.map((e, i) =>
        e.link ? 'link pressed=keins' : `button ${i === ersterButton ? 'true' : 'false'}`,
      ),
    );

    expect(
      kacheln.map((k) => glatt(k.name)),
      'Name einer Kachel ist Titel plus Preis, der Text-Fallback steht nicht darin',
    ).toEqual(erwartet.map((e) => glatt(`${e.titel} ${e.preis}`)));
  });
});

/* ------------------------------------------------------------------ *
 * Opened overlays
 * ------------------------------------------------------------------ */

test.describe('opened overlays', () => {
  test('the dialog and the menu on /overlays stay whole in the tree', async ({ page }) => {
    await seiteOeffnen(page, 'overlays', 1440);
    await page.getByRole('button', { name: 'Server löschen', exact: true }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const dialog = await berichtLesen(page);
    expect(dialog.refs, 'aria-Verweise ins Leere im offenen Dialog').toEqual([]);
    const dialogKnoten = dialog.knoten.find((k) => k.rolle === 'dialog' && !k.ignoriert);
    expect(dialogKnoten?.name, 'der Dialog trägt seinen Titel als Namen').toBe(
      'Server "Test" löschen?',
    );
    expect(
      widgets(dialog)
        .filter((k) => k.landmarken.length === 0 && !k.name)
        .map((k) => k.wo),
      'Bedienelemente ohne Namen, während der Dialog offen ist',
    ).toEqual([]);

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();

    await page.getByRole('button', { name: 'Weitere Aktionen' }).first().click();
    await expect(page.getByRole('menu')).toBeVisible();
    const menu = await berichtLesen(page);
    expect(menu.refs, 'aria-Verweise ins Leere im offenen Menü').toEqual([]);
    const eintraege = menu.knoten.filter((k) => !k.ignoriert && k.rolle.startsWith('menuitem'));
    expect(eintraege.length, 'das Menü hat Einträge').toBeGreaterThan(0);
    expect(
      eintraege.filter((k) => !k.name).map((k) => k.wo),
      'Menüeinträge ohne Namen',
    ).toEqual([]);
    melden(
      'Menü /overlays',
      eintraege.map(
        (k) => `${k.rolle} "${k.name}"${k.eig['disabled'] === 'true' ? ' (gesperrt)' : ''}`,
      ),
    );
  });

  test('a toast and a tooltip on /rueckmeldung are announced and named', async ({ page }) => {
    await seiteOeffnen(page, 'rueckmeldung', 1440);
    const vorher = await berichtLesen(page);
    expect(
      vorher.toast.map((t) => `${t.rolle}/${t.live}`),
      'beide Live-Bereiche stehen vorab',
    ).toEqual(['status/polite', 'alert/assertive']);

    await page.getByRole('button', { name: 'Fehler zeigen' }).click();
    await expect(page.locator('.z-toast')).toBeVisible();
    const mitToast = await berichtLesen(page);
    expect(mitToast.refs, 'aria-Verweise ins Leere mit offenem Toast').toEqual([]);
    const schliessen = widgets(mitToast).filter((k) => k.wo.includes('z-toast__close'));
    expect(
      schliessen.map((k) => k.name),
      'der Schließen-Knopf des Toasts hat einen Namen',
    ).toEqual(['Schließen']);
    await page.getByRole('button', { name: 'Alle schließen' }).click();

    const knopf = page.getByRole('button', { name: 'Aktualisieren' }).first();
    await knopf.focus();
    await expect(page.locator('.z-tooltip')).toBeVisible();
    const mitTooltip = await berichtLesen(page);
    expect(mitTooltip.refs, 'aria-Verweise ins Leere mit offenem Tooltip').toEqual([]);
  });

  test('the row menu on /muster/server-panel keeps its references', async ({ page }) => {
    await seiteOeffnen(page, 'muster/server-panel', 1440);
    await page.getByRole('button', { name: 'Weitere Aktionen' }).first().click();
    await expect(page.getByRole('menu')).toBeVisible();

    const b = await berichtLesen(page);
    expect(b.refs, 'aria-Verweise ins Leere im offenen Menü').toEqual([]);
    expect(
      widgets(b)
        .filter((k) => !k.name)
        .map((k) => `${k.rolle}: ${k.wo}`),
      'Bedienelemente ohne Namen, während das Menü offen ist',
    ).toEqual([]);
  });
});
