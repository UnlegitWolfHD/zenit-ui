# SpecList

Facts as term and value pairs.

## When to use

- On public pages, wherever a set of facts belongs: hardware, plattform, what is included.
- In a server panel, for the settings of an object that are read but not edited there.
- As the replacement for metric tiles, chip clouds and feature cards.

## When not to use

- For live figures with a usage bar in the customer area. That is `z-metrics` with `z-metric`.
- For a list with bulk actions or sorting. That is `table[zTable]`.

## Import

```ts
import { ZSpecList, ZSpecItem } from 'zenit-ui';
```

## API

Selector: `z-spec-list`

| Input   | Type          | Default | Description                                                                                                              |
| ------- | ------------- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| `items` | `ZSpecItem[]` | `[]`    | The facts in display order. Tracked by index, so reordering re-renders the rows. An empty array renders an empty `<dl>`. |

No outputs, no content projection, no forms support.

`ZSpecItem`:

| Field   | Type      | Description                                                                                                                |
| ------- | --------- | -------------------------------------------------------------------------------------------------------------------------- |
| `term`  | `string`  | Short term, rendered as the `<dt>`.                                                                                        |
| `value` | `string`  | The concrete value, rendered as the `<dd>`.                                                                                |
| `note`  | `string`  | Addition after the value, rendered in a `<small>`. Optional.                                                               |
| `mono`  | `boolean` | Sets the value in the mono face. Use it for addresses, ports, sizes and configuration keys. Optional, defaults to `false`. |

## Examples

Hardware facts on a public page:

```html
<z-spec-list [items]="technik" />
```

```ts
import { ZSpecItem } from 'zenit-ui';

const technik: ZSpecItem[] = [
  { term: 'CPU', value: 'AMD Ryzen 9 7950X', note: '16\u00a0Kerne, 4,5\u00a0GHz' },
  { term: 'Speicher', value: 'DDR5 ECC' },
  { term: 'Datenträger', value: 'NVMe SSD' },
  { term: 'Anbindung', value: '1 Gbit/s', mono: true },
  { term: 'Standort', value: 'Nürnberg', note: 'Rechenzentrum Hetzner' },
];
```

Inline, when the list is short and fixed:

```html
<z-spec-list
  [items]="[
    { term: 'Adresse', value: '203.0.113.10:25565', mono: true },
    { term: 'Loader', value: 'PaperMC 26.3', mono: true },
    { term: 'Welt', value: 'Beispielwelt', note: '1,4 GB' }
  ]"
/>
```

Inside a panel in the server panel:

```html
<z-panel title="Einstellungen">
  <z-spec-list [items]="einstellungen()" />
</z-panel>
```

In a public section, which is a stack of heading and list without a panel:

```html
<section class="z-section">
  <h2 class="heading-1">Hardware und Plattform</h2>
  <z-spec-list [items]="technik" />
</section>
```

## States

The list is static: rest only. It has no hover, focus, disabled, loading or empty state; an empty
`items` array simply renders an empty `<dl>`, and a page that has no facts leaves the list out.

## Accessibility

- The markup is a `<dl>` with one `<dt>`/`<dd>` pair per entry, which ties every value to its term
  for assistive technology.
- There are no icons, so nothing has to be hidden.
- `note` sits in a `<small>` after the value, so it is read as part of that value.
- A fact appears exactly once per page; repeating it in three places is what the list is meant to
  replace.

## Responsive

Two columns above 480px: the term between 120px and 200px wide, the value filling the rest. Below
480px the value moves under the term and loses its own top border, so the pairs stay together.

## Rendered classes and tokens

| Class    | Applies when                 |
| -------- | ---------------------------- |
| `z-spec` | on the `<dl>`, always        |
| `z-mono` | on a value with `mono: true` |

Tokens: `--space-2` and `--space-3` for the padding and the note gap, `--border` for the 1px lines
between the rows, `--text-muted` for the terms, `--text-subtle` for the notes, `--font-mono` for a
mono value. The 120 to 200px term column and the 12px note type are literal values from the
reference stylesheet.

## Do / Don't

- Do set `mono: true` on addresses, ports, sizes and configuration keys.
- Do keep a fact to one place on the page.
- Do use short terms and concrete values with units.
- Don't put icons or cards around the rows; they are separated by 1px lines.
- Don't use a spec list for marketing numbers presented as tiles.
