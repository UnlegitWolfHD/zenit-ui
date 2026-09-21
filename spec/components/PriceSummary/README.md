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

## Zustände

- **Lädt:** die letzte Zahl in `text-muted` (`z-summary__price--pending`) mit Spinner daneben. Nie ein Strich statt eines Preises.
- **Fehler:** ein Alert `danger` in der Zusammenfassung ("Preis konnte nicht berechnet werden") mit "Erneut versuchen". Der Bestell-Button ist deaktiviert.
- **Unvollständig:** Button deaktiviert, die Notiz darunter sagt, was fehlt ("Wähle noch eine Bezahlmethode").
- **Rabatt und Gutschein:** eigene Zeilen mit Minuszeichen, Wert in `success` (`z-summary__discount`). Darunter `z-summary__total`.
- **Steuerhinweis:** "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet." als letzte Notiz.
- Validierungsfehler der Auswahl gehören an das jeweilige Feld, nicht hierher. Siehe Leitfaden "Konfigurator".
