import { CdkMenuTrigger } from '@angular/cdk/menu';
import { OverlayContainer } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Z_MENU } from './menu';

@Component({
  imports: [CdkMenuTrigger, Z_MENU],
  template: `
    <button [cdkMenuTriggerFor]="menue">Weitere Aktionen</button>
    <ng-template #menue>
      <z-menu>
        <button zMenuItem icon="content_copy" (triggered)="kopiert = kopiert + 1">
          {{ ersterText() }}
        </button>
        <button zMenuItem [disabled]="gesperrt()" (triggered)="geteilt = geteilt + 1">
          Zugriff teilen
        </button>
        <z-menu-separator />
        <button zMenuItem danger icon="delete" (triggered)="geloescht = geloescht + 1">
          Server löschen
        </button>
      </z-menu>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MenuHost {
  readonly gesperrt = signal(true);
  readonly ersterText = signal('Adresse kopieren');
  kopiert = 0;
  geteilt = 0;
  geloescht = 0;
}

/** A menu whose entries lead somewhere: two links and one button. */
@Component({
  imports: [CdkMenuTrigger, Z_MENU],
  template: `
    <button [cdkMenuTriggerFor]="menue">Seiten</button>
    <ng-template #menue>
      <z-menu>
        <a zMenuItem icon="dns" href="#daten" (triggered)="geoeffnet = geoeffnet + 1">
          Server öffnen
        </a>
        <a zMenuItem icon="delete" danger [disabled]="gesperrt()" href="#papierkorb">
          Papierkorb
        </a>
        <button zMenuItem (triggered)="kopiert = kopiert + 1">Adresse kopieren</button>
      </z-menu>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class LinkMenuHost {
  readonly gesperrt = signal(false);
  geoeffnet = 0;
  kopiert = 0;
}

describe('ZMenu', () => {
  let fixture: ComponentFixture<MenuHost>;
  let host: MenuHost;
  let behaelter: OverlayContainer;
  let ausloeser: HTMLButtonElement;

  function menue(): HTMLElement | null {
    return behaelter.getContainerElement().querySelector('z-menu');
  }

  function eintraege(): HTMLButtonElement[] {
    return Array.from(behaelter.getContainerElement().querySelectorAll('button[zMenuItem]'));
  }

  function oeffne(): void {
    ausloeser.click();
    fixture.detectChanges();
  }

  function klicke(eintrag: HTMLButtonElement): void {
    eintrag.click();
    fixture.detectChanges();
  }

  beforeEach(() => {
    fixture = TestBed.createComponent(MenuHost);
    host = fixture.componentInstance;
    behaelter = TestBed.inject(OverlayContainer);
    fixture.detectChanges();
    ausloeser = fixture.nativeElement.querySelector('button');
  });

  afterEach(() => {
    behaelter.ngOnDestroy();
  });

  it('stays closed until the trigger is clicked', () => {
    expect(menue()).toBeNull();

    oeffne();

    expect(menue()).not.toBeNull();
    expect(eintraege()).toHaveLength(3);
  });

  it('closes again on a second click on the trigger', () => {
    oeffne();
    oeffne();

    expect(menue()).toBeNull();
  });

  it('gives the surface the class z-menu and the role menu', () => {
    oeffne();

    expect(menue()?.classList.contains('z-menu')).toBe(true);
    expect(menue()?.getAttribute('role')).toBe('menu');
  });

  it('gives every entry the role menuitem and the class z-menu__item', () => {
    oeffne();

    for (const eintrag of eintraege()) {
      expect(eintrag.getAttribute('role')).toBe('menuitem');
      expect(eintrag.classList.contains('z-menu__item')).toBe(true);
    }
  });

  it('gives the separator the role separator and the class z-menu__sep', () => {
    oeffne();
    const trenner = behaelter.getContainerElement().querySelector('z-menu-separator');

    expect(trenner?.getAttribute('role')).toBe('separator');
    expect(trenner?.classList.contains('z-menu__sep')).toBe(true);
    expect(trenner?.textContent).toBe('');
  });

  it('renders the icon as a z-icon and nothing without an icon', () => {
    oeffne();
    const [kopieren, teilen] = eintraege();

    expect(kopieren.querySelector('z-icon')?.textContent).toBe('content_copy');
    expect(kopieren.firstElementChild?.tagName.toLowerCase()).toBe('z-icon');
    expect(teilen.querySelector('z-icon')).toBeNull();
  });

  it('marks only the danger entry with the danger class', () => {
    oeffne();
    const [kopieren, , loeschen] = eintraege();

    expect(kopieren.classList.contains('z-menu__item--danger')).toBe(false);
    expect(loeschen.classList.contains('z-menu__item--danger')).toBe(true);
  });

  it('marks a disabled entry with aria-disabled and swallows its trigger', () => {
    oeffne();
    const teilen = eintraege()[1];

    expect(teilen.getAttribute('aria-disabled')).toBe('true');

    klicke(teilen);

    expect(host.geteilt).toBe(0);
    expect(menue()).not.toBeNull();
  });

  it('carries no aria-disabled once the entry is enabled again', () => {
    host.gesperrt.set(false);
    fixture.detectChanges();
    oeffne();
    const teilen = eintraege()[1];

    expect(teilen.hasAttribute('aria-disabled')).toBe(false);

    klicke(teilen);

    expect(host.geteilt).toBe(1);
  });

  it('fires triggered on a click and closes the menu', () => {
    oeffne();

    klicke(eintraege()[0]);

    expect(host.kopiert).toBe(1);
    expect(host.geloescht).toBe(0);
    expect(menue()).toBeNull();
  });

  /** A scroll somewhere in the document, heard in the capture phase. */
  function scrolleAn(ziel: EventTarget): void {
    ziel.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
  }

  // The scroll strategy of the CDK builds on ScrollDispatcher, which only hears
  // the window and containers marked cdkScrollable; the menu therefore listens
  // on the document in the capture phase.
  it('closes on a scroll under it and hands the focus back to the trigger', () => {
    oeffne();
    eintraege()[0].focus();

    scrolleAn(document);

    expect(menue()).toBeNull();
    expect(document.activeElement).toBe(ausloeser);
  });

  it('leaves the focus where it is when it was not inside the menu', () => {
    oeffne();
    const feld = document.createElement('input');
    document.body.append(feld);
    feld.focus();

    scrolleAn(document);

    expect(menue()).toBeNull();
    expect(document.activeElement).toBe(feld);
    feld.remove();
  });

  it('stays open when the scroll happens inside the menu itself', () => {
    oeffne();

    scrolleAn(menue()!);

    expect(menue()).not.toBeNull();
  });

  it('listens for scrolling only while it is open', () => {
    const horcher = vi.spyOn(document, 'addEventListener');

    oeffne();
    // ScrollDispatcher of the CDK registers one of its own without options, so
    // the one with the options object is the one of the menu.
    const optionen = horcher.mock.calls
      .map(([typ, , optionen]) => (typ === 'scroll' ? optionen : undefined))
      .find((optionen) => typeof optionen === 'object' && optionen !== null) as
      AddEventListenerOptions | undefined;

    expect(optionen).toMatchObject({ capture: true, passive: true });
    expect(optionen?.signal?.aborted).toBe(false);

    klicke(eintraege()[0]);

    expect(optionen?.signal?.aborted).toBe(true);
  });

  it('keeps the typeahead label free of the icon ligature', async () => {
    oeffne();
    const kopieren = eintraege()[0];

    // Without the own typeaheadLabel the CDK would read the textContent, and
    // that starts with the ligature "content_copy" instead of with "Adresse".
    menue()?.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', keyCode: 65, bubbles: true }));
    await new Promise((fertig) => setTimeout(fertig, 250));

    expect(document.activeElement).toBe(kopieren);
  });

  // The label is read from the DOM, so a text that changes at runtime has to
  // reach the typeahead as well.
  it('follows an entry text that changes at runtime in the typeahead', async () => {
    oeffne();
    host.ersterText.set('Endpunkt kopieren');
    fixture.detectChanges();
    await fixture.whenStable();
    const kopieren = eintraege()[0];

    menue()?.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', keyCode: 69, bubbles: true }));
    await new Promise((fertig) => setTimeout(fertig, 250));

    expect(document.activeElement).toBe(kopieren);
  });
});

describe('ZMenuItem as a link', () => {
  let fixture: ComponentFixture<LinkMenuHost>;
  let host: LinkMenuHost;
  let behaelter: OverlayContainer;
  let ausloeser: HTMLButtonElement;

  function menue(): HTMLElement | null {
    return behaelter.getContainerElement().querySelector('z-menu');
  }

  function links(): HTMLAnchorElement[] {
    return Array.from(behaelter.getContainerElement().querySelectorAll('a[zMenuItem]'));
  }

  function oeffne(): void {
    ausloeser.click();
    fixture.detectChanges();
  }

  /** A key on the entry, the way the browser sends it: bubbling from there. */
  function taste(ziel: HTMLElement, key: string, keyCode: number): void {
    ziel.dispatchEvent(new KeyboardEvent('keydown', { key, keyCode, bubbles: true }));
    fixture.detectChanges();
  }

  beforeEach(() => {
    fixture = TestBed.createComponent(LinkMenuHost);
    host = fixture.componentInstance;
    behaelter = TestBed.inject(OverlayContainer);
    fixture.detectChanges();
    ausloeser = fixture.nativeElement.querySelector('button');
    oeffne();
  });

  afterEach(() => {
    behaelter.ngOnDestroy();
  });

  it('gives a link the same role and class as a button entry', () => {
    const [oeffnen, papierkorb] = links();

    expect(oeffnen.getAttribute('role')).toBe('menuitem');
    expect(oeffnen.classList.contains('z-menu__item')).toBe(true);
    expect(papierkorb.classList.contains('z-menu__item--danger')).toBe(true);
    expect(oeffnen.querySelector('z-icon')?.textContent).toBe('dns');
  });

  it('leaves href alone and writes no type attribute', () => {
    const [oeffnen] = links();

    // _setType() of the CDK only touches a <button>; a type on a link would be
    // the media type of its target.
    expect(oeffnen.hasAttribute('type')).toBe(false);
    expect(oeffnen.getAttribute('href')).toBe('#daten');
  });

  it('fires triggered on a click and closes the menu', () => {
    links()[0].click();
    fixture.detectChanges();

    expect(host.geoeffnet).toBe(1);
    expect(menue()).toBeNull();
  });

  // Space activates an entry in the ARIA menu pattern, but the browser clicks
  // only buttons, so z-menu turns the key into a click on the link.
  it('activates a link with Space, exactly once', () => {
    taste(links()[0], ' ', 32);

    expect(host.geoeffnet).toBe(1);
    expect(menue()).toBeNull();
  });

  it('closes the menu on Enter', () => {
    taste(links()[0], 'Enter', 13);

    expect(host.geoeffnet).toBe(1);
    expect(menue()).toBeNull();
  });

  it('swallows click and Space on a disabled link and keeps the menu', () => {
    host.gesperrt.set(true);
    fixture.detectChanges();
    const papierkorb = links()[1];

    expect(papierkorb.getAttribute('aria-disabled')).toBe('true');
    expect(papierkorb.tabIndex).toBe(-1);

    papierkorb.click();
    taste(papierkorb, ' ', 32);
    fixture.detectChanges();

    expect(menue()).not.toBeNull();
  });

  it('finds a link entry through the typeahead without its icon ligature', async () => {
    const oeffnen = links()[0];

    // Without the own typeaheadLabel the CDK would read "dnsServer öffnen".
    menue()?.dispatchEvent(new KeyboardEvent('keydown', { key: 's', keyCode: 83, bubbles: true }));
    await new Promise((fertig) => setTimeout(fertig, 250));

    expect(document.activeElement).toBe(oeffnen);
  });
});
