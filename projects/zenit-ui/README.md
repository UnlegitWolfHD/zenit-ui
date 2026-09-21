# zenit-ui

`zenit-ui` ist die Angular-Library des Zenit Design Systems. Sie liefert 30 Bausteine für die öffentliche Website, den Kundenbereich und die Server-Panels von Zenit-Hosting, dazu Icon, Spinner und Tooltip. Die Bausteine sind Standalone Components und Direktiven mit `OnPush` und Signal-Inputs. Sie bringen keine eigenen Styles mit: alle Klassen stehen in den mitgelieferten CSS-Dateien und nutzen ausschließlich die Tokens aus `tokens.css`. Angular Material wird nicht verwendet, Overlays und Fokusfallen kommen aus `@angular/cdk`, Formularfelder sind native Elemente. Geschäftslogik, Services und Texte bleiben in deiner App.

## Voraussetzungen

- Angular 22 (`@angular/core`, `@angular/common`, `@angular/forms`)
- `@angular/cdk` 22 für Dialog, Menü, Tooltip und Overlays
- `rxjs` 7.8

Alle fünf stehen als peerDependencies und werden von der Library nicht mitgeliefert. Die einzige eigene Abhängigkeit ist `tslib`.

## Installation

Die Library ist nicht auf npm veröffentlicht. Du baust sie und installierst das Paket lokal:

```bash
ng build zenit-ui
cd dist/zenit-ui
npm pack
```

Das erzeugt `zenit-ui-0.1.0.tgz`. In deiner App:

```bash
npm i ./zenit-ui-0.1.0.tgz
```

## Einbindung

### 1. Styles in `angular.json` eintragen

Die Reihenfolge ist verbindlich: erst die Tokens, dann das Positionierungs-CSS des CDK, dann die Styles der Library, dann deine App.

```json
"styles": [
  "zenit-ui/styles/tokens.css",
  "@angular/cdk/overlay-prebuilt.css",
  "zenit-ui/styles/zenit-ui.css",
  "src/styles.css"
]
```

Beide Dateien lassen sich genauso per `@import` holen, falls du eine eigene Einstiegsdatei nutzt:

```css
@import "zenit-ui/styles/tokens.css";
@import "@angular/cdk/overlay-prebuilt.css";
@import "zenit-ui/styles/zenit-ui.css";
```

`zenit-ui.css` importiert die Teil-Dateien `styles/_*.css`. Die liegen im Paket daneben und brauchen keinen eigenen Eintrag.

### 2. `z-root` setzen

Die Klasse `z-root` gehört an `<html>` und an `<body>`. Sie setzt Hintergrund, Textfarbe, Schrift, `font: inherit` für Bedienelemente und den Fokus-Ring. Overlays hängen am `body` und erben dieselben Variablen.

```html
<!doctype html>
<html lang="de" class="z-root">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body class="z-root">
    <app-root></app-root>
  </body>
</html>
```

### 3. Schriften selbst hosten

Die Library lädt keine Schrift. Deine App bringt vier mit, alle selbst gehostet, damit kein Aufruf an Google nötig ist:

- Material Icons (die Ligaturen-Schrift für `z-icon`)
- Inter in 400, 500 und 600 (`body`)
- Space Grotesk in 600 und 700 (`display`)
- JetBrains Mono in 400 und 600 (`mono`)

```css
@import "material-icons/iconfont/filled.css" layer(schriften);
@import "@fontsource/inter/400.css";
@import "@fontsource/inter/500.css";
@import "@fontsource/inter/600.css";
@import "@fontsource/space-grotesk/600.css";
@import "@fontsource/space-grotesk/700.css";
@import "@fontsource/jetbrains-mono/400.css";
@import "@fontsource/jetbrains-mono/600.css";
```

Das `layer(schriften)` ist nötig: `material-icons` setzt in `.material-icons` eine eigene `font-size` und wird nach `zenit-ui.css` geladen. Die Ebene sorgt dafür, dass `.z-icon` aus der Library gewinnt. Ohne sie wäre das Icon 24px groß in einer 20px-Box. Ein vollständiges Beispiel steht in `projects/ui-demo/src/styles.css`.

### 4. Toast-Ausgabe einhängen

`<z-toast-outlet />` steht einmal in der Shell deiner App, am besten am Ende des Layouts. Der Service `ZToast` schreibt dorthin.

