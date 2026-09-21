PriceSummary zeigt das Ergebnis des Preisrechners und trägt den einzigen primären Button des Rechners.

## Du lieferst

Spielname und Zeitraum als Label, den Preis in `mono-xl`, die Posten als Zeilen, den Button und einen Satz zur Abrechnung. Alle Werte kommen aus dem bestehenden Preis-Service. Die Zahlen in der Vorschau sind Beispiele.

## Regeln

- Nie leer: Beim Laden ist das günstigste Spiel vorausgewählt. Der heutige Platzhalter "Wähle ein Spiel, um den Preis zu berechnen" entfällt.
- Ab 900px klebt die Zusammenfassung rechts neben dem Rechner (`position: sticky`, `top` gleich `header` plus `space-5`). Darunter steht sie unter dem Rechner, und der Preis klebt zusätzlich als Leiste am unteren Rand.
- 1px `border`, kein roter Rahmen, kein Glow.
- Ändert sich der Preis, wechselt nur die Zahl. Keine Zähl-Animation.
- Rabatte stehen als eigene Zeile mit Minuszeichen ("Laufzeitrabatt −0,49 €"), nicht als Badge.
- Im Minecraft-Subtheme wird der Button grün, sonst bleibt alles gleich.
