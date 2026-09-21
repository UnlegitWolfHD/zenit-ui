Badge zeigt einen Status oder ein Merkmal in einem Wort. Es ist nie anklickbar.

## Zwei Arten

- **Status** mit Punkt und Farbe: `z-badge--success` (Online, Aktiv, Umgesetzt), `z-badge--danger` (Fehlgeschlagen, Offline nach Absturz), `z-badge--warning` (Neustart läuft, In Arbeit), ohne Modifier für Gestoppt, `z-badge--info` für Geplant.
- **Tag** ohne Punkt, immer neutral: Tarif, Loader, Version, Rechte, Kategorie.

## Du lieferst

Ein bis drei Wörter in normaler Schreibweise. Der Status steht immer als Wort da, die Farbe allein trägt keine Bedeutung.

## Regeln

- Heute gibt es Pills in drei Radien und vier Farben, Rot auch für "Geteilt" und für Rechte-Tags. Neu: ein Radius (`radius-sm`), Farbe nur für Status.
- Keine Versalien ("ONLINE" wird "Online"), kein Rahmen, kein Glow am Punkt.
- In einer Liste steht der Status immer in derselben Spalte, siehe ServerList.
- Höchstens drei Tags pro Zeile. Mehr gehören auf die Detailseite.
