import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZenitLabels, Z_LABELS_EN } from '../labels';
import { ZNum, ZTable, ZTableContainer, ZTableName } from './table';

/**
 * jsdom has no layout and no ResizeObserver, so both come from the test: the
 * wrapper is told how wide it and its content are, and the fake observer hands
 * back the callback so a resize can be replayed.
 */
let letzterRuf: (() => void) | undefined;

class FakeResizeObserver {
  readonly beobachtet: Element[] = [];
  constructor(ruf: () => void) {
    letzterRuf = ruf;
  }
  observe(ziel: Element): void {
    this.beobachtet.push(ziel);
  }
  disconnect(): void {
    this.beobachtet.length = 0;
  }
}

function messwerte(el: HTMLElement, scrollWidth: number, clientWidth: number): void {
  Object.defineProperty(el, 'scrollWidth', { value: scrollWidth, configurable: true });
  Object.defineProperty(el, 'clientWidth', { value: clientWidth, configurable: true });
}

function huelle(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.nativeElement.querySelector('z-table-container');
}

@Component({
  imports: [ZNum, ZTable, ZTableContainer, ZTableName],
  template: `<z-table-container>
    <table zTable>
      <thead>
        <tr>
          <th>Name</th>
          <th zNum>Größe</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td zTableName>server.properties</td>
          <td zNum>1,2 kB</td>
        </tr>
      </tbody>
    </table>
  </z-table-container>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TableHost {}

@Component({
  imports: [ZTableContainer],
  template: `<z-table-container ariaLabel="Rechnungen, seitlich scrollbar" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class EigenesLabelHost {}

describe('ZTable', () => {
  /** Renders the host with a wrapper that is too narrow for its content, or not. */
  function mitUeberlauf<T>(typ: new () => T, ueberlauf: boolean): ComponentFixture<T> {
    const fixture = TestBed.createComponent(typ);
    messwerte(huelle(fixture), ueberlauf ? 900 : 640, 640);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    letzterRuf = undefined;
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('makes the container a scrollable region reachable by tab while it overflows', () => {
    const fixture = mitUeberlauf(TableHost, true);

    expect(huelle(fixture).classList).toContain('z-table-wrap');
    expect(huelle(fixture).getAttribute('role')).toBe('region');
    expect(huelle(fixture).getAttribute('tabindex')).toBe('0');
    expect(huelle(fixture).getAttribute('aria-label')).toBe('Tabelle, seitlich scrollbar');
  });

  // Was written against a static role and tabindex, which made every table on
  // a wide screen a tab stop that scrolls nothing.
  it('is no tab stop and no region while everything fits', () => {
    const fixture = mitUeberlauf(TableHost, false);

    expect(huelle(fixture).classList).toContain('z-table-wrap');
    expect(huelle(fixture).getAttribute('role')).toBeNull();
    expect(huelle(fixture).getAttribute('tabindex')).toBeNull();
    expect(huelle(fixture).getAttribute('aria-label')).toBeNull();
  });

  it('follows a resize of the wrapper through the ResizeObserver', () => {
    const fixture = mitUeberlauf(TableHost, false);

    expect(huelle(fixture).getAttribute('role')).toBeNull();

    messwerte(huelle(fixture), 900, 375);
    letzterRuf?.();
    fixture.detectChanges();

    expect(huelle(fixture).getAttribute('role')).toBe('region');
    expect(huelle(fixture).getAttribute('tabindex')).toBe('0');
  });

  it('works without a ResizeObserver', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const fixture = mitUeberlauf(TableHost, true);

    expect(huelle(fixture).getAttribute('role')).toBe('region');
  });

  it('takes an own aria-label for the container', () => {
    const fixture = mitUeberlauf(EigenesLabelHost, true);

    expect(huelle(fixture).getAttribute('aria-label')).toBe('Rechnungen, seitlich scrollbar');
  });

  it('takes its aria-label from the label registry, and an own input still wins', () => {
    TestBed.configureTestingModule({ providers: [provideZenitLabels(Z_LABELS_EN)] });

    const ausRegistry = mitUeberlauf(TableHost, true);
    const mitEingabe = mitUeberlauf(EigenesLabelHost, true);

    expect(huelle(ausRegistry).getAttribute('aria-label')).toBe('Table, scrollable horizontally');
    expect(huelle(mitEingabe).getAttribute('aria-label')).toBe('Rechnungen, seitlich scrollbar');
  });

  it('gives table[zTable] the table class', () => {
    const fixture = TestBed.createComponent(TableHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('table[zTable]').classList).toContain('z-table');
  });

  it('gives [zNum] the number class in head and body', () => {
    const fixture = TestBed.createComponent(TableHost);
    fixture.detectChanges();
    const zahlen = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('[zNum]'));

    expect(zahlen.length).toBe(2);
    expect(zahlen.every((zelle) => zelle.classList.contains('z-table__num'))).toBe(true);
  });

  it('gives [zTableName] the name class', () => {
    const fixture = TestBed.createComponent(TableHost);
    fixture.detectChanges();
    const name = fixture.nativeElement.querySelector('[zTableName]');

    expect(name.classList).toContain('z-table__name');
    expect(name.textContent.trim()).toBe('server.properties');
  });
});
