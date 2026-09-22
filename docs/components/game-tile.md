# GameTile

Selects a game in the price calculator, on the start page, under `/preise` and in the order
assistant.

## When to use

- In a grid of games the visitor picks from, with the cheapest one preselected on load.

## When not to use

- As a link to a game's page. A tile is a toggle button that changes the calculator, not navigation.
- For more than about 15 games without a search field above the grid.

## Import

```ts
import { ZGameGrid, ZGameTile } from 'zenit-ui';
```

## API

### `z-game-grid`

No inputs, no outputs. The grid: `auto-fill` from 128px width, so the number of columns follows the
available space. The content is the tiles.

### `button[zGameTile]`

| Input      | Type      | Default | Description                                                                                                   |
| ---------- | --------- | ------- | ------------------------------------------------------------------------------------------------------------- |
| `title`    | `string`  | `''`    | Name of the game. Stands below the cover and, without a `cover`, as the text fallback on the cover area.      |
| `price`    | `string`  | `''`    | Starting price including the period, for example "ab 1,98 € / Monat", shown in the mono face below the title. |
| `cover`    | `string`  | `''`    | `src` of the cover image in 3:4 format. Empty shows the title as text on the cover area instead.              |
| `selected` | `boolean` | `false` | Marks the tile as the chosen game. Boolean attribute.                                                         |

| Output         | Type   | Description                                                                              |
| -------------- | ------ | ---------------------------------------------------------------------------------------- |
| `(coverError)` | `void` | The `cover` failed to load. The tile has already switched to the text fallback by then.  |

The selection itself is the native `(click)` event. The element renders its own content, so the
tag stays empty in your template.

A cover that 404s needs no handling: the tile drops into the text fallback of a missing cover, so
no broken-image icon is ever shown. `(coverError)` is there to log the dead URL, and it fires once
per URL — a new `cover` is tried again.

The host gets `type="button"`, so a tile inside a form does not submit it; a static `type` written
by the caller stays.

## Examples

A grid with the cheapest game preselected:

```html
<z-game-grid>
  <button
    zGameTile
    title="Minecraft"
    price="ab 1,98 € / Monat"
    cover="/covers/minecraft.jpg"
    [selected]="spiel() === 'minecraft'"
    (click)="spiel.set('minecraft')"
  ></button>
  <button
    zGameTile
    title="Valheim"
    price="ab 3,98 € / Monat"
    cover="/covers/valheim.jpg"
    [selected]="spiel() === 'valheim'"
    (click)="spiel.set('valheim')"
  ></button>
  <button
    zGameTile
    title="Rust"
    price="ab 4,98 € / Monat"
    [selected]="spiel() === 'rust'"
    (click)="spiel.set('rust')"
  ></button>
</z-game-grid>
```

Without a cover, which shows the name in the `display` face on the cover area:

```html
<button zGameTile title="GTA V" price="ab 6,98 € / Monat" (click)="spiel.set('gta')"></button>
```

The same fallback when the cover is gone, with the dead URL logged:

```html
<button
  zGameTile
  title="Rust"
  price="ab 4,98 € / Monat"
  cover="/covers/rust.jpg"
  (coverError)="melde('/covers/rust.jpg')"
></button>
```

Rendered from a list, with the price coming from the price service:

```html
<z-game-grid>
  @for (s of spiele(); track s.id) {
  <button
    zGameTile
    [title]="s.name"
    [price]="s.abPreis"
    [cover]="s.cover"
    [selected]="spiel() === s.id"
    (click)="spiel.set(s.id)"
  ></button>
  }
</z-game-grid>
```

Next to the summary the selection feeds:

```html
<z-game-grid>
  <button zGameTile title="Minecraft" price="ab 1,98 € / Monat" selected></button>
</z-game-grid>
<z-price-summary label="Minecraft, monatlich" price="5,40&nbsp;€" period="/ Monat">
  <button zBtn="primary" block type="button">Server erstellen</button>
</z-price-summary>
```

## States

| State        | How it looks                                             | How to trigger it            |
| ------------ | -------------------------------------------------------- | ---------------------------- |
| Rest         | cover area with a 1px `border` outline                   | default                      |
| Hover        | outline moves to `border-control`                        | pointer over the tile        |
| Focus        | 2px ring in `focus` with 2px offset                      | Tab, `:focus-visible`        |
| Selected     | 2px outline in `accent-text`, `aria-pressed="true"`      | `selected`                   |
| Cover failed | the title in `display` on the cover area, no `<img>`     | the `cover` URL fails to load |

There is no disabled, loading or empty state. A game that cannot be ordered is left out of the
grid. Selecting a tile changes nothing visually beyond the outline: no glow, no scaling. "Cover
failed" is the same rendering as a tile without a cover, so the grid keeps its rhythm, and it also
reports `(coverError)`.

## Accessibility

- The tile is a toggle button and always carries `aria-pressed`, `"true"` when selected and
  `"false"` otherwise, so the state is announced either way.
- The cover image has an empty `alt`, because the title stands right below it as text. A failed
  cover leaves role and state alone — the tile stays a toggle button with `aria-pressed` — and its
  accessible name becomes, character for character, the name of a tile without a cover: the text
  fallback is visible text inside the button, so the title is part of the name twice ("Rust Rust ab
  4,98 € / Monat"). An `alt=""` never contributed to the name in the first place, which is why the
  name of a tile whose cover loads is the shorter "Rust ab 4,98 € / Monat".
- The native `title` attribute is suppressed on the host, so the browser shows no tooltip of its own
  because of the `title` input.
- Title and price are visible text, so the accessible name of a tile with a cover is "Minecraft ab
  1,98 € / Monat", which is what a screen reader should hear.

## Responsive

The grid is `auto-fill` from 128px per column with `space-4` between the tiles, so the number of
columns follows the available width down to 360px without a media query. The cover keeps its 3:4
aspect ratio at every size.

## Rendered classes and tokens

| Class           | Applies when     |
| --------------- | ---------------- |
| `z-games`       | on the grid host |
| `z-game`        | on each tile     |
| `z-game__cover` | inside each tile |
| `z-game__title` | inside each tile |
| `z-game__price` | inside each tile |

Tokens: `--space-2` to `--space-4` for the gaps, `--radius-md` for the cover, `--surface-raised`
for the cover area, `--border` and `--border-control` for the outline, `--accent-text` for the
selected outline, `--font-display` for the text fallback, `--text-muted` for it and for the price,
`--font-mono` for the price, `--focus` for the ring. The 128px column minimum, the 3:4 ratio and the
16px fallback type are literal values from the reference stylesheet.

## Do / Don't

- Do preselect the cheapest game on load, so the summary is never empty.
- Do give the price with its period ("ab 1,98 € / Monat").
- Do put a search field above the grid from about 15 games on.
- Don't put the title and the price on the cover image.
- Don't add a glow or a scale on selection; it is a 2px line in `accent-text`.
- Don't use a gamepad placeholder; the fallback is the game's name in `display`.
