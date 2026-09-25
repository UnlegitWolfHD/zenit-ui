# Skeleton

Holds the space while a list or a metric loads.

## When to use

- In a list or a table, after 300ms of loading, with as many placeholder rows as are normally
  expected, two or three.
- In the same grid as the real rows, so nothing jumps when the data arrives.
- With `tile` in a `z-game-grid` that loads, one placeholder per expected game tile.

## When not to use

- Inside a button that is working. That is `loading` on `zBtn`, which shows a spinner.
- After 10 seconds without an answer. Then an alert with a retry replaces the skeleton.

## Import

```ts
import { ZSkeleton } from 'zenit-ui';
```

## API

Selector: `z-skeleton`

| Input   | Type      | Default | Description                                                                                                      |
| ------- | --------- | ------- | ---------------------------------------------------------------------------------------------------------------- |
| `width` | `string`  | `''`    | CSS length for the placeholder, for example `40%` or `64px`. Empty means full width.                             |
| `thumb` | `boolean` | `false` | Renders a square instead of a line, for the image area of a row. Boolean attribute.                              |
| `tile`  | `boolean` | `false` | Renders the placeholder of a `button[zGameTile]`: landscape cover, title line and price line. Boolean attribute. |

No outputs, no content projection, no forms support. `width` does not apply to `tile`; the grid cell sets its width. The host is always `aria-hidden="true"`.

## Examples

Two placeholder rows in the grid of a server list:

```html
<z-panel title="Meine Server" busy aria-label="Server werden geladen" flush>
  <z-rows columns="minmax(0, 2fr) 128px 40px">
    <div zRow>
      <z-skeleton thumb />
      <z-skeleton width="40%" />
      <z-skeleton width="64px" />
    </div>
    <div zRow>
      <z-skeleton thumb />
      <z-skeleton width="56%" />
      <z-skeleton width="64px" />
    </div>
  </z-rows>
</z-panel>
```

A game grid that is still loading. Each placeholder takes exactly the cell of a tile, so the grid
does not move when the tiles arrive; the grid names itself and carries `aria-busy`:

```html
<z-game-grid role="group" aria-busy="true" aria-label="Spiele werden geladen">
  <z-skeleton tile />
  <z-skeleton tile />
  <z-skeleton tile />
</z-game-grid>
```

Plain lines, at full width and at a percentage:

```html
<z-skeleton />
<z-skeleton width="72%" />
<z-skeleton width="120px" />
```

Loading metrics inside a panel:

```html
<z-panel busy aria-label="Auslastung wird geladen" flush>
  <z-metrics>
    <z-metric label="CPU" />
    <z-metric label="Speicher" />
  </z-metrics>
</z-panel>
```

Switching between the placeholder and the data:

```html
@if (laedt()) {
<z-skeleton width="40%" />
} @else {
<span>{{ name() }}</span>
}
```

## States

The skeleton is itself a loading state. Its only movement is an opacity animation between 1 and 0.5,
which is the single permanent animation in the system and sits behind
`prefers-reduced-motion: no-preference`. It has no hover, focus or disabled state.

## Accessibility

- The host carries a fixed `aria-hidden="true"`, so the placeholders are never read.
- The surrounding container carries `aria-busy="true"` and an `aria-label`; on a panel that is the
  `busy` input plus an `aria-label` on the element.
- Show the skeleton only after 300ms. If the data arrives faster, show the content directly.

## Responsive

The placeholder is a block whose width comes from `width`, so it follows the grid it sits in at
every width. The `thumb` variant stays 32px square, matching `z-row__thumb`. The `tile` variant
follows its grid cell: the cover has the aspect ratio of the tile's cover area (460:215, one rule for
both in `_werkzeuge.css`), so at every width its box equals that of a `button[zGameTile]` in the
same grid.

## Rendered classes and tokens

| Class           | Applies when                                               |
| --------------- | ---------------------------------------------------------- |
| `z-skel`        | always                                                     |
| `z-skel--thumb` | `thumb`                                                    |
| `z-skel--tile`  | `tile`, with `z-skel__cover` and two `z-skel__line` inside |

An inline `width` is written when `width` is not empty. Tokens: `--radius-sm` for the corner,
`--surface-hover` for the fill. The 12px line height, the 32px square and the 1.2s opacity animation
are literal values from the reference stylesheet. Addition to the reference: `z-skel--tile` repeats
the boxes of `.z-game` with `--space-2` between them and `--radius-md` on the cover; its text lines
are one line box tall (`1lh`), the price line at the 12px/16px of `.z-game__price`, each with a 12px
bar centred in it.

## Do / Don't

- Do show as many placeholder rows as the list normally has, two or three.
- Do put them in the same grid with the same row height, so the layout does not jump.
- Do set `busy` and an `aria-label` on the container around them.
- Don't use a shimmer gradient; the animation is opacity only.
- Don't use a skeleton inside a button; that is a spinner.
- Don't leave a skeleton up forever; after 10 seconds an alert with a retry takes its place.
