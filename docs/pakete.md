# Pakete zenit-ui, Wellen 0 bis 2

Projektwurzel: `C:\Hosting\zenit-ui-workspace` (eigenes git-Repo). Die Spezifikation liegt als Kopie des Design-System-Artifacts unter `spec/` und ist in jedem Worktree vorhanden. `CLAUDE.md` ist `spec/README.md`.

## Festlegungen des Masters (gelten für alle Pakete)

1. **Styles.** `spec/components/bundle.css` ist die Referenz. Jeder Umsetzer übernimmt die Abschnitte seiner Bausteine wörtlich in seine Style-Datei. Literale Werte, die dort stehen (Schriftgrößen 12 bis 56px, 1px/2px-Linien, 6px-Punkt, 16px-Spinner usw.), sind damit abgenommen. Jeder neue Wert außerhalb der Tokens ist ein Fund, außer er ist im Abschlussbericht begründet. Dokumentierte Abweichungen von bundle.css: die Basisregel für font/color nutzt `:where()` (Spezifitätsfehler der Referenz); unter 640px sind kleine Bedienelemente 40px hoch; die beiden Link-Basisregeln heißen `.z-root :where(a)` und `.z-root :where(a):hover`, aus demselben Spezifitätsgrund (bei 0,1,1 schlagen sie jede App-Klasse auf einem Link, in der ersten echten Einbindung wurde daraus ein roter Skip-Link auf roter Fläche mit 1,29:1); und `html.z-root` setzt `font-size: 100%` und `line-height: normal` zurück, weil die Referenzregel für die Seite gedacht ist und auf `<html>` sonst die rem-Basis der ganzen, noch nicht umgestellten App von 16px auf 14px zieht. `body.z-root` trägt die Klasse selbst und behält 14px/20px; die Bibliothek selbst rechnet in px und enthält kein `rem`. Dazu kommt `.z-legacy` für einen noch nicht umgestellten Teilbaum (`docs/legacy.md`): die Klasse setzt `font-size: 1rem`, `line-height: normal` und `-webkit-font-smoothing: auto`, und die sechs Basisregeln für nackte Elemente (`.z-root *`, `:where(button, input, select, textarea)`, `:where(a)` samt Hover, die Unterstreichung im Fließtext, `:focus-visible`) tragen den Ausschluss `:not(:where(.z-legacy :not(.z-legacy .z-root, .z-legacy .z-root *)))` mit Spezifität (0,0,0); ein `z-root` innerhalb von `.z-legacy` schaltet sie wieder ein. Schrift, Farbe, Hintergrund und `color-scheme` wiederholt die Anwendung selbst. Unter 900px ist die Kopfzeile eine Zeile aus Logo, rechtem Bereich und Menü-Button (`gap: space-3`, `order: 1` am Button, der rechte Bereich bricht in sich um), und ein Bild in `[zBrand]` ist ein Block.
2. **tokens.css.** Das Artifact liefert keine `tokens.css` aus (sie entsteht dort erst in der Seite). `spec/tokens.css` ist deterministisch aus `spec/tokens.json` kompiliert, nach der Regel "tokens.css as compiled" des Artifact-Formats. Variablennamen decken sich mit allen 53 `var(--…)` aus `bundle.css`. Sie wird byte-gleich nach `projects/zenit-ui/src/styles/tokens.css` kopiert.
3. **Keine geteilten Dateien in Welle 1.** Welle 0 legt für jedes Paket der Welle 1 drei leere Stubs an: Barrel `src/lib/pakete/<paket>.ts` (in `public-api.ts` schon exportiert), Style-Datei `src/styles/_<paket>.css` (in `zenit-ui.css` schon per `@import` eingebunden) und Demo-Seite `pages/<paket>/<paket>.page.ts` (Route und Navigation stehen schon). Ein Umsetzer der Welle 1 füllt nur seine Stubs und seine `lib/`-Ordner. Das Zusammenfügen ist dann ein konfliktfreier Merge.
4. **Dateinamen** nach aktuellem Angular-Styleguide ohne Suffix: `lib/button/button.ts`, dazu `index.ts` je Ordner. Klassen heißen `Z<Name>` (`ZButton`, `ZDialog`, `ZToast`).
5. **Komponenten haben keine eigenen Styles** (`styles`/`styleUrl` leer). Host-Klassen setzen die `z-*`-Klassen aus den Vorschauen. Standalone, `OnPush`, `input()`/`model()`/`output()`, kein `::ng-deep`, kein `!important`.
6. **Texte.** Die Library enthält keine deutschen Strings außer überschreibbaren `aria-label`-Standards. Demo-Texte kommen wörtlich aus `preview.html` und den READMEs. Beispieldaten sind erkennbar: Servernamen "Beispiel-…"/"Test", IPs nur aus 203.0.113.0/24, Nutzer "K".
7. **Schriften in der Demo** selbst gehostet, kein Aufruf an Google: `material-icons`, `@fontsource/inter` (400, 500, 600), `@fontsource/space-grotesk` (600, 700), `@fontsource/jetbrains-mono` (400, 600) als devDependencies des Workspace. Die Library selbst hängt nur von `@angular/core`, `common`, `forms`, `cdk`, `rxjs` ab (peerDependencies).
8. **Logo**: liegt nicht bei. `[zBrand]` zeigt den Namen "Zenit" in `display`, nichts wird gezeichnet.
9. **Worktrees** für Welle 1: `.worktrees/<paket>` (gitignored) auf Branch `ui/<paket>`. Node löst `node_modules` aus dem Elternordner auf, ein eigenes `npm ci` ist nur nötig, falls das scheitert.
10. **Unit-Tests** kommen gesammelt in Welle 2. In Welle 0 und 1 zählt: `ng build zenit-ui`, `ng build ui-demo`, `npm run lint:css`, `npm run lint`.

