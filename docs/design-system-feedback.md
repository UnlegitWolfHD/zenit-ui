# Feedback for the design system

Defects and contradictions found in `spec/` while building the library, so they can be fixed at the source instead of being worked around again in the next implementation.

Every item was verified against `spec/` for this document: the file and line are quoted, the consequence is reproduced, and "what the library did" names the file where the workaround lives. Ordered by impact.

Sources: the deviation comments in `projects/zenit-ui/src/styles/_*.css`, `docs/pakete.md` (Festlegung 1 and 2), `projects/zenit-ui/README.md`, `CHANGELOG.md` and the git history.

**Scope note.** This list is about the specification, not about the library. Where the library deviates, it deviates deliberately and says so; the point of each item is that the deviation should not have been necessary.

---

## 1. `bundle.css` line 14 makes the primary button fail contrast

**Where:** `spec/components/bundle.css:14`

```css
.z-root button,
.z-root input,
.z-root select,
.z-root textarea {
  font: inherit;
  color: inherit;
}
```

**What is wrong:** the selector list has specificity (0,1,1) — one class plus one element. `.z-btn--primary` on line 34 has (0,1,0). The base rule therefore wins on `<button class="z-btn z-btn--primary">`, and `color: inherit` resolves to `--text` from `.z-root`, not to `--on-accent`.

**Evidence:** `--text` is `#f2f2f3` and `--accent` is `#e11d48` (`spec/tokens.css:9` and `:12`). White text on that background gives 4.70:1, which is what `spec/guidelines/20-bestandsaufnahme.md:44` states as the reason for choosing `#e11d48` in the first place ("Der primäre Button nimmt deshalb `accent` (#e11d48, 4,7:1)"). `#f2f2f3` on `#e11d48` gives **4.19:1**, which is below the 4.5:1 that 14px/500 button text needs. The reference styles defeat their own stated contrast decision.

The same gap, three more times, with no counter-rule in `bundle.css`:

| Element                        | Loses to                                     | Gets                  | Should be      |
| ------------------------------ | -------------------------------------------- | --------------------- | -------------- |
| `a.z-btn--ghost`               | `.z-root a` (0,1,1), line 16                 | `--accent-text`       | `--text-muted` |
| `a.z-btn--danger`              | `.z-root a` (0,1,1), line 16                 | `--accent-text`       | `--danger`     |
| `.z-theme-mc a.z-btn--primary` | `.z-root a.z-btn--primary` (0,2,1), line 383 | `--on-accent` (white) | `--on-mc`      |

`bundle.css:383` and `:384` already add counter-rules for `a.z-btn--primary` and `a.z-btn--secondary`, so the problem was seen — but only half of it was fixed, and the fix for `a.z-btn--primary` is itself what breaks the Minecraft link button: (0,2,1) beats the subtheme rule at (0,2,0). White on `--mc-accent` (`#5fb84e`) is **2.49:1**; `--on-mc` (`#06280a`) would be 6.42:1.

Two rules of `CLAUDE.md` are broken by this: "`accent` ist nur Fläche … mit `on-accent` als Schrift", and "`danger` ist bewusst heller und oranger als `accent-text`, damit ein Fehler nicht wie die Marke aussieht" — a danger link button rendered in `accent-text` looks exactly like the brand.

**What the library did:** `projects/zenit-ui/src/styles/_grundlage.css:16` rewrites the base rule with `:where()`, which lowers it to (0,1,0) and lets the variant classes win, values unchanged. Lines 110 to 114 add the four missing counter-rules for ghost, danger and the Minecraft link button. Both are listed as documented deviations in `projects/zenit-ui/README.md`.

**Proposed change:** in `bundle.css`, replace line 14 with

```css
.z-root :where(button, input, select, textarea) {
  font: inherit;
  color: inherit;
}
```

and add the three missing rules next to the existing ones at line 383:

```css
.z-root a.z-btn--ghost {
  color: var(--text-muted);
}
.z-root a.z-btn--ghost:hover {
  color: var(--text);
}
.z-root a.z-btn--danger {
  color: var(--danger);
}
.z-root .z-theme-mc a.z-btn--primary {
  color: var(--on-mc);
}
```

---

## 2. The reference styles contradict the 40px mobile click target rule in eight places

**Where:** `CLAUDE.md`, "Abstand und Layout": _"Klickziele sind mobil mindestens 40px hoch."_ Repeated in `spec/guidelines/00-auftrag.md:49` as an acceptance point per route.

**What is wrong:** `bundle.css` contains no rule that implements this. Eight interactive elements are below 40px at every width:

