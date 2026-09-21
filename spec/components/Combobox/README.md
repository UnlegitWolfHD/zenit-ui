Combobox wählt einen Wert aus einer langen Liste über Tippen und Filtern.

## Wo sie gebraucht wird

Der Minecraft-Bestellassistent zeigt heute über 100 Versionen als Kachelraster in einem kleinen Scrollbereich, dazu zwei Schalter für Pre-Releases und Snapshots. Ebenso: Modpack-Auswahl, Spielsuche ab etwa 15 Spielen, Java-Version und Build im Expertenmodus.

## Du lieferst

Label, Optionen mit Wert und optionalem Zusatz (zum Beispiel der Mindest-RAM), optional Gruppen ("Aktuell", "Ältere", "Snapshots").

## Regeln

- Vorbelegt ist "Neueste" als echter Wert. Die Liste zeigt zuerst die fünf neuesten Versionen, ältere erscheinen beim Tippen.
- Pre-Releases und Snapshots sind Gruppen in der Liste, keine getrennten Schalter.
- Tastatur nach dem ARIA-Muster für Combobox: Pfeile bewegen, Enter wählt, Escape schließt. Der Fokus bleibt im Eingabefeld.
- Das Panel nutzt `surface-raised` und `shadow-overlay` wie Menu. Gewählt ist fett mit Haken, aktiv ist `surface-hover`.
- Kein Treffer: eine Zeile "Keine Version gefunden" statt eines leeren Panels.
- Hat eine Option Folgen (Mindest-RAM), steht das als Zusatz in der Zeile, damit der Fehler nicht erst in der Zusammenfassung auftaucht.
- Umsetzung mit `@angular/cdk/overlay` und `@angular/cdk/a11y` (`ActiveDescendantKeyManager`) oder `@angular/cdk/listbox`. API: `z-combobox` mit `options`, `[(value)]`, `placeholder`, `emptyText`; Forms.
