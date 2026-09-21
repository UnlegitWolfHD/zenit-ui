Wizard führt durch eine Bestellung in wenigen Schritten, mit der Zusammenfassung daneben.

## Wo er gebraucht wird

Heute gibt es vier Konfiguratoren mit vier Aufbauten: /minecraft (ein Formular), /preise (3 Schritte mit waagerechter Anzeige), Minecraft-Bestellung (3 Schritte, grüner Kopf mit Grasleiste), "Neuen Server erstellen" (6 Schritte als Akkordeon plus Fortschrittsliste plus Zusammenfassung). Neu gibt es ein Muster für alle.

## Du lieferst

Zwei bis vier Schritte mit einem Substantiv als Titel. Jeder Schritt liefert seine Kurzfassung ("Vanilla, neueste Version"), sobald er erledigt ist.

## Regeln

- Senkrechte Liste. Erledigte Schritte sind eingeklappt und zeigen Kurzfassung und "Ändern". Der aktuelle Schritt ist offen. Künftige zeigen, was kommt.
- Höchstens vier Schritte. Die sechs Schritte von heute werden zu: Spiel, Variante und Name, Ressourcen (mit Leistungsklasse), Bezahlen.
- Rechts klebt PriceSummary (`z-config`). Die separate Fortschrittsliste entfällt, der Wizard selbst ist der Fortschritt.
- "Weiter" ist secondary. Der einzige primary der Seite ist "Kostenpflichtig bestellen" in der Zusammenfassung. Er ist deaktiviert, bis alle Schritte gültig sind, und sagt darunter, was fehlt.
- Jeder Schritt startet mit gültigen Vorgaben. Heute startet die Minecraft-Bestellung mit 2 GB und meldet sofort "mindestens 4096 MB RAM nötig".
- Der Kopf der Seite ist ein normaler PageHeader ("Server erstellen"). Banner, Pixelschrift und Grasleiste entfallen.
- Auf öffentlichen Seiten (/preise, /minecraft) ohne Schritte: alle Gruppen untereinander in einem Formular, Zusammenfassung daneben.
- Unter 900px steht die Zusammenfassung unter dem Wizard, und eine StickyBar hält Preis und Button sichtbar.
- API: `z-wizard` mit `z-wizard-step` (`title`, `summary`, `state: 'done' | 'current' | 'locked'`, `(edit)`).
