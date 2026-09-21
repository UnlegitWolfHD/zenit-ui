Panel fasst zusammengehörige Daten oder ein Werkzeug zu einem Block zusammen. Es ist der einzige Container mit Rahmen.

## Du lieferst

Einen Titel in normaler Schreibweise (`z-panel__title`), optional rechts einen Link oder eine Aktion, und den Inhalt. Listen und Tabellen nutzen `z-panel__body--flush`.

## Wann ein Panel, wann nicht

- Ja: Serverliste, Aktivitäten, Zahlungsmittel, Preisrechner, Dateimanager, Einstellungsgruppe.
- Nein: Feature-Texte, Fakten und FAQ auf öffentlichen Seiten. Dort trennen Abstand (`space-7`) und 1px-Linien (`border`).
- Nie ein Panel in einem Panel. Heute liegen im Minecraft-Panel Kacheln in Panels in einem Rahmen.

## Regeln

- `surface` auf `bg`, 1px `border`, `radius-md`. Kein Schatten, kein Blur, kein Verlauf, kein farbiger Rahmen.
- Titel wie "MEINE SERVER" mit Icon und Versalien werden zu "Meine Server" in `title-sm` ohne Icon.
- Abstand zwischen Panels `space-5`.
- zenit-ui: `<z-panel title="Meine Server" flush>`, Aktion im Kopf über das Attribut `zPanelActions`.
