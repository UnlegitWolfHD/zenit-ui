# Seitenmuster

Es gibt drei Seitentypen. Jede Route gehört zu genau einem.

## Öffentliche Seite

Gilt für `/`, `/minecraft`, `/preise`, `/hardware`, `/wiki`, `/vorschlaege`.

Heute beginnt jede dieser Seiten mit derselben Schablone: Pill-Badge, zweizeilige Überschrift mit farbiger zweiter Zeile und Glow, zentrierter Text, radialer Verlauf. Das ist der stärkste Auslöser des generierten Eindrucks.

Aufbau neu:

1. **Kopf.** Linksbündig: h1 in `display-xl` (Startseite, /minecraft) oder `display-lg` (Unterseiten), ein Satz in `body-lg`, höchstens zwei Buttons, darunter eine Zeile in `caption`. Kein Badge, kein Hintergrundbild.
2. **Das Werkzeug der Seite kommt zuerst.** Startseite und /preise: Preisrechner. /minecraft: Konfigurator. /wiki: Suche. /vorschlaege: Liste. Wer nur das Werkzeug sucht, scrollt nicht an Marketing vorbei.
3. **Fakten** als SpecList, einmal pro Seite.
4. **Erklärung** als zweispaltige Liste mit `heading-2` und einem Satz je Eintrag, 1px-Linie darüber. Keine Karten.
5. **FAQ** als `details`-Liste mit 1px-Linien.
6. **Abschluss.** Eine Überschrift in `display-lg`, ein primary in `z-btn--lg`, zentriert. Der einzige zentrierte Block.

| Route | Kopf | Werkzeug | Entfällt |
| --- | --- | --- | --- |
| `/` | "Gameserver aus Nürnberg. In etwa 60 Sekunden online." | Preisrechner mit GameTile | Trust-Leiste, 6 Statistik-Kacheln, 16 Chips, 6 Feature-Karten |
| `/minecraft` | "Minecraft-Server mit jedem Loader. In etwa 60 Sekunden online." | Konfigurator (Tier, RAM, Laufzeit) direkt unter dem Kopf | Pixelschrift, schwebende Blöcke, Grasleiste, 3-Schritte-Abschnitt, zweite Statistik-Reihe |
| `/preise` | "Preise" plus ein Satz zur Abrechnung nach Stunden | Rechner als ein Formular, Zusammenfassung rechts klebend | Badge "Preiskonfigurator", 4 Trust-Pills, 3-Schritt-Anzeige |
| `/hardware` | "Hardware" plus Standort in einem Satz | zwei SpecLists nebeneinander (Node Budget, Node Normal) | Karten mit Versal-Labels, farbige Icon-Flächen |
| `/wiki` | "Wiki" plus Suchfeld | Suche, darunter Kategorien als Liste mit Artikelzahl | Badge, rotes "&" im Titel, Zähler-Kacheln, Verlauf auf Artikelkarten, "Featured"- und "Neu"-Pills |
| `/vorschlaege` | "Vorschläge" plus primary "Vorschlag einreichen" | Liste mit Stimmenzahl links | Badge, zwei Reihen Filter-Pills (werden zwei Segmente), farbiger Rand links an Karten |

Auf `/vorschlaege` stehen E-Mail-Adressen der Einreichenden in der Liste. Ich habe die Seite als eingeloggter Admin gesehen. Prüfe, ob Gäste sie auch sehen, und zeige öffentlich nur einen Anzeigenamen.

## Seite im Kundenbereich

Gilt für `/user`, `/user/games`, `/user/hosting`, `/user/domains`, `/user/billing`, `/user/support`.

1. AppHeader
2. PageHeader: Titel gleich Navigationslink, ein Fakt, höchstens zwei Aktionen
3. optional ein Alert
4. Panels im Abstand `space-5`, das wichtigste zuerst und in voller Breite

| Route | Titel | Erstes Panel | Änderungen |
| --- | --- | --- | --- |
| `/user` | Dashboard | Meine Server (ServerList) | Kennzahlen als eine Metric-Zeile ohne Icon-Farben. Der leere Raum darunter zeigt die Auslastung der laufenden Server. |
| `/user/games` | Gameserver | Meine Server | Die zwei großen Karten "Minecraft-Server" und "Anderes Spiel" werden zum primary "Server erstellen" im PageHeader. "Geteilt mit mir" ist ein zweites Panel mit derselben ServerList, Rechte als neutrale Tags. |
| `/user/hosting` | Hosting | Paket | Unterseiten als Tabs. "Verbrauchsdaten gerade nicht verfügbar" wird ein Alert mit Grund. |
| `/user/domains` | Domains | Domains (ServerList) | "Aktiv" als Status-Badge in der zweiten Spalte. |
| `/user/billing` | Abrechnung | Guthaben und Ausgaben | Guthaben in `mono-xl` im PageHeader, Zeitraum als Segment, Diagramm mit `chart-1` bis `chart-4`. Negative Beträge in `text` mit Minuszeichen, nicht rot. |
| `/user/support` | Support | Tickets | Filter als Segment plus zwei Selects in einer Zeile. Ein leerer Zustand zeigt keine Pagination. |

## Server-Panel

Gilt für `/user/games/:id` und `/user/games/:id/minecraft`.

1. AppHeader
2. **Panel-Kopf**, klebend: Zurück, Servername in `heading-2`, Status-Badge, Adresse in `mono` mit Kopieren-Button (genau einmal), rechts die Aktionen nach der Button-Regel.
3. Zwei Spalten: Sidebar (`sidebar` breit) und Inhalt.
4. Die Inhaltsseite beginnt mit ihrem Titel in `heading-2` ohne Icon-Fläche, dann Panels.

Übersicht: eine Metric-Zeile mit CPU, RAM, Speicher und Laufzeit, darunter "Spieler" und "Einstellungen" als zwei Panels. Ping und TPS wandern in die Unterzeile der Laufzeit.

Konsole: Log in `mono-sm` auf `bg`, Eingabezeile unten mit `border-control`. Zeitstempel in `text-subtle`, WARN in `warning`, ERROR in `danger`.

Dateien: FileTable mit Checkbox, Name in `mono`, Größe und Datum rechtsbündig in getrennten Spalten. Heute stehen Größe und Datum bei kleinen Dateien fast ohne Abstand nebeneinander.

Eigenschaften: Gruppen als Panels, je Zeile `z-setting` mit Toggle, Select oder Input rechts. Der Konfigurationsschlüssel steht in `mono` unter dem Titel.