## Abnahmepunkte für jedes Paket (A1 bis A10)

- A1 `ng build zenit-ui` und `ng build ui-demo` fehlerfrei, Stylelint 0 Fehler, ESLint 0 Fehler.
- A2 `grep -r "@angular/material"` findet außerhalb von `spec/`, `docs/`, `CLAUDE.md`, `.claude/` und den Lint-Verboten nichts. Kein `mat-*`.
- A3 Kein `gradient`, `backdrop-filter`, `text-shadow`, `filter`, farbige `box-shadow`. Schatten nur `var(--shadow-overlay)`.
- A4 Farbe, Abstand, Radius nur über Tokens. `font-family` nur `var(--font-display|body|mono)` oder `inherit`.
- A5 Selektor, Inputs, Outputs, Slots exakt nach API-Tabelle (`spec/guidelines/40-bibliothek.md`). Markup und Klassen nach `preview.html`.
- A6 `accent`/`accent-text` nur an Interaktivem oder Aktivem. Jeder Status steht als Wort da. Keine Versalien.
- A7 Jedes Bedienelement: sichtbarer `:focus-visible`-Ring, Label oder `aria-label`, per Tab erreichbar. Aktiv/gewählt trägt `aria-current`, `aria-selected` oder `aria-pressed`.
- A8 Demo-Seite zeigt jeden Baustein in allen zutreffenden Zuständen aus `spec/guidelines/15-zustaende.md`: Ruhe, Hover (über Bedienung), Fokus, aktiv/gewählt, deaktiviert (45 %, `not-allowed`, Grund als Hinweis), lädt, Fehler, leer, Erfolg.
- A9 Bei 360px kein horizontales Scrollen der Seite, Klickziele mobil mindestens 40px hoch. Umbrüche 640px und 900px wie in `bundle.css`.
- A10 Übergänge nur `color`, `background-color`, `border-color`, 150ms, hinter `prefers-reduced-motion: no-preference`. Kein `transform` beim Hover. Ausnahme: Spinner-Rotation aus `bundle.css`.

## Welle 0: Paket `grundlage` (ein Umsetzer, Branch `ui/grundlage`, im Hauptordner)

Bausteine: Workspace, Tokens, `z-root`, Stylelint, ESLint-Verbot, Icon, Spinner, Button, Badge, Field, Input (mit `z-input-group`), Select, Panel.

Lesen: `CLAUDE.md`, `spec/guidelines/00-auftrag.md`, `30-angular.md`, `40-bibliothek.md`, `15-zustaende.md`, `spec/tokens.css`, `spec/components/bundle.css` (Kopf bis Zeile 25, Abschnitte Button, Badge, Field/Input/Select, Panel, ab "Angular-Hosts" bis Ende), `spec/components/{Button,Badge,Input,Select,Panel}/README.md` und `preview.html`.

Dateien:

