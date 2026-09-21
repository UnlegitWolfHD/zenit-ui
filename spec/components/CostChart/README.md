CostChart zeigt, wie sich die Flex-Kosten über gespielte Stunden entwickeln und wo der Deckel greift.

## Wo es gebraucht wird

Flex-Rechner auf /preise. Dasselbe Muster (eine Linie, eine Obergrenze) passt für Verbrauch im Panel und Guthabenverlauf in der Abrechnung.

## Du lieferst

Grundbetrag, Preis pro Stunde, Deckel und die höchste Stundenzahl der Achse. Die zwei Leitzahlen ("Pro Stunde", "Höchstens im Monat") stehen über dem Diagramm.

## Regeln

- Eine Reihe, deshalb keine Legende und keine Reihenfarbe: Linie 2px in `text`, Deckel als gestrichelte Linie in `border-control`. Heute ist die Linie rot mit gefüllter Fläche und grünem Punkt.
- Keine Flächenfüllung, kein Verlauf. Gitterlinien in `border`, Achsentext in `mono` und `text-subtle`.
- Zwei direkte Beschriftungen in `text-muted`: der Grundbetrag am Start und der Punkt, ab dem gedeckelt wird. Nicht jeden Punkt beschriften.
- Der Knickpunkt wird aus den Werten berechnet, nicht fest eingetragen: (Deckel minus Grundbetrag) durch Stundenpreis. Rechne mit dem ungerundeten Stundenpreis. Mit den gerundeten 0,09 € kämen 98 statt 100 Stunden heraus.
- Hover und Fokus zeigen eine senkrechte Linie, einen Punkt und einen Tooltip ("50 h gespielt: 5,90 €"). Die Trefferfläche ist die ganze Zeichenfläche.
- Eine Achse. Keine zweite Skala.
- Darunter ein Satz, der das Diagramm in Worten sagt, und "Als Tabelle" zum Aufklappen. `title` und `desc` im SVG für Screenreader.
- Für das Abrechnungsdiagramm mit mehreren Reihen gelten `chart-1` bis `chart-4` in fester Reihenfolge, mit Legende, 2px Abstand zwischen Balken und denselben Achsen- und Tooltip-Regeln.
- API: `z-cost-chart` mit `base`, `rate`, `cap`, `maxHours`, `caption`.
