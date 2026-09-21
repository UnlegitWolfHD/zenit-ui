# Tabs

Two components under one name. **Part 1, `nav[zTabs]` with `a[zTab]`**, switches between the
sub-pages of one area; every tab is a link with its own URL. **Part 2, `z-tab-group` with
`z-tab-panel`**, switches between views that have no address of their own.

Prefer part 1. A link can be bookmarked, opened in a new tab and the back button works on it. Reach
for part 2 only where a view cannot or must not have a URL.

## Part 1: link tabs (`nav[zTabs]`)

## When to use

- For the sub-pages of an area: Übersicht, Apps, Speicher, Pakete, Einstellungen.
- Wherever the visitor should be able to link to or bookmark the view.

## When not to use

- For switching the view on the same data, for example a period or a filter. That is `z-segment`.
- As a step indicator for a flow that runs in order. That is `z-stepper`.
- For a view that has no URL and is not supposed to get one. That is `z-tab-group`, part 2.

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

---

## Part 2: in-page tabs (`z-tab-group`)

Switches between views that have no address of their own. The WAI-ARIA Tabs pattern:
`role="tablist"` with `role="tab"` buttons and one `role="tabpanel"` per view. This is the markup
`spec/components/Tabs/preview.html` shows.

## Which of the two

| Question                                                      | Answer                              |
| ------------------------------------------------------------- | ----------------------------------- |
| Can the view have a URL of its own?                           | `nav[zTabs]` with `a[zTab]`, part 1 |
| Should the back button lead back to the previous view?        | part 1                              |
| Should the view be linkable, bookmarkable, openable in a tab?  | part 1                              |
| No route possible: a dialog, a wizard step, a panel section   | `z-tab-group`                       |
| Would a route add an entry to the history nobody wants?       | `z-tab-group`                       |
| Same data, another view on it (period, filter)                | neither, that is `z-segment`        |

Links are the better tabs. `z-tab-group` exists for the cases where adding a route is not possible
or would be wrong, not as the more comfortable option.

## Import

```ts
import { ZTabGroup, ZTabPanel } from 'zenit-ui';
```

## API

### `z-tab-group`

| Input            | Type      | Default | Description                                                                                                                |
| ---------------- | --------- | ------- | -------------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel`      | `string`  | `''`    | Accessible name of the tab bar. Empty writes no `aria-label`.                                                              |
| `ariaLabelledby` | `string`  | `''`    | Id of the element that names the bar, usually the heading above it.                                                        |
| `value`          | `string`  | `''`    | The active panel's `value`, two-way bindable. Empty or unmatched falls back to the first enabled panel and is written back. |
| `keepAlive`      | `boolean` | `false` | Keeps every visited panel in the document and hides the inactive ones with `hidden`. Boolean attribute.                    |

| Output        | Type     | Fires                              |
| ------------- | -------- | ---------------------------------- |
| `valueChange` | `string` | Whenever the active panel changes. |

Content: the `z-tab-panel` elements, in the order the tabs are to appear.

### `z-tab-panel`

| Input      | Type      | Default    | Description                                                                               |
| ---------- | --------- | ---------- | ------------------------------------------------------------------------------------------- |
| `value`    | `string`  | _required_ | Identifies the panel, unique within one group. This is what `value` on the group reports. |
| `label`    | `string`  | _required_ | Caption of the tab, a short noun without an icon.                                          |
| `disabled` | `boolean` | `false`    | Locks the tab: natively `disabled`, so the arrow keys skip it. Boolean attribute.          |

No outputs. Content is the panel's body and is projected.

There is no `count` input. The reference shows counters on the sidebar entries (`z-side__count`)
and none on a tab, so a number next to a tab caption would be an invention.

## Examples

Five views of a server panel, one of them locked:

```html
<z-tab-group ariaLabel="Serveransichten" [(value)]="ansicht">
  <z-tab-panel value="uebersicht" label="Übersicht">
    <p>Beispiel-Server 1, PaperMC 1.21.4, seit 4 Tagen online.</p>
  </z-tab-panel>
  <z-tab-panel value="speicher" label="Speicher">
    <p>12,4&nbsp;GB von 40&nbsp;GB belegt.</p>
  </z-tab-panel>
  <z-tab-panel value="pakete" label="Pakete" disabled>
    <p>Für diesen Server sind keine Pakete gebucht.</p>
  </z-tab-panel>
</z-tab-group>
```

Named by the heading above it instead of by an `aria-label`:

```html
<h2 id="ansichten">Ansichten</h2>
<z-tab-group ariaLabelledby="ansichten" [(value)]="ansicht">
  <z-tab-panel value="log" label="Log">…</z-tab-panel>
  <z-tab-panel value="konsole" label="Konsole">…</z-tab-panel>
