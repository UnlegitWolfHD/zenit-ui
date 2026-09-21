# IncludedList

Lists what every plan includes without a surcharge.

## When to use

- Directly under `z-price-summary`, three to five entries, each one a concrete part of the product.

## When not to use

- For things that are not a part of the product. "Sofort verfügbar" and "Jederzeit kündbar" belong
  in the `note` of the summary.
- More than once per page. The same points never appear again as trust pills in the header.

## Import

```ts
import { ZIncludedList } from 'zenit-ui';
```

## API

Selector: `z-included-list`

| Input   | Type                | Default | Description                                               |
| ------- | ------------------- | ------- | --------------------------------------------------------- |
| `items` | `readonly string[]` | `[]`    | The entries in display order, three to five of them.      |

No outputs, no content projection.

## Examples

```html
<z-included-list
  [items]="[
    'DDoS-Schutz auf Layer 3/4',
    'Webpanel mit Konsole und Dateimanager',
    'Automatische Backups',
    'Support per Ticket und Discord'
  ]"
/>
```

Under the summary, where it belongs:

```html
<div zConfigAside class="z-stack">
  <z-price-summary label="Minecraft, alle 30 Tage" price="7,74 €">…</z-price-summary>
  <z-included-list [items]="enthalten" />
</div>
```

## States

Only the rest state. An empty `items` array renders an empty `<ul>`.

## Accessibility

A real `<ul>` with one `<li>` per entry. The check is a decorative `z-icon` with `aria-hidden`,
because the list item already says that the entry is included; the meaning never rests on the
colour alone.

## Responsive

The lines wrap by themselves; the check stays at the top of the first line. Nothing changes at a
breakpoint.

## Rendered classes and tokens

| Class        | Applies when          |
| ------------ | --------------------- |
| `z-included` | on the `<ul>`         |

Tokens: `--success` for the check, `--text-muted` for the text, `--space-2` for the gaps. The 16px
icon size and its 2px top offset are literal values from the reference stylesheet.

## Deviations from the reference

None.

## Do / Don't

- Do name only things a customer would otherwise expect to pay extra for.
- Do keep it to three to five entries.
- Don't wrap it in a panel or give it a heading in capitals.
- Don't repeat the entries elsewhere on the same page.
