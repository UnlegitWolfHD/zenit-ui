# Faq

One question with its answer, as a native disclosure.

## When to use

- At the bottom of a public page, five to eight real questions from support and Discord, the first
  one open.

## When not to use

- To hide content that every visitor needs. A disclosure is for the questions that only some ask.
- As a generic accordion for page sections. Sections are separated by `space-7` and 1px lines.

## Import

```ts
import { ZFaq } from 'zenit-ui';
```

## API

Selector: `z-faq`

| Input      | Type      | Default | Description                                                                                 |
| ---------- | --------- | ------- | ------------------------------------------------------------------------------------------- |
| `question` | `string`  | `''`    | The question, shown in the `<summary>`. A real question from support, not a headline.       |
| `open`     | `boolean` | `false` | Whether the answer starts out visible. Boolean attribute, so `open` alone counts as `true`. |

No outputs. Content projection: the default slot is the answer, rendered inside
`<p class="z-faq__body">`.

`open` is a one-way binding on the native `open` property, so the visitor can toggle freely
afterwards and a new value from the caller wins again.

## Examples

A block of questions, the first one open:

```html
<z-faq question="Wie schnell ist mein Server online?" open>
  Nach der Bestellung dauert die Einrichtung in der Regel etwa 60 Sekunden. Danach steht die Adresse
  im Panel.
</z-faq>
<z-faq question="Kann ich später mehr RAM buchen?">
  Ja, im Panel unter Upgrade. Der neue Preis gilt ab der nächsten Stunde.
</z-faq>
<z-faq question="Wie kündige ich?">
  Im Panel unter Einstellungen, jederzeit zum Monatsende. Verbrauchte Stunden werden abgerechnet.
</z-faq>
```

Rendered from a list, with only the first entry open:

```html
@for (f of fragen(); track f.frage; let erste = $first) {
<z-faq [question]="f.frage" [open]="erste">{{ f.antwort }}</z-faq>
}
```

An answer that ends with a link into the wiki:

```html
<z-faq question="Wie installiere ich ein Modpack?">
  Im Panel unter Mods und Plugins, dort das Modpack auswählen und den Server neu starten. Die
  ausführliche Anleitung steht im <a href="/wiki/modpacks">Wiki</a>.
</z-faq>
```

## States

| State  | How it looks                                           | How to trigger it                           |
| ------ | ------------------------------------------------------ | ------------------------------------------- |
| Closed | question with a `+` in the mono face at the right edge | default                                     |
| Open   | question with a `−`, answer below it                   | `open`, or a click or Enter on the question |
| Hover  | the cursor becomes a pointer; no colour change         | pointer over the question                   |
| Focus  | 2px ring in `focus` with 2px offset on the `<summary>` | Tab, `:focus-visible`                       |

There is no disabled, loading, error or empty state.

## Accessibility

- The markup is a native `<details>`/`<summary>`, so opening and closing work without JavaScript,
  the disclosure is reachable by keyboard and its expanded state is announced. The component adds
  no keyboard handling of its own.
- The `+` and `−` marks are CSS `content`, so they are not part of the accessible name.
- Answers are capped at the `measure` width, so a long answer stays readable.
- For search engines, output the same questions additionally as `FAQPage` JSON-LD. That is the
  caller's job; the component emits no structured data.

## Responsive

The block is a stack of full-width disclosures with a 1px line between them; only the last question
keeps a bottom line. The question wraps at narrow widths and the mark stays at the right edge.
Nothing changes at the breakpoints.

## Rendered classes and tokens

| Class         | Applies when        |
| ------------- | ------------------- |
| `z-faq`       | on the `<details>`  |
| `z-faq__body` | on the answer `<p>` |

Tokens: `--space-4` and `--space-5` for the padding, `--border` for the lines, `--text-muted` for
the mark and the answer, `--measure` as the maximum answer width, `--font-mono` for the mark. The
16px/24px question and answer type is a literal value from the reference stylesheet.

## Deviations from the reference

Addition to the library: every question sits in a `z-faq` of its own, which makes every `<details>`
the `:last-of-type` of its host and would give each one a bottom line. Only the last question keeps
it, otherwise there would be 2px between the questions.

## Do / Don't

- Do use real questions from support and Discord, five to eight of them.
- Do answer in two to three sentences with concrete numbers.
- Do open the first question.
- Do end a question the wiki answers in full with a link there.
- Don't use cards or icons other than the plus and minus in mono.
- Don't hide content every visitor needs behind a disclosure.
