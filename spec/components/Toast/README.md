Toast bestätigt, dass etwas passiert ist, und verschwindet von selbst.

## Du lieferst

Einen Satz ohne Punkt, im Partizip ("Eigenschaften gespeichert", "Adresse kopiert"), optional eine Aktion ("Rückgängig").

## Regeln

- Unten rechts, mobil unten über die volle Breite, `z-toast` über `z-overlay`. Höchstens drei gleichzeitig, der neueste unten.
- 5 Sekunden sichtbar, mit Aktion 8 Sekunden. Fehler bleiben, bis man sie schließt, und nutzen `role="alert"`.
- Ein Fehler, der eine Handlung auf der Seite verlangt, ist ein Alert und kein Toast.
- Einblenden über 150ms `opacity`, kein Hereinrutschen.
- zenit-ui: Service `ZToast` (`show`, `success`, `error`, `dismiss`) und einmal `<z-toast-outlet />` im Root-Template.
