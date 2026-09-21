import { TestBed } from '@angular/core/testing';
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
let ablage: Ablage;
let ziel: HTMLElement;
let echtesMatchMedia: typeof window.matchMedia | undefined;
let echteAblage: PropertyDescriptor | undefined;

beforeEach(() => {
  abfrage = new MedienAbfrage(true);
  ablage = new Ablage();
  ziel = document.createElement('div');
  document.body.appendChild(ziel);

  echtesMatchMedia = window.matchMedia;
  window.matchMedia = ((): MediaQueryList =>
    abfrage as unknown as MediaQueryList) as typeof window.matchMedia;
  echteAblage = Object.getOwnPropertyDescriptor(window, 'localStorage');
  Object.defineProperty(window, 'localStorage', { value: ablage, configurable: true });
});

afterEach(() => {
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
});
