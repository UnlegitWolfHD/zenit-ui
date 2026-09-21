AppHeader ist die Kopfzeile des Kundenbereichs. Die öffentliche Kopfzeile nutzt dieselbe Klasse mit anderen Links.

## Du lieferst

Logo, bis zu sieben Links, rechts Guthaben und Avatar-Menü. Öffentlich stehen rechts "Anmelden" (ghost) und "Server erstellen" (primary, `z-btn--sm`).

## Regeln

- Höhe `header`, Hintergrund `bg`, unten 1px `border`. Kein Blur, keine Transparenz. Heute liegt `backdrop-filter` auf der Leiste.
- Aktiver Link: `accent-subtle` als Fläche, Text `text`. Icons vor den Links entfallen, die Wörter reichen.
- Das Guthaben steht in `mono` ohne rote Pill. Es ist ein Link zur Abrechnung.
- Eingeloggte Besucher sehen öffentlich "Zum Dashboard" als secondary statt zwei CTAs.
- Das Logo kommt als Datei aus dem Repo. In dieser Vorschau steht der Name in `display`, weil mir die Logodatei nicht vorliegt.
- Unter 900px klappt die Navigation in ein Menü. Das Guthaben bleibt sichtbar.
