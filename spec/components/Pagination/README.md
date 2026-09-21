Pagination blättert durch Listen mit mehr als 25 Einträgen.

## Du lieferst

Den Bereich und die Gesamtzahl mit Gegenstand ("1 bis 25 von 112 Rechnungen") und die aktuelle Seite.

## Regeln

- Erscheint erst, wenn es mehr als eine Seite gibt. Eine leere Ticketliste zeigt heute "0 von 0" mit vier Pfeilen.
- Zwei Pfeile reichen. "Erste" und "Letzte Seite" entfallen, ebenso die Auswahl "Einträge pro Seite" (fest 25).
- Steht als letzte Zeile im Panel, getrennt durch 1px `border`.
- Aktivitäten und Logs laden stattdessen über "Mehr laden" nach.
- zenit-ui: `<z-pagination [(page)]="page" [total]="112" itemLabel="Rechnungen">`. Rendert nichts, solange alles auf eine Seite passt.
