Input nimmt eine Zeile Text oder eine Zahl auf.

## Du lieferst

Ein sichtbares Label (`z-field__label`), optional einen Hinweis (`z-field__hint`) und im Fehlerfall einen Satz, der sagt, was falsch ist und wie es richtig geht (`z-field__error` plus `aria-invalid="true"` am Feld).

## Regeln

- Das Label steht über dem Feld, nie nur als Platzhalter. Schwebende Labels entfallen.
- Zahlen, Ports, IP-Adressen und Konfigurationswerte in `z-mono`.
- Rahmen `border-control` (3,2:1 auf `surface`), damit das Feld als Feld erkennbar ist. Fokus über den weißen Ring, nicht über eine rote Linie.
- In Einstellungslisten (Eigenschaften im Minecraft-Panel) steht das Feld rechts und ist mindestens 200px breit. Heute wird "A Minecraft Server" abgeschnitten.
- zenit-ui: `<z-field label="…" hint="…" error="…">` um ein natives `<input zInput>`. `mono` und `invalid` als Attribute, Suche über `<z-input-group>`.
