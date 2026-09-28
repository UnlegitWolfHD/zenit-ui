---
name: feature
description: Delegationsablauf für Änderungen an zenit-ui, die mehr als 2 Dateien berühren (neue Komponente, Feature, Umbau, Design-Paket). Steuert explorer, architect, component-builder, designer, test-writer, build-fixer, api-guardian, code-reviewer und docs-writer in fester Reihenfolge. Aufruf mit /feature <Auftrag>.
argument-hint: <Auftrag>
---

# Feature mit Subagents umsetzen

Auftrag: $ARGUMENTS

## Ablauf

1. `explorer`, nur wenn die betroffenen Dateien nicht schon feststehen. Mehrere unabhängige Suchen startest du parallel in einer Nachricht.
2. `architect`, nur bei mehr als 3 betroffenen Dateien oder wenn öffentliche API, Paketstruktur, Theming oder SSR berührt sind. Rät er zur Eskalation, gilt die Eskalationsregel aus `CLAUDE.md`.
3. `component-builder` baut Struktur, Markup und Klassen.
4. Parallel in einer Nachricht: `designer` für das Erscheinungsbild und `test-writer` für die Tests.
5. `build-fixer`, nur bei Build-, Lint- oder Typfehlern. Formatfehler behebt der PostToolUse-Hook schon beim Schreiben.
6. Parallel in einer Nachricht: `api-guardian` und `code-reviewer` auf denselben Diff. Befunde gehen per `SendMessage` an den Agent zurück, der die Datei gebaut hat.
7. `docs-writer`, sobald sich öffentliche API, Demo oder CHANGELOG ändern.
8. Vor der Übergabe läuft `npm run check` (Node 24 wie in der CI).

## Übergaben

- Gib jedem Agent mit, was schon bekannt ist: Dateiliste des `explorer`, Plan des `architect` mit Schrittnummer, Befunde der Prüfer mit Datei und Zeile. Kein Agent sucht, was ein anderer schon gefunden hat.
- Eine Nachbesserung schickst du mit `SendMessage` an denselben Agent, statt einen neuen zu starten. Er behält seinen Kontext.
- Jeder Subagent antwortet im Format Ergebnis, geänderte Dateien, offene Punkte. Offene Punkte prüfst du, bevor der nächste Schritt startet. Punkte, die der Owner entscheidet (neue Tokens, Selektoren, Inputs, Outputs, Slots), sammelst du und nennst sie am Ende gesammelt.
- Läuft ein Agent im Hintergrund, arbeitest du an unabhängigen Schritten weiter und wartest nicht aktiv.

## Abschluss

Am Ende nennst du: was umgesetzt ist, das Ergebnis von `npm run check`, die Einstufung des `api-guardian` (OK, MINOR, BREAKING) und die offenen Punkte für den Owner.
