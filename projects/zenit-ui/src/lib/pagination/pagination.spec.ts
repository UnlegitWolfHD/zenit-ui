import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZenitLabels, Z_LABELS_EN } from '../labels';
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
    ariaLabel="Seiten der Transaktionen"
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

@Component({
  imports: [ZPagination],
  template: `<z-pagination
    [(page)]="seite"
    [(pageSize)]="proSeite"
    [total]="gesamt()"
    [pageSizeOptions]="optionen()"
    itemLabel="Transaktionen"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class GroessenHost {
  readonly seite = signal(1);
  readonly proSeite = signal(25);
  readonly gesamt = signal(118);
  readonly optionen = signal([10, 25, 50]);
}

@Component({
  imports: [ZPagination],
  template: `<z-pagination
    [(page)]="seite"
    [total]="118"
    [pageSizeOptions]="[10, 25]"
    pageSizeLabel="Zeilen je Seite"
    itemLabel="Transaktionen"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class EigeneGroesseHost {
  readonly seite = signal(1);
}

function bereich(fixture: { nativeElement: HTMLElement }): string {
  return fixture.nativeElement.querySelector('.z-pager > span')?.textContent?.trim() ?? '';
}

function auswahl(fixture: { nativeElement: HTMLElement }): HTMLSelectElement | null {
  return fixture.nativeElement.querySelector('.z-pager__size select');
}

function groessen(fixture: { nativeElement: HTMLElement }): string[] {
  return Array.from(auswahl(fixture)?.options ?? [], (option) => option.value);
}

/** Picks a size the way a user does: change the value, fire the native event. */
async function waehle(
  fixture: { nativeElement: HTMLElement; whenStable: () => Promise<unknown> },
  wert: number,
): Promise<void> {
  const select = auswahl(fixture)!;
  select.value = String(wert);
  select.dispatchEvent(new Event('change'));
  await fixture.whenStable();
}

function nav(fixture: { nativeElement: HTMLElement }): HTMLButtonElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('.z-pager__nav button'));
}

