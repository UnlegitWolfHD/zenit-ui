# Sidebar

Navigation inside a server panel: at most four groups with 12 to 14 entries together.

## When to use

- As the left-hand navigation of a server panel, next to the content.

## When not to use

- As the main navigation of the site. That is `z-app-header`.
- For the sub-pages of one area inside the panel. Those are tabs on that page.
- As a list of more than about 14 entries. Merge pages into tabs instead of growing the sidebar.

## Import

```ts
import { ZSidebar, ZSidebarGroup, ZSidebarItem } from 'zenit-ui';
```

## API

### `z-sidebar`

| Input       | Type     | Default | Description                                                                                            |
| ----------- | -------- | ------- | ------------------------------------------------------------------------------------------------------ |
| `ariaLabel` | `string` | `''`    | `aria-label` written onto the `nav` as well as onto the select below 900px. Empty writes no attribute. |

No outputs. Content projection: the groups and entries. The component also renders a `z-select`
mirroring the same entries, one `<option>` per `[zSidebarItem]` in document order.

### `z-sidebar-group`

| Input   | Type     | Default | Description                                                                                            |
| ------- | -------- | ------- | ------------------------------------------------------------------------------------------------------ |
| `label` | `string` | `''`    | Heading of the group, one word. Empty renders no heading, which is how the first group usually stands. |

### `[zSidebarItem]`

Sits on a `<button>` or on an `<a>`, so links keep their `href` and their routing.

| Input    | Type             | Default | Description                                                                      |
| -------- | ---------------- | ------- | -------------------------------------------------------------------------------- |
| `icon`   | `string`         | `''`    | Material Icon in front of the text. Empty renders no icon.                       |
| `active` | `boolean`        | `false` | Marks the entry as the current page. At most one per sidebar. Boolean attribute. |
| `count`  | `number \| null` | `null`  | Counter at the right edge. `null` renders nothing, `0` renders the digit.        |

No outputs. Content projection: the label as plain text.

## Examples

The four groups of a Minecraft panel:

```html
<z-sidebar ariaLabel="Server-Navigation">
  <z-sidebar-group>
    <a zSidebarItem icon="dashboard" routerLink="/server/1" [active]="true">Übersicht</a>
    <a zSidebarItem icon="terminal" routerLink="/server/1/konsole">Konsole</a>
    <a zSidebarItem icon="folder" routerLink="/server/1/dateien">Dateien</a>
  </z-sidebar-group>
  <z-sidebar-group label="Spiel">
    <a zSidebarItem icon="group" routerLink="/server/1/spieler">Spieler</a>
    <a zSidebarItem icon="tune" routerLink="/server/1/eigenschaften">Eigenschaften</a>
  </z-sidebar-group>
  <z-sidebar-group label="Betrieb">
    <a zSidebarItem icon="backup" routerLink="/server/1/backups">Backups</a>
    <a zSidebarItem icon="report" routerLink="/server/1/abstuerze" [count]="3">Abstürze</a>
  </z-sidebar-group>
  <z-sidebar-group label="Server">
    <a zSidebarItem icon="settings" routerLink="/server/1/einstellungen">Einstellungen</a>
    <a zSidebarItem icon="upgrade" routerLink="/server/1/upgrade">Upgrade</a>
  </z-sidebar-group>
</z-sidebar>
```

An entry as a button, for an action that does not change the URL:

```html
<z-sidebar-group label="Werkzeuge">
  <button zSidebarItem icon="download" type="button" (click)="logHerunterladen()">
    Log herunterladen
  </button>
</z-sidebar-group>
```

Inside the panel shell, which puts sidebar and content side by side above 900px:

```html
<div class="z-panel-shell">
  <z-sidebar ariaLabel="Server-Navigation">
    <z-sidebar-group>
      <a zSidebarItem icon="dashboard" routerLink="/server/1" active>Übersicht</a>
    </z-sidebar-group>
  </z-sidebar>
  <z-panel title="Übersicht">
    <p>Der Inhalt des Bereichs.</p>
  </z-panel>
</div>
```

## States

| State  | How it looks                                                                                                         | How to trigger it      |
| ------ | -------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| Rest   | label and icon in `text-muted`                                                                                       | default                |
| Hover  | `surface-raised` behind the entry, label in `text`                                                                   | pointer over the entry |
| Focus  | 2px ring in `focus` with 2px offset                                                                                  | Tab, `:focus-visible`  |
| Active | `surface-hover` behind it, label in `text` and 600, icon in `accent-text` (`mc-accent` under the Minecraft subtheme) | `active` on that entry |

There is no disabled, loading, error or empty state. An area the customer cannot reach is left out
of the sidebar rather than shown greyed.

## Accessibility

- The active entry carries `aria-current="page"` and is the only one whose icon is coloured.
- `ariaLabel` names both the `nav` and the select, so the navigation is announced with a name at
  either width.
- The entries are real links or real buttons and bring their own keyboard handling.
- Groups disappear in the select below 900px, so a group heading must never carry meaning its
  entries do not.
- The entry labels are projected text and can only be read after rendering, so the select collects
  them after every render and follows a label that changes at runtime.

## Responsive

Above 900px the list is shown and the select is hidden. At 899px and below the list is hidden and
the select takes its place over the content; choosing an option triggers the click of that entry,
so routing works the same in both. Below 640px each entry gets a 40px minimum height, up from its
36px.

## Rendered classes and tokens

| Class           | Applies when                    |
| --------------- | ------------------------------- |
| `z-side`        | on the `nav` inside `z-sidebar` |
| `z-side__group` | on each `z-sidebar-group`       |
| `z-side__label` | `label` of a group is not empty |
| `z-side__item`  | on each entry                   |
| `z-side__count` | `count` is not `null`           |

Tokens: `--sidebar` for the width, `--space-3` and `--space-4` for padding and gaps, `--border`,
`--radius-md` for the frame and `--radius-sm` for an entry, `--surface` for the panel,
`--surface-raised` for hover, `--surface-hover` for the active entry, `--text-muted` and `--text`
for the labels, `--accent-text` (or `--mc-accent`) for the active icon, `--font-mono` and
`--text-subtle` for the counter, `--control-md` for the mobile height. The 36px entry height is a
literal value from the reference stylesheet.

## Deviations from the reference

New, because the reference stylesheet does not cover it:

- `z-sidebar` carries both the list and the select; only the list inside it is `.z-side`.
- Below 900px the sidebar turns into the select, above it the select is hidden. The media query
  stops at 899px so it does not overlap with `.z-panel-shell`, which starts at 900px.

Gap in the reference, closed here: `.z-root a` outranks `.z-side__item`, so the library adds the
matching rules for `a.z-side__item` in rest, hover and active.

Addition to the reference: below 640px a sidebar entry gets a 40px minimum height, because click
targets are at least 40px tall on mobile.

## Do / Don't

- Do keep to at most four groups with 12 to 14 entries together.
- Do give the sidebar an `ariaLabel`; it is one navigation among several on the page.
- Do leave the first group without a heading.
- Don't repeat entries in a "frequently used" group.
- Don't put a fact only in a group heading; it disappears in the select below 900px.
- Don't fill the active entry green or red; it is `surface-hover` with a coloured icon.
