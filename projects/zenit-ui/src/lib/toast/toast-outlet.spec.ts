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

  /** The two permanent live regions, polite first. */
  function bereiche(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.z-toast-outlet__live'));
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

  it('keeps an empty polite and an empty assertive live region without any toast', () => {
    const [hoeflich, dringend] = bereiche();

    expect(hoeflich.getAttribute('role')).toBe('status');
    expect(hoeflich.getAttribute('aria-live')).toBe('polite');
    expect(dringend.getAttribute('role')).toBe('alert');
    expect(dringend.getAttribute('aria-live')).toBe('assertive');
    expect(hoeflich.children).toHaveLength(0);
    expect(dringend.children).toHaveLength(0);
  });

  it('sets aria-atomic=false on both regions so only the new toast is read out', () => {
    expect(bereiche().map((bereich) => bereich.getAttribute('aria-atomic'))).toEqual([
      'false',
      'false',
    ]);
  });

  it('renders a neutral toast without a role of its own into the polite region', () => {
    zeige(() => dienst.show('Adresse kopiert'));
    const toast = toasts()[0];

    expect(toast.classList.contains('z-toast')).toBe(true);
    expect(toast.classList.contains('z-toast--success')).toBe(false);
    expect(toast.classList.contains('z-toast--danger')).toBe(false);
    // A live region inside a live region is announced twice.
    expect(toast.getAttribute('role')).toBeNull();
    expect(toast.parentElement).toBe(bereiche()[0]);
    expect(toast.textContent).toContain('Adresse kopiert');
  });

  it('renders success with z-toast--success into the polite region', () => {
    zeige(() => dienst.success('Eigenschaften gespeichert'));
    const toast = toasts()[0];

    expect(toast.classList.contains('z-toast--success')).toBe(true);
    expect(toast.classList.contains('z-toast--danger')).toBe(false);
    expect(toast.getAttribute('role')).toBeNull();
    expect(toast.parentElement).toBe(bereiche()[0]);
  });

  it('renders info with z-toast--info and its icon into the polite region', () => {
    zeige(() => dienst.info('Der Host wird für etwa 15 Minuten neu gestartet'));
    const toast = toasts()[0];

    expect(toast.classList.contains('z-toast--info')).toBe(true);
    expect(toast.classList.contains('z-toast--danger')).toBe(false);
    expect(toast.querySelector(':scope > z-icon')?.textContent?.trim()).toBe('info');
    expect(toast.getAttribute('role')).toBeNull();
    expect(toast.parentElement).toBe(bereiche()[0]);
  });

  it('renders warning with z-toast--warning and its icon into the polite region', () => {
    zeige(() => dienst.warning('Dein Guthaben reicht noch 6 Tage'));
    const toast = toasts()[0];

    expect(toast.classList.contains('z-toast--warning')).toBe(true);
    expect(toast.classList.contains('z-toast--danger')).toBe(false);
    expect(toast.querySelector(':scope > z-icon')?.textContent?.trim()).toBe('warning');
    expect(toast.getAttribute('role')).toBeNull();
    expect(toast.parentElement).toBe(bereiche()[0]);
  });

  it('renders a title above the message in one text column', () => {
    zeige(() =>
      dienst.info('Der Host wird für etwa 15 Minuten neu gestartet', {
        title: 'Wartung am 22.09.2026, 03:00',
      }),
    );
    const spalte = toasts()[0].querySelector('.z-toast__text');

    expect(spalte?.querySelector('.z-toast__title')?.textContent?.trim()).toBe(
      'Wartung am 22.09.2026, 03:00',
    );
    expect(spalte?.querySelector('.z-toast__body')?.textContent?.trim()).toBe(
      'Der Host wird für etwa 15 Minuten neu gestartet',
    );
    // Title first, message below it.
    expect(Array.from(spalte?.children ?? []).map((kind) => kind.className)).toEqual([
      'z-toast__title',
      'z-toast__body',
    ]);
  });

  it('keeps the markup of a toast without a title unchanged', () => {
    zeige(() =>
      dienst.show('Adresse kopiert', { icon: 'content_copy', actionLabel: 'Rückgängig' }),
    );
    const toast = toasts()[0];

    expect(toast.querySelector('.z-toast__text')).toBeNull();
    expect(
      Array.from(toast.children).map((kind) => `${kind.tagName.toLowerCase()}.${kind.className}`),
    ).toEqual([
      'z-icon.material-icons z-icon',
      'span.',
      'button.z-toast__action',
      'button.z-btn z-toast__close z-btn--ghost z-btn--sm z-btn--icon',
    ]);
  });

  it('renders an error with z-toast--danger into the assertive region', () => {
    zeige(() => dienst.error('Backup fehlgeschlagen: Speicher voll'));
    const toast = toasts()[0];

    expect(toast.classList.contains('z-toast--danger')).toBe(true);
    expect(toast.classList.contains('z-toast--success')).toBe(false);
    expect(toast.getAttribute('role')).toBeNull();
    expect(toast.parentElement).toBe(bereiche()[1]);
  });

  it('puts a warning with live assertive into the assertive region', () => {
    zeige(() => dienst.warning('Danach wird Beispiel-Server 1 gesperrt', { live: 'assertive' }));
    const [hoeflich, dringend] = bereiche();

    expect(hoeflich.querySelector('.z-toast')).toBeNull();
    expect(dringend.querySelector('.z-toast--warning')?.textContent).toContain(
      'Danach wird Beispiel-Server 1 gesperrt',
    );
  });

  it('keeps the action of a standing toast clickable after five toasts in a row', () => {
    const aktion = vi.fn();
    zeige(() => {
      dienst.show('Neue Version verfügbar', {
        actionLabel: 'Aktualisieren',
        action: aktion,
        duration: 0,
      });
      for (const text of ['Eins', 'Zwei', 'Drei', 'Vier', 'Fünf']) {
        dienst.show(text);
      }
    });

    expect(toasts()).toHaveLength(3);
    const knopf = fixture.nativeElement.querySelector('.z-toast__action') as HTMLButtonElement;
    expect(knopf.textContent?.trim()).toBe('Aktualisieren');

    knopf.click();
    fixture.detectChanges();

    expect(aktion).toHaveBeenCalledTimes(1);
    expect(toasts().map((toast) => toast.textContent?.trim())).not.toContain(
      'Neue Version verfügbar',
    );
  });

  it('keeps both regions in the dom once every toast is gone', () => {
    zeige(() => dienst.error('Backup fehlgeschlagen: Speicher voll'));
    zeige(() => dienst.dismiss());

    expect(bereiche()).toHaveLength(2);
    expect(toasts()).toHaveLength(0);
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

  it('restores the order of the list across the two regions with style.order', () => {
    zeige(() => {
      dienst.show('Eins');
      dienst.error('Zwei');
      dienst.show('Drei');
    });

    // Two regions mean the danger toast comes last in the dom; order puts it
    // back between the other two on screen.
    const nachDom = toasts().map((toast) => ({
      text: toast.querySelector('span')?.textContent?.trim(),
      order: Number(toast.style.order),
    }));

    expect(nachDom).toEqual([
      { text: 'Eins', order: 0 },
      { text: 'Drei', order: 2 },
      { text: 'Zwei', order: 1 },
    ]);
  });
});
