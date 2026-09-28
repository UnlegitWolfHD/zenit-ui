#!/usr/bin/env node
/**
 * Renders demo pages as PNG files and runs axe on them, so an agent (or a
 * person) can look at a design change without the Windows-only screenshot
 * baselines of `npm run e2e`.
 *
 *   npm run design:shot -- formulare daten
 *   npm run design:shot -- grundlage --widths 1440,640,360 --scheme light --accent blau
 *   npm run design:shot -- grundlage --focus ".z-btn" --hover ".z-btn-secondary"
 *   npm run design:shot -- muster/dashboard --url http://localhost:4200 --no-axe
 *
 * Routes are those of `projects/ui-demo/src/app/app.routes.ts`, without the
 * leading slash. Without `--url` the script starts `ng serve ui-demo` on port
 * 4311 and stops it afterwards. The page settings follow playwright.config.ts
 * (de-DE, Europe/Berlin, reduced motion, scale 1, full page). Files land in
 * `tmp/design/` (git-ignored) as `<route>-<scheme>-<accent>-<width>.png`, plus
 * one file per 900px of page height (`…-s1.png`, `…-s2.png`) that stays sharp
 * when viewed, where the full page gets scaled down. The script prints each
 * path, horizontal overflow and the axe violations (WCAG 2.1 AA), and exits 1
 * when axe found any.
 *
 * `--focus <selector>` and `--hover <selector>` (repeatable) add a close-up of
 * the first matching element in that state, `…-focus1.png` or `…-hover1.png`,
 * because a static page shot never shows either. Focus is set after a key
 * press, so `:focus-visible` applies as it does for keyboard users.
 */
import AxeBuilder from '@axe-core/playwright';
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');
const ZIEL = join(WURZEL, 'tmp/design');
const PORT = 4311;
const SCHEMATA = ['dark', 'light', 'contrast'];

