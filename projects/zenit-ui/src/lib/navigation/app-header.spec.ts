import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Z_LABELS, Z_LABELS_EN } from '../labels';
import { ZAppHeader, ZBrand, ZHeaderEnd, ZHeaderLink } from './app-header';

@Component({
  imports: [ZAppHeader, ZBrand, ZHeaderEnd, ZHeaderLink],
  template: `<z-app-header [navLabel]="navLabel()" [open]="offen()" (openChange)="melde($event)">
    <span zBrand>Zenit</span>
    <a zHeaderLink href="#server" [active]="aktiv() === 0">Server</a>
    <a zHeaderLink href="#rechnungen" [active]="aktiv() === 1">Rechnungen</a>
    <button type="button">Konto</button>
    <button zHeaderEnd type="button">Guthaben</button>
  </z-app-header>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HeaderHost {
  readonly navLabel = signal('Hauptnavigation');
  readonly aktiv = signal(0);
  readonly offen = signal(false);
  /** Every value openChange has emitted, oldest first. */
  readonly gemeldet: boolean[] = [];

  melde(wert: boolean): void {
    this.gemeldet.push(wert);
    this.offen.set(wert);
  }
}

@Component({
  imports: [ZAppHeader],
  template: `<z-app-header [(open)]="offen" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ZweiwegHost {
  readonly offen = signal(false);
}

@Component({
  imports: [ZAppHeader],
  template: `<z-app-header menuLabel="Bereiche zeigen" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class EigenesMenuHost {}

@Component({
  imports: [ZAppHeader],
  template: `<z-app-header /><z-app-header menuLabel="Bereiche zeigen" />`,
  providers: [{ provide: Z_LABELS, useValue: Z_LABELS_EN }],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class RegistryHost {}

@Component({
  imports: [ZAppHeader],
  template: `<z-app-header /><z-app-header />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ZweiHeaderHost {}

@Component({
  imports: [ZAppHeader],
  template: `<z-app-header [landmark]="false" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class VorschauHost {}

function menueKnopf(fixture: { nativeElement: HTMLElement }): HTMLButtonElement {
  return fixture.nativeElement.querySelector('button.z-header__menu')!;
}

/** Escape as it arrives from inside the header: from the focused element upwards. */
function escape(el: Element): void {
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }));
}

describe('ZAppHeader', () => {
  it('puts navLabel on the nav as aria-label', () => {
    const fixture = TestBed.createComponent(HeaderHost);
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('nav.z-header__nav');

    expect(nav.getAttribute('aria-label')).toBe('Hauptnavigation');
  });

  it('marks the active header link with aria-current="page" and moves it at runtime', () => {
    const fixture = TestBed.createComponent(HeaderHost);
    fixture.detectChanges();
    const links = (): HTMLAnchorElement[] =>
      Array.from(fixture.nativeElement.querySelectorAll('a.z-header__link'));

    expect(links().map((a) => a.getAttribute('aria-current'))).toEqual(['page', null]);

    fixture.componentInstance.aktiv.set(1);
    fixture.detectChanges();

    expect(links().map((a) => a.getAttribute('aria-current'))).toEqual([null, 'page']);
  });

  it('gives [zBrand] the brand class', () => {
    const fixture = TestBed.createComponent(HeaderHost);
    fixture.detectChanges();
    const marke = fixture.nativeElement.querySelector('[zBrand]');

    expect(marke.classList.contains('z-header__brand')).toBe(true);
    expect(marke.textContent.trim()).toBe('Zenit');
  });

  it('projects [zHeaderEnd] outside the nav into the end slot', () => {
    const fixture = TestBed.createComponent(HeaderHost);
    fixture.detectChanges();
    const ende = fixture.nativeElement.querySelector('[zHeaderEnd]');

    expect(ende.closest('.z-header__end')).not.toBeNull();
    expect(ende.closest('nav')).toBeNull();
  });

  it('points the menu button at the nav and starts collapsed', () => {
    const fixture = TestBed.createComponent(HeaderHost);
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('nav.z-header__nav');

    expect(menueKnopf(fixture).getAttribute('aria-expanded')).toBe('false');
    expect(menueKnopf(fixture).getAttribute('aria-controls')).toBe(nav.id);
    expect(nav.id).toBeTruthy();
  });

  it('toggles aria-expanded and the open class on click', () => {
    const fixture = TestBed.createComponent(HeaderHost);
    fixture.detectChanges();
    const kopf = fixture.nativeElement.querySelector('z-app-header');

    menueKnopf(fixture).click();
    fixture.detectChanges();

    expect(menueKnopf(fixture).getAttribute('aria-expanded')).toBe('true');
    expect(kopf.classList.contains('z-header--open')).toBe(true);

    menueKnopf(fixture).click();
    fixture.detectChanges();

    expect(menueKnopf(fixture).getAttribute('aria-expanded')).toBe('false');
    expect(kopf.classList.contains('z-header--open')).toBe(false);
  });

  it('closes when a projected link is clicked and reports the new state', () => {
    const fixture = TestBed.createComponent(HeaderHost);
    fixture.detectChanges();
    const kopf = fixture.nativeElement.querySelector('z-app-header');

    menueKnopf(fixture).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.gemeldet).toEqual([true]);

    fixture.nativeElement.querySelector('a[href="#rechnungen"]').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.gemeldet).toEqual([true, false]);
    expect(fixture.componentInstance.offen()).toBe(false);
    expect(menueKnopf(fixture).getAttribute('aria-expanded')).toBe('false');
    expect(kopf.classList.contains('z-header--open')).toBe(false);
  });

  it('stays open when a button inside the nav is clicked', () => {
    const fixture = TestBed.createComponent(HeaderHost);
    fixture.detectChanges();

    menueKnopf(fixture).click();
    fixture.detectChanges();

    const konto: HTMLButtonElement = fixture.nativeElement.querySelector('nav button');
    konto.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.gemeldet).toEqual([true]);
    expect(menueKnopf(fixture).getAttribute('aria-expanded')).toBe('true');
  });

  it('opens from outside through [(open)]', () => {
    const fixture = TestBed.createComponent(ZweiwegHost);
    fixture.detectChanges();
    const kopf = fixture.nativeElement.querySelector('z-app-header');

    fixture.componentInstance.offen.set(true);
    fixture.detectChanges();

    expect(menueKnopf(fixture).getAttribute('aria-expanded')).toBe('true');
    expect(kopf.classList.contains('z-header--open')).toBe(true);

    menueKnopf(fixture).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.offen()).toBe(false);
  });

  it('closes on Escape from inside the header and returns the focus to the menu button', () => {
    const fixture = TestBed.createComponent(HeaderHost);
    fixture.detectChanges();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a[href="#server"]');

    escape(link);
    fixture.detectChanges();
    expect(fixture.componentInstance.gemeldet).toEqual([]);
    expect(document.activeElement).not.toBe(menueKnopf(fixture));

    menueKnopf(fixture).click();
    fixture.detectChanges();
    link.focus();

    escape(link);
    fixture.detectChanges();

    expect(fixture.componentInstance.offen()).toBe(false);
    expect(menueKnopf(fixture).getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(menueKnopf(fixture));
  });

  it('labels the menu button "Menü" by default', () => {
    const fixture = TestBed.createComponent(HeaderHost);
    fixture.detectChanges();

    expect(menueKnopf(fixture).getAttribute('aria-label')).toBe('Menü');
  });

  it('takes the menu label from the registry, and an own menuLabel still wins', () => {
    const fixture = TestBed.createComponent(RegistryHost);
    fixture.detectChanges();
    const [ausRegistry, mitEingabe] = Array.from<HTMLElement>(
      fixture.nativeElement.querySelectorAll('button.z-header__menu'),
    );

    expect(ausRegistry.getAttribute('aria-label')).toBe('Menu');
    expect(mitEingabe.getAttribute('aria-label')).toBe('Bereiche zeigen');
  });

  it('takes an own menuLabel', () => {
    const fixture = TestBed.createComponent(EigenesMenuHost);
    fixture.detectChanges();

    expect(menueKnopf(fixture).getAttribute('aria-label')).toBe('Bereiche zeigen');
  });

  it('is the banner landmark, and none with [landmark]="false"', () => {
    const fixture = TestBed.createComponent(HeaderHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('z-app-header').getAttribute('role')).toBe('banner');

    const vorschau = TestBed.createComponent(VorschauHost);
    vorschau.detectChanges();

    expect(vorschau.nativeElement.querySelector('z-app-header').hasAttribute('role')).toBe(false);
  });

  it('gives two headers on one page distinct nav ids', () => {
    const fixture = TestBed.createComponent(ZweiHeaderHost);
    fixture.detectChanges();
    const [erste, zweite] = Array.from<HTMLElement>(
      fixture.nativeElement.querySelectorAll('nav.z-header__nav'),
    );
    const knoepfe = Array.from<HTMLButtonElement>(
      fixture.nativeElement.querySelectorAll('button.z-header__menu'),
    );

    expect(erste.id).not.toBe(zweite.id);
    expect(knoepfe[0].getAttribute('aria-controls')).toBe(erste.id);
    expect(knoepfe[1].getAttribute('aria-controls')).toBe(zweite.id);
  });
});