| Selector                               | `bundle.css` | Height                            |
| -------------------------------------- | ------------ | --------------------------------- |
| `.z-btn--sm`                           | :44          | `--control-sm`, 32px              |
| `.z-input--sm`, `.z-select--sm select` | :81          | `--control-sm`, 32px              |
| `.z-header__link`                      | :202         | `--control-sm`, 32px              |
| `.z-segment button`                    | :134         | 28px                              |
| `.z-menu__item`                        | :293         | 36px                              |
| `.z-side__item`                        | :188         | 36px                              |
| `.z-footer__list a`                    | :363         | no height, ~20px from line height |
| `.z-toast__action`                     | :303         | `padding: 0`, no height, ~20px    |

The segment button at 28px is the worst: it is a primary control on the billing and support pages, and 28px is 30 % below the stated minimum.

This is not a nitpick about the reference being incomplete. `bundle.css` is declared the binding reference for styles (`docs/pakete.md`, Festlegung 1: _"Jeder Umsetzer übernimmt die Abschnitte seiner Bausteine wörtlich"_), and the acceptance list is checked per route. An implementer following the reference word for word produces a UI that fails its own acceptance.

**What the library did:** added `@media (max-width: 640px)` blocks in five separate partials, because the affected selectors live in five packages: `_grundlage.css:141` (small buttons, small inputs, small selects), `_navigation.css:113` (footer links, sidebar entries) and `:99` (header links), `_formulare.css:71` (checkbox, segment buttons, slider), `_overlays.css:45` (menu items), `_rueckmeldung.css:51` (toast action). Eight overrides for one rule that belongs in one place.

**Proposed change:** add the breakpoint block to `bundle.css` itself, once, next to the other `@media (max-width: 640px)` rules, so that every implementation inherits it. The 640px breakpoint is already the system's own (`CLAUDE.md`, "Umbrüche: 640px"). Alternatively, reconsider whether `--control-sm` should exist at 32px at all, or whether it should be a token that resolves to 32px above 640px and 40px below.

---

## 3. Tabs: three parts of the specification describe three different components

**Where:** `spec/components/Tabs/README.md`, `spec/components/Tabs/preview.html:18-23`, `spec/guidelines/30-angular.md:29`, `spec/guidelines/40-bibliothek.md` (API table, row Tabs)

**What is wrong:** the same component is specified as a tab widget and as a navigation list, in the same system.