</z-tab-group>
```

A panel whose elements have to survive a tab change:

```html
<z-tab-group ariaLabel="Werkzeuge" keepAlive [(value)]="werkzeug">
  <z-tab-panel value="konsole" label="Konsole">
    <z-console [lines]="zeilen()" (command)="senden($event)" />
  </z-tab-panel>
  <z-tab-panel value="dateien" label="Dateien">…</z-tab-panel>
</z-tab-group>
```

## Keyboard

| Key                       | What happens                                                                                           |
| ------------------------- | -------------------------------------------------------------------------------------------------------- |
| `Tab`                     | Into the bar, onto the active tab; again out of the bar into the panel. Inactive tabs are no tab stops. |
| Arrow right, arrow left   | One tab on or back, wraps around at both ends, skips disabled tabs, switches the view at once.         |
| The same two in RTL       | They swap: arrow left moves on, arrow right moves back.                                                |
| `Home`, `End`             | First or last enabled tab, switches the view at once.                                                  |
| `Space`, `Enter`          | Activates the focused tab. A tab is a native `button`, so this comes for free.                         |

Automatic activation: an arrow key moves the focus and switches the view in one step, which is what
the WAI-ARIA Tabs pattern asks for whenever switching is cheap. Here it always is, see the next
section.

## Lazy panels, `keepAlive`, and what Material did

The content of a panel is wrapped in an `ng-template` and rendered through `ngTemplateOutlet`, so
only the active panel's elements stand in the document. What that does and does not buy, measured
against Angular 22:

| Effect                                 | Default (lazy)                                  | `keepAlive`                              |
| -------------------------------------- | ------------------------------------------------- | ---------------------------------------- |
| Elements of an inactive panel          | not in the document                             | in the document, with `hidden`           |
| Accessibility tree, layout, printing   | inactive panels do not appear                   | inactive panels do not appear (`hidden`) |
| Scroll position, `video`, `iframe`     | lost on every tab change                        | survives                                 |
| Component instances of the content     | created once, **not** destroyed by a tab change | created once, not destroyed              |

The last row is the one to know. Angular creates projected nodes together with the view that
_declares_ them, which is the caller's template, not the panel. Putting the `ng-content` behind an
`ng-template` keeps those elements out of the document, but the components inside them are
constructed with the caller's view and keep their state. A panel is therefore lazy in the DOM, not
in the component tree, and a heavy panel is not made cheap by hiding it. Where that matters, hand
the panel an `ng-template` of your own and instantiate it when you want, or split the views onto
routes, which is part 1 of this page.

`mat-tab-group` behaved the other way round by default: it kept every visited tab's content in the
document and only deferred a tab whose content sat in an `ng-template matTabContent`. `keepAlive` is
the closest match to that default. Without it a tab change is cheaper in DOM terms and a panel
starts over visually.

## Migrating from `mat-tab-group`

| Material                                                      | Here                                                                 |
| ------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `mat-tab-group`                                               | `z-tab-group` with `ariaLabel` or `ariaLabelledby`                   |
| `mat-tab` with `label`                                        | `z-tab-panel` with `value` and `label`                               |
| `[(selectedIndex)]`                                           | `[(value)]`, and the value is the panel's `value`, not its position  |
| `(selectedTabChange)`                                         | `(valueChange)`, which carries the value, not a `MatTabChangeEvent`  |
| `[disabled]` on `mat-tab`                                     | `disabled` on `z-tab-panel`                                          |
| `ng-template matTabContent`                                   | not needed, the panel is lazy by itself; see the table above         |
| `animationDuration`, `headerPosition`, `color`                | nothing. No animation, the bar is above, colours come from the tokens |

`selectedIndex` is index based, `value` is not. That is on purpose: an index moves as soon as a tab
is added or left out, and the bug it causes is silent. An old handler that wants an index keeps its
signature through one array:

```ts
import { Component, computed, signal } from '@angular/core';
import { ZTabGroup, ZTabPanel } from 'zenit-ui';

@Component({
  selector: 'app-panel',
  imports: [ZTabGroup, ZTabPanel],
  templateUrl: './panel.html',
})
export class Panel {
  /** The position of every tab, written down once, in the order of the panels. */
  private readonly reihenfolge = ['uebersicht', 'speicher', 'einstellungen'];

  protected readonly ansicht = signal(this.reihenfolge[0]);

  /** What the old `[(selectedIndex)]` held. */
  protected readonly index = computed(() => this.reihenfolge.indexOf(this.ansicht()));

  /** Keeps the signature the old `(selectedTabChange)` handler had. */
  protected ansichtGewechselt(wert: string): void {
    this.ansicht.set(wert);
    this.tabGewechselt(this.reihenfolge.indexOf(wert));
  }

