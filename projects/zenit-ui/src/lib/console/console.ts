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

/**
 * Severity of a log line. `warn` is coloured `warning`, `error` is `danger`,
 * `cmd` marks a command the user sent and is coloured `text`; everything else
 * stays `text-muted`.
 */
export type ZConsoleLevel = 'info' | 'warn' | 'error' | 'cmd';

/** One log line. */
export interface ZConsoleLine {
  /** Timestamp, already formatted by the caller, for example `12:07:15`. */
  time: string;
  /** The message itself. Long lines wrap, the console never scrolls sideways. */
  text: string;
  /**
   * Severity of the line. Without it the line renders in the neutral `info`
   * style.
   *
   * @default 'info'
   */
  level?: ZConsoleLevel;
}

/**
 * Live log of a server with a command line underneath.
 *
 * Renders `<pre class="z-console__log">` with one `<span>` per line (timestamp
 * in `.z-log__time`, the level as `z-log--warn`, `z-log--error` or
 * `z-log--cmd`), the "Zum Ende" button while the log is scrolled up, and a
 * `<label class="z-console__input">` holding the input. The host carries
 * `z-console`. With an empty {@link lines} the log shows the projected content
 * instead, which is where the empty state belongs.
 *
 * The log follows new lines as long as the view sits at the bottom, with four
 * pixels of slack. Scroll up and it stays put and the button appears; pressing
 * it scrolls back down and moves focus into the input.
 *
 * Accessibility: the `<pre>` is a tab stop with an `aria-label`, so the log can
 * be scrolled by keyboard; the input is labelled by {@link inputLabel}. Enter
 * emits {@link command}, Arrow Up and Arrow Down walk the commands of this
 * session and suppress the browser's caret movement.
 *
 * @example
 * ```html
 * <z-console [lines]="zeilen()" placeholder="Befehl eingeben, Enter sendet" (command)="sende($event)">
 *   Das Log ist leer. Neue Ausgaben erscheinen hier.
 * </z-console>
 * ```
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
  /**
   * The log lines in display order, oldest first. The component keeps no
   * buffer: the caller owns the list and caps its length.
   *
   * @default []
   */
  readonly lines = input<ZConsoleLine[]>([]);

  /**
   * Disables the input, for instance while the server is stopped. The log stays
   * readable and scrollable.
   *
   * @default false
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * Placeholder of the input. A placeholder is not a label, the accessible name
   * comes from {@link inputLabel}.
   *
   * @default ''
   */
  readonly placeholder = input('');

  /**
   * `aria-label` of the log region. German default, overridable.
   *
   * @default 'Serverlog'
   */
  readonly logLabel = input('Serverlog');

  /**
   * `aria-label` of the input. German default, overridable.
   *
   * @default 'Befehl'
   */
  readonly inputLabel = input('Befehl');

  /**
   * Caption of the button that jumps back to the end of the log. German
   * default, overridable.
   *
   * @default 'Zum Ende'
   */
  readonly endLabel = input('Zum Ende');

  /**
   * Emits the entered command on Enter, trimmed and never empty. The input is
   * cleared right away; echoing the command as a `cmd` line is the caller's
   * job, as is everything the command does.
   */
  // (command) is what the API table calls for. Since the Commands proposal
  // there is a DOM event of the same name, which the rule reports.
  // eslint-disable-next-line @angular-eslint/no-output-native
  readonly command = output<string>();

  protected readonly umbruch = '\n';
  protected readonly amEnde = signal(true);

  private readonly logEl = viewChild.required<ElementRef<HTMLElement>>('log');
  private readonly feldEl = viewChild.required<ElementRef<HTMLInputElement>>('feld');

  /** Commands of this session, `zeiger` points at the entry currently recalled. */
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

  /** Four pixels of slack, because zoom and subpixels never hit the bottom exactly. */
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

  /** `richtung` is -1 for Arrow Up and 1 for Arrow Down. */
  protected verlauf(ereignis: Event, richtung: number): void {
    if (!this.bisher.length) {
      return;
    }
    ereignis.preventDefault();
    this.zeiger = Math.min(Math.max(this.zeiger + richtung, 0), this.bisher.length);
    this.feldEl().nativeElement.value = this.bisher[this.zeiger] ?? '';
  }
}
