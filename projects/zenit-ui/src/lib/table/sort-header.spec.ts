import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ZNum, ZSort, ZTable } from './table';
import { ZSortHeader } from './sort-header';

@Component({
  imports: [ZNum, ZSortHeader, ZTable],
  template: `<table zTable [(sort)]="sortierung">
    <thead>
      <tr>
        <th zSortHeader="name">Name</th>
        <th zNum zSortHeader="groesse" sortStart="desc">Größe</th>
        <th zSortHeader="typ" disabled>Typ</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>server.jar</td>
        <td zNum>61,25 MB</td>
        <td>Datei</td>
      </tr>
    </tbody>
  </table>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SortHost {
  readonly sortierung = signal<ZSort | null>(null);
}

function kopf(fixture: ComponentFixture<unknown>, schluessel: string): HTMLTableCellElement {
  return fixture.nativeElement.querySelector(`th[zSortHeader="${schluessel}"]`);
}

function knopf(fixture: ComponentFixture<unknown>, schluessel: string): HTMLButtonElement {
  return kopf(fixture, schluessel).querySelector('button')!;
}

function pfeil(fixture: ComponentFixture<unknown>, schluessel: string): string | null {
  return kopf(fixture, schluessel).querySelector('z-icon')?.textContent?.trim() ?? null;
}

describe('ZSortHeader', () => {
  function aufbauen(): ComponentFixture<SortHost> {
    const fixture = TestBed.createComponent(SortHost);
    fixture.detectChanges();
    return fixture;
  }

  it('renders the header text inside a real button with the sort class', () => {
    const fixture = aufbauen();

    expect(knopf(fixture, 'name').type).toBe('button');
    expect(knopf(fixture, 'name').classList).toContain('z-table__sort');
    // The header text is the accessible name; no aria-label and no title.
    expect(knopf(fixture, 'name').textContent?.trim()).toBe('Name');
    expect(knopf(fixture, 'name').getAttribute('aria-label')).toBeNull();
    expect(knopf(fixture, 'name').getAttribute('title')).toBeNull();
  });

  it('cycles start, opposite, none and reports it through [(sort)]', async () => {
    const fixture = aufbauen();

    knopf(fixture, 'name').click();
    await fixture.whenStable();

    expect(fixture.componentInstance.sortierung()).toEqual({ key: 'name', direction: 'asc' });

    knopf(fixture, 'name').click();
    await fixture.whenStable();

    expect(fixture.componentInstance.sortierung()).toEqual({ key: 'name', direction: 'desc' });

    knopf(fixture, 'name').click();
    await fixture.whenStable();

    expect(fixture.componentInstance.sortierung()).toBeNull();
  });

  it('starts in the direction of sortStart', async () => {
    const fixture = aufbauen();

    knopf(fixture, 'groesse').click();
    await fixture.whenStable();

    expect(fixture.componentInstance.sortierung()).toEqual({ key: 'groesse', direction: 'desc' });

    knopf(fixture, 'groesse').click();
    await fixture.whenStable();

    expect(fixture.componentInstance.sortierung()).toEqual({ key: 'groesse', direction: 'asc' });
  });

  it('writes aria-sort on the sorted column and none on the others', async () => {
    const fixture = aufbauen();

    expect(kopf(fixture, 'name').getAttribute('aria-sort')).toBe('none');
    expect(kopf(fixture, 'groesse').getAttribute('aria-sort')).toBe('none');

    knopf(fixture, 'name').click();
    await fixture.whenStable();

    expect(kopf(fixture, 'name').getAttribute('aria-sort')).toBe('ascending');
    expect(kopf(fixture, 'groesse').getAttribute('aria-sort')).toBe('none');

    knopf(fixture, 'name').click();
    await fixture.whenStable();

    expect(kopf(fixture, 'name').getAttribute('aria-sort')).toBe('descending');
  });

  it('sorts by one column only: a second header takes the state over', async () => {
    const fixture = aufbauen();

    knopf(fixture, 'name').click();
    await fixture.whenStable();
    knopf(fixture, 'groesse').click();
    await fixture.whenStable();

    expect(fixture.componentInstance.sortierung()).toEqual({ key: 'groesse', direction: 'desc' });
    expect(kopf(fixture, 'name').getAttribute('aria-sort')).toBe('none');
    expect(kopf(fixture, 'groesse').getAttribute('aria-sort')).toBe('descending');
  });

  it('follows a sort set from outside', async () => {
    const fixture = aufbauen();
    fixture.componentInstance.sortierung.set({ key: 'name', direction: 'desc' });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(kopf(fixture, 'name').getAttribute('aria-sort')).toBe('descending');
    expect(pfeil(fixture, 'name')).toBe('arrow_downward');
  });

  it('shows the arrow only on the sorted column', async () => {
    const fixture = aufbauen();

    expect(pfeil(fixture, 'name')).toBeNull();
    expect(pfeil(fixture, 'groesse')).toBeNull();

    knopf(fixture, 'name').click();
    await fixture.whenStable();

    expect(pfeil(fixture, 'name')).toBe('arrow_upward');
    expect(pfeil(fixture, 'groesse')).toBeNull();

    knopf(fixture, 'name').click();
    await fixture.whenStable();

    expect(pfeil(fixture, 'name')).toBe('arrow_downward');
  });

  it('keeps [zNum] on the header cell, so the button follows the right edge', () => {
    const fixture = aufbauen();

    expect(kopf(fixture, 'groesse').classList).toContain('z-table__num');
    expect(kopf(fixture, 'name').classList).not.toContain('z-table__num');
  });

  it('takes a disabled column out of the sorting', async () => {
    const fixture = aufbauen();

    expect(knopf(fixture, 'typ').disabled).toBe(true);
    expect(kopf(fixture, 'typ').getAttribute('aria-sort')).toBeNull();

    knopf(fixture, 'typ').click();
    await fixture.whenStable();

    expect(fixture.componentInstance.sortierung()).toBeNull();
    expect(pfeil(fixture, 'typ')).toBeNull();
  });
});
