StickyBar hält auf kleinen Bildschirmen den Preis und den nächsten Schritt am unteren Rand sichtbar.

## Du lieferst

Den aktuellen Preis in `mono-lg`, eine Zeile mit der Kurzfassung der Auswahl und genau einen Button.

## Regeln

- Nur unter 900px (`z-stickybar--mobile`). Darüber klebt PriceSummary neben dem Formular.
- `position: sticky; bottom: 0`, Fläche `surface-raised`, oben 1px `border`. Kein Schatten, kein Blur.
- Der Button ist im Wizard "Weiter", im letzten Schritt "Kostenpflichtig bestellen". Dann entfällt derselbe Button in der Zusammenfassung darüber nicht, beide lösen dasselbe aus.
- Berücksichtige `env(safe-area-inset-bottom)` im Innenabstand.
- Auch nutzbar für Sammelaktionen in Listen ("2 ausgewählt").
