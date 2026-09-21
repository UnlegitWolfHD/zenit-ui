import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ZPagination } from './pagination';

@Component({
  imports: [ZPagination],
  template: `<z-pagination
    [(page)]="seite"
    [total]="gesamt()"
    [pageSize]="proSeite()"
    itemLabel="Transaktionen"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class PagerHost {
  readonly seite = signal(1);
  readonly gesamt = signal(118);
  readonly proSeite = signal(25);
}

@Component({
  imports: [ZPagination],
  template: `<z-pagination
    [(page)]="seite"
    [total]="118"
    itemLabel="Transaktionen"
    [rangeLabel]="eigenerText"
    ariaLabelPrev="Eine Seite zurueck"
    ariaLabelNext="Eine Seite weiter"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class EigenerTextHost {
  readonly seite = signal(1);
  readonly eigenerText = (von: number, bis: number, total: number, label: string): string =>
    `${label} ${von}-${bis} (${total})`;
}

function bereich(fixture: { nativeElement: HTMLElement }): string {
  return fixture.nativeElement.querySelector('.z-pager > span')?.textContent?.trim() ?? '';
}

function nav(fixture: { nativeElement: HTMLElement }): HTMLButtonElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('.z-pager__nav button'));
}

describe('ZPagination', () => {
  it('schreibt den Bereich der ersten Seite', () => {
    const fixture = TestBed.createComponent(PagerHost);
    fixture.detectChanges();

    expect(bereich(fixture)).toBe('1 bis 25 von 118 Transaktionen');
    expect(fixture.nativeElement.querySelector('.z-pager__nav .z-mono').textContent.trim()).toBe(
      '1 / 5',
    );
  });

  it('schreibt auf der letzten Seite den angebrochenen Bereich', async () => {
    const fixture = TestBed.createComponent(PagerHost);
    fixture.componentInstance.seite.set(5);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(bereich(fixture)).toBe('101 bis 118 von 118 Transaktionen');
  });

  it('rechnet mit einem anderen pageSize', () => {
    const fixture = TestBed.createComponent(PagerHost);
    fixture.componentInstance.proSeite.set(50);
    fixture.detectChanges();

    expect(bereich(fixture)).toBe('1 bis 50 von 118 Transaktionen');
    expect(fixture.nativeElement.querySelector('.z-pager__nav .z-mono').textContent.trim()).toBe(
      '1 / 3',
    );
  });

  it('sperrt Zurueck auf der ersten und Weiter auf der letzten Seite', async () => {
    const fixture = TestBed.createComponent(PagerHost);
    fixture.detectChanges();
    const [zurueck, weiter] = nav(fixture);

    expect(zurueck.disabled).toBe(true);
    expect(weiter.disabled).toBe(false);

    fixture.componentInstance.seite.set(5);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(zurueck.disabled).toBe(false);
    expect(weiter.disabled).toBe(true);
  });

  it('blaettert per Klick und meldet die Seite zurueck', async () => {
    const fixture = TestBed.createComponent(PagerHost);
    fixture.detectChanges();
    const [zurueck, weiter] = nav(fixture);

    weiter.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.seite()).toBe(2);
    expect(bereich(fixture)).toBe('26 bis 50 von 118 Transaktionen');

    zurueck.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.seite()).toBe(1);
    expect(bereich(fixture)).toBe('1 bis 25 von 118 Transaktionen');
  });

  it('rendert nichts, wenn die Liste leer ist', () => {
    const fixture = TestBed.createComponent(PagerHost);
    fixture.componentInstance.gesamt.set(0);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.z-pager')).toBeNull();
  });

  it('rendert nichts, wenn alles auf eine Seite passt', () => {
    const fixture = TestBed.createComponent(PagerHost);
    fixture.componentInstance.gesamt.set(25);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.z-pager')).toBeNull();

    fixture.componentInstance.gesamt.set(26);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.z-pager')).not.toBeNull();
  });

  it('klemmt die Seite, wenn total schrumpft', async () => {
    const fixture = TestBed.createComponent(PagerHost);
    fixture.componentInstance.seite.set(5);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.seite()).toBe(5);

    fixture.componentInstance.gesamt.set(30);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.seite()).toBe(2);
    expect(bereich(fixture)).toBe('26 bis 30 von 30 Transaktionen');
  });

  it('nimmt einen eigenen rangeLabel und eigene aria-Label fuer die Knoepfe', () => {
    const fixture = TestBed.createComponent(EigenerTextHost);
    fixture.detectChanges();
    const [zurueck, weiter] = nav(fixture);

    expect(bereich(fixture)).toBe('Transaktionen 1-25 (118)');
    expect(zurueck.getAttribute('aria-label')).toBe('Eine Seite zurueck');
    expect(weiter.getAttribute('aria-label')).toBe('Eine Seite weiter');
  });

  it('beschriftet die Knoepfe ohne eigene Angabe deutsch', () => {
    const fixture = TestBed.createComponent(PagerHost);
    fixture.detectChanges();
    const [zurueck, weiter] = nav(fixture);

    expect(zurueck.getAttribute('aria-label')).toBe('Vorherige Seite');
    expect(weiter.getAttribute('aria-label')).toBe('Nächste Seite');
  });
});
