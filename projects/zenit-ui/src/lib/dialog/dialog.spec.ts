import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { OverlayContainer } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ZConfirmConfig } from './confirm-dialog';
import { ZDialog } from './dialog';
import { ZDialogActions, ZDialogLayout } from './dialog-layout';

@Component({
  imports: [ZDialogActions, ZDialogLayout],
  template: `<z-dialog title="Server umbenennen">
    <span>Der neue Name gilt sofort.</span>
    <ng-container zDialogActions>
      <button type="button" (click)="ref.close('zenit-01')">Speichern</button>
    </ng-container>
  </z-dialog>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class UmbenennenDialog {
  readonly ref = inject<DialogRef<string, UmbenennenDialog>>(DialogRef);
}

describe('ZDialog', () => {
  let dienst: ZDialog;
  let behaelter: OverlayContainer;
  let ergebnisse: boolean[];
  let abgeschlossen: number;

  function wurzel(): HTMLElement {
    return behaelter.getContainerElement();
  }

  function container(): HTMLElement | null {
    return wurzel().querySelector('cdk-dialog-container');
  }

  function backdrop(): HTMLElement | null {
    return wurzel().querySelector('.cdk-overlay-backdrop');
  }

  function pane(): HTMLElement | null {
    return wurzel().querySelector('.cdk-overlay-pane');
  }

  function fussButtons(): HTMLButtonElement[] {
    return Array.from(wurzel().querySelectorAll('.z-dialog__footer button'));
  }

  function eingabe(): HTMLInputElement | null {
    return wurzel().querySelector('.z-dialog__body input');
  }

  /** Opens a confirmation and collects its one value plus the completion. */
  function bestaetige(config: Partial<ZConfirmConfig> = {}): void {
    dienst
      .confirm({
        title: 'Server "Test" löschen?',
        body: 'Welt, Konfiguration und alle 3 Backups werden sofort gelöscht.',
        confirmLabel: 'Server löschen',
        cancelLabel: 'Abbrechen',
        ...config,
      })
      .subscribe({
        next: (wert) => ergebnisse.push(wert),
        complete: () => (abgeschlossen += 1),
      });
    TestBed.tick();
  }

  function klicke(element: HTMLElement | null): void {
    element?.click();
    TestBed.tick();
  }

  function tippe(text: string): void {
    const feld = eingabe() as HTMLInputElement;
    feld.value = text;
    feld.dispatchEvent(new Event('input'));
    TestBed.tick();
  }

  beforeEach(() => {
    dienst = TestBed.inject(ZDialog);
    behaelter = TestBed.inject(OverlayContainer);
    ergebnisse = [];
    abgeschlossen = 0;
  });

  afterEach(() => {
    TestBed.inject(Dialog).closeAll();
    behaelter.ngOnDestroy();
  });

  describe('confirm', () => {
    it('emits true exactly once on confirm and completes', () => {
      bestaetige();

      klicke(fussButtons()[1]);

      expect(ergebnisse).toEqual([true]);
      expect(abgeschlossen).toBe(1);
      expect(container()).toBeNull();
    });

    it('emits false on cancel', () => {
      bestaetige();

      klicke(fussButtons()[0]);

      expect(ergebnisse).toEqual([false]);
      expect(abgeschlossen).toBe(1);
      expect(container()).toBeNull();
    });

    it('emits false on Escape', () => {
      bestaetige();

      container()?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }),
      );
      TestBed.tick();

      expect(ergebnisse).toEqual([false]);
      expect(abgeschlossen).toBe(1);
      expect(container()).toBeNull();
    });

    it('emits false on a click on the backdrop', () => {
      bestaetige();

      klicke(backdrop());

      expect(ergebnisse).toEqual([false]);
      expect(abgeschlossen).toBe(1);
      expect(container()).toBeNull();
    });

    it('puts cancel as a ghost button before the confirm button', () => {
      bestaetige();
      const [abbrechen, loeschen] = fussButtons();

      expect(abbrechen.textContent?.trim()).toBe('Abbrechen');
      expect(abbrechen.classList.contains('z-btn--ghost')).toBe(true);
      expect(loeschen.textContent?.trim()).toBe('Server löschen');
      expect(abbrechen.compareDocumentPosition(loeschen)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it('uses primary for the confirm button without danger', () => {
      bestaetige();
      const loeschen = fussButtons()[1];

      expect(loeschen.classList.contains('z-btn--primary')).toBe(true);
      expect(loeschen.classList.contains('z-btn--danger')).toBe(false);
    });

    it('uses danger for the confirm button with danger', () => {
      bestaetige({ danger: true });
      const loeschen = fussButtons()[1];

      expect(loeschen.classList.contains('z-btn--danger')).toBe(true);
      expect(loeschen.classList.contains('z-btn--primary')).toBe(false);
    });

    it('shows no input without requireText', () => {
      bestaetige();

      expect(eingabe()).toBeNull();
      expect(fussButtons()[1].hasAttribute('disabled')).toBe(false);
    });

    it('keeps confirm locked until the required text matches exactly', () => {
      bestaetige({ requireText: 'Test' });

      expect(fussButtons()[1].hasAttribute('disabled')).toBe(true);

      tippe('Tes');
      expect(fussButtons()[1].hasAttribute('disabled')).toBe(true);

      tippe('test');
      expect(fussButtons()[1].hasAttribute('disabled')).toBe(true);

      tippe('Test');
      expect(fussButtons()[1].hasAttribute('disabled')).toBe(false);

      tippe('Test ');
      expect(fussButtons()[1].hasAttribute('disabled')).toBe(true);
    });

    it('emits true only after the required text has been typed', () => {
      bestaetige({ requireText: 'Test' });

      tippe('Test');
      klicke(fussButtons()[1]);

      expect(ergebnisse).toEqual([true]);
    });

    it('shows requireLabel as a visible label connected to the input', () => {
      bestaetige({
        requireText: 'Test',
        requireLabel: 'Gib zur Bestätigung den Servernamen ein',
      });
      const label = wurzel().querySelector('.z-field__label') as HTMLLabelElement;

      expect(label.textContent?.trim()).toBe('Gib zur Bestätigung den Servernamen ein');
      expect(label.getAttribute('for')).toBe(eingabe()?.id);
      expect(eingabe()?.hasAttribute('aria-label')).toBe(false);
    });

    it('names the input with requireText when no label is given', () => {
      bestaetige({ requireText: 'Test' });

      expect(wurzel().querySelector('.z-field__label')).toBeNull();
      expect(eingabe()?.getAttribute('aria-label')).toBe('Test');
      expect(eingabe()?.getAttribute('placeholder')).toBe('Test');
    });

    it('marks the container as a modal dialog named by the h2', () => {
      bestaetige();
      const titel = wurzel().querySelector('h2.z-dialog__title') as HTMLElement;

      expect(container()?.getAttribute('role')).toBe('dialog');
      expect(container()?.getAttribute('aria-modal')).toBe('true');
      expect(titel.id).toBeTruthy();
      expect(container()?.getAttribute('aria-labelledby')).toBe(titel.id);
    });

    it('puts the own classes on panel and backdrop', () => {
      bestaetige();

      expect(pane()?.classList.contains('z-dialog-panel')).toBe(true);
      expect(backdrop()?.classList.contains('z-backdrop')).toBe(true);
    });
  });

  describe('open', () => {
    it('opens an own component and returns the DialogRef of the CDK', () => {
      const ref = dienst.open<string, unknown, UmbenennenDialog>(UmbenennenDialog);
      TestBed.tick();

      expect(ref).toBeInstanceOf(DialogRef);
      expect(ref.componentInstance).toBeInstanceOf(UmbenennenDialog);
      expect(wurzel().querySelector('.z-dialog__title')?.textContent?.trim()).toBe(
        'Server umbenennen',
      );
      expect(wurzel().querySelector('.z-dialog__body')?.textContent?.trim()).toBe(
        'Der neue Name gilt sofort.',
      );
      expect(fussButtons().map((button) => button.textContent?.trim())).toEqual(['Speichern']);
    });

    it('carries the value from close through to closed', () => {
      const ref = dienst.open<string, unknown, UmbenennenDialog>(UmbenennenDialog);
      TestBed.tick();
      const werte: (string | undefined)[] = [];
      let fertig = 0;
      ref.closed.subscribe({ next: (wert) => werte.push(wert), complete: () => (fertig += 1) });

      klicke(fussButtons()[0]);

      expect(werte).toEqual(['zenit-01']);
      expect(fertig).toBe(1);
      expect(container()).toBeNull();
    });

    it('names the container after the h2 of the own component as well', () => {
      dienst.open(UmbenennenDialog);
      TestBed.tick();
      const titel = wurzel().querySelector('h2.z-dialog__title') as HTMLElement;

      expect(container()?.getAttribute('aria-modal')).toBe('true');
      expect(container()?.getAttribute('aria-labelledby')).toBe(titel.id);
    });

    it('appends the classes of the caller after the own ones', () => {
      dienst.open(UmbenennenDialog, {
        panelClass: 'eng',
        backdropClass: ['dunkel', 'weich'],
      });
      TestBed.tick();

      const panelKlassen = Array.from(pane()?.classList ?? []);
      const backdropKlassen = Array.from(backdrop()?.classList ?? []);

      // The own class stays in front, the ones of the caller follow.
      expect(panelKlassen.filter((klasse) => klasse !== 'cdk-overlay-pane')).toEqual([
        'z-dialog-panel',
        'eng',
      ]);
      expect(backdropKlassen.filter((klasse) => klasse.startsWith('cdk-') === false)).toEqual([
        'z-backdrop',
        'dunkel',
        'weich',
      ]);
    });

    it('keeps an ariaLabelledBy of the caller instead of the generated id', () => {
      dienst.open(UmbenennenDialog, { ariaLabelledBy: 'eigene-ueberschrift' });
      TestBed.tick();

      expect(container()?.getAttribute('aria-labelledby')).toBe('eigene-ueberschrift');
    });
  });
});
