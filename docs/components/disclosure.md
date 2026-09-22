# Disclosure

Folds away settings most visitors do not need.

## When to use

- "Expertenmodus" in an order: build, Java version, start script.
- Wherever everything inside has a working default, so nobody has to open it to order.

## When not to use

- For required fields, or to make a long form look shorter.
- For a question and its answer on a public page. That is `z-faq`, which has no border because it
  holds no controls.

## Import

```ts
import { ZDisclosure } from 'zenit-ui';
```

## API

Selector: `z-disclosure`

| Input     | Type      | Default | Description                                                      |
| --------- | --------- | ------- | ---------------------------------------------------------------- |
| `title`   | `string`  | `''`    | Name of the section in the `<summary>`.                          |
| `summary` | `string`  | `''`    | What is inside, in keywords. Empty renders nothing.              |
| `titleMono` | `boolean` | `false` | Sets the title in the mono face, in a `span.z-mono` inside the `<summary>`, for a section named by an endpoint or a key. Boolean attribute. |
| `open`    | `boolean` | `false` | Whether it is open, two-way bindable through `[(open)]`.         |

| Output       | Payload   | Fires when                                                  |
| ------------ | --------- | ----------------------------------------------------------- |
| `openChange` | `boolean` | the visitor toggles it, through the native `toggle` event   |

Slot: the content is the fields.

## Examples

Closed by default, with the short line naming what is inside:

```html
<z-disclosure title="Expertenmodus" summary="Build, Java-Version, Startscript">
  <z-field label="Java-Version" for="d-java">
    <z-combobox inputId="d-java" [options]="javaVersionen" [(value)]="java" />
  </z-field>
  <z-field label="Startparameter" for="d-args">
    <input zInput mono id="d-args" [value]="args()" />
  </z-field>
</z-disclosure>
```

Once something inside is changed, the short line says so, and the caller can open or close it:

```html
<z-disclosure title="Expertenmodus" [summary]="expertenZeile()" [(open)]="expertenOffen">…</z-disclosure>
```

```ts
protected readonly expertenZeile = computed(() =>
  [this.build() || 'neuester Build', this.javaLabel(), this.start() || 'Standard-Startscript'].join(', '),
);
```

A section named by an endpoint, the title in mono:

```html
<z-disclosure title="GET /api/v1/gameservers" summary="Liste deiner Server" titleMono>
  <p>Antwort 200 mit Status, Adresse und Tarif je Server.</p>
</z-disclosure>
```

## States

| State  | How it looks                                                      | How to trigger it        |
| ------ | ----------------------------------------------------------------- | ------------------------ |
| Closed | title, short line, "+" in mono at the right                       | default                  |
| Open   | the body below a 1px line, "−" in mono                            | click, Enter, `[(open)]` |
| Focus  | 2px ring in `focus` with 2px offset on the `<summary>`            | Tab                      |

There is no loading, error or disabled state. A field inside carries those.

## Accessibility

Native `<details>` and `<summary>`: opening and closing work without JavaScript, the disclosure is
reachable by keyboard and announced with its expanded state, and the component adds no keyboard
handling of its own. The `title` input is kept off the host, so the browser hangs no tooltip of its
own on the whole block.

With `titleMono` the title stands in a `span.z-mono` inside the `<summary>`. The span has no role,
so the `<summary>` keeps the title and the short line as its accessible name, exactly as without the
option. Nothing interactive goes into the `<summary>`; that is why this is an option and not a slot.

## Responsive

The summary is 48px tall at every width, which already meets the mobile minimum. The body is a grid
that reflows by itself.

## Rendered classes and tokens

| Class                 | Applies when           |
| --------------------- | ---------------------- |
| `z-disclosure`        | on the `<details>`     |
| `z-disclosure__body`  | on the content wrapper |
| `z-mono`              | on the title span, with `titleMono` |

Tokens: `--border` for the frame and the divider, `--surface` for the fill, `--text-muted` for the
short line and the sign, `--radius-md`, `--font-mono` for "+" and "−", `--space-3` and `--space-4`
for the padding.

## Deviations from the reference

None.

## Do / Don't

- Do give everything inside a working default.
- Do update the short line when something inside changes ("Java 21, eigene Startparameter").
- Don't put required fields in it.
- Don't use it to make a long form look shorter.
