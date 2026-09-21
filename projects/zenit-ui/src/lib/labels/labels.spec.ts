import { TestBed } from '@angular/core/testing';
import { provideZenitLabels, Z_LABELS, Z_LABELS_DE, Z_LABELS_EN, ZLabels } from './labels';

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
});
