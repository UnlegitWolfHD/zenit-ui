# Als eigene Library

Das System wird zuerst als Angular-Library im selben Workspace gebaut und geprüft. Die App bindet es danach Route für Route ein. Die Namen unten sind Vorschläge.

```bash
ng generate library zenit-ui --prefix z
ng generate application ui-demo
```

```
projects/zenit-ui/
  ng-package.json            assets: ["./src/styles/**/*"]
  package.json               peerDependencies: @angular/core, @angular/common, @angular/forms, @angular/cdk, rxjs
  src/styles/tokens.css      aus diesem System, einzige Stelle mit Hex- und Pixel-Werten
  src/styles/zenit-ui.css    die bundle.css dieses Systems, bei Bedarf je Baustein aufgeteilt
  src/lib/<baustein>/        je Baustein Komponente oder Direktive, Spec, index.ts
  src/public-api.ts
projects/ui-demo/
  src/app/pages/<baustein>/  jede Komponente in allen Zuständen aus der Tabelle "Zustände"
```

## Regeln für die Lib

- Die Lib kennt keine Services, Routen oder Modelle der App. Eingaben sind einfache Werte (`status: 'online' | 'stopped' | …`), keine Domänenobjekte.
- Texte kommen immer von außen. Die Lib enthält keine deutschen Strings außer `aria-label`-Standards, und die sind überschreibbar.
- Standalone Components, `ChangeDetectionStrategy.OnPush`, Inputs als Signals.
- Kein `::ng-deep`, kein `!important`, `ViewEncapsulation.Emulated` (Standard).
- Kein Angular Material. Formularfelder sind native Elemente, Overlays kommen aus dem CDK (siehe "Umsetzung in Angular").
- Komponenten haben keine eigenen Styles. Alle Klassen stehen in `zenit-ui.css` und nutzen nur Tokens.
- Globale Styles liefert eine Lib nicht automatisch aus. Die App trägt `tokens.css`, `@angular/cdk/overlay-prebuilt.css` und `zenit-ui.css` in dieser Reihenfolge in `angular.json` unter `styles` ein.
- Während der Entwicklung zeigt der `paths`-Alias `zenit-ui` in `tsconfig.json` auf `projects/zenit-ui/src/public-api.ts`.

## API der Bausteine

Selektoren und Eingaben sind verbindlich, damit Seiten und Bausteine parallel entstehen können. Inputs sind Signals. Zwei-Wege-Bindung über `model()`.

