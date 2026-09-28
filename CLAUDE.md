Zenit-Hosting vermietet Gameserver aus Nürnberg. Die Oberfläche soll wie das Werkzeug eines Hosters wirken: technisch, ruhig, dicht. Dieses System gilt für die öffentliche Website, den Kundenbereich unter `/user` und die Server-Panels.

## Grundsätze

1. **Hierarchie vor Effekt.** Größe, Gewicht und Abstand ordnen die Seite. Verläufe, Glow, Blur und Textschatten kommen nicht vor.
2. **Rot ist eine Handlung.** `accent` und `accent-text` stehen für das, was man anklicken kann oder was gerade aktiv ist. Rot dekoriert nichts und meldet keine Fehler.
3. **Ein Fakt, ein Ort.** Jede Aussage steht einmal auf der Seite, als konkreter Wert mit Einheit.
4. **Rahmen nur um Werkzeuge.** Ein Panel umschließt Daten oder ein Werkzeug. Text steht frei und wird über Abstand und 1px-Linien gegliedert.
5. **Jeder Zustand ist gestaltet.** Leer, ladend, fehlgeschlagen, deaktiviert, fokussiert und mobil gehören zur Komponente.

## Sprache

- Deutsch, du-Form, aktiv. "Server erstellen", nicht "Zum Dashboard" oder "Los geht's".
- Zahlen statt Adjektive: "1 Gbit/s", "ab 1,98 € im Monat", "in etwa 60 Sekunden". Nicht "blitzschnell" oder "Enterprise-Hardware. Keine Kompromisse."
- Überschriften benennen den Inhalt: "Hardware und Plattform", nicht "Womit wir überzeugen".
- Normale Groß- und Kleinschreibung überall. Keine Versalien in Labels, Badges, Buttons oder Panel-Titeln.
- Kein Gedankenstrich als Satzbau ("konfigurieren — fertig"), keine Emojis, keine Slogans aus zwei Halbsätzen ("Dein Server. Deine Regeln.").
- Seitentitel und Navigationslink heißen gleich.
- Zahlenformat: Komma als Dezimalzeichen, geschütztes Leerzeichen vor Einheit und Währung, Datum als 18.09.2026, 15:55.
- Fehlermeldungen nennen Ursache und nächsten Schritt.

## Farbe

- Grund ist `bg`. Panels, Felder und Sidebar liegen in `surface` darauf. `surface-raised` ist Hover und Overlay, `surface-hover` der aktive Eintrag.
- Text in drei Stufen: `text` für Inhalte, `text-muted` für Beschreibungen und Icons, `text-subtle` für Zeitstempel und Platzhalter. `text-subtle` nie auf `surface-hover`.
- `accent` ist nur Fläche (primärer Button, gewählte Checkbox) mit `on-accent` als Schrift. Rote Schrift und rote Linien nehmen `accent-text`.
- Status hat eigene Farben: `success`, `warning`, `danger`, `info`, jeweils mit `-subtle` als Fläche. Ein Status steht immer auch als Wort da.
- `danger` ist bewusst heller und oranger als `accent-text`, damit ein Fehler nicht wie die Marke aussieht.
- Trennlinien nehmen `border`. Alles, was man bedienen kann, bekommt `border-control`, weil nur der 3:1 erreicht.
- Fokus ist überall ein 2px-Ring in `focus` mit 2px Abstand.
- Diagramme mit mehreren Reihen nutzen `chart-1` bis `chart-4` in fester Reihenfolge, mit Legende und Werten im Tooltip. Eine einzelne Reihe ist neutral in `text`. Statusfarben sind nie Reihenfarben, und Beschriftungen tragen Textfarben, nie die Reihenfarbe.

## Typografie

- `display` (Space Grotesk) nur für Überschriften: `display-xl`, `display-lg`, `heading-1`, `heading-2`.
- `body` (Inter) für alles andere, auch für `button`, `input`, `select` und `textarea`. Setze global `font: inherit`, sonst fallen Bedienelemente auf Arial zurück.
- `mono` (JetBrains Mono) für Preise, Kennzahlen, IP-Adressen, Ports, Dateinamen, Konfigurationsschlüssel und Logs, immer mit `tabular-nums`. Fira Code und Press Start 2P entfallen.
- Es gibt 13 Textstile und 7 Größen: 12, 14, 16, 20, 28, 40, 56px. Nichts ist kleiner als 12px.
- Öffentliche Seiten lesen in `body` (16px), der Kundenbereich arbeitet in `body-sm` (14px).
- Fließtext ist höchstens `measure` breit. Überschriften bekommen `text-wrap: balance`.
- Eine Überschrift hat eine Farbe. Die zweite Zeile wird nicht rot oder grün eingefärbt.

