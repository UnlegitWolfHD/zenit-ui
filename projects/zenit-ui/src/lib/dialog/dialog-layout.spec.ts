import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Z_DIALOG_TITLE_ID, ZDialogActions, ZDialogLayout } from './dialog-layout';

@Component({
  imports: [ZDialogActions, ZDialogLayout],
  template: `<z-dialog [title]="titel()">
    <span>Welt, Konfiguration und alle 3 Backups werden sofort gelöscht.</span>
    <ng-container zDialogActions>
      <button type="button">Abbrechen</button>
      <button type="button">Server löschen</button>
    </ng-container>
  </z-dialog>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class LayoutHost {
  readonly titel = signal('Server "Test" löschen?');
}

@Component({
  imports: [ZDialogLayout],
  template: `<z-dialog title="Server umbenennen"
    ><span>Der neue Name gilt sofort.</span></z-dialog
  >`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class OhneAktionenHost {}

@Component({
  imports: [ZDialogLayout],
  template: `<z-dialog title="Server umbenennen"><input id="neuer-name" /></z-dialog>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MitFeldHost {}

@Component({
  imports: [ZDialogLayout],
  template: `<z-dialog title="Server umbenennen" />`,
  providers: [{ provide: Z_DIALOG_TITLE_ID, useValue: 'z-dialog-title-von-aussen' }],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FremdeIdHost {}

describe('ZDialogLayout', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function baue(): { dialog: HTMLElement; host: LayoutHost; rendere: () => void } {
    const fixture = TestBed.createComponent(LayoutHost);
    fixture.detectChanges();
    return {
      dialog: fixture.nativeElement.querySelector('z-dialog'),
      host: fixture.componentInstance,
      rendere: () => fixture.detectChanges(),
    };
  }

  it('builds header, body and footer in the order of the preview', () => {
    const { dialog } = baue();

    expect(dialog.className).toBe('z-dialog');
    expect(Array.from(dialog.children).map((kind) => kind.className)).toEqual([
      'z-dialog__header',
      'z-dialog__body',
      'z-dialog__footer',
    ]);
  });

  it('puts the title into the h2 of the header', () => {
    const { dialog, host, rendere } = baue();
    const titel = dialog.querySelector('.z-dialog__header h2') as HTMLElement;

    expect(titel.classList.contains('z-dialog__title')).toBe(true);
    expect(titel.textContent?.trim()).toBe('Server "Test" löschen?');

    host.titel.set('Server umbenennen');
    rendere();

    expect(titel.textContent?.trim()).toBe('Server umbenennen');
  });

  it('carries no native title attribute on the host', () => {
    const { dialog } = baue();

    expect(dialog.hasAttribute('title')).toBe(false);
  });

  it('projects the content into the body and the actions into the footer', () => {
    const { dialog } = baue();

    expect(dialog.querySelector('.z-dialog__body')?.textContent?.trim()).toBe(
      'Welt, Konfiguration und alle 3 Backups werden sofort gelöscht.',
    );
    expect(
      Array.from(dialog.querySelectorAll('.z-dialog__footer button')).map((button) =>
        button.textContent?.trim(),
      ),
    ).toEqual(['Abbrechen', 'Server löschen']);
  });

  it('leaves the footer out entirely without a zDialogActions child', () => {
    const fixture = TestBed.createComponent(OhneAktionenHost);
    fixture.detectChanges();
    const dialog: HTMLElement = fixture.nativeElement.querySelector('z-dialog');

    // Documented behaviour: the footer hangs off contentChild(ZDialogActions),
    // so a dialog without actions has header and body only.
    expect(dialog.querySelector('.z-dialog__footer')).toBeNull();
    expect(Array.from(dialog.children).map((kind) => kind.className)).toEqual([
      'z-dialog__header',
      'z-dialog__body',
    ]);
  });

  it('gives the h2 a running id when nobody provides one', () => {
    const erste = TestBed.createComponent(LayoutHost);
    erste.detectChanges();
    const zweite = TestBed.createComponent(LayoutHost);
    zweite.detectChanges();
    const id = (titel: HTMLElement) => titel.querySelector('.z-dialog__title')?.id;

    expect(id(erste.nativeElement)).toMatch(/^z-dialog-title-\d+$/);
    expect(id(zweite.nativeElement)).not.toBe(id(erste.nativeElement));
  });

  /**
   * jsdom lays nothing out, so the one measurement the component makes is
   * faked: a body taller than its box scrolls.
   */
  function laengerAlsDerKasten(): void {
    vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockReturnValue(400);
    vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(200);
  }

  /**
   * `InteractivityChecker` asks for geometry, which jsdom has none of. Here it
   * comes from the computed style instead, so `display: none` and `hidden`
   * still count as invisible.
   */
  function sichtbarMachen(): void {
    // jsdom does not inherit `display: none` down the tree, so the ancestors are
    // asked as well, the way a browser would.
    const sichtbar = (element: Element): boolean => {
      for (let el: Element | null = element; el; el = el.parentElement) {
        if (getComputedStyle(el).display === 'none' || (el as HTMLElement).hidden) {
          return false;
        }
      }
      return true;
    };
    vi.spyOn(Element.prototype, 'getClientRects').mockImplementation(function (
      this: Element,
    ): DOMRectList {
      return (sichtbar(this) ? [{ width: 10, height: 10 }] : []) as unknown as DOMRectList;
    });
  }

  /** The check is coalesced into one animation frame; this waits for it. */
  function naechsterRahmen(): Promise<void> {
    return new Promise((fertig) => requestAnimationFrame(() => fertig()));
  }

  /**
   * A scrolling body with the given markup in it. The markup lands in the body
   * after the first check, so the observers have to answer for it.
   */
  async function rumpfMit(
    markup: string,
  ): Promise<{ rumpf: HTMLElement; rendere: () => Promise<void> }> {
    laengerAlsDerKasten();
    sichtbarMachen();
    const fixture = TestBed.createComponent(OhneAktionenHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const rumpf: HTMLElement = fixture.nativeElement.querySelector('.z-dialog__body');
    const rendere = async (): Promise<void> => {
      await naechsterRahmen();
      fixture.detectChanges();
    };
    rumpf.insertAdjacentHTML('beforeend', markup);
    await rendere();
    return { rumpf, rendere };
  }

  /**
   * None of these is a tab stop, so the body has to become one. Every row is a
   * way an application really switches a control off; the disabled `a[zBtn]`
   * of this library renders exactly the second one.
   */
  const OHNE_TABSTOPP = [
    ['button with tabindex -1', '<button tabindex="-1">Mehr</button>'],
    ['link with tabindex -1', '<a href="/x" tabindex="-1">Mehr</a>'],
    ['hidden button', '<button hidden>Mehr</button>'],
    ['button in display none', '<div style="display: none"><button>Mehr</button></div>'],
    ['button in visibility hidden', '<div style="visibility: hidden"><button>Mehr</button></div>'],
    ['button in an inert subtree', '<div inert><button>Mehr</button></div>'],
    ['input in a disabled fieldset', '<fieldset disabled><input /></fieldset>'],
    ['hidden input', '<input type="hidden" />'],
    ['disabled input', '<input disabled />'],
  ] as const;

  for (const [name, markup] of OHNE_TABSTOPP) {
    it(`gives the tab stop although the body holds a ${name}`, async () => {
      const { rumpf } = await rumpfMit(markup);

      expect(rumpf.getAttribute('tabindex')).toBe('0');
    });
  }

  // The controls in the first legend of a disabled fieldset stay operable, so
  // one of them is a tab stop and the body needs none.
  it('leaves the body alone for a control in the legend of a disabled fieldset', async () => {
    const { rumpf } = await rumpfMit(
      '<fieldset disabled><legend><button>Mehr</button></legend><input /></fieldset>',
    );

    expect(rumpf.hasAttribute('tabindex')).toBe(false);
  });

  it('leaves the body alone as soon as one real tab stop is in it', async () => {
    const { rumpf } = await rumpfMit('<button tabindex="-1">Mehr</button><input />');

    expect(rumpf.hasAttribute('tabindex')).toBe(false);
  });

  // Every check reads scrollHeight and forces a layout, so a log that appends
  // three thousand lines may not cost three thousand of them.
  it('checks once per frame, not once per mutation', async () => {
    const { rumpf } = await rumpfMit('');
    const messungen = vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockReturnValue(400);

    for (let zeile = 0; zeile < 50; zeile++) {
      rumpf.insertAdjacentHTML('beforeend', '<p>Zeile</p>');
    }
    await naechsterRahmen();

    // Fifty lines, a handful of layout reads: one per frame plus what the
    // rendering of the answer costs, never one per line.
    expect(messungen.mock.calls.length).toBeLessThanOrEqual(3);
  });

  // Taking the tabindex away while the focus stands on it would drop the focus
  // onto <body>, outside the focus trap of the dialog.
  it('keeps the tab stop while the focus stands on it', async () => {
    const { rumpf, rendere } = await rumpfMit('');
    rumpf.focus();
    expect(document.activeElement).toBe(rumpf);

    // The content shrinks below the box: without the focus the stop would go.
    vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockReturnValue(100);
    rumpf.insertAdjacentHTML('beforeend', '<p>weniger</p>');
    await rendere();

    expect(rumpf.getAttribute('tabindex')).toBe('0');
    expect(document.activeElement).toBe(rumpf);

    rumpf.blur();
    await rendere();

    expect(rumpf.hasAttribute('tabindex')).toBe(false);
  });

  it('gives a scrolling body without a control a tab stop of its own', async () => {
    laengerAlsDerKasten();
    sichtbarMachen();
    const fixture = TestBed.createComponent(OhneAktionenHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const rumpf: HTMLElement = fixture.nativeElement.querySelector('.z-dialog__body');

    // WCAG 2.1.1: the long text of a confirmation has to be readable without a
    // mouse, and nothing inside it takes the focus.
    expect(rumpf.getAttribute('tabindex')).toBe('0');
    // A stop on the way to the actions says what it is and what it belongs to.
    expect(rumpf.getAttribute('role')).toBe('group');
    expect(rumpf.getAttribute('aria-labelledby')).toBe(
      fixture.nativeElement.querySelector('.z-dialog__title').id,
    );
  });

  // The content of a dialog changes while it stands: a log grows, a field
  // appears. The answer to "does Tab reach the body?" changes with it.
  it('gives the tab stop later when the content grows into a scroller', async () => {
    sichtbarMachen();
    const fixture = TestBed.createComponent(OhneAktionenHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const rumpf: HTMLElement = fixture.nativeElement.querySelector('.z-dialog__body');

    expect(rumpf.hasAttribute('tabindex')).toBe(false);

    laengerAlsDerKasten();
    rumpf.append(document.createElement('p'));
    await naechsterRahmen();
    fixture.detectChanges();

    expect(rumpf.getAttribute('tabindex')).toBe('0');
  });

  it('leaves a scrolling body with a control alone', async () => {
    laengerAlsDerKasten();
    sichtbarMachen();
    const fixture = TestBed.createComponent(MitFeldHost);
    fixture.detectChanges();
    await fixture.whenStable();

    // Tab reaches the field, and the browser scrolls it into view.
    expect(fixture.nativeElement.querySelector('.z-dialog__body').hasAttribute('tabindex')).toBe(
      false,
    );
  });

  it('leaves a body that does not scroll alone', async () => {
    const fixture = TestBed.createComponent(OhneAktionenHost);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.z-dialog__body').hasAttribute('tabindex')).toBe(
      false,
    );
  });

  it('takes the id of the h2 from Z_DIALOG_TITLE_ID when it is provided', () => {
    const fixture = TestBed.createComponent(FremdeIdHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.z-dialog__title').id).toBe(
      'z-dialog-title-von-aussen',
    );
  });
});