| Source                          | Says                                                                                                |
| ------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Tabs/preview.html:18`          | `<div class="z-tabs" role="tablist">` with `<button class="z-tab" role="tab" aria-selected="true">` |
| `Tabs/README.md`, "Du lieferst" | _"Der aktive Tab trägt `aria-selected="true"`"_                                                     |
| `Tabs/README.md`, last bullet   | _"zenit-ui: `<nav zTabs>` mit `<a zTab routerLink="…" [active]="…">`"_                              |
| `30-angular.md:29`              | Tabs → _"Links in `<nav>` mit `aria-current="page"`"_                                               |
| `40-bibliothek.md`, API table   | `nav[zTabs]`, `a[zTab]`, `active`                                                                   |

The Tabs README contradicts **itself**: "Du lieferst" asks for `aria-selected`, its own last bullet asks for links in a `nav`. `bundle.css:131` papers over it by styling both (`.z-tab[aria-selected="true"], .z-tab[aria-current="page"]`), which hides the contradiction rather than resolving it.

This matters beyond markup. A `role="tablist"` is a widget with roving tabindex, arrow-key navigation and associated `tabpanel` elements; a `nav` of links is browser navigation with a working back button. They are different components with different keyboard contracts, and the README's own rule _"Jeder Tab hat eine eigene URL"_ only makes sense for the second.

**What the library did:** followed `30-angular.md` and the API table. `projects/zenit-ui/src/lib/navigation/tabs.ts` implements `nav[zTabs]` and `a[zTab]` with `aria-current="page"`. The preview's markup is not reproduced anywhere.

**Proposed change:** rewrite `Tabs/preview.html` as a `<nav class="z-tabs">` with `<a class="z-tab" aria-current="page">`, fix the "Du lieferst" sentence to name `aria-current="page"`, and drop the `[aria-selected="true"]` half of the selector in `bundle.css:131`. Keep `aria-pressed` for the segment, which genuinely is a button group.

---

## 4. `.z-alert__text { flex: 1 }` makes the mobile behaviour the Alert README demands impossible

**Where:** `spec/components/bundle.css:218` and `:225`, against `spec/components/Alert/README.md`, "Regeln"

**What is wrong:** the README states _"Mobil bricht der Button unter den Text um. Heute überlappen im Hinweis 'Fehlt dein Lieblingsspiel?' Text und Link bei 375px."_ — this is one of the concrete bugs from `20-bestandsaufnahme.md:42` that the system exists to fix.

The rules cannot produce that result:

```css
.z-alert__text {
  display: grid;
  gap: 2px;
  min-width: 0;
  flex: 1;
} /* :218 */
@media (max-width: 640px) {
  .z-alert {
    flex-wrap: wrap;
  }
  .z-alert > .z-btn {
    margin-left: 32px;
  }
} /* :225 */
```

`flex: 1` is `1 1 0%`, and `min-width: 0` removes the min-content floor. The text block therefore shrinks to whatever is left instead of claiming a full line, so `flex-wrap: wrap` never triggers and the button stays on the same row, squeezed. The `margin-left: 32px` on line 225 shows the intent — it is the indent for a button _on its own line_, aligning it under the text rather than under the icon — but nothing makes the wrap happen.

**What the library did:** `projects/zenit-ui/src/styles/_rueckmeldung.css:17` adds `@media (max-width: 640px) { .z-alert > .z-btn { flex-basis: 100%; } }`, listed as a documented deviation.

**Proposed change:** add `flex-basis: 100%` for `.z-alert > .z-btn` to the existing 640px block in `bundle.css:225`. One declaration, same line.

---

## 5. `@angular/cdk/overlay-prebuilt.css` is not "pure positioning CSS"

**Where:** `spec/guidelines/30-angular.md:16`

> Die App bindet `@angular/cdk/overlay-prebuilt.css` ein. Das ist reines Positionierungs-CSS ohne Farben.

**What is wrong:** it also carries an animation. `@angular/cdk/overlay-prebuilt.css`, `.cdk-overlay-backdrop`:

```css
transition: opacity 400ms cubic-bezier(0.25, 0.8, 0.25, 1);
```

`CLAUDE.md`, "Bewegung", allows 150 ms and only on `color`, `background-color` and `border-color`. A 400 ms opacity fade on every dialog backdrop is 2.7× the permitted duration on a property that is not permitted at all. The Stylelint rule the system itself proposes (`transition: ["/transform|all/"]`) does not catch it, because it only bans `transform` and `all`.

The colour half of the claim is right — the file sets no colours — but an implementer who reads "pure positioning CSS" has no reason to look, and the violation ships silently on every dialog.

**What the library did:** `projects/zenit-ui/src/styles/_overlays.css:37` sets `.z-backdrop.cdk-overlay-backdrop { transition: none; }`, listed as a documented deviation.

**Proposed change:** correct the sentence in `30-angular.md:16` to say that the file brings a 400 ms backdrop fade which has to be neutralised, and add the neutralising rule to `bundle.css` next to `.z-backdrop` (line 408). While there, consider tightening the Stylelint `transition` rule to a positive list of the three permitted properties rather than a blocklist of two.

---

## 6. The FileTable scroll container has no accessible name and no keyboard access

**Where:** `spec/components/FileTable/preview.html:17` (`<div class="z-table-wrap">`), against `spec/components/FileTable/README.md`, "Regeln"

**What is wrong:** the README requires _"Unter 640px scrollt die Tabelle horizontal in ihrem eigenen Container. Die Seite selbst scrollt nie seitlich."_ The preview's container is a bare `<div class="z-table-wrap">` with no `role`, no `tabindex` and no `aria-label`.

A scrollable region that is not focusable cannot be scrolled by keyboard at all: there is nothing to put focus on, and the cells inside a data table are not focusable either. That is a WCAG 2.1.1 (Keyboard) failure, and it appears on exactly the breakpoint the README is about. `40-bibliothek.md` puts `@axe-core/playwright` in the acceptance criteria, so this would have to be caught later anyway — better to fix the reference.

**What the library did:** `projects/zenit-ui/src/lib/table/table.ts` gives `z-table-container` `role="region"`, `tabindex="0"` and an `aria-label` input with the German default `'Tabelle, seitlich scrollbar'`. That `ariaLabel` input is one of the undocumented API additions in item 10.

**Proposed change:** in `FileTable/preview.html`, write the container as

```html
<div
  class="z-table-wrap"
  role="region"
  tabindex="0"
  aria-label="Dateien im Serververzeichnis"
