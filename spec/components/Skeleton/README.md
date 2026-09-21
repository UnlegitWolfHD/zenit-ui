Skeleton hält den Platz frei, während eine Liste oder Kennzahl lädt.

## Du lieferst

So viele Platzhalterzeilen, wie im Normalfall zu erwarten sind (zwei bis drei), im selben Grid wie die echten Zeilen. Der Container trägt `aria-busy="true"` und ein `aria-label`.

## Regeln

- Erst nach 300ms anzeigen. Lädt es schneller, erscheint direkt der Inhalt.
- Das Layout darf beim Eintreffen der Daten nicht springen: gleiche Zeilenhöhe, gleiche Spalten.
- Die einzige Dauer-Animation im System: `opacity` zwischen 1 und 0,5, hinter `prefers-reduced-motion`. Kein Schimmer-Verlauf.
- Buttons, die gerade arbeiten, zeigen stattdessen einen Spinner vor dem Text und sind deaktiviert ("Wird gestartet").
- Nach 10 Sekunden ohne Antwort ersetzt ein Alert mit "Erneut versuchen" das Skeleton.
