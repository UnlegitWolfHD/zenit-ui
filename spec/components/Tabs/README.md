Tabs wechseln zwischen Unterseiten eines Bereichs. Segment wechselt die Sicht auf dieselben Daten.

## Wann was

- `z-tabs`: Hosting (Übersicht, Apps, Speicher, Pakete, Einstellungen). Jeder Tab hat eine eigene URL.
- `z-segment`: Zeitraum in der Abrechnung, Offen/Geschlossen im Support, Filter bei den Vorschlägen. Höchstens vier Optionen.

## Du lieferst

Kurze Substantive ohne Icons. Der aktive Tab trägt `aria-selected="true"`, das aktive Segment `aria-pressed="true"`.

## Regeln

- Der aktive Tab bekommt eine 2px-Linie in `accent-text`. Keine gefüllte Pill, keine rote Schrift.
- Die Filter-Pills auf der Vorschläge-Seite (zwei Reihen mit je einem roten aktiven Eintrag) werden zu zwei Segmenten oder zu zwei Selects.
- Tabs scrollen mobil horizontal, sie brechen nicht um.
- zenit-ui: `<nav zTabs>` mit `<a zTab routerLink="…" [active]="…">` für Tabs, `<z-segment [options]="…" [(value)]="…" ariaLabel="…">` für Segmente.
