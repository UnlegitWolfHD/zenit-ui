Hero eröffnet eine öffentliche Seite: eine Aussage, ein Satz, höchstens zwei Buttons und rechts ein echtes Stück Produkt.

## Du lieferst

- Eine h1, die sagt, was es gibt und wo es herkommt. Beide Zeilen in `text`, keine farbige zweite Zeile.
- Einen Satz mit den drei stärksten Fakten (Ablauf, Hardware, Preis).
- Einen primary (`z-btn--lg`) und optional einen secondary.
- Eine Zeile `z-hero__note` mit höchstens drei Zusagen, getrennt durch Mittelpunkte.
- Rechts: Preisliste aus dem Preis-Service, ein Screenshot des eigenen Panels oder der Konfigurator. Nie eine Illustration.

## Regeln

- Ersetzt auf allen sechs öffentlichen Seiten die heutige Schablone aus Pill-Badge, Glow-Überschrift, Raster und radialem Verlauf.
- Linksbündig, zwei Spalten im Verhältnis 7 zu 5, unter 900px einspaltig. Unter 640px wechselt die h1 auf `display-lg`.
- `display-xl` nur auf der Startseite und auf /minecraft. Unterseiten nehmen `display-lg` und kommen oft ohne rechte Spalte aus.
- Eingeloggte Besucher sehen "Zum Dashboard" als primary und keinen zweiten Button.
- Kein Hintergrundbild, keine Animation, keine 100vh. Die Höhe ergibt sich aus dem Inhalt plus `space-9`.
- Preise kommen aus dem Preis-Service und werden nie hart codiert.
