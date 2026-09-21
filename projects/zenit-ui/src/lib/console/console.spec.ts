import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Z_LABELS, Z_LABELS_EN } from '../labels';
import { ZConsole, ZConsoleLine } from './console';

const ZEILEN: ZConsoleLine[] = [
  { time: '[12:04:27]', text: 'Starting minecraft server version 1.21.4' },
  { time: '[12:06:02]', text: 'WARN Can’t keep up!', level: 'warn' },
  { time: '[12:06:40]', text: 'ERROR Could not load plugin', level: 'error' },
  { time: '[12:07:15]', text: '> whitelist add Steve', level: 'cmd' },
];

@Component({
  imports: [ZConsole],
  template: `<z-console
    [lines]="zeilen()"
    [disabled]="gesperrt()"
    [placeholder]="platzhalter()"
    (command)="befehle.push($event)"
    >Noch keine Ausgabe. Starte den Server.</z-console
  >`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ConsoleHost {
  readonly zeilen = signal<ZConsoleLine[]>(ZEILEN);
  readonly gesperrt = signal(false);
  readonly platzhalter = signal('');
  readonly befehle: string[] = [];
}

@Component({
  imports: [ZConsole],
  template: `<z-console logLabel="Konsole von Test" endLabel="Nach unten" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class LabelHost {}

@Component({
  imports: [ZConsole],
  template: `<z-console /><z-console logLabel="Konsole von Test" />`,
  providers: [{ provide: Z_LABELS, useValue: Z_LABELS_EN }],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class RegistryHost {}

describe('ZConsole', () => {
  let fixture: ComponentFixture<ConsoleHost>;
  let host: ConsoleHost;

  function log(): HTMLElement {
    return fixture.nativeElement.querySelector('.z-console__log');
  }

  function feld(): HTMLInputElement {
    return fixture.nativeElement.querySelector('.z-console__input input');
  }

  function endeButton(): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector('.z-console__end button');
  }

  function taste(name: string): void {
    feld().dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));
    fixture.detectChanges();
  }

  function tippe(text: string): void {
    feld().value = text;
  }

  /** jsdom has no layout, so the three scroll numbers come from the test. */
  function scrolle(scrollTop: number): void {
    const el = log();
    Object.defineProperty(el, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(el, 'clientHeight', { value: 100, configurable: true });
    el.scrollTop = scrollTop;
    el.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
  }

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsoleHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders every line with its time in z-log__time', () => {
    const zeilen = Array.from(log().querySelectorAll('span:not(.z-log__time)'));

    expect(zeilen).toHaveLength(4);
    expect(zeilen[0].querySelector('.z-log__time')?.textContent).toBe('[12:04:27]');
    expect(zeilen[0].textContent).toBe('[12:04:27] Starting minecraft server version 1.21.4\n');
  });

  it('gives a line the class of its level and info no class at all', () => {
    const zeilen = Array.from(log().querySelectorAll('span:not(.z-log__time)'));

    expect(zeilen[0].className).toBe('');
    expect(zeilen[1].className).toBe('z-log--warn');
    expect(zeilen[2].className).toBe('z-log--error');
    expect(zeilen[3].className).toBe('z-log--cmd');
  });

  it('leaves out the line break after the last line', () => {
    const zeilen = Array.from(log().querySelectorAll('span:not(.z-log__time)'));

    expect(zeilen[2].textContent?.endsWith('\n')).toBe(true);
    expect(zeilen[3].textContent?.endsWith('\n')).toBe(false);
  });

  it('takes its texts from the label registry, and an own input still wins', () => {
    const eigenes = TestBed.createComponent(RegistryHost);
    eigenes.detectChanges();
    const [ausRegistry, mitEingabe] = Array.from<HTMLElement>(
      eigenes.nativeElement.querySelectorAll('.z-console__log'),
    );

    expect(ausRegistry.getAttribute('aria-label')).toBe('Server log');
    expect(mitEingabe.getAttribute('aria-label')).toBe('Konsole von Test');
    expect(
      eigenes.nativeElement.querySelector('.z-console__input input').getAttribute('aria-label'),
    ).toBe('Command');
  });

  it('makes the log focusable and names it Serverlog by default', () => {
    expect(log().getAttribute('tabindex')).toBe('0');
    expect(log().getAttribute('aria-label')).toBe('Serverlog');
  });

  it('lets the caller override the aria label of the log and the end button', () => {
    const eigenes = TestBed.createComponent(LabelHost);
    eigenes.detectChanges();
    const eigenerLog = eigenes.nativeElement.querySelector('.z-console__log');
    Object.defineProperty(eigenerLog, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(eigenerLog, 'clientHeight', { value: 100, configurable: true });
    eigenerLog.scrollTop = 0;
    eigenerLog.dispatchEvent(new Event('scroll'));
    eigenes.detectChanges();

    expect(eigenerLog.getAttribute('aria-label')).toBe('Konsole von Test');
    expect(eigenes.nativeElement.querySelector('.z-console__end button').textContent.trim()).toBe(
      'Nach unten',
    );
  });

  it('shows the projected content while lines is empty', () => {
    expect(log().textContent).not.toContain('Noch keine Ausgabe');

    host.zeilen.set([]);
    fixture.detectChanges();

    expect(log().textContent?.trim()).toBe('Noch keine Ausgabe. Starte den Server.');
  });

  it('writes placeholder to the input', () => {
    expect(feld().getAttribute('placeholder')).toBe('');

    host.platzhalter.set('Befehl eingeben, Enter sendet');
    fixture.detectChanges();

    expect(feld().getAttribute('placeholder')).toBe('Befehl eingeben, Enter sendet');
  });

  it('emits the trimmed text on Enter and clears the field', () => {
    tippe('  say hallo  ');
    taste('Enter');

    expect(host.befehle).toEqual(['say hallo']);
    expect(feld().value).toBe('');
  });

  it('emits nothing for an empty or whitespace-only input', () => {
    taste('Enter');
    tippe('   ');
    taste('Enter');

    expect(host.befehle).toEqual([]);
  });

  it('walks the history with ArrowUp and ArrowDown', () => {
    tippe('help');
    taste('Enter');
    tippe('list');
    taste('Enter');

    taste('ArrowUp');
    expect(feld().value).toBe('list');

    taste('ArrowUp');
    expect(feld().value).toBe('help');

    taste('ArrowUp');
    expect(feld().value).toBe('help');

    taste('ArrowDown');
    expect(feld().value).toBe('list');

    taste('ArrowDown');
    expect(feld().value).toBe('');
  });

  it('leaves the field untouched while the history is empty', () => {
    tippe('halb getippt');
    taste('ArrowUp');

    expect(feld().value).toBe('halb getippt');
  });

  it('disables the input so that no command can be sent', () => {
    host.gesperrt.set(true);
    fixture.detectChanges();

    expect(feld().disabled).toBe(true);
    // The native attribute is the whole guard: a disabled input never receives
    // keydown in a browser. jsdom does deliver a dispatched one, so sending the
    // key here would test jsdom and not the component.
    expect(host.befehle).toEqual([]);

    host.gesperrt.set(false);
    fixture.detectChanges();
    tippe('stop');
    taste('Enter');

    expect(feld().disabled).toBe(false);
    expect(host.befehle).toEqual(['stop']);
  });

  it('hides the end button while the log stands at the end', () => {
    expect(endeButton()).toBeNull();

    scrolle(900);

    expect(endeButton()).toBeNull();
  });

  it('shows the end button once the log is scrolled up', () => {
    scrolle(0);

    expect(endeButton()?.textContent?.trim()).toBe('Zum Ende');
  });

  it('gives the end button type="button" so a console inside a form does not submit', () => {
    scrolle(0);

    expect(endeButton()?.getAttribute('type')).toBe('button');
  });

  it('scrolls back to the end, hides the button and focuses the input', () => {
    scrolle(0);
    endeButton()?.click();
    fixture.detectChanges();

    expect(log().scrollTop).toBe(1000);
    expect(endeButton()).toBeNull();
    expect(document.activeElement).toBe(feld());
  });
});
