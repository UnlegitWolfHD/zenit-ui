OptionCard wählt genau eine von wenigen Möglichkeiten, die man vergleichen will. Sie ist das wichtigste Bedienelement aller Konfiguratoren.

## Wo sie heute vorkommt

Hardware-Tier, Server-Typ, RAM-Stufen, Laufzeit mit Rabatt, Leistungsklasse, Bezahlmethode, Monatspreis oder Flex, Variante eines Spiels. Heute sieht jede dieser Gruppen anders aus: mal roter, mal grüner Rahmen, mal mit Haken-Kreis, mal mit farbiger Icon-Kachel.

## Du lieferst

Eine Gruppe mit `legend` als Frage oder Begriff und je Option: Titel, optional einen Satz, optional einen Preis in `mono`, optional ein Badge ("Empfohlen", "−6 %").

## Regeln

- Technisch eine Radiogruppe: `fieldset`, `legend`, je Option ein `label` mit verstecktem `input type="radio"`. Pfeiltasten wechseln, Tab verlässt die Gruppe.
- Gewählt: Rahmen in `accent-text`, Fläche `surface-raised`. Kein Haken-Kreis, kein Glow. Im Minecraft-Subtheme `mc-accent`.
- Keine Icons in farbigen Kacheln. Der Titel reicht.
- `z-options--compact` für kurze Werte wie RAM und Laufzeit. Titel in `mono`.
- Eine Option, die nicht geht, ist deaktiviert und sagt warum ("zu wenig für 1.21", "alle Plätze belegt"). Heute ist 2 GB als "Empfohlen" markiert, obwohl die Version 4 GB verlangt.
- "Empfohlen" gibt es höchstens einmal pro Gruppe, als `z-badge--info`. Rabatte als `z-badge--success` mit echtem Minuszeichen.
- Ab sieben Optionen ist es keine OptionCard mehr, sondern eine Combobox (Versionen) oder ein Slider (RAM in feinen Stufen).
- API: `z-option-group` mit `legend`, `options: {value, title, description, price, badge, disabled, disabledReason}[]`, `[(value)]`, `compact`. Arbeitet mit Reactive Forms.