></div>
```

and add a line to the README's "Du lieferst" saying that the caller names the region. The same applies to any other scrollable container in the system; `.z-header__nav` (`bundle.css:201`) has `overflow-x: auto` and the same problem, though its children are links and therefore focusable, which mitigates it.

---

## 7. `cursor: pointer` on every row, including the ones that are not clickable

**Where:** `spec/components/bundle.css:168`

```css
.z-row {
  border-top: 1px solid var(--border);
  color: inherit;
  text-decoration: none;
  cursor: pointer;
}
```

**What is wrong:** the API table in `40-bibliothek.md` lists two row variants: `a[zRow]` and `div[zRow]`. Only the anchor is clickable. The shared class gives both the hand cursor, so a non-interactive row advertises an interaction that does not exist.

`CLAUDE.md`, Grundsatz 2, is about the same idea for colour — red marks what you can click. The cursor is the same promise in a different channel.

**What the library did:** `projects/zenit-ui/src/styles/_daten.css:65` adds `.z-root div.z-row { cursor: auto; }`, listed as a documented deviation.

**Proposed change:** move `cursor: pointer` from `.z-row` to `a.z-row` in `bundle.css:168`, or add the reset rule. The first is cleaner; both are one line.

---

## 8. `Metric/preview.html` uses a normal space before the unit

**Where:** `spec/components/Metric/preview.html:18-20`, against `spec/components/Metric/README.md`, "Regeln" and `CLAUDE.md`, "Sprache"

**What is wrong:** both the Metric README (_"deutsche Zahlenformate (Komma, geschütztes Leerzeichen vor der Einheit)"_) and `CLAUDE.md` (_"geschütztes Leerzeichen vor Einheit und Währung"_) require a non-breaking space. The preview uses a plain one:

```html
<span class="z-metric__value">0,2 <small>%</small></span>
<span class="z-metric__value">1,16 <small>/ 8,4 GB</small></span>
<span class="z-metric__sub">89 % belegt</span>
```

Every space in those three lines is U+0020. At a narrow width the value and its unit can end up on different lines, which is exactly what the rule prevents. `Metric/preview.html:21` adds a third format, `2d 21h`, with no space and no comma at all.

The reference markup is what implementers copy, so the plain space propagates. This is a small defect with a wide blast radius: the same pattern appears wherever a value meets a unit.

**What the library did:** nothing — the library holds no texts. `40-bibliothek.md` is explicit that texts come from the caller, so the value and the unit arrive as strings from the application and the library cannot enforce the spacing. This one can only be fixed in the specification.

**Proposed change:** use `&nbsp;` in `Metric/preview.html`, and everywhere else in the previews where a number meets a unit or a currency. Then add one sentence to `CLAUDE.md` making it explicit that this is the caller's responsibility and that no component inserts it, so implementers do not assume the library handles it.

---

## 9. `FileTable/preview.html` contradicts its own sorting rule

**Where:** `spec/components/FileTable/preview.html:20-23`, against `spec/components/FileTable/README.md`, "Regeln"

**What is wrong:** the README says _"Ordner zuerst, dann Dateien, beides alphabetisch."_ The preview lists:

1. `plugins` (folder)
2. `world` (folder)
3. `server.properties` (file)
4. `server.jar` (file)

Folders are correct. The files are not: `server.jar` sorts before `server.properties`. The reference markup for the component whose rule is "alphabetically" is not alphabetical.

**What the library did:** nothing — order is caller data. The demo page reproduces the preview, so the wrong order was carried over.

**Proposed change:** swap rows 3 and 4 in the preview. Trivial, but the preview is the reference implementers copy, and a reference that violates its own README undermines the rest of the file.

---

## 10. The API table omits every input the implementation actually needs

**Where:** `spec/guidelines/40-bibliothek.md`, API table

**What is wrong:** the table is declared binding — _"Selektoren und Eingaben sind verbindlich, damit Seiten und Bausteine parallel entstehen können"_ — and `.claude/agents/ui-pruefer.md` makes "Abweichung von Selektor, Inputs oder Slots der API-Tabelle" a review finding. But the table omits inputs without which the components cannot meet the system's own accessibility requirements, so every implementer is forced into a finding.

Eleven additions were needed, across eight components:

| Component          | Missing from the table                                | Why it is needed                                                                              |
| ------------------ | ----------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Segment            | `disabled`                                            | no way to disable the control                                                                 |
| Slider             | `ariaLabel`                                           | the slider has a visible `label`, but a caller sometimes needs a different accessible name    |
| Pagination         | `rangeLabel`, `ariaLabelPrev`, `ariaLabelNext`        | the range text and both icon-only buttons are otherwise hard-coded German                     |
| Console            | `logLabel`, `inputLabel`, `endLabel`                  | the log region, the command field and the "to end" button are otherwise unnamed or hard-coded |
| AppHeader          | `menuLabel`                                           | the burger button is icon-only and needs a name                                               |
| Dialog `confirm()` | `requireLabel`; `cancelLabel` is required in practice | without `requireLabel` the `requireText` field has no label                                   |
| ToastOutlet        | `closeLabel`                                          | the close button is icon-only                                                                 |
| TableContainer     | `ariaLabel`                                           | see item 6                                                                                    |

The pattern is the same every time: **the table specifies no way to name an icon-only control or a region**, while `40-bibliothek.md` itself says _"Die Lib enthält keine deutschen Strings außer `aria-label`-Standards, und die sind überschreibbar"_ — overridable, but the table provides nothing to override them with.

**What the library did:** added all of them and marked each one "(addition)" in the table in `projects/zenit-ui/README.md`, with a note above the table explaining the marking. Since this branch was cut, `main` has gone further: commit `f59ad7e` moves these defaults into a central `Z_LABELS` registry with German and English sets and a `provideZenitLabels()` provider. The input names and behaviour are unchanged, so this item stands.

**Proposed change:** add the eleven entries to the API table in `40-bibliothek.md`. Better: state the underlying rule once — every icon-only control and every landmark region takes an overridable label input — and let it apply to components added later, rather than enumerating them and missing the next one.

---

## 11. "30 Bausteine" does not match the 36 rows of the API table

**Where:** `spec/guidelines/00-auftrag.md:34` against `spec/guidelines/40-bibliothek.md`, API table

**What is wrong:** phase 2 of the order says _"alle 30 Komponenten nach der API-Tabelle, dazu Icon, Spinner, Tooltip"_, which totals 33. The API table has **36** rows. `20-bestandsaufnahme.md:56` names exactly 30 documented components, so the "30" is well defined — the table is what grew.

The three extra rows, relative to the inventory of 30 plus Icon, Spinner and Tooltip:

- **Field** — the inventory has "Input" and "Select" but no wrapper; the table has Field, Input and Select as separate rows.
- **Setting** — not in the inventory at all; it appears only as a row of the table.
- **Segment** — counted in the inventory as part of "Tabs mit Segment", a row of its own in the table.

There is also a component folder with no row anywhere: `spec/components/Cover/` — see item 18.

`projects/zenit-ui/README.md` inherited the mismatch: its first sentence says "30 building blocks … plus Icon, Spinner and Tooltip" while its own table has 36 rows.

**Proposed change:** pick one number and use it everywhere. Counting the API table rows, it is 36. Update `00-auftrag.md:34`, the inventory sentence in `20-bestandsaufnahme.md:56`, and add Field and Setting to the inventory list.

---

## 12. Stepper: "Erledigte Schritte sind Links zurück" cannot be expressed by the API

**Where:** `spec/components/Stepper/README.md`, "Regeln", against `spec/guidelines/40-bibliothek.md`, API table row Stepper

**What is wrong:** the README requires completed steps to be links back. The API is

```
Stepper | z-stepper | steps: string[], current
```

A `string[]` has no target. There is no per-step href, no route, no output, and `current` is a plain number. The component can render a step as _looking_ done, but it cannot make it a link, and a caller has no way to supply one.

The same rule appears a second time as _"wo die Schritte wirklich nacheinander kommen und man zurückspringen kann"_, so it is not an aside.

**What the library did:** implemented the API as specified. `projects/zenit-ui/src/lib/navigation/stepper.ts` has `steps: string[]` and `current: number` and renders no links. The rule is unimplemented.

**Proposed change:** either change the API to `steps: {label: string, link?: string}[]` — matching how ServerList, Segment, SpecList and PriceSummary already take object arrays — or drop the rule from the README and state that the step display is presentational and navigation back happens through the browser.

---

## 13. `PageHeader/preview.html` needs a rich `sub`, the API gives a string

**Where:** `spec/components/PageHeader/preview.html:23`, against `spec/guidelines/40-bibliothek.md`, API table row PageHeader

**What is wrong:** the second example in the preview is

```html
<p class="z-pagehead__sub">
  Guthaben <span class="z-mono" style="color:var(--text)">25,00 €</span>