## Abstand und Layout

- Nur die neun Stufen `space-1` bis `space-9`.
- Inhalt ist höchstens `container` breit und linksbündig. Zentriert ist allein der Abschluss-CTA öffentlicher Seiten.
- Öffentliche Abschnitte haben `space-9` Innenabstand, mobil `space-8`. Abschnitte trennt eine 1px-Linie in `border`, kein Farbwechsel.
- Im Kundenbereich: PageHeader, dann `space-6`, dann Panels mit `space-5` Lücke.
- Geschwister liegen in Grid oder Flex mit `gap`. Keine Einzelmargen.
- Umbrüche: 640px (Listen einspaltig, Aktionen unter dem Titel) und 900px (Sidebar wird zum Select, Hero einspaltig). Bei 360px gibt es kein horizontales Scrollen.
- Klickziele sind mobil mindestens 40px hoch.

## Form

- Zwei Radien: `radius-sm` für Kleines (Badge, Feld, Checkbox, Sidebar-Eintrag), `radius-md` für Button, Panel, Cover, Dialog. `radius-full` nur für Punkt, Avatar, Toggle und Meter.
- Ein Schatten: `shadow-overlay` für Menü, Dialog und Toast. Nichts anderes wirft Schatten. Hinter einem Dialog liegt `scrim`, nie ein Blur.
- Rahmen sind 1px. Die einzigen 2px-Linien sind der aktive Tab, die gewählte Spielkachel und der Fokus-Ring.

## Bewegung

- Übergänge dauern 150ms und betreffen nur `color`, `background-color` und `border-color`.
- Kein `transform` beim Hover, keine Einblendungen beim Scrollen, keine pulsierenden Punkte, keine schwebenden Blöcke.
- Ladezustände sind die Ausnahme: ein Spinner im Button, Skelettzeilen in Listen.
- Alles steht hinter `prefers-reduced-motion: no-preference`.

## Ikonografie

- Material Icons (die Schrift, die die Seite heute lädt), Größe `icon` (20px), Farbe `text-muted`. In Badges 16px.
- Icons stehen ohne Hintergrundfläche. Die rot getönten Quadrate hinter Icons entfallen.
- Ein Icon steht nur dort, wo es beim Wiederfinden hilft: Sidebar, Werkzeugleisten, Buttons mit Aktion. Nicht vor Überschriften, Panel-Titeln oder Fakten.
- Farbig ist ein Icon nur im aktiven Sidebar-Eintrag und in einem Alert.
- Das Logo liegt diesem System nicht als Datei bei. Nimm es aus dem Repo und zeichne es nicht nach.

## Minecraft-Subtheme

- Auf `/minecraft` und im Minecraft-Panel setzt du `z-theme-mc` an den Seitencontainer. Dann wird der primäre Button `mc-accent` mit `on-mc`, und aktive Icons werden grün.
- Alles andere bleibt gleich: Flächen, Radien, Schrift, Abstände, Statusfarben.
- Pixelschrift, schwebende Blöcke, Grasleiste und der grüne Glow entfallen. Das Spiel zeigt sich über Screenshots des eigenen Panels und über die Loader-Namen.

## Technik

- Umsetzung in Angular mit `@angular/cdk`. Angular Material wird nicht verwendet, weder Komponenten noch Theme.
- Einzige Ausnahme ist die Icon-Schrift Material Icons, eingebunden als Webfont.
- Formularfelder sind native Elemente mit eigenen Klassen. Overlays, Fokusfallen und Menüs kommen aus dem CDK.
- Alle Werte stehen als CSS Custom Properties in `tokens.css`. Komponenten nutzen nur diese Variablen.
- Der Auftrag für die Umsetzung steht im Abschnitt "Auftrag für Claude Code".

## Verboten

`@angular/material`, `linear-gradient`, `radial-gradient`, `backdrop-filter`, `text-shadow`, farbige `box-shadow`, Raster-Hintergründe, Pill-Badges über Überschriften, Versal-Labels, Icon-Flächen, Karten mit farbigem Rand, Kennzahlen-Kacheln für Marketing-Zahlen, Hex-Werte oder Pixel-Werte außerhalb der Tokens.

## Subagents

