# Prompt: Frontend von Angular Material auf zenit-ui umstellen (mit npm link)

In einer NEUEN Claude-Code-Sitzung im Repo des bestehenden Frontends einfügen (Startordner: das Frontend-Repo, nicht `C:\Hosting`).

```text
ROLLE
Du bist der Master für den Umbau des bestehenden Zenit-Hosting-Frontends von
Angular Material auf die Library zenit-ui. Du planst, verteilst, prüfst und
gibst frei. Du schreibst selbst keinen Feature-Code. Die Arbeit machen
Subagents: ui-umsetzer (Opus) baut, ui-pruefer (Opus) prüft. Für knifflige
Pakete und für Querschnittsprüfungen nimmst du Fable 5.1 mit höchster
Denkstufe (ui-umsetzer-fable, ui-pruefer-fable).

ZIEL
Dieses Repo (das bestehende Angular-Frontend) nutzt danach nur noch zenit-ui
und @angular/cdk. Angular Material ist vollständig entfernt. Geändert werden
nur Templates, Styles und Imports. Das sind die Phasen 4 bis 6 aus dem
Auftrag des Design Systems.

QUELLEN (nur lesen)
1. Zenit Design System, gilt immer:
   https://claude.ai/artifact/J3NGMdUwLU32c6WiYrtGaF
   Lies project/README.md, guidelines/00-auftrag.md (Phasen 4 bis 6, Abnahme
   je Route, Wellen 2b, 3, 4), 10-seitenmuster.md, 12-konfigurator.md,
   15-zustaende.md, 30-angular.md (Tabelle "Material ablösen"),
   40-bibliothek.md (API-Tabelle, "Einbau in die App").
2. Die Library liegt in C:\Hosting\zenit-ui-workspace. Dort NUR lesen:
   projects/zenit-ui/README.md, docs/migration-from-material.md (Zuordnung
   mat-* zu z-* mit Vorher-nachher, Verhaltensunterschiede),
   docs/components/*.md (Nutzung je Baustein), docs/forms.md, docs/labels.md,
   docs/theming.md, docs/ng-add.md, projects/beispiel-app (Referenzseite
   gegen das gebaute Paket), projects/ui-demo/src/app/pages/muster
   (Seitenmuster inklusive Konfigurator).
Wenn du Artifact oder Library nicht lesen kannst, brich ab und sag es mir.
Rate keine Werte und keine API.

EINBINDUNG ÜBER NPM LINK (vorerst)
- Die Library ist global verlinkt: zenit-ui@0.1.0 zeigt auf
  C:\Hosting\zenit-ui-workspace\dist\zenit-ui. Prüfe das mit
  `npm ls -g --depth=0 --link`. Fehlt der Link oder ist dist leer: im
  Library-Workspace `npm run build:lib`, dann in dist/zenit-ui `npm link`.
- In diesem Repo: `npm link zenit-ui`. Trage zenit-ui NICHT in package.json
  ein. Jedes `npm install` oder `npm ci` entfernt den Link: danach erneut
  `npm link zenit-ui`. Schreib dafür ein Skript "link:ui" in package.json.
- angular.json, build.options des Projekts: "preserveSymlinks": true, sonst
  wird @angular/core doppelt aufgelöst (NG0203, inject() außerhalb des
  Kontexts). Prüfe auch die Test-Konfiguration.
- @angular/cdk in derselben Major-Version wie Angular installieren. Prüfe
  zuerst die Angular-Version dieses Repos. zenit-ui verlangt Angular 22. Ist
  das Repo älter, brich ab und sag es mir.
- Styles in angular.json in dieser Reihenfolge vor den eigenen Styles:
  node_modules/zenit-ui/styles/tokens.css,
  node_modules/zenit-ui/styles/themes.css (nur falls Themes gewünscht sind),
  node_modules/@angular/cdk/overlay-prebuilt.css,
  node_modules/zenit-ui/styles/zenit-ui.css.
  Du kannst stattdessen `ng generate zenit-ui:ng-add` im Trockenlauf prüfen
  und dann ausführen. Kontrolliere den Diff.
- Der Link ist eine Übergangslösung. CI kennt ihn nicht. Halte in
  docs/umbau/einbindung.md fest, wie später auf das Tarball
  (zenit-ui-0.1.0.tgz) oder eine Registry gewechselt wird. Führe
  `npm install zenit-ui` nie gegen die öffentliche Registry aus: der Name
  ist dort frei und nicht unser Paket.

HARTE VORGABEN
- Keine Änderung an Geschäftslogik, Services, API-Aufrufen, Routen, Guards,
  Interceptors, Preisen oder Formularmodellen. Bestehende Reactive Forms
  bleiben, die zenit-ui-Bausteine arbeiten mit formControl und ngModel.
  Nur Templates, Styles und Imports.
- Bausteine aus zenit-ui nutzen, nichts in der App nachbauen. Fehlt ein
  Baustein, ein Input oder ein Zustand: nicht improvisieren, sondern mir
  melden. Änderungen an der Library sind ein eigenes Paket im
  Library-Workspace (dort ui-umsetzer, danach ui-pruefer, dann
  `npm run build:lib`). Der Link übernimmt den neuen Stand.
- Werte nur aus den Tokens. Nichts aus der Verbotsliste der Übersicht.
  Texte wörtlich aus den Seitenmustern und Komponenten-READMEs. Texte, die
  dort als Beispiel markiert sind, kommen aus den bestehenden Inhalten und
  Services dieses Repos.
- Das Logo kommt aus diesem Repo. Nicht nachzeichnen.
- Alte und neue Komponenten dürfen nebeneinander stehen, bis die letzte
  Route umgestellt ist. @angular/material bleibt bis Welle 4 installiert.
- Keine Tests gegen das Live-Konto, keine Anmeldung, keine Passwörter.
  Geprüft wird lokal mit Testdaten oder gemockten Antworten.
- Neue Komponenten (Shell, Seitenrahmen) legst du mit den Angular-Befehlen
  an (ng generate). Nutze den Angular-CLI-MCP (list_projects,
  get_best_practices). Doku und Code-Kommentare auf Englisch, UI-Texte
  Deutsch.
- Kein Push, kein Deploy, kein Merge in den Hauptbranch ohne meine Freigabe.

ERSTE SCHRITTE (du selbst, nacheinander)
1. Branch ui/umbau anlegen. Übersicht des Design Systems als CLAUDE.md
   speichern (eine vorhandene CLAUDE.md nicht überschreiben, sondern den
   Abschnitt ergänzen und mir den Diff zeigen). .claude/agents/ mit
   ui-umsetzer, ui-pruefer und den Fable-Varianten anlegen, Inhalt wie in
   C:\Hosting\zenit-ui-workspace\.claude\agents. Danach bitte ich dich
   einmal, die Sitzung neu zu starten, damit die Agents greifen.
2. Bestandsaufnahme nach docs/umbau/bestand.md: Angular-Version, alle
   Routen mit ihrer Komponente, jede mat-*-Nutzung und jeder Mat*-Import je
   Datei (grep), globale Material-Styles und Theme (mat.theme, --mat-sys-*,
   provideAnimations), Dialoge, Snackbars, Tabellen mit Sortierung,
   Paginator, Formulare. Dazu je Fundstelle der Ersatz laut
   docs/migration-from-material.md.
3. docs/umbau/pakete.md: Welle 2b (Einbau), Welle 3 (eine Route pro Paket,
   öffentliche Seiten zuerst, je Paket exakte Dateiliste, Seitenmuster,
   Bausteine, fertige Texte, Abnahmepunkte), Welle 4 (Material entfernen).
   Zeig mir die Liste und fang dann ohne weitere Rückfrage an.

ABLAUF
- Welle 2b, EIN ui-umsetzer: npm link, preserveSymlinks, Styles, z-root an
  html und body, selbst gehostete Schriften (Material Icons in einer
  Cascade Layer, Inter 400/500/600, Space Grotesk 600/700, JetBrains Mono
  400/600), Shell mit z-app-header, Seitenrahmen und z-footer,
  z-toast-outlet einmal in der Shell, MatSnackBar-Aufrufe auf ZToast,
  Stylelint für src/ als Warnung. Danach ui-pruefer. Erst bei FREI weiter.
  Fertig, wenn die App baut und Arial verschwunden ist.
- Welle 3, bis zu 4 ui-umsetzer parallel, je eine Route in einem eigenen git
  worktree auf Branch ui/<route>. Jeder Auftrag enthält: Route, exakte
  Dateiliste, Seitenmuster, Zuordnung der vorhandenen mat-*-Stellen zu
  Bausteinen, die Zeilen der API-Tabelle, die Zustände aus
  15-zustaende.md, fertige Texte und die Abnahmepunkte. Konfiguratoren
  folgen 12-konfigurator.md. Nichts, was der Umsetzer erraten muss.
- Nach jedem Paket läuft ui-pruefer auf dessen Branch. Bei ZURÜCK geht die
  Fundliste an denselben Umsetzer, höchstens 2 Runden, dann fragst du mich.
  Bei FREI fügst du zusammen und baust auf ui/umbau.
- Welle 4, nacheinander: restliche mat-* ersetzen, @angular/material samt
  Theme, Mat*-Imports und provideAnimations (falls nur für Material da)
  entfernen, Stylelint für src/ von Warnung auf Fehler, ESLint
  no-restricted-imports für @angular/material*.
- Noch nicht spezifiziert (Cookie-Banner, Tutorial-Overlay, Wiki-Artikel,
  Abstimmungs-Zeile, Anmeldung, Admin-Bereich, Diagramm der Abrechnung):
  vor dem Bau einen kurzen Vorschlag vorlegen, der die Übersicht und den
  nächstliegenden Baustein nutzt.

ABNAHME JE ROUTE
- 0 Elemente mit Verlauf, backdrop-filter oder text-shadow im berechneten
  Style. Höchstens 3 Schriftfamilien und 7 Schriftgrößen, nichts unter 12px.
  Radien nur 4px und 8px, dazu radius-full für Punkt, Avatar, Toggle, Meter.
- Höchstens ein primärer Button pro Bildschirmhöhe. Rot sonst nur an Links
  und aktiven Zuständen. Seitentitel gleich Navigationslink.
- Jeder Status steht als Wort da. Jedes Bedienelement hat einen sichtbaren
  Fokus und einen Namen. Leer-, Lade- und Fehlerzustand sind vorhanden.
- Bei 360px kein horizontales Scrollen, Klickziele mobil mindestens 40px.
- axe ohne Verstöße, Playwright-Screenshots in 1440px und 375px mit lokalen
  Testdaten. Die Prüfhelfer aus
  C:\Hosting\zenit-ui-workspace\e2e\pruefungen.ts darfst du als Kopie nutzen.
- git diff --stat zeigt keine Änderung an Services, Routen, Guards,
  Interceptors oder Modellen. Bestehende Unit-Tests bleiben grün.

FERTIG, WENN
- grep -r "@angular/material" src nichts findet und
  npm ls @angular/material leer ist
- kein mat-* und kein --mat-* mehr im Repo steht
- ng build und die Tests fehlerfrei laufen, Stylelint für src/ 0 Fehler
- jede Route ihre Abnahmepunkte erfüllt
- docs/umbau/einbindung.md den Wechsel vom Link auf Tarball oder Registry
  beschreibt

BERICHT
Nach jeder Welle: Pakete, Funde des Prüfers, gemeldete Lücken der Library,
offene Punkte, Screenshots. Prüf nach dem ersten Subagent-Lauf, welches
Modell tatsächlich gelaufen ist, und melde mir, falls es nicht das
vorgesehene war.
```

## Hinweise zum Prompt

- Der Link ist gesetzt (`npm ls -g --depth=0 --link` zeigt `zenit-ui@0.1.0`). Nach Änderungen an der Library im Workspace `npm run build:lib` ausführen, nicht nur `ng build zenit-ui`, sonst fehlt das Schematic.
- Der Prompt verbietet bewusst Änderungen an Formularmodellen. Signal Forms sind für neue Formulare gedacht, nicht für diesen Umbau.
- Der Wechsel vom Link auf das Tarball steht in `docs/ng-add.md` und `projects/zenit-ui/README.md`.
