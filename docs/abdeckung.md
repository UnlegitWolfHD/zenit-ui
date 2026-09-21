# Abdeckung: Baustein, Seite, gezeigte Zustände

Prüfpunkt "Fertig, wenn" aus `docs/pakete.md`: jeder Baustein der API-Tabelle in
`spec/guidelines/40-bibliothek.md` steht in `ui-demo`, in allen Zuständen aus
`spec/guidelines/15-zustaende.md`, die auf ihn zutreffen. Hover, Fokus und
Gedrückt zeigen sich beim Bedienen und stehen deshalb nicht je Zeile.

| Baustein | Seite | Gezeigte Zustände |
| --- | --- | --- |
| Icon | Grundlage | md 20px und sm 16px in `text-muted`; farbig nur im Alert (Rückmeldung) und im aktiven Sidebar-Eintrag (Navigation) |
| Spinner | Grundlage | mit Label als Statusmeldung, ohne Label im ladenden Button |
| Button | Grundlage | primary, secondary, ghost, danger; sm, md, lg; iconOnly, block; lädt (Spinner, gesperrt); deaktiviert mit Grund; `a[zBtn]` offen und gesperrt; Minecraft-Subtheme. Rückmeldung: `aria-disabled="true"` mit Tooltip als Grund |
| Badge | Grundlage | success, warning, danger, info, neutral mit Punkt; neutrale Tags; ohne Punkt |
| Field | Grundlage | Label mit Hinweis, Fehler mit Rahmen `danger` und Satz darunter |
| Input | Grundlage | Ruhe, mono, invalid, readonly, deaktiviert, Größe sm, textarea, Suche über `z-input-group` |
| Select | Grundlage | md, sm, deaktiviert |
| Panel | Grundlage | mit Titel, mit Aktionen-Slot, flush, busy, ohne Titel. Daten: mit `z-pagination` als letzter Zeile |
| Checkbox | Formulare | `model()`, `ngModel`, `formControl`; gewählt, leer; deaktiviert über Input und über Forms; ohne sichtbaren Text über `ariaLabel`; Link im Text. Daten: im Tabellenkopf und in der Zeile |
| Toggle | Formulare | ein und aus; `model()`, `ngModel`, `formControl`; deaktiviert über Input und über Forms; `ariaLabelledby` in `z-setting`, `ariaLabel` allein |
| Setting | Formulare | Titel mit Schlüssel und Wirkung, Zeile ohne Schlüssel, Zeile mit gesperrtem Bedienelement |
| Slider | Formulare | `model()`, `ngModel`, `formControl`; Stufen, Einheit, Hinweis; deaktiviert über Input und über Forms |
| Segment | Formulare | zwei und drei Optionen, gewählt über `aria-pressed`; `model()`, `ngModel`, `formControl`; deaktiviert über Input und über Forms |
| Tabs | Navigation | Ruhe und aktiv mit `aria-current="page"` und 2px-Linie |
| Stepper | Navigation | `current` 0, 1 und 2: erledigt, aktuell mit `aria-current="step"`, offen |
| Sidebar | Navigation | vier Gruppen mit zwölf Einträgen, aktiver Eintrag mit farbigem Icon, Zähler in mono, unter 900px ein Select |
| AppHeader | Navigation | Kundenbereich mit Guthaben und Avatar, öffentlich mit Anmelden und Server erstellen, aktiver Link, unter 900px als Menü |
| PageHeader | Navigation | zwei Aktionen mit Unterzeile, ohne Aktionen und ohne Unterzeile, unter 640px Aktionen unter dem Titel |
| Footer | Navigation | öffentlich mit drei Spalten und Basiszeile, Kundenbereich nur mit Basiszeile |
| Metric | Daten | neutral, Warnung ab 80 %, Fehler ab 95 % (Wert immer zusätzlich als Wort), ohne Balken |
| ServerList | Daten | Zeile als Link, Zeile als div mit eigenem Tab-Stopp, eigene `columns`; lädt (Skeleton im selben Grid, `aria-busy`); leer (EmptyState); Fehler (Alert mit Ursache und nächstem Schritt) |
| FileTable | Daten | Kopf mit Auswahl-Checkbox, gewählte Zeile, mono-Spalten rechtsbündig, unter 640px seitlich scrollbar im eigenen Container |
| Pagination | Daten | Mitte, erste Seite (zurück gesperrt), letzte Seite (weiter gesperrt), eigener `rangeLabel`, leere Liste (rendert nichts) |
| Alert | Rückmeldung | info, warning, danger, success, neutral; mit und ohne Aktion; nur Titel. Grundlage: Serverstatus "Fehlgeschlagen". Daten: Liste nicht geladen |
| EmptyState | Rückmeldung | Titel, Satz, Aktion. Daten: leere Serverliste. Werkzeuge: leeres Log und deaktivierte Konsole mit "Server starten" |
| Skeleton | Rückmeldung | zwei Platzhalterzeilen im Zeilen-Grid, `thumb`, Breiten in Prozent und px, Container mit `aria-busy`. Daten: Ladezustand der Liste |
| Toast | Rückmeldung | Erfolg, Fehler mit `role="alert"`, mit Aktion, dauerhaft (`duration: 0`), alle schließen |
| Tooltip | Rückmeldung | am Icon-Button, am offenen Button, am gesperrten Button (`aria-disabled`, Grund zusätzlich als Satz) |
| Dialog | Overlays | `confirm` mit `requireText` (Bestätigen gesperrt bis zur Eingabe), kurze Bestätigung, eigener Dialog über `open()`, dazu die statische Ansicht für den Screenshot |
| Menu | Overlays | Auslöser über `cdkMenuTriggerFor`, Eintrag mit Icon, deaktiviert, danger, Trennlinie, dazu die statische Ansicht für den Screenshot |
| Console | Werkzeuge | Log mit info, warn, error und cmd; Eingabe mit Verlauf; "Zum Ende" beim Hochscrollen; leeres Log als EmptyState; deaktiviert mit EmptyState und Aktion |
| Hero | Werkzeuge | Titel, Lead, Notiz, zwei Aktionen, Panel als Aside; unter 900px einspaltig, unter 640px `display-lg` |
| GameTile | Werkzeuge | gewählt mit `aria-pressed` und 2px-Linie, Ruhe, Text-Fallback ohne Bild |
| PriceSummary | Werkzeuge | Preis mit Zeitraum, Posten, Notiz, Button in voller Breite |
| SpecList | Werkzeuge | Begriff mit Wert, Werte in mono, Zusatz in small |
| Faq | Werkzeuge | erste Frage offen, weitere geschlossen (natives `details`/`summary`) |
