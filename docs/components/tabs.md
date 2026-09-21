# Tabs

Switches between the sub-pages of one area. Every tab is a link with its own URL.

## When to use

- For the sub-pages of an area: Übersicht, Apps, Speicher, Pakete, Einstellungen.
- Wherever the visitor should be able to link to or bookmark the view.

## When not to use

- For switching the view on the same data, for example a period or a filter. That is `z-segment`.
- As a step indicator for a flow that runs in order. That is `z-stepper`.

## Import

```ts
import { ZTabs, ZTab } from 'zenit-ui';
```

## API

### `nav[zTabs]`

No inputs, no outputs. The directive adds the class `z-tabs` to the `<nav>` and renders nothing of
its own. The tabs are the projected links.

### `a[zTab]`

| Input    | Type      | Default | Description                                                                                                 |
| -------- | --------- | ------- | ----------------------------------------------------------------------------------------------------------- |
| `active` | `boolean` | `false` | Whether this tab points at the page currently shown. Boolean attribute, so `active` alone counts as `true`. |

No outputs. The library does not read the router, so the caller decides which tab is active.

## Examples

A tab bar with the active tab set from the route:

```html
<nav zTabs aria-label="Hosting">
  <a zTab routerLink="uebersicht" [active]="bereich() === 'uebersicht'">Übersicht</a>
  <a zTab routerLink="apps" [active]="bereich() === 'apps'">Apps</a>
  <a zTab routerLink="speicher" [active]="bereich() === 'speicher'">Speicher</a>
  <a zTab routerLink="einstellungen" [active]="bereich() === 'einstellungen'">Einstellungen</a>
</nav>
```

The bare attribute, when the active tab is known at build time:

```html
<nav zTabs aria-label="Spieler">
  <a zTab href="/server/1/spieler" active>Liste</a>
  <a zTab href="/server/1/spieler/whitelist">Whitelist</a>
  <a zTab href="/server/1/spieler/bans">Ops und Bans</a>
</nav>
```

Tabs above a panel, which is the usual page layout:

```html
<nav zTabs aria-label="Eigenschaften">
  <a zTab routerLink="allgemein" active>Allgemein</a>
  <a zTab routerLink="gamerules">Gamerules</a>
</nav>
<z-panel title="Allgemein">
  <p>Die Einstellungen des Servers.</p>
</z-panel>
```

## States

| State  | How it looks                                                   | How to trigger it     |
| ------ | -------------------------------------------------------------- | --------------------- |
| Rest   | label in `text-muted`                                          | default               |
| Hover  | label moves to `text`                                          | pointer over the tab  |
| Focus  | 2px ring in `focus` with 2px offset                            | Tab, `:focus-visible` |
| Active | label in `text` plus a 2px line in `accent-text` under the tab | `active` on that link |

There is no disabled, loading, error or empty state. A tab that leads nowhere is left out instead of
being disabled.

## Accessibility

- The active tab carries `aria-current="page"`. That attribute is both what assistive technology
  announces and what the stylesheet draws the 2px underline from.
- Put an `aria-label` on the `<nav>` naming the area the tabs belong to, so the landmark is
  distinguishable from the other navigations on the page.
- Every tab is a real link, so it brings its own keyboard support: Tab moves to it, Enter follows
  it. The directive adds no keyboard handling.
- Do not add a roving tab index. These are links in a navigation, not an ARIA tab list.

## Responsive

The bar scrolls horizontally on narrow screens; it never wraps. Every tab is already `control-md`
(40px) tall, so no mobile adjustment is needed.

## Rendered classes and tokens

| Class    | Applies when           |
| -------- | ---------------------- |
| `z-tabs` | on the `<nav>`, always |
| `z-tab`  | on each link, always   |

Tokens: `--space-5` for the gap between tabs, `--border` for the line under the bar, `--control-md`
for the tab height, `--text-muted` and `--text` for the label, `--accent-text` for the 2px active
underline, `--focus` for the ring.

## Deviations from the reference

Gap in the reference, closed here: `.z-root a` outranks `.z-tab`, so the library adds the matching
rules for `a.z-tab` in rest, hover and active.

Contradiction worth knowing: the design-system README for Tabs asks for `aria-selected="true"` on
the active tab. The implementation uses `aria-current="page"`, which is the correct attribute for a
link that points at the current page; `aria-selected` belongs on an element with `role="tab"`. The
stylesheet accepts both selectors, so a hand-written `aria-selected` still draws the underline.

## Do / Don't

- Do give the `<nav>` an `aria-label`.
- Do use short nouns without icons as labels.
- Do keep one tab active at a time.
- Don't use a filled pill or red text for the active tab; it is a 2px line in `accent-text`.
- Don't wrap the bar onto a second line; let it scroll.
