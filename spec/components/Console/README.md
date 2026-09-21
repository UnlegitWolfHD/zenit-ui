Console zeigt das Live-Log eines Servers und nimmt Befehle an.

## Du lieferst

Logzeilen mit Zeitstempel und Stufe. Das System färbt WARN in `warning`, ERROR in `danger`, eigene Befehle in `text`, alles andere in `text-muted`.

## Regeln

- `mono-sm` mit 20px Zeilenhöhe auf `bg`, damit sich die Konsole vom Panel absetzt. Ersetzt Fira Code.
- Die Konsole scrollt mit, solange man unten steht. Scrollt man hoch, bleibt sie stehen, und ein Button "Zum Ende" erscheint.
- Lange Zeilen brechen um. Kein horizontales Scrollen.
- Die Eingabezeile hängt unten fest an der Konsole. Pfeil hoch holt den letzten Befehl.
- In der Werkzeugleiste darüber: "Log kopieren", "Log herunterladen", "Leeren" als ghost-Buttons in `control-sm`.
- Ist der Server gestoppt, steht im Log ein EmptyState mit dem Button "Server starten", und die Eingabe ist deaktiviert.
