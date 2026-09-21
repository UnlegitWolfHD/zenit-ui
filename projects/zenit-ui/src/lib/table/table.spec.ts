import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ZNum, ZTable, ZTableContainer, ZTableName } from './table';

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
  it('makes the container a scrollable region reachable by tab', () => {
    const fixture = TestBed.createComponent(TableHost);
    fixture.detectChanges();
    const huelle = fixture.nativeElement.querySelector('z-table-container');

    expect(huelle.classList).toContain('z-table-wrap');
    expect(huelle.getAttribute('role')).toBe('region');
    expect(huelle.getAttribute('tabindex')).toBe('0');
    expect(huelle.getAttribute('aria-label')).toBe('Tabelle, seitlich scrollbar');
  });

  it('takes an own aria-label for the container', () => {
    const fixture = TestBed.createComponent(EigenesLabelHost);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('z-table-container').getAttribute('aria-label'),
    ).toBe('Rechnungen, seitlich scrollbar');
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
