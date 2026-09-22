import { TestBed } from '@angular/core/testing';
import type { ZToastItem, ZToastOptions, ZToastStatus } from '../../public-api';
import { provideZenitToast, ZToast, ZToastConfig } from './toast';

/** A fresh service built from `config`, as an application root would build it. */
function mitConfig(config: ZToastConfig): ZToast {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [provideZenitToast(config)] });
  return TestBed.inject(ZToast);
}

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
      title: '',
      icon: '',
      actionLabel: '',
    });
    expect(dienst.toasts()[0].action).toBeUndefined();
  });

  it('takes over the title and leaves it empty without one', () => {
    dienst.show('Der Host wird für etwa 15 Minuten neu gestartet', {
      title: 'Wartung am 22.09.2026, 03:00',
    });
    dienst.show('Adresse kopiert');

    expect(dienst.toasts().map((toast) => toast.title)).toEqual([
      'Wartung am 22.09.2026, 03:00',
      '',
    ]);
  });

  it('sets the status info and the icon info with info', () => {
    dienst.info('Der Host wird für etwa 15 Minuten neu gestartet');

    expect(dienst.toasts()[0]).toMatchObject({ status: 'info', icon: 'info' });
  });

  it('sets the status warning and the icon warning with warning', () => {
    dienst.warning('Dein Guthaben reicht noch 6 Tage');

    expect(dienst.toasts()[0]).toMatchObject({ status: 'warning', icon: 'warning' });
  });

  it('gives info and warning the duration of a neutral toast', () => {
    dienst.info('Der Host wird neu gestartet');
    dienst.warning('Dein Guthaben reicht noch 6 Tage', { actionLabel: 'Aufladen' });

    vi.advanceTimersByTime(5000);
    expect(dienst.toasts().map((toast) => toast.status)).toEqual(['warning']);

    vi.advanceTimersByTime(3000);
    expect(dienst.toasts()).toHaveLength(0);
  });

  it('lets the options override the defaults of info and warning', () => {
    dienst.info('Der Host wird neu gestartet', { icon: 'schedule', duration: 0 });
    dienst.warning('Dein Guthaben reicht noch 6 Tage', { status: 'danger' });

    expect(dienst.toasts()[0].icon).toBe('schedule');
    expect(dienst.toasts()[1].status).toBe('danger');

    vi.advanceTimersByTime(60_000);
    expect(dienst.toasts()).toHaveLength(1);
  });

  it('exports the toast types from the public api', () => {
    // Compile-time proof that the new status values and `title` are part of the
    // published types; the runtime check keeps the test from being empty.
    const optionen = {
      status: 'warning' satisfies ZToastStatus,
      title: 'Wartung am 22.09.2026, 03:00',
    } satisfies ZToastOptions;
    const id = dienst.show('Der Host wird für etwa 15 Minuten neu gestartet', optionen);
    const eintrag: ZToastItem = dienst.toasts()[0];

    expect(eintrag).toMatchObject({ id, status: 'warning', title: optionen.title });
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

  it('never pushes out a standing toast, the oldest timed one gives way instead', () => {
    dienst.error('Backup fehlgeschlagen: Speicher voll');
    dienst.show('Eins');
    dienst.show('Zwei');
    dienst.show('Drei');

    expect(dienst.toasts().map((toast) => toast.text)).toEqual([
      'Backup fehlgeschlagen: Speicher voll',
      'Zwei',
      'Drei',
    ]);
  });

  it('counts a toast with an action as standing although it has a timer', () => {
    dienst.show('Neue Version verfügbar', { actionLabel: 'Aktualisieren' });
    dienst.show('Eins');
    dienst.show('Zwei');
    dienst.show('Drei');
    dienst.show('Vier');

    expect(dienst.toasts().map((toast) => toast.text)).toEqual([
      'Neue Version verfügbar',
      'Drei',
      'Vier',
    ]);
  });

  it('lets a toast wait while every visible one is standing and starts its timer later', () => {
    const erste = dienst.error('Backup fehlgeschlagen');
    dienst.show('Neue Version verfügbar', { actionLabel: 'Aktualisieren', duration: 0 });
    dienst.show('Installation läuft', { duration: 0 });
    dienst.show('Adresse kopiert');

    expect(dienst.toasts()).toHaveLength(3);
    expect(dienst.toasts().map((toast) => toast.text)).not.toContain('Adresse kopiert');
    expect(vi.getTimerCount()).toBe(0);

    // Waiting costs no time: the toast still gets its full 5000 ms once visible.
    vi.advanceTimersByTime(60_000);
    dienst.dismiss(erste);

    expect(dienst.toasts().map((toast) => toast.text)).toEqual([
      'Neue Version verfügbar',
      'Installation läuft',
      'Adresse kopiert',
    ]);
    expect(vi.getTimerCount()).toBe(1);

    vi.advanceTimersByTime(4999);
    expect(dienst.toasts()).toHaveLength(3);
    vi.advanceTimersByTime(1);
    expect(dienst.toasts()).toHaveLength(2);
  });

  it('loses none of five toasts in a row with overflow queue', () => {
    dienst = mitConfig({ overflow: 'queue' });
    const gesehen = new Set<string>();
    const merken = () => dienst.toasts().forEach((toast) => gesehen.add(toast.text));

    for (const text of ['Eins', 'Zwei', 'Drei', 'Vier', 'Fünf']) {
      dienst.show(text);
      merken();
    }

    expect(dienst.toasts().map((toast) => toast.text)).toEqual(['Eins', 'Zwei', 'Drei']);
    expect(vi.getTimerCount()).toBe(3);

    vi.advanceTimersByTime(5000);
    merken();
    expect(dienst.toasts().map((toast) => toast.text)).toEqual(['Vier', 'Fünf']);

    vi.advanceTimersByTime(5000);
    expect(dienst.toasts()).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
    expect([...gesehen]).toEqual(['Eins', 'Zwei', 'Drei', 'Vier', 'Fünf']);
  });

  it('takes a waiting toast out of the queue with dismiss(id)', () => {
    dienst = mitConfig({ overflow: 'queue' });
    const erste = dienst.show('Eins');
    dienst.show('Zwei');
    dienst.show('Drei');
    const vierte = dienst.show('Vier');
    dienst.show('Fünf');

    dienst.dismiss(vierte);
    dienst.dismiss(erste);

    expect(dienst.toasts().map((toast) => toast.text)).toEqual(['Zwei', 'Drei', 'Fünf']);
  });

  it('empties the queue as well with dismiss without an id', () => {
    dienst = mitConfig({ overflow: 'queue' });
    for (const text of ['Eins', 'Zwei', 'Drei', 'Vier']) {
      dienst.show(text);
    }

    dienst.dismiss();
    vi.advanceTimersByTime(60_000);

    expect(dienst.toasts()).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('never drops a waiting toast when a new one arrives with overflow replace', () => {
    const gesehen = new Set<string>();
    const merken = () => dienst.toasts().forEach((toast) => gesehen.add(toast.text));
    const s1 = dienst.show('S1', { duration: 0 });
    dienst.show('S2', { duration: 0 });
    dienst.show('S3', { duration: 0 });
    dienst.show('N1');
    dienst.show('N2');
    merken();

    dienst.dismiss(s1);
    merken();
    expect(dienst.toasts().map((toast) => toast.text)).toEqual(['S2', 'S3', 'N1']);

    dienst.success('N3');
    merken();
    expect(dienst.toasts().map((toast) => toast.text)).toEqual(['S2', 'S3', 'N2']);

    vi.advanceTimersByTime(5000);
    merken();
    expect(dienst.toasts().map((toast) => toast.text)).toEqual(['S2', 'S3', 'N3']);
    expect([...gesehen]).toEqual(['S1', 'S2', 'S3', 'N1', 'N2', 'N3']);
  });

  it('falls back to three places for a maxVisible that is not a number', () => {
    dienst = mitConfig({ maxVisible: Number.NaN });
    dienst.show('Eins');
    dienst.show('Zwei');
    dienst.show('Drei');
    dienst.show('Vier');

    expect(dienst.toasts().map((toast) => toast.text)).toEqual(['Zwei', 'Drei', 'Vier']);
  });

  it('shows as many toasts as maxVisible allows', () => {
    dienst = mitConfig({ maxVisible: 2 });
    dienst.show('Eins');
    dienst.show('Zwei');
    dienst.show('Drei');

    expect(dienst.toasts().map((toast) => toast.text)).toEqual(['Zwei', 'Drei']);
  });

  it('announces danger assertively and the rest politely unless live says otherwise', () => {
    dienst.warning('Dein Guthaben reicht noch 6 Tage');
    dienst.error('Backup fehlgeschlagen');
    dienst.warning('Danach wird Beispiel-Server 1 gesperrt', { live: 'assertive' });

    expect(dienst.toasts().map((toast) => toast.live)).toEqual([
      'polite',
      'assertive',
      'assertive',
    ]);
  });

  it('clears all timers on destroy and writes nothing into the signal afterwards', () => {
    dienst.show('Adresse kopiert');
    dienst.show('Eigenschaften gespeichert');
    dienst.error('Eins');
    dienst.error('Zwei');
    dienst.show('Wartet');

    TestBed.resetTestingModule();

    expect(vi.getTimerCount()).toBe(0);
    expect(dienst.toasts()).toHaveLength(0);

    vi.advanceTimersByTime(60_000);
    expect(dienst.toasts()).toHaveLength(0);
  });
});
