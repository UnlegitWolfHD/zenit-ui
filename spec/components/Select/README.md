Select wählt einen Wert aus einer kurzen, festen Liste.

## Du lieferst

Ein Label und die Optionen. Die erste Option benennt den Normalfall ("Alle Status"), nicht "Bitte wählen".

## Regeln

- Heute mischt der Kundenbereich native, ungestylte Selects (Gameserver-Liste) mit Material-Selects (Support). Neu: überall dieselbe Optik wie Input.
- Bis vier Optionen, die man vergleichen will, sind ein Segment (siehe Tabs). Ab etwa 15 Optionen braucht es ein Suchfeld.
- Filterzeilen verwenden `z-select--sm` und stehen in einer Zeile mit der Suche. Unter 640px brechen sie auf zwei Spalten um.
- zenit-ui: `<z-select>` um ein natives `<select>`. Nativ bleibt es wegen Tastatur, Screenreader und dem Systemrad auf Mobilgeräten.
