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
    ></button>
  </z-game-grid>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class GameHost {
  readonly titel = signal('Valheim');
  readonly preis = signal('ab 2,70 € / Monat');
  readonly cover = signal('');
  readonly gewaehlt = signal(false);
}

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

  // Finding: the API table and the preview expect a plain action button, but
  // ZGameTile never sets `type`. Inside a form the tile therefore submits.
  // CdkMenuItem does set it (`_setType`), ZGameTile does not. The test records
  // the current behaviour and has to be flipped once the type is added.
  it('leaves the native type unset instead of forcing type="button"', () => {
    const { kachel } = baue();

    expect(kachel.hasAttribute('type')).toBe(false);
    expect(kachel.type).toBe('submit');
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

  it('renders an img with an empty alt when a cover is given', () => {
    const { kachel, host, rendere } = baue();
    host.cover.set('/cover/valheim.webp');
    rendere();
    const bild = kachel.querySelector('.z-game__cover img') as HTMLImageElement;

    expect(bild.getAttribute('src')).toBe('/cover/valheim.webp');
    expect(bild.getAttribute('alt')).toBe('');
    expect(kachel.querySelector('.z-game__cover')?.textContent?.trim()).toBe('');
  });
});
