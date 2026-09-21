FileTable ist die Tabelle für Dateimanager, Rechnungen, Backups und Datenbanken: alles mit mehreren gleichwertigen Spalten und Sammelaktionen.

## Du lieferst

Spaltenköpfe in normaler Schreibweise, Namen in `mono`, Zahlen und Daten rechtsbündig in `z-table__num`, je Zeile eine Checkbox mit `aria-label`.

## Regeln

- Größe und Datum sind getrennte, rechtsbündige Spalten mit `space-4` Innenabstand. Heute stehen sie bei kleinen Dateien fast ohne Abstand nebeneinander.
- Ordner zuerst, dann Dateien, beides alphabetisch. Sortieren über Klick auf den Spaltenkopf.
- Icons nur `folder` und `description` in `text-muted`. Keine farbigen Dateityp-Icons, kein grünes Ordner-Icon.
- Sind Zeilen gewählt, ersetzt eine Leiste über der Tabelle die Werkzeugleiste: "2 ausgewählt", dann "Herunterladen", "Verschieben", "Löschen".
- "Hochladen" ist secondary in `control-sm`, nicht grün gefüllt.
- Unter 640px scrollt die Tabelle horizontal in ihrem eigenen Container. Die Seite selbst scrollt nie seitlich.
- zenit-ui: `<z-table-container><table zTable>` mit `zNum` für rechtsbündige Spalten und `zTableName` für die Namenszelle. Sortierung und Datenquelle bei Bedarf über `cdk-table`.
