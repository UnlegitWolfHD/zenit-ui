import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, RouterLink } from '@angular/router';
import { ZGameGrid, ZGameTile, ZGameTileLink } from './game-tile';

@Component({
  imports: [ZGameGrid, ZGameTile],
  template: `<z-game-grid>
    <button
      zGameTile
      [title]="titel()"
      [price]="preis()"
      [cover]="cover()"
      [selected]="gewaehlt()"
      (coverError)="fehler = fehler + 1"
    ></button>
  </z-game-grid>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class GameHost {
  readonly titel = signal('Valheim');
  readonly preis = signal('ab 2,70 € / Monat');
  readonly cover = signal('');
  readonly gewaehlt = signal(false);
  fehler = 0;
}

@Component({
  imports: [ZGameTile],
  template: `<form>
    <button zGameTile title="Valheim"></button>
    <button zGameTile type="submit" title="Rust"></button>
  </form>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FormHost {}

describe('ZGameTile', () => {
  function baue(): { kachel: HTMLButtonElement; host: GameHost; rendere: () => void } {
    const fixture = TestBed.createComponent(GameHost);
    fixture.detectChanges();
    return {
      kachel: fixture.nativeElement.querySelector('button[zGameTile]'),
      host: fixture.componentInstance,
      rendere: () => fixture.detectChanges(),
    };
  }

  it('gives the grid the class z-games', () => {
    const fixture = TestBed.createComponent(GameHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('z-game-grid').className).toBe('z-games');
  });

  it('carries the class z-game on the tile', () => {
    const { kachel } = baue();

    expect(kachel.className).toBe('z-game');
  });

  it('sets type="button" so the tile never submits a surrounding form', () => {
    const { kachel } = baue();

    expect(kachel.getAttribute('type')).toBe('button');

    const fixture = TestBed.createComponent(FormHost);
    fixture.detectChanges();
    const formular: HTMLFormElement = fixture.nativeElement.querySelector('form');
    let abgeschickt = 0;
    formular.addEventListener('submit', (ereignis) => {
      ereignis.preventDefault();
      abgeschickt += 1;
    });

    fixture.nativeElement.querySelector('button[zGameTile]').click();

    expect(abgeschickt).toBe(0);
  });

  it('keeps a static type written by the caller', () => {
    const fixture = TestBed.createComponent(FormHost);
    fixture.detectChanges();
    const kacheln = fixture.nativeElement.querySelectorAll('button[zGameTile]');

    expect(kacheln[1].getAttribute('type')).toBe('submit');
  });

  it('mirrors selected in aria-pressed and uses no extra modifier class', () => {
    const { kachel, host, rendere } = baue();

    expect(kachel.getAttribute('aria-pressed')).toBe('false');

    host.gewaehlt.set(true);
    rendere();

    // Chosen is carried by aria-pressed alone; the 2px line hangs off
    // `.z-game[aria-pressed="true"]` in the stylesheet, not off a class.
    expect(kachel.getAttribute('aria-pressed')).toBe('true');
    expect(kachel.className).toBe('z-game');
  });

  it('carries no native title attribute despite the title input', () => {
    const { kachel } = baue();

    expect(kachel.hasAttribute('title')).toBe(false);
  });

  it('shows the title below the cover', () => {
    const { kachel } = baue();

    expect(kachel.querySelector('.z-game__title')?.textContent?.trim()).toBe('Valheim');
  });

  it('shows the price in the mono element z-game__price', () => {
    const { kachel } = baue();

    expect(kachel.querySelector('.z-game__price')?.textContent?.trim()).toBe('ab 2,70 € / Monat');
  });

  it('falls back to the title text when no cover is given', () => {
    const { kachel } = baue();
    const cover = kachel.querySelector('.z-game__cover') as HTMLElement;

    expect(cover.querySelector('img')).toBeNull();
    expect(cover.textContent?.trim()).toBe('Valheim');
  });

  it('hides the cover area from the accessible name, whatever it shows', () => {
    const { kachel, host, rendere } = baue();
    const cover = kachel.querySelector('.z-game__cover') as HTMLElement;

    // Without a cover the area repeats the title, with one it shows a picture
    // of what the title says: decorative either way, so the name of the button
    // is the title once plus the price.
    expect(cover.getAttribute('aria-hidden')).toBe('true');

    host.cover.set('/cover/valheim.webp');
    rendere();

    expect(cover.getAttribute('aria-hidden')).toBe('true');
    expect(cover.querySelector('img')?.getAttribute('alt')).toBe('');
  });

  it('renders an img with an empty alt when a cover is given', () => {
    const { kachel, host, rendere } = baue();
    host.cover.set('/cover/valheim.webp');
    rendere();
    const bild = kachel.querySelector('.z-game__cover img') as HTMLImageElement;

    expect(bild.getAttribute('src')).toBe('/cover/valheim.webp');
    expect(bild.getAttribute('alt')).toBe('');
    expect(kachel.querySelector('.z-game__cover')?.textContent?.trim()).toBe('');
  });

  // The tile has one rendering for every aspect ratio: the fit is CSS
  // (object-fit: contain in _werkzeuge.css, measured in e2e/zustaende.spec.ts),
  // so a landscape header and a 3:4 cover both keep the img after it loaded,
  // with no class or attribute that depends on the format.
  for (const [format, breite, hoehe] of [
    ['a landscape cover (460x215)', 460, 215],
    ['a 3:4 cover (300x400)', 300, 400],
  ] as const) {
    it(`shows ${format} as the same img in the same cover area`, () => {
      const { kachel, host, rendere } = baue();
      host.cover.set(`/cover/${breite}x${hoehe}.webp`);
      rendere();
      const bild = kachel.querySelector('.z-game__cover img') as HTMLImageElement;
      Object.defineProperty(bild, 'naturalWidth', { value: breite });
      Object.defineProperty(bild, 'naturalHeight', { value: hoehe });

      bild.dispatchEvent(new Event('load'));
      rendere();

      expect(kachel.querySelector('.z-game__cover img')).toBe(bild);
      expect(bild.getAttribute('src')).toBe(`/cover/${breite}x${hoehe}.webp`);
      expect(bild.getAttribute('alt')).toBe('');
      expect(bild.className).toBe('');
      expect(kachel.className).toBe('z-game');
      expect(kachel.querySelector('.z-game__cover')?.className).toBe('z-game__cover');
      expect(kachel.querySelector('.z-game__cover')?.getAttribute('aria-hidden')).toBe('true');
      expect(host.fehler).toBe(0);
    });
  }

  it('falls back to the title text when the cover fails and reports it once', () => {
    const { kachel, host, rendere } = baue();
    host.cover.set('/cover/fehlt.webp');
    rendere();
    const bild = kachel.querySelector('.z-game__cover img') as HTMLImageElement;

    bild.dispatchEvent(new Event('error'));
    rendere();

    // No broken image is left standing: the img is gone, the name is the text.
    expect(kachel.querySelector('.z-game__cover img')).toBeNull();
    expect(kachel.querySelector('.z-game__cover')?.textContent?.trim()).toBe('Valheim');
    expect(host.fehler).toBe(1);
  });

  it('tries again when the cover changes', () => {
    const { kachel, host, rendere } = baue();
    host.cover.set('/cover/fehlt.webp');
    rendere();
    (kachel.querySelector('.z-game__cover img') as HTMLImageElement).dispatchEvent(
      new Event('error'),
    );
    rendere();

    host.cover.set('/cover/valheim.webp');
    rendere();
    const bild = kachel.querySelector('.z-game__cover img') as HTMLImageElement;

    expect(bild.getAttribute('src')).toBe('/cover/valheim.webp');
    expect(host.fehler).toBe(1);
  });
});

/** Link tiles in a grid, one with routerLink and query params, one with href. */
@Component({
  imports: [RouterLink, ZGameGrid, ZGameTileLink],
  template: `<z-game-grid>
    <a
      zGameTile
      [title]="titel()"
      price="ab 1,98 € / Monat"
      [cover]="cover()"
      routerLink="/user/games/create"
      [queryParams]="{ game: 'minecraft' }"
      (coverError)="fehler = fehler + 1"
    ></a>
    <a zGameTile title="Rust" price="ab 4,98 € / Monat" href="/spiele/rust"></a>
  </z-game-grid>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class LinkHost {
  readonly titel = signal('Minecraft');
  readonly cover = signal('');
  fehler = 0;
}

describe('ZGameTileLink', () => {
  function baue() {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(LinkHost);
    fixture.detectChanges();
    const [kachel, zweite] = fixture.nativeElement.querySelectorAll('a[zGameTile]');
    return {
      fixture,
      kachel: kachel as HTMLAnchorElement,
      zweite: zweite as HTMLAnchorElement,
      host: fixture.componentInstance,
      rendere: () => fixture.detectChanges(),
    };
  }

  it('is a link in the grid with the class and the content of a tile', () => {
    const { fixture, kachel } = baue();

    expect(kachel.parentElement).toBe(fixture.nativeElement.querySelector('z-game-grid'));
    expect(kachel.className).toBe('z-game');
    expect(kachel.querySelector('.z-game__cover')?.getAttribute('aria-hidden')).toBe('true');
    expect(kachel.querySelector('.z-game__title')?.textContent).toBe('Minecraft');
    expect(kachel.querySelector('.z-game__price')?.textContent).toBe('ab 1,98 € / Monat');
  });

  it('takes its target from routerLink or href on the same element', () => {
    const { kachel, zweite } = baue();

    expect(kachel.getAttribute('href')).toBe('/user/games/create?game=minecraft');
    expect(zweite.getAttribute('href')).toBe('/spiele/rust');
  });

  it('carries no aria-pressed, no type and no native title', () => {
    const { kachel } = baue();

    expect(kachel.hasAttribute('aria-pressed')).toBe(false);
    expect(kachel.hasAttribute('type')).toBe(false);
    expect(kachel.hasAttribute('title')).toBe(false);
    expect(kachel.hasAttribute('role')).toBe(false);
  });

  it('reads title and price as its text, the cover area stays out', () => {
    const { kachel, host, rendere } = baue();
    const sichtbar = () =>
      Array.from(kachel.children)
        .filter((kind) => kind.getAttribute('aria-hidden') !== 'true')
        .map((kind) => kind.textContent?.trim());

    expect(sichtbar()).toEqual(['Minecraft', 'ab 1,98 € / Monat']);

    host.cover.set('/cover/minecraft.webp');
    rendere();

    expect(sichtbar()).toEqual(['Minecraft', 'ab 1,98 € / Monat']);
    expect(kachel.querySelector('.z-game__cover img')?.getAttribute('alt')).toBe('');
  });

  it('falls back to the title text when the cover fails and reports it once', () => {
    const { kachel, host, rendere } = baue();
    host.cover.set('/cover/fehlt.webp');
    rendere();

    (kachel.querySelector('.z-game__cover img') as HTMLImageElement).dispatchEvent(
      new Event('error'),
    );
    rendere();

    expect(kachel.querySelector('.z-game__cover img')).toBeNull();
    expect(kachel.querySelector('.z-game__cover')?.textContent?.trim()).toBe('Minecraft');
    expect(host.fehler).toBe(1);

    host.cover.set('/cover/minecraft.webp');
    rendere();

    expect(kachel.querySelector('.z-game__cover img')?.getAttribute('src')).toBe(
      '/cover/minecraft.webp',
    );
  });
});
