import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ZSidebar, ZSidebarGroup, ZSidebarItem } from './sidebar';

@Component({
  imports: [ZSidebar, ZSidebarGroup, ZSidebarItem],
  template: `<z-sidebar [ariaLabel]="bereich()">
    <z-sidebar-group>
      <button type="button" zSidebarItem icon="dashboard" [active]="aktiv() === 0">
        {{ uebersicht() }}
      </button>
      <button type="button" zSidebarItem icon="terminal" [active]="aktiv() === 1">Konsole</button>
    </z-sidebar-group>
    <z-sidebar-group label="Betrieb">
      <button type="button" zSidebarItem [active]="aktiv() === 2" [count]="3">Backups</button>
      @if (mitSpielern()) {
        <button type="button" zSidebarItem>Spieler</button>
      }
    </z-sidebar-group>
  </z-sidebar>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SidebarHost {
  readonly bereich = signal('Serverbereiche');
  readonly aktiv = signal(0);
  readonly uebersicht = signal('Übersicht');
  readonly mitSpielern = signal(false);
}

function eintraege(fixture: { nativeElement: HTMLElement }): HTMLButtonElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('.z-side button'));
}

function select(fixture: { nativeElement: HTMLElement }): HTMLSelectElement {
  return fixture.nativeElement.querySelector('z-select select')!;
}

describe('ZSidebar', () => {
  it('puts ariaLabel on the nav', () => {
    const fixture = TestBed.createComponent(SidebarHost);
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('nav.z-side');

    expect(nav.getAttribute('aria-label')).toBe('Serverbereiche');
  });

  it('renders a group without label without a heading and one with label with it', () => {
    const fixture = TestBed.createComponent(SidebarHost);
    fixture.detectChanges();
    const gruppen = fixture.nativeElement.querySelectorAll('z-sidebar-group.z-side__group');

    expect(gruppen.length).toBe(2);
    expect(gruppen[0].querySelector('.z-side__label')).toBeNull();
    expect(gruppen[1].querySelector('.z-side__label').textContent.trim()).toBe('Betrieb');
  });

  it('renders the icon as z-icon and leaves it out without icon', () => {
    const fixture = TestBed.createComponent(SidebarHost);
    fixture.detectChanges();
    const [uebersicht, , backups] = eintraege(fixture);

    expect(uebersicht.classList.contains('z-side__item')).toBe(true);
    expect(uebersicht.querySelector('z-icon')!.textContent!.trim()).toBe('dashboard');
    expect(backups.querySelector('z-icon')).toBeNull();
  });

  it('marks the active item with aria-current="page" and moves it at runtime', () => {
    const fixture = TestBed.createComponent(SidebarHost);
    fixture.detectChanges();

    expect(eintraege(fixture).map((e) => e.getAttribute('aria-current'))).toEqual([
      'page',
      null,
      null,
    ]);

    fixture.componentInstance.aktiv.set(2);
    fixture.detectChanges();

    expect(eintraege(fixture).map((e) => e.getAttribute('aria-current'))).toEqual([
      null,
      null,
      'page',
    ]);
  });

  it('renders count in the item but keeps it out of the mirrored option label', async () => {
    const fixture = TestBed.createComponent(SidebarHost);
    fixture.detectChanges();
    await fixture.whenStable();

    const backups = eintraege(fixture)[2];

    expect(backups.querySelector('.z-side__count')!.textContent!.trim()).toBe('3');
    expect(select(fixture).options[2].textContent!.trim()).toBe('Backups');
  });

  it('mirrors all items into the select in document order', async () => {
    const fixture = TestBed.createComponent(SidebarHost);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(Array.from(select(fixture).options).map((o) => o.textContent.trim())).toEqual([
      'Übersicht',
      'Konsole',
      'Backups',
    ]);
  });

  it('follows an item label that changes at runtime', async () => {
    const fixture = TestBed.createComponent(SidebarHost);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(select(fixture).options[0].textContent!.trim()).toBe('Übersicht');

    fixture.componentInstance.uebersicht.set('Zusammenfassung');
    fixture.detectChanges();
    // The MutationObserver reports the new text in a microtask, and only the
    // change detection after it carries the label into the option.
    await fixture.whenStable();
    await fixture.whenStable();

    expect(select(fixture).options[0].textContent!.trim()).toBe('Zusammenfassung');
  });

  it('takes an item that appears at runtime into the select', async () => {
    const fixture = TestBed.createComponent(SidebarHost);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(select(fixture).options).toHaveLength(3);

    fixture.componentInstance.mitSpielern.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    await fixture.whenStable();

    expect(Array.from(select(fixture).options).map((o) => o.textContent.trim())).toEqual([
      'Übersicht',
      'Konsole',
      'Backups',
      'Spieler',
    ]);
  });

  it('lets the selected option follow the active item', async () => {
    const fixture = TestBed.createComponent(SidebarHost);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(select(fixture).selectedIndex).toBe(0);

    fixture.componentInstance.aktiv.set(1);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(select(fixture).selectedIndex).toBe(1);
  });

  it('triggers the click of the item when an option is chosen', async () => {
    const fixture = TestBed.createComponent(SidebarHost);
    fixture.detectChanges();
    await fixture.whenStable();

    const konsole = eintraege(fixture)[1];
    let geklickt = 0;
    konsole.addEventListener('click', () => (geklickt += 1));

    const feld = select(fixture);
    feld.selectedIndex = 1;
    feld.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(geklickt).toBe(1);
  });

  it('puts ariaLabel on the select as well', async () => {
    const fixture = TestBed.createComponent(SidebarHost);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(select(fixture).getAttribute('aria-label')).toBe('Serverbereiche');
  });
});
