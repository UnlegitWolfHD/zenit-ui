# GameTile

Selects a game in the price calculator, on the start page, under `/preise` and in the order
assistant, or, as a link, leads to the page of a game.

## When to use

- `button[zGameTile]`: in a grid of games the visitor picks from, with the cheapest one preselected
  on load. The click changes something on the same page, a calculator or a summary.
- `a[zGameTile]`: in a grid of games where each tile leads somewhere else, for example to the order
  of that game (`/user/games/create?game=minecraft`). It is a real link with an `href`: it opens in a
  new tab, shows its target and is crawled.

## When not to use

- A button tile for navigation, or a link tile for a selection. The first hides the target from
  crawlers and from "open in new tab", the second reloads or leaves a page that only had to change a
  value.
- For more than about 15 games without a search field above the grid.

## Import

```ts
import { ZGameGrid, ZGameTile, ZGameTileLink } from 'zenit-ui';
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

| Output         | Type   | Description                                                                             |
| -------------- | ------ | --------------------------------------------------------------------------------------- |
| `(coverError)` | `void` | The `cover` failed to load. The tile has already switched to the text fallback by then. |

The selection itself is the native `(click)` event. The element renders its own content, so the
tag stays empty in your template.

A cover that 404s needs no handling: the tile drops into the text fallback of a missing cover, so
no broken-image icon is ever shown. `(coverError)` is there to log the dead URL, and it fires once
per URL — a new `cover` is tried again.

The host gets `type="button"`, so a tile inside a form does not submit it; a static `type` written
by the caller stays.

### `a[zGameTile]`

| Input   | Type     | Default | Description                                                                                                   |
| ------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------- |
| `title` | `string` | `''`    | Name of the game. Stands below the cover and, without a `cover`, as the text fallback on the cover area.      |
| `price` | `string` | `''`    | Starting price including the period, for example "ab 1,98 € / Monat", shown in the mono face below the title. |
| `cover` | `string` | `''`    | `src` of the cover image in 3:4 format. Empty shows the title as text on the cover area instead.              |

| Output         | Type   | Description                                                                             |
| -------------- | ------ | --------------------------------------------------------------------------------------- |
| `(coverError)` | `void` | The `cover` failed to load. The tile has already switched to the text fallback by then. |

The same tile on an `<a>`: same class, same cover area with the same fallback, same hover and focus
ring. There is no `selected` and no `aria-pressed`, because a link navigates and does not toggle.
The target is yours: `href`, or `routerLink` with `queryParams`, on the same element. The component
binds neither, so the library needs no router, and the host writes no `type` and no `role`.

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

Tiles that lead to the order of each game, with the target as a router link:

```html
<z-game-grid>
  @for (s of spiele(); track s.slug) {
  <a
    zGameTile
    [title]="s.name"
    [price]="s.abPreis"
    [cover]="s.cover"
    routerLink="/user/games/create"
    [queryParams]="{ game: s.slug }"
  ></a>
  }
</z-game-grid>
```

The same with a plain `href`, for a page without the router:

```html
<a zGameTile title="Rust" price="ab 4,98 € / Monat" href="/spiele/rust"></a>
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

| State        | How it looks                                           | How to trigger it              |
| ------------ | ------------------------------------------------------ | ------------------------------ |
| Rest         | cover area with a 1px `border` outline                 | default                        |
| Hover        | outline moves to `border-control`                      | pointer over the tile          |
| Focus        | 2px ring in `focus` with 2px offset                    | Tab, `:focus-visible`          |
| Selected     | 2px outline in `accent-text`, `aria-pressed="true"`    | `selected`, button only        |
| Cover failed | the title in `display` on the cover area, no `<img>`   | the `cover` URL fails to load  |
| Loading      | `<z-skeleton tile />` in place of each tile, same cell | `z-game-grid` with `aria-busy` |

There is no disabled or empty state, and the tile has no loading state of its own: while the games
load, the grid holds `z-skeleton tile` placeholders, which take exactly the cell of a tile (see
[Skeleton](skeleton.md)). A game that cannot be ordered is left out of the
grid. Selecting a tile changes nothing visually beyond the outline: no glow, no scaling. "Cover
failed" is the same rendering as a tile without a cover, so the grid keeps its rhythm, and it also
reports `(coverError)`.

## Accessibility

- `a[zGameTile]` is a link, announced as "Link, Minecraft ab 1,98 € / Monat": the same name as the
  button, title plus price, with or without a cover and when the cover fails. It carries no
  `aria-pressed` and no `role`; Enter follows it, Space scrolls the page as on every link.
- The button tile is a toggle button and always carries `aria-pressed`, `"true"` when selected
  and `"false"` otherwise, so the state is announced either way.
- The cover area carries `aria-hidden="true"` and the image an empty `alt`, because the area shows
  either a picture of what the title below it says or, without a cover and when a cover fails to
  load, that title as text. Visible text inside a button goes into its accessible name, so without
  the attribute a tile with no cover would be announced as "Rust Rust ab 4,98 € / Monat". Nothing
  is lost: the title is the next element and is announced from there.
- A failed cover therefore changes nothing a screen reader hears. Role and state stay as they are —
  the tile is a toggle button with `aria-pressed` — and the name stays title plus price, the same
  name the tile had while its cover was still loading.
- The native `title` attribute is suppressed on the host, so the browser shows no tooltip of its own
  because of the `title` input.
- Title and price are visible text, so the accessible name of every tile is "Minecraft ab 1,98 € /
  Monat", which is what a screen reader should hear, with a cover, without one and with one that
  failed.

## Responsive

The grid is `auto-fill` from 128px per column with `space-4` between the tiles, so the number of
columns follows the available width down to 360px without a media query. The cover keeps its 3:4
aspect ratio at every size.

## Rendered classes and tokens

| Class           | Applies when                    |
| --------------- | ------------------------------- |
| `z-games`       | on the grid host                |
| `z-game`        | on each tile, button or link    |
| `z-game__cover` | inside each tile, `aria-hidden` |
| `z-game__title` | inside each tile                |
| `z-game__price` | inside each tile                |

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
- Do use `a[zGameTile]` with `href` or `routerLink` when a tile leads to another page; don't put
  `(click)` with `router.navigate` on the button tile.
- Don't rebuild a tile from the `z-game__` classes; both variants render the same markup.
