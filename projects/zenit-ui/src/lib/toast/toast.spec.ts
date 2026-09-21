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

  it('creates a neutral toast with show and delivers its id', () => {
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

  it('takes over the options and assigns an own id per toast', () => {
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

  it('sets the status success and the icon check_circle with success', () => {
    dienst.success('Eigenschaften gespeichert');

    expect(dienst.toasts()[0]).toMatchObject({ status: 'success', icon: 'check_circle' });
  });

  it('sets the status danger with error and leaves the toast standing', () => {
    dienst.error('Backup fehlgeschlagen: Speicher voll');

    expect(dienst.toasts()[0]).toMatchObject({ status: 'danger', icon: 'error' });

    vi.advanceTimersByTime(60_000);

    expect(dienst.toasts()).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('closes a toast without an action after 5000 ms', () => {
    dienst.show('Adresse kopiert');

    vi.advanceTimersByTime(4999);
    expect(dienst.toasts()).toHaveLength(1);

    vi.advanceTimersByTime(1);
    expect(dienst.toasts()).toHaveLength(0);
  });

  it('leaves a toast with actionLabel standing for 8000 ms', () => {
    dienst.show('Eigenschaften gespeichert', { actionLabel: 'Rückgängig' });

    vi.advanceTimersByTime(7999);
    expect(dienst.toasts()).toHaveLength(1);

    vi.advanceTimersByTime(1);
    expect(dienst.toasts()).toHaveLength(0);
  });

  it('lets an own duration override the default and the zero of the error', () => {
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

  it('removes exactly that toast with dismiss(id) and clears its timer', () => {
    const erste = dienst.show('Adresse kopiert');
    dienst.show('Eigenschaften gespeichert');
    expect(vi.getTimerCount()).toBe(2);

    dienst.dismiss(erste);

    expect(dienst.toasts().map((toast) => toast.text)).toEqual(['Eigenschaften gespeichert']);
    expect(vi.getTimerCount()).toBe(1);

    vi.advanceTimersByTime(5000);
    expect(dienst.toasts()).toHaveLength(0);
  });

  it('leaves the list untouched for dismiss with an unknown id', () => {
    const id = dienst.show('Adresse kopiert');

    dienst.dismiss(id + 99);

    expect(dienst.toasts()).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(1);
  });

  it('removes all toasts and all timers with dismiss without an id', () => {
    dienst.show('Adresse kopiert');
    dienst.success('Eigenschaften gespeichert');
    dienst.show('Neustart läuft', { actionLabel: 'Abbrechen' });

    dienst.dismiss();

    expect(dienst.toasts()).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('shows at most three toasts, the oldest gives way and the newest stands at the bottom', () => {
    dienst.show('Eins');
    dienst.show('Zwei');
    dienst.show('Drei');
    const vierte = dienst.show('Vier');

    expect(dienst.toasts().map((toast) => toast.text)).toEqual(['Zwei', 'Drei', 'Vier']);
    expect(dienst.toasts()[dienst.toasts().length - 1].id).toBe(vierte);
    expect(vi.getTimerCount()).toBe(3);
  });

  it('pushes out a standing error as well and clears its place', () => {
    dienst.error('Backup fehlgeschlagen: Speicher voll');
    dienst.show('Eins');
    dienst.show('Zwei');
    dienst.show('Drei');

    expect(dienst.toasts().map((toast) => toast.text)).toEqual(['Eins', 'Zwei', 'Drei']);
  });

  it('clears all timers on destroy and writes nothing into the signal afterwards', () => {
    dienst.show('Adresse kopiert');
    dienst.show('Eigenschaften gespeichert');

    TestBed.resetTestingModule();

    expect(vi.getTimerCount()).toBe(0);
    expect(dienst.toasts()).toHaveLength(0);

    vi.advanceTimersByTime(60_000);
    expect(dienst.toasts()).toHaveLength(0);
  });
});
