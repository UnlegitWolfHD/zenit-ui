import { OverlayContainer } from '@angular/cdk/overlay';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZenitTheme, ZTheme } from 'zenit-ui';
import { ThemeControl } from './theme-control';

describe('ThemeControl', () => {
  let fixture: ComponentFixture<ThemeControl>;
  let theme: ZTheme;
  let behaelter: OverlayContainer;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeControl],
      // Same configuration as the application, so the test switches what the
      // page switches.
      providers: [provideZenitTheme({ defaultScheme: 'system' })],
    }).compileComponents();

    theme = TestBed.inject(ZTheme);
    behaelter = TestBed.inject(OverlayContainer);
    fixture = TestBed.createComponent(ThemeControl);
    await fixture.whenStable();
  });

  afterEach(() => {
    theme.reset();
    behaelter.ngOnDestroy();
  });

  function ausloeser(index: number): HTMLButtonElement {
    return (fixture.nativeElement as HTMLElement).querySelectorAll('button')[index];
  }

  async function eintragKlicken(name: string): Promise<void> {
    const eintraege = Array.from(
      behaelter.getContainerElement().querySelectorAll<HTMLButtonElement>('button[zMenuItem]'),
    );
    // The text of an entry starts with the ligature of its icon, so it is
    // searched for, not compared.
    const eintrag = eintraege.find((e) => (e.textContent ?? '').includes(name));
    expect(eintrag, `Menüeintrag "${name}"`).toBeTruthy();
    eintrag?.click();
    await fixture.whenStable();
  }

  it('nennt im Auslöser das aktuelle Schema', () => {
    expect(ausloeser(0).getAttribute('aria-label')).toBe('Farbschema wählen, aktuell System');
    expect(ausloeser(1).getAttribute('aria-label')).toBe('Akzentfarbe wählen, aktuell Rot');
  });

  it('setzt das Schema und schreibt es an das Dokument', async () => {
    ausloeser(0).click();
    await fixture.whenStable();
    await eintragKlicken('Hell');

    expect(theme.scheme()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(ausloeser(0).getAttribute('aria-label')).toBe('Farbschema wählen, aktuell Hell');
  });

  it('setzt den Akzent', async () => {
    ausloeser(1).click();
    await fixture.whenStable();
    await eintragKlicken('Blau');

    expect(theme.accent()).toBe('blau');
    expect(document.documentElement.getAttribute('data-accent')).toBe('blau');
  });

  it('markiert die aktuelle Wahl im Menü', async () => {
    ausloeser(0).click();
    await fixture.whenStable();

    const aktuell = behaelter
      .getContainerElement()
      .querySelector('button[zMenuItem][aria-current="true"]');
    expect(aktuell?.textContent).toContain('System');
  });
});
