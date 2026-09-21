import { TestBed } from '@angular/core/testing';
import { ZToast } from './toast';

describe('ZToast', () => {
  let dienst: ZToast;

  beforeEach(() => {
    vi.useFakeTimers();
    dienst = TestBed.inject(ZToast);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('legt mit show einen neutralen Toast an und liefert seine id', () => {
    const id = dienst.show('Adresse kopiert');

    expect(dienst.toasts()).toHaveLength(1);
    expect(dienst.toasts()[0]).toMatchObject({
      id,
      text: 'Adresse kopiert',
      status: 'neutral',
      icon: '',
      actionLabel: '',
    });
    expect(dienst.toasts()[0].action).toBeUndefined();
  });

  it('uebernimmt die Optionen und vergibt je Toast eine eigene id', () => {
    const aktion = vi.fn();
    const erste = dienst.show('Adresse kopiert', { icon: 'content_copy' });
    const zweite = dienst.show('Eigenschaften gespeichert', {
      status: 'success',
      actionLabel: 'Rückgängig',
      action: aktion,
    });

    expect(zweite).not.toBe(erste);
    expect(dienst.toasts()[0].icon).toBe('content_copy');
    expect(dienst.toasts()[1]).toMatchObject({
      id: zweite,
      status: 'success',
      actionLabel: 'Rückgängig',
      action: aktion,
    });
  });

  it('setzt mit success den Status success und das Icon check_circle', () => {
    dienst.success('Eigenschaften gespeichert');

    expect(dienst.toasts()[0]).toMatchObject({ status: 'success', icon: 'check_circle' });
  });

  it('setzt mit error den Status danger und laesst den Toast stehen', () => {
    dienst.error('Backup fehlgeschlagen: Speicher voll');

    expect(dienst.toasts()[0]).toMatchObject({ status: 'danger', icon: 'error' });

    vi.advanceTimersByTime(60_000);

    expect(dienst.toasts()).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('schliesst einen Toast ohne Aktion nach 5000 ms', () => {
    dienst.show('Adresse kopiert');

    vi.advanceTimersByTime(4999);
    expect(dienst.toasts()).toHaveLength(1);

    vi.advanceTimersByTime(1);
    expect(dienst.toasts()).toHaveLength(0);
  });

  it('laesst einen Toast mit actionLabel 8000 ms stehen', () => {
    dienst.show('Eigenschaften gespeichert', { actionLabel: 'Rückgängig' });

    vi.advanceTimersByTime(7999);
    expect(dienst.toasts()).toHaveLength(1);

    vi.advanceTimersByTime(1);
    expect(dienst.toasts()).toHaveLength(0);
  });

  it('laesst ein eigenes duration den Standard und die Null des Fehlers ueberschreiben', () => {
    dienst.show('Adresse kopiert', { duration: 1000 });
    dienst.error('Backup fehlgeschlagen: Speicher voll', { duration: 2000 });
    dienst.show('Eigenschaften gespeichert', { actionLabel: 'Rückgängig', duration: 0 });

    vi.advanceTimersByTime(1000);
    expect(dienst.toasts().map((toast) => toast.text)).toEqual([
      'Backup fehlgeschlagen: Speicher voll',
      'Eigenschaften gespeichert',
    ]);

    vi.advanceTimersByTime(1000);
    expect(dienst.toasts().map((toast) => toast.text)).toEqual(['Eigenschaften gespeichert']);

    vi.advanceTimersByTime(60_000);
    expect(dienst.toasts()).toHaveLength(1);
  });

  it('entfernt mit dismiss(id) genau diesen Toast und raeumt seinen Timer', () => {
    const erste = dienst.show('Adresse kopiert');
    dienst.show('Eigenschaften gespeichert');
    expect(vi.getTimerCount()).toBe(2);

    dienst.dismiss(erste);

    expect(dienst.toasts().map((toast) => toast.text)).toEqual(['Eigenschaften gespeichert']);
    expect(vi.getTimerCount()).toBe(1);

    vi.advanceTimersByTime(5000);
    expect(dienst.toasts()).toHaveLength(0);
  });

  it('laesst dismiss mit unbekannter id die Liste unberuehrt', () => {
    const id = dienst.show('Adresse kopiert');

    dienst.dismiss(id + 99);

    expect(dienst.toasts()).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(1);
  });

  it('entfernt mit dismiss ohne id alle Toasts und alle Timer', () => {
    dienst.show('Adresse kopiert');
    dienst.success('Eigenschaften gespeichert');
    dienst.show('Neustart läuft', { actionLabel: 'Abbrechen' });

    dienst.dismiss();

    expect(dienst.toasts()).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('zeigt hoechstens drei Toasts, der aelteste weicht und der neueste steht unten', () => {
    dienst.show('Eins');
    dienst.show('Zwei');
    dienst.show('Drei');
    const vierte = dienst.show('Vier');

    expect(dienst.toasts().map((toast) => toast.text)).toEqual(['Zwei', 'Drei', 'Vier']);
    expect(dienst.toasts()[dienst.toasts().length - 1].id).toBe(vierte);
    expect(vi.getTimerCount()).toBe(3);
  });

  it('verdraengt auch einen stehenden Fehler und raeumt dessen Platz', () => {
    dienst.error('Backup fehlgeschlagen: Speicher voll');
    dienst.show('Eins');
    dienst.show('Zwei');
    dienst.show('Drei');

    expect(dienst.toasts().map((toast) => toast.text)).toEqual(['Eins', 'Zwei', 'Drei']);
  });

  it('raeumt beim Zerstoeren alle Timer und schreibt danach nichts mehr ins Signal', () => {
    dienst.show('Adresse kopiert');
    dienst.show('Eigenschaften gespeichert');

    TestBed.resetTestingModule();

    expect(vi.getTimerCount()).toBe(0);
    expect(dienst.toasts()).toHaveLength(0);

    vi.advanceTimersByTime(60_000);
    expect(dienst.toasts()).toHaveLength(0);
  });
});
