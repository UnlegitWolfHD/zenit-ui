GameTile wählt ein Spiel im Preisrechner auf der Startseite, unter /preise und im Bestellassistenten.

## Du lieferst

Ein Cover im Format 3:4 als `img` mit leerem `alt` (der Titel steht darunter), den Titel und den Startpreis aus dem Preis-Service. Fehlt das Cover, steht der Spielname in `z-game__cover`.

## Regeln

- Titel und Preis stehen UNTER dem Cover. Heute liegen sie auf dem Bild, mit Verlauf und Textschatten, und lange Titel werden abgeschnitten.
- GTA V und Rust haben heute einen Gamepad-Platzhalter. Der Text-Fallback zeigt stattdessen den Namen in `display`.
- Gewählt: 2px Linie in `accent-text` plus `aria-pressed="true"`. Kein Glow, kein Skalieren.
- Preis immer mit Zeitraum ("ab 1,98 € / Monat") in `mono`.
- Beim Laden ist das günstigste Spiel vorausgewählt, damit die Zusammenfassung nie leer ist.
- Raster `auto-fill` mit mindestens 128px Breite. Ab etwa 15 Spielen steht ein Suchfeld darüber.
