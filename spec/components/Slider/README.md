Slider stellt eine Menge auf einer festen Skala ein: RAM, Slots, Speicher.

## Du lieferst

Label, aktuellen Wert mit Einheit in `mono-lg`, die Skalenwerte und einen Hinweis mit der Empfehlung für das gewählte Spiel.

## Regeln

- Der Wert steht immer als Zahl daneben und ändert den Preis in PriceSummary sofort.
- Spur in `border-control` (3:1), Knopf in `text`, Fokus über den weißen Ring. Keine rote Füllung, kein Glow am Knopf.
- Nur die Stufen, die buchbar sind (`step`). Stufen unter der Mindestanforderung des Spiels sind gesperrt, und der Hinweis sagt warum.
- Bei mehr als 12 Stufen oder auf Geräten ohne Maus zusätzlich Plus- und Minus-Buttons anbieten.
- zenit-ui: `<z-slider label="Arbeitsspeicher" unit="GB" [min]="2" [max]="16" [step]="2" [ticks]="[…]" [(value)]="ram">`, auch mit `formControl`.
