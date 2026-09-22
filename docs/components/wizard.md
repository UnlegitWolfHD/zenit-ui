# Wizard

Leads through an order in a few steps, with the summary next to it.

## When to use

- An order with two to four steps that build on one another: Inhalt, Größe, Bezahlen.
- Wherever a later step only makes sense once the earlier ones are decided.

## When not to use

- On a public page. There the same controls stand under one another in one form, with the summary
  next to them, in the same two-column frame: [Config](config.md).
- For more than four steps. Fold them together instead.
- To show where you are in a flow the page does not own. That is `z-stepper`.

## Import

```ts
import { ZConfig, ZConfigAside, ZWizard, ZWizardActions, ZWizardStep } from 'zenit-ui';
```

## API

Selectors: `z-wizard`, `z-wizard-step`, `z-config`, `[zConfigAside]`, `[zWizardActions]`

`z-wizard` takes no inputs. It projects the steps and numbers them itself.

| Input of `z-wizard-step` | Type                                | Default    | Description                                              |
| ------------------------ | ----------------------------------- | ---------- | -------------------------------------------------------- |
| `title`                  | `string`                            | `''`       | One noun. Also the accessible name of the change button. |
| `summary`                | `string`                            | `''`       | What the step decided, or what is still to come.         |
| `state`                  | `'done' \| 'current' \| 'locked'`   | `'locked'` | Collapsed, open, or locked without a body.               |
| `headingLevel`           | `2 \| 3 \| 4`                       | `3`        | Tag of the title. The visual size never changes with it. |
| `editLabel`              | `string`                            | `''`       | Caption of the change button. Empty falls back to `wizardEdit`. |

| Output of `z-wizard-step` | Payload | Fires when                             |
| ------------------------- | ------- | -------------------------------------- |
| `edit`                    | `void`  | the "Ändern" button of a done step is pressed |

Slots: the content of `z-wizard-step` is the fields of that step; every projected
`[zWizardActions]` element goes into `.z-wstep__actions` as the last row. `z-config` projects the
form and the `[zConfigAside]` element.

## Examples

The three steps, with the summary next to them:

```html
<z-config>
  <z-wizard>
    <z-wizard-step
      title="Inhalt"
      summary="Vanilla, neueste Version"
      [state]="zustand(1)"
      (edit)="geheZu(1)"
    >
      <z-option-group legend="Server-Typ" [options]="typen" [(value)]="typ" />
      <button zWizardActions zBtn="secondary" type="button" (click)="geheZu(2)">
        Weiter zu Größe
      </button>
    </z-wizard-step>

    <z-wizard-step title="Größe" [state]="zustand(2)" (edit)="geheZu(2)">
      <z-option-group legend="Arbeitsspeicher" compact [options]="stufen" [(value)]="ramGb" />
      <button zWizardActions zBtn="ghost" type="button" (click)="geheZu(1)">Zurück</button>
      <button zWizardActions zBtn="secondary" type="button" (click)="geheZu(3)">
        Weiter zu Bezahlen
      </button>
    </z-wizard-step>
  </z-wizard>

  <div zConfigAside>
    <z-price-summary label="Minecraft, alle 30 Tage" price="7,74 €" [lines]="posten">
      <button zBtn="primary" block type="button" [disabled]="!bestellbar()">
        Kostenpflichtig bestellen
      </button>
    </z-price-summary>
  </div>
</z-config>
```

The state of a step is derived, never stored twice:

```ts
protected zustand(nummer: number): 'done' | 'current' | 'locked' {
  if (nummer === this.schritt()) {
    return 'current';
  }
  return nummer < this.schritt() ? 'done' : 'locked';
}
```

After "Weiter" or "Ändern" the focus goes to the title of the step that is open now:

```ts
protected geheZu(nummer: number): void {
  this.schritt.set(nummer);
  afterNextRender(
    () => {
      const titel = this.host.nativeElement.querySelector<HTMLElement>(
        '[aria-current="step"] .z-wstep__title',
      );
      titel?.focus();
      titel?.scrollIntoView({ block: 'start' });
    },
    { injector: this.injector },
  );
}
```

## States

| State     | How it looks                                                             | How to trigger it  |
| --------- | ------------------------------------------------------------------------ | ------------------ |
| `done`    | collapsed, summary right, "Ändern" in `accent-text`, number on `surface-hover` | `state="done"`     |
| `current` | open, `aria-current="step"`, number filled in `text` on `bg`             | `state="current"`  |
| `locked`  | head in `text-muted`, title not bold, no body at all                     | `state="locked"`   |

There is no loading or error state on a step. An error belongs on the field inside it; the price
state belongs on `z-price-summary`.

## Accessibility

- `z-wizard` is a `role="list"` and every step a `role="listitem"` — what the `<ol>` and `<li>` of
  the reference stand for. The current step carries `aria-current="step"`.
- A locked step renders no body, so nothing in it can be reached by Tab. Locking is not a visual
  effect.
- The title carries `tabindex="-1"`, so the caller can move the focus onto it after "Weiter" or
  "Ändern". That is what makes the keyboard follow the content.
- Every "Ändern" button reads differently, because its accessible name is built from the visible
  caption and the title of the step through `aria-labelledby`. The spoken name therefore starts
  with the written one (WCAG 2.5.3) even when `editLabel` renames the button.

## Responsive

`z-config` is one column and becomes `1fr 340px` from 900px on, where `[zConfigAside]` sticks at
`header + space-5`; its own page is [Config](config.md). Below that the summary stands under the
wizard, and a `z-sticky-bar` keeps price and next step in view. Below 640px the "Ändern" button is
raised to 40px.

## Rendered classes and tokens

| Class                     | Applies when                       |
| ------------------------- | ---------------------------------- |
| `z-wizard`                | always (host of `z-wizard`)        |
| `z-wstep`                 | always (host of `z-wizard-step`)   |
| `z-wstep--done`           | `state="done"`                     |
| `z-wstep--locked`         | `state="locked"`                   |
| `z-wstep__head`           | number, title, summary, "Ändern"   |
| `z-wstep__title`          | the heading                        |
| `z-wstep__summary`        | the short line                     |
| `z-wstep__edit`           | the change button                  |
| `z-wstep__body`           | the fields of the current step     |
| `z-wstep__actions`        | the row of projected actions       |
| `z-config`, `z-config__aside` | the layout around it           |

Tokens: `--border` for the frames, `--surface` for the step, `--surface-hover` and `--text` for the
number, `--text-muted` for a locked head, `--accent-text` for "Ändern", `--header` and `--space-5`
for the sticky offset, `--radius-md`. 340px and the 900px breakpoint are literal values from the
reference stylesheet.

## Deviations from the reference

- Addition to the reference: `.z-wstep__actions:empty` is hidden, because the action row is a slot
  and a step without actions would otherwise spend the `space-5` gap of the body on an empty div.
- Addition to the reference: a single action is pushed to the right with `margin-inline-start:
  auto`, and a single ghost action stays on the left, so a step with only "Weiter" or only
  "Zurück" needs no spacer element.
- Addition to the reference: below 640px `.z-wstep__edit` is at least `--control-md` tall.

## Do / Don't

- Do start every step with defaults that are valid and orderable.
- Do give a done step a short summary a visitor recognises ("Vanilla, neueste Version").
- Do keep "Weiter" secondary; the one primary of the page is in the summary.
- Don't go past four steps, and don't add a separate progress list next to the wizard.
- Don't render a locked step's fields and hide them; render nothing.
- Don't put validation errors in the summary.
