Button löst eine Aktion aus. Pro Bildschirmhöhe gibt es höchstens einen `z-btn--primary`.

## Varianten

| Klasse | Einsatz |
| --- | --- |
| `z-btn--primary` | Die eine Hauptaktion: "Server erstellen", "Ticket senden". Fläche `accent`, Text `on-accent`. |
| `z-btn--secondary` | Jede weitere Aktion: "Aufladen", "Neustart", "Stoppen". Rahmen `border-control`. |
| `z-btn--ghost` | Abbrechen, Icon-Aktionen in Werkzeugleisten. |
| `z-btn--danger` | Nur unumkehrbare Aktionen: "Server löschen", "Hart beenden". Steht nie neben primary, sondern im Menü oder im Bestätigungsdialog. |

Größen: `z-btn--sm` (`control-sm`) in Werkzeugleisten, Standard (`control-md`), `z-btn--lg` (`control-lg`) nur im Hero und im Abschluss-CTA.

## Du lieferst

Den Text als Verb plus Gegenstand ("Server erstellen", nicht "Los" oder "Zum Dashboard"). Optional ein Material Icon vor dem Text. Icon-Buttons brauchen `aria-label`.

## Regeln

- Der Panel-Kopf zeigt heute vier Buttons in drei Rahmenfarben. Neu: "Neustart" und "Stoppen" als secondary, "Hart beenden" im Mehr-Menü. Ist der Server gestoppt, wird "Starten" zum primary.
- Kein Glow, kein Verlauf, kein `transform` beim Hover, keine Versalien.
- Im Minecraft-Subtheme (`z-theme-mc` am Container) wird primary grün (`mc-accent` mit `on-mc`). Alle anderen Varianten bleiben gleich.
- zenit-ui: `<button zBtn="primary" size="lg" [loading]="busy">`. Varianten `primary`, `secondary` (Standard), `ghost`, `danger`; dazu `block` und `iconOnly`.
