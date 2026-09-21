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