  /** Unchanged application code. */
  private tabGewechselt(index: number): void {
    console.log(index);
  }
}
```

```html
<z-tab-group ariaLabel="Serveransichten" [value]="ansicht()" (valueChange)="ansichtGewechselt($event)">
  <z-tab-panel value="uebersicht" label="Übersicht">…</z-tab-panel>
  <z-tab-panel value="speicher" label="Speicher">…</z-tab-panel>
  <z-tab-panel value="einstellungen" label="Einstellungen">…</z-tab-panel>
</z-tab-group>
```

Drop the array as soon as nothing asks for the index any more.

## States

| State    | How it looks                                                     | How to trigger it        |
| -------- | ------------------------------------------------------------------ | ------------------------ |
| Rest     | caption in `text-muted`                                          | default                  |
| Hover    | caption moves to `text`                                          | pointer over the tab     |
| Focus    | 2px ring in `focus` with 2px offset                              | Tab or an arrow key      |
| Active   | caption in `text` plus a 2px line in `accent-text` under the tab | `value` names this panel |
| Disabled | 45 % opacity, `cursor: not-allowed`, no tab stop                 | `disabled` on the panel  |

There is no loading, error or empty state on the bar; those belong inside a panel. A disabled tab is
natively `disabled` and therefore cannot be focused, so the reason for it goes next to the group, as
`spec/guidelines/15-zustaende.md` asks, never as a tooltip on the tab itself, which nobody could
reach.

## Accessibility

- `role="tablist"` on the bar, `role="tab"` on every button, `role="tabpanel"` on every panel. The
  active tab carries `aria-selected="true"`, the others `"false"`.
- The bar needs a name: `ariaLabel`, or `ariaLabelledby` pointing at the heading above it.
- `aria-controls` on a tab points at its panel only while that panel really stands in the document,
  which is what the WAI-ARIA Tabs pattern asks for when panels are deferred.
- Every panel carries `aria-labelledby` pointing back at its tab, and `tabindex="0"`. The panel is a
  tab stop even when it holds a focusable element: the content is whatever the caller projects, and
  a check that ran after every change of it would be wrong in between. One extra tab stop is
  harmless, a panel nobody can reach is not.
- Roving `tabindex`: only the active tab is a tab stop, so Tab leads out of the bar instead of
  through five buttons.
- Ids are generated per panel, so two groups on one page never collide.

## Responsive

The bar scrolls horizontally inside its own container when it does not fit; it never wraps. The page
itself never scrolls sideways, because the bar is the grid item that scrolls and its automatic
minimum size is therefore 0. The active tab is scrolled into view whenever it is activated, by click
or by key. Every tab is `control-md` (40px) tall, so no mobile adjustment is needed.

## Rendered classes and tokens

| Class    | Applies when                       |
| -------- | ---------------------------------- |
| `z-tabs` | on the bar (`div[role="tablist"]`) |
| `z-tab`  | on each tab button                 |

The two hosts, `z-tab-group` and `z-tab-panel`, are styled through their element names, not through
a class.

Tokens: `--space-5` for the gap between tabs, `--space-4` for the gap between bar and panel,
`--border` for the line under the bar, `--control-md` for the tab height, `--text-muted` and
`--text` for the caption, `--accent-text` for the 2px active underline, `--focus` for the ring.

## Deviations from the reference

Gaps in the reference, closed here: the two hosts have no rule at all in `bundle.css`, and neither
has a disabled tab. Added in `_navigation.css` under "Addition to the reference": `z-tab-group` as a
grid with `--space-4`, and `.z-tab:disabled` with 45 % and `not-allowed` like every other locked
control of the library. Nothing sets `display` on `z-tab-panel`, because an author rule of any
specificity would beat the browser's `[hidden]`.

Contradiction resolved here: `spec/components/Tabs/README.md` describes the link variant in its last
bullet and asks for `aria-selected="true"` under "Du lieferst", while `preview.html` shows
`role="tablist"` with buttons. `docs/design-system-feedback.md`, item 3, calls that a defect. Both
readings are now real components: `aria-current="page"` on the links of part 1, `aria-selected` on
the buttons of part 2, and `bundle.css` styles both selectors, which is why the underline is the
same in both.

## Do / Don't

- Do reach for part 1 first and for `z-tab-group` only when a route is out of the question.
- Do name the bar, and name it after what it switches.
- Do give every panel a stable `value`; never derive one from its position.
- Do put the reason for a locked tab next to the group.
- Don't nest a tab group inside a tab panel; two tab lists on top of each other are a sign the page
  wants a sidebar or routes of its own.
- Don't use it for the same data in another view; that is `z-segment`.
