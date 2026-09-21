import { Component, EnvironmentInjector, createEnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ZPagination } from '../pagination';
import {
  injectZLabels,
  provideZenitLabels,
  Z_LABELS,
  Z_LABELS_DE,
  Z_LABELS_EN,
  ZLabels,
} from './labels';

@Component({
  imports: [ZPagination],
  template: `<z-pagination [page]="1" [total]="118" [pageSize]="25" itemLabel="Rechnungen" />`,
})
class PagerHost {}

describe('Z_LABELS', () => {
  it('falls back to the German defaults without a provider', () => {
    const labels = TestBed.inject(Z_LABELS);

    expect(labels).toBe(Z_LABELS_DE);
    expect(labels.paginationPrev).toBe('Vorherige Seite');
    expect(labels.paginationRange(1, 25, 118, 'Transaktionen')).toBe(
      '1 bis 25 von 118 Transaktionen',
    );
  });

  it('merges a partial override over the German defaults', () => {
    TestBed.configureTestingModule({
      providers: [provideZenitLabels({ paginationPrev: 'Previous page' })],
    });
    const labels = TestBed.inject(Z_LABELS);

    expect(labels.paginationPrev).toBe('Previous page');
    expect(labels.paginationNext).toBe('Nächste Seite');
    expect(labels.toastClose).toBe('Schließen');
  });

  it('takes the whole English set', () => {
    TestBed.configureTestingModule({ providers: [provideZenitLabels(Z_LABELS_EN)] });
    const labels = TestBed.inject(Z_LABELS);

    expect(labels.paginationNext).toBe('Next page');
    expect(labels.paginationRange(1, 25, 118, 'transactions')).toBe('1 to 25 of 118 transactions');
  });

  it('covers the same keys in German and English', () => {
    // The `satisfies ZLabels` on both constants already rules out a missing or
    // a stray key at compile time; this compares them at runtime as well.
    expect(Object.keys(Z_LABELS_EN).sort()).toEqual(Object.keys(Z_LABELS_DE).sort());
  });

  it('translates every German text instead of copying it', () => {
    const unuebersetzt = (Object.keys(Z_LABELS_DE) as (keyof ZLabels)[]).filter(
      (schluessel) =>
        typeof Z_LABELS_DE[schluessel] === 'string' &&
        Z_LABELS_EN[schluessel] === Z_LABELS_DE[schluessel],
    );

    expect(unuebersetzt).toEqual([]);
  });

  it('merges a nested provider onto the enclosing injector, not onto German', () => {
    TestBed.configureTestingModule({ providers: [provideZenitLabels(Z_LABELS_EN)] });
    const kind = createEnvironmentInjector(
      [provideZenitLabels({ toastClose: 'Dismiss' })],
      TestBed.inject(EnvironmentInjector),
    );
    const enkel = createEnvironmentInjector(
      [provideZenitLabels({ headerMenu: 'Navigation' })],
      kind,
    );

    expect(kind.get(Z_LABELS).toastClose).toBe('Dismiss');
    expect(kind.get(Z_LABELS).paginationNext).toBe('Next page');
    expect(enkel.get(Z_LABELS).headerMenu).toBe('Navigation');
    expect(enkel.get(Z_LABELS).toastClose).toBe('Dismiss');
    expect(enkel.get(Z_LABELS).consoleLog).toBe('Server log');
    // The parent is not touched by its children.
    expect(TestBed.inject(Z_LABELS).toastClose).toBe('Close');
  });

  it('merges a nested provider onto German when the root has no provider', () => {
    const kind = createEnvironmentInjector(
      [provideZenitLabels({ toastClose: 'Dismiss' })],
      TestBed.inject(EnvironmentInjector),
    );

    expect(kind.get(Z_LABELS).toastClose).toBe('Dismiss');
    expect(kind.get(Z_LABELS).paginationNext).toBe('Nächste Seite');
  });
});

describe('injectZLabels', () => {
  it('fills the gaps of a partial useValue with the German defaults', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: Z_LABELS, useValue: { toastClose: 'Close' } as ZLabels }],
    });
    const labels = TestBed.runInInjectionContext(injectZLabels);

    expect(labels.toastClose).toBe('Close');
    expect(labels.paginationPrev).toBe('Vorherige Seite');
    expect(labels.paginationRange(1, 25, 118, 'Rechnungen')).toBe('1 bis 25 von 118 Rechnungen');
  });

  it('keeps a component working under a partial useValue', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: Z_LABELS, useValue: { paginationNext: 'Next page' } as ZLabels }],
    });
    const fixture = TestBed.createComponent(PagerHost);
    fixture.detectChanges();
    const knoepfe = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')];

    expect(knoepfe.map((k) => k.getAttribute('aria-label'))).toEqual([
      'Vorherige Seite',
      'Next page',
    ]);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      '1 bis 25 von 118 Rechnungen',
    );
  });
});
