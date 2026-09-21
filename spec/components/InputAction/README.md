InputAction ist ein Feld mit einem Button, der den Wert sofort prüft oder anwendet.

## Wo sie gebraucht wird

Gutscheincode in der Bestellung, Gutschein in der Abrechnung, Subdomain prüfen, Spieler zur Whitelist hinzufügen, Adresse kopieren.

## Du lieferst

Label, Feld, einen secondary Button mit Verb ("Einlösen", "Prüfen", "Hinzufügen") und die Rückmeldung darunter.

## Regeln

- Die Rückmeldung steht unter dem Feld: Erfolg in `success` mit der konkreten Wirkung, Fehler in `danger` mit dem Grund.
- Ein eingelöster Gutschein erscheint zusätzlich als eigene Zeile in PriceSummary ("Gutschein ZENIT10 −0,77 €").
- Enter im Feld löst den Button aus. Während der Prüfung zeigt der Button den Spinner.
- Optionale Felder tragen "(optional)" im Label, nicht im Platzhalter. Heute steht es im Platzhalter und verschwindet beim Tippen.
