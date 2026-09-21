# Auftrag für Claude Code

Dieses Design System ist die vollständige Vorgabe für die Umsetzung. Du baust daraus ein **neues, eigenständiges Angular-Projekt**: die Library `zenit-ui` mit Demo-App. Es ist unabhängig vom bestehenden Frontend von Zenit-Hosting. Du brauchst dessen Repo nicht, liest es nicht und änderst es nicht.

Der Umbau des bestehenden Frontends (Phasen 4 bis 6) ist ein späterer, eigener Auftrag. Er beginnt erst, wenn der Mensch ihn ausdrücklich erteilt.

## So liest du das System

1. Die Übersicht (`project/README.md`): Grundsätze, Sprache, Farbe, Typografie, Form, Bewegung, Verbote. Sie gilt immer und gehört als `CLAUDE.md` ins Repo.
2. `project/tokens.json` und die generierte `project/tokens.css`: die einzigen erlaubten Werte.
3. Je Komponente `project/components/<Name>/README.md` (Regeln, was der Aufrufer liefert) und `preview.html` (Referenz-Markup). `project/components/bundle.css` enthält die Referenz-Styles aller Komponenten.
4. Die Leitfäden: Seitenmuster, Zustände, Bestandsaufnahme, Umsetzung in Angular, Als eigene Library.

Die Vorschauen sind statisches HTML. Sie legen Aussehen, Klassen und Markup fest, nicht die Angular-API. Die API steht im Leitfaden "Als eigene Library".

## Harte Vorgaben

- Abhängigkeiten der Library: `@angular/core`, `@angular/common`, `@angular/forms`, `@angular/cdk`, `rxjs`. Sonst nichts.
- Kein `@angular/material`, auch nicht vorübergehend. Erlaubt ist nur die Icon-Schrift Material Icons als Webfont.
- Werte nur aus den Tokens. Kein Hex, kein `rgb()`, keine Abstände oder Radien außerhalb von `tokens.css`.
- Nichts aus der Verbotsliste der Übersicht.
- Das neue Projekt enthält keine Geschäftslogik, keine API-Aufrufe und keine echten Kundendaten. Die Demo-App arbeitet mit Beispieldaten, die als solche erkennbar sind.
- Im späteren Umbau des Frontends: keine Änderung an Geschäftslogik, Services, API-Aufrufen, Routen oder Preisen. Nur Templates, Styles und die Einbindung der Library.
- Texte aus den Komponenten-READMEs und den Seitenmustern wörtlich übernehmen. Texte, die dort als Beispiel markiert sind (FAQ-Antworten, Preise in PriceSummary), kommen aus den bestehenden Inhalten und Services.
- Das Logo kommt aus dem Repo. Nicht nachzeichnen.
- Keine Tests gegen das Live-Konto, keine Anmeldung, keine Passwörter. Geprüft wird an der Demo-App und lokal mit Testdaten.
- Kein Push und kein Deploy ohne ausdrückliche Freigabe.

## Reihenfolge

| Phase | Ergebnis | Fertig, wenn |
| --- | --- | --- |
| 1 Neues Projekt | leerer Ordner, `ng new zenit-ui-workspace --no-create-application`, darin `projects/zenit-ui`, `projects/ui-demo`, `tokens.css`, `zenit-ui.css`, Stylelint, eigenes git-Repo | `ng build zenit-ui` läuft, Stylelint meldet 0 Fehler |
| 2 Bausteine | alle 38 Komponenten nach der API-Tabelle, dazu Icon, Spinner, Tooltip | jede Komponente steht in `ui-demo` in allen Zuständen aus dem Leitfaden "Zustände" |
| 3 Prüfung der Library | Unit-Tests für Formular-Bausteine, Pagination, Toast; Playwright-Screenshots der Demo in 1440px und 375px; axe ohne Verstöße | Tests grün, kein horizontales Scrollen bei 360px |
| 4 Einbau (späterer Auftrag) | Tokens und Styles global, Shell (AppHeader, Seitenrahmen, Footer) | App baut, Arial ist verschwunden |
| 5 Seiten (späterer Auftrag) | eine Route pro Arbeitspaket nach "Seitenmuster", öffentliche Seiten zuerst | je Route die Abnahmepunkte unten |
| 6 Material entfernen (späterer Auftrag) | alle `mat-*` ersetzt, Paket und Theme entfernt | `grep -r "@angular/material" src` findet nichts, `npm ls @angular/material` ist leer |

## Abnahme je Route

