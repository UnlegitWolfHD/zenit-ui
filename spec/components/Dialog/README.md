Dialog unterbricht für eine Entscheidung, die nicht rückgängig zu machen ist, oder für ein kurzes Formular.

## Du lieferst

Einen Titel als Frage oder Aufgabe, einen Text mit den konkreten Folgen (was geht verloren, was kostet es) und zwei Buttons. Der bestätigende Button wiederholt das Verb des Titels.

## Regeln

- Fläche `surface-raised`, 1px `border`, `radius-md`, `shadow-overlay`. Dahinter `scrim`, kein Blur.
- Destruktive Bestätigung: `z-btn--danger` rechts, "Abbrechen" als ghost links davon. Für Löschen von Servern, Domains und Backups zusätzlich den Namen eintippen lassen.
- Braucht es einen Dialog für "Stoppen" oder "Neustart"? Nein. Nur "Hart beenden", Löschen, Kündigen und Zahlungsmittel entfernen fragen nach.
- Höchstens 480px breit, unter 640px volle Breite am unteren Rand.
- Fokus landet beim Öffnen auf dem ersten Feld oder auf "Abbrechen", Escape schließt, der Fokus kehrt zum Auslöser zurück.
- zenit-ui: Service `ZDialog` auf Basis von `@angular/cdk/dialog`: `dialog.confirm({ title, body, confirmLabel, danger, requireText })` liefert ein `Observable<boolean>`. Eigene Dialoge nutzen `<z-dialog title="…">`.
