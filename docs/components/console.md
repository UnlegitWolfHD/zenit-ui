# Console

Shows the live log of a server and takes commands.

## When to use

- On the console page of a server panel, with the log above and the command line below it.

## When not to use

- For a list of events with structure. That is `z-rows` or `table[zTable]`.
- For a one-off output the customer should read once. That is an alert.

## Import

```ts
import { ZConsole, ZConsoleLine, ZConsoleLevel } from 'zenit-ui';
```

## API

Selector: `z-console`

| Input         | Type             | Default       | Description                                                                                                                |
| ------------- | ---------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `lines`       | `ZConsoleLine[]` | `[]`          | The log lines in display order, oldest first. The component keeps no buffer: the caller owns the list and caps its length. |
| `disabled`    | `boolean`        | `false`       | Disables the input, for instance while the server is stopped. The log stays readable and scrollable.                       |
| `placeholder` | `string`         | `''`          | Placeholder of the input. A placeholder is not a label.                                                                    |
| `logLabel`    | `string`         | `'Serverlog'` | `aria-label` of the log region. German default, overridable.                                                               |
| `inputLabel`  | `string`         | `'Befehl'`    | `aria-label` of the input. German default, overridable.                                                                    |
| `endLabel`    | `string`         | `'Zum Ende'`  | Caption of the button that jumps back to the end of the log.                                                               |

| Output    | Payload  | Fires when                                                                              |
| --------- | -------- | --------------------------------------------------------------------------------------- |
| `command` | `string` | Enter is pressed. The text is trimmed and never empty; the input is cleared right away. |

Content projection: with an empty `lines` the log shows the projected content instead, which is
where the empty state belongs.

`ZConsoleLine` is `{ time: string; text: string; level?: ZConsoleLevel }`. `time` is already
formatted by the caller, for example `12:07:15`. `ZConsoleLevel` is `'info' | 'warn' | 'error' |
'cmd'`: `warn` is coloured `warning`, `error` is `danger`, `cmd` marks a command the user sent and
is coloured `text`, and everything else stays `text-muted`.

## Examples

The running console:

```html
<z-console [lines]="zeilen()" placeholder="Befehl eingeben, Enter sendet" (command)="sende($event)">
  Das Log ist leer. Neue Ausgaben erscheinen hier.
</z-console>
```

Echoing the command and appending the answer, which is the caller's job:

```ts
import { signal } from '@angular/core';
import { ZConsoleLine } from 'zenit-ui';

const zeilen = signal<ZConsoleLine[]>([]);

function sende(befehl: string): void {
  const zeit = new Date().toLocaleTimeString('de-DE');
  zeilen.update((alt) => [...alt.slice(-499), { time: zeit, text: befehl, level: 'cmd' }]);
}
```

A stopped server: the input is disabled and the log shows the empty state with its action:

```html
<z-console [lines]="[]" disabled placeholder="Der Server ist gestoppt">
  <z-empty-state title="Der Server ist gestoppt">
    Starte ihn, um das Log zu sehen.
    <button zEmptyAction zBtn="secondary" type="button">Server starten</button>
  </z-empty-state>
</z-console>
```

Inside a flush panel, with the toolbar the design system asks for:

```html
<z-panel title="Konsole" flush>
  <span zPanelActions>
    <button zBtn="ghost" size="sm" type="button">Log kopieren</button>
  </span>
  <z-console [lines]="zeilen()" placeholder="Befehl eingeben" (command)="sende($event)">
    Das Log ist leer.
  </z-console>
</z-panel>
```

With English labels:

```html
<z-console
  [lines]="zeilen()"
  logLabel="Server log"
  inputLabel="Command"
  endLabel="Jump to end"
  (command)="sende($event)"
>
  The log is empty.
</z-console>
```

## States

| State       | How it looks                                                                  | How to trigger it                                      |
| ----------- | ----------------------------------------------------------------------------- | ------------------------------------------------------ |
| Following   | the log scrolls with every new line                                           | the view sits at the bottom, with four pixels of slack |
| Scrolled up | the log stays put and the "Zum Ende" button appears between log and input     | scroll the log up                                      |
| Empty       | the projected content fills the log area                                      | `lines` is empty                                       |
| Disabled    | the input is at 45 percent with `cursor: not-allowed`, the log stays readable | `disabled`                                             |
| Focus       | 2px ring in `focus` on the log region or on the input                         | Tab, `:focus-visible`                                  |

Lines are coloured by their `level`: `warn` in `warning`, `error` in `danger`, `cmd` in `text`,
everything else in `text-muted`.

## Accessibility

- The `<pre>` is a tab stop with an `aria-label` from `logLabel`, so the log can be scrolled by
  keyboard alone.
- The input is labelled by `inputLabel`; the placeholder is never the label.
- Enter emits `command`. Arrow Up and Arrow Down walk the commands of this session and suppress the
  browser's caret movement.
- Pressing "Zum Ende" scrolls back down and moves focus into the input.
- The level is a colour, so a warning or an error that matters also belongs in an alert above the
  console.

## Responsive

The log is capped at 240px tall and scrolls vertically. Long lines wrap; the console never scrolls
sideways. The input row is already `control-md` tall, so no mobile adjustment is needed.

## Rendered classes and tokens

| Class              | Applies when                  |
| ------------------ | ----------------------------- |
| `z-console`        | on the host, always           |
| `z-console__log`   | on the `<pre>`                |
| `z-log__time`      | on the timestamp of each line |
| `z-log--warn`      | `level: 'warn'`               |
| `z-log--error`     | `level: 'error'`              |
| `z-log--cmd`       | `level: 'cmd'`                |
| `z-console__end`   | while the log is scrolled up  |
| `z-console__input` | on the input row              |

Tokens: `--space-2` to `--space-4` for padding and gaps, `--border`, `--radius-md`, `--bg` for the
log surface so the console sets itself off from the panel, `--surface` for the input row,
`--font-mono` for both, `--text-muted` for a normal line, `--text-subtle` for the timestamp and the
placeholder, `--warning`, `--danger` and `--text` for the three levels, `--control-md` for the input
height.

## Deviations from the reference

- Addition to the library: the "Zum Ende" button does not appear in the reference preview, because
  the preview does not scroll. It sits between log and input and uses tokens only.
- Addition to the library: a disabled input follows `.z-btn:disabled` with 45 percent opacity and
  `cursor: not-allowed`.
- Addition to the reference: the empty state inside the log is running text, not a log line. The
  enclosing `<pre>` sets mono, 12px and `pre-wrap`, so `body-sm` with normal wrapping is restored
  for it.

## Do / Don't

- Do cap the list of lines yourself; the component keeps no buffer.
- Do echo the sent command as a `cmd` line.
- Do show an empty state with "Server starten" while the server is stopped.
- Don't let the console scroll sideways; long lines wrap.
- Don't rely on the line colour alone for something that matters; add an alert above.
