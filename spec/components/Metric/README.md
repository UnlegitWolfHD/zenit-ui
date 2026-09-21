Metric zeigt eine Kennzahl mit Einheit, optional mit Auslastungsbalken.

## Du lieferst

Label, Wert, Einheit oder Obergrenze (`small`), optional `z-meter` mit Prozentwert und eine Unterzeile.

## Regeln

- Mehrere Kennzahlen stehen als Spalten in EINEM Panel, getrennt durch 1px-Linien. Keine einzelnen Kacheln. Heute steht "Uptime" allein in einer zweiten Reihe.
- Werte in `mono-lg`, deutsche Zahlenformate (Komma, geschütztes Leerzeichen vor der Einheit).
- Der Balken ist neutral (`text-muted`). Ab 80 % `z-meter--warning`, ab 95 % `z-meter--danger`, jeweils mit Text in der Unterzeile.
- Keine farbigen Icon-Flächen. Das Dashboard zeigt heute vier Kennzahlen mit vier Icon-Farben.
- Auf öffentlichen Seiten keine Kennzahlen-Kacheln für Marketing-Zahlen. Dafür ist SpecList da.