function argumente(argv) {
  const optionen = {
    routen: [],
    breiten: [1440, 375],
    schema: 'dark',
    akzent: 'rot',
    url: null,
    axe: true,
    focus: [],
    hover: [],
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--widths') optionen.breiten = argv[++i].split(',').map(Number);
    else if (arg === '--scheme') optionen.schema = argv[++i];
    else if (arg === '--accent') optionen.akzent = argv[++i];
    else if (arg === '--url') optionen.url = argv[++i].replace(/\/$/, '');
    else if (arg === '--no-axe') optionen.axe = false;
    else if (arg === '--focus') optionen.focus.push(argv[++i]);
    else if (arg === '--hover') optionen.hover.push(argv[++i]);
    else if (arg.startsWith('--')) throw new Error(`unknown option ${arg}`);
    else optionen.routen.push(arg.replace(/^\//, ''));
  }
  if (optionen.routen.length === 0)
    throw new Error('name at least one demo route, for example: formulare');
  if (!SCHEMATA.includes(optionen.schema))
    throw new Error(`--scheme must be one of ${SCHEMATA.join(', ')}`);
  if (optionen.breiten.some((b) => !Number.isInteger(b) || b < 320))
    throw new Error('--widths takes pixel widths of at least 320');
  return optionen;
}

async function erreichbar(url) {
  try {
    return (await fetch(url)).ok;
  } catch {
    return false;
  }
}

async function serverStarten() {
  const url = `http://localhost:${PORT}`;
  if (await erreichbar(url)) return { url, stoppen: () => {} };
  const server = spawn('npx', ['ng', 'serve', 'ui-demo', '--port', String(PORT)], {
    cwd: WURZEL,
    stdio: 'ignore',
    detached: process.platform !== 'win32',
    shell: process.platform === 'win32',
  });
  const stoppen = () => {
    try {
      if (process.platform === 'win32') spawn('taskkill', ['/pid', String(server.pid), '/t', '/f']);
      else process.kill(-server.pid, 'SIGTERM');
    } catch {
      /* already gone */
    }
  };
  const ende = Date.now() + 300_000;
  while (!(await erreichbar(url))) {
    if (Date.now() > ende || server.exitCode !== null) {
      stoppen();
      throw new Error('ng serve ui-demo did not answer within 5 minutes');
    }
    await new Promise((fertig) => setTimeout(fertig, 1000));
  }
  return { url, stoppen };
}

/** Uses the browser the installed Playwright expects, else the preinstalled one of the cloud image. */
async function browserStarten() {
  try {
    return await chromium.launch();
  } catch (fehler) {
    const vorinstalliert = '/opt/pw-browsers/chromium';
    if (!existsSync(vorinstalliert)) throw fehler;
    return chromium.launch({ executablePath: vorinstalliert });
  }
}

/** Close-up of the first element matching `selektor` while it is focused or hovered. */
async function nahaufnahme(seite, art, selektor, datei) {
  const ziel = seite.locator(selektor).first();
  await ziel.scrollIntoViewIfNeeded();
  // Each close-up shows one state only: drop the focus and the pointer of the one before.
  await seite.evaluate(() => /** @type {HTMLElement | null} */ (document.activeElement)?.blur());
  await seite.mouse.move(0, 0);
  if (art === 'focus') {
    await seite.keyboard.press('Shift');
    await ziel.focus();
  } else {
    await ziel.hover();
  }
  const box = await ziel.boundingBox();
  if (!box) throw new Error(`${selektor} is not visible`);
  const rand = 24;
  const x = Math.max(0, box.x - rand);
  const y = Math.max(0, box.y - rand);
  const breite = Math.min(box.width + 2 * rand, seite.viewportSize().width - x);
  await seite.screenshot({
    path: datei,
    clip: { x, y, width: breite, height: box.height + 2 * rand },
  });
  console.log(`  ${art} ${selektor}: ${datei}`);
}

const optionen = argumente(process.argv.slice(2));
mkdirSync(ZIEL, { recursive: true });
const { url, stoppen } = optionen.url
  ? { url: optionen.url, stoppen: () => {} }
  : await serverStarten();
const browser = await browserStarten();
let verstoesse = 0;

try {
  for (const route of optionen.routen) {
    for (const breite of optionen.breiten) {
      const kontext = await browser.newContext({
        viewport: { width: breite, height: 900 },
        deviceScaleFactor: 1,
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin',
        reducedMotion: 'reduce',
      });
      await kontext.addInitScript(
        ([schluessel, wert]) => window.localStorage.setItem(schluessel, wert),
        ['zenit-theme', JSON.stringify({ scheme: optionen.schema, accent: optionen.akzent })],
      );
      const seite = await kontext.newPage();
      await seite.goto(`${url}/${route}`);
      await seite.locator('main h1').first().waitFor();
      await seite.evaluate(() => document.fonts.ready.then(() => true));

      const datei = join(
        ZIEL,
        `${route.replaceAll('/', '_')}-${optionen.schema}-${optionen.akzent}-${breite}.png`,
      );
      await seite.screenshot({ path: datei, fullPage: true });
      const { hoehe, ueberlauf } = await seite.evaluate(() => ({
        hoehe: document.documentElement.scrollHeight,
        ueberlauf: document.documentElement.scrollWidth - window.innerWidth,
      }));
      const abschnitte = Math.ceil(hoehe / 900);
      for (let n = 0; n < abschnitte; n++) {
        const y = n * 900;
        await seite.screenshot({
          path: datei.replace(/\.png$/, `-s${n + 1}.png`),
          fullPage: true,
          clip: { x: 0, y, width: breite, height: Math.min(900, hoehe - y) },
        });
      }
      console.log(
        `${datei} (${abschnitte} slices -s1..-s${abschnitte})${ueberlauf > 0 ? `  horizontal overflow ${ueberlauf}px` : ''}`,
      );

      if (optionen.axe) {
        const ergebnis = await new AxeBuilder({ page: seite })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze();
        for (const v of ergebnis.violations) {
          verstoesse++;
          const ziele = v.nodes
            .slice(0, 3)
            .map((n) => n.target.join(' '))
            .join(' | ');
          console.log(`  axe ${v.id} (${v.impact}): ${v.help} -> ${ziele}`);
        }
        if (ergebnis.violations.length === 0) console.log('  axe: no violations');
      }
      for (const art of ['focus', 'hover']) {
        for (const [n, selektor] of optionen[art].entries()) {
          await nahaufnahme(seite, art, selektor, datei.replace(/\.png$/, `-${art}${n + 1}.png`));
        }
      }
      await kontext.close();
    }
  }
} finally {
  await browser.close();
  stoppen();
}
process.exit(verstoesse > 0 ? 1 : 0);