```html
<app-header />
<router-outlet />
<app-footer />
<z-toast-outlet />
```

### 5. Minecraft-Subtheme

Auf `/minecraft` und im Minecraft-Panel setzt du `z-theme-mc` an den Seitencontainer. Dann wird der primäre Button `mc-accent` mit `on-mc`, und aktive Icons werden grün. Alles andere bleibt gleich: Flächen, Radien, Schrift, Abstände, Statusfarben.

```html
<div class="z-theme-mc">
  <button zBtn="primary">Server erstellen</button>
</div>
```

## Beispiel

```ts
import { Component } from '@angular/core';
import { ZButton, ZField, ZInput, ZPanel, ZPanelActions } from 'zenit-ui';

@Component({
  selector: 'app-server-name',
  imports: [ZPanel, ZPanelActions, ZField, ZInput, ZButton],
  template: `
    <z-panel title="Servername">
      <button zBtn="ghost" size="sm" zPanelActions>Zurücksetzen</button>
      <z-field label="Name" for="name" hint="Erscheint in der Serverliste.">
        <input zInput id="name" name="name" value="Beispiel-Server" />
      </z-field>
      <button zBtn="primary">Speichern</button>
    </z-panel>
  `,
})
export class ServerName {}
```

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

## Regeln

Farbe, Abstand, Radius, Schrift und Schatten kommen nur aus `tokens.css`. `tokens.css` ist die einzige Stelle mit Hex- und Pixel-Werten. Eigene Styles greifen auf `var(--…)` zu und setzen keine eigenen Werte.

Nicht erlaubt sind `@angular/material`, `linear-gradient`, `radial-gradient`, `backdrop-filter`, `text-shadow`, farbige `box-shadow`, Raster-Hintergründe, Pill-Badges über Überschriften, Versal-Labels, Icon-Flächen, Karten mit farbigem Rand, Kennzahlen-Kacheln für Marketing-Zahlen sowie Hex- oder Pixel-Werte außerhalb der Tokens. Die vollständige Liste steht im Abschnitt "Verboten" der Übersicht (`CLAUDE.md`).

Stylelint hält die Regeln automatisch ein. Ohne diese Schicht driftet generierter Code wieder ab. Übernimm die Konfiguration in deine App:

```json
{
  "rules": {
    "color-no-hex": true,
    "color-named": "never",
    "function-disallowed-list": ["linear-gradient", "radial-gradient", "conic-gradient", "rgb", "rgba", "hsl", "hsla"],
    "property-disallowed-list": ["backdrop-filter", "text-shadow", "filter"],
    "declaration-property-value-disallowed-list": {
      "box-shadow": ["/^(?!var\\(--shadow-overlay\\)|none|inset 0 -2px 0 var\\().*/"],
      "transition": ["/transform|all/"],
      "font-family": ["/^(?!var\\(--font-(display|body|mono)\\)|inherit).*/"]
    },
    "selector-pseudo-element-disallowed-list": ["ng-deep"],
    "declaration-no-important": true
  },
  "overrides": [{ "files": ["**/tokens.css"], "rules": { "color-no-hex": null, "function-disallowed-list": null, "declaration-property-value-disallowed-list": null } }]
}
```

Dazu ein ESLint-Eintrag `no-restricted-imports` für das Muster `@angular/material*`, damit Material nicht wieder hereinkommt:

```js
'no-restricted-imports': [
  'error',
  {
    patterns: [
      {
        group: ['@angular/material', '@angular/material/*', '@angular/material*'],
        message: 'Angular Material wird in zenit-ui nicht verwendet. Nur @angular/cdk.',
      },
    ],
  },
],
```

## Entwicklung

Im Workspace `zenit-ui-workspace`:

```bash
ng build zenit-ui     # Library bauen, Ergebnis in dist/zenit-ui
ng test zenit-ui      # Unit-Tests der Library
npm run lint          # ESLint über Library und Demo
npm run lint:css      # Stylelint über projects/**/*.css
npm run e2e           # Playwright mit axe über die Demo-Seiten
ng serve ui-demo      # Demo-App mit jedem Baustein in allen Zuständen
```

Die Demo-App `ui-demo` zeigt jeden Baustein in den Zuständen Ruhe, Hover, Fokus, aktiv, deaktiviert, lädt, Fehler, leer und Erfolg. Sie ist die Referenz für Markup und Klassen.
