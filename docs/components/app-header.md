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
| `landmark`  | `boolean` | `true`  | Whether the host is the `banner` landmark. Pass `[landmark]="false"` for a preview inside `<main>`. |
| `menuLabel` | `string` | `'Menü'` | `aria-label` of the menu button shown below 900px. German default, meant to be overridden. |
| `open`      | `boolean` | `false` | Whether the menu below 900px is open. Two-way bindable as `[(open)]`; see "Mobile menu".  |

| Output       | Payload   | Fires when                                                            |
| ------------ | --------- | ---------------------------------------------------------------------- |
| `openChange` | `boolean` | the menu opens or closes, whoever did it (the `model()` companion)     |

Content projection:

| Slot           | Where it lands                                          |
| -------------- | ------------------------------------------------------- |
| `[zBrand]`     | first, at the left edge                                 |
| default        | inside `<nav class="z-header__nav">`, the main links    |
| `[zHeaderEnd]` | inside `<div class="z-header__end">`, at the right edge |

### `[zBrand]`

Brand slot. It adds the class `z-header__brand` and renders nothing itself, so the caller picks the
element. A link back to the start page is the usual choice. The design system ships no logo file, so
its previews show the name as plain text in the `display` face; an application puts its own image
inside the link, see "Brand and end slot on small screens".

### `a[zHeaderLink]`

| Input    | Type      | Default | Description                                                              |
| -------- | --------- | ------- | ------------------------------------------------------------------------ |
| `active` | `boolean` | `false` | Whether this link points at the page currently shown. Boolean attribute. |

### `[zHeaderEnd]`

Pure slot marker for the right-hand end: credit, avatar or buttons. It adds no class and no markup.

No primary button in the end slot: the header stands on every screen of the site, so a primary
there is a second one on every screen that already has its own, which breaks "höchstens ein
primärer Button pro Bildschirmhöhe" (`CLAUDE.md`). Use `ghost` or `secondary`, the way the start
page `/muster/startseite` does, and leave the one primary to the hero, the price summary or the
page header.

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

A public page, with the two calls to action. Neither of them is `primary`: the primary of the page
stands in the hero below.

```html
<z-app-header navLabel="Hauptnavigation">
  <a zBrand href="/">Zenit</a>
  <a zHeaderLink href="/gameserver" active>Gameserver</a>
  <a zHeaderLink href="/preise">Preise</a>
  <a zHeaderLink href="/hardware">Hardware</a>
  <a zBtn="ghost" size="sm" zHeaderEnd href="/anmelden">Anmelden</a>
  <a zBtn="secondary" size="sm" zHeaderEnd href="/neu">Server erstellen</a>
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

## Mobile menu

Below 900px the links fold behind the burger button. `open` holds that state, it starts closed, and
`[(open)]` hands it to the caller: a route guard, a "close everything" action or a test can set it
from outside, and `openChange` reports every change the component makes itself.

The menu closes when

- the burger is pressed again,
- a link projected into the default slot is clicked. The `<nav>` listens once and looks for an `<a>`
  between the click target and itself, so it does not matter whether the link is an `href` or a
  `routerLink`: the library does not import `@angular/router`. A `<button>` inside the nav, a menu
  trigger for example, leaves the menu open, and so does a link that sits above the header, because
  it belongs to the page and not to the menu,
- Escape is pressed while the focus is inside the header. The focus then returns to the burger
  button. A closed menu ignores Escape, so a header never swallows the key from a dialog above it.

A click with Ctrl, Meta or Shift keeps the menu open: the link opens in a new tab or window and this
page stays exactly where it was. The middle mouse button fires `auxclick` instead of `click` and
never reaches the handler at all.

The menu does not close on a resize, because above 900px the state no longer decides anything: CSS
shows the links at that width. It also does not close on a click outside, which the design system
does not ask for; the bar keeps credit and avatar reachable while the menu is open.

The open menu does **not** lock page scroll. It is a panel below the bar, not an overlay: there is no
scrim, the page behind it stays visible and operable, and on a short window the page scrolls to reach
the last link. An application that wants a lock sets it itself from `(openChange)`, for example a
class on `<body>` that sets `overflow: hidden`, and takes it off again when the event reports
`false`.

Content in `[zHeaderEnd]` is not part of the menu. It stays in the bar at every width, so a link
there neither opens nor closes anything.

```html
<z-app-header navLabel="Hauptnavigation" [(open)]="menueOffen">
  <a zBrand href="/">Zenit</a>
  <a zHeaderLink routerLink="/user">Dashboard</a>
  <a zHeaderLink routerLink="/user/server">Gameserver</a>
