import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Gameserver } from './gameserver';

/**
 * The page has no state machine of its own any more: the states come out of two
 * resources and a Signal Form. These tests walk through them on a fake clock,
 * because 300 and 600 milliseconds are part of the behaviour.
 */
describe('Gameserver', () => {
  let fixture: ComponentFixture<Gameserver>;
  let element: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Lets the clock run and then the effects and the template catch up. */
  async function nach(ms: number): Promise<void> {
    await vi.advanceTimersByTimeAsync(ms);
    // Two rounds: the first settles the list, the second the delay that reads
    // `isLoading()` of the list.
    for (let runde = 0; runde < 2; runde++) {
      TestBed.tick();
      await vi.advanceTimersByTimeAsync(0);
    }
    fixture.detectChanges();
  }

  async function oeffne(zustand?: string): Promise<void> {
    fixture = TestBed.createComponent(Gameserver);
    fixture.componentRef.setInput('zustand', zustand);
    element = fixture.nativeElement as HTMLElement;
    await nach(0);
  }

  const anzahl = (selektor: string) => element.querySelectorAll(selektor).length;

  function tippe(text: string): void {
    const feld = element.querySelector<HTMLInputElement>('#suche')!;
    feld.value = text;
    feld.dispatchEvent(new Event('input', { bubbles: true }));
  }

  it('draws nothing for 300ms, then skeleton rows, then the first page', async () => {
    await oeffne();
    expect(anzahl('.z-skel')).toBe(0);
    expect(anzahl('.z-row__title')).toBe(0);

    await nach(300);
    expect(anzahl('.z-skel')).toBeGreaterThan(0);

    await nach(300);
    expect(anzahl('.z-skel')).toBe(0);
    expect(anzahl('.z-row__title')).toBe(6);
  });

  it('keeps the skeleton standing for ?zustand=laden', async () => {
    await oeffne('laden');
    await nach(60_000);

    expect(anzahl('.z-skel')).toBeGreaterThan(0);
    expect(anzahl('.z-row__title')).toBe(0);
  });

  it('shows the empty state without the filter row for ?zustand=leer', async () => {
    await oeffne('leer');
    await nach(600);

    expect(anzahl('.z-empty')).toBe(1);
    expect(anzahl('.app-filter')).toBe(0);
  });

  it('leaves the error state through "Erneut laden", again with a skeleton', async () => {
    await oeffne('fehler');
    await nach(600);
    expect(anzahl('.z-alert')).toBe(1);

    element.querySelector<HTMLButtonElement>('.z-alert button')!.click();
    await nach(300);
    expect(anzahl('.z-alert')).toBe(0);
    expect(anzahl('.z-skel')).toBeGreaterThan(0);

    await nach(300);
    expect(anzahl('.z-row__title')).toBe(6);
  });

  it('loads again when the query parameter changes', async () => {
    await oeffne();
    await nach(600);
    expect(anzahl('.z-row__title')).toBe(6);

    fixture.componentRef.setInput('zustand', 'leer');
    await nach(600);
    expect(anzahl('.z-empty')).toBe(1);
  });

  it('filters through the Signal Form and resets it from the empty state', async () => {
    await oeffne();
    await nach(600);
    const status = element.querySelector<HTMLSelectElement>('#status')!;
    // The model reaches the native select although its options come from @for.
    expect(status.value).toBe('Alle Status');

    tippe('Beispiel-Server 1');
    await nach(0);
    expect(anzahl('.z-row__title')).toBe(1);

    // A browser fires input and change on a select; formField listens to input.
    status.value = 'Gestoppt';
    status.dispatchEvent(new Event('input', { bubbles: true }));
    await nach(0);
    expect(element.querySelector('.z-empty')?.textContent).toContain(
      'Kein Server passt zum Filter',
    );

    element.querySelector<HTMLButtonElement>('.z-empty button')!.click();
    await nach(0);
    expect(anzahl('.z-row__title')).toBe(6);
    expect(element.querySelector<HTMLInputElement>('#suche')!.value).toBe('');
    expect(status.value).toBe('Alle Status');
  });
});
