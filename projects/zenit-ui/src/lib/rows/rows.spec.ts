import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ZRow,
  ZRowAction,
  ZRowLink,
  ZRowMain,
  ZRowMeta,
  ZRowNum,
  ZRows,
  ZRowsHead,
  ZRowThumb,
  ZRowTitle,
} from './rows';

@Component({
  imports: [ZRow, ZRowMain, ZRowMeta, ZRowNum, ZRows, ZRowsHead],
  template: `<z-rows [columns]="spalten()">
    <z-rows-head>
      <span>Server</span>
      <span zRowNum>Preis</span>
    </z-rows-head>
    <a zRow href="#server-1">
      <z-row-main [title]="titel()" [meta]="meta()" [image]="bild()" />
      <span zRowNum>4,98 €</span>
    </a>
    <div zRow>
      <z-row-main title="Zweiter Server" />
    </div>
    <div zRow>
      <z-row-main title="Dritter Server">
        <div zRowMeta>Valheim · <span class="z-mono">203.0.113.11:2456</span></div>
      </z-row-main>
    </div>
  </z-rows>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class RowsHost {
  readonly spalten = signal('1fr 120px');
  readonly titel = signal('minecraft-01');
  readonly meta = signal('Nürnberg, 4 GB');
  readonly bild = signal('');
}

/** A row with a target and its own action: stretched link plus row action. */
@Component({
  imports: [ZRow, ZRowAction, ZRowLink, ZRowMain, ZRows, ZRowTitle],
  template: `<z-rows>
    <div zRow>
      <z-row-main title="Beispiel-Server 1" meta="Minecraft · 203.0.113.10">
        <a zRowTitle zRowLink href="#server-1">Beispiel-Server 1</a>
      </z-row-main>
      <button zRowAction type="button" aria-label="Aktionen für Beispiel-Server 1">…</button>
    </div>
  </z-rows>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class LinkZeileHost {}

/** The server list of an application: server name as title, game as thumbnail. */
@Component({
  imports: [ZRow, ZRowMain, ZRowThumb, ZRows],
  template: `<z-rows>
    <a zRow href="#server-1">
      <z-row-main title="survival-01" [image]="bild()" [thumbText]="spiel()" [thumb]="thumb()" />
    </a>
    <div zRow>
      <z-row-main title="beispiel.de" image="/assets/nie-gezeigt.png">
        <span zRowThumb class="eigenes-medium">D</span>
      </z-row-main>
    </div>
  </z-rows>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ThumbHost {
  readonly bild = signal('');
  readonly spiel = signal('Valheim');
  readonly thumb = signal(true);
}

describe('ZRows', () => {
  it('sets columns as the CSS variable --z-cols on z-rows', () => {
    const fixture = TestBed.createComponent(RowsHost);
    fixture.detectChanges();
    const liste = fixture.nativeElement.querySelector('z-rows');

    expect(liste.classList).toContain('z-rows');
    expect(liste.style.getPropertyValue('--z-cols')).toBe('1fr 120px');

    fixture.componentInstance.spalten.set('1fr 80px 120px');
    fixture.detectChanges();

    expect(liste.style.getPropertyValue('--z-cols')).toBe('1fr 80px 120px');
  });

  it('sets no --z-cols without columns', () => {
    const fixture = TestBed.createComponent(RowsHost);
    fixture.componentInstance.spalten.set('');
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('z-rows').style.getPropertyValue('--z-cols'),
    ).toBeFalsy();
  });

  it('gives z-rows-head the head class', () => {
    const fixture = TestBed.createComponent(RowsHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('z-rows-head').classList).toContain('z-rows__head');
  });

  it('gives a[zRow] and div[zRow] the row class', () => {
    const fixture = TestBed.createComponent(RowsHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('a[zRow]').classList).toContain('z-row');
    expect(fixture.nativeElement.querySelector('div[zRow]').classList).toContain('z-row');
  });

  it('renders title and meta in z-row-main', () => {
    const fixture = TestBed.createComponent(RowsHost);
    fixture.detectChanges();
    const haupt = fixture.nativeElement.querySelector('z-row-main');

    expect(haupt.classList).toContain('z-row__main');
    expect(haupt.hasAttribute('title')).toBe(false);
    expect(haupt.querySelector('.z-row__title').textContent.trim()).toBe('minecraft-01');
    expect(haupt.querySelector('.z-row__meta').textContent.trim()).toBe('Nürnberg, 4 GB');
  });

  it('leaves out the meta line without meta', () => {
    const fixture = TestBed.createComponent(RowsHost);
    fixture.detectChanges();
    const zweite = fixture.nativeElement.querySelectorAll('z-row-main')[1];

    expect(zweite.querySelector('.z-row__meta')).toBeNull();
    expect(zweite.querySelector('.z-row__title').textContent.trim()).toBe('Zweiter Server');
  });

  it('projects [zRowMeta] as the meta line, so a part of it can be mono', () => {
    const fixture = TestBed.createComponent(RowsHost);
    fixture.detectChanges();
    const dritte = fixture.nativeElement.querySelectorAll('z-row-main')[2];
    const meta = dritte.querySelectorAll('.z-row__meta');

    // One meta line only: the slot replaces the input, it does not add to it.
    expect(meta.length).toBe(1);
    expect(meta[0].tagName).toBe('DIV');
    expect(meta[0].textContent.trim()).toBe('Valheim · 203.0.113.11:2456');
    expect(meta[0].querySelector('.z-mono').textContent).toBe('203.0.113.11:2456');
  });

  it('falls back to the first letter of title without image', () => {
    const fixture = TestBed.createComponent(RowsHost);
    fixture.detectChanges();
    const thumb = fixture.nativeElement.querySelector('z-row-main .z-row__thumb');

    expect(thumb.querySelector('img')).toBeNull();
    expect(thumb.textContent.trim()).toBe('M');
  });

  it('renders an img with an empty alt when image is set', () => {
    const fixture = TestBed.createComponent(RowsHost);
    fixture.componentInstance.bild.set('/assets/minecraft.png');
    fixture.detectChanges();
    const bild = fixture.nativeElement.querySelector('z-row-main .z-row__thumb img');

    expect(bild.getAttribute('src')).toBe('/assets/minecraft.png');
    expect(bild.getAttribute('alt')).toBe('');
    expect(fixture.nativeElement.querySelector('z-row-main .z-row__thumb').textContent.trim()).toBe(
      '',
    );
  });

  it('projects [zRowTitle] into the title instead of the title text', () => {
    const fixture = TestBed.createComponent(LinkZeileHost);
    fixture.detectChanges();
    const titel = fixture.nativeElement.querySelector('.z-row__title');

    expect(titel.textContent.trim()).toBe('Beispiel-Server 1');
    expect(titel.firstElementChild?.tagName).toBe('A');
    expect(titel.querySelector('a').getAttribute('href')).toBe('#server-1');
    // The title input keeps feeding the initial of the thumbnail.
    expect(fixture.nativeElement.querySelector('.z-row__thumb').textContent.trim()).toBe('B');
    expect(fixture.nativeElement.querySelector('.z-row__meta').textContent.trim()).toBe(
      'Minecraft · 203.0.113.10',
    );
  });

  it('gives a[zRowLink] and [zRowAction] their classes inside a div row', () => {
    const fixture = TestBed.createComponent(LinkZeileHost);
    fixture.detectChanges();
    const zeile = fixture.nativeElement.querySelector('div[zRow]');

    expect(zeile.classList).toContain('z-row');
    expect(zeile.querySelector('a[zRowLink]').classList).toContain('z-row__link');
    expect(zeile.querySelector('button[zRowAction]').classList).toContain('z-row__action');
    // The action is a sibling of z-row-main, never a child of the link.
    expect(zeile.querySelector('a[zRowLink] button')).toBeNull();
  });

  it('gives [zRowNum] the number class in head and row', () => {
    const fixture = TestBed.createComponent(RowsHost);
    fixture.detectChanges();
    const zahlen = fixture.nativeElement.querySelectorAll('[zRowNum]');

    expect(zahlen.length).toBe(2);
    expect(Array.from<HTMLElement>(zahlen).every((e) => e.classList.contains('z-row__num'))).toBe(
      true,
    );
  });

  describe('thumbnail', () => {
    const thumbVon = (fixture: { nativeElement: HTMLElement }) =>
      fixture.nativeElement.querySelector('z-row-main .z-row__thumb') as HTMLElement;

    it('takes the initial from thumbText instead of the title', () => {
      const fixture = TestBed.createComponent(ThumbHost);
      fixture.detectChanges();

      expect(thumbVon(fixture).querySelector('img')).toBeNull();
      expect(thumbVon(fixture).textContent?.trim()).toBe('V');
    });

    it('falls back to the title when thumbText is empty', () => {
      const fixture = TestBed.createComponent(ThumbHost);
      fixture.componentInstance.spiel.set('  ');
      fixture.detectChanges();

      expect(thumbVon(fixture).textContent?.trim()).toBe('S');
    });

    it('drops into the initial when the image fails, and tries a new URL again', () => {
      const fixture = TestBed.createComponent(ThumbHost);
      fixture.componentInstance.bild.set('/assets/fehlt.png');
      fixture.detectChanges();
      const bild = thumbVon(fixture).querySelector('img') as HTMLImageElement;

      expect(bild.getAttribute('src')).toBe('/assets/fehlt.png');

      bild.dispatchEvent(new Event('error'));
      fixture.detectChanges();

      expect(thumbVon(fixture).querySelector('img')).toBeNull();
      expect(thumbVon(fixture).textContent?.trim()).toBe('V');

      fixture.componentInstance.bild.set('/assets/valheim.png');
      fixture.detectChanges();

      expect(thumbVon(fixture).querySelector('img')?.getAttribute('src')).toBe(
        '/assets/valheim.png',
      );
    });

    it('puts a [zRowThumb] element in place of image and initial', () => {
      const fixture = TestBed.createComponent(ThumbHost);
      fixture.detectChanges();
      const thumb = fixture.nativeElement.querySelectorAll('.z-row__thumb')[1] as HTMLElement;

      expect(thumb.children.length).toBe(1);
      expect(thumb.firstElementChild?.classList).toContain('eigenes-medium');
      expect(thumb.querySelector('img')).toBeNull();
      expect(thumb.textContent?.trim()).toBe('D');
    });

    it('hides every thumbnail from the accessible name, whatever it shows', () => {
      const fixture = TestBed.createComponent(ThumbHost);
      fixture.detectChanges();
      const [initiale, slot] = fixture.nativeElement.querySelectorAll('.z-row__thumb');

      // The initial and the projected medium are decoration: the link row reads title and meta.
      expect(initiale.getAttribute('aria-hidden')).toBe('true');
      expect(slot.getAttribute('aria-hidden')).toBe('true');
      expect(slot.querySelector('.eigenes-medium')).not.toBeNull();

      fixture.componentInstance.bild.set('/assets/valheim.png');
      fixture.detectChanges();

      expect(thumbVon(fixture).getAttribute('aria-hidden')).toBe('true');
      expect(thumbVon(fixture).querySelector('img')?.getAttribute('alt')).toBe('');
    });

    it('leaves the thumbnail out with thumb false', () => {
      const fixture = TestBed.createComponent(ThumbHost);
      fixture.componentInstance.thumb.set(false);
      fixture.detectChanges();
      const haupt = fixture.nativeElement.querySelector('z-row-main') as HTMLElement;

      expect(haupt.querySelector('.z-row__thumb')).toBeNull();
      expect(haupt.firstElementChild?.classList).toContain('z-row__text');
      expect(haupt.querySelector('.z-row__title')?.textContent?.trim()).toBe('survival-01');
    });
  });
});
