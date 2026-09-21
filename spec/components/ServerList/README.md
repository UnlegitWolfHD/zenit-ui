ServerList ist das Zeilenmuster für alles, was der Kunde besitzt: Server, Domains, Tickets, Zahlungsmittel, Dateien.

## Du lieferst

Pro Zeile: Bild oder Anfangsbuchstabe (`z-row__thumb`), Titel, eine Meta-Zeile, dann die Spalten. Die ganze Zeile ist ein Link auf die Detailseite.

## Regeln

- Feste Spalten über ein gemeinsames Grid, damit Status, Tarif und Kosten untereinander fluchten. Heute steht der Status je Zeile an anderer Stelle.
- Status ist immer die zweite Spalte. Beträge rechtsbündig in `mono`.
- Spaltenkopf in `caption` und `text-subtle`, normale Schreibweise.
- Hover färbt die ganze Zeile `surface-raised`. Kein Rahmenwechsel, kein Verschieben.
- Unter 640px bleiben Titel und Status, der Rest wandert auf die Detailseite. Heute werden Badges mobil abgeschnitten.
- Andere Spaltenbreiten setzt du über `grid-template-columns` an `z-rows__head` und `z-row` gemeinsam.
- Dateimanager und Rechnungen sind echte Tabellen, siehe FileTable: gleiche Zeilenhöhen, Linien und Schriftstile.
