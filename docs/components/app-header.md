# AppHeader

Header of the customer area and of the public pages. Same component both times, only the links
differ.

## When to use

- Once at the top of every page, inside and outside the customer area.

## When not to use

- As the head of a page. That is `z-page-header`.
- As the navigation inside a server panel. That is `z-sidebar`.

## Import

```ts
import { ZAppHeader, ZBrand, ZHeaderLink, ZHeaderEnd } from 'zenit-ui';
```

## API

### `z-app-header`

| Input       | Type     | Default  | Description                                                                                |
| ----------- | -------- | -------- | ------------------------------------------------------------------------------------------ |
| `navLabel`  | `string` | `''`     | Accessible name of the `<nav>` landmark. Empty means no `aria-label` at all.               |
| `menuLabel` | `string` | `'Menü'` | `aria-label` of the menu button shown below 900px. German default, meant to be overridden. |

No outputs. Content projection:

| Slot           | Where it lands                                          |
| -------------- | ------------------------------------------------------- |
| `[zBrand]`     | first, at the left edge                                 |
| default        | inside `<nav class="z-header__nav">`, the main links    |
| `[zHeaderEnd]` | inside `<div class="z-header__end">`, at the right edge |

### `[zBrand]`

Brand slot: plain text in the `display` face, no logo image. It adds the class `z-header__brand` and
renders nothing itself, so the caller picks the element. A link back to the start page is the usual
choice.

### `a[zHeaderLink]`

| Input    | Type      | Default | Description                                                              |
| -------- | --------- | ------- | ------------------------------------------------------------------------ |
| `active` | `boolean` | `false` | Whether this link points at the page currently shown. Boolean attribute. |

### `[zHeaderEnd]`

Pure slot marker for the right-hand end: credit, avatar or buttons. It adds no class and no markup.

## Examples

The customer area, with credit and avatar:

```html
<z-app-header navLabel="Hauptnavigation">
  <a zBrand href="/">Zenit</a>
  <a zHeaderLink routerLink="/user" [active]="true">Dashboard</a>
  <a zHeaderLink routerLink="/user/server">Gameserver</a>
  <a zHeaderLink routerLink="/user/abrechnung">Abrechnung</a>
  <a zHeaderLink routerLink="/user/support">Support</a>
  <a zHeaderEnd class="z-mono" href="/user/abrechnung">25,00&nbsp;€</a>
  <span zHeaderEnd class="z-avatar" aria-hidden="true">K</span>
</z-app-header>
```

A public page, with the two calls to action:

```html
<z-app-header navLabel="Hauptnavigation">
  <a zBrand href="/">Zenit</a>
  <a zHeaderLink href="/gameserver" active>Gameserver</a>
  <a zHeaderLink href="/preise">Preise</a>
  <a zHeaderLink href="/hardware">Hardware</a>
  <a zBtn="ghost" size="sm" zHeaderEnd href="/anmelden">Anmelden</a>
  <a zBtn="primary" size="sm" zHeaderEnd href="/neu">Server erstellen</a>
</z-app-header>
```

A logged-in visitor on a public page sees one secondary button instead of two calls to action:

```html
<z-app-header navLabel="Hauptnavigation" menuLabel="Navigation öffnen">
  <a zBrand href="/">Zenit</a>
  <a zHeaderLink href="/gameserver">Gameserver</a>
  <a zBtn="secondary" size="sm" zHeaderEnd routerLink="/user">Zum Dashboard</a>
</z-app-header>
```

## States

| State       | How it looks                                                            | How to trigger it            |
| ----------- | ----------------------------------------------------------------------- | ---------------------------- |
| Rest        | links in `text-muted` on `bg`, 1px `border` below the bar               | default                      |
| Hover       | `surface-raised` behind the link, label in `text`                       | pointer over a link          |
| Focus       | 2px ring in `focus` with 2px offset                                     | Tab, `:focus-visible`        |
| Active link | `accent-subtle` behind it, label in `text`, `aria-current="page"`       | `active` on that link        |
| Menu open   | the nav drops below the bar on `surface-raised`, `aria-expanded="true"` | the menu button, below 900px |

There is no disabled, loading, error or empty state.

## Accessibility

- The `<nav>` is a navigation landmark and takes its name from `navLabel`. Set it; the page usually
  has more than one navigation.
- The active link carries `aria-current="page"`, which also drives the `accent-subtle` background.
- The menu button is a `<button type="button">` with `aria-label` from `menuLabel`, `aria-expanded`
  reflecting the open state and `aria-controls` pointing at the generated id of the `<nav>`.
- The brand is a link back to the start page, so it needs no extra name.
- The avatar initial is decorative and gets `aria-hidden="true"`; the account menu behind it carries
  the name.

## Responsive

Above 900px the links are visible and the menu button is hidden. Below 900px the links fold into a
menu that sits as a surface below the bar, the bar may wrap so two buttons do not run off the page
at 360px, and every header link grows to 40px tall. The end slot with credit and avatar stays
visible at every width.

## Rendered classes and tokens

| Class             | Applies when                  |
| ----------------- | ----------------------------- |
| `z-header`        | on the host, always           |
| `z-header--open`  | while the mobile menu is open |
| `z-header__brand` | on the `[zBrand]` element     |
| `z-header__menu`  | on the menu button            |
| `z-header__nav`   | on the `<nav>`                |
| `z-header__link`  | on each `a[zHeaderLink]`      |
| `z-header__end`   | on the right-hand container   |

Tokens: `--header` for the height, `--space-5` for the padding and the gap, `--bg` for the surface,
`--border` for the line below, `--font-display` for the brand, `--text-muted` and `--text` for the
links, `--surface-raised` for hover and the open menu, `--accent-subtle` for the active link,
`--accent-text` for its icon, `--control-sm` and `--control-md` for the link height, `--z-header`
for the stacking order of the open menu. The 16px brand and the 32px avatar are literal values from
the reference stylesheet.

## Deviations from the reference

New, because the reference stylesheet does not cover it:

- Below 900px the navigation folds into a menu while the balance stays visible. The menu sits as a
  surface below the bar, so the bar keeps its height.
- Below 900px the bar may wrap: on public pages two buttons stand on the right, which would
  otherwise run off the page horizontally at 360px. The header height stays as the minimum height.
- Below 900px the header links are as tall as a control, because click targets are at least 40px
  tall on mobile.

The `menuLabel` input is not in the API table of the design system; it exists so the German default
of the menu button can be overridden, as the "Texte kommen immer von außen" rule requires.

## Do / Don't

- Do set `navLabel` and mark exactly one link `active`.
- Do keep to at most seven links.
- Do put the credit in `mono` as a link to the billing page.
- Don't add icons in front of the header links; the words are enough.
- Don't give the bar a blur or a transparency.
- Don't show two calls to action to a logged-in visitor; show "Zum Dashboard" as secondary.