```
(ng new, ng g library, ng g application, angular-eslint: erzeugte Konfigurationsdateien im Wurzelordner)
package.json  angular.json  tsconfig.json  eslint.config.js  .stylelintrc.json  .stylelintignore
projects/zenit-ui/ng-package.json            assets: ["./src/styles/**/*"]
projects/zenit-ui/package.json               peerDependencies core, common, forms, cdk, rxjs
projects/zenit-ui/src/public-api.ts
projects/zenit-ui/src/styles/tokens.css      Kopie von spec/tokens.css
projects/zenit-ui/src/styles/zenit-ui.css    nur @import der Teil-Dateien
projects/zenit-ui/src/styles/_grundlage.css
projects/zenit-ui/src/styles/_{formulare,navigation,daten,rueckmeldung,overlays,werkzeuge}.css   Stubs
projects/zenit-ui/src/lib/icon/{icon.ts,index.ts}
projects/zenit-ui/src/lib/spinner/{spinner.ts,index.ts}
projects/zenit-ui/src/lib/button/{button.ts,index.ts}
projects/zenit-ui/src/lib/badge/{badge.ts,index.ts}
projects/zenit-ui/src/lib/field/{field.ts,input.ts,input-group.ts,select.ts,index.ts}
projects/zenit-ui/src/lib/panel/{panel.ts,index.ts}
projects/zenit-ui/src/lib/pakete/{formulare,navigation,daten,rueckmeldung,overlays,werkzeuge}.ts  Stubs
projects/ui-demo/src/index.html              lang="de", z-root an html und body
projects/ui-demo/src/styles.css              @font-face/Imports der selbst gehosteten Schriften, Demo-Layout
projects/ui-demo/src/main.ts
projects/ui-demo/src/app/{app.ts,app.config.ts,app.routes.ts}
projects/ui-demo/src/app/pages/grundlage/grundlage.page.ts
projects/ui-demo/src/app/pages/<paket>/<paket>.page.ts   Stubs für die 6 Pakete der Welle 1
```

Zusätzliche Abnahme: `ng new` mit neuester stabiler Angular-Version, ohne Anwendung. Library-Präfix `z`. `paths`-Alias `zenit-ui` auf `projects/zenit-ui/src/public-api.ts`. Stylelint-Regeln wörtlich aus `30-angular.md`, Skript `lint:css` über `projects/**/*.css`. ESLint `no-restricted-imports` für `@angular/material*`. `angular.json` der Demo: `tokens.css`, `@angular/cdk/overlay-prebuilt.css`, `zenit-ui.css`, dann `styles.css`. Button: Ladezustand mit Spinner vor dem Text und deaktiviert, Minecraft-Subtheme in der Demo. Feld: Fehlerzustand mit Rahmen `danger` und Satz darunter. Panel: `title`, `flush`, `busy`, Slot `[zPanelActions]`, `z-pagination` wird ans Ende projiziert. Serverstatus-Tabelle aus `15-zustaende.md` mit Badge und Buttons in der Demo.

## Welle 1 (bis zu 4 parallel, je Worktree `.worktrees/<paket>`, Branch `ui/<paket>`)

Jedes Paket: nur die eigenen `lib/`-Ordner, das eigene Barrel `lib/pakete/<paket>.ts`, die eigene `styles/_<paket>.css`, der eigene Ordner `pages/<paket>/`. Nichts sonst. Dazu lesen alle: `CLAUDE.md`, `40-bibliothek.md`, `30-angular.md`, `15-zustaende.md`, den "Angular-Hosts"-Teil von `bundle.css`.

