# SkipLink

The first tab stop of a page: a link that jumps past header and navigation straight to the main
content.

## When to use

- Once per page shell, as the very first element in the body, before the header. Every page that has
  a header with more than two links needs it (`spec/guidelines/15-zustaende.md`, "Tastatur").
- On a link that carries a fragment (`href="#inhalt"`), pointing at the element that holds the page
  content.

## When not to use

- For a second jump target ("Zur Suche", "Zum Filter"). One skip link is what people expect at the
  top of a page; more of them make the first Tab a menu.
- As a router link. A skip link stays on the page; `routerLink` with a fragment would push a history
  entry and scroll after the navigation.
- For a jump inside the content, for example from a table of contents. That is an ordinary link.

## Import

```ts
import { ZSkipLink } from 'zenit-ui';
```

## API

Selector: `a[zSkipLink]`

No inputs, no outputs, no content projection. Text, `href` and position in the document belong to
the caller: only the application knows what its main content is called and where it starts.

| Attribute | Who writes it | Description                                                       |
| --------- | ------------- | ----------------------------------------------------------------- |
| `href`    | the caller    | The fragment of the target, for example `#inhalt`.                |
| text      | the caller    | The visible and accessible name, in German: "Zum Hauptinhalt springen". |

**The target needs `tabindex="-1"`.** A `<main>` cannot take focus on its own. Without the attribute
the browser scrolls to it but leaves the focus where it was, so the next Tab goes back to the second
link of the header and the skip link has done nothing for a keyboard. In dev mode the directive
checks the target on the first focus and writes a `console.warn` when the fragment points at
nothing, at an element that cannot take focus, or when there is no fragment at all. Production
builds drop the check with `ngDevMode`.

## Examples

The shell of an application:

```html
<a zSkipLink href="#inhalt">Zum Hauptinhalt springen</a>
<z-app-header navLabel="Hauptnavigation">
  <span zBrand>Zenit</span>
</z-app-header>
<main id="inhalt" tabindex="-1" class="z-container">
  <router-outlet />
</main>
```

With the small body size of the customer area:

```html
<a zSkipLink class="body-sm" href="#inhalt">Zum Hauptinhalt springen</a>
```

## States

| State   | What it looks like                                                                      |
| ------- | ---------------------------------------------------------------------------------------- |
| at rest | Not visible and not in the layout, but in the accessibility tree and in the tab order.  |
| focused | A block at the top left, over everything else: `surface-raised`, 1px `border-control`, `radius-md`, at least `control-md` high, plus the global 2px focus ring. |
| hover   | Unchanged. The link keeps `text` and stays without an underline.                        |

There is no disabled state and no active state. The link is visible exactly while it has focus, so a
mouse never sees it.

## Accessibility

- Keep the text "Zum Hauptinhalt springen". It is the accessible name, and it says where the link
  goes; "Überspringen" alone does not.
- The link is never `display: none` or `visibility: hidden`; it stays reachable with the keyboard at
  all times.
- The target carries `tabindex="-1"` so the focus really moves. Use `id="inhalt"` on the `<main>`,
  not on a wrapper around it, so the focus lands on the landmark.
- The link is the first tab stop, so it must stand before the header in the document, not only be
  positioned there.
- `z-index` is `--z-toast`, the highest token: a skip link that a header, an overlay or a toast
  covers is not usable.

## Responsive

The block is `position: fixed` at `space-2` from the top and `space-4` from the left, in every
viewport. Its minimum height is `control-md` (40px), which is the mobile touch target, and the text
stays on one line (`white-space: nowrap`). Nothing about it changes at 640px or 900px.

## Rendered classes and tokens

| Class         | Applies when |
| ------------- | ------------ |
| `z-skip-link` | always       |

At rest the class shares the declarations of `.z-visually-hidden`. On `:focus` the rule
`.z-root a.z-skip-link:focus` uses `--space-2` and `--space-4` for the inset, `--z-toast` for the
stacking order, `--control-md` for the height, `--space-4` for the padding, `--border-control` for
the 1px frame, `--radius-md` for the corner, `--surface-raised` for the fill and `--text` for the
label. No literal values.

## Documented deviations from the reference stylesheet

The reference `spec/components/bundle.css` has no block for a skip link, so `.z-skip-link` is an
addition. It exists because an application cannot write the block itself: `.z-root a` weighed
(0,1,1) and beat every application class on a link (0,1,0), which in the first real integration left
the skip link in `accent-text` on the accent surface at 1.29:1. Two rules fix that from both ends:
the base rule is now `.z-root :where(a)` at (0,1,0), and `.z-root a.z-skip-link` weighs (0,2,1). The
hover rule sits on the same selector, so there is no fight over the underline.

## Do / Don't

- Do put the link first in the body, before the header.
- Do give the target `tabindex="-1"` and check the dev-mode console once.
- Do keep the text "Zum Hauptinhalt springen" and the id `inhalt` unless the application really
  calls its content something else.
- Don't style the link in the application. The directive brings the whole appearance; an own class
  would be a second source for the same rules.
- Don't hide it with `display: none` outside the focus state, and don't take it out of the tab order
  with `tabindex="-1"` on the link itself.
- Don't add a second and third skip link for search and filter.
