import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ZConfig, ZConfigAside } from './config';
import { ZIncludedList } from './included-list';
import { ZStickyBar } from './sticky-bar';

@Component({
  imports: [ZStickyBar],
  template: `<z-sticky-bar price="7,74 €" [summary]="kurz()" [mobileOnly]="nurMobil()">
    <button type="button">Weiter</button>
  </z-sticky-bar>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class LeisteHost {
  readonly kurz = signal('Minecraft, 4 GB, alle 30 Tage');
  readonly nurMobil = signal(true);
}

@Component({
  imports: [ZConfig, ZConfigAside, ZIncludedList],
  template: `<z-config>
    <div class="formular">Wizard</div>
    <div zConfigAside><z-included-list [items]="punkte" /></div>
  </z-config>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class LayoutHost {
  readonly punkte = ['DDoS-Schutz auf Layer 3/4', 'Automatische Backups'];
}

describe('ZStickyBar', () => {
  it('shows price and summary and projects the button next to them', () => {
    const fixture = TestBed.createComponent(LeisteHost);
    fixture.detectChanges();
    const leiste: HTMLElement = fixture.nativeElement.querySelector('z-sticky-bar');
    const preis = leiste.querySelector('.z-stickybar__price') as HTMLElement;

    expect(leiste.classList.contains('z-stickybar')).toBe(true);
    expect(preis.textContent).toContain('7,74 €');
    expect(preis.querySelector('small')?.textContent?.trim()).toBe('Minecraft, 4 GB, alle 30 Tage');
    expect(preis.nextElementSibling?.textContent?.trim()).toBe('Weiter');
  });

  it('carries z-stickybar--mobile only while mobileOnly holds', () => {
    const fixture = TestBed.createComponent(LeisteHost);
    fixture.detectChanges();
    const leiste: HTMLElement = fixture.nativeElement.querySelector('z-sticky-bar');

    expect(leiste.classList.contains('z-stickybar--mobile')).toBe(true);

    fixture.componentInstance.nurMobil.set(false);
    fixture.detectChanges();

    expect(leiste.classList.contains('z-stickybar--mobile')).toBe(false);
  });

  it('leaves the summary out when it is empty', () => {
    const fixture = TestBed.createComponent(LeisteHost);
    fixture.detectChanges();

    fixture.componentInstance.kurz.set('');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.z-stickybar__price small')).toBeNull();
  });
});

describe('ZConfig', () => {
  it('lays the form and the aside out side by side', () => {
    const fixture = TestBed.createComponent(LayoutHost);
    fixture.detectChanges();
    const layout: HTMLElement = fixture.nativeElement.querySelector('z-config');

    expect(layout.classList.contains('z-config')).toBe(true);
    expect(layout.querySelector('.formular')).not.toBeNull();
    expect(layout.querySelector('.z-config__aside')).not.toBeNull();
  });
});

describe('ZIncludedList', () => {
  it('renders one line per entry, each with a decorative check', () => {
    const fixture = TestBed.createComponent(LayoutHost);
    fixture.detectChanges();
    const liste: HTMLElement = fixture.nativeElement.querySelector('ul.z-included');
    const zeilen = Array.from(liste.querySelectorAll('li'));

    expect(zeilen).toHaveLength(2);
    expect(zeilen[0].textContent).toContain('DDoS-Schutz auf Layer 3/4');
    const haken = zeilen[0].querySelector('z-icon') as HTMLElement;
    expect(haken.textContent?.trim()).toBe('check');
    expect(haken.getAttribute('aria-hidden')).toBe('true');
    expect(haken.classList.contains('z-icon--sm')).toBe(true);
  });
});
