import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ZPriceLine, ZPriceSummary } from './price-summary';

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
