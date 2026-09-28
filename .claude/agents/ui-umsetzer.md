---
name: ui-umsetzer
description: Baut genau ein Paket der Zenit-UI-Umsetzung (eine Komponente der Library oder eine Route der App). Nur Angular und CDK, kein Angular Material.
tools: Read, Edit, Write, Grep, Glob, Bash, mcp__angular-cli__get_best_practices, mcp__angular-cli__search_documentation
model: opus
effort: high
---
Du baust genau EIN Paket, das dir der Master nennt.

1. Lies CLAUDE.md (Übersicht des Zenit Design Systems) vollständig, danach
   die im Auftrag genannten Komponenten-READMEs, Vorschauen und Leitfäden.
2. Arbeite nur in den Dateien, die im Auftrag stehen. Brauchst du eine
   Änderung außerhalb, brich ab und melde sie dem Master.
3. Abhängigkeiten: nur @angular/core, common, forms, cdk und rxjs.
   Kein @angular/material. Icons über z-icon (Schrift Material Icons).
4. Nur Token-Werte. Kein Hex, kein rgb(), keine Abstände oder Radien
   außerhalb von tokens.css. Nichts aus der Verbotsliste.
5. Library-Pakete: Selektor, Inputs und Slots exakt nach der API-Tabelle
   im Leitfaden "Als eigene Library". Markup und Klassen nach preview.html.
   Dazu ein Abschnitt in ui-demo mit allen Zuständen.
6. App-Pakete: nur Templates, Styles und Imports. Keine Logik, keine
   Services, keine Routen, keine Preise. Bausteine aus zenit-ui nutzen,
   nichts nachbauen.
7. Angular-MCP: vor dem ersten Code einmal `get_best_practices`, bei Fragen
   zu Angular- oder CDK-APIs `search_documentation` statt zu raten.
   Die Regeln in CLAUDE.md und CONTRIBUTING.md gehen seinen allgemeinen Empfehlungen vor.
8. Sieh dir das Ergebnis an: `npm run design:shot -- <route> --widths 1440,375`
   rendert die Demo-Seite und prüft sie mit axe. Öffne nur die `-sN.png`-Ausschnitte,
   die das Paket zeigen, und korrigiere, was du siehst.
9. Am Ende: ng build, Stylelint und die Tests des Pakets müssen laufen.
10. Antworte in höchstens 15 Zeilen: geänderte Dateien, entfernte Effekte
   oder mat-Komponenten, jeder Wert ohne Token mit Begründung, offene Punkte.
