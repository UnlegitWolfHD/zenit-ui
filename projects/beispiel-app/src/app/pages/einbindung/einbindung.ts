import { Component } from '@angular/core';
import { ZPageHeader } from 'zenit-ui';
import { CodeBlock } from '../../shared/code-block/code-block';
import { DATEI, quelltext } from '../../shared/quelltexte';

/** Commands, not files: there is nothing they could drift away from. */
const NG_ADD = `# statt aller Schritte auf dieser Seite
ng add zenit-ui --themes`;

/** Example of an own scheme, shortened from docs/theming.md. */
const EIGENES_THEME = `[data-theme="sepia"] {
  color-scheme: light;
  --bg: #f7f1e6;
  --surface: #efe7d8;
  --text: #2a2419;
  /* ... jedes Token der Tabelle in docs/theming.md ... */

  /* nicht nur Farben: */
  --radius-md: 2px;
  --control-md: 44px;
}`;

/** The id has to be registered, otherwise the service rejects it. */
const EIGENES_THEME_PROVIDER = `provideZenitTheme({ schemes: ['dark', 'light', 'contrast', 'sepia'] });`;

/**
 * Page "Einbindung": the setup of this application, step by step, with the
 * files it really uses. Every block comes from `shared/quelltexte`, which reads
 * the generated copy of the sources, so the page cannot describe a setup that
 * is not in the repository.
 *
 * Sections instead of panels: this is text with code, not a tool, and a frame
 * belongs around tools only (CLAUDE.md, "Rahmen nur um Werkzeuge").
 */
@Component({
  selector: 'app-einbindung',
  imports: [CodeBlock, ZPageHeader],
  host: { class: 'app-page' },
  template: `
    <z-page-header
      title="Einbindung"
      sub="Die sieben Schritte dieser Anwendung, mit ihrem echten Quelltext"
    />

    <div class="z-stack">
      <section class="app-abschnitt">
        <h2 class="heading-2">1. Paket auflösen</h2>
        <p class="z-muted">
          Eine echte Anwendung installiert das gepackte Paket mit
          <span class="z-mono">npm i ./zenit-ui-0.1.0.tgz</span> und braucht hier nichts weiter.
          Dieses Beispiel liegt im Arbeitsbereich der Library und zeigt deshalb über
          <span class="z-mono">paths</span> auf den Ordner, den
          <span class="z-mono">ng build zenit-ui</span> schreibt. So beweist es, dass das
          ausgelieferte Paket funktioniert.
        </p>
        <app-code-block
          [code]="tsconfig"
          datei="projects/beispiel-app/tsconfig.app.json"
          sprache="JSON"
        />
      </section>

      <section class="app-abschnitt">
        <h2 class="heading-2">2. Stile registrieren</h2>
        <p class="z-muted">
          Die Reihenfolge ist bindend: Tokens, das Positions-CSS des CDK, die Themes, die Stile der
          Library, danach die eigenen. Ohne diese Reihenfolge gewinnt das falsche Blatt, weil
          <span class="z-mono">:root</span> und
          <span class="z-mono">[data-theme="light"]</span> gleich stark sind.
        </p>
        <app-code-block [code]="angular" datei="angular.json" sprache="JSON" />
      </section>

      <section class="app-abschnitt">
        <h2 class="heading-2">3. z-root setzen</h2>
        <p class="z-muted">
          Die Klasse gehört an <span class="z-mono">html</span> und an
          <span class="z-mono">body</span>. Sie setzt Grundfläche, Textfarbe, Schrift,
          <span class="z-mono">font: inherit</span> für Bedienelemente und den Fokus-Ring; Overlays
          hängen an <span class="z-mono">body</span> und erben dieselben Werte.
        </p>
        <app-code-block
          [code]="index"
          datei="projects/beispiel-app/src/index.html"
          sprache="HTML"
        />
      </section>

      <section class="app-abschnitt">
        <h2 class="heading-2">4. Schriften selbst hosten</h2>
        <p class="z-muted">
          Vier Schriften, kein Aufruf an Google. Die Ebene
          <span class="z-mono">schriften</span> ist Pflicht, sonst gewinnt die eigene
          <span class="z-mono">font-size</span> von material-icons und das Icon wird 24px groß in
          einer 20px-Box.
        </p>
        <app-code-block
          [code]="schriften"
          datei="projects/beispiel-app/src/styles.css"
          sprache="CSS"
        />
      </section>

      <section class="app-abschnitt">
        <h2 class="heading-2">5. Provider setzen</h2>
        <p class="z-muted">
          <span class="z-mono">provideZenitTheme</span> wendet die gespeicherte oder die
          voreingestellte Wahl schon vor dem ersten Bild an.
          <span class="z-mono">provideZenitLabels(Z_LABELS_EN)</span> stellt die eingebauten Texte
          der Library auf Englisch; ohne den Provider bleiben sie deutsch.
        </p>
        <app-code-block
          [code]="appConfig"
          datei="projects/beispiel-app/src/app/app.config.ts"
          sprache="TypeScript"
        />
      </section>

      <section class="app-abschnitt">
        <h2 class="heading-2">6. Toast-Auslass einhängen</h2>
        <p class="z-muted">
          Einmal pro Anwendung, am Ende des Layouts. Der Dienst
          <span class="z-mono">ZToast</span> schreibt hinein, die Seite selbst rendert nichts. Der
          ganze Rahmen steht auf der Seite Gameserver unter "Rahmen und Theme-Umschalter".
        </p>
        <app-code-block
          [code]="toastauslass"
          datei="projects/beispiel-app/src/app/layout/shell/shell.ts"
          sprache="Template"
        />
      </section>

      <section class="app-abschnitt">
        <h2 class="heading-2">7. Eigenes Theme</h2>
        <p class="z-muted">
          Ein Schema ist ein Block, der Tokens überschreibt: Namen und Rollen bleiben, Werte ändern
          sich. Nicht nur Farben, auch Radien, Schriften und Höhen sind Tokens. Die neue Kennung
          muss beim Provider angemeldet sein, sonst weist der Dienst sie ab.
        </p>
        <app-code-block [code]="eigenesTheme" datei="styles.css" sprache="CSS" />
        <app-code-block [code]="eigenesThemeProvider" datei="app.config.ts" sprache="TypeScript" />
      </section>

      <section class="app-abschnitt">
        <h2 class="heading-2">Kürzer: ng add</h2>
        <p class="z-muted">
          Das Schematic der Library erledigt die Schritte 2 bis 4 und 6 von allein, im eigenen
          Projekt und ohne Handarbeit. Was es genau ändert, steht in
          <span class="z-mono">docs/ng-add.md</span>.
        </p>
        <app-code-block [code]="ngAdd" datei="Terminal" sprache="Shell" />
      </section>
    </div>
  `,
})
export class Einbindung {
  protected readonly tsconfig = quelltext(DATEI.tsconfig);
  protected readonly angular = quelltext(DATEI.angular);
  protected readonly index = quelltext(DATEI.index);
  protected readonly schriften = quelltext(DATEI.styles, 'schriften');
  protected readonly appConfig = quelltext(DATEI.appConfig);
  protected readonly toastauslass = quelltext(DATEI.shell, 'toastauslass');
  protected readonly ngAdd = NG_ADD;
  protected readonly eigenesTheme = EIGENES_THEME;
  protected readonly eigenesThemeProvider = EIGENES_THEME_PROVIDER;
}
