# Setting

One row of a settings list: title, configuration key and effect on the left, the control on the
right.

## When to use

- For server properties in a panel: a list of rows, each with one control.
- Wherever a control needs a name, the key it writes and a sentence on what it does.

## When not to use

- For a form that is submitted as a whole. That is a stack of `z-field` elements.
- As a generic two-column layout. The row is a settings row and nothing else.

## Import

```ts
import { ZSetting } from 'zenit-ui';
```

## API

Selector: `z-setting`

| Input         | Type     | Default | Description                                                                                                                  |
| ------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `title`       | `string` | `''`    | Name of the setting in normal capitalization, without an icon.                                                               |
| `key`         | `string` | `''`    | Configuration key, for example `pvp`. Shown in the mono face below the title; empty renders nothing.                         |
| `description` | `string` | `''`    | One sentence on what the setting does. Empty renders nothing.                                                                |
| `titleId`     | `string` | `''`    | `id` written onto the title, so the control in the row can name itself through `aria-labelledby`. Empty writes no attribute. |

No outputs. Content projection: the default slot is the control, placed to the right of the text
block.

## Examples

A toggle row with key and effect:

```html
<z-setting
  title="PvP"
  key="pvp"
  description="Spieler können sich gegenseitig angreifen."
  titleId="pvp-titel"
>
  <z-toggle [(checked)]="pvp" ariaLabelledby="pvp-titel" />
</z-setting>
```

A row without a key, holding a select:

```html
<z-setting title="Schwierigkeit" description="Gilt für neu geladene Chunks." titleId="diff-titel">
  <z-select size="sm">
    <select aria-labelledby="diff-titel">
      <option>Einfach</option>
      <option>Normal</option>
      <option>Schwer</option>
    </select>
  </z-select>
</z-setting>
```

A row with an input, and one whose control is locked with the reason given:

```html
<z-setting title="Maximale Spieler" key="max-players" titleId="max-titel">
  <input zInput mono size="sm" value="20" aria-labelledby="max-titel" />
</z-setting>

<z-setting
  title="Hardcore"
  key="hardcore"
  description="Lässt sich nur vor dem ersten Start ändern."
  titleId="hc-titel"
>
  <z-toggle disabled ariaLabelledby="hc-titel" />
</z-setting>
```

A row whose change needs a restart, paired with the alert above the list:

```html
<z-alert status="warning" title="2 Änderungen greifen erst nach einem Neustart">
  PvP und maximale Spieler.
  <button zAlertAction zBtn="secondary" size="sm" type="button">Jetzt neu starten</button>
</z-alert>
```

## States

The row itself is static. What has states is the control inside it: hover, focus, checked and
disabled all belong to the toggle, select or input. A locked control keeps its row readable and the
`description` carries the reason.

## Accessibility

- `titleId` puts an `id` on the title. The control in the row points at it, which is how `z-toggle`
  gets its name through `ariaLabelledby` and how a native `<select>` or `<input>` gets one through
  `aria-labelledby`.
- The native `title` attribute is suppressed on the host, so the browser does not hang its own
  tooltip on the whole row because of the `title` input.
- Key and description are plain text, so they are read after the title in document order.

## Responsive

The row is a flex line with `space-4` between text and control and wraps by itself when the text
grows. The control inside it follows its own breakpoints; a `sm` control becomes 40px tall below
640px.

## Rendered classes and tokens

| Class                     | Applies when               |
| ------------------------- | -------------------------- |
| `z-setting`               | always (host)              |
| `z-setting__text`         | always                     |
| `z-setting__title`        | always                     |
| `z-subtle z-mono caption` | `key` is not empty         |
| `z-muted`                 | `description` is not empty |

Tokens: `--space-3` and `--space-4` for padding and gap, `--border` for the 1px line above each row
except the first, `--font-mono` and `--text-subtle` for the key, `--text-muted` for the
description. The 2px gap inside the text block is a literal value from the reference stylesheet.

## Do / Don't

- Do give every row a `titleId` and point the control at it.
- Do put the configuration key in `key`, not in the title.
- Do say in `description` when a change only applies after a restart.
- Don't use capital letters or an icon in the title.
- Don't put more than one control in a row.
