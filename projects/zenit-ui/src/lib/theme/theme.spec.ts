import { EnvironmentInjector, PLATFORM_ID, createEnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { zenitThemeInitScript } from './init-script';
import { ZTheme, ZThemeConfig, provideZenitTheme } from './theme';

/** Minimal MediaQueryList whose `matches` can be flipped from the test. */
class MedienAbfrage {
  readonly hoerer = new Set<(e: MediaQueryListEvent) => void>();

  constructor(public matches: boolean) {}

  addEventListener(_typ: string, hoerer: (e: MediaQueryListEvent) => void): void {
    this.hoerer.add(hoerer);
  }

  removeEventListener(_typ: string, hoerer: (e: MediaQueryListEvent) => void): void {
    this.hoerer.delete(hoerer);
  }

  /** Simulates the user switching the operating system to light or dark. */
  wechseln(matches: boolean): void {
    this.matches = matches;
    for (const hoerer of this.hoerer) {
      hoerer({ matches } as MediaQueryListEvent);
    }
  }
}

/** localStorage that can also be made to throw, like a private window does. */
class Ablage implements Storage {
  private werte = new Map<string, string>();
  wirft = false;

  get length(): number {
    return this.werte.size;
  }

  clear(): void {
    this.werte.clear();
  }

  key(index: number): string | null {
    return [...this.werte.keys()][index] ?? null;
  }

  getItem(schluessel: string): string | null {
    if (this.wirft) throw new Error('blockiert');
    return this.werte.get(schluessel) ?? null;
  }

  setItem(schluessel: string, wert: string): void {
    if (this.wirft) throw new Error('blockiert');
    this.werte.set(schluessel, wert);
  }

  removeItem(schluessel: string): void {
    if (this.wirft) throw new Error('blockiert');
    this.werte.delete(schluessel);
  }
}

let abfrage: MedienAbfrage;
let kontrastAbfrage: MedienAbfrage;
let ablage: Ablage;
let ziel: HTMLElement;
let echtesMatchMedia: typeof window.matchMedia | undefined;
let echteAblage: PropertyDescriptor | undefined;

beforeEach(() => {
  abfrage = new MedienAbfrage(true);
  kontrastAbfrage = new MedienAbfrage(false);
  ablage = new Ablage();
  ziel = document.createElement('div');
  document.body.appendChild(ziel);

  echtesMatchMedia = window.matchMedia;
  window.matchMedia = ((text: string): MediaQueryList =>
    (text.includes('prefers-contrast')
      ? kontrastAbfrage
      : abfrage) as unknown as MediaQueryList) as typeof window.matchMedia;
  echteAblage = Object.getOwnPropertyDescriptor(window, 'localStorage');
  Object.defineProperty(window, 'localStorage', { value: ablage, configurable: true });
});

afterEach(() => {
  vi.restoreAllMocks();
  ziel.remove();
  if (echtesMatchMedia) window.matchMedia = echtesMatchMedia;
  if (echteAblage) Object.defineProperty(window, 'localStorage', echteAblage);
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-accent');
});

/** Builds the service with the provider function, as an application would. */
function dienst(config: ZThemeConfig = {}): ZTheme {
  TestBed.configureTestingModule({
    providers: [provideZenitTheme({ target: () => ziel, ...config })],
  });
  return TestBed.inject(ZTheme);
}

describe('ZTheme', () => {
  it('starts on dark and rot and writes only data-theme', () => {
    const theme = dienst();

    expect(theme.scheme()).toBe('dark');
    expect(theme.resolvedScheme()).toBe('dark');
    expect(theme.accent()).toBe('rot');
    expect(ziel.getAttribute('data-theme')).toBe('dark');
    expect(ziel.hasAttribute('data-accent')).toBe(false);
  });

  it('applies the theme without anyone injecting the service', () => {
    TestBed.configureTestingModule({ providers: [provideZenitTheme({ target: () => ziel })] });
    TestBed.tick();

    expect(ziel.getAttribute('data-theme')).toBe('dark');
  });

  it('writes scheme and accent onto the target', () => {
    const theme = dienst();

    expect(theme.setScheme('light')).toBe(true);
    expect(theme.setAccent('blau')).toBe(true);

    expect(ziel.getAttribute('data-theme')).toBe('light');
    expect(ziel.getAttribute('data-accent')).toBe('blau');
  });

  it('removes data-accent again for the default accent', () => {
    const theme = dienst();
    theme.setAccent('gruen');

    expect(ziel.getAttribute('data-accent')).toBe('gruen');

    theme.setAccent('rot');

    expect(ziel.hasAttribute('data-accent')).toBe(false);
  });

  it('uses documentElement without a target', () => {
    const theme = dienst({ target: undefined });
    theme.setScheme('contrast');

    expect(document.documentElement.getAttribute('data-theme')).toBe('contrast');
  });

  it('resets to the defaults and drops the stored value', () => {
    const theme = dienst();
    theme.setScheme('contrast');
    theme.setAccent('violett');

    theme.reset();

    expect(theme.scheme()).toBe('dark');
    expect(theme.accent()).toBe('rot');
    expect(ziel.getAttribute('data-theme')).toBe('dark');
    expect(ziel.hasAttribute('data-accent')).toBe(false);
    expect(ablage.getItem('zenit-theme')).toBeNull();
  });

  it('persists the choice under the storage key', () => {
    const theme = dienst();
    theme.setScheme('light');
    theme.setAccent('violett');

    expect(JSON.parse(ablage.getItem('zenit-theme') as string)).toEqual({
      scheme: 'light',
      accent: 'violett',
    });
  });

  it('writes nothing with storageKey null', () => {
    const theme = dienst({ storageKey: null });
    theme.setScheme('light');

    expect(ablage.length).toBe(0);
    expect(ziel.getAttribute('data-theme')).toBe('light');
  });

  describe('with storageKey null and attributes set before bootstrap', () => {
    // An application that keeps its own preference storage writes data-theme
    // and data-accent with its own inline script before the first paint.

    it('adopts them into the signals and leaves them on the target', () => {
      ziel.setAttribute('data-theme', 'light');
      ziel.setAttribute('data-accent', 'blau');
      const geschrieben = vi.spyOn(ziel, 'setAttribute');

      const theme = dienst({ storageKey: null });

      expect(theme.scheme()).toBe('light');
      expect(theme.resolvedScheme()).toBe('light');
      expect(theme.accent()).toBe('blau');
      expect(ziel.getAttribute('data-theme')).toBe('light');
      expect(ziel.getAttribute('data-accent')).toBe('blau');
      // No flash: the default never stood on the element in between.
      expect(geschrieben.mock.calls.map(([, wert]) => wert)).not.toContain('dark');
    });

    it('never touches localStorage, from start to reset', () => {
      ziel.setAttribute('data-theme', 'light');
      const zugriffe = [
        vi.spyOn(ablage, 'getItem'),
        vi.spyOn(ablage, 'setItem'),
        vi.spyOn(ablage, 'removeItem'),
      ];

      const theme = dienst({ storageKey: null });
      theme.setScheme('contrast');
      theme.setAccent('gruen');
      theme.reset();

      for (const zugriff of zugriffe) expect(zugriff).not.toHaveBeenCalled();
      expect(ziel.getAttribute('data-theme')).toBe('dark');
    });

    it('keeps system as the choice when the attribute only states what system resolves to', () => {
      abfrage.matches = false;
      ziel.setAttribute('data-theme', 'light');

      const theme = dienst({ storageKey: null, defaultScheme: 'system' });

      expect(theme.scheme()).toBe('system');
      abfrage.wechseln(true);
      expect(ziel.getAttribute('data-theme')).toBe('dark');
    });

    it('adopts a scheme that differs from what system resolves to', () => {
      abfrage.matches = false;
      ziel.setAttribute('data-theme', 'dark');

      const theme = dienst({ storageKey: null, defaultScheme: 'system' });

      expect(theme.scheme()).toBe('dark');
      expect(ziel.getAttribute('data-theme')).toBe('dark');
    });

    it('replaces an id that is not registered with the default', () => {
      ziel.setAttribute('data-theme', 'sepia');
      ziel.setAttribute('data-accent', 'orange');

      const theme = dienst({ storageKey: null });

      expect(theme.scheme()).toBe('dark');
      expect(theme.accent()).toBe('rot');
      expect(ziel.getAttribute('data-theme')).toBe('dark');
      expect(ziel.hasAttribute('data-accent')).toBe(false);
    });

    it('keeps the default the server wrote into the document', () => {
      ziel.setAttribute('data-theme', 'light');

      const theme = dienst({ storageKey: null, defaultScheme: 'light' });

      expect(theme.scheme()).toBe('light');
      expect(ziel.getAttribute('data-theme')).toBe('light');
    });
  });

  it('lets the storage and the defaults win over a pre-set attribute while a storage key is set', () => {
    ziel.setAttribute('data-theme', 'light');

    const theme = dienst();

    expect(theme.scheme()).toBe('dark');
    expect(ziel.getAttribute('data-theme')).toBe('dark');
  });

  it('restores a stored choice', () => {
    ablage.setItem('zenit-theme', JSON.stringify({ scheme: 'contrast', accent: 'gruen' }));

    const theme = dienst();

    expect(theme.scheme()).toBe('contrast');
    expect(theme.accent()).toBe('gruen');
    expect(ziel.getAttribute('data-theme')).toBe('contrast');
    expect(ziel.getAttribute('data-accent')).toBe('gruen');
  });

  it('ignores a stored unknown id and keeps the defaults', () => {
    ablage.setItem('zenit-theme', JSON.stringify({ scheme: 'sepia', accent: 'orange' }));

    const theme = dienst();

    expect(theme.scheme()).toBe('dark');
    expect(theme.accent()).toBe('rot');
  });

  it('survives a localStorage that throws', () => {
    ablage.wirft = true;

    const theme = dienst();

    expect(theme.scheme()).toBe('dark');
    expect(theme.setScheme('light')).toBe(true);
    expect(ziel.getAttribute('data-theme')).toBe('light');
  });

  it('follows prefers-color-scheme live in system mode', () => {
    const theme = dienst({ defaultScheme: 'system' });

    expect(theme.scheme()).toBe('system');
    expect(theme.resolvedScheme()).toBe('dark');
    expect(ziel.getAttribute('data-theme')).toBe('dark');

    abfrage.wechseln(false);

    expect(theme.resolvedScheme()).toBe('light');
    expect(ziel.getAttribute('data-theme')).toBe('light');
  });

  it('ignores the media query once a scheme is chosen', () => {
    const theme = dienst({ defaultScheme: 'system' });
    theme.setScheme('contrast');

    abfrage.wechseln(false);

    expect(theme.resolvedScheme()).toBe('contrast');
    expect(ziel.getAttribute('data-theme')).toBe('contrast');
  });

  it('accepts custom scheme and accent ids', () => {
    const theme = dienst({
      schemes: ['dark', 'sepia'],
      accents: ['rot', 'tuerkis'],
      defaultScheme: 'sepia',
    });

    expect(theme.resolvedScheme()).toBe('sepia');
    expect(theme.setAccent('tuerkis')).toBe(true);
    expect(ziel.getAttribute('data-accent')).toBe('tuerkis');
    expect(theme.setScheme('light')).toBe(false);
  });

  it('rejects an unknown id and changes nothing', () => {
    const theme = dienst();
    theme.setScheme('light');
    theme.setAccent('blau');

    expect(theme.setScheme('sepia')).toBe(false);
    expect(theme.setAccent('orange')).toBe(false);

    expect(theme.scheme()).toBe('light');
    expect(theme.accent()).toBe('blau');
    expect(ziel.getAttribute('data-theme')).toBe('light');
    expect(ziel.getAttribute('data-accent')).toBe('blau');
  });

  it('resolves system to contrast while prefers-contrast: more matches', () => {
    kontrastAbfrage.matches = true;
    const theme = dienst({ defaultScheme: 'system' });

    expect(theme.scheme()).toBe('system');
    expect(theme.resolvedScheme()).toBe('contrast');
    expect(ziel.getAttribute('data-theme')).toBe('contrast');

    kontrastAbfrage.wechseln(false);

    expect(theme.resolvedScheme()).toBe('dark');
    expect(ziel.getAttribute('data-theme')).toBe('dark');
  });

  it('ignores prefers-contrast when contrast is not a registered scheme', () => {
    kontrastAbfrage.matches = true;
    const theme = dienst({ defaultScheme: 'system', schemes: ['dark', 'light'] });

    expect(theme.resolvedScheme()).toBe('dark');
  });

  it('survives a localStorage getter that throws a SecurityError', () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: () => {
        throw new DOMException('The operation is insecure.', 'SecurityError');
      },
    });

    const theme = dienst();

    expect(theme.scheme()).toBe('dark');
    expect(theme.setScheme('light')).toBe(true);
    expect(theme.setAccent('blau')).toBe(true);
    expect(ziel.getAttribute('data-theme')).toBe('light');
    expect(() => theme.reset()).not.toThrow();
    expect(ziel.getAttribute('data-theme')).toBe('dark');
  });

  it('works with a MediaQueryList that has no addEventListener', () => {
    const alt = { matches: false } as MediaQueryList;
    window.matchMedia = (() => alt) as typeof window.matchMedia;

    const theme = dienst({ defaultScheme: 'system' });

    expect(theme.resolvedScheme()).toBe('light');
    expect(() => TestBed.resetTestingModule()).not.toThrow();
  });

  it('follows a change made in another tab', () => {
    const theme = dienst();

    ablage.setItem('zenit-theme', JSON.stringify({ scheme: 'light', accent: 'blau' }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'zenit-theme' }));

    expect(theme.scheme()).toBe('light');
    expect(theme.accent()).toBe('blau');
    expect(ziel.getAttribute('data-theme')).toBe('light');
    expect(ziel.getAttribute('data-accent')).toBe('blau');

    // The other tab called reset(), or cleared the whole storage (key null).
    ablage.clear();
    window.dispatchEvent(new StorageEvent('storage', { key: null }));

    expect(theme.scheme()).toBe('dark');
    expect(ziel.hasAttribute('data-accent')).toBe(false);
  });

  it('ignores storage events of other keys', () => {
    const theme = dienst();
    ablage.setItem('zenit-theme', JSON.stringify({ scheme: 'light' }));

    window.dispatchEvent(new StorageEvent('storage', { key: 'etwas-anderes' }));

    expect(theme.scheme()).toBe('dark');
  });

  it('removes every listener when the injector is destroyed', () => {
    const theme = dienst({ defaultScheme: 'system' });

    expect(abfrage.hoerer.size).toBe(1);
    expect(kontrastAbfrage.hoerer.size).toBe(1);

    TestBed.resetTestingModule();

    expect(abfrage.hoerer.size).toBe(0);
    expect(kontrastAbfrage.hoerer.size).toBe(0);

    ablage.setItem('zenit-theme', JSON.stringify({ scheme: 'light' }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'zenit-theme' }));

    expect(theme.scheme()).toBe('system');
    expect(ziel.getAttribute('data-theme')).toBe('dark');
  });

  it('clears the attributes on the previous element when the target changes', () => {
    const zweites = document.createElement('div');
    let aktuell: HTMLElement = ziel;
    const theme = dienst({ target: () => aktuell });
    theme.setAccent('blau');

    aktuell = zweites;
    theme.setScheme('light');

    expect(ziel.hasAttribute('data-theme')).toBe(false);
    expect(ziel.hasAttribute('data-accent')).toBe(false);
    expect(zweites.getAttribute('data-theme')).toBe('light');
    expect(zweites.getAttribute('data-accent')).toBe('blau');
  });

  it('warns in dev mode about an unknown id and still returns false', () => {
    const warnung = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const theme = dienst();

    expect(theme.setScheme('sepia')).toBe(false);
    expect(theme.setAccent('orange')).toBe(false);

    expect(warnung).toHaveBeenCalledTimes(2);
    expect(warnung.mock.calls[0][0]).toContain('setScheme("sepia")');
    expect(warnung.mock.calls[1][0]).toContain('setAccent("orange")');
  });

  it('warns in dev mode about defaults that are not registered', () => {
    const warnung = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    dienst({ defaultScheme: 'sepia', defaultAccent: 'orange' });

    expect(warnung.mock.calls.map((aufruf) => String(aufruf[0]))).toEqual([
      expect.stringContaining('defaultScheme "sepia"'),
      expect.stringContaining('defaultAccent "orange"'),
    ]);
  });

  it('warns about a second config below the root and keeps the first', () => {
    const warnung = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const theme = dienst({ defaultScheme: 'light' });

    expect(warnung).not.toHaveBeenCalled();

    createEnvironmentInjector(
      [provideZenitTheme({ defaultScheme: 'contrast' })],
      TestBed.inject(EnvironmentInjector),
    );

    expect(warnung).toHaveBeenCalledTimes(1);
    expect(warnung.mock.calls[0][0]).toContain('application root');
    expect(theme.scheme()).toBe('light');
  });
});

