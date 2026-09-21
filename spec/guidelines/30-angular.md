# Umsetzung in Angular

Das System wird ohne Angular Material umgesetzt. Erlaubt sind Angular selbst und `@angular/cdk`. Die heutige Seite nutzt Angular Material (im DOM: `mat-toolbar`, `mat-icon`, `--mat-sys-*` und `--mat-app-*` Variablen mit einer rötlich-braunen Standardpalette). Das wird vollständig ersetzt. Den Quellcode kenne ich nicht, Dateinamen sind Vorschläge.

## Wofür das CDK da ist

| Aufgabe | CDK-Paket | Eigener Anteil |
| --- | --- | --- |
| Dialog mit Fokusfalle, Escape, Fokus-Rückgabe | `@angular/cdk/dialog` | Layout `z-dialog`, Service mit `confirm()` |
| Menü mit Tastatur und Rollen | `@angular/cdk/menu` | Klassen `z-menu`, `z-menu__item` |
| Tooltip, frei positionierte Flächen | `@angular/cdk/overlay`, `/portal` | Direktive `zTooltip` |
| Tabellen mit Datenquelle und Sortierung | `@angular/cdk/table` (optional) | `table[zTable]` |
| Fokus und Tastatur in Listen | `@angular/cdk/a11y` | nach Bedarf |
| Umbrüche in TypeScript | `@angular/cdk/layout` | nur wo CSS nicht reicht |

Die App bindet `@angular/cdk/overlay-prebuilt.css` ein. Das ist reines Positionierungs-CSS ohne Farben.

## Was nativ bleibt

Formularfelder sind native Elemente mit Klassen aus `bundle.css`. Das spart Overlay-Logik und bringt Tastatur, Screenreader und Mobilverhalten mit.

| Baustein | Element |
| --- | --- |
| Input | `<input>` und `<textarea>` mit Direktive `zInput` |
| Select | natives `<select>` in der Hülle `z-select` |
| Checkbox, Toggle | `<input type="checkbox">`, Toggle mit `role="switch"` |
| Slider | `<input type="range">` |
| Faq | `<details>` und `<summary>` |
| Tabs | Links in `<nav>` mit `aria-current="page"` |

Checkbox, Toggle, Slider und Segment implementieren `ControlValueAccessor`, damit `ngModel` und Reactive Forms funktionieren.

## Icons

Material Icons als Webfont, gerendert über eine Komponente `z-icon` mit dem Namen als Ligatur und `aria-hidden="true"`. `mat-icon` und `MatIconModule` entfallen. Die Schrift am besten selbst hosten, damit kein Aufruf an Google nötig ist (DSGVO).

## Tokens und globale Styles

- `tokens.css` aus diesem System ist das erste Stylesheet der App. Sie ist die einzige Stelle mit Hex- und Pixel-Werten.
- Danach `@angular/cdk/overlay-prebuilt.css`, dann die Styles der Library, dann die App.
- `<html>` und `<body>` tragen die Klasse `z-root`. Sie setzt Hintergrund, Textfarbe, Schrift, `font: inherit` für Bedienelemente und den Fokus-Ring.
- Overlays hängen am `body` und erben deshalb dieselben Variablen.

## Material ablösen

| Heute | Ersatz |
| --- | --- |
| `mat-toolbar` | AppHeader |
| `mat-icon` | `z-icon` |
| `mat-button`, `mat-flat-button`, `mat-stroked-button`, `mat-icon-button` | Button mit `ghost`, `primary`, `secondary`, `iconOnly` |
| `mat-form-field` mit `matInput` | `z-field` mit `input[zInput]` |
| `mat-select` | `z-select` mit nativem `<select>` |
| `mat-checkbox`, `mat-slide-toggle` | Checkbox, Toggle |
| `mat-slider` | Slider |
| `mat-tab-group`, `mat-tab-nav-bar` | Tabs |
| `mat-button-toggle-group` | Segment |
| `mat-card` | Panel |
| `mat-chip` | Badge |
| `mat-table`, `mat-sort` | FileTable, bei Bedarf mit `cdk-table` |
| `mat-paginator` | Pagination |
| `MatDialog` | Service `ZDialog` auf `@angular/cdk/dialog` |
| `mat-menu` | `z-menu` auf `@angular/cdk/menu` |
| `MatSnackBar` | Service `ZToast` mit `z-toast-outlet` |
| `matTooltip` | `zTooltip` |
| `mat-progress-spinner`, `mat-progress-bar` | Spinner, Meter, Skeleton |
| `mat-expansion-panel` | Faq |
| `mat-stepper` | Stepper |
| `mat.theme`, `--mat-sys-*`, `--mat-app-*` | `tokens.css` |

Zum Schluss: `@angular/material` aus `package.json`, alle `Mat*`-Imports, das Theme in `styles.scss` und `provideAnimations` entfernen, falls es nur für Material da war.

## Leitplanken

Stylelint hält die Regeln automatisch ein. Ohne diese Schicht driftet generierter Code wieder ab.

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

Dazu ein ESLint-Eintrag `no-restricted-imports` für das Muster `@angular/material*`, damit Material nicht wieder hereinkommt.
