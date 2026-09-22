import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ZGameGrid, ZGameTile } from './game-tile';

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
