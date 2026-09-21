import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ZTab, ZTabs } from './tabs';

@Component({
  imports: [ZTabs, ZTab],
  template: `<nav zTabs>
    <a zTab href="#uebersicht" [active]="aktiv() === 0">Übersicht</a>
    <a zTab href="#spieler" [active]="aktiv() === 1">Spieler</a>
    <a zTab href="#welten" [active]="aktiv() === 2">Welten</a>
  </nav>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TabsHost {
  readonly aktiv = signal(0);
}

function tabs(fixture: { nativeElement: HTMLElement }): HTMLAnchorElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('a'));
}

describe('ZTabs', () => {
  it('sets the bar class on the nav and the tab class on every link', () => {
    const fixture = TestBed.createComponent(TabsHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('nav').classList.contains('z-tabs')).toBe(true);
    expect(tabs(fixture).map((tab) => tab.classList.contains('z-tab'))).toEqual([true, true, true]);
  });

  it('marks the active tab with aria-current="page"', () => {
    const fixture = TestBed.createComponent(TabsHost);
    fixture.detectChanges();

    expect(tabs(fixture)[0].getAttribute('aria-current')).toBe('page');
  });

  it('leaves every inactive tab without aria-current', () => {
    const fixture = TestBed.createComponent(TabsHost);
    fixture.detectChanges();
    const [, zweiter, dritter] = tabs(fixture);

    expect(zweiter.hasAttribute('aria-current')).toBe(false);
    expect(dritter.hasAttribute('aria-current')).toBe(false);
  });

  it('moves aria-current when the active tab changes at runtime', () => {
    const fixture = TestBed.createComponent(TabsHost);
    fixture.detectChanges();

    fixture.componentInstance.aktiv.set(2);
    fixture.detectChanges();
    const [erster, zweiter, dritter] = tabs(fixture);

    expect(erster.hasAttribute('aria-current')).toBe(false);
    expect(zweiter.hasAttribute('aria-current')).toBe(false);
    expect(dritter.getAttribute('aria-current')).toBe('page');
  });
});
