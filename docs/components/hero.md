# Hero

Opens a public page: one statement, one sentence, at most two buttons and a real piece of the
product on the right.

## When to use

- As the first element of a public page. Exactly one per page, because its `<h1>` is the page
  heading.

## When not to use

- In the customer area. That is `z-page-header`.
- With an illustration on the right. The right column shows a price list, the configurator or a
  screenshot of the panel.

## Import

```ts
import { ZHero, ZHeroActions, ZHeroAside } from 'zenit-ui';
```

## API

### `z-hero`

| Input          | Type          | Default | Description                                                                                             |
| -------------- | ------------- | ------- | ------------------------------------------------------------------------------------------------------- |
| `title`        | `string`      | `''`    | The heading of the page: what there is and where it comes from. One colour throughout.                  |
| `lead`         | `string`      | `''`    | One sentence with the three strongest facts (process, hardware, price). Empty leaves the paragraph out. |
| `note`         | `string`      | `''`    | One line with at most three promises, separated by middle dots. Empty leaves the line out.              |
| `headingLevel` | `1 \| 2 \| 3` | `1`     | Tag of the heading. The visual size never changes with it.                                              |
| `size`         | `'xl' \| 'lg'` | `'xl'` | Type size of the heading: `display-xl` (56px) or `display-lg` (40px). Independent of `headingLevel`.    |

`headingLevel` stays at `1` on a public page, where the hero is the page heading. Lower it only
where the page already owns its `<h1>`, for example on a component page that shows a hero as an
example: two `<h1>` in one document is the thing it prevents. `headingLevel="2"` as a static
attribute works, the string is coerced to a number.

**Subpages.** `size="xl"` belongs to the start page and to `/minecraft`; every other public page
takes `size="lg"` and usually leaves the right column out, which is what
`spec/components/Hero/README.md` asks for. A hero without `[zHeroAside]` is one column at every
width instead of holding an empty 5fr track open above 900px: the rule
`.z-hero:not(:has(> [zHeroAside]))` sets `grid-template-columns: minmax(0, 1fr)`. Nothing else
changes with it, and the lead keeps its own 52 character measure, so the heading runs the full
container width while the sentence below it stays readable. The two sizes are the two steps the
heading already has:
`lg` renders at every width what `xl` renders below 640px (40px/44px, `letter-spacing: -0.02em`),
and below 640px both are the same size, so `lg` never grows on a phone. The size is a class on the
host, `z-hero--lg`, and is independent of `headingLevel`: the tag says where the heading sits in the
outline, the size says how big it is.

No outputs. Content projection:

| Slot             | Where it lands                             |
| ---------------- | ------------------------------------------ |
| `[zHeroActions]` | between the lead and the note, left column |
| `[zHeroAside]`   | the right column                           |

### `[zHeroActions]`

Marker directive for the at most two buttons, one `primary` in size `lg` and optionally one
`secondary`. It adds the class `z-hero__actions`.

### `[zHeroAside]`

Pure slot marker for the right column. It adds no class and no markup. Sub-pages often leave it
out, and leaving it out is what switches the hero to a single column.

## Examples

The start page, with the price list as the right column:

```html
<z-hero
  title="Gameserver aus Nürnberg. In etwa 60 Sekunden online."
  lead="Spiel wählen, RAM einstellen, starten. Ab 1,98 € im Monat, monatlich kündbar."
  note="Keine Kreditkarte nötig · DDoS-Schutz inklusive · Monatlich kündbar"
>
  <div zHeroActions>
    <button zBtn="primary" size="lg" type="button">Server erstellen</button>
    <button zBtn="secondary" size="lg" type="button">Preis berechnen</button>
  </div>
  <z-panel zHeroAside title="Günstigste Spiele" flush>
    <z-rows columns="minmax(0, 1fr) 96px">
      <div zRow>
        <z-row-main title="Minecraft" />
        <span zRowNum>1,98&nbsp;€</span>
      </div>
    </z-rows>
  </z-panel>
</z-hero>
```

