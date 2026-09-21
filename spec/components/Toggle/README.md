Toggle schaltet eine Einstellung ein oder aus, die ohne Speichern-Button wirkt.

## Du lieferst

Titel, optional den Konfigurationsschlüssel in `z-mono` und einen Satz zur Wirkung. Das Ganze steht in einer `z-setting`-Zeile, der Toggle rechts.

## Regeln

- Heute zeigt das Panel den Standard-Toggle von Angular Material mit rosa Aus-Zustand. Neu: aus ist `surface` mit `border-control` und Knopf in `text-muted`, ein ist `success` mit dunklem Knopf.
- Grün, weil "ein" ein Zustand ist und keine Aktion. `accent` bleibt Buttons vorbehalten.
- Wirkt die Änderung erst nach einem Neustart, steht das im Beschreibungssatz und oben erscheint ein Alert mit dem Button "Jetzt neu starten".
- zenit-ui: `<z-setting title="PvP" key="pvp" description="…"><z-toggle [(checked)]="pvp" /></z-setting>`, auch mit `formControl`.
