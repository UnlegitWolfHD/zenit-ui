import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ZSpecItem, ZSpecList } from './spec-list';

@Component({
  imports: [ZSpecList],
  template: `<z-spec-list [items]="eintraege()" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SpecHost {
  readonly eintraege = signal<ZSpecItem[]>([
    { term: 'Standort', value: 'Nürnberg, Deutschland', note: 'DSGVO-konform' },
    { term: 'Prozessor', value: 'AMD Ryzen 9 5950X', mono: true },
    { term: 'Abrechnung', value: 'Nach Stunden, monatlich gedeckelt' },
  ]);
}

describe('ZSpecList', () => {
  function baue(): { liste: HTMLElement; host: SpecHost; rendere: () => void } {
    const fixture = TestBed.createComponent(SpecHost);
    fixture.detectChanges();
    return {
      liste: fixture.nativeElement.querySelector('dl.z-spec'),
      host: fixture.componentInstance,
      rendere: () => fixture.detectChanges(),
    };
  }

  it('renders a dl with one dt and one dd per item', () => {
    const { liste } = baue();

    expect(liste.tagName).toBe('DL');
    expect(Array.from(liste.querySelectorAll('dt')).map((dt) => dt.textContent?.trim())).toEqual([
      'Standort',
      'Prozessor',
      'Abrechnung',
    ]);
    expect(liste.querySelectorAll('dd')).toHaveLength(3);
  });

  it('keeps every dd next to its dt', () => {
    const { liste } = baue();
    const kinder = Array.from(liste.children).map((kind) => kind.tagName);

    expect(kinder).toEqual(['DT', 'DD', 'DT', 'DD', 'DT', 'DD']);
  });

  it('wraps the value in the mono class only for mono items', () => {
    const { liste } = baue();
    const werte = Array.from(liste.querySelectorAll('dd'));

    expect(werte[0].querySelector('.z-mono')).toBeNull();
    expect(werte[0].textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Nürnberg, Deutschland DSGVO-konform',
    );
    expect(werte[1].querySelector('.z-mono')?.textContent?.trim()).toBe('AMD Ryzen 9 5950X');
  });

  it('renders the note as a small element and leaves it out when absent', () => {
    const { liste } = baue();
    const werte = Array.from(liste.querySelectorAll('dd'));

    expect(werte[0].querySelector('small')?.textContent?.trim()).toBe('DSGVO-konform');
    expect(werte[1].querySelector('small')).toBeNull();
    expect(werte[2].querySelector('small')).toBeNull();
  });

  it('renders an empty dl without items', () => {
    const { liste, host, rendere } = baue();
    host.eintraege.set([]);
    rendere();

    expect(liste.querySelectorAll('dt')).toHaveLength(0);
    expect(liste.querySelectorAll('dd')).toHaveLength(0);
  });
});
