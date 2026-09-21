import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ZButton } from '../button';

export type ZConsoleLevel = 'info' | 'warn' | 'error' | 'cmd';

/** Eine Logzeile. Ohne `level` gilt `info`. */
export interface ZConsoleLine {
  time: string;
  text: string;
  level?: ZConsoleLevel;
}

/**
 * Live-Log mit Eingabezeile. Das Log scrollt mit, solange man unten steht;
 * scrollt man hoch, bleibt es stehen und der Button "Zum Ende" erscheint.
 * Enter sendet `(command)`, Pfeil hoch und runter holen ältere Befehle.
 * Ist `lines` leer, zeigt das Log den projizierten Inhalt (Leerzustand).
 */
@Component({
  selector: 'z-console',
  imports: [ZButton],
  template: `<pre
      #log
      class="z-console__log"
      tabindex="0"
      [attr.aria-label]="logLabel()"
      (scroll)="aufScroll()"
    >@for (zeile of lines(); track $index; let letzte = $last) {<span
        [class.z-log--warn]="zeile.level === 'warn'"
        [class.z-log--error]="zeile.level === 'error'"
        [class.z-log--cmd]="zeile.level === 'cmd'"
      ><span class="z-log__time">{{ zeile.time }}</span> {{ zeile.text
      }}{{ letzte ? '' : umbruch }}</span>} @empty {<ng-content />}</pre
    >
    @if (!amEnde()) {
      <div class="z-console__end">
        <button zBtn="secondary" size="sm" (click)="zumEnde()">{{ endLabel() }}</button>
      </div>
    }
    <label class="z-console__input"
      ><span aria-hidden="true">&gt;</span
      ><input
        #feld
        [attr.aria-label]="inputLabel()"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        (keydown.enter)="senden()"
        (keydown.arrowup)="verlauf($event, -1)"
        (keydown.arrowdown)="verlauf($event, 1)"
    /></label>`,
  host: { 'class': 'z-console' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZConsole {
  readonly lines = input<ZConsoleLine[]>([]);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly placeholder = input('');
  /** Überschreibbare aria-Standards. */
  readonly logLabel = input('Serverlog');
  readonly inputLabel = input('Befehl');
  readonly endLabel = input('Zum Ende');

  // (command) steht so in der API-Tabelle. Seit dem Commands-Vorschlag gibt es
  // auch ein gleichnamiges DOM-Ereignis, das die Regel meldet.
  // eslint-disable-next-line @angular-eslint/no-output-native
  readonly command = output<string>();

  protected readonly umbruch = '\n';
  protected readonly amEnde = signal(true);

  private readonly logEl = viewChild.required<ElementRef<HTMLElement>>('log');
  private readonly feldEl = viewChild.required<ElementRef<HTMLInputElement>>('feld');

  /** Befehle dieser Sitzung, `zeiger` zeigt auf den gerade geholten Eintrag. */
  private readonly bisher: string[] = [];
  private zeiger = 0;

  constructor() {
    afterRenderEffect({
      write: () => {
        this.lines();
        if (this.amEnde()) {
          const el = this.logEl().nativeElement;
          el.scrollTop = el.scrollHeight;
        }
      },
    });
  }

  /** Vier Pixel Spielraum, weil Zoom und Teilpixel den Rest nie genau treffen. */
  protected aufScroll(): void {
    const el = this.logEl().nativeElement;
    this.amEnde.set(el.scrollHeight - el.scrollTop - el.clientHeight <= 4);
  }

  protected zumEnde(): void {
    const el = this.logEl().nativeElement;
    el.scrollTop = el.scrollHeight;
    this.amEnde.set(true);
    this.feldEl().nativeElement.focus();
  }

  protected senden(): void {
    const el = this.feldEl().nativeElement;
    const text = el.value.trim();
    if (!text) {
      return;
    }
    this.bisher.push(text);
    this.zeiger = this.bisher.length;
    el.value = '';
    this.command.emit(text);
  }

  /** `richtung` ist -1 für Pfeil hoch und 1 für Pfeil runter. */
  protected verlauf(ereignis: Event, richtung: number): void {
    if (!this.bisher.length) {
      return;
    }
    ereignis.preventDefault();
    this.zeiger = Math.min(Math.max(this.zeiger + richtung, 0), this.bisher.length);
    this.feldEl().nativeElement.value = this.bisher[this.zeiger] ?? '';
  }
}
