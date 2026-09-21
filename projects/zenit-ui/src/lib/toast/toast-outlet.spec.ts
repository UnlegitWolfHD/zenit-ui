import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ZToast } from './toast';
import { ZToastOutlet } from './toast-outlet';

@Component({
  imports: [ZToastOutlet],
  template: `<z-toast-outlet />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class OutletHost {}

@Component({
  imports: [ZToastOutlet],
  template: `<z-toast-outlet closeLabel="Meldung schließen" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class EigenesLabelHost {}

describe('ZToastOutlet', () => {
  let fixture: ComponentFixture<OutletHost>;
  let dienst: ZToast;

  /** Zeigt die Toasts des Service an und rendert sie. */
  function zeige(aufruf: () => void): void {
    aufruf();
    fixture.detectChanges();
  }

  function toasts(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.z-toast'));
  }

  beforeEach(() => {
    fixture = TestBed.createComponent(OutletHost);
    dienst = TestBed.inject(ZToast);
    fixture.detectChanges();
  });

  it('haengt die Klasse z-toast-outlet an den Host und bleibt ohne Toast leer', () => {
    const outlet = fixture.nativeElement.querySelector('z-toast-outlet');

    expect(outlet.classList.contains('z-toast-outlet')).toBe(true);
    expect(toasts()).toHaveLength(0);
  });

  it('rendert einen neutralen Toast mit role status und ohne Modifier', () => {
    zeige(() => dienst.show('Adresse kopiert'));
    const toast = toasts()[0];

    expect(toast.classList.contains('z-toast')).toBe(true);
    expect(toast.classList.contains('z-toast--success')).toBe(false);
    expect(toast.classList.contains('z-toast--danger')).toBe(false);
    expect(toast.getAttribute('role')).toBe('status');
    expect(toast.textContent).toContain('Adresse kopiert');
  });

  it('rendert success mit z-toast--success und role status', () => {
    zeige(() => dienst.success('Eigenschaften gespeichert'));
    const toast = toasts()[0];

    expect(toast.classList.contains('z-toast--success')).toBe(true);
    expect(toast.classList.contains('z-toast--danger')).toBe(false);
    expect(toast.getAttribute('role')).toBe('status');
  });

  it('rendert einen Fehler mit z-toast--danger und role alert', () => {
    zeige(() => dienst.error('Backup fehlgeschlagen: Speicher voll'));
    const toast = toasts()[0];

    expect(toast.classList.contains('z-toast--danger')).toBe(true);
    expect(toast.classList.contains('z-toast--success')).toBe(false);
    expect(toast.getAttribute('role')).toBe('alert');
  });

  it('zeigt das Icon aus icon und ohne icon keines', () => {
    zeige(() => dienst.show('Adresse kopiert', { icon: 'content_copy' }));
    const icon = toasts()[0].querySelector(':scope > z-icon');

    expect(icon?.textContent?.trim()).toBe('content_copy');

    zeige(() => dienst.dismiss());
    zeige(() => dienst.show('Adresse kopiert'));

    expect(toasts()[0].querySelector(':scope > z-icon')).toBeNull();
  });

  it('zeigt die Aktion als Button mit actionLabel und ohne actionLabel keinen', () => {
    zeige(() => dienst.show('Eigenschaften gespeichert', { actionLabel: 'Rückgängig' }));

    expect(toasts()[0].querySelector('.z-toast__action')?.textContent?.trim()).toBe('Rückgängig');

    zeige(() => dienst.dismiss());
    zeige(() => dienst.show('Adresse kopiert'));

    expect(toasts()[0].querySelector('.z-toast__action')).toBeNull();
  });

  it('ruft beim Klick auf die Aktion den Callback und schliesst den Toast', () => {
    const aktion = vi.fn();
    zeige(() => dienst.show('Eigenschaften gespeichert', { actionLabel: 'Rückgängig', action: aktion }));

    const button = toasts()[0].querySelector<HTMLButtonElement>('.z-toast__action');
    button?.click();
    fixture.detectChanges();

    expect(aktion).toHaveBeenCalledTimes(1);
    expect(dienst.toasts()).toHaveLength(0);
    expect(toasts()).toHaveLength(0);
  });

  it('schliesst den Toast auch ohne hinterlegten Callback', () => {
    zeige(() => dienst.show('Eigenschaften gespeichert', { actionLabel: 'Rückgängig' }));

    toasts()[0].querySelector<HTMLButtonElement>('.z-toast__action')?.click();
    fixture.detectChanges();

    expect(toasts()).toHaveLength(0);
  });

  it('gibt dem Schliessen-Button Schließen als aria-label', () => {
    zeige(() => dienst.show('Adresse kopiert'));
    const schliessen = toasts()[0].querySelector('.z-toast__close');

    expect(schliessen?.getAttribute('aria-label')).toBe('Schließen');
    expect(schliessen?.querySelector('z-icon')?.textContent?.trim()).toBe('close');
  });

  it('laesst closeLabel das aria-label ueberschreiben', () => {
    const eigenes = TestBed.createComponent(EigenesLabelHost);
    eigenes.detectChanges();
    TestBed.inject(ZToast).show('Adresse kopiert');
    eigenes.detectChanges();

    expect(
      eigenes.nativeElement.querySelector('.z-toast__close').getAttribute('aria-label'),
    ).toBe('Meldung schließen');
  });

  it('entfernt den Toast beim Klick auf Schliessen', () => {
    zeige(() => {
      dienst.show('Adresse kopiert');
      dienst.success('Eigenschaften gespeichert');
    });

    toasts()[0].querySelector<HTMLButtonElement>('.z-toast__close')?.click();
    fixture.detectChanges();

    expect(toasts()).toHaveLength(1);
    expect(toasts()[0].textContent).toContain('Eigenschaften gespeichert');
  });

  it('rendert hoechstens drei Toasts, den neuesten unten', () => {
    zeige(() => {
      dienst.show('Eins');
      dienst.show('Zwei');
      dienst.show('Drei');
      dienst.show('Vier');
    });

    expect(toasts().map((toast) => toast.querySelector('span')?.textContent?.trim())).toEqual([
      'Zwei',
      'Drei',
      'Vier',
    ]);
  });
});
