# Segment

Switches the view on the same data, with at most four options.

## When to use

- The period in the billing view, open versus closed in support, a filter on a list of suggestions.
- Wherever the options are meant to be compared and all of them fit on one line.

## When not to use

- For sub-pages that each have their own URL. That is `nav[zTabs]` with `a[zTab]`.
- For more than four options, or for options that do not fit next to each other. That is
  `z-select`.

## Import

```ts
import { ZSegment, ZSegmentOption } from 'zenit-ui';
```

## API

Selector: `z-segment`

| Input       | Type                        | Default | Description                                                                                                                  |
| ----------- | --------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `options`   | `readonly ZSegmentOption[]` | `[]`    | The options in display order, at most four. Tracked by `value`, which has to be unique.                                      |
| `value`     | `string`                    | `''`    | The chosen option's `value`, two-way bindable through `[(value)]`. A value matching no option leaves every button unpressed. |
| `ariaLabel` | `string`                    | `''`    | Accessible name of the group. Empty means no `aria-label` at all.                                                            |
| `disabled`  | `boolean`                   | `false` | Disables every button. Independent of the disabled state from forms. Boolean attribute.                                      |

| Output        | Payload  | Fires when                                          |
| ------------- | -------- | --------------------------------------------------- |
| `valueChange` | `string` | another option is clicked (the `model()` companion) |

`ZSegmentOption` is `{ value: string; label: string }`: `value` is what the segment reports and the
tracking key, `label` the short noun on the button, without an icon.

Forms: has the shape of a Signal Forms `FormValueControl<string>`, so `[formField]` works and feeds
`disabled`. There is no `invalid` input: `role="group"` does not take `aria-invalid`. See [Forms](../forms.md) for the three ways to bind it.

No content projection. Forms: implements `ControlValueAccessor`, so `ngModel` and `formControl`
work alongside the two-way binding. A `null` or `undefined` value becomes the empty string, which
selects nothing.

## Examples

The period in the price calculator:

```html
<z-segment
  [options]="[
    { value: '1', label: '1 Monat' },
    { value: '12', label: '12 Monate' }
  ]"
  [(value)]="zeitraum"
  ariaLabel="Zeitraum"
/>
```

Three filters over a ticket list, with the options in the component:

```ts
import { ZSegmentOption } from 'zenit-ui';

const filter: ZSegmentOption[] = [
  { value: 'offen', label: 'Offen' },
  { value: 'wartet', label: 'Wartet' },
  { value: 'zu', label: 'Geschlossen' },
];
```

```html
<z-segment [options]="filter" [(value)]="status" ariaLabel="Ticketstatus" />
```

With reactive forms, and locked while a list is loading:

```html
<z-segment [options]="filter" [formControl]="statusControl" ariaLabel="Ticketstatus" />
<z-segment [options]="filter" [(ngModel)]="status" ariaLabel="Ticketstatus" [disabled]="laedt()" />
```

## States

| State    | How it looks                                               | How to trigger it                            |
| -------- | ---------------------------------------------------------- | -------------------------------------------- |
| Rest     | buttons in `text-muted` on the bare group frame            | default                                      |
| Hover    | the hovered button's text moves to `text`                  | pointer over a button                        |
| Focus    | 2px ring in `focus` with 2px offset on that button         | Tab, `:focus-visible`                        |
| Selected | `surface-hover` fill, text `text`, `aria-pressed="true"`   | click, Enter or Space, or `[(value)]`        |
| Disabled | 45 percent opacity, `cursor: not-allowed`, no hover colour | `disabled`, or the form disables the control |

There is no loading, error or empty state. An empty `options` array renders an empty group.

## Accessibility

- The host is a `role="group"` named by `ariaLabel`. Give every segment a name; the page usually
  has more than one.
- An `aria-label` written on `<z-segment>` itself works as well, static or bound: `ariaLabel` wins
  while it holds a value, and the attribute stands while it does not. `aria-labelledby` is never
  written by the component, so it always belongs to you.
- The chosen option carries `aria-pressed="true"`, all others `"false"`, so the state is announced
  either way.
- Every button is an ordinary tab stop: Tab moves between them, Enter or Space picks one. There is
  no roving tab index, because a segment is a group of toggle buttons and not a tab list.
- While disabled every button is `disabled` and therefore out of the tab order.

## Responsive

Below 640px each button grows from 28px to 40px tall, so the click targets meet the minimum. The
group keeps its inline width and does not wrap; with four options at 360px keep the labels to one
short noun each.

## Rendered classes and tokens

| Class       | Applies when  |
| ----------- | ------------- |
| `z-segment` | always (host) |

The buttons inside are styled through `.z-segment button` and
`.z-segment button[aria-pressed="true"]`. Tokens: `--border` for the 1px frame, `--radius-md` for
the group and `--radius-sm` for a button, `--text-muted` and `--text` for the labels,
`--surface-hover` for the selected fill, `--focus` for the ring, `--control-md` for the mobile
height. The 28px button height, the 2px padding and the 12px type are literal values from the
reference stylesheet.

## Deviations from the reference

- Addition to the library: a disabled button follows checkbox, toggle and button with 45 percent
  opacity and `cursor: not-allowed`, and its hover holds its colour while the chosen view keeps its
  text.
- Addition to the reference: below 640px a segment button is raised to 40px, because click targets
  are at least 40px tall on mobile.

## Do / Don't

- Do keep the labels to one short noun each, without icons.
- Do give the group an `ariaLabel`.
- Do preselect a value, so the group is never fully unpressed.
- Don't use a segment for sub-pages with their own URL.
- Don't go past four options; use a select instead.
- Don't fill the selected option red; the selected surface is `surface-hover`.
