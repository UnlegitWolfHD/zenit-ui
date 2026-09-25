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

  it('renders every function key in both languages', () => {
    // Keys that take parameters are exempt from the string comparison below, so
    // they are compared by their result instead.
    expect(Z_LABELS_DE.chartMoney(5.9)).toBe('5,90\u00a0€');
    expect(Z_LABELS_EN.chartMoney(5.9)).toBe('€5.90');
    expect(Z_LABELS_DE.chartAxisMoney(10)).toBe('10\u00a0€');
    expect(Z_LABELS_DE.chartAxisHours(100)).toBe('100\u00a0h');
    expect(Z_LABELS_DE.chartPlayed(50)).toBe('50\u00a0h gespielt');
    expect(Z_LABELS_EN.chartPlayed(50)).toBe('50\u00a0h played');
    // The non-breaking space before a unit is a rule of the system, not of the
    // German language, so the English set keeps it too.
    expect(Z_LABELS_EN.chartAxisHours(100)).toBe('100\u00a0h');
    expect(Z_LABELS_EN.chartCapLabel(100)).toBe('capped from 100\u00a0h');
    expect(Z_LABELS_DE.comboboxResults(1)).toBe('1 Treffer');
    expect(Z_LABELS_DE.comboboxResults(3)).toBe('3 Treffer');
    expect(Z_LABELS_EN.comboboxResults(1)).toBe('1 result');
    expect(Z_LABELS_EN.comboboxResults(3)).toBe('3 results');
    expect(Z_LABELS_DE.comboboxUseCustom('Wiki')).toBe('„Wiki“ übernehmen');
    expect(Z_LABELS_EN.comboboxUseCustom('Wiki')).toBe('Use “Wiki”');
    expect(Z_LABELS_DE.comboboxMinQuery(2)).toBe('Mindestens 2 Zeichen eingeben');
    expect(Z_LABELS_EN.comboboxMinQuery(2)).toBe('Type at least 2 characters');
    expect(Z_LABELS_DE.chartDescOpen(1.5, 0.088)).toContain('ohne Deckel');
    expect(Z_LABELS_EN.chartDescOpen(1.5, 0.088)).toContain('no cap');
    expect(Z_LABELS_DE.chartBaseLabel(1.5)).toBe('1,50\u00a0€ Grundbetrag');
    expect(Z_LABELS_DE.chartCapLabel(100)).toBe('ab 100\u00a0h gedeckelt');
    expect(Z_LABELS_DE.chartTableCapRow(100)).toBe('100 und mehr');
    expect(Z_LABELS_DE.chartDesc(1.5, 0.088, 10.3, 100)).toContain('ab 100 Stunden gedeckelt');
    expect(Z_LABELS_EN.chartDesc(1.5, 0.088, 10.3, 100)).toContain('from 100 hours on');
    // E-61: der Stundenpreis ist ein Einzelpreis, exakt mit zwei oder drei Nachkommastellen.
    expect(Z_LABELS_DE.chartDesc(1.5, 0.045, 10.3, 100)).toContain('plus 0,045\u00a0€ je Stunde');
    expect(Z_LABELS_DE.chartDescOpen(1.5, 0.05)).toContain('plus 0,05\u00a0€ je Stunde');
    expect(Z_LABELS_EN.chartDescOpen(1.5, 0.045)).toContain('plus €0.045 per hour');
  });

  it('holds the new keys of the configurator, in both languages', () => {
    for (const schluessel of [
      'wizardEdit',
      'comboboxEmpty',
      'comboboxResults',
      'comboboxLoading',
      'comboboxUseCustom',
      'comboboxMinQuery',
      'summaryRetry',
      'chartTitle',
      'chartDesc',
      'chartDescOpen',
      'chartPerHour',
      'chartCapPerMonth',
      'chartMoney',
      'chartAxisMoney',
      'chartAxisHours',
      'chartBaseLabel',
      'chartCapLabel',
      'chartPlayed',
      'chartTable',
      'chartTableHours',
      'chartTableCost',
      'chartTableCapRow',
    ] as (keyof ZLabels)[]) {
      expect(Z_LABELS_DE[schluessel]).toBeDefined();
      expect(Z_LABELS_EN[schluessel]).toBeDefined();
    }
  });

  it('holds the names of the slider steppers, in both languages', () => {
    expect(Z_LABELS_DE.sliderDecrease).toBe('Verringern');
    expect(Z_LABELS_DE.sliderIncrease).toBe('Erhöhen');
    expect(Z_LABELS_EN.sliderDecrease).toBe('Decrease');
    expect(Z_LABELS_EN.sliderIncrease).toBe('Increase');
  });

  it('holds the page size label of the pager, in both languages', () => {
    expect(Z_LABELS_DE.paginationPageSize).toBe('Einträge pro Seite');
    expect(Z_LABELS_EN.paginationPageSize).toBe('Items per page');
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