describe('ZPagination', () => {
  it('writes the range of the first page', () => {
    const fixture = TestBed.createComponent(PagerHost);
    fixture.detectChanges();

    expect(bereich(fixture)).toBe('1 bis 25 von 118 Transaktionen');
    expect(fixture.nativeElement.querySelector('.z-pager__nav .z-mono').textContent.trim()).toBe(
      '1 / 5',
    );
  });

  it('gives both nav buttons type="button" so a pager inside a form does not submit', () => {
    const fixture = TestBed.createComponent(PagerHost);
    fixture.detectChanges();

    expect(nav(fixture).map((knopf) => knopf.getAttribute('type'))).toEqual(['button', 'button']);
  });

  it('writes the partial range on the last page', async () => {
    const fixture = TestBed.createComponent(PagerHost);
    fixture.componentInstance.seite.set(5);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(bereich(fixture)).toBe('101 bis 118 von 118 Transaktionen');
  });

  it('counts with a different pageSize', () => {
    const fixture = TestBed.createComponent(PagerHost);
    fixture.componentInstance.proSeite.set(50);
    fixture.detectChanges();

    expect(bereich(fixture)).toBe('1 bis 50 von 118 Transaktionen');
    expect(fixture.nativeElement.querySelector('.z-pager__nav .z-mono').textContent.trim()).toBe(
      '1 / 3',
    );
  });

  // Was written against the native `disabled`, which drops the focus of the
  // button that was just used; the lock is aria-disabled now.
  it('locks back on the first page and forward on the last one', async () => {
    const fixture = TestBed.createComponent(PagerHost);
    fixture.detectChanges();
    const [zurueck, weiter] = nav(fixture);

    expect(zurueck.getAttribute('aria-disabled')).toBe('true');
    expect(weiter.getAttribute('aria-disabled')).toBeNull();

    fixture.componentInstance.seite.set(5);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(zurueck.getAttribute('aria-disabled')).toBeNull();
    expect(weiter.getAttribute('aria-disabled')).toBe('true');
  });

  it('keeps the locked arrow focusable and swallows its click', async () => {
    const fixture = TestBed.createComponent(PagerHost);
    fixture.detectChanges();
    const [zurueck, weiter] = nav(fixture);

    expect(zurueck.disabled).toBe(false);
    zurueck.focus();
    zurueck.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.seite()).toBe(1);
    expect(document.activeElement).toBe(zurueck);

    fixture.componentInstance.seite.set(5);
    fixture.detectChanges();
    await fixture.whenStable();
    weiter.focus();
    weiter.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.seite()).toBe(5);
    expect(document.activeElement).toBe(weiter);
  });

  it('wraps the pager in a nav landmark named by the registry or by ariaLabel', () => {
    const fixture = TestBed.createComponent(PagerHost);
    fixture.detectChanges();
    const landmarke: HTMLElement = fixture.nativeElement.querySelector('nav');

    expect(landmarke.getAttribute('aria-label')).toBe('Seitennavigation');
    expect(landmarke.querySelector('.z-pager')).not.toBeNull();

    const eigenes = TestBed.createComponent(EigenerTextHost);
    eigenes.detectChanges();

    expect(eigenes.nativeElement.querySelector('nav').getAttribute('aria-label')).toBe(
      'Seiten der Transaktionen',
    );
  });

  it('announces the page change through the range sentence', () => {
    const fixture = TestBed.createComponent(PagerHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.z-pager > span').getAttribute('aria-live')).toBe(
      'polite',
    );
  });

  it('treats a pageSize below 1 or not a number as 1 in the range as well', () => {
    const fixture = TestBed.createComponent(PagerHost);
    fixture.componentInstance.proSeite.set(0);
    fixture.detectChanges();

    expect(bereich(fixture)).toBe('1 bis 1 von 118 Transaktionen');
    expect(fixture.nativeElement.querySelector('.z-pager__nav .z-mono').textContent.trim()).toBe(
      '1 / 118',
    );

    fixture.componentInstance.proSeite.set(-10);
    fixture.detectChanges();

    expect(bereich(fixture)).toBe('1 bis 1 von 118 Transaktionen');

    fixture.componentInstance.proSeite.set(Number.NaN);
    fixture.detectChanges();

    expect(bereich(fixture)).toBe('1 bis 1 von 118 Transaktionen');
  });

  it('pages on click and reports the page back', async () => {
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

  it('renders nothing when the list is empty', () => {
    const fixture = TestBed.createComponent(PagerHost);
    fixture.componentInstance.gesamt.set(0);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.z-pager')).toBeNull();
  });

  it('renders nothing when everything fits on one page', () => {
    const fixture = TestBed.createComponent(PagerHost);
    fixture.componentInstance.gesamt.set(25);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.z-pager')).toBeNull();

    fixture.componentInstance.gesamt.set(26);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.z-pager')).not.toBeNull();
  });

  it('clamps the page when total shrinks', async () => {
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

  it('takes an own rangeLabel and own aria labels for the buttons', () => {
    const fixture = TestBed.createComponent(EigenerTextHost);
    fixture.detectChanges();
    const [zurueck, weiter] = nav(fixture);

    expect(bereich(fixture)).toBe('Transaktionen 1-25 (118)');
    expect(zurueck.getAttribute('aria-label')).toBe('Eine Seite zurueck');
    expect(weiter.getAttribute('aria-label')).toBe('Eine Seite weiter');
  });

  it('labels the buttons in German when nothing else is given', () => {
    const fixture = TestBed.createComponent(PagerHost);
    fixture.detectChanges();
    const [zurueck, weiter] = nav(fixture);

    expect(zurueck.getAttribute('aria-label')).toBe('Vorherige Seite');
    expect(weiter.getAttribute('aria-label')).toBe('Nächste Seite');
  });

  it('takes its texts from the label registry, and an own input still wins', () => {
    TestBed.configureTestingModule({ providers: [provideZenitLabels(Z_LABELS_EN)] });

    const ausRegistry = TestBed.createComponent(PagerHost);
    ausRegistry.detectChanges();
    const [zurueck, weiter] = nav(ausRegistry);

    expect(bereich(ausRegistry)).toBe('1 to 25 of 118 Transaktionen');
    expect(zurueck.getAttribute('aria-label')).toBe('Previous page');
    expect(weiter.getAttribute('aria-label')).toBe('Next page');

    const mitEingabe = TestBed.createComponent(EigenerTextHost);
    mitEingabe.detectChanges();

    expect(bereich(mitEingabe)).toBe('Transaktionen 1-25 (118)');
    expect(nav(mitEingabe)[0].getAttribute('aria-label')).toBe('Eine Seite zurueck');
  });

  describe('page size selection', () => {
    it('renders the pager exactly as before without pageSizeOptions', () => {
      const fixture = TestBed.createComponent(PagerHost);
      fixture.detectChanges();
      const kinder = Array.from(
        fixture.nativeElement.querySelector('.z-pager').children,
        (kind) => {
          const el = kind as HTMLElement;
          return el.className
            ? `${el.tagName.toLowerCase()}.${el.className}`
            : el.tagName.toLowerCase();
        },
      );

      expect(kinder).toEqual(['span', 'div.z-pager__nav']);
      expect(auswahl(fixture)).toBeNull();
    });

    it('offers the options sorted and de-duplicated', () => {
      const fixture = TestBed.createComponent(GroessenHost);
      fixture.componentInstance.optionen.set([50, 10, 25, 10]);
      fixture.detectChanges();

      expect(groessen(fixture)).toEqual(['10', '25', '50']);
      expect(auswahl(fixture)?.value).toBe('25');
    });

    it('adds a pageSize that is not among the options, so the select never lies', () => {
      const fixture = TestBed.createComponent(GroessenHost);
      fixture.componentInstance.proSeite.set(30);
      fixture.detectChanges();

      expect(groessen(fixture)).toEqual(['10', '25', '30', '50']);
      expect(auswahl(fixture)?.value).toBe('30');
    });

    it('names the select with a visible label of its own, unique per instance', () => {
      const fixture = TestBed.createComponent(GroessenHost);
      fixture.detectChanges();
      const label: HTMLLabelElement = fixture.nativeElement.querySelector('.z-pager__size label');

      expect(label.textContent?.trim()).toBe('Einträge pro Seite');
      expect(label.getAttribute('for')).toBe(auswahl(fixture)?.id);
      expect(auswahl(fixture)?.id).toBeTruthy();

      const zweite = TestBed.createComponent(GroessenHost);
      zweite.detectChanges();

      expect(auswahl(zweite)?.id).not.toBe(auswahl(fixture)?.id);
    });

    it('keeps the first entry of the page in view and writes both models', async () => {
      const fixture = TestBed.createComponent(GroessenHost);
      fixture.componentInstance.seite.set(3);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(bereich(fixture)).toBe('51 bis 75 von 118 Transaktionen');

      // Entry 51 is the first one shown, so it has to stay shown: with 10 per
      // page that is page 6.
      await waehle(fixture, 10);

      expect(fixture.componentInstance.proSeite()).toBe(10);
      expect(fixture.componentInstance.seite()).toBe(6);
      expect(bereich(fixture)).toBe('51 bis 60 von 118 Transaktionen');
    });

    it('clamps the page when a larger size leaves fewer pages', async () => {
      const fixture = TestBed.createComponent(GroessenHost);
      fixture.componentInstance.seite.set(5);
      fixture.detectChanges();
      await fixture.whenStable();

      await waehle(fixture, 50);

      expect(fixture.componentInstance.proSeite()).toBe(50);
      expect(fixture.componentInstance.seite()).toBe(3);
      expect(bereich(fixture)).toBe('101 bis 118 von 118 Transaktionen');
    });

    it('keeps the select while a smaller size would still page, without arrows', () => {
      const fixture = TestBed.createComponent(GroessenHost);
      fixture.componentInstance.gesamt.set(20);
      fixture.detectChanges();

      // 20 entries at 25 per page: nothing to page through, but 10 per page
      // would, so the way back to the smaller size stays open.
      expect(fixture.nativeElement.querySelector('.z-pager__nav')).toBeNull();
      expect(bereich(fixture)).toBe('');
      expect(auswahl(fixture)).not.toBeNull();
    });

    it('renders nothing while even the smallest option fits on one page', () => {
      const fixture = TestBed.createComponent(GroessenHost);
      fixture.componentInstance.gesamt.set(10);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.z-pager')).toBeNull();
    });

    it('labels the select in German and takes an own pageSizeLabel', () => {
      const ausRegistry = TestBed.createComponent(GroessenHost);
      ausRegistry.detectChanges();
      const eigenes = TestBed.createComponent(EigeneGroesseHost);
      eigenes.detectChanges();

      expect(
        ausRegistry.nativeElement.querySelector('.z-pager__size label').textContent.trim(),
      ).toBe('Einträge pro Seite');
      expect(eigenes.nativeElement.querySelector('.z-pager__size label').textContent.trim()).toBe(
        'Zeilen je Seite',
      );
    });

    it('takes the label from the registry, and pageSizeLabel still wins', () => {
      TestBed.configureTestingModule({ providers: [provideZenitLabels(Z_LABELS_EN)] });

      const ausRegistry = TestBed.createComponent(GroessenHost);
      ausRegistry.detectChanges();
      const mitEingabe = TestBed.createComponent(EigeneGroesseHost);
      mitEingabe.detectChanges();

      expect(
        ausRegistry.nativeElement.querySelector('.z-pager__size label').textContent.trim(),
      ).toBe('Items per page');
      expect(
        mitEingabe.nativeElement.querySelector('.z-pager__size label').textContent.trim(),
      ).toBe('Zeilen je Seite');
    });
  });
});