</z-app-header>
```

A `z-menu` opened from inside the nav is a special case: the CDK renders its entries in an overlay at
the end of the document, not inside the `<nav>`, so no click on an entry ever reaches the delegation.
That is right for the entries that only act, and wrong for one that navigates, the link entry
`a[zMenuItem]` that comes with the overlay package included: it would leave the header menu standing
over the new page. An entry that navigates therefore closes it itself through `[(open)]`, with the
`(triggered)` output every entry has from `CdkMenuItem`:

```html
<button zMenuItem icon="receipt_long" (triggered)="menueOffen.set(false)">Abrechnung</button>
```

## States

| State       | How it looks                                                            | How to trigger it            |
| ----------- | ----------------------------------------------------------------------- | ---------------------------- |
| Rest        | links in `text-muted` on `bg`, 1px `border` below the bar               | default                      |
| Hover       | `surface-raised` behind the link, label in `text`                       | pointer over a link          |
| Focus       | 2px ring in `focus` with 2px offset                                     | Tab, `:focus-visible`        |
| Active link | `accent-subtle` behind it, label in `text`, `aria-current="page"`       | `active` on that link        |
| Menu open   | the nav drops below the bar on `surface-raised`, `aria-expanded="true"` | the menu button or `[(open)]`, below 900px |

There is no disabled, loading, error or empty state.

## Accessibility

- The host carries `role="banner"`, so the header is the banner landmark of the page. A page has one
  of them, and it sits outside `<main>`: a preview of the header inside the content passes
  `[landmark]="false"`.
- With `landmark` off the host binding still owns the `role` attribute and writes `null` there, so a
  role of your own goes on a wrapper around `<z-app-header>`, not on the header itself.
- The `<nav>` is a navigation landmark and takes its name from `navLabel`. Set it; the page usually
  has more than one navigation, and two navigations must not share a name.
- The active link carries `aria-current="page"`, which also drives the `accent-subtle` background.
  The `active` input owns that attribute, so do not combine it with `routerLinkActive` and its
  `ariaCurrentWhenActive`: the host binding writes last and would overwrite what the router set.
  Feed `active` from the router instead.
- The menu button is a `<button type="button">` with `aria-label` from `menuLabel`, `aria-expanded`
  reflecting the open state and `aria-controls` pointing at the generated id of the `<nav>`.
- Escape closes the open menu and moves the focus back to the menu button, so the keyboard does not
  end up on a link that CSS has just hidden.
- The brand is a link back to the start page, so it needs no extra name.
- The avatar initial is decorative and gets `aria-hidden="true"`; the account menu behind it carries
  the name.

## Responsive

Above 900px the links are visible and the menu button is hidden. Below 900px the links fold into a
menu that sits as a surface below the bar, the bar is one row of brand, end slot and menu button
with a defined fallback when the end slot does not fit (see "Brand and end slot on small screens"),
and every header link grows to 40px tall. The end slot with credit and avatar stays
visible at every width. What opens and closes that menu is in "Mobile menu".

## Brand and end slot on small screens

Below 900px the bar is one row: brand, end slot, menu button. The DOM order stays brand, menu button,
`<nav>`, end slot, so Tab goes from the button straight into the links it has just opened.

Between the two 24px paddings the row holds the brand, the end slot, the 40px menu button and two
12px gaps. What is left for brand plus end slot is the window width minus 112px: **248px at 360px**,
263px at 375px, 300px at 412px.

Measured on `/muster/kopfzeile` of the demo with a 60×40px image in the brand (natural 320×213px,
`height: var(--control-md); width: auto`), bar height in px:

| End slot                                                    | Needs | 360 | 375 | 412 | 899 | before, 360/375 |
| ----------------------------------------------------------- | ----- | --- | --- | --- | --- | --------------- |
| `a[zBtn="ghost"]` "Login" + `a[zBtn="secondary"]` "Registrieren", `sm` | 182px | 57 | 57 | 57 | 57 | 126 |
| `a[zBtn="secondary"]` "Zum Dashboard", `sm`                | 133px | 57  | 57  | 57  | 57  | 62              |
| balance link in `z-mono` "12,34 €" + icon button            | 135px | 57  | 57  | 57  | 57  | 62              |
| `z-skeleton width="160px"`                                  | 160px | 57  | 57  | 57  | 57  | 62              |
| "Anmelden" + "Server erstellen", `sm`                       | 238px | 109 | 109 | 57  | 57  | 126, also at 412 |

57px is one row: 8px padding above and below, a 40px control, the 1px line. Before the change every
bar with an image measured 62px, because an inline image sits on the baseline of its line and made
the brand 45px tall, and the first row wrapped to 126px with the menu button left behind next to the
logo. An `<img>` or `<svg>` inside `[zBrand]` is a block now.

**When the end slot does not fit**, its own items wrap inside it, right aligned, 12px apart, and
brand and menu button stay centred on the left and right: two 40px buttons give a bar of 109px, as in
the last row. The bar itself wraps only as a last resort, when even the widest single item of the end
slot does not fit next to brand and menu button; nothing runs out of the page at 360px either way.
Below 360px, which the design system does not support, that last resort is what you get. Measured at
320px: the image logo with two buttons is still 109px, the 160px skeleton takes a row of its own
(109px), and a wide text brand ("Zenit-Hosting") with two buttons makes three rows, 161px. Still no
horizontal scrolling.

**Logo size.** Up to 40px of height costs nothing: below 900px the menu button is 40px tall anyway,
and from 900px on the bar is 56px. A height of 32 to 40px (`--control-sm` to `--control-md`) is the
recommendation; 24px is not necessary. What matters is the **width**: at 360px brand and end slot
share 248px. With "Login" and "Registrieren" (182px) the logo may be up to 66px wide, which a 3:2
logo at 40px height (60px) just meets; with one button or with balance and avatar there is room for
about 110px. Two buttons with longer labels do not fit next to any logo at 360px and stack, as
above. Set the height and let the width follow:

```html
<a zBrand href="/"><img src="logo.svg" alt="Zenit" style="height: var(--control-md); width: auto" /></a>
```

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
- Below 900px the bar is one row of brand, end slot and menu button: the gap is `space-3`, the menu
  button carries `order: 1`, and the end slot takes the room that is left and wraps its own items
  when they do not fit. The bar itself may still wrap as the last resort, so nothing runs off the
  page horizontally at 360px. The header height stays as the minimum height. Numbers in "Brand and
  end slot on small screens".
- An `<img>` or `<svg>` inside `[zBrand]` is `display: block`, so a 40px logo makes a 40px brand
  instead of a 45px one.
- Below 900px the header links are as tall as a control, because click targets are at least 40px
  tall on mobile.

The `menuLabel` input is not in the API table of the design system; it exists so the German default
of the menu button can be overridden, as the "Texte kommen immer von außen" rule requires.

`open` is an addition too. The reference only says that the navigation folds into a menu below
900px and that the balance stays visible; it says nothing about how the menu closes again. In a
single-page application the menu would otherwise stand open over the page the link just loaded, so
the component closes it on a link click and on Escape, and hands the state out as `[(open)]`.

## Do / Don't

- Do set `navLabel` and mark exactly one link `active`.
- Do keep to at most seven links.
- Do put the credit in `mono` as a link to the billing page.
- Don't add icons in front of the header links; the words are enough.
- Don't give the bar a blur or a transparency.
- Don't show two calls to action to a logged-in visitor; show "Zum Dashboard" as secondary.