A hero as an example on a page that already owns its `<h1>`:

```html
<h1 class="heading-1">Werkzeuge</h1>
<z-hero headingLevel="2" title="Gameserver aus Nürnberg. In etwa 60 Sekunden online." />
```

A sub-page, single column and with one action:

```html
<z-hero
  size="lg"
  title="Hardware und Plattform"
  lead="AMD Ryzen 9 7950X, NVMe-Speicher und 1 Gbit/s Anbindung in Nürnberg."
>
  <div zHeroActions>
    <button zBtn="primary" size="lg" type="button">Server erstellen</button>
  </div>
</z-hero>
```

A logged-in visitor sees one button and no second call to action:

```html
<z-hero title="Gameserver aus Nürnberg." lead="Dein Server läuft. Schau im Panel nach.">
  <div zHeroActions>
    <a zBtn="primary" size="lg" routerLink="/user">Zum Dashboard</a>
  </div>
</z-hero>
```

With the configurator as the right column:

```html
<z-hero title="Preis berechnen" lead="Spiel, Arbeitsspeicher und Laufzeit bestimmen den Preis.">
  <z-price-summary
    zHeroAside
    label="Minecraft, monatlich"
    price="5,40&nbsp;€"
    period="/ Monat"
    [lines]="posten"
  >
    <button zBtn="primary" block type="button">Server erstellen</button>
  </z-price-summary>
</z-hero>
```

## States

The hero is static: rest only. It has no hover, focus, disabled, loading, error or empty state. The
buttons inside it and the panel in the right column bring their own.

## Accessibility

- `title` is the page `<h1>`. There is exactly one hero per page for that reason. Where the page
  already has an `<h1>`, `headingLevel` lowers the hero to `<h2>` or `<h3>` so the document keeps
  one `<h1>` and the outline stays in order.
- The lead is a `<p>` right after the heading, and the note another one after the actions, so the
  order in the DOM matches the reading order.
- The heading has one colour throughout; the second line is never tinted.
- The native `title` attribute is cleared on the host, so the `title` input never turns into a
  browser tooltip over the whole hero.

## Responsive

Two columns in a 7 to 5 ratio while `[zHeroAside]` is there, single column at every width without
it, and single column below 900px in both cases, where the vertical padding drops from
`space-9` to `space-8`. Below 640px the heading drops from `display-xl` (56px) to `display-lg`
(40px) and the lead from 20px to 16px. The size sits in `z-hero__title` and does not follow
`headingLevel`. With `size="lg"` the heading is at `display-lg` from the start and stays there
below 640px; the lead still drops to 16px. The height comes from the content; there is no `100vh`
and no background image.

## Rendered classes and tokens

| Class             | Applies when                    |
| ----------------- | ------------------------------- |
| `z-hero`          | on the host, always             |
| `z-hero--lg`      | on the host, `size="lg"`        |
| `z-hero__title`   | on the heading, always          |
| `z-hero__lead`    | `lead` is not empty             |
| `z-hero__actions` | on the `[zHeroActions]` element |
| `z-hero__note`    | `note` is not empty             |

Tokens: `--space-4` to `--space-9` for the gaps and the vertical padding, `--font-display` for the
heading, `--text-muted` for the lead, `--text-subtle` for the note. The 56px/60px and 40px/44px
heading sizes, the 20px lead and the 52 character lead measure are literal values from the reference
stylesheet.

## Do / Don't

- Do put a real piece of the product in the right column: a price list, the configurator or a
  screenshot of the panel.
- Do keep `display-xl` for the start page and `/minecraft`; sub-pages take `size="lg"` and often no
  right column.
- Do leave `headingLevel` at `1` on a real page and lower it only in a preview.
- Do take prices from the price service; never hard-code them.
- Don't use an illustration, a background image or an animation.
- Don't tint the second line of the heading.
- Don't put more than two buttons in the hero.