| Paket | Bausteine | `lib/`-Ordner und Dateien | READMEs und Vorschauen unter `spec/components/` | `bundle.css`-Abschnitte |
| --- | --- | --- | --- | --- |
| `formulare` | Checkbox, Toggle, Setting, Slider, Segment | `checkbox/{checkbox.ts,index.ts}`, `toggle/{toggle.ts,setting.ts,index.ts}`, `slider/{slider.ts,index.ts}`, `segment/{segment.ts,index.ts}` | Checkbox, Toggle, Slider, Tabs (Segment steht dort) | Checkbox/Toggle, Segment, Slider |
| `navigation` | Tabs, Stepper, Sidebar, AppHeader, PageHeader, Footer | `navigation/{tabs.ts,stepper.ts,sidebar.ts,app-header.ts,page-header.ts,footer.ts,index.ts}` | Tabs, Stepper, Sidebar, AppHeader, PageHeader, Footer | Tabs, Stepper, Sidebar, AppHeader, PageHeader, Footer |
| `daten` | Metric, ServerList, FileTable, Pagination | `metric/{metric.ts,index.ts}`, `rows/{rows.ts,index.ts}`, `table/{table.ts,index.ts}`, `pagination/{pagination.ts,index.ts}` | Metric, ServerList, FileTable, Pagination | Metric, ServerList, Table, Pagination |
| `rueckmeldung` | Alert, EmptyState, Skeleton, Toast, Tooltip | `feedback/{alert.ts,empty-state.ts,skeleton.ts,index.ts}`, `toast/{toast.ts,toast-outlet.ts,index.ts}`, `tooltip/{tooltip.ts,index.ts}` | Alert, EmptyState, Skeleton, Toast | Alert, EmptyState, Skeleton, Toast, Toast-Outlet, Tooltip |
| `overlays` | Dialog, Menu | `dialog/{dialog.ts,dialog-layout.ts,confirm-dialog.ts,index.ts}`, `menu/{menu.ts,index.ts}` | Dialog, Menu | Dialog, Menu, CDK-Overlays |
| `werkzeuge` | Console, Hero, GameTile, PriceSummary, SpecList, Faq | `console/{console.ts,index.ts}`, `marketing/{hero.ts,game-tile.ts,price-summary.ts,spec-list.ts,faq.ts,index.ts}` | Console, Hero, GameTile, PriceSummary, SpecList, Faq | Console, Hero, GameTile, PriceSummary, SpecList, Faq |

Zusätzliche Abnahme je Paket:

- **formulare**: Checkbox, Toggle, Slider, Segment implementieren `ControlValueAccessor`. Demo zeigt je Baustein `model()`-Bindung, `ngModel` und `formControl`, dazu deaktiviert. Toggle ist `input[type=checkbox][role=switch]`, mit `ariaLabelledby` auf `titleId` von `z-setting`. Segment mit `aria-pressed`.
- **navigation**: Tabs als Links mit `aria-current="page"`. Sidebar wird unter 900px zum Select. AppHeader klappt unter 900px in ein Menü, Guthaben bleibt sichtbar. `[zBrand]` als Schrift. Unter 640px stehen PageHeader-Aktionen unter dem Titel. Footer öffentlich (Spalten) und Kundenbereich (nur `[zFooterBase]`).
- **daten**: Metric `percent` ab 80 Warnung, ab 95 Fehler, Status zusätzlich als Wort. Zeilen in ServerList sind Links, Aktionen in der Zeile eigene Tab-Stopps. FileTable scrollt unter 640px im eigenen Container. Pagination `[(page)]`, `pageSize` 25, `total`, `itemLabel`, erste/letzte Seite deaktiviert, leere Liste zeigt keine Pagination. Lade- (Skeleton-Platzhalter als einfache Zeilen) und Leerzustand in der Demo.
- **rueckmeldung**: Alert-Varianten info, success, warning, danger, neutral, Button bricht mobil unter den Text. Toast-Service `show`, `success`, `error`, `dismiss` mit Optionen `status`, `icon`, `actionLabel`, `action`, `duration`, Fehler mit `role="alert"`, sonst `role="status"`. Tooltip auf `@angular/cdk/overlay`, erscheint bei Hover und Fokus, Escape schließt, `aria-describedby`. Skeleton `width`, `thumb`.
- **overlays**: `ZDialog.open(component, config)` und `confirm({title, body, confirmLabel, cancelLabel, danger, requireText})` liefern `Observable<boolean>` auf `@angular/cdk/dialog`. Fokusfalle, Escape, Fokus-Rückgabe. `requireText` sperrt den Bestätigen-Button bis zur Eingabe. Unter 640px unten angedockt. Menu auf `@angular/cdk/menu`, `(triggered)`, `danger`, `disabled`, `z-menu-separator`.
- **werkzeuge**: Console scrollt mit, solange man unten steht, sonst Button "Zum Ende", Pfeil hoch holt den letzten Befehl, deaktiviert mit EmptyState-Text im Log, lange Zeilen brechen um. Faq ist natives `details`/`summary`. GameTile `aria-pressed`, 2px-Linie bei gewählt. Hero einspaltig unter 900px, `display-xl` unter 640px als `display-lg`.

## Welle 2 (abschließend, auf `main`)