| Baustein | Selektor | Eingaben, Ausgaben, Slots |
| --- | --- | --- |
| Icon | `z-icon` | `name`, `size: 'sm' \| 'md'` |
| Spinner | `z-spinner` | `label` |
| Button | `button[zBtn]`, `a[zBtn]` | `zBtn: 'primary' \| 'secondary' \| 'ghost' \| 'danger'` (Standard secondary), `size: 'sm' \| 'md' \| 'lg'`, `block`, `iconOnly`, `loading`, `disabled` |
| Badge | `z-badge` | `status: 'neutral' \| 'success' \| 'warning' \| 'danger' \| 'info'`, `dot` |
| Field | `z-field` | `label`, `for`, `hint`, `error` |
| Input | `input[zInput]`, `textarea[zInput]` | `size`, `mono`, `invalid`; Suche über `z-input-group` mit `icon` |
| Select | `z-select` | `size`; Inhalt ist ein natives `<select>` |
| Checkbox | `z-checkbox` | `[(checked)]`, `disabled`, `ariaLabel`; Forms |
| Toggle | `z-toggle` | `[(checked)]`, `disabled`, `ariaLabel`, `ariaLabelledby`; Forms |
| Setting | `z-setting` | `title`, `key`, `description`, `titleId`; Inhalt ist das Bedienelement |
| Slider | `z-slider` | `label`, `min`, `max`, `step`, `unit`, `ticks`, `hint`, `[(value)]`, `disabled`; Forms |
| Tabs | `nav[zTabs]`, `a[zTab]` | `active` |
| Segment | `z-segment` | `options: {value, label}[]`, `[(value)]`, `ariaLabel`; Forms |
| Stepper | `z-stepper` | `steps: string[]`, `current` |
| Panel | `z-panel` | `title`, `flush`, `busy`; Slot `[zPanelActions]`, `z-pagination` wird ans Ende gesetzt |
| Metric | `z-metrics`, `z-metric` | `label`, `value`, `unit`, `sub`, `percent` (ab 80 Warnung, ab 95 Fehler) |
| ServerList | `z-rows`, `z-rows-head`, `a[zRow]`, `div[zRow]`, `z-row-main`, `[zRowNum]` | `columns` (Grid-Spalten) an `z-rows`; `title`, `meta`, `image` an `z-row-main` |
| FileTable | `z-table-container`, `table[zTable]`, `[zNum]`, `[zTableName]` | keine |
| Pagination | `z-pagination` | `[(page)]`, `pageSize` (25), `total`, `itemLabel` |
| Alert | `z-alert` | `status`, `title`, `icon`; Inhalt ist der Text; Slot `[zAlertAction]` |
| EmptyState | `z-empty-state` | `title`; Inhalt ist der Text; Slot `[zEmptyAction]` |
| Skeleton | `z-skeleton` | `width`, `thumb` |
| Sidebar | `z-sidebar`, `z-sidebar-group`, `[zSidebarItem]` | `ariaLabel`; `label`; `icon`, `active`, `count` |
| AppHeader | `z-app-header`, `a[zHeaderLink]`, `[zBrand]` | `navLabel`; `active`; Slot `[zHeaderEnd]` |
| PageHeader | `z-page-header` | `title`, `sub`; Inhalt sind die Aktionen |
| Footer | `z-footer`, `z-footer-col` | `heading`; Slot `[zFooterBase]` |
| Dialog | Service `ZDialog`, Layout `z-dialog` | `open(component, config)`, `confirm({title, body, confirmLabel, cancelLabel, danger, requireText})` liefert `Observable<boolean>`; Slot `[zDialogActions]` |
| Menu | `z-menu`, `button[zMenuItem]`, `z-menu-separator` | `icon`, `danger`, `disabled`, `(triggered)`; Auslöser `[cdkMenuTriggerFor]` |
| Toast | Service `ZToast`, `z-toast-outlet` | `show`, `success`, `error`, `dismiss`; Optionen `status`, `icon`, `actionLabel`, `action`, `duration` |
| Tooltip | `[zTooltip]` | Text als Wert |
| Console | `z-console` | `lines: {time, text, level}[]`, `disabled`, `placeholder`; `(command)` |
| Hero | `z-hero` | `title`, `lead`, `note`; Slots `[zHeroActions]`, `[zHeroAside]` |
| GameTile | `z-game-grid`, `button[zGameTile]` | `title`, `price`, `cover`, `selected` |
| PriceSummary | `z-price-summary` | `label`, `price`, `period`, `lines: {label, value}[]`, `note`; Inhalt ist der Button |
| SpecList | `z-spec-list` | `items: {term, value, note, mono}[]` |
| Faq | `z-faq` | `question`, `open`; Inhalt ist die Antwort |

## Reihenfolge der Bausteine

| Schritt | Bausteine | Warum zuerst |
| --- | --- | --- |
| 1 | Tokens, `z-root`, `font: inherit`, Stylelint, Icon, Spinner | Alles andere hängt daran |
| 2 | Button, Badge, Input, Select, Checkbox, Toggle | Kommen auf jeder Seite vor |
| 3 | Panel, PageHeader, AppHeader, Footer, Alert, EmptyState, Skeleton | Seitenrahmen des Kundenbereichs |
| 4 | ServerList, Metric, Tabs, Pagination, FileTable | Datenansichten |
| 5 | Dialog, Menu, Toast | Overlays, brauchen CDK |
| 6 | Sidebar, Console, Slider, Stepper | Panel und Bestellassistent |
| 7 | Hero, GameTile, PriceSummary, SpecList, Faq | Öffentliche Seiten |

## Prüfung

- `ng build zenit-ui` und `ng test zenit-ui` laufen im CI.
- Stylelint steht für `projects/zenit-ui` von Anfang an auf Fehler.
- Playwright nimmt von jeder Seite der Demo-App Screenshots in 1440px und 375px auf und vergleicht sie mit dem letzten Stand. Dafür braucht es weder Login noch Live-Daten.
- `@axe-core/playwright` prüft jede Demo-Seite auf Kontrast, Labels und Rollen.

## Einbau in die App

1. Tokens und Styles global einbinden, `z-root` an `<html>` und `<body>`.
2. Shell umstellen: AppHeader, Seitenrahmen, Footer.
3. Route für Route nach Seitenmuster. Alte und neue Komponenten dürfen so lange nebeneinander stehen.
4. Stylelint für `src/` von Warnung auf Fehler stellen, sobald die letzte Route umgestellt ist.
5. `@angular/material` samt Theme und Imports entfernen.