- 0 Elemente mit Verlauf, `backdrop-filter` oder `text-shadow` im berechneten Style.
- Höchstens 3 Schriftfamilien und 7 Schriftgrößen, nichts unter 12px.
- Radien nur 4px und 8px, dazu `radius-full` für Punkt, Avatar, Toggle, Meter.
- Höchstens ein primärer Button pro Bildschirmhöhe. Rot sonst nur an Links und aktiven Zuständen.
- Seitentitel gleich Navigationslink. Kein Versal-Label, kein Pill-Badge über Überschriften.
- Jeder Status steht als Wort da. Jedes Bedienelement hat einen sichtbaren Fokus.
- Leer-, Lade- und Fehlerzustand sind vorhanden.
- Bei 360px kein horizontales Scrollen, Klickziele mindestens 40px hoch.

## Arbeitsweise mit Subagents

Die Hauptsitzung läuft auf Fable 5.1 und ist der Master. Sie plant, verteilt, prüft und gibt frei. Sie schreibt selbst keinen Feature-Code. Die Arbeit machen Subagents auf Opus.

| Rolle | Modell | Darf | Aufgabe |
| --- | --- | --- | --- |
| Master (Hauptsitzung) | Fable 5.1 | lesen, Subagents starten, mergen | Pakete schneiden, Aufträge schreiben, Abnahme, Rückfragen an den Menschen |
| `ui-umsetzer` | Opus | lesen, schreiben, Build und Tests ausführen | genau ein Paket bauen |
| `ui-pruefer` | Opus | nur lesen, Build und Lint ausführen | ein fertiges Paket gegen dieses System prüfen |

Lege als Erstes diese zwei Dateien an. Das Feld `model: opus` sorgt dafür, dass die Subagents auf Opus laufen, auch wenn die Hauptsitzung ein anderes Modell nutzt.

`.claude/agents/ui-umsetzer.md`

```markdown
---
name: ui-umsetzer
description: Baut genau ein Paket der Zenit-UI-Umsetzung (eine Komponente der Library oder eine Route der App). Nur Angular und CDK, kein Angular Material.
tools: Read, Edit, Write, Grep, Glob, Bash
model: opus
---
Du baust genau EIN Paket, das dir der Master nennt.

1. Lies CLAUDE.md (Übersicht des Zenit Design Systems) vollständig, danach
   die im Auftrag genannten Komponenten-READMEs, Vorschauen und Leitfäden.
2. Arbeite nur in den Dateien, die im Auftrag stehen. Brauchst du eine
   Änderung außerhalb, brich ab und melde sie dem Master.
3. Abhängigkeiten: nur @angular/core, common, forms, cdk und rxjs.
   Kein @angular/material. Icons über z-icon (Schrift Material Icons).
4. Nur Token-Werte. Kein Hex, kein rgb(), keine Abstände oder Radien
   außerhalb von tokens.css. Nichts aus der Verbotsliste.
5. Library-Pakete: Selektor, Inputs und Slots exakt nach der API-Tabelle
   im Leitfaden "Als eigene Library". Markup und Klassen nach preview.html.
   Dazu ein Abschnitt in ui-demo mit allen Zuständen.
6. App-Pakete: nur Templates, Styles und Imports. Keine Logik, keine
   Services, keine Routen, keine Preise. Bausteine aus zenit-ui nutzen,
   nichts nachbauen.
7. Am Ende: ng build, Stylelint und die Tests des Pakets müssen laufen.
8. Antworte in höchstens 15 Zeilen: geänderte Dateien, entfernte Effekte
   oder mat-Komponenten, jeder Wert ohne Token mit Begründung, offene Punkte.
```

`.claude/agents/ui-pruefer.md`

```markdown
---
name: ui-pruefer
description: Prüft ein umgesetztes Zenit-UI-Paket gegen das Design System. Ändert keine Dateien.
tools: Read, Grep, Glob, Bash
model: opus
---
Prüfe das genannte Paket gegen CLAUDE.md, die Komponenten-READMEs und
die Abnahmepunkte aus "Auftrag für Claude Code". Gib eine Tabelle
Datei / Zeile / Verstoß / Fix aus. Prüfe mindestens:
- Import oder Nutzung von @angular/material, mat-* im Template
- gradient, backdrop-filter, text-shadow, farbige box-shadow
- Hex-, rgb- oder Pixel-Werte für Farbe, Abstand, Radius außerhalb der Tokens
- font-family außerhalb der drei Token-Schriften
- accent oder accent-text auf nicht interaktiven Elementen
- interaktive Elemente ohne :focus-visible oder ohne Label
- eigene Buttons, Badges, Felder, Tabellen statt zenit-ui
- Abweichung von Selektor, Inputs oder Slots der API-Tabelle
- fehlende Zustände: leer, lädt, Fehler, deaktiviert, mobil 360px
- Änderungen an Logik, Services oder Routen (git diff --stat)
Führe ng build und Stylelint aus. Ändere nichts.
Urteil am Ende: FREI oder ZURÜCK mit Anzahl der Funde.
```

### Ablauf

