Menu sammelt die selteneren Aktionen eines Objekts hinter einem Button.

## Du lieferst

Drei bis sieben Einträge aus Icon und Verb plus Gegenstand. Destruktive Einträge stehen unten hinter einer Trennlinie und tragen `z-menu__item--danger`.

## Regeln

- Der Panel-Kopf bekommt ein Mehr-Menü: "Adresse kopieren", "FTP-Zugang", "Zugriff teilen", darunter "Hart beenden" und "Server löschen". Damit bleiben im Kopf zwei sichtbare Buttons.
- Auch das Avatar-Menü und die Drei-Punkte-Menüs bei Zahlungsmitteln nutzen diese Komponente.
- Fläche `surface-raised`, `shadow-overlay`, kein Scrim. Klick außerhalb und Escape schließen.
- Destruktive Einträge öffnen immer einen Dialog.
- zenit-ui: `@angular/cdk/menu`: `[cdkMenuTriggerFor]` am Button, im Template `<z-menu>` mit `<button zMenuItem icon="…" danger (triggered)="…">`. Import über `Z_MENU`.
