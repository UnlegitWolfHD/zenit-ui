import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ZRow, ZRowMain, ZRowNum, ZRows, ZRowsHead } from './rows';

@Component({
  imports: [ZRow, ZRowMain, ZRowNum, ZRows, ZRowsHead],
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
  </z-rows>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class RowsHost {
  readonly spalten = signal('1fr 120px');
  readonly titel = signal('minecraft-01');
  readonly meta = signal('Nürnberg, 4 GB');
  readonly bild = signal('');
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

  it('gives [zRowNum] the number class in head and row', () => {
    const fixture = TestBed.createComponent(RowsHost);
    fixture.detectChanges();
    const zahlen = fixture.nativeElement.querySelectorAll('[zRowNum]');

    expect(zahlen.length).toBe(2);
    expect(Array.from<HTMLElement>(zahlen).every((e) => e.classList.contains('z-row__num'))).toBe(
      true,
    );
  });
});