1. Der Master liest die Projektstruktur, ersetzt in seiner Paketliste alle angenommenen Pfade durch echte und zeigt sie dem Menschen.
2. **Welle 0, nacheinander, ein Umsetzer:** Library und Demo-App anlegen, `tokens.css`, `zenit-ui.css`, Stylelint, dann Icon, Spinner, Button, Badge, Field mit Input und Select, Panel. Danach Prüfer. Erst bei FREI weiter.
3. **Welle 1, parallel, bis zu 4 Umsetzer:** die übrigen Bausteine in den Gruppen der Tabelle unten. Jede Gruppe hat eigene Dateien.
4. **Welle 2, abschließend:** Prüfung der Library nach Phase 3, README mit Einbindung, Version 0.1.0, `npm pack` als Probe. Damit endet dieser Auftrag.

Nur im späteren Auftrag für das bestehende Frontend:

4. **Welle 2b, nacheinander:** Einbau in die App (Tokens, `z-root`, AppHeader, Seitenrahmen, Footer).
5. **Welle 3, parallel, bis zu 4 Umsetzer:** eine Route pro Paket nach "Seitenmuster", öffentliche Seiten zuerst.
6. **Welle 4, nacheinander:** restliche `mat-*` ersetzen, Material entfernen.

| Paket in Welle 1 | Bausteine | Dateien |
| --- | --- | --- |
| Formulare | Checkbox, Toggle mit Setting, Slider, Segment | `lib/checkbox`, `lib/toggle`, `lib/slider`, `lib/segment` |
| Navigation | Tabs, Stepper, Sidebar, AppHeader, PageHeader, Footer | `lib/navigation` |
| Daten | Metric, ServerList, FileTable, Pagination | `lib/metric`, `lib/rows`, `lib/table`, `lib/pagination` |
| Rückmeldung | Alert, EmptyState, Skeleton, Toast, Tooltip | `lib/feedback`, `lib/toast`, `lib/tooltip` |
| Overlays | Dialog, Menu | `lib/dialog`, `lib/menu` |
| Werkzeuge und Öffentlich | Console, Hero, GameTile, PriceSummary, SpecList, Faq | `lib/console`, `lib/marketing` |
| Konfigurator | OptionCard, Combobox, Wizard, StickyBar, IncludedList, Disclosure, InputAction, CostChart. In der Demo zusätzlich eine Seite, die den ganzen Konfigurator nach dem Leitfaden "Konfigurator" mit Beispieldaten zeigt | `lib/configurator`, `lib/cost-chart` |

`zenit-ui.css`, `public-api.ts` und die Demo-Seite fassen alle an. Damit es keine Konflikte gibt, schreibt jeder Umsetzer seine Styles in eine eigene Datei `styles/_<paket>.css` und seinen Demo-Abschnitt in eine eigene Komponente. Der Master fügt beides nach der Freigabe zusammen.

### Regeln für den Master

- Jeder Umsetzer arbeitet in einem eigenen git worktree auf dem Branch `ui/<paket>`.
- Ein Auftrag an einen Umsetzer enthält: Paketname, exakte Dateiliste, die zu lesenden Komponenten-READMEs, die Zeilen der API-Tabelle, fertige Texte und die Abnahmepunkte. Nichts, was der Umsetzer erraten muss.
- Nach jedem Umsetzer läuft der Prüfer auf dessen Branch. Bei ZURÜCK geht die Fundliste an denselben Umsetzer, höchstens 2 Runden, dann entscheidet der Mensch.
- Bei FREI: mergen, `ng build` und Tests auf dem Hauptbranch, Paket abhaken.
- Braucht ein Umsetzer ein neues Token oder einen neuen Baustein, entscheidet der Master. Neue Tokens sind die Ausnahme und werden im Design System nachgetragen.
- Am Ende jeder Welle bekommt der Mensch eine Zusammenfassung: Pakete, Funde, offene Punkte, Screenshots der Demo in 1440px und 375px.

## Offene Punkte

Für das neue Projekt ist nichts offen, du kannst sofort beginnen. Die folgenden Punkte betreffen nur den späteren Umbau des bestehenden Frontends.

- Echte Ordnerstruktur und Namen der bestehenden Komponenten (im DOM gesehen: `app-public-header`, `app-public-footer`, `app-pricing`, `app-flex-calculator`, `app-minecraft-landing`, `app-hardware-page`, `app-toast-container`, `app-cookie-banner`, `app-tutorial-overlay`).
- Welche `mat-*` Komponenten heute im Einsatz sind. Gesehen: `mat-toolbar`, `mat-icon`, Formularfelder, Select, Slide-Toggle, Paginator.
- Noch nicht spezifiziert: Tooltip-Inhalte, Diagramm der Abrechnung, Cookie-Banner, Tutorial-Overlay, Wiki-Artikel, Abstimmungs-Zeile, Anmeldung, Admin-Bereich. Für sie gelten die Übersicht und die nächstliegende Komponente. Lege vor dem Bau einen kurzen Vorschlag vor.
