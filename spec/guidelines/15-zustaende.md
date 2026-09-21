# Zustände

Jede interaktive Komponente ist in allen Zuständen dieser Tabelle gestaltet. Ein Baustein gilt erst als fertig, wenn die Demo-App jeden davon zeigt.

| Zustand | Darstellung | Tokens |
| --- | --- | --- |
| Ruhe | wie in der Vorschau | |
| Hover | Fläche eine Stufe heller oder Text eine Stufe heller. Nie Größe, Position oder Schatten. | `surface-raised`, `surface-hover`, `accent-hover` |
| Fokus (Tastatur) | 2px Ring mit 2px Abstand, nur bei `:focus-visible` | `focus` |
| Gedrückt | wie Hover, kein eigener Stil | |
| Aktiv oder gewählt | Fläche `surface-hover` plus Text `text`. Eine 2px-Linie bei Tab und Spielkachel. Dazu immer `aria-current`, `aria-selected` oder `aria-pressed`. | `surface-hover`, `accent-text` |
| Deaktiviert | 45 % Deckkraft, `cursor: not-allowed`, per Tooltip oder Hinweis der Grund | |
| Lädt | Button: Spinner vor dem Text, deaktiviert, Text im Verlauf ("Wird gestartet"). Liste: Skeleton nach 300ms. | `surface-hover` |
| Fehler | Feld: Rahmen `danger` plus Satz darunter. Seite: Alert. Hintergrundvorgang: Toast mit `role="alert"`. | `danger`, `danger-subtle` |
| Leer | EmptyState mit einem Satz und einer Aktion | |
| Erfolg | Toast. Dauerhafte Zustände als Badge. | `success` |

## Serverstatus

Der Serverstatus ist der wichtigste Zustand im Produkt und sieht überall gleich aus: Dashboard, Liste, Panel-Kopf, geteilte Server.

| Status | Badge | Hauptaktion im Panel-Kopf |
| --- | --- | --- |
| Online | `z-badge--success` "Online" | secondary "Neustart", secondary "Stoppen" |
| Startet, stoppt, startet neu | `z-badge--warning` "Startet" usw. | alle Buttons deaktiviert, der auslösende zeigt den Spinner |
| Gestoppt | `z-badge` "Gestoppt" | primary "Starten" |
| Installation läuft | `z-badge--info` "Wird installiert" | keine |
| Fehlgeschlagen | `z-badge--danger` "Fehlgeschlagen" | primary "Erneut installieren", dazu ein Alert mit der Ursache |
| Gesperrt (Guthaben leer) | `z-badge--danger` "Gesperrt" | primary "Guthaben aufladen" |

Der pulsierende Punkt neben "Online" entfällt. Der Status wechselt ohne Animation.

## Tastatur

- Alles Bedienbare ist per Tab erreichbar, in der sichtbaren Reihenfolge.
- Der Link "Zum Hauptinhalt springen" bleibt (den gibt es heute schon).
- Dialog und Menü fangen den Fokus ein und geben ihn beim Schließen an den Auslöser zurück.
- Zeilen in ServerList sind Links. Aktionen innerhalb einer Zeile sind eigene Tab-Stopps.
- Klickziele sind mobil mindestens 40px hoch, auch Icon-Buttons in Werkzeugleisten.
