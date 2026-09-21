# Konfigurator

Es gibt heute vier Konfiguratoren mit vier verschiedenen Aufbauten. Neu gibt es ein Muster, das überall gleich aussieht und sich nur in der Zahl der Schritte unterscheidet.

## Bestand

| Ort | Aufbau heute | Auffälligkeiten |
| --- | --- | --- |
| `/minecraft`, Abschnitt "Stell deinen Server zusammen" | ein Formular: Tier, RAM-Slider, Laufzeit, Zusammenfassung rechts | grüner Glow um die Zusammenfassung, Pixelschrift, Inhalt erscheint erst beim Scrollen (startet unsichtbar) |
| `/preise` | 3 Schritte mit waagerechter Anzeige: Spiel, Variante, Ressourcen. Darunter der Flex-Rechner mit Kostenkurve | nach Schritt 1 springt die Seite nicht zum neuen Inhalt, "Weiter" mit rotem Glow, drei Slider mit roten Knöpfen |
| `/user/games/order/minecraft` | 3 Schritte: Inhalt, Größe, Bestätigen. Grüner Kopf mit Grasleiste | über 100 Versionen als Kachelraster, schwebende Material-Labels, 4 Bezahlmethoden als Kacheln |
| `/user/games/create` | 6 Schritte als Akkordeon, dazu Fortschrittsliste und Zusammenfassung | zwei Bestell-Buttons gleichzeitig sichtbar, Spielkacheln mit doppeltem Cover |

## Fehler, die beim Durchklicken aufgefallen sind

Ich habe nur gelesen und nichts bestellt.

- Minecraft-Bestellung: Die Vorgabe ist 2 GB mit dem Badge "Empfohlen". Die Zusammenfassung meldet dazu sofort "Für diese Version sind mindestens 4096 MB RAM nötig." und zeigt statt eines Preises einen Strich.
- Mit 4 GB meldet Schritt 3 "Für diese Version sind mindestens 15360 MB Speicher nötig." und "Preisberechnung fehlgeschlagen". Die automatische Zuordnung von CPU und Speicher erfüllt die eigenen Mindestwerte nicht. Der Button "Kostenpflichtig bestellen" bleibt dabei aktiv.
- Fehlermeldungen nennen Megabyte (4096 MB, 15360 MB), die Auswahl nennt Gigabyte.
- Optionale Felder tragen "(optional)" nur im Platzhalter.
- `/user/games/create` zeigt "Kostenpflichtig bestellen" zweimal, beide schon im ersten Schritt.

## Das Muster

1. PageHeader: "Server erstellen". Kein Banner.
2. `z-config`: links Wizard oder Formular, rechts PriceSummary, ab 900px klebend. Darunter IncludedList.
3. Unter 900px steht die Zusammenfassung unter dem Formular, und eine StickyBar hält Preis und nächsten Schritt sichtbar.

| Ort | Schritte |
| --- | --- |
| `/minecraft` und `/preise` (öffentlich) | keine Schritte. Ein Formular: Spiel (GameTile, entfällt auf /minecraft), Leistungsklasse, Arbeitsspeicher, Laufzeit. Button "Server erstellen" führt in die Bestellung und übernimmt die Auswahl. |
| Minecraft-Bestellung | 1 Inhalt (Server-Typ, Version), 2 Größe (RAM, Leistungsklasse), 3 Bezahlen (Name, Gutschein, Laufzeit, Bezahlmethode, Expertenmodus) |
| Anderes Spiel | 1 Spiel, 2 Variante und Name, 3 Ressourcen (Leistungsklasse, RAM, CPU, Speicher), 4 Bezahlen |

## Welcher Baustein wofür

| Eingabe | Baustein |
| --- | --- |
| Spiel | GameTile, ab 15 Spielen mit Suchfeld |
| Server-Typ, Variante, Leistungsklasse, Monatspreis oder Flex, Bezahlmethode | OptionCard |
| RAM in wenigen festen Stufen, Laufzeit mit Rabatt | OptionCard `compact` |
| RAM, CPU, Speicher in feinen Stufen | Slider |
| Nach RAM oder nach Spielerzahl | Segment |
| Minecraft-Version, Modpack, Java-Version | Combobox |
| Name | Input mit "(optional)" im Label |
| Gutschein | InputAction |
| Automatisch verlängern | Toggle in `z-setting` |
| Build, Java, Startscript | Disclosure "Expertenmodus" |
| Flex-Kosten | CostChart |
| Preis, Posten, Rabatt, Steuerhinweis, Bestell-Button | PriceSummary |
| Enthaltene Leistungen | IncludedList |

## Regeln

- Jede Vorgabe ist gültig und bestellbar. Die Auswahl startet mit der kleinsten Kombination, die die Mindestwerte des Spiels und der Version erfüllt.
- Was nicht geht, ist deaktiviert und sagt warum, dort wo man wählt. Die Zusammenfassung ist kein Ort für Validierungsfehler.
- Ändert eine Auswahl eine andere (Version hebt den Mindest-RAM), passiert das sichtbar: Der Wert springt, und ein Hinweis unter dem Feld sagt es ("Auf 4 GB angehoben, weil 1.21 das verlangt").
- Der Preis ist immer eine Zahl. Lädt er, steht die letzte Zahl in `text-muted` mit Spinner. Schlägt die Berechnung fehl, zeigt PriceSummary einen Alert mit "Erneut versuchen", und der Bestell-Button ist deaktiviert.
- Einheiten überall gleich: GB, vCPU, Tage. Keine MB in Meldungen.
- Genau ein primärer Button: "Kostenpflichtig bestellen" in der Zusammenfassung, aktiv erst im letzten Schritt. Der Steuerhinweis nach § 19 UStG steht als Notiz darunter.
- Rabatte stehen an der Laufzeit als Badge und in der Zusammenfassung als Zeile mit Minuszeichen.
- Die Auswahl steht in der URL (Query-Parameter), damit ein Konfigurator-Link teilbar ist und der Wechsel von der öffentlichen Seite in die Bestellung nichts verliert.
- Inhalte sind beim Laden sichtbar. Keine Einblendung beim Scrollen.
