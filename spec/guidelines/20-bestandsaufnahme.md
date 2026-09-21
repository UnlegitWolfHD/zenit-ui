# Bestandsaufnahme

Stand 21.09.2026. Gemessen an den berechneten Styles der Live-Seite bei 800px Breite, dazu Screenshots aller Routen und eine Stichprobe bei 375px. Im Kundenbereich habe ich nur gelesen und nichts ausgelöst.

## Messwerte je Seite

| Seite | Verläufe | backdrop-filter | Schriftgrößen | Häufigste Radien |
| --- | --- | --- | --- | --- |
| `/` | 25 | 18 | über 15 | 16px, 8px, 9999px |
| `/minecraft` | 32 | 35 | 35 | 16px, 8px, 3px |
| `/preise` | 17 | 10 | 22 | 999px, 16px, 8px |
| `/hardware` | 4 | 11 | 14 | 4px, 16px, 10px |
| Minecraft-Panel | 4 | 3 | 23 | 8px, 9999px, 4px |

Ziel für jede Seite: 0 Verläufe, 0 backdrop-filter, höchstens 7 Schriftgrößen, Radien nur 4px und 8px.

## Schriften

Sechs Familien sind im Einsatz: Inter, Space Grotesk, JetBrains Mono, Press Start 2P (/minecraft), Fira Code (Panel) und Arial. Arial ist ein Fehler: `button`, `input` und `select` erben die Schrift nicht (72 Elemente auf der Startseite, 51 im Panel). Das System behält drei Familien.

## Wiederkehrende Muster und ihr Ersatz

| Heute | Wo | Ersatz |
| --- | --- | --- |
| Pill-Badge über der h1, zweite Zeile farbig mit Glow | alle 6 öffentlichen Seiten | Kopf nach Seitenmuster |
| Rotes Versal-Label über der h2 | Startseite, /minecraft | entfällt |
| Icon in rot getöntem Quadrat | Startseite, /hardware, /wiki, Dashboard | Icon ohne Fläche oder gar kein Icon |
| Karte mit 16px Radius um jeden Inhalt | öffentliche Seiten | Text frei, Panel nur um Werkzeuge |
| Statistik-Kacheln mit kleinen Zahlen ("4 Server laufen aktuell") | Startseite, /minecraft | SpecList |
| Chip-Wolke mit 16 Pills | Startseite | SpecList |
| Pills in 3 Radien und 4 Farben | Kundenbereich | Badge |
| Panel-Titel mit Icon in Versalien ("MEINE SERVER") | Kundenbereich | `z-panel__title` |
| Überzeile über dem Seitentitel ("Verwaltung", "Konto") | Kundenbereich | entfällt |
| 4 Power-Buttons in 3 Rahmenfarben | Panel-Kopf | Button-Regel |
| Native Selects und weiße Checkboxen | `/user/games` | Select, Checkbox |
| Material-Toggle mit rosa Aus-Zustand | Eigenschaften | Toggle |
| Sidebar mit rund 35 Einträgen | Minecraft-Panel | Sidebar mit 4 Gruppen |
| Titel und Preis auf dem Cover mit Textschatten | Preisrechner | GameTile |

## Fehler unabhängig vom Stil

- 375px, `/user/games`: Im Hinweis "Fehlt dein Lieblingsspiel?" überlappen Text und Link.
- 375px, `/user/games`: Die Badges in den Serverzeilen werden rechts abgeschnitten.
- Weißer Text auf `#ff2d4f` erreicht 3,7:1. Der primäre Button nimmt deshalb `accent` (`#e11d48`, 4,7:1).
- Kleinste Schrift heute 9,92px. Minimum im System ist 12px.
- GTA V und Rust haben kein Cover.
- Der Preisrechner startet mit leerer Zusammenfassung.
- `/user`: Unter den Panels bleibt mehr als die halbe Seite leer.
- Panel-Kopf und Übersicht zeigen die Adresse zweimal direkt untereinander.
- "Gameserver" (Navigation) und "Game-Server" (Titel), "Abrechnung" und "Finanzen".
- `/vorschlaege` zeigt E-Mail-Adressen der Einreichenden (als Admin gesehen, für Gäste prüfen).
- `/hardware` nennt "Hetzner-Infrastruktur", die Startseite, soweit ich gesehen habe, nicht. Entscheide, ob das öffentlich sein soll, und halte es einheitlich.

## Komponenten-Inventar

Im System dokumentiert (30): Button, Badge, Input, Select, Checkbox, Toggle, Slider, Tabs mit Segment, Stepper, Sidebar, AppHeader, PageHeader, Footer, Panel, Metric mit Meter, ServerList, FileTable, Pagination, Alert, EmptyState, Skeleton, Dialog, Menu, Toast, Console, Hero, GameTile, PriceSummary, SpecList, Faq.

Auf der Seite gesehen, noch nicht dokumentiert: Tooltip, Diagramm der Abrechnung, Cookie-Banner, Tutorial-Overlay, Broadcast-Banner, Wiki-Artikel, Abstimmungs-Zeile der Vorschläge, Loader-Auswahl auf /minecraft. Die Regeln aus der Übersicht gelten für sie bereits.

Nicht angesehen: Bestellassistent, Anmeldung und Registrierung, Admin-Bereich, E-Mails, Panels anderer Spiele.