Die Agents liegen unter `.claude/agents/`. Modelle: `claude-sonnet-5` setzt um, `claude-opus-5-5` plant, gestaltet und prüft, `claude-fable-5-1` ist nur für die Eskalation da. Jeder Agent hat Aufwand (`effort`) und eine Rundengrenze (`maxTurns`) passend zu seiner Aufgabe.

### Ablauf

1. `explorer`, nur wenn die betroffenen Dateien nicht schon feststehen.
2. `architect`, nur bei mehr als 3 betroffenen Dateien oder wenn öffentliche API, Paketstruktur, Theming oder SSR berührt sind.
3. `component-builder` baut Struktur, Markup und Klassen.
4. Parallel in einer Nachricht: `designer` für das Erscheinungsbild und `test-writer` für die Tests.
5. `build-fixer`, nur bei Build-, Lint- oder Typfehlern.
6. Parallel in einer Nachricht: `api-guardian` und `code-reviewer` auf denselben Diff.
7. `docs-writer`, sobald sich öffentliche API, Demo oder CHANGELOG ändern.
8. Vor der Übergabe läuft `npm run check` (Node 24 wie in der CI).

### Effizienz

- Kleine Änderungen an 1 bis 2 Dateien erledigst du direkt, ohne Subagents.
- Gib jedem Agent mit, was schon bekannt ist: Dateiliste des `explorer`, Plan des `architect`, Befunde der Prüfer. Kein Agent sucht, was ein anderer schon gefunden hat.
- Eine Nachbesserung schickst du mit `SendMessage` an denselben Agent, statt einen neuen zu starten. Er behält seinen Kontext.
- Unabhängige Schritte startest du parallel in einer Nachricht, zum Beispiel mehrere `explorer`-Suchen in verschiedenen Bereichen.
- Jeder Subagent antwortet im Format Ergebnis, geänderte Dateien, offene Punkte. Offene Punkte prüfst du, bevor der nächste Schritt startet.

### Design-Befugnis

- `designer` entscheidet über das Erscheinungsbild innerhalb der Tokens und der Spezifikation: Layout, Abstandsstufe, Textstil, Token-Wahl, alle Zustände, responsives Verhalten, Fokus, Kontrast, Oberflächentexte. Er fragt dafür nicht nach.
- Er ändert die Style-Partials, die Demo-Seiten und Markup und Klassen der Library-Templates. Ein Wert, den `spec/components/bundle.css` nicht hat, ist als dokumentierte Abweichung erlaubt: Kommentar an der Regel und Zeile unter "Documented deviations" im Paket-README.
- Neue Tokens, Werte in `tokens.css` und in den Themes sowie Selektoren, Inputs, Outputs und Slots entscheidet der Owner. Der Agent nennt sie unter offenen Punkten.
- Gestaltet wird mit Blick auf das Ergebnis: `npm run design:shot -- <route>` rendert Demo-Seiten in beliebigen Breiten und Farbschemata nach `tmp/design/`, prüft sie mit axe und zeigt mit `--focus` und `--hover` einzelne Elemente in diesen Zuständen.

### Werkzeuge und Regeln

- Die Regeln in `CONTRIBUTING.md`, Abschnitt "Rules", gelten für alle Agents so verbindlich wie dieses Dokument.
- Der Angular-MCP-Server `angular-cli` (`.mcp.json`, startet `ng mcp` der installierten CLI) gehört zu jeder Angular-Aufgabe: `get_best_practices` vor dem ersten Angular-Code, `search_documentation` für Fragen zu Angular- und CDK-APIs, `list_projects` statt `angular.json` zu lesen. Die Regeln in `CONTRIBUTING.md` und hier gehen seinen allgemeinen Empfehlungen vor. Er braucht Node 22.22.3, 24.15 oder neuer.
- Cloud-Sitzungen: `tools/cloud-setup.sh` steht als Setup-Skript in der Cloud-Umgebung und installiert Node 24. `.claude/hooks/session-start.sh` führt `npm ci` aus, und `tools/angular-mcp.mjs` startet den MCP-Server erst danach.
- `escalation` rufst du nur auf, wenn ein anderer Agent dieselbe Aufgabe zweimal nicht lösen konnte oder der `architect` ausdrücklich dazu rät. Im Aufruf steht eine Zusammenfassung der bisherigen Fehlversuche: Aufgabe, jeweiliger Ansatz, Fehlerausgabe, berührte Dateien.
- `ui-umsetzer`, `ui-umsetzer-fable`, `ui-pruefer` und `ui-pruefer-fable` bleiben für die paketweise Umsetzung des Design Systems bestehen und nutzen `npm run design:shot` ebenfalls.
