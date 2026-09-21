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

  it('gives a scrolling body without a control a tab stop of its own', async () => {
    laengerAlsDerKasten();
    const fixture = TestBed.createComponent(OhneAktionenHost);
    fixture.detectChanges();
    await fixture.whenStable();

    // WCAG 2.1.1: the long text of a confirmation has to be readable without a
    // mouse, and nothing inside it takes the focus.
    expect(fixture.nativeElement.querySelector('.z-dialog__body').getAttribute('tabindex')).toBe(
      '0',
    );
  });

  it('leaves a scrolling body with a control alone', async () => {
    laengerAlsDerKasten();
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
