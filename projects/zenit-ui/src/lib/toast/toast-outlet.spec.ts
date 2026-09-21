import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Z_LABELS, Z_LABELS_EN } from '../labels';
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

@Component({
  imports: [ZToastOutlet],
  template: `<z-toast-outlet /><z-toast-outlet closeLabel="Meldung schließen" />`,
  providers: [{ provide: Z_LABELS, useValue: Z_LABELS_EN }],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class RegistryHost {}

describe('ZToastOutlet', () => {
  let fixture: ComponentFixture<OutletHost>;
  let dienst: ZToast;

  /** Shows the toasts of the service and renders them. */
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

  it('puts the class z-toast-outlet on the host and stays empty without a toast', () => {
    const outlet = fixture.nativeElement.querySelector('z-toast-outlet');

    expect(outlet.classList.contains('z-toast-outlet')).toBe(true);
    expect(toasts()).toHaveLength(0);
  });

  it('renders a neutral toast with role status and no modifier', () => {
    zeige(() => dienst.show('Adresse kopiert'));
    const toast = toasts()[0];

    expect(toast.classList.contains('z-toast')).toBe(true);
    expect(toast.classList.contains('z-toast--success')).toBe(false);
    expect(toast.classList.contains('z-toast--danger')).toBe(false);
    expect(toast.getAttribute('role')).toBe('status');
    expect(toast.textContent).toContain('Adresse kopiert');
  });

  it('renders success with z-toast--success and role status', () => {
    zeige(() => dienst.success('Eigenschaften gespeichert'));
    const toast = toasts()[0];

    expect(toast.classList.contains('z-toast--success')).toBe(true);
    expect(toast.classList.contains('z-toast--danger')).toBe(false);
    expect(toast.getAttribute('role')).toBe('status');
  });

  it('renders an error with z-toast--danger and role alert', () => {
    zeige(() => dienst.error('Backup fehlgeschlagen: Speicher voll'));
    const toast = toasts()[0];

    expect(toast.classList.contains('z-toast--danger')).toBe(true);
    expect(toast.classList.contains('z-toast--success')).toBe(false);
    expect(toast.getAttribute('role')).toBe('alert');
  });

  it('shows the icon from icon and none without icon', () => {
    zeige(() => dienst.show('Adresse kopiert', { icon: 'content_copy' }));
    const icon = toasts()[0].querySelector(':scope > z-icon');

    expect(icon?.textContent?.trim()).toBe('content_copy');

    zeige(() => dienst.dismiss());
    zeige(() => dienst.show('Adresse kopiert'));

    expect(toasts()[0].querySelector(':scope > z-icon')).toBeNull();
  });

  it('shows the action as a button with actionLabel and none without actionLabel', () => {
    zeige(() => dienst.show('Eigenschaften gespeichert', { actionLabel: 'Rückgängig' }));

    expect(toasts()[0].querySelector('.z-toast__action')?.textContent?.trim()).toBe('Rückgängig');

    zeige(() => dienst.dismiss());
    zeige(() => dienst.show('Adresse kopiert'));

    expect(toasts()[0].querySelector('.z-toast__action')).toBeNull();
  });

  it('calls the callback on a click on the action and closes the toast', () => {
    const aktion = vi.fn();
    zeige(() =>
      dienst.show('Eigenschaften gespeichert', { actionLabel: 'Rückgängig', action: aktion }),
    );

    const button = toasts()[0].querySelector<HTMLButtonElement>('.z-toast__action');
    button?.click();
    fixture.detectChanges();

    expect(aktion).toHaveBeenCalledTimes(1);
    expect(dienst.toasts()).toHaveLength(0);
    expect(toasts()).toHaveLength(0);
  });

  it('closes the toast even without a registered callback', () => {
    zeige(() => dienst.show('Eigenschaften gespeichert', { actionLabel: 'Rückgängig' }));

    toasts()[0].querySelector<HTMLButtonElement>('.z-toast__action')?.click();
    fixture.detectChanges();

    expect(toasts()).toHaveLength(0);
  });

  it('gives the close button Schließen as its aria-label', () => {
    zeige(() => dienst.show('Adresse kopiert'));
    const schliessen = toasts()[0].querySelector('.z-toast__close');

    expect(schliessen?.getAttribute('aria-label')).toBe('Schließen');
    expect(schliessen?.querySelector('z-icon')?.textContent?.trim()).toBe('close');
  });

  it('takes the close label from the registry, and an own input still wins', () => {
    const eigenes = TestBed.createComponent(RegistryHost);
    eigenes.detectChanges();
    TestBed.inject(ZToast).show('Adresse kopiert');
    eigenes.detectChanges();
    const [ausRegistry, mitEingabe] = Array.from<HTMLElement>(
      eigenes.nativeElement.querySelectorAll('.z-toast__close'),
    );

    expect(ausRegistry.getAttribute('aria-label')).toBe('Close');
    expect(mitEingabe.getAttribute('aria-label')).toBe('Meldung schließen');
  });

  it('lets closeLabel override the aria-label', () => {
    const eigenes = TestBed.createComponent(EigenesLabelHost);
    eigenes.detectChanges();
    TestBed.inject(ZToast).show('Adresse kopiert');
    eigenes.detectChanges();

    expect(eigenes.nativeElement.querySelector('.z-toast__close').getAttribute('aria-label')).toBe(
      'Meldung schließen',
    );
  });

  it('removes the toast on a click on close', () => {
    zeige(() => {
      dienst.show('Adresse kopiert');
      dienst.success('Eigenschaften gespeichert');
    });

    toasts()[0].querySelector<HTMLButtonElement>('.z-toast__close')?.click();
    fixture.detectChanges();

    expect(toasts()).toHaveLength(1);
    expect(toasts()[0].textContent).toContain('Eigenschaften gespeichert');
  });

  it('renders at most three toasts, the newest at the bottom', () => {
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
