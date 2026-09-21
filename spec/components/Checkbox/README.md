Checkbox wählt Einträge für eine Sammelaktion aus oder bestätigt eine Aussage.

## Du lieferst

Einen Text rechts der Box. In Tabellen ohne sichtbaren Text ein `aria-label` mit dem Namen der Zeile.

## Regeln

- Die Gameserver-Liste zeigt heute weiße Browser-Checkboxen. Neu: `surface` mit `border-control`, gewählt `accent` mit Haken in `on-accent`.
- Eine Checkbox schaltet nichts sofort. Für Einstellungen, die sofort wirken, ist Toggle da.
- Sobald mindestens eine Zeile gewählt ist, erscheint über der Liste eine Leiste mit der Anzahl und den Sammelaktionen.
- zenit-ui: `<z-checkbox [(checked)]="x">` oder mit `formControl` und `ngModel`.
