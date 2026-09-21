import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ZPriceLine, ZPriceSummary, ZPriceTotal } from './price-summary';

@Component({
  imports: [ZPriceSummary],
  template: `<z-price-summary
    [label]="label()"
    [price]="preis()"
    [period]="zeitraum()"
    [lines]="posten()"
    [note]="note()"
  >
    <button type="button">Server erstellen</button>
  </z-price-summary>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SummaryHost {
  readonly label = signal('Valheim, monatlich');
  readonly preis = signal('5,40 €');
  readonly zeitraum = signal('/ Monat');
  readonly note = signal('');
  readonly posten = signal<ZPriceLine[]>([
    { label: 'Arbeitsspeicher', value: '6 GB' },
    { label: 'Speicher', value: '30 GB NVMe' },
  ]);
}

describe('ZPriceSummary', () => {
  function baue(): { aside: HTMLElement; host: SummaryHost; rendere: () => void } {
    const fixture = TestBed.createComponent(SummaryHost);
    fixture.detectChanges();
    return {
      aside: fixture.nativeElement.querySelector('aside.z-summary'),
      host: fixture.componentInstance,
      rendere: () => fixture.detectChanges(),
    };
  }

  it('names the complementary landmark after the label', () => {
    const { aside, host, rendere } = baue();

    expect(aside.getAttribute('aria-label')).toBe('Valheim, monatlich');
    expect(aside.querySelector('.z-summary__label')?.textContent?.trim()).toBe(
      'Valheim, monatlich',
    );

    host.label.set('');
    rendere();

    expect(aside.hasAttribute('aria-label')).toBe(false);
    expect(aside.querySelector('.z-summary__label')).toBeNull();
  });

  it('shows price and period together', () => {
    const { aside } = baue();
    const preis = aside.querySelector('.z-summary__price') as HTMLElement;

    expect(preis.textContent?.replace(/\s+/g, ' ').trim()).toBe('5,40 € / Monat');
    expect(preis.querySelector('small')?.textContent?.trim()).toBe('/ Monat');
  });

  it('renders every line as a dt/dd pair', () => {
    const { aside } = baue();
    const zeilen = Array.from(aside.querySelectorAll('.z-summary__lines .z-summary__line'));

    expect(aside.querySelector('.z-summary__lines')?.tagName).toBe('DL');
    expect(
      zeilen.map((zeile) => [
        zeile.querySelector('dt')?.textContent?.trim(),
        zeile.querySelector('dd')?.textContent?.trim(),
      ]),
    ).toEqual([
      ['Arbeitsspeicher', '6 GB'],
      ['Speicher', '30 GB NVMe'],
    ]);
  });

  it('shows the note only when it is set', () => {
    const { aside, host, rendere } = baue();

    expect(aside.querySelector('.z-summary__note')).toBeNull();

    host.note.set('Nach Stunden abgerechnet, jederzeit kündbar.');
    rendere();

    expect(aside.querySelector('.z-summary__note')?.textContent?.trim()).toBe(
      'Nach Stunden abgerechnet, jederzeit kündbar.',
    );
  });

  it('projects the button between the lines and the note', () => {
    const { aside, host, rendere } = baue();
    host.note.set('Jederzeit kündbar.');
    rendere();
    const button = aside.querySelector('button') as HTMLElement;

    expect(button.textContent?.trim()).toBe('Server erstellen');
    expect(button.previousElementSibling?.classList.contains('z-summary__lines')).toBe(true);
    expect(button.nextElementSibling?.classList.contains('z-summary__note')).toBe(true);
  });
});

@Component({
  imports: [ZPriceSummary],
  template: `<z-price-summary
    label="Minecraft, alle 180 Tage"
    price="41,49 €"
    [lines]="posten()"
    [total]="summe()"
    [loading]="laedt()"
    [error]="fehler()"
    [retryLabel]="erneut()"
    [note]="note()"
    [legalNote]="steuer()"
    (retry)="nochmal.set(nochmal() + 1)"
  >
    <button type="button" [disabled]="!!fehler()">Kostenpflichtig bestellen</button>
  </z-price-summary>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ZustandsHost {
  readonly laedt = signal(false);
  readonly fehler = signal('');
  readonly erneut = signal('');
  readonly note = signal('');
  readonly steuer = signal('');
  readonly nochmal = signal(0);
  readonly summe = signal<ZPriceTotal | null>(null);
  readonly posten = signal<ZPriceLine[]>([
    { label: 'Laufzeit 180 Tage', value: '46,44 €' },
    { label: 'Laufzeitrabatt', value: '−4,18 €', discount: true },
  ]);
}

describe('ZPriceSummary: Zustände', () => {
  function baue(): { aside: HTMLElement; host: ZustandsHost; rendere: () => void } {
    const fixture = TestBed.createComponent(ZustandsHost);
    fixture.detectChanges();
    return {
      aside: fixture.nativeElement.querySelector('aside.z-summary'),
      host: fixture.componentInstance,
      rendere: () => fixture.detectChanges(),
    };
  }

  it('keeps the last number while it loads, with a spinner and aria-busy', () => {
    const { aside, host, rendere } = baue();
    const preis = aside.querySelector('.z-summary__price') as HTMLElement;

    expect(preis.classList.contains('z-summary__price--pending')).toBe(false);
    expect(preis.hasAttribute('aria-busy')).toBe(false);

    host.laedt.set(true);
    rendere();

    // Never a dash: the number stays and only its colour changes.
    expect(preis.textContent).toContain('41,49 €');
    expect(preis.classList.contains('z-summary__price--pending')).toBe(true);
    expect(preis.getAttribute('aria-busy')).toBe('true');
    expect(preis.querySelector('z-spinner')).not.toBeNull();
  });

  it('announces the price politely, and stays silent while it loads', () => {
    const { aside, host, rendere } = baue();
    const preis = aside.querySelector('.z-summary__price') as HTMLElement;

    // The region exists before the first change, which is what makes a later
    // change announce itself at all.
    expect(preis.getAttribute('aria-live')).toBe('polite');
    expect(preis.getAttribute('aria-atomic')).toBe('true');

    host.laedt.set(true);
    rendere();

    // aria-busy holds the announcement back until the amount is confirmed.
    expect(preis.getAttribute('aria-busy')).toBe('true');
  });

  it('shows a danger alert with the retry button when the price fails', () => {
    const { aside, host, rendere } = baue();

    expect(aside.querySelector('z-alert')).toBeNull();

    host.fehler.set('Der Preis konnte nicht berechnet werden. Versuche es erneut.');
    rendere();
    const alert = aside.querySelector('z-alert') as HTMLElement;
    const knopf = alert.querySelector('button') as HTMLButtonElement;

    expect(alert.classList.contains('z-alert--danger')).toBe(true);
    expect(alert.textContent).toContain('Der Preis konnte nicht berechnet werden.');
    expect(knopf.textContent?.trim()).toBe('Erneut versuchen');
    expect(knopf.classList.contains('z-btn--secondary')).toBe(true);
    expect(knopf.classList.contains('z-btn--sm')).toBe(true);
    // The caller locks its own button; the summary never does it for them.
    expect(
      (aside.querySelector('.z-summary__lines + z-alert + button') as HTMLButtonElement).disabled,
    ).toBe(true);

    knopf.click();
    rendere();

    expect(host.nochmal()).toBe(1);
  });

  it('takes an own caption for the retry button', () => {
    const { aside, host, rendere } = baue();
    host.fehler.set('Fehlgeschlagen.');
    host.erneut.set('Nochmal rechnen');
    rendere();

    expect(aside.querySelector('z-alert button')?.textContent?.trim()).toBe('Nochmal rechnen');
  });

  it('marks a deduction as a discount line', () => {
    const { aside } = baue();
    const zeilen = Array.from(aside.querySelectorAll('.z-summary__line'));

    expect(zeilen[0].classList.contains('z-summary__discount')).toBe(false);
    expect(zeilen[1].classList.contains('z-summary__discount')).toBe(true);
    expect(zeilen[1].querySelector('dd')?.textContent?.trim()).toBe('−4,18 €');
  });

  it('puts the total under the items, inside the same list', () => {
    const { aside, host, rendere } = baue();

    expect(aside.querySelector('.z-summary__total')).toBeNull();

    host.summe.set({ label: 'Summe', value: '41,49 €' });
    rendere();
    const summe = aside.querySelector('.z-summary__total') as HTMLElement;

    expect(summe.parentElement?.classList.contains('z-summary__lines')).toBe(true);
    expect(summe.previousElementSibling?.classList.contains('z-summary__line')).toBe(true);
    expect(summe.querySelector('dt')?.textContent?.trim()).toBe('Summe');
    expect(summe.querySelector('dd')?.textContent?.trim()).toBe('41,49 €');
  });

  it('puts the tax note last, after the note', () => {
    const { aside, host, rendere } = baue();
    host.note.set('Wähle noch eine Bezahlmethode');
    host.steuer.set('Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.');
    rendere();
    const notizen = Array.from(aside.querySelectorAll('.z-summary__note'));

    expect(notizen.map((notiz) => notiz.textContent?.trim())).toEqual([
      'Wähle noch eine Bezahlmethode',
      'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.',
    ]);
  });
});
