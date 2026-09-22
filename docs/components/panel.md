# Panel

Groups data or a tool into one block. It is the only container with a border.

## When to use

- Server list, activities, payment methods, price calculator, file manager, a settings group.
- Anywhere a block of data needs a title and, on the right, one link or one action.

## When not to use

- For feature texts, facts and FAQ on public pages. There, `space-7` and 1px lines separate the
  sections.
- Inside another panel. A panel never nests.

## Import

```ts
import { ZPanel, ZPanelActions } from 'zenit-ui';
```

## API

### `z-panel`

| Input   | Type      | Default | Description                                                                                                    |
| ------- | --------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| `title` | `string`  | `''`    | Panel title in normal capitalization, without an icon. Empty renders no header, unless an action is projected. |
| `headingLevel` | `2 \| 3 \| 4` | `3` | Tag of the title. Raise it to `2` where the panel sits directly under the page `<h1>`. The size never changes with it. |
| `titleMono` | `boolean` | `false` | Sets the title in the mono face (`z-mono` on the heading), for a title that is a technical value as a whole: an endpoint, a file name, a configuration key. Boolean attribute. |
| `flush` | `boolean` | `false` | Removes the padding of the body so lists and tables reach the border. Boolean attribute.                       |
| `busy`  | `boolean` | `false` | Marks the panel as loading and sets `aria-busy="true"`. Boolean attribute.                                     |

No outputs. Content projection:

| Slot              | Where it lands                               |
| ----------------- | -------------------------------------------- |
| `[zPanelActions]` | in the header, to the right of the title     |
| default           | in `div.z-panel__body`                       |
| `z-pagination`    | after the body, as the last row of the panel |

### `[zPanelActions]`

Marker directive for the element in the header: one link or one action. It adds no markup and no
classes of its own.

## Examples

A panel with a title and a link in the header, holding a flush list:

```html
<z-panel title="Meine Server" flush>
  <a zPanelActions routerLink="/user/server">Alle anzeigen</a>
  <z-rows columns="minmax(0, 2fr) 128px 40px">
    <a zRow routerLink="/user/server/1">
      <z-row-main title="Beispiel-Server 1" meta="Minecraft · 203.0.113.10" />
      <span><z-badge status="success" dot>Online</z-badge></span>
      <z-icon name="chevron_right" />
    </a>
  </z-rows>
</z-panel>
```

An action button in the header:

```html
<z-panel title="Zahlungsmittel">
  <span zPanelActions>
    <button zBtn="secondary" size="sm" type="button">
      <z-icon name="add" size="sm" />Hinzufügen
    </button>
  </span>
  <p>Noch kein Zahlungsmittel hinterlegt.</p>
</z-panel>
```

The loading state, with placeholder rows in the same grid:

```html
<z-panel title="Meine Server" busy aria-label="Server werden geladen" flush>
  <z-skeleton thumb />
  <z-skeleton width="40%" />
  <z-skeleton width="64px" />
</z-panel>
```

Metrics in one panel, and a panel whose last row is the pager:

```html
<z-panel flush>
  <z-metrics>
    <z-metric label="CPU" value="0,2" unit="%" [percent]="0.2" />
    <z-metric label="Laufzeit" value="2d 21h" sub="TPS 20 · Ping 91 ms" />
  </z-metrics>
</z-panel>

<z-panel title="Transaktionen" flush>
  <z-rows></z-rows>
  <z-pagination [(page)]="seite" [total]="118" itemLabel="Transaktionen" />
</z-panel>
```

A panel named by an endpoint, the title in mono:

```html
<z-panel title="GET /api/v1/gameservers" titleMono headingLevel="2">
  <p>Liefert deine Server mit Status, Adresse und Tarif.</p>
</z-panel>
```

## States

| State   | How it looks                                             | How to trigger it                     |
| ------- | -------------------------------------------------------- | ------------------------------------- |
| Rest    | `surface` on `bg`, 1px `border`, `radius-md`             | default                               |
| Loading | `aria-busy="true"`, skeleton rows in the body            | `busy` plus `z-skeleton` rows         |
| Empty   | `z-empty-state` in the body, no pagination, no filters   | render an empty state instead of rows |
| Error   | `z-alert` in the body naming the cause and the next step | render an alert instead of rows       |

The panel has no hover, focus or disabled state; the controls inside it do.

## Accessibility

- `busy` sets `aria-busy="true"`; pair it with an `aria-label` on the panel so the loading region
  has a name.
- The title is an `<h3>`, so it takes part in the heading outline. Keep the page `<h1>` in
  `z-page-header` above it. A panel that sits directly under that `<h1>` is a section of its own and
  sets `headingLevel="2"`, so no level is skipped; below a section heading the default `3` fits.
- `titleMono` changes the face only: the title stays the same heading with the same text, so the
  outline and what a screen reader reads do not change.
- The native `title` attribute is suppressed on the host, so the browser shows no tooltip of its own
  because of the `title` input.

## Responsive

The panel is a block and follows its container. Panels sit `space-5` apart. Content inside it keeps
its own breakpoints: the row grid collapses below 640px, a table scrolls inside
`z-table-container`, the sidebar next to it turns into a select below 900px.

## Rendered classes and tokens

| Class                  | Applies when                          |
| ---------------------- | ------------------------------------- |
| `z-panel`              | always (host)                         |
| `z-panel__header`      | `title` set or an action is projected |
| `z-panel__title`       | `title` is not empty (on `h2`, `h3` or `h4`) |
| `z-mono`               | on `.z-panel__title`, with `titleMono` |
| `z-panel__body`        | always                                |
| `z-panel__body--flush` | `flush`                               |

Tokens: `--surface` on `--bg`, `--border` for the 1px frame and the header line, `--radius-md`,
`--space-3` and `--space-4` for header and body padding. The title is 14px/600, a literal value from
the reference stylesheet.

## Deviations from the reference

Addition to the reference: below 640px a link in the panel header that is not a button gets a 40px
minimum height, because click targets are at least 40px tall on mobile.

## Do / Don't

- Do use `flush` for lists and tables so they reach the border.
- Do keep exactly one link or one action in the header.
- Do write the title in normal capitalization, without an icon.
- Don't nest a panel inside a panel.
- Don't use a panel for feature texts or FAQ on public pages.
- Don't give the panel a shadow, a blur, a gradient or a coloured border.