</p>
```

The API row is `title`, `sub`, with the content slot reserved for the actions. `sub` is a string, so a mono-set, differently-coloured amount inside the subtitle cannot be built. `CLAUDE.md` requires prices in `mono`, so this is not a cosmetic detail of the preview — it is the correct rendering of a monetary value, and the API cannot produce it.

The preview also uses an inline `style` attribute, which no other preview does and which an implementer cannot copy into a component that has no styles of its own.

**What the library did:** implemented `sub` as a string (`projects/zenit-ui/src/lib/navigation/page-header.ts`). The mono amount from the preview is not reproducible.

**Proposed change:** make `sub` a slot instead of an input — `<ng-content select="[zPageSub]" />` alongside the actions — or add a second, optional slot for it. Failing that, change the preview to a plain subtitle and accept that the balance is shown elsewhere.

---

## 14. `GameTile/preview.html` shows a cover text the API cannot express

**Where:** `spec/components/GameTile/preview.html:22`, against `spec/components/GameTile/README.md` and the API table

**What is wrong:** the fourth tile is

```html
<button class="z-game" aria-pressed="false">
  <span class="z-game__cover">Rust</span>
  <span class="z-game__title">Rust Dedicated Server</span>
  …
</button>
```

The cover fallback says `Rust`, the title says `Rust Dedicated Server`. They are different strings. The API row is `title`, `price`, `cover`, `selected` — `cover` is the image, and when it is missing the fallback can only be derived from `title`. There is no input for a short cover text.

The preview also contradicts its own README, which says _"Fehlt das Cover, steht der Spielname in `z-game__cover`"_ and _"Der Text-Fallback zeigt stattdessen den Namen"_ — singular, one name. The other three tiles follow that; the fourth does not.

This is the tile the README singles out: _"GTA V und Rust haben heute einen Gamepad-Platzhalter."_ So the one example that exists to demonstrate the fallback is the one that demonstrates something the API cannot do.

**What the library did:** renders the `title` in the cover when `cover` is empty, per the README. The demo shows `Rust Dedicated Server` in both places, which is what the API allows and what long titles will look like in the 3:4 cover area.

**Proposed change:** either add a `coverText` input defaulting to `title`, or change the preview's fourth tile to use the same string in both places and pick a title short enough to demonstrate the fallback honestly.

---

## 15. The Hero title is the sentence shape the language rules forbid

**Where:** `spec/components/Hero/preview.html:20`, against `CLAUDE.md`, "Sprache"

**What is wrong:** the rule is _"keine Slogans aus zwei Halbsätzen ('Dein Server. Deine Regeln.')"_. The reference hero title is

> Gameserver aus Nürnberg. In etwa 60 Sekunden online.

Two half-sentences, separated by a period, in a marketing headline. Structurally identical to the example the rule names.

In fairness the content is right: both halves are concrete facts with numbers, which is what the neighbouring rule _"Zahlen statt Adjektive"_ asks for, and "in etwa 60 Sekunden" is quoted approvingly in that very rule. So this is a conflict between two rules rather than a straightforward violation — but it is the system's own flagship example, on the page pattern with the widest reach, and an implementer who follows the preview will produce headlines the review rule rejects.

**What the library did:** took the text over verbatim, per `00-auftrag.md` (_"Texte aus den Komponenten-READMEs und den Seitenmustern wörtlich übernehmen"_).

**Proposed change:** decide which rule wins and say so. Either narrow the rule to slogans without content ("two half-sentences that state no fact"), or rewrite the hero title as one sentence: _"Gameserver aus Nürnberg, in etwa 60 Sekunden online."_ — one character's difference, and it satisfies both rules.

---

## 16. Skeleton's timing rules are caller policy dressed as component rules

**Where:** `spec/components/Skeleton/README.md`, "Regeln"

**What is wrong:** two of the five rules describe behaviour no component can have:

- _"Erst nach 300ms anzeigen. Lädt es schneller, erscheint direkt der Inhalt."_
- _"Nach 10 Sekunden ohne Antwort ersetzt ein Alert mit 'Erneut versuchen' das Skeleton."_

The API row is `Skeleton | z-skeleton | width, thumb`. The component is rendered by the caller only once the caller has decided to render it; it has no knowledge of when loading started, whether a request is outstanding, or how to retry one. The second rule also requires swapping in a different component with a working action.

These are correct rules — they are just rules for the page, not for the building block. As written they sit in the file an implementer reads while building the component, and they cannot be satisfied there. `40-bibliothek.md` is explicit that the library knows no services, so the timing cannot move into it.

The same problem, less sharply, in GameTile: _"Beim Laden ist das günstigste Spiel vorausgewählt"_ is application state, not a tile property.

**Proposed change:** move both rules into `15-zustaende.md`, which is the guide about states and is where a page author would look, and leave a pointer in the Skeleton README. Or add a "Der Aufrufer regelt" heading to the component READMEs, separating what the component does from what the page around it has to do. The distinction matters for review: today an implementer cannot tell whether an unimplemented rule is a finding or out of scope.

---

## 17. `tokens.css` is named as a deliverable but is not delivered

**Where:** `spec/guidelines/00-auftrag.md:10` against `docs/pakete.md`, Festlegung 2

**What is wrong:** the instructions for reading the system say

> `project/tokens.json` und die generierte `project/tokens.css`: die einzigen erlaubten Werte.

The artifact does not ship a `tokens.css`; it is generated inside the artifact's own page at runtime. So the file the specification calls _the single source of every permitted value_ was not part of what was handed over.

**What the library did:** `docs/pakete.md`, Festlegung 2 records the workaround: `spec/tokens.css` was compiled deterministically from `spec/tokens.json` following the artifact format's "tokens.css as compiled" rule, its variable names were checked against all 53 `var(--…)` occurrences in `bundle.css`, and it was copied byte-identically to `projects/zenit-ui/src/styles/tokens.css`. Verified for this document: the two files are identical and contain 58 custom properties.

The result is almost certainly right, but "almost certainly" is the wrong standard for the file that defines every colour and every dimension in the system, and it was recompiled by an implementer rather than delivered by the designer.

**Proposed change:** ship `tokens.css` as a file next to `tokens.json`, and state which one is the source. If `tokens.json` is the source, document the compilation rule in the specification instead of leaving it to the artifact format.

---

## 18. `spec/components/Cover/` is not a component

**Where:** `spec/components/Cover/`

**What is wrong:** the folder contains only `preview.html` — no `README.md`, unlike all 30 sibling folders. It appears in no API table row, in no inventory, and in no phase of the order. `bundle.css` contains no `z-cover` class. Reading the file shows what it is: a title card for the design system artifact itself (`<h1 class="name">Zenit-<br>Hosting</h1>`), not a UI building block.

`00-auftrag.md:11` tells implementers that `project/components/<Name>/` contains a README and a preview per component. An implementer who works through the folder alphabetically hits `Cover` between `Console` and `Dialog`, finds a preview with no README and no API row, and has to decide whether it is a missing specification or not a component at all.

**Proposed change:** move it out of `components/` — to the root of the artifact, or to `spec/`. A one-line README saying "not a component, this is the artifact's title card" would also do.

---

## 19. The Combobox API line is written as a closed list, and three of its rules only hold for a static list

**Where:** `spec/components/Combobox/README.md` (last bullet) and `spec/guidelines/40-bibliothek.md:75`

**What is wrong:** both read as a complete enumeration: "API: `z-combobox` mit `options`, `[(value)]`, `placeholder`, `emptyText`; Forms." The accessible name and the form state the same README demands already need `inputId`, `ariaLabel`, `ariaLabelledby` and `disabled`; a server-side search (user search over thousands of entries, a real page of the product) needs `queryChange`, `filterLocally`, `loading`, `allowCustom`, `minQueryLength` and `selectedLabel`. The line now names 4 of 14 members. Three rules of the README assume a list that is complete at open time: "Die Liste zeigt zuerst die fünf neuesten Versionen" (with a minimum query length the first state is a hint row), "Kein Treffer: eine Zeile 'Keine Version gefunden' statt eines leeren Panels" (while loading the empty row is suppressed on purpose), "Vorbelegt ist 'Neueste' als echter Wert, nie ein leeres Feld" (a search for a user has nothing to preselect, and free text is a value no list contains). The defaults of the library keep the README's behaviour exactly; all six additions are opt-in.

**Proposed change:** either mark the API line as "at least" or list the members; add one sentence per rule saying it applies to a static list.

---

## 20. `15-zustaende.md` asks for a spinner in buttons and skeletons in lists, the Combobox waiting row needs a third shape

**Where:** `spec/guidelines/15-zustaende.md` ("Lädt") and `spec/components/Combobox/README.md`

**What is wrong:** a listbox that is waiting for the server has no cell to skeletonise, and a skeleton row inside `role="listbox"` has no accessible meaning. The library renders one non-selectable row with a spinner and the text "Lädt", announced through the status region; that is a documented deviation today.

**Proposed change:** name the waiting row as the third loading shape ("Liste im Overlay: eine Zeile mit Spinner und Wort").

---

## 21. The AppHeader README does not say what the mobile menu does after a navigation

**Where:** `spec/components/AppHeader/README.md`

**What is wrong:** the README describes the burger below 900px but not whether the opened panel closes when a link inside is used, what Escape does, and whether the application can open or close it (a tutorial in the product opens the navigation). A real integration reported the panel staying open across a route change. The library now closes on a link click and on Escape, exposes `[(open)]`, and does not lock page scroll; all of that is a decision the README should own.

**Proposed change:** three sentences: closes on link click and Escape, focus returns to the button, no scroll lock; and one API row for `open`.

---

## 22. `z-root` on `<html>` and `<body>` cannot coexist with pages that are not migrated yet

**Where:** `spec/guidelines/40-bibliothek.md` ("Einbau in die App") and `bundle.css` line 1

**What is wrong:** the reference rule `.z-root { font-size: 14px; line-height: 20px; … }` on `<html>` moves `1rem` for every legacy stylesheet, and on `<body>` it inherits into every page that still uses the old components (headings with a line height below their font size overlap). The base rules for bare `a`, `button`, `input`, `select`, `textarea` reach into those pages as well. The order's phases 4 to 6 explicitly allow old and new pages side by side until the last route is migrated, so this setup contradicts the migration plan it belongs to. The library ships `html.z-root { font-size: 100% }`, `:where()` on the bare-element rules and a documented `.z-legacy` subtree class as deviations.

**Proposed change:** either describe the migration state (`.z-legacy` or an equivalent) in "Einbau in die App", or restrict `z-root` to `<body>` plus a note on overlays.

---

## Summary

| #   | Item                                                       | Kind                                | Fix size                       |
| --- | ---------------------------------------------------------- | ----------------------------------- | ------------------------------ |
| 1   | `bundle.css:14` specificity, 4.19:1 primary button         | contrast failure                    | 5 lines                        |
| 2   | 40px click targets missing in 8 selectors                  | acceptance failure                  | 1 media block                  |
| 3   | Tabs specified three ways                                  | contradiction                       | preview + 2 sentences          |
| 4   | `.z-alert__text { flex: 1 }` blocks the mobile wrap        | unimplementable rule                | 1 declaration                  |
| 5   | CDK backdrop 400 ms fade, described as "pure positioning"  | wrong statement                     | 1 sentence + 1 rule            |
| 6   | FileTable scroll region has no name, no keyboard access    | WCAG 2.1.1                          | 1 attribute set                |
| 7   | `cursor: pointer` on non-clickable rows                    | wrong affordance                    | 1 selector                     |
| 8   | Normal space before the unit in `Metric/preview.html`      | rule violated by its own reference  | `&nbsp;`                       |
| 9   | FileTable preview not alphabetical                         | reference contradicts README        | swap 2 rows                    |
| 10  | 11 inputs missing from the binding API table               | incomplete API                      | 11 rows or 1 rule              |
| 11  | "30 Bausteine" versus 36 API rows                          | count mismatch                      | 3 sentences                    |
| 12  | Stepper "Links zurück" versus `steps: string[]`            | unimplementable rule                | API change or rule drop        |
| 13  | PageHeader preview needs a rich `sub`                      | API too narrow                      | slot instead of string         |
| 14  | GameTile cover text not expressible                        | API too narrow                      | input or preview fix           |
| 15  | Hero title is a forbidden two-half-sentence slogan         | rule versus rule                    | 1 character                    |
| 16  | Skeleton 300 ms / 10 s are caller policy                   | misplaced rules                     | move to `15-zustaende.md`      |
| 17  | `tokens.css` not delivered by the artifact                 | missing deliverable                 | ship the file                  |
| 18  | `spec/components/Cover/` is the artifact's title card      | misfiled                            | move the folder                |
| 19  | Combobox API line closed, three rules assume a static list | incomplete API, rule versus product | 1 word or 10 rows, 3 sentences |
| 20  | Loading shape for a list in an overlay                     | missing rule                        | 1 sentence                     |
| 21  | AppHeader mobile menu after navigation                     | missing rule                        | 3 sentences, 1 row             |
| 22  | `z-root` on html and body versus pages not migrated yet    | rule versus migration plan          | 1 paragraph                    |

Items 1 to 7 change what the UI does. Items 8 and 9 are defects in the reference markup that propagate into every implementation that copies it. Items 10 to 18 are specification hygiene; items 19 to 22 came out of the first real integration and the blind test: they cost an implementer time and force deviations from a document that is declared binding.

Most of these are one or two lines in `bundle.css` or one sentence in a guide. Items 12, 13 and 14 need a decision about the API shape, and item 15 needs a decision about which language rule wins.
