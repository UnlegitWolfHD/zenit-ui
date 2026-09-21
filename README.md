# zenit-ui-workspace

Angular-Workspace für das Zenit Design System. Hier entsteht die Library `zenit-ui` mit allen Bausteinen der Website, des Kundenbereichs und der Server-Panels, dazu eine Demo-App, die jeden Baustein in allen Zuständen zeigt. Der Workspace ist unabhängig vom bestehenden Frontend von Zenit-Hosting und enthält keine Geschäftslogik, keine API-Aufrufe und keine echten Kundendaten.

## Ordner

| Ordner | Inhalt |
| --- | --- |
| `projects/zenit-ui` | die Library: Bausteine in `src/lib`, Tokens und Styles in `src/styles` |
| `projects/ui-demo` | Demo-App, eine Seite je Paket, jeder Baustein in allen Zuständen |
| `spec/` | das Design System als Vorgabe: Tokens, Komponenten-READMEs, Vorschauen, Leitfäden |
| `docs/pakete.md` | Schnitt der Arbeitspakete, Festlegungen und Abnahmepunkte |

`CLAUDE.md` in der Wurzel ist die Übersicht des Systems: Grundsätze, Sprache, Farbe, Typografie, Form, Bewegung und die Verbotsliste. Sie gilt für jede Änderung.

## Befehle

```bash
npm run build         # ng build zenit-ui und ng build ui-demo
ng build zenit-ui     # nur die Library, Ergebnis in dist/zenit-ui
ng test zenit-ui      # Unit-Tests der Library
npm run lint          # ESLint über Library und Demo
npm run lint:css      # Stylelint über projects/**/*.css
npm run e2e           # Playwright mit axe über die Demo-Seiten
ng serve ui-demo      # Demo-App unter http://localhost:4200/
```

## Paket zenit-ui

Wie du die Library in eine App einbaust, steht in `projects/zenit-ui/README.md`: Voraussetzungen, Installation aus dem lokal gebauten `.tgz`, Reihenfolge der Styles, `z-root`, Schriften, Toast-Ausgabe, Minecraft-Subtheme und die vollständige API-Tabelle. Diese README wird mit dem Paket ausgeliefert.

## Freigabe

Kein Push, kein Publish und kein Deploy ohne Freigabe. `npm pack` in `dist/zenit-ui` ist nur eine lokale Probe, die Library ist nicht auf npm veröffentlicht.