describe('ZTheme on the server', () => {
  /** Every browser global the service could reach for fails the test when touched. */
  function globaleSperren(): void {
    window.matchMedia = (() => {
      throw new Error('matchMedia touched on the server');
    }) as typeof window.matchMedia;
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: () => {
        throw new Error('localStorage touched on the server');
      },
    });
    vi.spyOn(window, 'addEventListener').mockImplementation(() => {
      throw new Error('window.addEventListener touched on the server');
    });
  }

  function serverDienst(config: ZThemeConfig = {}): ZTheme {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }, provideZenitTheme(config)],
    });
    return TestBed.inject(ZTheme);
  }

  it('touches no browser global and writes a fixed default into the document', () => {
    globaleSperren();

    const theme = serverDienst({ defaultScheme: 'light' });

    expect(theme.scheme()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.hasAttribute('data-accent')).toBe(false);
    // Switching on the server changes the signals and nothing else.
    expect(theme.setScheme('contrast')).toBe(true);
    expect(theme.setAccent('blau')).toBe(true);
    theme.reset();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('writes nothing for system, which only the browser can resolve', () => {
    globaleSperren();

    serverDienst({ defaultScheme: 'system' });

    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('never calls a custom target', () => {
    globaleSperren();
    const target = vi.fn(() => ziel);

    serverDienst({ target });

    expect(target).not.toHaveBeenCalled();
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });
});

describe('zenitThemeInitScript', () => {
  /** Runs the script the way a `<script>` in `<head>` would: against the globals. */
  function ausfuehren(config?: ZThemeConfig): { theme: string | null; accent: string | null } {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-accent');
    new Function(zenitThemeInitScript(config))();
    return {
      theme: document.documentElement.getAttribute('data-theme'),
      accent: document.documentElement.getAttribute('data-accent'),
    };
  }

  it('is a pure string without eval and cannot close its script element', () => {
    const quelle = zenitThemeInitScript({ storageKey: '</script><script>alert(1)//' });

    expect(quelle).not.toMatch(/eval|new Function/);
    expect(quelle).not.toContain('<');
    expect(zenitThemeInitScript()).toBe(zenitThemeInitScript({}));
    expect(zenitThemeInitScript()).toContain('"zenit-theme"');
  });

  it('applies the defaults without a stored choice', () => {
    expect(ausfuehren()).toEqual({ theme: 'dark', accent: null });
  });

  it('never reads the storage with storageKey null', () => {
    ablage.wirft = true;

    expect(ausfuehren({ storageKey: null, defaultScheme: 'light' })).toEqual({
      theme: 'light',
      accent: null,
    });
  });

  it('survives a localStorage getter that throws', () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: () => {
        throw new DOMException('The operation is insecure.', 'SecurityError');
      },
    });

    expect(ausfuehren()).toEqual({ theme: 'dark', accent: null });
  });

  const GESPEICHERT: (string | null)[] = [
    null,
    '',
    'kein json',
    '"light"',
    '[]',
    '{}',
    JSON.stringify({ scheme: 'light', accent: 'violett' }),
    JSON.stringify({ scheme: 'contrast' }),
    JSON.stringify({ accent: 'gruen' }),
    JSON.stringify({ scheme: 'system', accent: 'rot' }),
    JSON.stringify({ scheme: 'sepia', accent: 'orange' }),
    JSON.stringify({ scheme: ['light'], accent: 5 }),
    JSON.stringify({ scheme: 'tuerkis-schema', accent: 'tuerkis' }),
  ];
  const CONFIGS: ZThemeConfig[] = [
    {},
    { defaultScheme: 'system' },
    { defaultScheme: 'system', schemes: ['dark', 'light'] },
    { defaultScheme: 'light', defaultAccent: 'blau' },
    { schemes: ['dark', 'tuerkis-schema'], accents: ['rot', 'tuerkis'], storageKey: 'eigener' },
  ];

  it('writes exactly what ZTheme writes, for every stored value, config and system setting', () => {
    let faelle = 0;
    for (const config of CONFIGS) {
      for (const roh of GESPEICHERT) {
        for (const [dunkel, kontrast] of [
          [true, false],
          [false, false],
          [true, true],
          [false, true],
        ]) {
          abfrage.matches = dunkel;
          kontrastAbfrage.matches = kontrast;
          ablage.clear();
          if (roh !== null) ablage.setItem(config.storageKey ?? 'zenit-theme', roh);

          const vomSkript = ausfuehren(config);

          document.documentElement.removeAttribute('data-theme');
          document.documentElement.removeAttribute('data-accent');
          TestBed.resetTestingModule();
          TestBed.configureTestingModule({ providers: [provideZenitTheme(config)] });
          TestBed.inject(ZTheme);
          const vomDienst = {
            theme: document.documentElement.getAttribute('data-theme'),
            accent: document.documentElement.getAttribute('data-accent'),
          };

          expect(vomSkript, `${JSON.stringify(config)} / ${roh} / ${dunkel} / ${kontrast}`).toEqual(
            vomDienst,
          );
          faelle++;
        }
      }
    }
    expect(faelle).toBe(CONFIGS.length * GESPEICHERT.length * 4);
  });

  it('resolves system to dark without matchMedia, like the service', () => {
    (window as { matchMedia?: unknown }).matchMedia = undefined;

    expect(ausfuehren({ defaultScheme: 'system' })).toEqual({ theme: 'dark', accent: null });
  });
});