| Paket | Inhalt | Dateien | Abnahme |
| --- | --- | --- | --- |
| `tests` | Unit-Tests für Field/Input/Select, Checkbox, Toggle, Slider, Segment, Pagination, Toast | `projects/zenit-ui/src/lib/{field,checkbox,toggle,slider,segment,pagination,toast}/*.spec.ts` | `ng test zenit-ui` grün. Geprüft: `model()`, `ngModel`, `formControl`, deaktiviert, Seitenrechnung und Grenzen, Toast `show`/`dismiss`/`duration`/Rolle |
| `e2e` | Playwright mit `@axe-core/playwright` | `playwright.config.ts`, `e2e/demo.spec.ts`, `e2e/screenshots/`, `package.json` (devDependencies, Skript `e2e`) | je Demo-Seite: Screenshot 1440px und 375px, axe 0 Verstöße, bei 360px `scrollWidth <= clientWidth`, im berechneten Style 0 Verläufe, 0 `backdrop-filter`, 0 `text-shadow`, höchstens 3 Schriftfamilien und 7 Schriftgrößen, nichts unter 12px, Fokus-Ring sichtbar |
| `release` | README mit Einbindung, Version 0.1.0, `npm pack` als Probe | `README.md`, `projects/zenit-ui/README.md`, `projects/zenit-ui/package.json` | `ng build zenit-ui`, `npm pack` in `dist/zenit-ui` erzeugt `zenit-ui-0.1.0.tgz` mit `styles/`. Kein Publish |

## Fertig, wenn

Builds, Tests und Stylelint grün, `@angular/material` nirgends, alle 30 Bausteine plus Icon, Spinner, Tooltip in allen Zuständen in `ui-demo`, Style-Prüfung und 360px bestanden, jeder Fokus sichtbar. Kein Push, kein Publish, kein Deploy ohne Freigabe.

## Nachtrag: Paket `konfigurator` (Branch `ui/konfigurator`)

Quelle: Design System Version vom 21.09.2026, 16:26 (`spec/guidelines/12-konfigurator.md`, API-Tabelle mit 8 neuen Zeilen, `bundle.css` Abschnitt "Erweiterung 3", neue Werte für `chart-1` bis `chart-4`). Jetzt 38 Bausteine plus Icon, Spinner, Tooltip.

Bausteine: OptionCard (`z-option-group`), Combobox (`z-combobox`), Wizard (`z-wizard`, `z-wizard-step`, Layout `z-config` mit `[zConfigAside]`), StickyBar (`z-sticky-bar`), IncludedList (`z-included-list`), Disclosure (`z-disclosure`), InputAction (`z-input-action`), CostChart (`z-cost-chart`). Dazu PriceSummary um die Zustände aus `spec/components/PriceSummary/README.md` erweitert.

Dateien: `projects/zenit-ui/src/lib/configurator/**`, `projects/zenit-ui/src/lib/cost-chart/**`, `projects/zenit-ui/src/lib/pakete/konfigurator.ts`, `projects/zenit-ui/src/styles/_konfigurator.css`, je eine Zeile in `public-api.ts` und `zenit-ui.css`, `lib/marketing/price-summary.ts` mit Spec, neue Label-Schlüssel in `lib/labels/labels.ts`, Demo `pages/konfigurator/**` (Bausteine in allen Zuständen), `pages/muster/server-erstellen.page.ts` (Ablauf mit drei Schritten), `pages/muster/preisrechner.page.ts` (Variante ohne Schritte mit CostChart), Routen und Navigation, `e2e/pruefungen.ts` (Routenliste), `e2e/konfigurator.spec.ts`, Doku unter `docs/components/`.

Festlegungen des Masters: PriceSummary bekommt `loading`, `error`, `retryLabel`, `(retry)`, `total`, `legalNote` und das Feld `discount` in `lines`; sichtbare Standardtexte (Wizard "Ändern", CostChart-Beschriftungen, Combobox-Leertext als Rückfall) liegen in der Label-Registrierung und sind überschreibbar; die wörtlich übernommenen Literale aus "Erweiterung 3" (176px, 104px, 340px, 248px, 36px usw.) sind abgenommen.

Zusätzliche Abnahme: Tastaturbedienung von OptionCard (Pfeile, Tab verlässt die Gruppe), Combobox (ARIA-Muster, Fokus bleibt im Feld, Leerzeile) und Wizard; axe ohne Verstöße auf allen Konfigurator-Seiten in allen drei Farbschemata; 360px ohne horizontales Scrollen; StickyBar nur unter 900px; genau ein primary ("Kostenpflichtig bestellen"), deaktiviert bis alles gültig ist; jede Vorgabe gültig und bestellbar; Preis immer eine Zahl; Einheiten nur GB, vCPU, Tage; Auswahl in den Query-Parametern; Unit-Tests für `z-option-group`, `z-combobox`, `z-input-action` und die Knickpunkt-Berechnung von `z-cost-chart`.
